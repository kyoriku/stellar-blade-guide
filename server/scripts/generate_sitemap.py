"""
Generate sitemap.xml from the database

Usage:
  uv run python scripts/generate_sitemap.py

Reads DATABASE_URL from server/.env (the dev database; prod is seeded from the
same content, so the dev DB is authoritative for sitemap purposes). Any query
or derivation failure aborts with exit 1 — a truncated sitemap is never
written.

lastmod is content-derived, not generation-time: each dynamic URL's composing
DB content (entry text, image URLs, ordering) is hashed, and
url -> {hash, lastmod} persists in scripts/sitemap-state.json (gitignored).
An unchanged hash keeps its stored lastmod; a changed hash or a new URL stamps
today; a missing sidecar degrades to all-today once and rebuilds. Static pages
always stamp today (existing convention).
"""
import asyncio
import hashlib
import json
import sys
from datetime import datetime
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

BASE_URL = 'https://stellarbladeguide.com'
STATE_FILE = Path(__file__).parent / 'sitemap-state.json'
OUTPUT_PATH = Path(__file__).parent.parent.parent / 'client' / 'public' / 'sitemap.xml'

# Static pages (path, priority, changefreq) — always stamped with today
STATIC_PAGES = [
    ('/', '1.0', 'daily'),
    ('/levels', '0.8', 'weekly'),
    ('/collectibles', '0.8', 'weekly'),
    ('/upgrades', '0.8', 'weekly'),
    ('/cosmetics', '0.8', 'weekly'),
    ('/materials', '0.8', 'weekly'),
    ('/walkthroughs', '0.8', 'weekly'),
    ('/blood-rain', '0.7', 'monthly'),
    ('/disclaimer', '0.3', 'monthly'),
    ('/terms', '0.3', 'monthly'),
    ('/privacy', '0.3', 'monthly'),
]

HIDDEN_LEVELS = {'Default', 'Boss Challenge'}

# Maps DB mission_type (singular) → frontend URL slug (plural), mirroring navigation.ts WALKTHROUGHS
MISSION_TYPE_SLUG_MAP = {
    'main-story': 'main-story',
    'side-quest': 'side-quests',
    'bulletin-board-request': 'bulletin-board-requests',
    'nier-dlc': 'nier-dlc',
    'nikke-dlc': 'nikke-dlc',
}

# Type name from DB → (category, slug)
TYPE_ROUTE_MAP = {
    # Collectibles
    'Camp': ('collectibles', 'camps'),
    'Can': ('collectibles', 'cans'),
    'Document': ('collectibles', 'documents'),
    'Memorystick': ('collectibles', 'memorysticks'),
    'Passcode': ('collectibles', 'passcodes'),
    # Upgrades
    'Beta Core': ('upgrades', 'beta-cores'),
    'Body Core': ('upgrades', 'body-cores'),
    'Weapon Core': ('upgrades', 'weapon-cores'),
    'Exospine': ('upgrades', 'exospines'),
    'Gear': ('upgrades', 'gear'),
    'Tumbler Expansion Module': ('upgrades', 'tumbler-expansion-modules'),
    'Drone Upgrade Module': ('upgrades', 'drone-upgrade-modules'),
    # Materials
    'Supply Box': ('materials', 'supply-boxes'),
    'Supply Chest': ('materials', 'supply-chests'),
    'Locked Chest': ('materials', 'locked-chests'),
    # 'Item': ('materials', 'items'),
    # Cosmetics
    'Nano Suit': ('cosmetics', 'nano-suits'),
    'Glasses': ('cosmetics', 'glasses'),
    'Earrings': ('cosmetics', 'earrings'),
    'Hairstyle': ('cosmetics', 'hairstyles'),
    'Drone Appearance': ('cosmetics', 'drone-appearances'),
    'Lily Outfit': ('cosmetics', 'lily-outfits'),
    'Adam Outfit': ('cosmetics', 'adam-outfits'),
}


def slugify(name: str) -> str:
    """Convert display name to URL slug"""
    return name.lower().replace(' ', '-')


def content_hash(payload) -> str:
    """Stable digest of the DB content composing one page."""
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, default=str).encode()
    ).hexdigest()


