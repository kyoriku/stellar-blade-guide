"""A URL segment that isn't printable text gets a 404 before any lookup
(app/core/segments.py).

Postgres refuses a NUL in a text parameter, so a NUL in a level, type or walkthrough
segment was a 500, and on a page path os.path.realpath raised before the head was
built. SQLite, the test database, accepts NUL, so the API checks run against a
session that fails the moment it is queried: reaching the database is the failure.
Control characters are built with chr() so none sits in this file as a literal.
"""

from __future__ import annotations

import sys
import unicodedata
from pathlib import Path

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


# Row for row with client/src/utils/textPath.test.ts, decoded as uvicorn hands them over.
CONTROL_CHARACTERS = [chr(0x0A), chr(0x0D), chr(0x0D) + chr(0x0A), chr(0x09), chr(0x0B), chr(0x0C), chr(0x1C),
                      chr(0x1D), chr(0x1E), chr(0x1F), NUL, DEL, chr(0x85), chr(0x2028), chr(0x2029)]


@pytest.mark.parametrize("path", ["/levels/eidos-7", "/", "/Jos" + chr(0xE9), "/" + chr(0x4F60) + chr(0x597D),
                                  "/a b", "/" + chr(0xFFFD)])
def test_a_printable_path_as_the_client_reads_it(path):
    assert is_text_segment(path)


@pytest.mark.parametrize("control", CONTROL_CHARACTERS)
@pytest.mark.parametrize("shape", ["/levels{}", "/lev{}els", "/{}", "/levels/eidos-7{}"])
def test_a_control_character_anywhere_in_the_path(shape, control):
    assert not is_text_segment(shape.format(control))


@pytest.mark.parametrize("path", ["/a" + chr(0xA0) + "b", "/a" + chr(0x200B) + "b", "/a" + chr(0xAD) + "b",
                                  "/a" + chr(0xFEFF) + "b", "/" + chr(0xFEFF)])
def test_an_invisible_character_in_the_path(path):
    assert not is_text_segment(path)


@pytest.mark.parametrize("path", ["/levels/" + chr(0xFFFD), "/100%", "/%", "/levels/" + chr(0xFFFD) + "%A"])
def test_an_escape_that_does_not_decode(path):
    # uvicorn decodes a run of escapes as UTF-8, with U+FFFD where the bytes don't form a
    # character, and leaves a % that starts no escape as it is, as the client does:
    # /levels/%E2%80 and /levels/%E0%A4%A arrive as the first and last here.
    assert is_text_segment(path)


def test_a_line_break_beside_an_escape_that_does_not_decode():
    # /lev%0Aels%: a stray % doesn't stop the %0A decoding, on either side.
    assert not is_text_segment("/lev" + chr(0x0A) + "els%")


CLIENT_RULE = Path(__file__).resolve().parents[2] / "client" / "src" / "utils" / "textPath.ts"


def test_the_client_mirrors_the_text_rule():
    # A missing file or a changed line fails here; nothing is skipped.
    lines = CLIENT_RULE.read_text(encoding="utf-8").splitlines()
    assert r"const UNPRINTABLE = /(?! )[\p{C}\p{Z}]/u" in lines
    # Bytes that don't form UTF-8 read as U+FFFD (not fatal), and a BOM stays, as unquote does.
    assert "const UTF8_DECODER = new TextDecoder('utf-8', { ignoreBOM: true })" in lines
    assert "  return !UNPRINTABLE.test(decodePath(pathname))" in lines
    # That class is the server's rule: nothing in the categories Other or Separator but the space.
    assert all(is_text_segment(chr(cp)) == (cp == 0x20 or unicodedata.category(chr(cp))[0] not in "CZ")
               for cp in range(sys.maxunicode + 1))


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
    "/levels/eidos-7%0A",  # the catch-all leaves a trailing newline out of full_path
    "/LEVELS%0A",          # no 301 to /levels
])
async def test_page_path_gets_the_404_page(spa_client, path):
    # The path guard answers these first (test_path_guard.py); the catch-all gives the same page.
    r = await spa_client.get(path)
    assert r.status_code == 404
    assert '<title data-seo="server">404 Page Not Found | Stellar Blade Guide</title>' in r.text
    assert 'content="noindex, nofollow"' in r.text
