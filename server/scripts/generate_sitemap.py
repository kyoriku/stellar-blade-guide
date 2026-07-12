"""
Generate sitemap.xml from live API data

Usage:
  uv run python3 scripts/generate_sitemap.py [--api-url URL]
  uv run python3 scripts/generate_sitemap.py --api-url http://localhost:8000/api
Defaults to production API. Use --api-url for local development.
"""
import argparse
import json
import urllib.request
from datetime import datetime
from pathlib import Path

BASE_URL = 'https://stellarbladeguide.com'
DEFAULT_API_URL = 'https://stellarbladeguide.com/api'

# Static pages (path, priority, changefreq)
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


def fetch_json(url: str) -> list:
    """Fetch JSON from API endpoint"""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'SitemapGenerator/1.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"  ✗ Failed to fetch {url}: {e}")
        return []


def slugify(name: str) -> str:
    """Convert display name to URL slug"""
    return name.lower().replace(' ', '-')


def generate_sitemap(api_url: str):
    lastmod = datetime.now().strftime('%Y-%m-%d')

    print(f"Fetching data from {api_url}...")

    # Fetch levels
    levels = fetch_json(f'{api_url}/levels/')
    print(f"  ✓ {len(levels)} levels")

    # Fetch collectible types
    types = fetch_json(f'{api_url}/types/')
    print(f"  ✓ {len(types)} collectible types")

    # Fetch all walkthroughs (includes mission_type and slug)
    walkthroughs = fetch_json(f'{api_url}/walkthroughs/')
    print(f"  ✓ {len(walkthroughs)} walkthroughs")

    # Build URL entries
    urls = []

    def add_url(path: str, priority: str, changefreq: str):
        urls.append(f'''  <url>
    <loc>{BASE_URL}{path}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>''')

    # Static pages
    for path, priority, changefreq in STATIC_PAGES:
        add_url(path, priority, changefreq)

    # Level pages
    for level in levels:
        if level['name'] in HIDDEN_LEVELS:
            continue
        slug = slugify(level['name'])
        add_url(f'/levels/{slug}', '0.8', 'weekly')

    # Collectible type pages - grouped by category
    type_count = {'collectibles': 0, 'upgrades': 0, 'materials': 0, 'cosmetics': 0}
    category_urls = {'collectibles': [], 'upgrades': [], 'materials': [], 'cosmetics': []}

    for t in types:
        route = TYPE_ROUTE_MAP.get(t['name'])
        if route:
            category, slug = route
            category_urls[category].append(slug)
            type_count[category] += 1
        else:
            print(f"  ⚠ Unknown type '{t['name']}' - skipping")

    for category in ['collectibles', 'upgrades', 'cosmetics', 'materials']:
        for slug in category_urls[category]:
            add_url(f'/{category}/{slug}', '0.8', 'weekly')

    # Walkthrough pages - group by mission_type for list pages
    # Iterate MISSION_TYPE_SLUG_MAP to preserve display order (main-story → side-quests → bulletin-board-requests)
    seen_types = set(w['mission_type'] for w in walkthroughs)

    for mission_type, url_slug in MISSION_TYPE_SLUG_MAP.items():
        if mission_type not in seen_types:
            continue

        # List page for this type
        add_url(f'/walkthroughs/{url_slug}', '0.7', 'weekly')

        # Individual walkthrough pages
        type_walkthroughs = sorted(
            [w for w in walkthroughs if w['mission_type'] == mission_type],
            key=lambda w: w.get('display_order', 0)
        )
        for w in type_walkthroughs:
            add_url(f'/walkthroughs/{url_slug}/{w["slug"]}', '0.9', 'weekly')

    # Build XML
    xml = '\n'.join([
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        *urls,
        '</urlset>'
    ])

    # Write to file (server/scripts/ → server/ → project root → client/public/)
    output_path = Path(__file__).parent.parent.parent / 'client' / 'public' / 'sitemap.xml'
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(xml)

    print(f"\nSitemap generated: {output_path}")
    print(f"Total URLs: {len(urls)}")
    print(f"  Static pages: {len(STATIC_PAGES)}")
    print(f"  Levels: {len(levels)}")
    print(f"  Collectibles: {type_count['collectibles']}")
    print(f"  Upgrades: {type_count['upgrades']}")
    print(f"  Cosmetics: {type_count['cosmetics']}")
    print(f"  Materials: {type_count['materials']}")
    print(f"  Walkthrough pages: {len(seen_types) + len(walkthroughs)}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate sitemap.xml from API')
    parser.add_argument('--api-url', default=DEFAULT_API_URL, help='API base URL')
    args = parser.parse_args()
    generate_sitemap(args.api_url)