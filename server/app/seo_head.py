"""Server-side head-tag injection for the SPA shell.

The built index.html carries a <!--seo--> marker in its <head>; the catch-all
splices per-route title/description/canonical/og tags at that marker so
non-JS crawlers and link scrapers see real head tags. React renders the same
tags at runtime (SEO.tsx) and main.tsx removes every data-seo="server"
element before mount, so browsers never see duplicates.

Static head text comes from client/src/constants/seo.json — the single source
the client constants also import. Walkthrough detail pages are the one dynamic
case: they reuse the API's Redis cache key and lookup_walkthrough(), so a
seeded row is sufficient for correct head tags with no code or JSON change.

No tag value is ever built from the raw request path: canonicals come from the
matched JSON key or the DB row's slug, and unmatched paths get the client
ErrorPage's 404 head (noindex, no canonical).
"""
import hashlib
import html
import json
import logging
import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse, Response
from fastapi.staticfiles import StaticFiles

from app.config.settings import settings
from app.core.cache import get_cache, set_cache
from app.db.database import AsyncSessionLocal
from app.routers.walkthroughs import _normalize_type, _serialize_full, lookup_walkthrough

logger = logging.getLogger("app.seo_head")

SEO_JSON_PATH = os.path.join(os.path.dirname(__file__), '../../client/src/constants/seo.json')
MARKER = '<!--seo-->'
R2_BASE = 'https://img.stellarbladeguide.com/'
MISS_TTL = 60  # seconds; negative cache for successful lookups that find no row

with open(SEO_JSON_PATH, encoding='utf-8') as _f:
    _SEO = json.load(_f)

_SITE = _SEO['site']
_CATEGORY_SECTIONS = {
    'levels': _SEO['levels'],
    'collectibles': _SEO['types']['collectibles'],
    'upgrades': _SEO['types']['upgrades'],
    'cosmetics': _SEO['types']['cosmetics'],
    'materials': _SEO['types']['materials'],
}


def _og_image_url(url: str) -> str:
    """Mirror the client's thumbnailUrl(url, 1200) (utils/image.ts)."""
    if url.startswith(R2_BASE) and url.endswith('.webp'):
        return f"{url[:-len('.webp')]}-w1200.webp"
    return url


def _walkthrough_type_name(type_slug: str) -> str:
    """Mirror the client's walkthroughTypeName() fallback for unknown slugs."""
    entry = _SEO['walkthroughTypes'].get(type_slug)
    if entry:
        return entry['name']
    return ' '.join(w[:1].upper() + w[1:] for w in type_slug.replace('-', ' ').split(' '))


def _not_found_head() -> dict:
    """Mirror the client ErrorPage's 404 head: noindex, no canonical."""
    e = _SEO['notFound']
    return {'title': e['title'], 'description': e['description'], 'noindex': True}


def _loading_variant_head(type_slug: str) -> dict:
    """The walkthrough detail page's loading-state head — used when the DB is
    unavailable so the response still carries honest, path-free tags."""
    name = _walkthrough_type_name(type_slug)
    entry = _SEO['walkthroughTypes'].get(type_slug)
    return {
        'title': f'{name} Walkthrough',
        'description': f'{name} walkthrough for Stellar Blade. Step-by-step guide with screenshots and tips.',
        'image': entry['image'] if entry else None,
    }