def resolve_lastmod(prev_state: dict, hashes: dict, today: str) -> tuple[dict, dict]:
    """Pure lastmod state transition.

    prev_state: url -> {hash, lastmod} from the sidecar ({} if missing).
    hashes: url -> content hash for every dynamic URL in THIS generation.
    Returns (url -> lastmod, new sidecar state). Unchanged hashes keep their
    stored lastmod; changed hashes and new URLs stamp today; URLs absent from
    `hashes` drop out of the state.
    """
    lastmods, new_state = {}, {}
    for url, h in hashes.items():
        prev = prev_state.get(url)
        lastmod = prev['lastmod'] if prev and prev.get('hash') == h else today
        lastmods[url] = lastmod
        new_state[url] = {'hash': h, 'lastmod': lastmod}
    return lastmods, new_state


async def load_db() -> dict:
    """Load everything the sitemap composes from, as plain dicts.

    Fails loudly: any query error propagates. Ordering fields are included in
    every payload so reordering counts as a content change.
    """
    from sqlalchemy import select
    from sqlalchemy.orm import joinedload
    from app.db.database import AsyncSessionLocal
    from app.models.collectibles import Level, Location, CollectibleType, Collectible
    from app.models.walkthroughs import Walkthrough

    async with AsyncSessionLocal() as s:
        levels = (await s.execute(
            select(Level).order_by(Level.display_order))).scalars().all()
        locations = (await s.execute(
            select(Location).order_by(Location.display_order))).scalars().all()
        types = (await s.execute(
            select(CollectibleType).order_by(CollectibleType.id))).scalars().all()
        collectibles = (await s.execute(
            select(Collectible).options(
                joinedload(Collectible.types), joinedload(Collectible.images)
            ).order_by(Collectible.display_order))).unique().scalars().all()
        walkthroughs = (await s.execute(
            select(Walkthrough).order_by(Walkthrough.display_order))).scalars().all()

        # Materialize before the session closes — no lazy loads later.
        return {
            'levels': [
                {'id': lv.id, 'name': lv.name, 'display_order': lv.display_order}
                for lv in levels
            ],
            'locations': [
                {'id': lo.id, 'level_id': lo.level_id, 'name': lo.name,
                 'display_order': lo.display_order}
                for lo in locations
            ],
            'types': [{'id': t.id, 'name': t.name} for t in types],
            'collectibles': [
                {'id': c.id, 'location_id': c.location_id, 'title': c.title,
                 'description': c.description, 'display_order': c.display_order,
                 'cycle': c.cycle, 'quantity': c.quantity, 'subtype': c.subtype,
                 'types': sorted(t.name for t in c.types),
                 'images': [
                     {'url': i.cloudinary_url, 'alt': i.alt_text, 'order': i.display_order}
                     for i in sorted(c.images, key=lambda i: i.display_order)
                 ]}
                for c in collectibles
            ],
            'walkthroughs': [
                {'id': w.id, 'slug': w.slug, 'title': w.title, 'subtitle': w.subtitle,
                 'level': w.level, 'mission_type': w.mission_type,
                 'objectives': w.objectives, 'content': w.content,
                 'display_order': w.display_order, 'thumbnail_url': w.thumbnail_url,
                 'rewards': w.rewards, 'available_after': w.available_after}
                for w in walkthroughs
            ],
        }


