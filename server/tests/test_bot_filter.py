"""
Regression tests for the bot-filter SPA path matcher (app/middleware/bot_filter.py).

SPA_SAFE_PATH runs on the attacker-controlled URL path, lowercased and with trailing
slashes stripped. The nested form `^/(?:[a-z0-9\\-]+/?)*$` backtracks catastrophically
(ReDoS) on a long slash-free run followed by a character outside its class, such as a
long run of hex characters ending in a file extension (REDOS_PATH below). The work
roughly doubles with each character of the run, and the match holds the GIL, so the
worker answers nothing else: under the Dockerfile's --workers 2, uvicorn's supervisor
gets no reply to its health-check ping within 5 s and SIGKILLs the worker, which dies
with no traceback while the parent logs "Child process [pid] died". These tests lock
in linear-time matching, the length-guard backstop, and the accept/reject language so
the catastrophic form cannot be reintroduced.

Hang-safety note: a catastrophic `re` match holds the GIL, so no other Python thread
runs until it ends, and a signal handler can interrupt it only when the match itself
runs in the main thread. A child process can always be killed, so the ReDoS tests run
the match in a SUBPROCESS that subprocess.run kills after a 5 s timeout: a regressed
pattern fails cleanly instead of hanging the suite. In-process tests below only ever
feed SHORT or MATCHING inputs, which resolve instantly even against the nested form
(backtracking only explodes on long NON-matching runs).

The tests after those cover the filter's other checks and what each refusal answers; the
last one imports app.main itself.
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote

import pytest
import pytest_asyncio
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from httpx import AsyncClient, ASGITransport

from app.config.settings import REQUIRED_IN_PRODUCTION, settings
from app.middleware.bot_filter import SPA_SAFE_PATH, add_bot_filter_middleware
from app.middleware.security_headers import add_security_headers_middleware
from app.seo_head import MARKER, register_spa

APP_ROUTES = Path(__file__).resolve().parents[2] / "client" / "src" / "App.tsx"

# The ReDoS shape: a long slash-free run, then a file extension, as in a hashed file name.
REDOS_PATH = "/" + ("a" * 64) + ".webp"

# A real 60-char SPA path at the deepest route (walkthroughs/:type/:slug). The sitemap's
# longest is 66 chars; test_generous_legit_length_path_not_clipped covers longer ones.
LONGEST_REAL_PATH = "/walkthroughs/bulletin-board-requests/looking-for-my-brother"

# Matches the pattern against the text in a fresh interpreter, printing MATCH/NOMATCH.
_CHILD = "import re,sys; print('MATCH' if re.compile(sys.argv[1]).match(sys.argv[2]) else 'NOMATCH')"


def _match_in_subprocess(pattern: str, text: str, timeout: float = 5.0):
    """Run a regex match in a separate process. Returns 'MATCH'/'NOMATCH', or None if it
    failed to terminate within `timeout`, in which case subprocess.run kills the child.
    In-process, the match holds the GIL, so no Python watchdog thread can stop it."""
    try:
        out = subprocess.run(
            [sys.executable, "-c", _CHILD, pattern, text],
            capture_output=True, text=True, timeout=timeout,
        )
        return out.stdout.strip()
    except subprocess.TimeoutExpired:
        return None


# ── ReDoS regression: the regex must terminate quickly on pathological input ───

def test_spa_regex_terminates_on_redos_trigger():
    """A hashed-file-name shape (long hex run + '.webp') must resolve within 5 s."""
    result = _match_in_subprocess(SPA_SAFE_PATH.pattern, REDOS_PATH)
    assert result is not None, (
        "SPA_SAFE_PATH did not terminate on a long-run + '.' path within the timeout — "
        "catastrophic backtracking (ReDoS) has been reintroduced. Keep every '/' a "
        "mandatory segment delimiter; never use the nested form `(?:[a-z0-9\\-]+/?)*`."
    )
    assert result == "NOMATCH"  # a path containing '.' is not a valid SPA route


def test_spa_regex_terminates_on_long_nonmatching_run():
    """A long pure run with a trailing non-class char is the old pattern's worst case."""
    pathological = "/" + ("b" * 200) + "%"
    assert _match_in_subprocess(SPA_SAFE_PATH.pattern, pathological) == "NOMATCH"