def resolve_static_head(path: str):
    """Resolve a request path to head data, a walkthrough sentinel, or the
    404 head. Canonicals are built from matched JSON keys only."""
    p = path.lower().rstrip('/') or '/'

    if p == '/':
        h = _SEO['home']
        return {'title': h['title'], 'description': h['description'], 'canonical': '/'}
    if p in _SEO['pages']:
        e = _SEO['pages'][p]
        return {'title': e['title'], 'description': e['description'], 'canonical': p,
                'image': e.get('image'), 'og_type': e.get('ogType')}
    if p in _SEO['noindex']:
        e = _SEO['noindex'][p]
        return {'title': e['title'], 'description': e['description'], 'canonical': p, 'noindex': True}
    if p in _SEO['index']:
        e = _SEO['index'][p]
        return {'title': e['title'], 'description': e['description'], 'canonical': p}

    parts = p.strip('/').split('/')
    if len(parts) == 2:
        section, slug = parts
        if section == 'walkthroughs':
            e = _SEO['walkthroughTypes'].get(slug)
            if e:
                name = e['name']
                return {
                    'title': f'{name} Walkthroughs',
                    'description': f'Complete {name} walkthroughs for Stellar Blade. Detailed guides with step-by-step instructions and screenshots.',
                    'canonical': f'/walkthroughs/{slug}',
                    'image': e['image'],
                }
        elif section in _CATEGORY_SECTIONS:
            e = _CATEGORY_SECTIONS[section].get(slug)
            if e:
                return {'title': e['title'], 'description': e['description'],
                        'canonical': f'/{section}/{slug}', 'image': e['image']}
    elif len(parts) == 3 and parts[0] == 'walkthroughs':
        return ('walkthrough', parts[1], parts[2])

    return _not_found_head()


async def fetch_walkthrough_head(type_slug: str, slug: str) -> dict:
    """Head data for a walkthrough detail page, sharing the API's cache."""
    known_type = type_slug in _SEO['walkthroughTypes']
    if not known_type and not settings.DEBUG:
        # Bounds the un-rate-limited DB surface; DEBUG bypass keeps the e2e
        # fixture mission type working.
        return _not_found_head()

    normalized_type = _normalize_type(type_slug)
    cache_key = f'walkthrough:{normalized_type}:{slug}'
    miss_key = f'walkthrough:miss:{normalized_type}:{slug}'
    try:
        data = await get_cache(cache_key)
        if not data:
            if await get_cache(miss_key):
                return _not_found_head()
            async with AsyncSessionLocal() as db:
                row = await lookup_walkthrough(db, normalized_type, slug)
            if row is None:
                # Only a successful query that finds no row is negative-cached;
                # the exception path below must never write the miss key.
                await set_cache(miss_key, True, ttl=MISS_TTL)
                return _not_found_head()
            data = _serialize_full(row)
            await set_cache(cache_key, data, ttl=settings.CACHE_TTL)
    except Exception:
        logger.warning('seo head lookup failed for %s/%s; serving the loading-variant head',
                       type_slug, slug, exc_info=True)
        return _loading_variant_head(type_slug)

    content = data.get('content') or []
    has_boss = any(isinstance(b, dict) and b.get('is_boss') for b in content)
    level = data.get('level')
    description = (
        f"{data['title']} walkthrough for Stellar Blade{f' ({level})' if level else ''}. "
        f"Step-by-step guide with {'screenshots, tips, and boss strategies' if has_boss else 'screenshots and tips'}."
    )
    image = data.get('thumbnail_url')
    if not image:
        for block in content:
            images = (block.get('images') if isinstance(block, dict) else None) or []
            if images and images[0].get('url'):
                image = images[0]['url']
                break
    head = {'title': f"{data['title']} Walkthrough", 'description': description, 'image': image}
    if known_type:
        # Canonical from the matched type key and the DB row's slug — never the
        # raw path (ilike-found rows emit their true slug).
        head['canonical'] = f"/walkthroughs/{type_slug}/{data['slug']}"
    return head


