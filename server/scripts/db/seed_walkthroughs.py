"""
Usage:
  uv run scripts/db/seed_walkthroughs.py           # seed
  uv run scripts/db/seed_walkthroughs.py --check   # only load and check the files; no DB, no Redis

Both refuse a file whose text sits deeper than search can index (see check_depth), and both
exit 1 when there are no walkthrough files at all. --check also refuses a walkthrough still
marked [VERIFY] or still holding a local image path; prod_seed.py runs it before any seeder
writes.

Seeding runs in one transaction, so a run that stops before its COMMIT leaves the database
exactly as it was. Exits 1 on any failure, so prod_seed.py stops before its purge.
"""

import sys
from pathlib import Path
import json
import glob
import asyncio
import contextlib

from sqlalchemy import select, delete, text

# Add project root
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from redis.exceptions import RedisError

from app.core import cache
from app.core.cache import invalidate_cache_pattern
from app.models.walkthroughs import Walkthrough
from scripts.images.paths import local_image_paths, normalize_image_path, normalize_content_images
from scripts.cache import purge_manifest
from scripts.db.seed_guard import (
    NO_ANSWER, NO_ANSWER_SECONDS, Watchdog, failure_line, seed_engine, seed_sessionmaker,
    watch_engine,
)
from app.services.search_text import MAX_DEPTH, too_deep

# The Redis patterns this seeder clears (tests/test_cache_isolation.py reads them). Search
# results carry walkthrough titles, sections and links too.
CACHE_PATTERNS = ["walkthrough*", "search:*"]


def load_all_walkthrough_files():
    """Load all walkthrough JSON files from seed-data/walkthroughs/"""
    seed_dir = project_root / 'seed-data' / 'walkthroughs'
    if not seed_dir.exists():
        print("\033[31m✗ seed-data/walkthroughs directory not found!\033[0m")
        return []

    all_data = []
    json_files = sorted(glob.glob(str(seed_dir / '**' / '*.json'), recursive=True))

    print(f"\033[96m━━━ STEP 1: Loading Data ━━━\033[0m")
    print(f"Found {len(json_files)} walkthrough files\n")

    for json_file in json_files:
        rel_path = Path(json_file).relative_to(seed_dir)
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            title = data['title']
        except (ValueError, KeyError, TypeError) as e:
            raise SystemExit(f"\033[31m✗ {rel_path}: not a walkthrough file ({type(e).__name__}: {e})\033[0m")
        all_data.append(data)
        print(f"   {rel_path}: {title}")

    return all_data


def check_depth(walkthrough_data):
    """True when search can index every string in every walkthrough's content.

    The stored search_vector reads at most MAX_DEPTH containers below a section key
    (app/services/search_text.py); deeper text would go unindexed without a sound.
    Run before anything is written, so a refusal leaves the database untouched.
    """
    ok = True
    for item in walkthrough_data:
        paths = too_deep(item.get('content'))
        if paths:
            ok = False
            print(f"\033[31m✗ {item.get('title', '?')}: text deeper than search indexes "
                  f"({MAX_DEPTH} levels below a section key):\033[0m")
            for path in paths[:10]:
                print(f"    {path}")
            if len(paths) > 10:
                print(f"    ... {len(paths) - 10} more")
    if not ok:
        print("\033[31m  Fix: flatten the field, or raise MAX_DEPTH in app/services/search_text.py, "
              "which needs a migration (the stored expression changes). Nothing was written.\033[0m")
    return ok


def check_markers(walkthrough_data):
    """True when no walkthrough still carries a [VERIFY] marker.

    Drafts mark every unconfirmed fact with [VERIFY] so it shows on the dev page.
    Only --check runs this (prod_seed.py's first step), so marked drafts still seed
    on dev while prod refuses them before anything is written.
    """
    marked = [item.get('title', '?') for item in walkthrough_data
              if '[VERIFY' in json.dumps(item, ensure_ascii=False)]
    for title in marked:
        print(f"\033[31m✗ {title}: still marked [VERIFY]; confirm or remove it before seeding prod\033[0m")
    return not marked


