"""
Access-log hardening tests (app/middleware/logging.py).

Everything the logger copies from the request — path, User-Agent, client IP — is
attacker-controlled and lands on one stdout line that Railway ingests. An ESC byte
would inject ANSI sequences into the stream and a NEL / U+2028-style line break
would forge a second access line (Starlette already drops tab, CR and LF from the
path via urlsplit, nothing else), so each field is run through sanitize_log_field first.
These tests pin that neutralisation, the length caps, and the `(reason)` suffix
that names which layer answered a 404.

The `api` logger has propagate=False in production (core/logging.py); the fixture
forces it back on so caplog's root handler sees the lines. Following the house
pattern, each test builds a bare app with only the layers under test, logging
outermost as in main.py.
"""
import logging

import pytest
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from httpx import ASGITransport, AsyncClient

import app.middleware.origin_check as origin_check_module
from app.config.settings import settings
from app.middleware.bot_filter import add_bot_filter_middleware
from app.middleware.logging import (
    LOG_IP_MAX, LOG_PATH_MAX, LOG_UA_MAX, add_logging_middleware, sanitize_log_field,
)
from app.middleware.origin_check import add_origin_check_middleware
from app.seo_head import MARKER, register_spa

# An ANSI sequence the colours module never emits itself (clear screen), so its
# absence from a line is meaningful even though the line carries colour codes.
ANSI_PROBE = "\x1b[2J"


# ── sanitize_log_field (pure) ────────────────────────────────────────────────

def test_printable_text_passes_through():
    assert sanitize_log_field("/api/auth ORDER BY 1-- -/", 256) == "/api/auth ORDER BY 1-- -/"


def test_newline_becomes_two_literal_characters():
    out = sanitize_log_field("/api/x\nforged", 256)
    assert out == "/api/x\\nforged"
    assert "\n" not in out


def test_ansi_escape_is_neutralised():
    out = sanitize_log_field("Firefox/1.0" + ANSI_PROBE, 48)
    assert out == "Firefox/1.0\\x1b[2J"
    assert "\x1b" not in out


def test_unicode_line_separators_are_neutralised():
    # Not ASCII controls, but still line breaks to some viewers.
    assert sanitize_log_field("a\u2028b\x85c", 32) == "a\\u2028b\\x85c"


def test_over_limit_is_truncated_with_marker():
    assert sanitize_log_field("a" * 300, 256) == "a" * 256 + "…"


def test_at_limit_is_not_truncated():
    assert sanitize_log_field("a" * 256, 256) == "a" * 256


# ── harness ──────────────────────────────────────────────────────────────────

def _app_with(*inner_layers):
    """Bare app: the given layers inside, logging outermost (as in main.py), and
    a catch-all GET route answering 200 for anything that reaches it."""
    app = FastAPI()
    for add in inner_layers:  # registered first = innermost
        add(app)
    add_logging_middleware(app)

    @app.api_route("/{full_path:path}", methods=["GET"])
    async def catch_all(full_path: str):
        return JSONResponse({"ok": True})

    return app


def _client(app):
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


@pytest.fixture
def api_log(caplog):
    api_logger = logging.getLogger("api")
    previous = api_logger.propagate
    api_logger.propagate = True
    with caplog.at_level(logging.INFO, logger="api"):
        yield caplog
    api_logger.propagate = previous


def _access_lines(caplog):
    # bot_filter also warns on the `api` logger ("Blocked referer ..."); access
    # lines are the ones carrying the fixed-width separator.
    return [rec.getMessage() for rec in caplog.records if rec.name == "api" and " → " in rec.getMessage()]


async def _asgi_get(app, path: str):
    """Drive the app with a hand-built ASGI scope.

    uvicorn sets scope["path"] to the percent-DECODED target, so `%C2%85` on the
    wire arrives as a real U+0085. Handing the app that decoded scope directly
    keeps the test independent of whatever an HTTP client library chooses to
    normalise away on its side.
    """
    scope = {
        "type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1",
        "method": "GET", "scheme": "http", "path": path, "raw_path": path.encode(),
        "query_string": b"", "root_path": "",
        "headers": [(b"host", b"test")],
        "client": ("127.0.0.1", 1234), "server": ("test", 80),
    }
    sent = []

    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(message):
        sent.append(message)

    await app(scope, receive, send)
    return sent


# ── neutralisation on the wire ───────────────────────────────────────────────