def render_head(head: dict) -> str:
    """Render the head fragment, mirroring SEO.tsx's tag set and order."""
    def esc(value: str) -> str:
        return html.escape(value, quote=True)

    title = head.get('title') or ''
    full_title = f"{title} | {_SITE['name']}" if title else _SITE['name']
    description = head.get('description') or ''
    canonical = head.get('canonical')
    canonical_url = f"{_SITE['url']}{canonical}" if canonical else None
    image = head.get('image')
    og_image = _og_image_url(image) if image else _SITE['defaultImage']
    og_type = head.get('og_type') or 'website'

    lines = [
        f'<title data-seo="server">{esc(full_title)}</title>',
        f'<meta data-seo="server" name="description" content="{esc(description)}" />',
    ]
    if canonical_url:
        lines.append(f'<link data-seo="server" rel="canonical" href="{esc(canonical_url)}" />')
    if head.get('noindex'):
        lines.append('<meta data-seo="server" name="robots" content="noindex, nofollow" />')
    lines += [
        f'<meta data-seo="server" property="og:type" content="{esc(og_type)}" />',
        f'<meta data-seo="server" property="og:title" content="{esc(full_title)}" />',
        f'<meta data-seo="server" property="og:description" content="{esc(description)}" />',
    ]
    if canonical_url:
        lines.append(f'<meta data-seo="server" property="og:url" content="{esc(canonical_url)}" />')
    lines += [
        f'<meta data-seo="server" property="og:image" content="{esc(og_image)}" />',
        f'<meta data-seo="server" property="og:site_name" content="{esc(_SITE["name"])}" />',
        '<meta data-seo="server" name="twitter:card" content="summary_large_image" />',
        f'<meta data-seo="server" name="twitter:title" content="{esc(full_title)}" />',
        f'<meta data-seo="server" name="twitter:description" content="{esc(description)}" />',
        f'<meta data-seo="server" name="twitter:image" content="{esc(og_image)}" />',
    ]
    return '\n  '.join(lines)


def _etag_matches(if_none_match: str, etag: str) -> bool:
    """Weak-comparison If-None-Match per RFC 9110 (Cloudflare may add W/)."""
    if if_none_match.strip() == '*':
        return True
    for candidate in if_none_match.split(','):
        candidate = candidate.strip()
        if candidate.startswith('W/'):
            candidate = candidate[2:]
        if candidate == etag:
            return True
    return False


def register_spa(app: FastAPI, client_dist: str, *, reload_shell: bool | None = None) -> None:
    """Serve the built SPA with per-route head tags spliced at the marker.

    reload_shell (default: settings.DEBUG) re-reads index.html per request so a
    rebuilt dist is picked up without restarting uvicorn (--reload only watches
    .py files); prod reads it once at startup.
    """
    if reload_shell is None:
        reload_shell = settings.DEBUG

    assets_dir = os.path.join(client_dist, 'assets')
    if os.path.isdir(assets_dir):
        app.mount('/assets', StaticFiles(directory=assets_dir), name='assets')

    real_dist = os.path.realpath(client_dist)
    index_path = os.path.join(client_dist, 'index.html')

    def read_shell():
        with open(index_path, encoding='utf-8') as f:
            shell_html = f.read()
        if MARKER not in shell_html:
            return None
        prefix, suffix = shell_html.split(MARKER, 1)
        return prefix, suffix

    cached_shell = None
    if not reload_shell:
        cached_shell = read_shell()
        if cached_shell is None:
            logger.warning('%s missing from %s; serving the shell without injected head tags',
                           MARKER, index_path)

    @app.api_route('/{full_path:path}', methods=["GET", "HEAD"], include_in_schema=False)
    async def serve_spa(request: Request, full_path: str):
        # Unknown API paths should 404 instead of falling through to the SPA
        if full_path == 'api' or full_path.startswith('api/'):
            raise HTTPException(status_code=404)
        file_path = os.path.realpath(os.path.join(client_dist, full_path))
        if file_path.startswith(real_dist + os.sep) and os.path.isfile(file_path):
            return FileResponse(file_path)

        shell = read_shell() if reload_shell else cached_shell
        if shell is None:
            return FileResponse(index_path)

        head = resolve_static_head('/' + full_path)
        if isinstance(head, tuple):
            head = await fetch_walkthrough_head(head[1], head[2])

        body = f'{shell[0]}{render_head(head)}{shell[1]}'.encode('utf-8')
        etag = f'"{hashlib.md5(body).hexdigest()}"'
        if_none_match = request.headers.get('if-none-match')
        if if_none_match and _etag_matches(if_none_match, etag):
            return Response(status_code=304, headers={'ETag': etag})

        response = HTMLResponse(body, headers={'ETag': etag})
        if request.method == 'HEAD':
            # Headers (Content-Length, ETag) keep the GET values; only the body
            # is dropped — mirrors FileResponse.send_header_only, and keeps
            # httpx/ASGITransport tests deterministic (uvicorn strips anyway).
            response.body = b''
        return response