# ── Language correctness: same accept/reject set as before the fix ─────────────

def test_regex_accepts_real_routes():
    for path in [
        "/",
        "/collectibles",
        "/collectibles/documents",
        "/walkthroughs/main-story",
        "/levels/eidos-laboratory/",
        LONGEST_REAL_PATH,
    ]:
        assert SPA_SAFE_PATH.match(path), f"should accept legit route: {path}"


def test_regex_rejects_junk_paths():
    # All short / matching-greedy inputs → safe to match in-process (no backtracking blowup).
    for path in ["/has.dot", "/UPPERCASE", "/under_score", "/space bar", "//double", "/trailing//"]:
        assert not SPA_SAFE_PATH.match(path), f"should reject junk path: {path}"


# ── Middleware behaviour (DEBUG off, as in production) ─────────────────────────

def _make_app() -> FastAPI:
    app = FastAPI()
    add_bot_filter_middleware(app)

    @app.api_route("/{full_path:path}", methods=["GET"])
    async def catch_all(full_path: str):
        return JSONResponse({"ok": True})

    return app


@pytest_asyncio.fixture
async def bot_client(monkeypatch):
    # The filter is skipped entirely when DEBUG is True; force prod behaviour.
    monkeypatch.setattr(settings, "DEBUG", False)
    async with AsyncClient(transport=ASGITransport(app=_make_app()), base_url="http://test") as c:
        yield c


async def test_hashed_image_path_is_rejected(bot_client):
    # Short hashed-image-style path (a dotted run) → 404. The exhaustive long-input
    # ReDoS check lives in the subprocess test above; this keeps a modest run so it
    # cannot hang the suite even if the pattern ever regresses.
    r = await bot_client.get("/8686dedad7cd0428.webp")
    assert r.status_code == 404


async def test_longest_real_path_passes_through(bot_client):
    r = await bot_client.get(LONGEST_REAL_PATH)
    assert r.status_code == 200


async def test_generous_legit_length_path_not_clipped(bot_client):
    # A 299-char SPA-shaped path (past the roughly 215 characters the type and slug
    # columns allow a walkthrough page) must NOT be clipped: proves the 512 length guard
    # leaves ample headroom and never bites a real route.
    path = "/walkthroughs/" + ("a" * 285)
    assert len(path) < 512
    r = await bot_client.get(path)
    assert r.status_code == 200


async def test_oversized_path_hits_length_guard(bot_client):
    # SPA-shaped but > 512 chars → the length guard returns 404 before the regex runs.
    r = await bot_client.get("/" + ("a" * 600))
    assert r.status_code == 404


async def test_root_seo_files_pass_through(bot_client):
    # Each contains a '.', so SPA_SAFE_PATH rejects all three, and ALLOWED_EXACT is the
    # only thing keeping them reachable. Google reads a 404 on /ads.txt as no file at
    # all and drops the seller entries it had crawled.
    for path in ("/robots.txt", "/sitemap.xml", "/ads.txt"):
        r = await bot_client.get(path)
        assert r.status_code == 200, f"{path} must not be treated as a bot probe"


async def test_a_root_file_with_a_query_string_passes(bot_client):
    # A query string is no part of the path as routed, which the files are judged on.
    for path in ("/robots.txt?v=1", "/sitemap.xml?v=1", "/ads.txt?v=1"):
        assert (await bot_client.get(path)).status_code == 200, path


async def test_a_root_file_spelled_with_escapes_passes(bot_client):
    # The path as routed is decoded, so /robots%2Etxt is /robots.txt and on the allowlist.
    for path in ("/robots%2Etxt", "/sitemap%2Exml", "/ads%2Etxt"):
        assert (await bot_client.get(path)).status_code == 200, path


ROOT_ICONS = (
    "/favicon.ico", "/apple-touch-icon.png", "/apple-touch-icon-precomposed.png",
    "/apple-touch-icon-152x152.png", "/apple-touch-icon-152x152-precomposed.png", "/apple-touch-icon-120x120.png",
)


@pytest.mark.parametrize("path", ROOT_ICONS)
async def test_the_root_icons_pass_through(bot_client, path):
    # Asked for by name (app/core/root_icons.py); the '.' fails SPA_SAFE_PATH, as for the files above.
    assert (await bot_client.get(path)).status_code == 200


