"""SPA head-injection tests (app/seo_head.py).

Follows the house pattern: a bare per-test FastAPI app built through
register_spa() with a tmp_path dist (the factory seam that makes the module
testable without a real client build), fakeredis via the autouse conftest
patch, and a hand-created SQLite walkthroughs table for the dynamic branch.
app.main is deliberately not imported.
"""
import json
import os

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

import app.seo_head as seo_head
from app.core.cache import get_cache, set_cache
from app.models.walkthroughs import Walkthrough as WalkthroughModel
from app.routers.walkthroughs import _serialize_full
from app.seo_head import MARKER, register_spa

SEO = json.load(open(seo_head.SEO_JSON_PATH, encoding='utf-8'))
SUFFIX = ' | Stellar Blade Guide'

SHELL = (
    '<!doctype html>\n<html>\n<head>\n'
    '  <meta charset="UTF-8" />\n'
    f'  {MARKER}\n'
    '</head>\n<body><main id="root"></main></body>\n</html>\n'
)

BOSS_BLOCK = {"order": 1, "text": "Fight", "is_boss": True, "images": []}
PLAIN_BLOCK = {"order": 1, "text": "Walk", "is_boss": False, "images": []}
IMAGE_BLOCK = {
    "order": 2, "text": "Look", "is_boss": False,
    "images": [{"url": "https://img.stellarbladeguide.com/stellar-blade/walkthroughs/x/shot.webp",
                "alt": "shot", "order": 1}],
}


def make_dist(tmp_path, marker=True):
    dist = tmp_path / 'dist'
    dist.mkdir()
    (dist / 'index.html').write_text(SHELL if marker else SHELL.replace(f'  {MARKER}\n', ''), encoding='utf-8')
    (dist / 'robots.txt').write_text('User-agent: *\n', encoding='utf-8')
    return dist


def make_app(dist, reload_shell=False):
    app = FastAPI()
    register_spa(app, str(dist), reload_shell=reload_shell)
    return app


@pytest_asyncio.fixture
async def client(tmp_path):
    async with AsyncClient(transport=ASGITransport(app=make_app(make_dist(tmp_path))),
                           base_url="http://test") as c:
        yield c


# --- walkthrough DB plumbing (JSONB has no SQLite visitor; hand-create) -----

