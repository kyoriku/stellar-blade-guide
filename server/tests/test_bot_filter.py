"""
Regression tests for the bot-filter SPA path matcher (app/middleware/bot_filter.py).

SPA_SAFE_PATH runs on the raw, attacker-controlled URL path. A prior version,
`^/(?:[a-z0-9\\-]+/?)*$`, backtracked catastrophically (ReDoS) on a long slash-free
run followed by a non-class char — e.g. a hashed `*.webp`. In production a single
such request (`GET /<48 hex chars>.webp`) pinned the GIL for >5s, tripping uvicorn's
worker health-check, which SIGKILLed the worker (silent death, flat memory, no
traceback, parent logs "Child process died"). These tests lock in linear-time
matching, the length-guard backstop, and the accept/reject language so the
catastrophic form cannot be reintroduced.

Hang-safety note: a catastrophic `re` match cannot be interrupted in-process (it holds
the GIL through both threads and signals). So the definitive ReDoS guard runs the match
in a SUBPROCESS with a timeout — if the pattern regresses it fails cleanly instead of
hanging the suite. In-process tests below only ever feed SHORT or MATCHING inputs, which
resolve instantly even against the old catastrophic pattern (backtracking only explodes
on long NON-matching runs).
"""
import subprocess
import sys

import pytest_asyncio
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from httpx import AsyncClient, ASGITransport

from app.config.settings import settings
from app.middleware.bot_filter import SPA_SAFE_PATH, add_bot_filter_middleware

# The exact production trigger shape: a long alphanumeric run + '.' (from `.webp`).
REDOS_PATH = "/" + ("a" * 64) + ".webp"

# Longest real SPA path in the sitemap (deepest route: walkthroughs/:type/:slug).
LONGEST_REAL_PATH = "/walkthroughs/bulletin-board-requests/looking-for-my-brother"

# Matches the pattern against the text in a fresh interpreter, printing MATCH/NOMATCH.
_CHILD = "import re,sys; print('MATCH' if re.compile(sys.argv[1]).match(sys.argv[2]) else 'NOMATCH')"


def _match_in_subprocess(pattern: str, text: str, timeout: float = 5.0):
    """Run a regex match in a separate process. Returns 'MATCH'/'NOMATCH', or None if it
    failed to terminate within `timeout` — the only hang-proof way to bound a potentially
    catastrophic `re` match (it is not interruptible in-process)."""
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
    """The exact prod trigger (long hex run + '.webp') must resolve, not pin a core >5s."""
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
    # A 299-char SPA-shaped path (~2x the structural worst case) must NOT be clipped —
    # proves the 512 length guard leaves ample headroom and never bites a real route.
    path = "/walkthroughs/" + ("a" * 285)
    assert len(path) < 512
    r = await bot_client.get(path)
    assert r.status_code == 200


async def test_oversized_path_hits_length_guard(bot_client):
    # SPA-shaped but > 512 chars → the length guard returns 404 before the regex runs.
    r = await bot_client.get("/" + ("a" * 600))
    assert r.status_code == 404