async def test_the_admin_page_and_its_api_pass_through(bot_client):
    # /admin is a site route, and the bot signatures hold only longer CMS paths that start
    # with it (/administrator, /admin/controller). The API passes with no Referer and with
    # the site's own.
    for path in ("/admin", "/admin/", "/api/admin/users"):
        r = await bot_client.get(path)
        assert r.status_code == 200, f"{path} must not be treated as a bot probe"
    r = await bot_client.get("/api/admin/users", headers={"referer": "https://stellarbladeguide.com/admin"})
    assert r.status_code == 200
    for path in ("/administrator", "/admin/controller"):
        assert (await bot_client.get(path)).status_code == 404, path


async def test_every_route_the_client_defines_gets_through(bot_client):
    # The filter runs in production only, so a route it refused (one starting /manage, /content,
    # /files or /docs, say) would work in dev and the e2e suite and be a 404 on the site. Every
    # <Route> tag, whatever its layout or attribute order, must give up its path.
    text = APP_ROUTES.read_text(encoding="utf-8")
    # Flat routes only: a nested route's path joins its parent's, which this doesn't do.
    assert not re.search(r"</Route\s*>", text)
    tags = re.split(r'<Route\b(?!s)', text)[1:]
    routes = [m.group(1) for tag in tags if (m := re.search(r'\bpath="([^"]*)"', tag))]
    assert len(routes) == len(tags) > 20
    for route in routes:
        # A parameter or a splat stands in as a plain word.
        path = "/" + "/".join("x" if part.startswith(":") or part == "*" else part
                              for part in route.strip("/").split("/"))
        assert (await bot_client.get(path)).status_code == 200, route


# ── A page address it refuses gets the client's 404 page ───────────────────────

NOT_FOUND_TITLE = '<title data-seo="server">404 Page Not Found | Stellar Blade Guide</title>'
SHELL = ('<!doctype html>\n<html>\n<head>\n  <meta charset="UTF-8" />\n'
         f'  {MARKER}\n</head>\n<body><main id="root"></main></body>\n</html>\n')


@pytest_asyncio.fixture
async def spa_client(tmp_path, monkeypatch):
    # The built client registered, as in production, so the 404 page is there to serve.
    monkeypatch.setattr(settings, "DEBUG", False)
    dist = tmp_path / "dist"
    dist.mkdir()
    (dist / "index.html").write_text(SHELL, encoding="utf-8")
    app = FastAPI()

    @app.get("/api/probe")
    async def probe():
        return {"ok": True}

    add_bot_filter_middleware(app)
    add_security_headers_middleware(app)
    register_spa(app, str(dist), reload_shell=False)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.mark.parametrize("path", [
    "/levels/eidos_7",                                                    # an underscore
    "/levels/eidos-7.", "/levels/eidos-7)", "/levels/eidos-7%E2%80%A6",   # what a pasted link picks up
    "/levels/%C3%A9idos-7",                                               # a letter outside ASCII
    "/Levels/Eidos_7",                                                    # refused before the 301
    "/levels/eidos_7%3Fx",                                                # an escaped ? still gets the page
    "/index.html", "/favicon.png",                                        # a file the site doesn't have
    "/Favicon.ico", "/apple-touch-icon-152x120.png",                      # near an icon name the site has
    "/levels//eidos-7",                                                   # an empty segment
    "/wp-login.php", "/docs",                                             # a bot signature
    "/" + "a" * 600,                                                      # past the length guard
])
async def test_a_page_address_it_refuses_gets_the_404_page(spa_client, path):
    r = await spa_client.get(path)
    assert (r.status_code, r.headers["content-type"], r.headers["cache-control"]) == (
        404, "text/html; charset=utf-8", "no-store")
    assert NOT_FOUND_TITLE in r.text
    assert 'content="noindex, nofollow"' in r.text
    assert 'rel="canonical"' not in r.text


async def test_head_gets_the_404_page_without_its_body(spa_client):
    get, head = await spa_client.get("/levels/eidos_7"), await spa_client.head("/levels/eidos_7")
    assert (head.status_code, head.content) == (404, b"")
    assert head.headers["content-length"] == get.headers["content-length"]