def check_local_paths(walkthrough_data):
    """True when no walkthrough still holds a local image path (scripts/images/paths.py).

    Dev serves /assets/images/... from the masters folder, which the production image leaves
    out, so a path the URL swap never turned into an R2 URL would break on prod. Only --check
    runs this: dev seeds keep accepting them, since new images are previewed before the swap.
    """
    ok = True
    for item in walkthrough_data:
        paths = local_image_paths(item)
        if paths:
            ok = False
            print(f"\033[31m✗ {item.get('title', '?')}: {len(paths)} image path(s) still point at the "
                  f"local masters folder, such as {paths[0]}. Run the image pipeline "
                  f"(dev_workflow.py walkthroughs), commit, then seed prod.\033[0m")
    return ok


def temporary_slug(walkthrough_id):
    return f"__reseed_{walkthrough_id}__"


def slugs_to_move(current, wanted):
    """Ids of existing walkthroughs whose slug changes.

    Slugs are unique and checked at once, so within one transaction a slug can only move to
    another row after its current holder has let go of it. Giving every row whose slug changes
    a temporary slug first, in one flush, frees them all, whatever the order of the moves.

    current: {id: slug now}, existing rows only; wanted: {id: slug in the seed files}.
    """
    return sorted(wid for wid, slug in wanted.items() if wid in current and current[wid] != slug)


async def reset_walkthroughs_sequence(db):
    """Reset walkthroughs sequence to match max ID.

    setval-to-MAX is safe here ONLY because a fresh full-table seed has just
    made MAX(id) authoritative. As a general repair this must never move the
    counter DOWNWARD: a sequence ahead of MAX(id) (deletion history) is
    healthy, and lowering it mints colliding ids. If this sync is ever reused
    outside a fresh seed, use GREATEST(MAX(id), last_value) instead.

    It runs after the COMMIT: setval isn't transactional, so inside the
    transaction a rollback would leave it changed.
    """
    print(f"\n\033[96m━━━ STEP 4: Resetting Walkthroughs Sequence ━━━\033[0m")

    result = await db.execute(text("SELECT MAX(id) FROM walkthroughs"))
    max_id = result.scalar() or 0

    if max_id > 0:
        await db.execute(
            text(f"SELECT setval(pg_get_serial_sequence('walkthroughs', 'id'), {max_id}, true)")
        )
        print(f"  ✓ Walkthroughs sequence reset to {max_id}")
    else:
        await db.execute(
            text("SELECT setval(pg_get_serial_sequence('walkthroughs', 'id'), 1, false)")
        )
        print(f"  ✓ Walkthroughs sequence reset to 1 (table is empty)")


