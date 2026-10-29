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
"""
import subprocess
import sys

import pytest_asyncio
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from httpx import AsyncClient, ASGITransport

from app.config.settings import settings
from app.middleware.bot_filter import SPA_SAFE_PATH, add_bot_filter_middleware

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