@pytest.mark.parametrize("method", ["POST", "PUT", "DELETE", "OPTIONS"])
async def test_any_other_method_keeps_the_json_404(spa_client, method):
    r = await spa_client.request(method, "/levels/eidos_7")
    assert (r.status_code, r.json()) == (404, {"error": "Not Found"})


async def test_an_api_refusal_keeps_the_json_404(spa_client):
    r = await spa_client.get("/api/probe", headers={"referer": "https://evil.example/"})
    assert (r.status_code, r.json()) == (404, {"error": "Not Found"})


async def test_with_no_built_client_it_answers_json(bot_client):
    # No register_spa, as in CI, which has no client/dist: there's no page to serve.
    r = await bot_client.get("/levels/eidos_7")
    assert (r.status_code, r.json()) == (404, {"error": "Not Found"})


# ── A page path ending in punctuation is refused under its own reason ──────────

@pytest_asyncio.fixture
async def reason_of(monkeypatch):
    # The reason the bot filter leaves for the logging middleware, recorded outside it. The scope
    # is built by hand, decoded as uvicorn decodes it, since an HTTP client resolves dot segments.
    monkeypatch.setattr(settings, "DEBUG", False)
    seen = []
    app = FastAPI()
    add_bot_filter_middleware(app)

    @app.middleware("http")
    async def record(request, call_next):
        response = await call_next(request)
        seen.append(getattr(request.state, "reject_reason", None))
        return response

    async def reason(path, method="GET"):
        seen.clear()
        sent = []
        scope = {
            "type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1",
            "method": method, "scheme": "http", "path": unquote(path), "raw_path": path.encode(),
            "query_string": b"", "root_path": "", "headers": [(b"host", b"test")],
            "client": ("127.0.0.1", 1234), "server": ("test", 80),
        }

        async def receive():
            return {"type": "http.request", "body": b"", "more_body": False}

        async def send(message):
            sent.append(message)

        await app(scope, receive, send)
        return sent[0]["status"], seen[0]

    return reason


@pytest.mark.parametrize("path", [
    "/levels/eidos-7.", "/levels/eidos-7)", "/levels/eidos-7,", "/levels/eidos-7!",
    "/levels/eidos-7...", "/levels/eidos-7.)", "/levels/eidos-7/).",  # a run, slashes among it
    "/levels/eidos-7%2E", "/levels/eidos-7%29",                        # escaped, read decoded
    "/Levels/Eidos-7!", "/privacy.", "/)", "/levels/eidos-7./!",
])
async def test_a_page_path_ending_in_punctuation_gets_its_own_reason(reason_of, path):
    assert await reason_of(path) == (404, "trailing-punctuation")


@pytest.mark.parametrize("path, reason", [
    ("/levels/eidos-7:", "path-shape"),               # not one of the marks
    ("/levels/eidos-7;", "path-shape"),
    ("/levels/eidos-7%E2%80%A6", "path-shape"),
    ("/levels/eidos_7.", "path-shape"),               # no page path before the mark
    ("/sitemap.xml.", "path-shape"),
    ("/levels//eidos-7.", "path-shape"),
    ("/levels/..", "path-shape"),                     # dot segments are path syntax, not debris
    ("/levels/eidos-7/..", "path-shape"),
    ("/levels/../!", "path-shape"),
    ("/.", "path-shape"),
    ("/levels/eidos-7.%3Fx", "path-shape"),           # judged on the path as routed, never cut short
    ("/levels/eidos-7!%23x", "path-shape"),
    ("/levels/eidos-7)%3F", "path-shape"),
    ("/api.", "path-shape"),                          # never the API's path, in any case
    ("/API!", "path-shape"),
    ("/api...", "path-shape"),
    ("/API/levels/eidos-7.", "path-shape"),
    ("/Api/collectibles/cans!", "path-shape"),
    ("/levels/eidos-%E2%84%AA.", "path-shape"),       # the Kelvin sign: ASCII page paths only
    ("/wp-admin.", "bot-signature"),                  # the earlier checks come first
    ("/" + "a/" * 300 + "a.", "path-length"),         # one-letter segments, so a regressed pattern can't hang
])
async def test_other_refusals_keep_their_reason(reason_of, path, reason):
    assert await reason_of(path) == (404, reason)


