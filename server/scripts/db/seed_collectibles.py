"""
Usage:
  uv run scripts/db/seed_collectibles.py           # seed
  uv run scripts/db/seed_collectibles.py --check   # only load and check the files; no DB, no Redis

Seeds every collectible in one transaction, so a run that stops before its COMMIT leaves the
database exactly as it was, and a reader sees either the old rows or the new ones, never a
mix. Exits 1 on any failure, so prod_seed.py stops before its purge.

--check refuses an entry still holding a local image path, which works on dev and breaks on
prod; prod_seed.py runs it before any seeder writes.
"""

import sys
from pathlib import Path
import json
import glob
import asyncio
import contextlib

from sqlalchemy import select, delete, text
from sqlalchemy.orm import selectinload

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from redis.exceptions import RedisError

from app.core import cache
from app.core.cache import invalidate_cache_pattern
from app.models.collectibles import Level, Location, CollectibleType, Collectible, CollectibleImage
from scripts.images.paths import local_image_paths, normalize_image_path
from scripts.cache import purge_manifest
from scripts.db.seed_guard import (
    NO_ANSWER, NO_ANSWER_SECONDS, Watchdog, failure_line, seed_engine, seed_sessionmaker,
    watch_engine,
)

# The Redis patterns this seeder clears (tests/test_cache_isolation.py reads them).
CACHE_PATTERNS = ["collectibles:*", "cosmetics:*", "upgrades:*", "search:*"]
BATCH_SIZE = 50


def load_all_seed_files():
    """Load all seed data from JSON files"""
    seed_dir = project_root / 'seed-data' / 'collectibles'
    if not seed_dir.exists():
        print("\033[31m✗ seed-data directory not found!\033[0m")
        return []

    all_data = []
    json_files = sorted(glob.glob(str(seed_dir / '*' / '*.json')))

    print(f"\033[96m━━━ STEP 1: Loading Data ━━━\033[0m")
    print(f"Found {len(json_files)} JSON files\n")

    for json_file in json_files:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            all_data.extend(data)
            rel_path = Path(json_file).relative_to(seed_dir)
            print(f"   {rel_path}: {len(data)} items")

    return all_data


async def reset_collectibles_sequence(db):
    """Reset collectibles sequence to match max ID.

    setval-to-MAX is safe here ONLY because a fresh full-table seed has just
    made MAX(id) authoritative. As a general repair this must never move the
    counter DOWNWARD: a sequence ahead of MAX(id) (deletion history) is
    healthy, and lowering it mints colliding ids. If this sync is ever reused
    outside a fresh seed, use GREATEST(MAX(id), last_value) instead.

    It runs after the COMMIT: setval isn't transactional, so inside the
    transaction a rollback would leave it changed.
    """
    print("\n\033[96m━━━ STEP 5: Resetting Collectibles Sequence ━━━\033[0m")

    result = await db.execute(text("SELECT MAX(id) FROM collectibles"))
    max_id = result.scalar() or 0

    if max_id > 0:
        await db.execute(
            text(f"SELECT setval(pg_get_serial_sequence('collectibles', 'id'), {max_id}, true)")
        )
        print(f"  ✓ Collectibles sequence reset to {max_id}")
    else:
        await db.execute(
            text("SELECT setval(pg_get_serial_sequence('collectibles', 'id'), 1, false)")
        )
        print(f"  ✓ Collectibles sequence reset to 1 (table is empty)")

    print()


