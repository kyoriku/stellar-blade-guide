"""A path that isn't printable text is refused before any layer below reads it
(app/middleware/path_guard.py).

The bot filter and the outer layers read request.url.path, which urlsplit rebuilds without tab,
CR or LF, while the router matches the decoded path itself. So an embedded newline missed the
SPA catch-all (FastAPI's own JSON 404), a trailing one gave every page and every route ending in
literal text or an id a second spelling, and the bot filter answered the other characters with
its own JSON, judging a tab or CR by a path the router never saw. These run the real layers in
main.py's order with DEBUG off, as in production; the last test imports app.main itself.
"""

from __future__ import annotations

import json
import logging
import os
import subprocess
import sys
from pathlib import Path

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app import seo_head
from app.config.settings import REQUIRED_IN_PRODUCTION, settings
from app.db.database import get_db
from app.middleware import origin_check
from app.middleware.bot_filter import add_bot_filter_middleware
from app.middleware.error_handler import add_error_handler_middleware
from app.middleware.logging import add_logging_middleware
from app.middleware.origin_check import add_origin_check_middleware
from app.middleware.path_guard import add_path_guard_middleware
from app.middleware.rate_limit import setup_rate_limiter
from app.middleware.security_headers import add_security_headers_middleware
from app.routers.collectibles import collectibles_router, levels_router
from app.routers.walkthroughs import router as walkthroughs_router
from app.seo_head import MARKER, register_spa

SERVER = Path(__file__).resolve().parents[1]
SECRET = "path-guard-secret"
HEADERS = {"x-origin-secret": SECRET, "cf-connecting-ip": "203.0.113.7", "referer": "https://stellarbladeguide.com/"}
NOT_FOUND_TITLE = '<title data-seo="server">404 Page Not Found | Stellar Blade Guide</title>'
SHELL = (
    '<!doctype html>\n<html>\n<head>\n'
    '  <meta charset="UTF-8" />\n'
    f'  {MARKER}\n'
    '</head>\n<body><main id="root"></main></body>\n</html>\n'
)

# Percent-encoded, as they arrive: tab, NUL, DEL, US and every line break Python knows.
CHARACTERS = {
    "LF": "%0A", "CR": "%0D", "CRLF": "%0D%0A", "TAB": "%09", "VT": "%0B", "FF": "%0C",
    "FS": "%1C", "GS": "%1D", "RS": "%1E", "US": "%1F", "NUL": "%00", "DEL": "%7F",
    "NEL": "%C2%85", "LS": "%E2%80%A8", "PS": "%E2%80%A9",
}
PAGE_PATHS = [
    "/{c}", "/levels{c}", "/lev{c}els", "/levels{c}/eidos-7", "/levels/eidos-7{c}",
    "/LEVELS{c}",                              # no 301 to /levels
    "/walkthroughs/side-quest/calm-quest{c}",  # no 301 carrying the character
    "/robots.txt{c}", "/assets/index.js{c}",   # no file, and no file's cache header
]
API_PATHS = [
    "/api/probe{c}", "/api/pro{c}be", "/api/collectibles/{c}", "/api/walkthroughs/{c}",
    "/api/levels/eidos-7{c}", "/api/levels/eid{c}os-7",
]


class _UntouchableSession:
    async def execute(self, *args, **kwargs):
        raise AssertionError("the route queried the database")


class _NoSessions:
    def __call__(self):
        raise AssertionError("the page path queried the database")


def _app(dist: Path) -> FastAPI:
    app = FastAPI()
    setup_rate_limiter(app)
    for router in (levels_router, collectibles_router, walkthroughs_router):
        app.include_router(router, prefix="/api")

    @app.get("/api/probe")
    async def probe():
        return {"ok": True}

    async def no_db():
        yield _UntouchableSession()

    app.dependency_overrides[get_db] = no_db
    # main.py's order, inner to outer, and the SPA registered after the layers, as main.py does.
    add_bot_filter_middleware(app)
    add_path_guard_middleware(app)
    add_origin_check_middleware(app)
    add_error_handler_middleware(app)
    add_security_headers_middleware(app)
    add_logging_middleware(app)
    register_spa(app, str(dist), reload_shell=False)
    return app