@pytest.mark.parametrize("path", [
    "/Favicon.ico", "/FAVICON.ICO", "/favicon.ico/", "/favicon.ico.", "/favicon.png", "/levels/favicon.ico",
    "/apple-touch-icon-152x120.png", "/apple-touch-icon-152x152.PNG", "/apple-touch-icon-1000x1000.png",
    "/favicon.ico%3Fx", "/apple-touch-icon.png%23x",  # judged on the path as routed, never cut short
])
async def test_a_name_near_a_root_icon_keeps_the_shape_reason(reason_of, path):
    assert await reason_of(path) == (404, "path-shape")


@pytest.mark.parametrize("path", ["/robots.txt%3Fx", "/sitemap.xml%23x", "/ads.txt%3Fx", "/robots.txt%3F"])
async def test_a_root_file_with_an_escaped_mark_keeps_the_shape_reason(reason_of, path):
    # Judged on the path as routed: request.url.path ends at the decoded ? or # and would let it through.
    assert await reason_of(path) == (404, "path-shape")


async def test_head_gets_the_reason_as_get_does(reason_of):
    assert await reason_of("/levels/eidos-7.", "HEAD") == (404, "trailing-punctuation")


@pytest.mark.parametrize("method", ["POST", "PUT", "PATCH", "DELETE"])
async def test_another_method_keeps_the_shape_reason(reason_of, method):
    # Only a GET or HEAD is what a redirect to the page would serve.
    assert await reason_of("/levels/eidos-7.", method) == (404, "path-shape")


# ── app.main itself ────────────────────────────────────────────────────────────

SERVER = Path(__file__).resolve().parents[1]
DIST = SERVER.parent / "client" / "dist"

ICON_PROBE = """
import asyncio, json, httpx
from app.main import app

async def probe():
    reasons = []

    async def recording(scope, receive, send):
        await app(scope, receive, send)
        reasons.append((scope.get("state") or {}).get("reject_reason"))

    transport = httpx.ASGITransport(app=recording)
    async with httpx.AsyncClient(transport=transport, base_url="http://stellarbladeguide.com",
                                 headers={"x-origin-secret": "probe-origin-secret"}) as client:
        out = []
        for path in ("/favicon.ico", "/apple-touch-icon-152x152.png", "/Favicon.ico"):
            response = await client.get(path)
            out.append([response.status_code, response.headers.get("content-type"),
                        response.headers.get("cache-control")])
    print("RESULT", json.dumps([out, reasons]))

asyncio.run(probe())
"""


def test_the_app_lets_the_root_icons_past_every_layer(tmp_path):
    # Production is the one place the bot filter runs: DEBUG turns it off in dev and in the e2e suite.
    env = {
        "PATH": os.environ["PATH"],
        "PYTHONPATH": str(SERVER),
        "PYTHON_DOTENV_DISABLED": "1",
        # Production: ENVIRONMENT and DEBUG unset, stand-ins for what it requires. Nothing connects.
        **{name: "stand-in" for name in REQUIRED_IN_PRODUCTION},
        "ORIGIN_SECRET": "probe-origin-secret",
        "DATABASE_URL": "postgresql+asyncpg://probe:probe@127.0.0.1:1/probe",
        "REDIS_URL": "redis://127.0.0.1:1/0",
    }
    result = subprocess.run([sys.executable, "-c", ICON_PROBE], cwd=tmp_path, env=env,
                            capture_output=True, text=True, timeout=60)
    assert result.returncode == 0, result.stderr
    (line,) = [out for out in result.stdout.splitlines() if out.startswith("RESULT ")]
    (favicon, sized, capital), reasons = json.loads(line.removeprefix("RESULT "))
    assert reasons == [None, None, "path-shape"]
    # The build's file when it has one; a 404 with no built client (CI) or none in it, never the shell.
    for answer, name, kind in ((favicon, "favicon.ico", "image/vnd.microsoft.icon"),
                               (sized, "apple-touch-icon.png", "image/png")):
        if (DIST / name).is_file():
            assert answer == [200, kind, "public, max-age=21600"], name
        else:
            assert answer[0] == 404, name
    assert (capital[0], capital[2]) == (404, "no-store")
