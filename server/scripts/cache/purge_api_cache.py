"""
Scoped Cloudflare purge for the seeded API surface.

Usage:
  uv run python scripts/cache/purge_api_cache.py            # derive + purge
  uv run python scripts/cache/purge_api_cache.py --dry-run  # derive + list only
  uv run python scripts/cache/purge_api_cache.py --all      # ignore the manifest,
                                                            # purge the full surface
  uv run python scripts/cache/purge_api_cache.py --run-id X # narrow to the changed
                                                            # entities recorded by run X

--run-id defaults to $SEED_RUN_ID, which prod_seed.py exports, so an orchestrated
run needs no flag. Without either, there is no run to match a manifest against and
the purge covers the full surface. --dry-run and --all compose with everything.

Derives the full cached API URL space live (FastAPI route table x DB slugs x
client navigation constants), batches purge calls at 30 URLs (Pro plan limit),
and verifies every API response. Exits non-zero on ANY enumeration or purge
failure so the caller (prod_seed.py) can fall back to purge_everything —
partial purge is the one unacceptable outcome (API responses carry
s-maxage=30d, so a missed URL would serve stale for up to a month).

The surface is derived live and grows with the content: 125 URLs as of
2026-09-14 (12 levels, 85 walkthroughs), up from 81 at the 2026-07-16
re-baseline. Nothing here hardcodes that number — `--dry-run` prints the
current set — but SANITY_FLOOR below is calibrated against it, so check the
two together.

Exit codes tell prod_seed.py whether retrying is worth anything:
  0  purged (or listed, under --dry-run)
  1  TRANSIENT  — Cloudflare timed out, refused with 429, or 5xx'd. Retry.
  2  PERMANENT  — enumeration broke, the sanity floor tripped, or the token is
                  missing/rejected. The same call fails identically, so the
                  caller should go straight to its fallback.
Both non-zero codes are still "fall back to a full purge" as far as safety is
concerned; the split only decides whether to retry first.

Invoked by prod_seed.py with the PROD DATABASE_URL in the environment, so
slugs are derived from exactly what was just seeded. Images are never purged:
they are immutable and content changes always rename (see
scripts/images/PIPELINE.md).
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import json
import re
from pathlib import Path

import requests
from dotenv import load_dotenv

from scripts.cache import purge_manifest

load_dotenv()

# The apex is canonical (www 301s to it), so one host covers the cached space.
PUBLIC_BASE = 'https://stellarbladeguide.com'
CACHED_PREFIXES = ('/api/walkthroughs', '/api/levels', '/api/collectibles',
                   '/api/upgrades', '/api/cosmetics', '/api/materials')
BATCH_SIZE = 30      # Pro plan: purge-by-URL takes at most 30 per call
SANITY_FLOOR = 50    # a smaller result means the derivation broke somewhere and
                     # the caller must full-purge. Note the drift: 50 was set
                     # when the surface was 81 URLs (62% of it) and the surface
                     # is now 125, so it is 40% — a derivation that silently lost
                     # half the walkthroughs would clear it and do a partial
                     # purge, the one outcome the module docstring rules out.
                     # Deliberately NOT raised, because a single threshold cannot
                     # do the job once purges are scoped to changed entities: a
                     # full enumeration should expect roughly the whole current
                     # surface, while a purge covering one edited collectible is
                     # legitimately three or four URLs. That needs two separate
                     # checks, so pick the numbers when the split is built rather
                     # than tuning this one twice.
NAVIGATION_TS = Path(__file__).resolve().parents[3] / 'client' / 'src' / 'constants' / 'navigation.ts'

EXIT_TRANSIENT = 1
EXIT_PERMANENT = 2

# Statuses where the identical call can plausibly succeed later. 401/403 (missing
# or unscoped token) and 400 (malformed batch) are deliberately absent: retrying
# those just burns the retry budget before the caller's fallback runs.
RETRYABLE_STATUSES = frozenset({408, 429, 500, 502, 503, 504})


class TransientPurgeError(RuntimeError):
    """A Cloudflare-side failure worth retrying — timeout, connection drop, 429, 5xx."""


def kebab(name):
    return name.lower().replace(' ', '-')


def parse_navigation():
    """Client slug constants per section from navigation.ts (uncommented
    entries only). These are the request space for type-parameterized routes:
    the DB stores names/singulars, but the edge caches what clients ask for."""
    text = NAVIGATION_TS.read_text(encoding='utf-8')
    sections = {}
    for m in re.finditer(r'export const (\w+) = \[(.*?)\]', text, re.S):
        name, body = m.group(1), m.group(2)
        slugs = [s.group(1)
                 for line in body.splitlines()
                 if not line.strip().startswith('//')
                 if (s := re.search(r"slug:\s*'([^']+)'", line))]
        sections[name] = slugs
    for required in ('WALKTHROUGHS', 'COLLECTIBLES', 'UPGRADES', 'COSMETICS', 'MATERIALS'):
        if not sections.get(required):
            raise RuntimeError(f'navigation.ts parse: section {required} empty or missing')
    return sections


def load_db_sources():
    """Level/walkthrough slugs from the database this process was
    pointed at (prod when invoked by prod_seed.py)."""
    import asyncio
    from sqlalchemy import select
    from app.db.database import AsyncSessionLocal
    from app.models.collectibles import Level
    from app.models.walkthroughs import Walkthrough
    from app.routers.walkthroughs import _normalize_type

    async def q():
        async with AsyncSessionLocal() as s:
            levels = (await s.execute(select(Level.name))).scalars().all()
            wts = (await s.execute(select(Walkthrough.mission_type, Walkthrough.slug))).all()
        return levels, wts

    levels, wts = asyncio.run(q())
    if not levels or not wts:
        raise RuntimeError('DB slug query returned an empty set')

    # DB mission_type is singular; clients request the plural nav slug. Build
    # the DB->URL map by inverting the server's own normalizer over the nav
    # slugs, so no plural mapping is ever hand-listed here.
    nav_types = parse_navigation()['WALKTHROUGHS']
    db_to_url = {_normalize_type(s): s for s in nav_types}
    unmapped = sorted({t for t, _ in wts} - set(db_to_url))
    if unmapped:
        raise RuntimeError(f'walkthrough types with no navigation slug: {unmapped}')

    return {
        'levels': sorted({kebab(lv) for lv in levels}),
        'walkthrough_pairs': sorted({(db_to_url[t], slug) for t, slug in wts}),
        'walkthrough_types': nav_types,
        # Exposed so the narrowed path can map the manifest's raw DB
        # mission_types through the same inversion the full path uses.
        'db_type_to_url': db_to_url,
    }


# category_group -> navigation.ts section. NULL resolves as collectibles, the
# same default app/services/collectibles.py applies.
SECTION_FOR_GROUP = {
    'collectibles': 'COLLECTIBLES',
    'upgrades': 'UPGRADES',
    'cosmetics': 'COSMETICS',
    'materials': 'MATERIALS',
}


def scope_sources(changed, db, nav):
    """Narrow the derivation inputs to the entities a seed actually changed.

    derive_urls() is reused verbatim rather than reimplemented: handing it a
    restricted `db`/`nav` yields exactly the URLs those entities reach. That
    keeps one expander, so the narrowed path cannot drift from the full one and
    an unrecognized route shape still raises on both.

    The index-page dependency is handled per domain, not globally. A global
    list is only stale when something it contains changed, so
    `/api/collectibles/` is purged for any collectible-domain change and
    `/api/walkthroughs/` for any walkthrough change — never the other one.
    Otherwise every collectible-only seed would evict a warm walkthrough
    index, which during a long editorial pass is every single run.

    Anything unmappable raises, which the caller turns into a full purge.
    """
    levels = sorted({kebab(name) for name in changed['level_names']})

    by_section = {section: set() for section in SECTION_FOR_GROUP.values()}
    for slug, group in changed['type_slugs']:
        section = SECTION_FOR_GROUP.get(group or 'collectibles')
        if section is None:
            raise RuntimeError(f'type {slug!r} has unknown category_group {group!r}')
        if slug not in nav[section]:
            raise RuntimeError(f'type slug {slug!r} is absent from navigation section {section}')
        by_section[section].add(slug)

    pairs, wtypes = set(), set()
    for mission_type, slug in changed['pairs']:
        url_type = db['db_type_to_url'].get(mission_type)
        if url_type is None:
            raise RuntimeError(f'walkthrough type {mission_type!r} has no navigation slug')
        pairs.add((url_type, slug))
        wtypes.add(url_type)

    scoped_db = {
        'levels': levels,
        'walkthrough_pairs': sorted(pairs),
        'walkthrough_types': sorted(wtypes),
        'db_type_to_url': db['db_type_to_url'],
    }
    scoped_nav = {section: sorted(slugs) for section, slugs in by_section.items()}
    scoped_nav['WALKTHROUGHS'] = sorted(wtypes)

    # Which global indexes are actually stale. /api/collectibles/ spans every
    # type, so any collectible-domain change (a level or a type page) stales
    # it — deliberately not narrowed per category, since deciding when it is
    # safely skippable would cost more than the one URL it saves. It is simply
    # left out when nothing in its domain moved.
    index_prefixes = set()
    if levels or any(by_section.values()):
        index_prefixes.update(('/api/collectibles', '/api/levels', '/api/upgrades',
                               '/api/cosmetics', '/api/materials'))
    if pairs:
        index_prefixes.add('/api/walkthroughs')
    return scoped_db, scoped_nav, index_prefixes


def derive_urls(routes, db, nav, index_prefixes=None):
    """Expand every cached GET route into concrete URLs. A route under a
    cached prefix whose shape is not recognized raises (the caller falls back
    to a full purge) — new routes can appear automatically or fail loudly,
    never be silently skipped.

    index_prefixes gates the parameterless list routes (/api/collectibles/,
    /api/walkthroughs/). None — the full path — emits every one. The narrowed
    path passes the prefixes whose domain actually changed, so a
    collectible-only seed no longer evicts the walkthrough index and vice
    versa: a global list is only stale when something it contains changed.
    """
    type_slugs = {
        '/api/collectibles': nav['COLLECTIBLES'],
        '/api/upgrades': nav['UPGRADES'],
        '/api/cosmetics': nav['COSMETICS'],
        '/api/materials': nav['MATERIALS'],
    }
    urls = []
    for route in routes:
        methods = getattr(route, 'methods', None)
        path = getattr(route, 'path', '')
        if not methods or 'GET' not in methods or not path.startswith(CACHED_PREFIXES):
            continue
        params = re.findall(r'\{(\w+)\}', path)
        prefix = '/' + '/'.join(path.split('/')[1:3])  # e.g. /api/levels
        if not params:
            if index_prefixes is None or prefix in index_prefixes:
                urls.append(path)
        elif params == ['level_name']:
            urls += [path.format(level_name=lv) for lv in db['levels']]
        elif params == ['walkthrough_type']:
            urls += [path.format(walkthrough_type=t) for t in db['walkthrough_types']]
        elif params == ['walkthrough_type', 'slug']:
            urls += [path.format(walkthrough_type=t, slug=s)
                     for t, s in db['walkthrough_pairs']]
        elif params == ['type_name'] and prefix in type_slugs:
            urls += [path.format(type_name=t) for t in type_slugs[prefix]]
        else:
            raise RuntimeError(f'cached route with unrecognized shape: {path} (params {params})')
    return [f'{PUBLIC_BASE}{u}' for u in urls]


def purge(urls):
    zone = os.getenv('CLOUDFLARE_ZONE_ID')
    token = os.getenv('CLOUDFLARE_API_TOKEN')
    if not zone or not token:
        raise RuntimeError('CLOUDFLARE_ZONE_ID / CLOUDFLARE_API_TOKEN not set')
    purged = 0
    for i in range(0, len(urls), BATCH_SIZE):
        batch = urls[i:i + BATCH_SIZE]
        batch_no = i // BATCH_SIZE + 1
        try:
            response = requests.post(
                f'https://api.cloudflare.com/client/v4/zones/{zone}/purge_cache',
                headers={'Authorization': f'Bearer {token}'},
                json={'files': batch},
                timeout=10,
            )
        except requests.Timeout as e:
            raise TransientPurgeError(f'batch {batch_no} timed out after 10s ({type(e).__name__})') from e
        except requests.RequestException as e:
            raise TransientPurgeError(f'batch {batch_no} connection failure: {type(e).__name__}') from e

        # Report the status explicitly rather than via raise_for_status(), whose
        # message embeds the request URL and would put the zone ID in the log.
        if response.status_code in RETRYABLE_STATUSES:
            raise TransientPurgeError(f'batch {batch_no} got HTTP {response.status_code} from Cloudflare')
        if not response.ok:
            raise RuntimeError(f'batch {batch_no} got HTTP {response.status_code} from Cloudflare')

        result = response.json()
        if not result.get('success'):
            raise RuntimeError(f'batch {batch_no} rejected: {result.get("errors")}')
        purged += len(batch)
        print(f"\033[90m  [{purged}/{len(urls)}] purged\033[0m")
    return purged


def check_narrowed(narrowed, full_urls, changed):
    """Guards for the narrowed set.

    There is deliberately no lower bound here, which is the whole reason the
    old single SANITY_FLOOR could not serve both paths: a purge covering one
    edited collectible is legitimately three or four URLs. What must hold
    instead is that narrowing only ever *removes* URLs relative to the full
    surface, and that a manifest reporting changes never derives nothing.
    """
    extra = sorted(set(narrowed) - set(full_urls))
    if extra:
        raise RuntimeError(
            f'narrowed set has {len(extra)} URL(s) the full surface does not, '
            f'e.g. {extra[0]} — the changed-entity mapping is wrong')
    if not narrowed:
        raise RuntimeError('manifest reports changes but the narrowed set is empty')


def _flag_value(args, name):
    """Support both --run-id=X and --run-id X."""
    for i, arg in enumerate(args):
        if arg == name:
            return args[i + 1] if i + 1 < len(args) else None
        if arg.startswith(f'{name}='):
            return arg.split('=', 1)[1]
    return None


def main():
    args = sys.argv[1:]
    dry_run = '--dry-run' in args
    force_all = '--all' in args
    run_id = _flag_value(args, '--run-id') or purge_manifest.current_run_id()

    print('\033[36m=== Scoped API cache purge ===\033[0m')
    from app.main import app  # route table is the source of truth for shapes
    nav = parse_navigation()
    db = load_db_sources()

    # The full surface is derived first regardless of scope: it is the floor
    # check, and it is what the narrowed set is validated against. Deriving it
    # also means an unrecognized route shape raises here, before any narrowing.
    full_urls = derive_urls(app.routes, db, nav)
    if len(full_urls) < SANITY_FLOOR:
        raise RuntimeError(
            f'derived only {len(full_urls)} URLs (< {SANITY_FLOOR}) — refusing partial purge')
    print(f'Full surface: {len(full_urls)} cached API URLs '
          f'({len(db["levels"])} levels, {len(db["walkthrough_pairs"])} walkthroughs)')

    urls, scope = full_urls, 'full surface'
    if force_all:
        print('  --all: purging the full surface by request')
    else:
        try:
            changed = purge_manifest.load(run_id)
            if not any(changed[k] for k in ('level_names', 'type_slugs', 'pairs')):
                # An explicitly complete manifest with an empty change set is
                # the one case that legitimately purges nothing. Absence of a
                # manifest never reaches here — load() raises for that.
                print('  manifest: no entities changed, nothing to purge')
                urls, scope = [], 'no changes'
            else:
                scoped_db, scoped_nav, index_prefixes = scope_sources(changed, db, nav)
                narrowed = derive_urls(app.routes, scoped_db, scoped_nav, index_prefixes)
                check_narrowed(narrowed, full_urls, changed)
                urls, scope = narrowed, 'changed entities'
                print(f'  manifest: {len(changed["level_names"])} level(s), '
                      f'{len(changed["type_slugs"])} type(s), '
                      f'{len(changed["pairs"])} walkthrough(s) changed '
                      f'→ {len(urls)} URLs')
        except (purge_manifest.ManifestUnusable, RuntimeError) as e:
            # Every ambiguity widens. Under-purging serves stale content for up
            # to 30 days; over-purging costs a cold edge for a few hours.
            print(f'\033[33m  widening to the full surface: {e}\033[0m')
            urls, scope = full_urls, 'full surface'

    # Always name the URLs, not just how many. prod_seed.py streams this into
    # the run log, so the list is the record of exactly what was invalidated —
    # without it you have to guess which pages to re-check at the edge.
    print(f'Scope: {scope} — {len(urls)} URL(s)')
    for u in urls:
        print(f'  {u}')

    if dry_run:
        print(f'\033[33mDRY RUN: nothing purged\033[0m')
        return

    purged = purge(urls)
    # Spent either way: a full purge covers whatever the manifest described, so
    # leaving it behind would let a later run re-purge a stale changed set.
    purge_manifest.clear()
    print(f'\033[32m✓ Purged {purged} API URLs ({scope}); image cache left warm\033[0m')


if __name__ == '__main__':
    try:
        main()
    except TransientPurgeError as e:
        print(f'\033[31m✗ Scoped purge failed (transient, retryable): {e}\033[0m')
        sys.exit(EXIT_TRANSIENT)
    except Exception as e:
        print(f'\033[31m✗ Scoped purge failed (permanent): {e}\033[0m')
        sys.exit(EXIT_PERMANENT)