def generate_sitemap():
    today = datetime.now().strftime('%Y-%m-%d')

    print("Loading content from the database...")
    db = asyncio.run(load_db())
    if not db['levels'] or not db['types'] or not db['walkthroughs']:
        raise RuntimeError(
            'DB returned an empty content set — refusing to write a truncated sitemap')
    print(f"  ✓ {len(db['levels'])} levels, {len(db['types'])} collectible types, "
          f"{len(db['walkthroughs'])} walkthroughs")

    locations_by_level = {}
    for lo in db['locations']:
        locations_by_level.setdefault(lo['level_id'], []).append(lo)
    collectibles_by_location = {}
    for c in db['collectibles']:
        collectibles_by_location.setdefault(c['location_id'], []).append(c)

    # (path, priority, changefreq) in emission order, plus path -> content hash
    pages = []
    hashes = {}

    # Level pages — composed of the level's locations and their collectibles
    for level in db['levels']:
        if level['name'] in HIDDEN_LEVELS:
            continue
        path = f"/levels/{slugify(level['name'])}"
        locs = locations_by_level.get(level['id'], [])
        pages.append((path, '0.8', 'weekly'))
        hashes[path] = content_hash([
            {**lo, 'collectibles': collectibles_by_location.get(lo['id'], [])}
            for lo in locs
        ])

    # Collectible type pages — grouped by category, composed of that type's
    # collectibles with their level/location grouping
    type_count = {'collectibles': 0, 'upgrades': 0, 'materials': 0, 'cosmetics': 0}
    category_pages = {'collectibles': [], 'upgrades': [], 'materials': [], 'cosmetics': []}
    location_meta = {lo['id']: lo for lo in db['locations']}
    level_meta = {lv['id']: lv for lv in db['levels']}

    for t in db['types']:
        route = TYPE_ROUTE_MAP.get(t['name'])
        if not route:
            print(f"  ⚠ Unknown type '{t['name']}' - skipping")
            continue
        category, slug = route
        path = f'/{category}/{slug}'
        typed = [
            {**c,
             'location': location_meta[c['location_id']]['name'],
             'location_order': location_meta[c['location_id']]['display_order'],
             'level': level_meta[location_meta[c['location_id']]['level_id']]['name'],
             'level_order': level_meta[location_meta[c['location_id']]['level_id']]['display_order']}
            for c in db['collectibles'] if t['name'] in c['types']
        ]
        category_pages[category].append((path, content_hash(typed)))
        type_count[category] += 1

    for category in ['collectibles', 'upgrades', 'cosmetics', 'materials']:
        for path, h in category_pages[category]:
            pages.append((path, '0.8', 'weekly'))
            hashes[path] = h

    # Walkthrough pages — list pages composed of the type's list items,
    # detail pages composed of the full walkthrough row
    seen_types = set(w['mission_type'] for w in db['walkthroughs'])
    for mission_type, url_slug in MISSION_TYPE_SLUG_MAP.items():
        if mission_type not in seen_types:
            continue
        type_walkthroughs = sorted(
            [w for w in db['walkthroughs'] if w['mission_type'] == mission_type],
            key=lambda w: w['display_order']
        )

        list_path = f'/walkthroughs/{url_slug}'
        pages.append((list_path, '0.7', 'weekly'))
        hashes[list_path] = content_hash([
            {'slug': w['slug'], 'title': w['title'], 'subtitle': w['subtitle'],
             'display_order': w['display_order'], 'thumbnail_url': w['thumbnail_url']}
            for w in type_walkthroughs
        ])

        for w in type_walkthroughs:
            detail_path = f"/walkthroughs/{url_slug}/{w['slug']}"
            pages.append((detail_path, '0.9', 'weekly'))
            hashes[detail_path] = content_hash(w)

    # lastmod: static pages stamp today; dynamic pages carry their content date
    prev_state = json.loads(STATE_FILE.read_text()) if STATE_FILE.exists() else {}
    if not prev_state:
        print("  ⚠ No sitemap state sidecar — all lastmod values stamp today (baseline run)")
    lastmods, new_state = resolve_lastmod(prev_state, hashes, today)

    urls = []

    def add_url(path: str, priority: str, changefreq: str, lastmod: str):
        urls.append(f'''  <url>
    <loc>{BASE_URL}{path}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>''')

    for path, priority, changefreq in STATIC_PAGES:
        add_url(path, priority, changefreq, today)
    for path, priority, changefreq in pages:
        add_url(path, priority, changefreq, lastmods[path])

    xml = '\n'.join([
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        *urls,
        '</urlset>'
    ])

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(xml)
    STATE_FILE.write_text(json.dumps(new_state, indent=2) + '\n')

    changed = sum(1 for path, _, _ in pages if lastmods[path] == today)
    print(f"\nSitemap generated: {OUTPUT_PATH}")
    print(f"Total URLs: {len(urls)}")
    print(f"  Static pages: {len(STATIC_PAGES)}")
    print(f"  Levels: {sum(1 for lv in db['levels'] if lv['name'] not in HIDDEN_LEVELS)}")
    print(f"  Collectibles: {type_count['collectibles']}")
    print(f"  Upgrades: {type_count['upgrades']}")
    print(f"  Cosmetics: {type_count['cosmetics']}")
    print(f"  Materials: {type_count['materials']}")
    print(f"  Walkthrough pages: {len(seen_types) + len(db['walkthroughs'])}")
    print(f"  Dynamic pages stamped today: {changed}/{len(pages)}")
    print(f"State sidecar: {STATE_FILE}")


if __name__ == '__main__':
    try:
        generate_sitemap()
    except Exception as e:
        print(f"\033[31m✗ Sitemap generation failed: {e}\033[0m")
        sys.exit(1)