async def test_path_line_breaks_cannot_forge_a_second_line(api_log):
    # request.url.path is built through urlsplit(), which already drops \t \r \n.
    # Every other line break that str.splitlines() honours (VT, FF, NEL, U+2028/9)
    # survives percent-decoding and is what the sanitiser has to catch.
    await _asgi_get(_app_with(), "/api/x\nforged\x85again\u2028more")
    (line,) = _access_lines(api_log)
    assert len(line.splitlines()) == 1
    assert "forged\\x85again\\u2028more" in line


async def test_user_agent_escape_byte_is_neutralised(api_log):
    async with _client(_app_with()) as c:
        # /api/auth prefix => the UA is appended even on a 200
        await c.get("/api/auth/refresh", headers={"user-agent": "Firefox/1.0" + ANSI_PROBE + "evil"})
    (line,) = _access_lines(api_log)
    assert "UA: Firefox/1.0\\x1b[2Jevil" in line
    assert ANSI_PROBE not in line


async def test_client_ip_header_is_neutralised_and_capped(api_log):
    # Header-derived, and the outer logger writes the line even for requests that
    # origin_check rejects — so the IP column is as untrusted as the path.
    async with _client(_app_with()) as c:
        await c.get("/api/health", headers={"cf-connecting-ip": "1.2.3.4" + ANSI_PROBE + "9" * 60})
    (line,) = _access_lines(api_log)
    ip_field = line.split(" · ")[1].split(" → ")[0]
    assert ip_field.startswith("1.2.3.4\\x1b[2J")
    assert ip_field.endswith("…")
    assert len(ip_field) == LOG_IP_MAX + 1
    assert ANSI_PROBE not in line


async def test_overlong_path_and_ua_are_capped(api_log):
    long_path = "/api/auth/" + "a" * 600
    long_ua = "Chrome/" + "1" * 100
    async with _client(_app_with()) as c:
        await c.get(long_path, headers={"user-agent": long_ua})
    (line,) = _access_lines(api_log)
    assert f"| {long_path[:LOG_PATH_MAX]}… |" in line
    assert long_path not in line
    assert f"UA: {long_ua[:LOG_UA_MAX]}…" in line


async def test_unhandled_exception_line_is_sanitised(api_log):
    app = FastAPI()
    add_logging_middleware(app)

    @app.get("/api/boom{rest:path}")
    async def boom(rest: str):
        # An exception message that echoes request input is the same class of
        # thing as the path itself.
        raise RuntimeError("bad segment: " + rest)

    async with _client(app) as c:
        with pytest.raises(RuntimeError):
            await c.get("/api/boom%1B[2J")
    (line,) = [rec.getMessage() for rec in api_log.records if rec.levelno == logging.ERROR]
    assert "/api/boom\\x1b[2J | unhandled exception: bad segment: \\x1b[2J" in line
    assert ANSI_PROBE not in line


# ── (reason) suffix: which layer answered ────────────────────────────────────

async def test_successful_request_has_no_reason_suffix(api_log):
    async with _client(_app_with()) as c:
        await c.get("/api/auth/refresh")
    (line,) = _access_lines(api_log)
    assert "UA:" in line
    assert "(" not in line.split("UA:")[1]


async def test_origin_check_rejection_names_itself(api_log, monkeypatch):
    monkeypatch.setattr(settings, "DEBUG", False)
    monkeypatch.setattr(origin_check_module, "ORIGIN_SECRET", "test-secret")
    async with _client(_app_with(add_origin_check_middleware)) as c:
        r = await c.get("/api/collectibles/")
    assert r.status_code == 404
    (line,) = _access_lines(api_log)
    assert "(origin-secret)" in line


async def test_bot_filter_referer_rejection_names_itself(api_log, monkeypatch):
    monkeypatch.setattr(settings, "DEBUG", False)
    async with _client(_app_with(add_bot_filter_middleware)) as c:
        r = await c.get("/api/collectibles/", headers={"referer": "https://evil.example/"})
    assert r.status_code == 404
    (line,) = _access_lines(api_log)
    assert "(referer)" in line


async def test_spa_catch_all_unknown_api_path_names_itself(api_log, tmp_path):
    # The catch-all's unknown-/api/ branch is a route-level 404 that would
    # otherwise be indistinguishable from origin_check's in the log.
    dist = tmp_path / "dist"
    dist.mkdir()
    (dist / "index.html").write_text(
        f'<!doctype html>\n<html>\n<head>\n  {MARKER}\n</head>\n<body><main id="root"></main></body>\n</html>\n',
        encoding="utf-8",
    )
    app = FastAPI()
    add_logging_middleware(app)
    register_spa(app, str(dist))
    async with _client(app) as c:
        r = await c.get("/api/nope")
    assert r.status_code == 404
    (line,) = _access_lines(api_log)
    assert "(no-route)" in line