async def seed_database():
    """Seed, then clear Redis. Returns the exit status: 0 only when every step succeeded."""
    # STEP 1: Load seed data
    seed_data = load_all_seed_files()
    if not seed_data:
        print("\033[31m✗ No seed data found! Nothing was written.\033[0m")
        return 1

    added = 0
    updated = 0      # existing rows that actually differ, not rows merely present
    unchanged = 0
    deleted = 0
    errors = 0

    run_id = purge_manifest.current_run_id()
    changed_levels = set()
    changed_type_slugs = set()

    phase = {"now": "writing"}
    watchdog = Watchdog(NO_ANSWER_SECONDS, 1, lambda: f"\033[31m{NO_ANSWER[phase['now']]}\033[0m")
    engine = seed_engine("seed_collectibles")
    watch_engine(engine, watchdog)
    watchdog.start()

    async with seed_sessionmaker(engine)() as db:
        try:
            # Snapshot image rows BEFORE the delete below removes them.
            # Without this an image-only edit is undetectable: the collectible
            # row itself is untouched, so is_modified() would say "unchanged"
            # and the purge would skip a page whose pictures just changed.
            prev_images = {}
            for cid, url, alt, order in (await db.execute(select(
                CollectibleImage.collectible_id,
                CollectibleImage.cloudinary_url,
                CollectibleImage.alt_text,
                CollectibleImage.display_order,
            ))).all():
                prev_images.setdefault(cid, []).append((url, alt, order))
            for rows in prev_images.values():
                rows.sort()

            # STEP 2: Remove the images and restart their ids at 1, as TRUNCATE ... RESTART
            # IDENTITY did, but inside the transaction: DELETE takes no lock that blocks a
            # reader, and ALTER SEQUENCE ... RESTART is rolled back with everything else.
            print(f"\n\033[96m━━━ STEP 2: Resetting Image IDs ━━━\033[0m")
            await db.execute(text("DELETE FROM collectible_images"))
            sequence = (await db.execute(
                text("SELECT pg_get_serial_sequence('collectible_images', 'id')"))).scalar()
            if not sequence:
                await db.rollback()
                print("\033[31m✗ collectible_images.id has no sequence to restart. "
                      "Nothing was written.\033[0m")
                return 1
            await db.execute(text(f"ALTER SEQUENCE {sequence} RESTART"))
            print(f"  ✓ Image IDs reset to 1")

            # STEP 3: Seed collectibles
            print(f"\n\033[96m━━━ STEP 3: Seeding {len(seed_data)} Collectibles ━━━\033[0m\n")

            # Pre-cache all lookups
            print("Loading reference data...")

            levels = {
                l.name: l for l in (await db.execute(select(Level))).scalars()
            }
            print(f"  Cached {len(levels)} levels")

            types = {
                t.name: t for t in (await db.execute(select(CollectibleType))).scalars()
            }
            print(f"  Cached {len(types)} types")

            locations = {
                (loc.level_id, loc.name): loc
                for loc in (await db.execute(select(Location))).scalars()
            }
            print(f"  Cached {len(locations)} locations")

            existing_collectibles = {
                c.id: c for c in (
                    await db.execute(
                        select(Collectible).options(selectinload(Collectible.types))
                    )
                ).scalars()
            }
            print(f"  Cached {len(existing_collectibles)} existing collectibles\n")

            # Track which IDs are in the seed data
            seed_ids = set()

            batch_count = 0

            for item in seed_data:
                # Problems with an entry are counted and listed, and the whole seed is rolled
                # back after the loop. A database error isn't caught here: it ends the run.
                try:
                    collectible_id = item.get("id")
                    seed_ids.add(collectible_id)

                    # Get level from cache
                    level = levels.get(item['level'])
                    if not level:
                        print(f"\033[31m✗ Level not found: {item['level']}\033[0m")
                        errors += 1
                        continue

                    # Get or create location from cache
                    location_key = (level.id, item['location'])
                    location = locations.get(location_key)

                    if not location:
                        location = Location(
                            name=item['location'],
                            level_id=level.id,
                            display_order=item.get('display_order', 0)
                        )
                        db.add(location)
                        await db.flush()
                        locations[location_key] = location

                    # Handle types from cache
                    type_names = item.get('types') or item.get('type')
                    if not type_names:
                        print(f"\033[31m✗ No type(s) specified for: {item.get('title', 'Unknown')}\033[0m")
                        errors += 1
                        continue
                    if not isinstance(type_names, list):
                        type_names = [type_names]

                    collectible_types = []
                    for t in type_names:
                        ctype = types.get(t)
                        if ctype:
                            collectible_types.append(ctype)
                        else:
                            print(f"\033[31m✗ Type not found: {t}\033[0m")
                            errors += 1

                    if not collectible_types:
                        errors += 1
                        continue

                    # Prepare description
                    desc = item['description']
                    if isinstance(desc, dict):
                        description_json = desc
                    elif isinstance(desc, list):
                        description_json = {"type": "list", "items": desc}
                    else:
                        description_json = {"type": "text", "content": desc}

                    # Get cycle (defaults to "Base" if not specified)
                    cycle = item.get("cycle", "Base")

                    # Check cache for existing collectible
                    existing = existing_collectibles.get(collectible_id)

                    if existing:
                        existing.title = item["title"]
                        existing.description = description_json
                        existing.location_id = location.id
                        existing.display_order = item.get("display_order", 0)
                        existing.quantity = item.get("quantity", 1)
                        existing.cycle = cycle
                        existing.subtype = item.get("subtype")
                        existing.types = collectible_types
                        collectible_instance = existing
                        # Must be read here, before the batch flush below resets
                        # attribute history. is_modified compares each attribute
                        # against its loaded value, so re-assigning an identical
                        # value is not a change.
                        row_changed = db.is_modified(existing, include_collections=True)
                    else:
                        new_collectible = Collectible(
                            id=collectible_id,
                            title=item["title"],
                            description=description_json,
                            location_id=location.id,
                            display_order=item.get("display_order", 0),
                            quantity=item.get("quantity", 1),
                            cycle=cycle,
                            subtype=item.get("subtype"),
                            types=collectible_types
                        )
                        db.add(new_collectible)
                        collectible_instance = new_collectible
                        existing_collectibles[collectible_id] = new_collectible
                        added += 1
                        row_changed = True

                    # Re-add images (the table was emptied above, so no need to delete first)
                    new_images = []
                    for img in item.get('images', []):
                        if not img.get('url'):
                            continue
                        new_image = CollectibleImage(
                            collectible_id=collectible_instance.id,
                            cloudinary_url=normalize_image_path(img['url']),
                            alt_text=img['alt'],
                            display_order=img['order']
                        )
                        db.add(new_image)
                        new_images.append(
                            (new_image.cloudinary_url, new_image.alt_text, new_image.display_order))
                    new_images.sort()

                    if row_changed or new_images != prev_images.get(collectible_id, []):
                        if existing:
                            updated += 1
                        changed_levels.add(level.name)
                        changed_type_slugs.update(
                            (t.slug, t.category_group) for t in collectible_types)
                    else:
                        unchanged += 1

                    batch_count += 1
                    if batch_count >= BATCH_SIZE:
                        await db.flush()
                        batch_count = 0
                        print(f"  ✓ Prepared batch ({added + updated} processed)")

                except (KeyError, TypeError, ValueError, AttributeError) as e:
                    print(f"\033[31m✗ Error with '{item.get('title', 'Unknown')}': "
                          f"{type(e).__name__}: {e}\033[0m")
                    errors += 1

            # Flush the rest, so the orphan check and the commit see every row
            await db.flush()
            print(f"  ✓ Prepared final batch")

            if errors:
                await db.rollback()
                print(f"\n\033[31m✗ {errors} problem(s) with the seed data (listed above). "
                      f"Nothing was written.\033[0m")
                return 1

            # STEP 4: Delete collectibles not in seed data
            print(f"\n\033[96m━━━ STEP 4: Cleaning Up Orphaned Collectibles ━━━\033[0m")

            orphaned_ids = set(existing_collectibles.keys()) - seed_ids

            if orphaned_ids:
                print(f"  Found {len(orphaned_ids)} collectibles not in seed data")

                # Record what the deletions stale before the rows go away. A
                # removed collectible changes its level page, its type pages and
                # the global list exactly as an edited one does.
                level_name_by_id = {lv.id: name for name, lv in levels.items()}
                level_name_by_location = {
                    loc.id: level_name_by_id.get(loc.level_id) for loc in locations.values()
                }
                orphan_titles = {}
                for orphan_id in orphaned_ids:
                    orphan = existing_collectibles[orphan_id]
                    orphan_titles[orphan_id] = orphan.title
                    orphan_level = level_name_by_location.get(orphan.location_id)
                    if orphan_level:
                        changed_levels.add(orphan_level)
                    changed_type_slugs.update(
                        (t.slug, t.category_group) for t in orphan.types)

                result = await db.execute(
                    delete(Collectible).where(Collectible.id.in_(orphaned_ids))
                )
                deleted = result.rowcount
                print(f"  \033[33m✓ Deleted {deleted} orphaned collectibles\033[0m")

                for orphan_id in sorted(orphaned_ids):
                    print(f"    - ID {orphan_id}: {orphan_titles[orphan_id]}")
            else:
                print(f"  ✓ No orphaned collectibles found")

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
                    purge_manifest.SECTION_COLLECTIBLES, run_id,
                    level_names=changed_levels,
                    type_slugs=changed_type_slugs,
                )
            except OSError as e:
                await db.rollback()
                print(f"\033[31m✗ Couldn't write the purge manifest ({type(e).__name__}: {e}). "
                      f"Nothing was written.\033[0m")
                return 1
            phase["now"] = "committing"
            await db.commit()
            phase["now"] = "committed"
            print("  ✓ Committed")

            # STEP 5: Reset collectibles sequence to match max ID
            await reset_collectibles_sequence(db)
            await db.commit()

        except Exception as e:
            if phase["now"] == "writing":
                with contextlib.suppress(Exception):
                    await db.rollback()
            print(f"\033[31m{failure_line(phase['now'], e)}\033[0m")
            return 1

    await engine.dispose()
    watchdog.stop()

    # STEP 6: Clear Redis cache
    print(f"\n\033[96m━━━ STEP 6: Clearing Cache ━━━\033[0m")
    total = 0
    for pattern in CACHE_PATTERNS:
        try:
            count = await invalidate_cache_pattern(pattern)
        except RedisError as e:
            print(f"\033[31m✗ Committed, but clearing Redis failed on {pattern} "
                  f"({type(e).__name__}: {e}). The edge and Redis serve the old pages until a "
                  f"purge succeeds: run it again, or prod_seed.py --purge-only.\033[0m")
            return 1
        if count:
            print(f"\033[32m[CLEARED]\033[0m {pattern} ({count} keys)")
        else:
            print(f"\033[90m[SKIP]\033[0m {pattern} (no keys)")
        total += count
    print(f"\033[32m✓ {total} keys cleared\033[0m")

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
    print(f"\033[92m  Errors: {errors}\033[0m")
    print(f"\033[92m  Purge manifest: {len(changed_levels)} level(s), "
          f"{len(changed_type_slugs)} type(s) changed\033[0m")
    print(f"\033[96m{'━' * 60}\033[0m")
    return 0


def check_main():
    """--check: load the seed files and refuse local image paths (scripts/images/paths.py).
    Dev serves /assets/images/... from the masters folder, which the production image leaves
    out, so a path the URL swap never turned into an R2 URL would break on prod. Dev seeds
    keep accepting them, since new images are previewed before the swap. 0 when every check
    passes, else 1."""
    seed_data = load_all_seed_files()
    if not seed_data:
        print("\033[31m✗ No seed data found!\033[0m")
        return 1
    ok = True
    for item in seed_data:
        paths = local_image_paths(item)
        if paths:
            ok = False
            print(f"\033[31m✗ {item.get('title', '?')} [{item.get('id', '?')}]: {len(paths)} image "
                  f"path(s) still point at the local masters folder, such as {paths[0]}. Run the "
                  f"image pipeline (dev_workflow.py collectibles), commit, then seed prod.\033[0m")
    return 0 if ok else 1


if __name__ == "__main__":
    if "--check" in sys.argv:
        sys.exit(check_main())
    sys.exit(asyncio.run(seed_database()))