@pytest_asyncio.fixture
async def client(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "DEBUG", False)
    monkeypatch.setattr(origin_check, "ORIGIN_SECRET", SECRET)
    monkeypatch.setattr(seo_head, "AsyncSessionLocal", _NoSessions())
    dist = tmp_path / "dist"
    dist.mkdir()
    (dist / "index.html").write_text(SHELL, encoding="utf-8")
    (dist / "robots.txt").write_text("User-agent: *\n", encoding="utf-8")
    (dist / "assets").mkdir()  # register_spa mounts it, as in production
    (dist / "assets" / "index.js").write_text("export {}\n", encoding="utf-8")
    async with AsyncClient(transport=ASGITransport(app=_app(dist)), base_url="http://test", headers=HEADERS) as c:
        yield c


@pytest.fixture
def api_log(caplog):
    api_logger = logging.getLogger("api")
    previous = api_logger.propagate
    api_logger.propagate = True
    with caplog.at_level(logging.INFO, logger="api"):
        yield caplog
    api_logger.propagate = previous


def _access_lines(caplog):
    return [rec.getMessage() for rec in caplog.records if rec.name == "api" and " → " in rec.getMessage()]


@pytest.mark.parametrize("escape", CHARACTERS.values(), ids=CHARACTERS.keys())
@pytest.mark.parametrize("path", PAGE_PATHS)
async def test_a_page_path_holding_one_gets_the_404_page(client, path, escape):
    r = await client.get(path.format(c=escape))
    assert (r.status_code, r.headers["content-type"], r.headers["cache-control"]) == (
        404, "text/html; charset=utf-8", "no-store")
    assert NOT_FOUND_TITLE in r.text
    assert 'content="noindex, nofollow"' in r.text
    assert 'rel="canonical"' not in r.text
    assert "location" not in r.headers


async def test_head_gets_the_404_page_without_its_body(client):
    get, head = await client.get("/levels%0A"), await client.head("/levels%0A")
    assert (head.status_code, head.content) == (404, b"")
    assert head.headers["content-length"] == get.headers["content-length"]


@pytest.mark.parametrize("escape", CHARACTERS.values(), ids=CHARACTERS.keys())
@pytest.mark.parametrize("path", API_PATHS)
async def test_an_api_path_holding_one_gets_the_json_404(client, api_log, path, escape):
    r = await client.get(path.format(c=escape))
    assert (r.status_code, r.json(), r.headers["cache-control"]) == (404, {"detail": "Not Found"}, "no-store")
    (line,) = _access_lines(api_log)
    assert "(unprintable-path)" in line


@pytest.mark.parametrize("path", ["/api%09/levels/eidos-7", "/api%0D/levels/eidos-7", "/%0Aapi/levels/eidos-7",
                                  "/api%0A", "/%0Aapi"])
async def test_one_whose_cleaned_path_is_under_the_api_gets_the_json_404(client, path):
    # The cleaned spelling decides the access line and X-Robots-Tag, so the answer is the API's.
    r = await client.get(path)
    assert (r.status_code, r.json(), r.headers["cache-control"]) == (404, {"detail": "Not Found"}, "no-store")


async def test_one_under_the_api_by_neither_spelling_gets_the_404_page(client):
    r = await client.get("/api%0B/levels/eidos-7")
    assert (r.status_code, r.headers["cache-control"]) == (404, "no-store")
    assert NOT_FOUND_TITLE in r.text


@pytest.mark.parametrize("path", ["/levels%0A", "/levels%0D", "/api/probe%0A"])
async def test_any_other_method_gets_the_json_404(client, path):
    r = await client.post(path)
    assert (r.status_code, r.json()) == (404, {"detail": "Not Found"})


async def test_a_printable_path_is_left_to_the_layers_below(client):
    r = await client.get("/levels/eidos-7")
    assert r.status_code == 200
    assert 'rel="canonical" href="https://stellarbladeguide.com/levels/eidos-7"' in r.text
    r = await client.get("/api/probe")
    assert (r.status_code, r.json()) == (200, {"ok": True})
    r = await client.get("/levels/eidos_7")  # the bot filter's own answer
    assert (r.status_code, r.json()) == (404, {"error": "Not Found"})
    r = await client.get("/UPGRADES/weapon-cores")
    assert (r.status_code, r.headers["location"]) == (301, "/upgrades/weapon-cores")
    r = await client.get("/walkthroughs/side-quest/a%3Fb")  # the bot filter reads the cleaned path
    assert (r.status_code, r.headers["location"]) == (301, "/walkthroughs/side-quests/a%3Fb")


