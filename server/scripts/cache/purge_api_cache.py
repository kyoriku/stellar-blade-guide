"""
Scoped Cloudflare purge for the seeded API surface.

Usage:
  uv run python scripts/cache/purge_api_cache.py            # derive + purge
  uv run python scripts/cache/purge_api_cache.py --dry-run  # derive + list only

Derives the full cached API URL space live (FastAPI route table x DB slugs x
client navigation constants), batches purge calls at 30 URLs (Pro plan limit),
and verifies every API response. Exits non-zero on ANY enumeration or purge
failure so the caller (prod_seed.py) can fall back to purge_everything —
partial purge is the one unacceptable outcome (API responses carry
s-maxage=30d, so a missed URL would serve stale for up to a month).

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

load_dotenv()

# The apex is canonical (www 301s to it), so one host covers the cached space.
PUBLIC_BASE = 'https://stellarbladeguide.com'
CACHED_PREFIXES = ('/api/walkthroughs', '/api/levels', '/api/collectibles',
                   '/api/upgrades', '/api/cosmetics', '/api/materials')
BATCH_SIZE = 30      # Pro plan: purge-by-URL takes at most 30 per call
SANITY_FLOOR = 100   # well under the current 159; a smaller result means the
                     # derivation broke somewhere and the caller must full-purge
NAVIGATION_TS = Path(__file__).resolve().parents[3] / 'client' / 'src' / 'constants' / 'navigation.ts'


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
    """Level/location/walkthrough slugs from the database this process was
    pointed at (prod when invoked by prod_seed.py)."""
    import asyncio
    from sqlalchemy import select
    from app.db.database import AsyncSessionLocal
    from app.models.collectibles import Level, Location
    from app.models.walkthroughs import Walkthrough
    from app.routers.walkthroughs import _normalize_type

    async def q():
        async with AsyncSessionLocal() as s:
            levels = (await s.execute(select(Level.name))).scalars().all()
            locs = (await s.execute(
                select(Level.name, Location.name).join(Location, Location.level_id == Level.id))).all()
            wts = (await s.execute(select(Walkthrough.mission_type, Walkthrough.slug))).all()
        return levels, locs, wts

    levels, locs, wts = asyncio.run(q())
    if not levels or not locs or not wts:
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
        'level_location_pairs': sorted({(kebab(lv), kebab(lo)) for lv, lo in locs}),
        'walkthrough_pairs': sorted({(db_to_url[t], slug) for t, slug in wts}),
        'walkthrough_types': nav_types,
    }


def derive_urls(routes, db, nav):
    """Expand every cached GET route into concrete URLs. A route under a
    cached prefix whose shape is not recognized raises (the caller falls back
    to a full purge) — new routes can appear automatically or fail loudly,
    never be silently skipped."""
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
            urls.append(path)
        elif params == ['level_name']:
            urls += [path.format(level_name=lv) for lv in db['levels']]
        elif params == ['level_name', 'location_name']:
            urls += [path.format(level_name=lv, location_name=lo)
                     for lv, lo in db['level_location_pairs']]
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
        response = requests.post(
            f'https://api.cloudflare.com/client/v4/zones/{zone}/purge_cache',
            headers={'Authorization': f'Bearer {token}'},
            json={'files': batch},
            timeout=10,
        )
        response.raise_for_status()
        result = response.json()
        if not result.get('success'):
            raise RuntimeError(f'batch {i // BATCH_SIZE + 1} rejected: {result.get("errors")}')
        purged += len(batch)
        print(f"\033[90m  [{purged}/{len(urls)}] purged\033[0m")
    return purged


def main():
    dry_run = '--dry-run' in sys.argv[1:]
    print('\033[36m=== Scoped API cache purge ===\033[0m')
    from app.main import app  # route table is the source of truth for shapes
    nav = parse_navigation()
    db = load_db_sources()
    urls = derive_urls(app.routes, db, nav)
    if len(urls) < SANITY_FLOOR:
        raise RuntimeError(f'derived only {len(urls)} URLs (< {SANITY_FLOOR}) — refusing partial purge')
    print(f'Derived {len(urls)} cached API URLs '
          f'({len(db["levels"])} levels, {len(db["level_location_pairs"])} locations, '
          f'{len(db["walkthrough_pairs"])} walkthroughs)')
    if dry_run:
        for u in urls:
            print(f'  {u}')
        print(f'\033[33mDRY RUN: nothing purged ({len(urls)} URLs listed)\033[0m')
        return
    purged = purge(urls)
    print(f'\033[32m✓ Purged {purged} API URLs; image cache left warm\033[0m')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'\033[31m✗ Scoped purge failed: {e}\033[0m')
        sys.exit(1)
