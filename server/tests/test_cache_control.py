"""
Cache-Control contract (app/middleware/security_headers.py).

These headers decide what shared caches are allowed to keep and for how long,
and the site has no way to reach into an edge cache other than the by-URL purge
in scripts/cache/purge_api_cache.py. So the rule underneath every test here is:
a route may only advertise an s-maxage it can actually invalidate.

The content routes can — a prod seed purges them by URL — so 30 days is safe.
/api/search cannot: its URLs carry an arbitrary ?q= and cannot be enumerated,
which is why it is absent from CACHED_PREFIXES and always will be. Its TTL is
therefore the only bound on how long a stale result can survive.

Following the house pattern, each test builds a bare app with only the layer
under test.
"""
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from httpx import ASGITransport, AsyncClient

from app.config.settings import settings
from app.db.database import get_db
from app.middleware.rate_limit import setup_rate_limiter
from app.middleware.security_headers import add_security_headers_middleware
from app.routers import search as search_route


def _parse_cache_control(value):
    """`public, max-age=3600, s-maxage=3600` -> {'public': True, 'max-age': 3600, ...}"""
    out = {}
    for part in value.split(","):
        part = part.strip()
        if "=" in part:
            k, v = part.split("=", 1)
            out[k.strip()] = int(v) if v.strip().isdigit() else v.strip()
        elif part:
            out[part] = True
    return out


@pytest_asyncio.fixture
async def headers_client():
    """Stub routes under the real security-headers middleware."""
    app = FastAPI()

    @app.get("/{full_path:path}")
    async def ok(full_path: str):
        return JSONResponse({"ok": True})

    @app.post("/{full_path:path}")
    async def created(full_path: str):
        return JSONResponse({"ok": True}, status_code=201)

    add_security_headers_middleware(app)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def _cc(client, path, method="get"):
    r = await getattr(client, method)(path)
    return _parse_cache_control(r.headers["cache-control"])


# ── /api/search: TTL is the only bound, so it must match Redis ───────────────

async def test_search_s_maxage_matches_its_redis_ttl(headers_client):
    cc = await _cc(headers_client, "/api/search/?q=nano")
    assert cc["s-maxage"] == settings.SEARCH_CACHE_TTL


async def test_search_does_not_fall_through_to_the_content_branch(headers_client):
    """The bug this fixes: search took the content branch and promised shared
    caches CACHE_TTL (a month in prod) of an entry nothing can evict.

    Asserted structurally rather than by magnitude. CACHE_TTL is env-overridable
    and is 300 in this dev container, so "search is shorter than content" is not
    a property that holds everywhere — what must hold is that search is bound to
    its own TTL and does not inherit the purgeable routes' header.
    """
    search = await _cc(headers_client, "/api/search/?q=nano")
    content = await _cc(headers_client, "/api/collectibles/")
    assert search != content
    assert search["s-maxage"] == settings.SEARCH_CACHE_TTL
    assert content["s-maxage"] == settings.CACHE_TTL


async def test_search_has_no_stale_while_revalidate(headers_client):
    """SWR sanctions extra staleness beyond the TTL, and search has no
    invalidation path to bring that window to an end early."""
    cc = await _cc(headers_client, "/api/search/?q=nano")
    assert "stale-while-revalidate" not in cc


async def test_search_total_staleness_window_is_bounded_by_the_ttl(headers_client):
    """Worst case must stay ~1h at the edge, not s-maxage + 7 days."""
    cc = await _cc(headers_client, "/api/search/?q=nano")
    window = cc["s-maxage"] + cc.get("stale-while-revalidate", 0)
    assert window == settings.SEARCH_CACHE_TTL


async def test_search_is_still_publicly_cacheable(headers_client):
    """Lowering the TTL must not turn into no-store — the 1h edge cache is what
    absorbs repeated searches for the same term."""
    cc = await _cc(headers_client, "/api/search/?q=nano")
    assert cc.get("public") is True
    assert "no-store" not in cc


# ── the other branches must be untouched ─────────────────────────────────────

@pytest.mark.parametrize("path", [
    "/api/collectibles/", "/api/levels/xion", "/api/walkthroughs/",
    "/api/upgrades/gear", "/api/cosmetics/glasses", "/api/collectibles/supply-boxes",
])
async def test_purgeable_content_routes_keep_the_long_ttl(headers_client, path):
    """These are enumerable and purged by URL after every seed, so a 30-day
    s-maxage remains correct for them."""
    cc = await _cc(headers_client, path)
    assert cc["s-maxage"] == settings.CACHE_TTL
    assert cc["stale-while-revalidate"] == settings.SWR_TTL


@pytest.mark.parametrize("path", [
    "/api/progress", "/api/auth/refresh", "/api/comments/x/1",
    "/api/health", "/api/notifications", "/api/users/me/stats",
])
async def test_no_store_allowlist_still_wins(headers_client, path):
    cc = await _cc(headers_client, path)
    assert cc == {"no-store": True}


async def test_non_get_is_no_store(headers_client):
    cc = await _cc(headers_client, "/api/search/", method="post")
    assert cc == {"no-store": True}


# ── the drift guard ──────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def search_app_client():
    """Real search router behind the real middleware, so the advertised header
    and the actual Redis write can be compared against each other."""
    app = FastAPI()
    setup_rate_limiter(app)
    app.include_router(search_route.router, prefix="/api")
    add_security_headers_middleware(app)

    mock_db = AsyncMock()

    async def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def test_advertised_s_maxage_equals_the_ttl_actually_written_to_redis(
    search_app_client, monkeypatch
):
    """The invariant worth pinning: not that two constants are equal, but that
    the number handed to shared caches is the number the cache entry actually
    lives for. These are set in different modules and would otherwise drift
    silently — a longer header than TTL is precisely the stale-result bug.
    """
    captured = {}

    async def fake_set_cache(key, value, ttl=None):
        captured["ttl"] = ttl
        return True

    monkeypatch.setattr(search_route, "_execute_search", AsyncMock(return_value=[]))
    monkeypatch.setattr(search_route, "get_cache", AsyncMock(return_value=None))
    monkeypatch.setattr(search_route, "set_cache", fake_set_cache)

    r = await search_app_client.get("/api/search/?q=nano")
    assert r.status_code == 200
    cc = _parse_cache_control(r.headers["cache-control"])
    assert captured["ttl"] == cc["s-maxage"]
