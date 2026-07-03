"""
Tests for GET /api/search/.

Testing approach:
    Database: `_execute_search` is monkeypatched for all logic tests.
    Postgres-specific functions (to_tsvector, similarity) don't run on SQLite,
    so we validate the route at the helper boundary instead of at the SQL level.
    Validation (422) tests don't touch the DB at all — FastAPI validates query
    params before the route body executes.

    Redis: FakeRedis via the autouse `patch_redis` fixture in conftest.py.

    HTTP client: minimal FastAPI app with the search router only, matching the
    pattern established in conftest.py.
"""

import json
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock
from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI

from app.db.database import get_db
from app.middleware.rate_limit import setup_rate_limiter
from routes import search as search_route
from app.schemas.search import SearchResult


@pytest_asyncio.fixture
async def search_client():
    app = FastAPI()
    setup_rate_limiter(app)
    app.include_router(search_route.router, prefix="/api")

    mock_db = AsyncMock()

    async def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


# ---------------------------------------------------------------------------
# Validation — FastAPI rejects these before the route body runs
# ---------------------------------------------------------------------------

async def test_query_missing_returns_422(search_client):
    """q is required."""
    response = await search_client.get("/api/search/")
    assert response.status_code == 422


async def test_query_too_short_returns_422(search_client):
    """q must be at least 2 characters."""
    response = await search_client.get("/api/search/?q=a")
    assert response.status_code == 422


async def test_limit_zero_returns_422(search_client):
    """limit must be >= 1."""
    response = await search_client.get("/api/search/?q=eidos&limit=0")
    assert response.status_code == 422


async def test_limit_too_large_returns_422(search_client):
    """limit must be <= 50."""
    response = await search_client.get("/api/search/?q=eidos&limit=51")
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# No results
# ---------------------------------------------------------------------------

async def test_no_results_returns_empty_list(search_client, monkeypatch):
    monkeypatch.setattr(search_route, "_execute_search", AsyncMock(return_value=[]))

    response = await search_client.get("/api/search/?q=xyzzy")

    assert response.status_code == 200
    assert response.json() == {"query": "xyzzy", "total": 0, "results": []}


async def test_special_chars_only_returns_200(search_client, monkeypatch):
    """Special-char queries are valid — FTS/trgm simply matches nothing."""
    monkeypatch.setattr(search_route, "_execute_search", AsyncMock(return_value=[]))

    response = await search_client.get("/api/search/?q=!!!")

    assert response.status_code == 200
    assert response.json()["total"] == 0


# ---------------------------------------------------------------------------
# Result shape
# ---------------------------------------------------------------------------

async def test_result_shape(search_client, monkeypatch):
    """Each result has exactly the fields defined by SearchResult."""
    results = [
        SearchResult(
            kind="level",
            id=1,
            title="Eidos 7",
            snippet=None,
            navigation_url="/levels/eidos-7",
            score=0.9,
        ),
        SearchResult(
            kind="collectible",
            id=42,
            title="Memory Stick",
            snippet="Found near the entrance.",
            navigation_url="/levels/eidos-7",
            score=0.5,
        ),
    ]
    monkeypatch.setattr(search_route, "_execute_search", AsyncMock(return_value=results))

    response = await search_client.get("/api/search/?q=eidos")

    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "eidos"
    assert data["total"] == 2

    first = data["results"][0]
    assert set(first.keys()) == {"kind", "id", "title", "snippet", "navigation_url", "score"}
    assert first["kind"] == "level"
    assert first["title"] == "Eidos 7"
    assert first["navigation_url"] == "/levels/eidos-7"
    assert isinstance(first["score"], float)


async def test_query_is_normalised_in_response(search_client, monkeypatch):
    """q is lowercased and stripped before being echoed in the response."""
    monkeypatch.setattr(search_route, "_execute_search", AsyncMock(return_value=[]))

    response = await search_client.get("/api/search/?q=EIDOS")

    assert response.status_code == 200
    assert response.json()["query"] == "eidos"


# ---------------------------------------------------------------------------
# Cache
# ---------------------------------------------------------------------------

async def test_cache_miss_populates_cache(search_client, fake_redis, monkeypatch):
    """On a cache miss the route queries the DB and writes results to Redis."""
    results = [
        SearchResult(
            kind="level", id=1, title="Eidos 7", snippet=None,
            navigation_url="/levels/eidos-7", score=0.9,
        )
    ]
    monkeypatch.setattr(search_route, "_execute_search", AsyncMock(return_value=results))

    assert await fake_redis.get("search:eidos:20") is None

    response = await search_client.get("/api/search/?q=eidos")
    assert response.status_code == 200

    cached = json.loads(await fake_redis.get("search:eidos:20"))
    assert cached == response.json()


async def test_cache_hit_skips_execute(search_client, fake_redis, monkeypatch):
    """On a cache hit the route returns cached data without calling _execute_search."""
    cached_data = {"query": "eidos", "total": 0, "results": []}
    await fake_redis.set("search:eidos:20", json.dumps(cached_data))

    mock_execute = AsyncMock(
        side_effect=AssertionError("_execute_search must not be called on a cache hit")
    )
    monkeypatch.setattr(search_route, "_execute_search", mock_execute)

    response = await search_client.get("/api/search/?q=eidos")

    assert response.status_code == 200
    assert response.json() == cached_data
    mock_execute.assert_not_called()