@pytest_asyncio.fixture
async def walkthrough_session_factory(monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE walkthroughs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug VARCHAR(150) NOT NULL UNIQUE,
                title VARCHAR(255) NOT NULL,
                subtitle VARCHAR(255),
                level VARCHAR(100),
                mission_type VARCHAR(50) NOT NULL,
                objectives JSON,
                content JSON NOT NULL,
                display_order INTEGER NOT NULL,
                thumbnail_url VARCHAR(255),
                rewards JSON,
                available_after VARCHAR(255)
            )
        """))
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    monkeypatch.setattr(seo_head, "AsyncSessionLocal", factory)
    yield factory
    await engine.dispose()


class _RaisingSession:
    """Session factory stand-in proving a code path never touches the DB."""

    def __call__(self):
        raise AssertionError("DB was touched")


async def seed_walkthrough(factory, *, slug, title, mission_type="main-story",
                           level=None, thumbnail_url=None, content=None):
    async with factory() as session:
        w = WalkthroughModel(
            slug=slug, title=title, mission_type=mission_type, level=level,
            thumbnail_url=thumbnail_url, content=content or [PLAIN_BLOCK],
            display_order=1,
        )
        session.add(w)
        await session.commit()
        await session.refresh(w)
        return w


# --- static heads ------------------------------------------------------------

async def test_level_page_head(client):
    r = await client.get('/levels/great-desert')
    assert r.status_code == 200
    assert f'<title data-seo="server">All 188 Great Desert Collectibles{SUFFIX}</title>' in r.text
    expected = SEO['levels']['great-desert']['description'].replace('&', '&amp;').replace("'", '&#x27;')
    assert f'name="description" content="{expected}"' in r.text
    assert 'href="https://stellarbladeguide.com/levels/great-desert"' in r.text


async def test_type_page_head(client):
    r = await client.get('/collectibles/passcodes')
    assert r.status_code == 200
    assert f'<title data-seo="server">All 26 Passcode Locations{SUFFIX}</title>' in r.text
    assert SEO['types']['collectibles']['passcodes']['description'] in r.text


async def test_home_head(client):
    r = await client.get('/')
    assert r.status_code == 200
    # Empty title in the JSON means the bare site name, no suffix.
    assert '<title data-seo="server">Stellar Blade Guide</title>' in r.text
    assert 'href="https://stellarbladeguide.com/"' in r.text


async def test_index_and_pages_heads(client):
    r = await client.get('/walkthroughs')
    escaped_title = SEO['index']['/walkthroughs']['title'].replace('&', '&amp;')
    assert f'<title data-seo="server">{escaped_title}{SUFFIX}</title>' in r.text
    r = await client.get('/blood-rain')
    assert 'property="og:type" content="article"' in r.text
    assert '-w1200.webp' in r.text  # blood-rain hero runs through the og transform


async def test_walkthrough_list_head_uses_countless_variant(client):
    r = await client.get('/walkthroughs/main-story')
    assert f'<title data-seo="server">Main Story Walkthroughs{SUFFIX}</title>' in r.text
    assert 'Complete Main Story walkthroughs for Stellar Blade. Detailed guides' in r.text


async def test_escaping(client):
    r = await client.get('/cosmetics/nano-suits')
    assert f'All 126 Nano Suits &amp; How to Unlock{SUFFIX}' in r.text
    assert 'sort A–Z' in r.text  # en dash survives as UTF-8
    r = await client.get('/levels/great-desert')
    assert 'Stellar Blade&#x27;s second open region' in r.text


async def test_tag_order_and_splice(client):
    r = await client.get('/collectibles/passcodes')
    expected = seo_head.render_head(seo_head.resolve_static_head('/collectibles/passcodes'))
    assert expected in r.text
    for i, marker in enumerate(['<title', 'name="description"', 'rel="canonical"',
                                'og:type', 'og:title', 'og:description', 'og:url',
                                'og:image', 'og:site_name', 'twitter:card']):
        assert r.text.index(marker) < r.text.index('twitter:image'), marker
    assert r.text.count('data-seo="server"') == 13


async def test_cross_category_type_gets_404_head(client):
    # The client 404s /materials/passcodes (wrong category); the head must too.
    r = await client.get('/materials/passcodes')
    assert f'<title data-seo="server">404 Page Not Found{SUFFIX}</title>' in r.text
    assert 'content="noindex, nofollow"' in r.text


async def test_unknown_path_mirrors_error_page(client):
    r = await client.get('/definitely-not-a-page')
    assert r.status_code == 200
    assert f'<title data-seo="server">404 Page Not Found{SUFFIX}</title>' in r.text
    assert "doesn&#x27;t exist or has been moved." in r.text
    assert 'content="noindex, nofollow"' in r.text
    assert 'rel="canonical"' not in r.text
    assert 'og:url' not in r.text


async def test_hostile_path_never_reflected(client):
    hostile = '/%22%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E'
    r = await client.get(hostile)
    assert r.status_code == 200
    assert 'alert(1)' not in r.text
    assert '"><script>' not in r.text
    assert f'<title data-seo="server">404 Page Not Found{SUFFIX}</title>' in r.text


async def test_noindex_routes(client):
    r = await client.get('/login')
    assert f'<title data-seo="server">Login{SUFFIX}</title>' in r.text
    assert 'content="noindex, nofollow"' in r.text
    r = await client.get('/levels/nest')
    assert 'content="noindex, nofollow"' not in r.text


async def test_case_and_trailing_slash_normalized(client):
    r = await client.get('/Levels/Great-Desert/')
    assert f'<title data-seo="server">All 188 Great Desert Collectibles{SUFFIX}</title>' in r.text
    # Canonical comes from the matched key, never the raw path casing.
    assert 'href="https://stellarbladeguide.com/levels/great-desert"' in r.text
    assert 'Great-Desert' not in r.text


# --- walkthrough detail heads ------------------------------------------------

async def test_walkthrough_boss_head(client, walkthrough_session_factory):
    await seed_walkthrough(walkthrough_session_factory, slug='the-mission',
                           title="Orcal's Testimony", level='Xion', content=[BOSS_BLOCK])
    r = await client.get('/walkthroughs/main-story/the-mission')
    assert f'<title data-seo="server">Orcal&#x27;s Testimony Walkthrough{SUFFIX}</title>' in r.text
    assert 'walkthrough for Stellar Blade (Xion). Step-by-step guide with screenshots, tips, and boss strategies.' in r.text
    # Canonical is built from the matched type key + the row's slug.
    assert 'href="https://stellarbladeguide.com/walkthroughs/main-story/the-mission"' in r.text


async def test_walkthrough_no_boss_no_level(client, walkthrough_session_factory):
    await seed_walkthrough(walkthrough_session_factory, slug='calm-quest',
                           title='Calm Quest', mission_type='side-quest')
    r = await client.get('/walkthroughs/side-quests/calm-quest')
    assert f'<title data-seo="server">Calm Quest Walkthrough{SUFFIX}</title>' in r.text
    assert 'Calm Quest walkthrough for Stellar Blade. Step-by-step guide with screenshots and tips.' in r.text


async def test_walkthrough_og_image_sources(client, walkthrough_session_factory):
    await seed_walkthrough(
        walkthrough_session_factory, slug='with-thumb', title='With Thumb',
        thumbnail_url='https://img.stellarbladeguide.com/stellar-blade/walkthroughs/x/thumb.webp')
    r = await client.get('/walkthroughs/main-story/with-thumb')
    assert 'content="https://img.stellarbladeguide.com/stellar-blade/walkthroughs/x/thumb-w1200.webp"' in r.text

    await seed_walkthrough(walkthrough_session_factory, slug='content-img',
                           title='Content Img', content=[PLAIN_BLOCK, IMAGE_BLOCK])
    r = await client.get('/walkthroughs/main-story/content-img')
    assert 'content="https://img.stellarbladeguide.com/stellar-blade/walkthroughs/x/shot-w1200.webp"' in r.text

    await seed_walkthrough(walkthrough_session_factory, slug='no-img', title='No Img')
    r = await client.get('/walkthroughs/main-story/no-img')
    assert f'content="{SEO["site"]["defaultImage"]}"' in r.text  # default banner, raw


async def test_walkthrough_cache_hit_skips_db(client, monkeypatch):
    row = {**{k: None for k in ('subtitle', 'level', 'thumbnail_url', 'available_after',
                                'objectives', 'rewards')},
           'id': 1, 'slug': 'cached', 'title': 'Cached', 'mission_type': 'main-story',
           'display_order': 1, 'content': [PLAIN_BLOCK]}
    await set_cache('walkthrough:main-story:cached', row, ttl=60)
    monkeypatch.setattr(seo_head, 'AsyncSessionLocal', _RaisingSession())
    r = await client.get('/walkthroughs/main-story/cached')
    assert f'<title data-seo="server">Cached Walkthrough{SUFFIX}</title>' in r.text


async def test_walkthrough_cache_write_matches_api_shape(client, walkthrough_session_factory):
    row = await seed_walkthrough(walkthrough_session_factory, slug='warm-me', title='Warm Me')
    await client.get('/walkthroughs/main-story/warm-me')
    cached = await get_cache('walkthrough:main-story:warm-me')
    assert cached == _serialize_full(row)


async def test_walkthrough_negative_cache(client, walkthrough_session_factory, monkeypatch):
    r = await client.get('/walkthroughs/main-story/never-existed')
    assert f'404 Page Not Found{SUFFIX}' in r.text
    assert await get_cache('walkthrough:miss:main-story:never-existed')
    # Second request is served from the miss key — the DB must not be touched.
    monkeypatch.setattr(seo_head, 'AsyncSessionLocal', _RaisingSession())
    r = await client.get('/walkthroughs/main-story/never-existed')
    assert f'404 Page Not Found{SUFFIX}' in r.text


async def test_db_failure_serves_loading_variant_and_no_miss_key(client, monkeypatch):
    monkeypatch.setattr(seo_head, 'AsyncSessionLocal', _RaisingSession())
    r = await client.get('/walkthroughs/main-story/some-mission')
    assert r.status_code == 200
    assert f'<title data-seo="server">Main Story Walkthrough{SUFFIX}</title>' in r.text
    assert 'Main Story walkthrough for Stellar Blade. Step-by-step guide with screenshots and tips.' in r.text
    # A failure must never negative-cache the slug.
    assert await get_cache('walkthrough:miss:main-story:some-mission') is None


async def test_unknown_type_gate(client, monkeypatch):
    monkeypatch.setattr(seo_head, 'AsyncSessionLocal', _RaisingSession())
    # Prod (DEBUG off): unknown mission types never reach the DB.
    monkeypatch.setattr(seo_head.settings, 'DEBUG', False)
    r = await client.get('/walkthroughs/bogus-type/foo')
    assert f'404 Page Not Found{SUFFIX}' in r.text
    # DEBUG bypass (the e2e fixture type): the lookup runs; with the DB down it
    # degrades to the loading-variant head with a title-cased type name.
    monkeypatch.setattr(seo_head.settings, 'DEBUG', True)
    r = await client.get('/walkthroughs/bogus-type/foo')
    assert f'<title data-seo="server">Bogus Type Walkthrough{SUFFIX}</title>' in r.text
    assert 'rel="canonical"' not in r.text  # unknown type: no canonical, ever


# --- response mechanics ------------------------------------------------------

async def test_etag_and_304(client):
    r1 = await client.get('/levels/nest')
    r2 = await client.get('/levels/nest')
    etag = r1.headers['etag']
    assert etag == r2.headers['etag']
    other = await client.get('/levels/xion')
    assert other.headers['etag'] != etag

    r = await client.get('/levels/nest', headers={'If-None-Match': etag})
    assert r.status_code == 304
    assert r.headers['etag'] == etag
    r = await client.get('/levels/nest', headers={'If-None-Match': f'W/{etag}'})
    assert r.status_code == 304
    r = await client.get('/levels/nest', headers={'If-None-Match': '"nope"'})
    assert r.status_code == 200


async def test_head_method(client):
    get = await client.get('/levels/nest')
    head = await client.request('HEAD', '/levels/nest')
    assert head.status_code == 200
    assert head.headers['etag'] == get.headers['etag']
    assert head.headers['content-length'] == get.headers['content-length']
    assert head.content == b''


async def test_marker_absent_serves_legacy_shell(tmp_path):
    dist = make_dist(tmp_path, marker=False)
    async with AsyncClient(transport=ASGITransport(app=make_app(dist)),
                           base_url="http://test") as c:
        r = await c.get('/levels/great-desert')
        assert r.status_code == 200
        assert 'data-seo' not in r.text


async def test_reload_shell_rereads_per_request(tmp_path):
    dist = make_dist(tmp_path)
    async with AsyncClient(transport=ASGITransport(app=make_app(dist, reload_shell=True)),
                           base_url="http://test") as c:
        r1 = await c.get('/levels/nest')
        assert 'rebuilt-shell' not in r1.text
        (dist / 'index.html').write_text(SHELL.replace('<main id="root">', '<main id="root" data-x="rebuilt-shell">'),
                                         encoding='utf-8')
        r2 = await c.get('/levels/nest')
        assert 'rebuilt-shell' in r2.text
        assert 'data-seo="server"' in r2.text


async def test_api_paths_still_404(client):
    r = await client.get('/api/nope')
    assert r.status_code == 404
    assert 'data-seo' not in r.text


async def test_real_files_bypass_injection(client):
    r = await client.get('/robots.txt')
    assert r.status_code == 200
    assert r.text == 'User-agent: *\n'


# --- data contract -----------------------------------------------------------

def test_seo_json_sections_complete():
    assert set(SEO) == {'site', 'home', 'index', 'levels', 'types',
                        'walkthroughTypes', 'pages', 'noindex', 'notFound'}
    assert len(SEO['index']) == 6
    assert len(SEO['levels']) == 10
    assert {k: len(v) for k, v in SEO['types'].items()} == {
        'collectibles': 5, 'upgrades': 7, 'cosmetics': 7, 'materials': 2}
    assert len(SEO['walkthroughTypes']) == 5
    assert len(SEO['pages']) == 4
    assert len(SEO['noindex']) == 7
    for section in ('levels',):
        for entry in SEO[section].values():
            assert entry['title'] and entry['description'] and entry['image']
    for cat in SEO['types'].values():
        for entry in cat.values():
            assert entry['title'] and entry['description'] and entry['image']


def test_og_image_url_mirrors_client_rule():
    assert seo_head._og_image_url(
        'https://img.stellarbladeguide.com/stellar-blade/x/y.webp'
    ) == 'https://img.stellarbladeguide.com/stellar-blade/x/y-w1200.webp'
    assert seo_head._og_image_url('https://example.com/other.png') == 'https://example.com/other.png'


def test_os_path_seam_exists():
    # The JSON ships inside the image via the Dockerfile COPY; this pins the
    # path shape the server resolves (client/src/constants relative to app/).
    assert seo_head.SEO_JSON_PATH.endswith(os.path.join('client', 'src', 'constants', 'seo.json'))
