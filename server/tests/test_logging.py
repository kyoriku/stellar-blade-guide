"""
Access-log hardening tests (app/middleware/logging.py).

Everything the logger copies from the request — path, User-Agent, client IP — is
attacker-controlled and lands on one stdout line that Railway ingests. An ESC byte
would inject ANSI sequences into the stream and a NEL / U+2028-style line break
would forge a second access line (Starlette already drops tab, CR and LF from the
path via urlsplit, nothing else), so each field is run through sanitize_log_field first.
These tests pin that neutralisation, the length caps, the `(reason)` suffix
that names which layer answered a 404, and the alarm line for an /api/ request
that arrives without a valid CF-Connecting-IP.

The `api` logger has propagate=False in production (core/logging.py); the fixture
forces it back on so caplog's root handler sees the lines. Following the house
pattern, each test builds a bare app with only the layers under test, logging
outermost as in main.py.
"""
import logging
import re
import subprocess
import sys

import pytest
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from httpx import ASGITransport, AsyncClient

import app.middleware.origin_check as origin_check_module
from app.config.settings import settings
from app.core.logging import EMAIL_SHAPE
from app.middleware.bot_filter import add_bot_filter_middleware
from app.middleware.logging import (
    LOG_COLO_MAX, LOG_IP_MAX, LOG_PATH_MAX, LOG_QUERY_MAX, LOG_UA_MAX,
    add_logging_middleware, parse_colo, sanitize_log_field,
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


def _client(app, client=("127.0.0.1", 123)):
    return AsyncClient(transport=ASGITransport(app=app, client=client), base_url="http://test")


@pytest.fixture
def api_log(caplog):
    api_logger = logging.getLogger("api")
    previous = api_logger.propagate
    api_logger.propagate = True
    with caplog.at_level(logging.INFO, logger="api"):
        yield caplog
    api_logger.propagate = previous


ANSI_RE = re.compile(r"\x1b\[[0-9;]*m")


def _strip_ansi(line):
    """Column widths are only comparable with the colour codes removed."""
    return ANSI_RE.sub("", line)


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


def _ip_field(line):
    return line.split(" · ")[1].split(" → ")[0].strip()


async def test_an_invalid_cf_connecting_ip_never_reaches_the_line(api_log):
    # The header is used only when it holds an address; anything else is refused
    # and the connection's client is logged instead.
    async with _client(_app_with()) as c:
        await c.get("/api/health", headers={"cf-connecting-ip": "1.2.3.4" + ANSI_PROBE + "9" * 60})
    (line,) = _access_lines(api_log)
    assert _ip_field(line) == "127.0.0.1"
    assert "\\x1b[2J" not in line  # not even escaped: the value never got this far


async def test_client_ip_from_the_connection_is_neutralised_and_capped(api_log):
    # The fallback is the connection's client: Railway's proxy in production, but in
    # dev, where uvicorn trusts the 127.0.0.1 Vite proxy, the first X-Forwarded-For
    # entry, unvalidated text a client can write. The outer logger writes the line even
    # for requests that origin_check rejects, so the IP column is as untrusted as the path.
    hostile = "1.2.3.4" + ANSI_PROBE + "9" * 60
    async with _client(_app_with(), client=(hostile, 123)) as c:
        await c.get("/api/health")
    (line,) = _access_lines(api_log)
    ip_field = line.split(" · ")[1].split(" → ")[0]
    assert ip_field.startswith("1.2.3.4\\x1b[2J")
    assert ip_field.endswith("…")
    assert len(ip_field) == LOG_IP_MAX + 1
    assert ANSI_PROBE not in line


async def test_a_valid_cf_connecting_ip_is_logged_in_canonical_form(api_log):
    async with _client(_app_with()) as c:
        await c.get("/api/health", headers={"cf-connecting-ip": "2001:DB8:0:0::ABCD"})
    (line,) = _access_lines(api_log)
    assert _ip_field(line) == "2001:db8::abcd"


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


# ── Cloudflare colo column ───────────────────────────────────────────────────
#
# The origin log cannot see edge cache behaviour: a response Cloudflare serves
# never reaches the app. The CF-Ray suffix is the one thing that makes it
# legible after the fact — the same URL arriving repeatedly from the SAME colo
# is eviction, while once each from many colos is ordinary first-touch fill.
# Those two are indistinguishable without it. CF-Ray is a request header and so
# is untrusted like every other copied field.

def test_colo_is_the_suffix_after_the_last_hyphen():
    assert parse_colo("8a1b2c3d4e5f6789-YYZ") == "YYZ"


def test_colo_is_blank_when_the_header_is_absent():
    """Local dev, and Railway health checks over the private mesh, which never
    traverse Cloudflare."""
    assert parse_colo("") == ""
    assert parse_colo("no-trailing-hyphen-value") == "val"[:LOG_COLO_MAX]


def test_colo_empty_suffix_is_blank():
    assert parse_colo("8a1b2c3d4e5f6789-") == ""


def test_colo_escape_byte_cannot_inject_ansi():
    out = parse_colo("8a1b-\x1b[31mX")
    assert "\x1b" not in out
    assert out == "\\x1"


def test_colo_line_break_cannot_forge_a_second_line():
    out = parse_colo("8a1b-A\nB")
    assert "\n" not in out
    assert out == "A\\n"


def test_colo_is_hard_sliced_so_the_column_never_widens():
    """sanitize_log_field marks truncation with an ellipsis; a fixed-width
    column cannot carry it, so parse_colo slices instead."""
    out = parse_colo("8a1b-VERYLONGVALUE")
    assert len(out) == LOG_COLO_MAX
    assert "…" not in out


async def test_colo_reaches_the_access_line(api_log):
    app = _app_with()
    async with _client(app) as c:
        await c.get("/api/x", headers={"cf-ray": "8a1b2c3d4e5f6789-LHR"})
    (line,) = _access_lines(api_log)
    assert "LHR" in line


async def test_missing_cf_ray_keeps_the_column_width(api_log):
    """A request with no CF-Ray must still line up with one that has it."""
    app = _app_with()
    async with _client(app) as c:
        await c.get("/api/x", headers={"cf-ray": "8a1b2c3d4e5f6789-LHR"})
        await c.get("/api/x")
    with_colo, without_colo = _access_lines(api_log)
    assert len(_strip_ansi(with_colo)) == len(_strip_ansi(without_colo))


# ── search text: opt-in from the route, never read from the query string ─────
#
# The search line carries what was searched and how many results it found
# (`n=0` is the content-gap signal). The scoping is structural, not a path
# check: the middleware never reads a query string, it only renders what a
# handler hands over on request.state. That matters because search is NOT the
# only route with query params — the OAuth callbacks receive their
# authorization `code` there, and a generic rule would log credentials.

def _search_app(query, total=None, status=200, corrected=None):
    """Stand-in for the search route: hands `query` (and `total`, and the typo
    fallback's `corrected`) to the access log the way the real handler does."""
    app = FastAPI()
    add_logging_middleware(app)

    @app.get("/api/search/")
    async def fake_search(request: Request):
        request.state.search_query = query
        if total is not None:
            request.state.search_total = total
        # The route sets it on every hit and miss, None when nothing was corrected.
        request.state.search_corrected = corrected
        return JSONResponse({"ok": True}, status_code=status)

    return app


async def test_query_string_is_never_logged_without_opt_in(api_log):
    """The test that fails if this feature is ever 'generalised'."""
    async with _client(_app_with()) as c:
        await c.get("/api/auth/google/callback", params={"code": "SECRET-CODE", "q": "also-not-logged"})
    (line,) = _access_lines(api_log)
    assert "SECRET-CODE" not in line
    assert "also-not-logged" not in line
    assert "q=" not in line


async def test_search_text_and_total_reach_the_access_line(api_log):
    async with _client(_search_app("supply box", total=0)) as c:
        # The URL's own q is deliberately different: what is logged is what the
        # route handed over, not anything read from the query string.
        await c.get("/api/search/", params={"q": "FROM-THE-URL"})
    (line,) = _access_lines(api_log)
    assert line.endswith("| /api/search/ | n=0  q=supply box")
    assert "FROM-THE-URL" not in line


async def test_search_total_is_padded_so_the_text_lines_up(api_log):
    """limit caps at 50, so two characters; q= lands in one column down a burst."""
    async with _client(_search_app("nano", total=0)) as c:
        await c.get("/api/search/")
    async with _client(_search_app("nano", total=12)) as c:
        await c.get("/api/search/")
    one_digit, two_digit = (_strip_ansi(line) for line in _access_lines(api_log))
    assert two_digit.endswith("| n=12 q=nano")
    assert one_digit.index(" q=") == two_digit.index(" q=")


async def test_search_text_without_a_total_still_logs(api_log):
    """The handler sets the text before the lookup and the total after it, so a
    failure in between still names the query that caused it."""
    async with _client(_search_app("supply box")) as c:
        await c.get("/api/search/")
    (line,) = _access_lines(api_log)
    assert line.endswith("| /api/search/ | q=supply box")
    assert "n=" not in line


async def test_search_text_is_neutralised_and_capped(api_log):
    hostile = "ab" + ANSI_PROBE + "\u2028" + "z" * 100
    async with _client(_search_app(hostile, total=0)) as c:
        await c.get("/api/search/")
    (line,) = _access_lines(api_log)
    assert len(line.splitlines()) == 1
    assert ANSI_PROBE not in line
    field = line.split(" q=", 1)[1]
    assert field.startswith("ab\\x1b[2J\\u2028z")
    assert field.endswith("…")
    assert len(field) == LOG_QUERY_MAX + 1


async def test_search_text_is_the_last_field_so_it_cannot_impersonate_one(api_log):
    forged = "x | UA: Googlebot (referer)"
    async with _client(_search_app(forged, status=500)) as c:  # >= 400 appends the UA
        await c.get("/api/search/", headers={"user-agent": "Firefox/1.0"})
    (line,) = _access_lines(api_log)
    # The real UA is written before the search text...
    assert line.index("UA: Firefox/1.0") < line.index(" q=")
    # ...and everything after `q=` is the user's, verbatim, to end of line.
    assert line.endswith(f"q={forged}")


async def test_a_corrected_query_names_its_correction_before_the_text(api_log):
    """A typo fallback's results are for the corrected words, so the line says so: a
    search that found something never reads as a content gap, and q= stays last."""
    async with _client(_search_app("obvlisiohn", total=20, corrected="oblivion")) as c:
        await c.get("/api/search/")
    (line,) = _access_lines(api_log)
    assert line.endswith("| /api/search/ | n=20 c=oblivion q=obvlisiohn")


@pytest.mark.parametrize("corrected", [None, ""])
async def test_an_uncorrected_query_has_no_c_field(api_log, corrected):
    async with _client(_search_app("nano", total=20, corrected=corrected)) as c:
        await c.get("/api/search/")
    (line,) = _access_lines(api_log)
    assert line.endswith("| /api/search/ | n=20 q=nano")
    assert " c=" not in line


async def test_the_correction_is_neutralised_and_capped_like_the_text(api_log):
    """Corrections are built from title words, but nothing in the line may trust that."""
    hostile = "ab" + ANSI_PROBE + chr(0x2028) + "z" * 100
    async with _client(_search_app("abc", total=1, corrected=hostile)) as c:
        await c.get("/api/search/")
    (line,) = _access_lines(api_log)
    assert len(line.splitlines()) == 1
    assert ANSI_PROBE not in line
    field = line.split(" c=", 1)[1].rsplit(" q=", 1)[0]
    assert field == sanitize_log_field(hostile, LOG_QUERY_MAX)
    assert len(field) == LOG_QUERY_MAX + 1
    assert line.endswith(" q=abc")


# ── the missing CF-Connecting-IP alarm ───────────────────────────────────────
#
# Every request through Cloudflare carries CF-Connecting-IP, the rate limiter's key.
# An /api/ request without a valid one means a Cloudflare setting stopped sending it
# (the key would fall back to Railway's proxy address, one bucket for everyone) or the
# origin secret was used to skip Cloudflare, so outside DEBUG the logger raises a
# WARNING for each one.

def _cf_warnings(caplog):
    return [
        rec.getMessage() for rec in caplog.records
        if rec.name == "api" and rec.levelno == logging.WARNING and "CF-Connecting-IP" in rec.getMessage()
    ]


@pytest.fixture
def prod_mode(monkeypatch):
    monkeypatch.setattr(settings, "DEBUG", False)


async def test_an_api_request_without_cf_connecting_ip_raises_the_alarm(api_log, prod_mode):
    async with _client(_app_with()) as c:
        await c.get("/api/levels/x")
    (warning,) = _cf_warnings(api_log)
    assert "GET /api/levels/x" in warning
    assert "client 127.0.0.1" in warning
    assert "colo -" in warning  # no CF-Ray: whatever sent it skipped Cloudflare
    assert " → " not in warning  # never counted as an access line


async def test_an_invalid_cf_connecting_ip_raises_the_alarm(api_log, prod_mode):
    async with _client(_app_with()) as c:
        await c.get("/api/levels/x", headers={"cf-connecting-ip": "not-an-ip", "cf-ray": "8f1e2d3c4b5a6978-LHR"})
    (warning,) = _cf_warnings(api_log)
    assert "colo LHR" in warning  # it came through Cloudflare: a setting changed


@pytest.mark.parametrize("path, headers", [
    ("/api/levels/x", {"cf-connecting-ip": "203.0.113.7"}),
    ("/api/health", {}),  # Railway's health checks never carry the header
    ("/levels/x", {}),  # only /api/ requests reach the access log
])
async def test_the_alarm_stays_quiet_when_nothing_is_wrong(api_log, prod_mode, path, headers):
    async with _client(_app_with()) as c:
        await c.get(path, headers=headers)
    assert _cf_warnings(api_log) == []


async def test_the_alarm_is_off_under_debug(api_log, monkeypatch):
    monkeypatch.setattr(settings, "DEBUG", True)
    async with _client(_app_with()) as c:
        await c.get("/api/levels/x")
    assert _cf_warnings(api_log) == []


async def test_the_alarm_line_is_neutralised(api_log, prod_mode):
    await _asgi_get(_app_with(), "/api/levels/a" + ANSI_PROBE + "b")
    (warning,) = _cf_warnings(api_log)
    assert ANSI_PROBE not in warning
    assert "\\x1b[2J" in warning


# ── email addresses: never in a field, whoever typed them ────────────────────
#
# Railway keeps every line for 90 days and can't delete or redact one early, so the
# cleaner replaces anything shaped like an email address, wherever it came from: an
# address typed into search, a path, a bot's User-Agent, a cache key.

@pytest.mark.parametrize("value, expected", [
    ("jane.doe+tag@example.com", "[email]"),
    ("q jane@mail.example.com x", "q [email] x"),
    ("JOS" + chr(0xC9) + "@EX" + chr(0xC4) + "MPLE.COM", "[email]"),  # not ASCII-only
    ("jane%40example.com", "[email]"),  # percent-encoded, as a raw header carries it
    ("jane@exa", "[email]"),  # cut short: no dot needed after the @
    ("jane.doe@", "[email]"),  # typed as far as the @, as search logs every keystroke
    ("100%jane@example.com", "[email]"),
    ("/api/levels/jane@example.com/x", "/api/levels/[email]/x"),
    ("o'brien@example.com", "[email]"),  # a surname's apostrophe is part of the address
    ("jane{1}&co@example.com", "[email]"),  # so are the other symbols an address may hold
    ("jane" + chr(0x200B) + "doe@example.com", "[email]"),  # an invisible character doesn't split it
    ("https://user:pw@host.example/x", "https://user:[email]/x"),  # a URL's userinfo, password and all
    ("search:jane@example.com:20:v3", "search:[email]:20:v3"),  # a cache key keeps its shape
    ("jane" + chr(0xFF20) + "example.com", "[email]"),  # the full-width at sign
    ("jane" + chr(0xFE6B) + "example.com", "[email]"),  # the small one
    ("".join(map(chr, (0x938, 0x940, 0x924, 0x93E))) + "@example.com", "[email]"),  # ends in a vowel sign
])
def test_an_email_address_never_survives_the_cleaner(value, expected):
    assert sanitize_log_field(value, 256) == expected


@pytest.mark.parametrize("value", [
    "users/@me", "@user_script:1", "a @@ b", "tags @> '{x}'", "user @ example", "100% done",
])
def test_text_with_only_an_at_sign_is_left_alone(value):
    assert sanitize_log_field(value, 256) == value


def test_an_address_is_replaced_before_the_cap_can_cut_it():
    out = sanitize_log_field("x" * 35 + " jane.doe@example.com", 40)
    assert out == "x" * 35 + " [ema…"


# The pattern runs on every request's path and User-Agent, uncapped, and a header can
# be about 32 KB. A pattern that backtracks is quadratic or worse and holds the GIL
# meanwhile (the bot filter's SPA_SAFE_PATH lesson): one took 4 seconds on 32 KB, just
# inside a 5 s limit. So each input here is 1 MB, one long run of address characters
# that can't end in an address. The real pattern clears each in about 30 ms; without
# the lookbehind that keeps it linear, each takes minutes, so the child is killed
# after 5 s. The input goes in on stdin, since one argument is capped at 128 KB.
_SUB_CHILD = "import re,sys; s = sys.stdin.read(); re.compile(sys.argv[1]).sub('[email]', s); print('DONE')"


@pytest.mark.parametrize("hostile", [
    "a" * 2**20 + " @",
    chr(0xE9) * 2**20 + ":@",  # another script
    "%41" * (2**20 // 3) + " @",  # percent escapes
    "a." * 2**19 + "/@",  # dots
], ids=["run", "non-ascii-run", "percent-run", "dotted-run"])
def test_the_email_pattern_stays_linear_on_hostile_input(hostile):
    try:
        out = subprocess.run([sys.executable, "-c", _SUB_CHILD, EMAIL_SHAPE.pattern], input=hostile,
                             capture_output=True, text=True, timeout=5)
    except subprocess.TimeoutExpired:
        pytest.fail("the email pattern backtracks: 5 s were not enough for 1 MB")
    assert out.stdout.strip() == "DONE"


async def test_an_email_address_typed_into_search_is_never_logged(api_log):
    """Search runs as you type, so each keystroke's text is logged."""
    for typed in ("jane", "jane.doe@", "jane.doe@mail.exa", "jane.doe@mail.example.com"):
        async with _client(_search_app(typed, total=0)) as c:
            await c.get("/api/search/")
    assert [line.rsplit(" q=", 1)[1] for line in _access_lines(api_log)] == [
        "jane", "[email]", "[email]", "[email]",
    ]


async def test_an_email_address_in_a_path_or_a_user_agent_is_never_logged(api_log):
    async with _client(_app_with()) as c:
        # /api/auth prefix => the UA is appended even on a 200; a token holding "bot"
        # is what parse_ua keeps whole.
        await c.get("/api/auth/x/jane.doe@example.com", headers={"user-agent": "probe ops@robot.example"})
    (line,) = _access_lines(api_log)
    assert "| /api/auth/x/[email] |" in line
    assert "UA: [email]" in line
    assert "@" not in line
