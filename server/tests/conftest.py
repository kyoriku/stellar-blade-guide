"""
Testing strategy for server/tests/

REDIS — fakeredis.aioredis.FakeRedis, one fresh instance per test:
    app/core/cache.py holds a module-level `redis_client` that `get_cache` and
    `set_cache` use directly. We monkeypatch that attribute before each test
    with a FakeRedis instance (decode_responses=True so it behaves like the
    production client). Each test gets an empty cache, making cache-miss and
    cache-hit scenarios trivially controllable without needing a real Redis.

RATE LIMITER — disabled for the whole suite (autouse disable_rate_limits):
    The slowapi limiter's storage is real Redis with fixed 60-second windows
    keyed by IP + URL path, and every test shares client IP 127.0.0.1 (the
    httpx ASGITransport default). Counts therefore accumulate ACROSS suite
    runs: two back-to-back `pytest` runs inside one minute would 429 on the
    tighter auth limits (register 5/min, login 10/min) and fail spuriously.
    No test asserts 429 behavior, so we flip slowapi's public `enabled` flag
    off per test. setup_rate_limiter(app) is still required in each file's
    client fixture — the @limiter.limit decorators read
    request.app.state.limiter either way — and with the limiter disabled the
    suite needs no real Redis at all.

DATABASE + HTTP CLIENT — per test file, not here:
    Each test file builds its own SQLite in-memory engine (restricted to the
    tables its router needs; see test_collectibles_route.py for the JSONB
    workaround) and a bare per-test FastAPI app mounting only the router under
    test. app.main.app is deliberately not used: it carries bot-filter
    middleware, a Redis lifespan ping, Cloudinary config, ETag, gzip, and
    every router. All irrelevant here and some (the bot filter in particular)
    could silently reject test requests.
"""

import pytest
import pytest_asyncio
import fakeredis.aioredis

import app.core.cache
from app.core.security import limiter


@pytest.fixture(autouse=True)
def disable_rate_limits():
    limiter.enabled = False
    yield
    limiter.enabled = True


@pytest_asyncio.fixture
async def fake_redis():
    redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    yield redis
    await redis.aclose()


@pytest_asyncio.fixture(autouse=True)
async def patch_redis(fake_redis, monkeypatch):
    monkeypatch.setattr(app.core.cache, "redis_client", fake_redis)