@pytest.mark.parametrize("reload_shell", [False, True])
@pytest.mark.parametrize("range_header", ["bytes=0-10", "bytes=0-1,3-4", "bytes=999999-", "junk"])
async def test_the_404_page_without_the_head_marker_ignores_a_range(tmp_path, monkeypatch, reload_shell, range_header):
    # A shell with no marker is served whole: a FileResponse would answer a Range with a 206.
    monkeypatch.setattr(settings, "DEBUG", False)
    dist = tmp_path / "dist"
    dist.mkdir()
    (dist / "index.html").write_text(SHELL.replace(MARKER, ""), encoding="utf-8")
    app = FastAPI()
    add_path_guard_middleware(app)
    add_security_headers_middleware(app)
    register_spa(app, str(dist), reload_shell=reload_shell)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.get("/levels%0A", headers={"range": range_header})
    assert (r.status_code, r.headers["cache-control"]) == (404, "no-store")
    assert "content-range" not in r.headers


async def test_the_guard_runs_with_debug_on(client, api_log, monkeypatch):
    # DEBUG turns the origin check and the bot filter off, never the guard.
    monkeypatch.setattr(settings, "DEBUG", True)
    r = await client.get("/lev%0Aels")
    assert (r.status_code, r.headers["cache-control"]) == (404, "no-store")
    assert NOT_FOUND_TITLE in r.text
    r = await client.get("/api/probe%0A")
    assert (r.status_code, r.json()) == (404, {"detail": "Not Found"})
    (line,) = _access_lines(api_log)
    assert "(unprintable-path)" in line


# ── app.main itself ──────────────────────────────────────────────────────────

PROBE = """
import asyncio, json, httpx
from app.main import app

async def probe():
    secret = {"x-origin-secret": "probe-origin-secret"}
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://stellarbladeguide.com",
                                 headers={"cf-connecting-ip": "203.0.113.7"}) as client:
        out = []
        for path, headers in (("/levels/eidos-7%0B", secret), ("/api/health%0A", secret),
                              ("/api/collectibles/%0A", secret), ("/.well-known/traffic-advice%0A", secret),
                              ("/levels/eidos-7%0B", {})):
            response = await client.get(path, headers=headers)
            out.append([response.status_code, response.headers.get("content-type", ""), response.text])
    print("RESULT", json.dumps(out))

asyncio.run(probe())
"""


def test_the_app_refuses_one_between_the_origin_check_and_the_bot_filter(tmp_path):
    env = {
        "PATH": os.environ["PATH"],
        "PYTHONPATH": str(SERVER),
        "PYTHON_DOTENV_DISABLED": "1",
        # Production: ENVIRONMENT and DEBUG unset, stand-ins for what it requires. Nothing
        # connects: every probe is answered before a route runs.
        **{name: "stand-in" for name in REQUIRED_IN_PRODUCTION},
        "ORIGIN_SECRET": "probe-origin-secret",
        "DATABASE_URL": "postgresql+asyncpg://probe:probe@127.0.0.1:1/probe",
        "REDIS_URL": "redis://127.0.0.1:1/0",
    }
    result = subprocess.run([sys.executable, "-c", PROBE], cwd=tmp_path, env=env,
                            capture_output=True, text=True, timeout=60)
    assert result.returncode == 0, result.stderr
    (line,) = [out for out in result.stdout.splitlines() if out.startswith("RESULT ")]
    page, health, collectibles, advice, no_secret = json.loads(line.removeprefix("RESULT "))
    # The bot filter would answer {"error": "Not Found"}. With no built client (CI), the guard
    # answers a page path as it answers the API.
    assert page[0] == 404
    if (SERVER.parent / "client" / "dist" / "index.html").is_file():
        assert NOT_FOUND_TITLE in page[2]
    else:
        assert page[2] == '{"detail":"Not Found"}'
    assert health == [404, "application/json", '{"detail":"Not Found"}']
    assert collectibles == [404, "application/json", '{"detail":"Not Found"}']
    assert advice[0] == 404  # a trailing newline gave the route a second spelling
    # Inside the origin check: a request without the secret gets its refusal first.
    assert no_secret == [404, "application/json", '{"error":"Not Found"}']
