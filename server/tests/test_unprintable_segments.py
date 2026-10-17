"""A URL segment that isn't printable text gets the same 404 as an unknown one,
before any lookup (app/core/segments.py).

Postgres refuses a NUL in a text parameter, so a NUL in a level, type or walkthrough
segment was a 500, and on a page path os.path.realpath raised before the head was
built. SQLite, the test database, accepts NUL, so the API checks run against a
session that fails the moment it is queried: reaching the database is the failure.
Control characters are built with chr() so none sits in this file as a literal.
"""

from __future__ import annotations

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app import seo_head
from app.core.segments import is_text_segment
from app.db.database import get_db
from app.middleware.rate_limit import setup_rate_limiter
from app.routers.collectibles import collectibles_router, cosmetics_router, levels_router, upgrades_router
from app.routers.walkthroughs import router as walkthroughs_router
from app.seo_head import MARKER, register_spa

NUL, ESC, DEL = chr(0), chr(0x1B), chr(0x7F)

# Percent-encoded as they arrive: NUL alone, NUL inside a slug, ESC, DEL.
SEGMENTS = ["%00", "eidos%007", "%1b", "%7f"]

# Every API route that takes a level, type or walkthrough segment.
API_PATHS = [
    "/api/levels/{}",
    "/api/collectibles/{}",
    "/api/upgrades/{}",
    "/api/cosmetics/{}",
    "/api/walkthroughs/{}",
    "/api/walkthroughs/main-story/{}",
    "/api/walkthroughs/{}/some-mission",
]


@pytest.mark.parametrize(("value", "printable"), [
    ("eidos-7", True),
    ("Altess Levoire", True),
    ("Jos" + chr(0xE9), True),
    (chr(0x4F60) + chr(0x597D), True),
    ("", True),
    (NUL, False),
    ("eidos" + NUL + "7", False),
    (ESC, False),
    (DEL, False),
    ("a" + chr(0x200B) + "b", False),  # a zero-width space names nothing either
])
def test_is_text_segment(value, printable):
    assert is_text_segment(value) is printable


class _UntouchableSession:
    async def execute(self, *args, **kwargs):
        raise AssertionError("the route queried the database")


def _api_app() -> FastAPI:
    app = FastAPI()
    setup_rate_limiter(app)
    for router in (levels_router, collectibles_router, upgrades_router, cosmetics_router, walkthroughs_router):
        app.include_router(router, prefix="/api")

    async def override_get_db():
        yield _UntouchableSession()

    app.dependency_overrides[get_db] = override_get_db
    return app


@pytest_asyncio.fixture
async def api_client():
    async with AsyncClient(transport=ASGITransport(app=_api_app()), base_url="http://test") as c:
        yield c


@pytest.mark.parametrize("segment", SEGMENTS)
@pytest.mark.parametrize("path", API_PATHS)
async def test_api_route_404s_before_any_lookup(api_client, path, segment):
    r = await api_client.get(path.format(segment))
    assert r.status_code == 404


async def test_a_printable_segment_does_reach_the_database(api_client):
    # The control: a 404 above must not come from a session that was never wired in.
    with pytest.raises(AssertionError, match="queried the database"):
        await api_client.get("/api/levels/nowhere")


# ── Page paths through the SPA fallback ──────────────────────────────────────

SHELL = (
    '<!doctype html>\n<html>\n<head>\n'
    '  <meta charset="UTF-8" />\n'
    f'  {MARKER}\n'
    '</head>\n<body><main id="root"></main></body>\n</html>\n'
)


class _NoSessions:
    def __call__(self):
        raise AssertionError("the page path queried the database")


@pytest_asyncio.fixture
async def spa_client(tmp_path, monkeypatch):
    # A walkthrough head lookup swallows errors into the loading-variant head, which
    # the 404-head assertions below would then catch.
    monkeypatch.setattr(seo_head, "AsyncSessionLocal", _NoSessions())
    dist = tmp_path / "dist"
    dist.mkdir()
    (dist / "index.html").write_text(SHELL, encoding="utf-8")
    app = FastAPI()
    register_spa(app, str(dist), reload_shell=False)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.mark.parametrize("path", [
    "/%00",
    "/levels/%00",
    "/levels/eidos%007",
    "/collectibles/%00",
    "/walkthroughs/main-story/%00",
    "/walkthroughs/main-story/some%1bmission",
])
async def test_page_path_gets_the_404_head(spa_client, path):
    r = await spa_client.get(path)
    assert r.status_code == 200
    assert '<title data-seo="server">404 Page Not Found | Stellar Blade Guide</title>' in r.text
    assert 'content="noindex, nofollow"' in r.text
