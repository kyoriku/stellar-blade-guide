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

# Import-time env contract — must precede every `app.*` import below.
#
# Three modules read env at module scope and fail hard when it is missing:
#   app/db/database.py       builds the engine; DATABASE_URL defaults to '' and
#                            create_async_engine('') raises ArgumentError
#   app/core/auth.py         raises RuntimeError without JWT_SECRET_KEY
#   app/services/comments.py constructs AsyncOpenAI, which raises without a key
#
# The suite never reaches any of them (per-file SQLite engines with get_db
# overridden, fakeredis, monkeypatched moderation) — only the imports have to
# succeed. CI has no server/.env, so these values are what let `uv run pytest`
# run from a bare clone.
#
# DATABASE_URL is forced rather than defaulted: in the dev container it is
# injected as container environment pointing at the real dev Postgres, and a
# future test that forgot its get_db override would otherwise reach it. The
# dummy URL keeps the asyncpg dialect the engine's connect_args are written
# for; it is parsed but never connected to.
import os

os.environ["DATABASE_URL"] = "postgresql+asyncpg://test:test@localhost:5432/test"
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-not-used-in-production")
os.environ.setdefault("OPENAI_API_KEY", "test-openai-key")

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
