"""
Tests for GET /api/types/.

Uses the same SQLite-in-memory + fakeredis strategy as test_levels.py, but
defines its own db_engine / db_session / client fixtures locally because the
conftest fixtures are coupled to the levels router and Level/Location tables.

fakeredis infrastructure comes from conftest.py — fake_redis and the autouse
patch_redis fixture apply here automatically, so each test starts with an
empty cache and core.cache.redis_client points at the FakeRedis instance.
"""

import json
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from db.database import Base, get_db
from models.collectibles import CollectibleType  # noqa: F401 — registers table with Base
from middleware.rate_limit import setup_rate_limiter
from routes import types as types_route


@pytest_asyncio.fixture
async def types_db_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(
            Base.metadata.create_all,
            tables=[CollectibleType.__table__],
        )
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def types_db_session(types_db_engine):
    session_factory = async_sessionmaker(
        types_db_engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def types_client(types_db_session):
    app = FastAPI()
    setup_rate_limiter(app)
    app.include_router(types_route.router, prefix="/api")

    async def override_get_db():
        yield types_db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def test_get_all_types_empty(types_client):
    """GET /api/types/ returns 200 with an empty list when no types exist."""
    response = await types_client.get("/api/types/")
    assert response.status_code == 200
    assert response.json() == []


async def test_get_all_types_with_data(types_client, types_db_session):
    """GET /api/types/ returns all types ordered alphabetically by name."""
    types_db_session.add_all([
        CollectibleType(id=1, name="Document", slug="document"),
        CollectibleType(id=2, name="Nano Suit", slug="nano-suit"),
    ])
    await types_db_session.commit()

    response = await types_client.get("/api/types/")
    assert response.status_code == 200

    data = response.json()
    assert len(data) == 2
    assert data[0]["name"] == "Document"
    assert data[1]["name"] == "Nano Suit"


async def test_response_shape(types_client, types_db_session):
    """Each item has exactly the fields defined by TypeResponse, with correct types."""
    types_db_session.add(CollectibleType(
        id=1, name="Nano Suit", slug="nano-suit"))
    await types_db_session.commit()

    response = await types_client.get("/api/types/")
    item = response.json()[0]

    assert set(item.keys()) == {"id", "name",
                                "category_group", "display_order"}
    assert isinstance(item["id"], int)
    assert isinstance(item["name"], str)
    assert item["category_group"] is None
    assert item["display_order"] is None


async def test_cache_miss_populates_cache(types_client, types_db_session, fake_redis):
    """On a cache miss the route queries the DB and writes the result to Redis."""
    types_db_session.add(CollectibleType(
        id=1, name="Nano Suit", slug="nano-suit"))
    await types_db_session.commit()

    assert await fake_redis.get("types:all") is None

    response = await types_client.get("/api/types/")
    assert response.status_code == 200

    # The route caches only {id, name} — the raw dict before Pydantic adds the
    # optional-null fields. The HTTP response has 4 fields; the cache has 2.
    cached = json.loads(await fake_redis.get("types:all"))
    assert cached == [{"id": 1, "name": "Nano Suit"}]


async def test_cache_hit_skips_db(types_client, fake_redis):
    """On a cache hit the route returns cached data without touching the DB."""
    cached_data = [{"id": 99, "name": "Cached Type",
                    "category_group": None, "display_order": None}]
    await fake_redis.set("types:all", json.dumps(cached_data))

    # DB is empty — if the route hits the DB it would return []
    response = await types_client.get("/api/types/")
    assert response.status_code == 200
    assert response.json() == cached_data