async def seed_walkthroughs():
    """Seed, then clear Redis. Returns the exit status: 0 only when every step succeeded."""
    print("\n\033[96mSeeding walkthroughs...\033[0m\n")

    walkthrough_data = load_all_walkthrough_files()
    if not walkthrough_data:
        print("\033[31m✗ No walkthrough data found! Nothing was written.\033[0m")
        return 1
    if not check_depth(walkthrough_data):
        return 1

    added = 0
    updated = 0      # existing rows that actually differ, not rows merely present
    unchanged = 0
    deleted = 0
    errors = 0

    run_id = purge_manifest.current_run_id()
    changed_pairs = set()    # walkthroughs that exist after this seed
    removed_pairs = set()    # deleted, or the old half of a rename — gone from the DB

    phase = {"now": "writing"}
    watchdog = Watchdog(NO_ANSWER_SECONDS, 1, lambda: f"\033[31m{NO_ANSWER[phase['now']]}\033[0m")
    engine = seed_engine("seed_walkthroughs")
    watch_engine(engine, watchdog)
    watchdog.start()

    async with seed_sessionmaker(engine)() as db:
        try:
            # Get all existing walkthroughs
            result = await db.execute(select(Walkthrough))
            existing_walkthroughs = {w.id: w for w in result.scalars().all()}
            print(f"Found {len(existing_walkthroughs)} existing walkthroughs in database\n")

            # Both halves of a walkthrough's URL are mutable, so a rename or a
            # re-categorisation stales the OLD path as well as the new one. Taken
            # before anything below changes a row.
            old_pairs = {wid: (w.mission_type, w.slug) for wid, w in existing_walkthroughs.items()}
            old_titles = {wid: w.title for wid, w in existing_walkthroughs.items()}

            # Walkthroughs not in the seed data go first, so a new or renumbered
            # walkthrough can take the slug one of them held.
            seed_ids = {item.get("id") for item in walkthrough_data}
            orphaned_ids = set(existing_walkthroughs) - seed_ids
            if orphaned_ids:
                # These go in the removed set: they will not be in the surface the
                # purge derives from the DB afterwards, and it needs to know that.
                for orphan_id in orphaned_ids:
                    removed_pairs.add(old_pairs[orphan_id])
                result = await db.execute(
                    delete(Walkthrough).where(Walkthrough.id.in_(orphaned_ids))
                )
                deleted = result.rowcount

            # Every existing row whose slug changes lets go of it first (see slugs_to_move).
            moving = slugs_to_move(
                {wid: slug for wid, (_type, slug) in old_pairs.items() if wid not in orphaned_ids},
                {item.get("id"): item.get("slug") for item in walkthrough_data},
            )
            for wid in moving:
                existing_walkthroughs[wid].slug = temporary_slug(wid)
            if moving:
                await db.flush()

            print(f"\n\033[96m━━━ STEP 2: Seeding {len(walkthrough_data)} Walkthroughs ━━━\033[0m\n")

            for item in walkthrough_data:
                # Problems with a file's fields are counted and listed, and the whole seed is
                # rolled back after the loop. A database error isn't caught here: it ends the run.
                try:
                    walkthrough_id = item.get("id")

                    # Check if walkthrough exists
                    existing = existing_walkthroughs.get(walkthrough_id)

                    if existing:
                        old_pair = old_pairs[walkthrough_id]
                        # Update existing
                        existing.slug = item["slug"]
                        existing.title = item["title"]
                        existing.subtitle = item.get("subtitle")
                        existing.level = item.get("level")
                        existing.mission_type = item["mission_type"]
                        existing.thumbnail_url = normalize_image_path(item.get("thumbnail_url"))
                        existing.objectives = item.get("objectives")
                        existing.content = normalize_content_images(item["content"])
                        existing.display_order = item["display_order"]
                        existing.rewards = item.get("rewards")
                        existing.available_after = item.get("available_after")
                        # Read before the flush below resets attribute history. A row
                        # given a temporary slug above counts as changed, as it is.
                        if db.is_modified(existing, include_collections=True):
                            updated += 1
                            new_pair = (existing.mission_type, existing.slug)
                            changed_pairs.add(new_pair)
                            if old_pair != new_pair:
                                # A rename or re-categorisation: the old URL now
                                # 404s at the origin but is still a warm 200 at the
                                # edge. It no longer exists in the DB, so it is a
                                # removal for the purge's purposes, not a change.
                                removed_pairs.add(old_pair)
                            print(f"\033[33m↻ Updated: {item['title']}\033[0m")
                        else:
                            unchanged += 1
                    else:
                        # Add new
                        new_walkthrough = Walkthrough(
                            id=walkthrough_id,
                            slug=item["slug"],
                            title=item["title"],
                            subtitle=item.get("subtitle"),
                            level=item.get("level"),
                            mission_type=item["mission_type"],
                            thumbnail_url=normalize_image_path(item.get("thumbnail_url")),
                            objectives=item.get("objectives"),
                            content=normalize_content_images(item["content"]),
                            display_order=item["display_order"],
                            rewards=item.get("rewards"),
                            available_after=item.get("available_after")
                        )
                        db.add(new_walkthrough)
                        added += 1
                        changed_pairs.add((item["mission_type"], item["slug"]))
                        print(f"\033[32m✓ Added: {item['title']}\033[0m")

                    # One walkthrough at a time, in file order, as the per-row commits did.
                    await db.flush()

                except (KeyError, TypeError, ValueError, AttributeError) as e:
                    print(f"\033[31m✗ Error with '{item.get('title', 'Unknown')}': "
                          f"{type(e).__name__}: {e}\033[0m")
                    errors += 1

            if errors:
                await db.rollback()
                print(f"\n\033[31m✗ {errors} problem(s) with the walkthrough files (listed above). "
                      f"Nothing was written.\033[0m")
                return 1

            # STEP 3: Walkthroughs not in seed data (deleted above, before the upserts)
            print(f"\n\033[96m━━━ STEP 3: Cleaning Up Orphaned Walkthroughs ━━━\033[0m")
            if orphaned_ids:
                print(f"  Found {len(orphaned_ids)} walkthroughs not in seed data")
                print(f"  \033[33m✓ Deleted {deleted} orphaned walkthroughs\033[0m")
                for orphan_id in sorted(orphaned_ids):
                    print(f"    - ID {orphan_id}: {old_titles[orphan_id]}")
            else:
                print(f"  ✓ No orphaned walkthroughs found")

            # Redis has to answer before anything is committed: a commit it couldn't follow
            # with a clear would leave prod serving the old pages.
            try:
                await cache.redis_client.ping()
            except RedisError as e:
                await db.rollback()
                print(f"\033[31m✗ Redis didn't answer ({type(e).__name__}: {e}), so nothing "
                      f"was committed.\033[0m")
                return 1

            # Recorded before the COMMIT: if the commit lands and its answer is lost, the next
            # run still purges these.
            try:
                purge_manifest.record(
                    purge_manifest.SECTION_WALKTHROUGHS, run_id,
                    pairs=changed_pairs, pairs_removed=removed_pairs)
            except OSError as e:
                await db.rollback()
                print(f"\033[31m✗ Couldn't write the purge manifest ({type(e).__name__}: {e}). "
                      f"Nothing was written.\033[0m")
                return 1
            phase["now"] = "committing"
            await db.commit()
            phase["now"] = "committed"
            print("  ✓ Committed")

            # STEP 4: Reset walkthroughs sequence to match max ID
            await reset_walkthroughs_sequence(db)
            await db.commit()

        except Exception as e:
            if phase["now"] == "writing":
                with contextlib.suppress(Exception):
                    await db.rollback()
            print(f"\033[31m{failure_line(phase['now'], e)}\033[0m")
            return 1

    await engine.dispose()
    watchdog.stop()

    # STEP 5: Clear cache
    print(f"\n\033[96m━━━ STEP 5: Clearing Cache ━━━\033[0m")
    counts = {}
    for pattern in CACHE_PATTERNS:
        try:
            counts[pattern] = await invalidate_cache_pattern(pattern)
        except RedisError as e:
            print(f"\033[31m✗ Committed, but clearing Redis failed on {pattern} "
                  f"({type(e).__name__}: {e}). The edge and Redis serve the old pages until a "
                  f"purge succeeds: run it again, or prod_seed.py --purge-only.\033[0m")
            return 1
    print(f"\033[32m✓ Redis cache cleared: walkthrough* {counts['walkthrough*']} key(s), "
          f"search:* {counts['search:*']} key(s)\033[0m")

    # Final summary
    print(f"\n\033[96m{'━' * 60}\033[0m")
    print(f"\033[92m✓ SEEDING COMPLETE\033[0m")
    print(f"\033[92m  Added: {added}\033[0m")
    print(f"\033[92m  Updated: {updated}\033[0m")
    print(f"\033[90m  Unchanged: {unchanged}\033[0m")
    if deleted > 0:
        print(f"\033[33m  Deleted: {deleted}\033[0m")
    else:
        print(f"\033[92m  Deleted: {deleted}\033[0m")
    print(f"\033[92m  Purge manifest: {len(changed_pairs)} walkthrough URL(s) changed, "
          f"{len(removed_pairs)} removed\033[0m")
    print(f"\033[92m  Errors: {errors}\033[0m")
    print(f"\033[96m{'━' * 60}\033[0m")
    return 0


def check_main():
    """--check: load and check the files only. 0 when every check passes, else 1."""
    data = load_all_walkthrough_files()
    if not data:
        print("\033[31m✗ No walkthrough files found.\033[0m")
        return 1
    ok = check_depth(data)
    ok = check_markers(data) and ok
    ok = check_local_paths(data) and ok
    return 0 if ok else 1


if __name__ == "__main__":
    if "--check" in sys.argv:
        sys.exit(check_main())
    sys.exit(asyncio.run(seed_walkthroughs()))
