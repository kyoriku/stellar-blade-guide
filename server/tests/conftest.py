"""
Testing strategy for server/tests/

DATABASE — SQLite in-memory via aiosqlite, one fresh engine per test:
    The Level and Location models use only standard SQL types (Integer, String,
    ForeignKey), so SQLite covers them without Postgres. A per-test in-memory
    engine is zero-config and zero-cleanup: `create_all` runs on a blank DB,
    the test does its thing, `dispose` tears it down. No test DB to provision,
    no rollbacks to coordinate. The Collectible model uses JSONB (Postgres-only),
    so we restrict `create_all` to only the two tables the levels route needs.

REDIS — fakeredis.aioredis.FakeRedis, one fresh instance per test:
    core/cache.py holds a module-level `redis_client` that `get_cache` and
    `set_cache` use directly. We monkeypatch that attribute before each test
    with a FakeRedis instance (decode_responses=True so it behaves like the
    production client). Each test gets an empty cache, making cache-miss and
    cache-hit scenarios trivially controllable without needing a real Redis.

HTTP CLIENT — minimal FastAPI app, not main.app:
    main.app carries bot-filter middleware, a Redis lifespan ping, Cloudinary
    config, ETag, gzip, and eleven routers. All irrelevant here and some (the
    bot filter in particular) could silently reject test requests. Instead we
    build a bare FastAPI app per test that includes only the levels router and
    the rate-limit setup (required because @limiter.limit() reads
    request.app.state.limiter). The `get_db` dependency is overridden to yield
    the test session. The rate limiter uses real Redis (available in the
    devcontainer at redis://redis:6379) — 5 test requests won't approach the
    100/minute ceiling.
"""

import json
import pytest
import pytest_asyncio
import fakeredis.aioredis
from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

import core.cache
from db.database import Base, get_db
from models.collectibles import Level, Location  # noqa: F401 — registers tables with Base
from middleware.rate_limit import setup_rate_limiter
from routes import levels as levels_route


@pytest_asyncio.fixture
async def fake_redis():
    redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    yield redis
    await redis.aclose()


@pytest_asyncio.fixture(autouse=True)
async def patch_redis(fake_redis, monkeypatch):
    monkeypatch.setattr(core.cache, "redis_client", fake_redis)


@pytest_asyncio.fixture
async def db_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(
            Base.metadata.create_all,
            tables=[Level.__table__, Location.__table__],
        )
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine):
    session_factory = async_sessionmaker(db_engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_session):
    app = FastAPI()
    setup_rate_limiter(app)
    app.include_router(levels_route.router, prefix="/api")

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
