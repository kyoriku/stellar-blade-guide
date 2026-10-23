"""
Testing strategy for server/tests/

REDIS — fakeredis.aioredis.FakeRedis, one fresh instance per test:
    app/core/cache.py holds a module-level `redis_client` that `get_cache` and
    `set_cache` use directly. We monkeypatch that attribute before each test
    with a FakeRedis instance (decode_responses=True so it behaves like the
    production client). Each test gets an empty cache, making cache-miss and
    cache-hit scenarios trivially controllable without needing a real Redis.

RATE LIMITER — disabled for the whole suite (autouse disable_rate_limits):
    The slowapi limiter's storage is real Redis (moving windows, one counter per
    route and client), and every test shares client IP 127.0.0.1 (the httpx
    ASGITransport default). Counts would therefore accumulate ACROSS suite runs:
    two back-to-back `pytest` runs inside one minute would 429 on the tighter
    auth limits (register 5/min, login 10/min) and fail spuriously. So slowapi's
    public `enabled` flag is off per test. setup_rate_limiter(app) is still
    required in each file's client fixture — the @limiter.limit decorators read
    request.app.state.limiter either way — and with the limiter disabled the
    suite needs no real Redis at all. A test that asserts a 429 opts back in with
    the rate_limits_on fixture, which counts in process memory instead.

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
#
# ENVIRONMENT is forced too, because an unset one now means production. That would
# stop app/config/settings.py at import for the production secrets CI lacks, and it
# would give every response Secure, Domain=.stellarbladeguide.com cookies, which the
# test client at http://test never sends back (the auth and OAuth tests rely on its
# cookie jar). A test that wants production monkeypatches settings.ENVIRONMENT.
import os

os.environ["DATABASE_URL"] = "postgresql+asyncpg://test:test@localhost:5432/test"
os.environ["ENVIRONMENT"] = "development"
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-not-used-in-production")
os.environ.setdefault("OPENAI_API_KEY", "test-openai-key")

import pytest
import pytest_asyncio
import fakeredis.aioredis
from limits.storage import MemoryStorage

import app.core.cache
from app.core.security import limiter


@pytest.fixture(autouse=True)
def disable_rate_limits():
    limiter.enabled = False
    yield
    limiter.enabled = True


@pytest.fixture
def rate_limits_on(monkeypatch):
    """Limits on for one test, counted in process memory, so it sees real 429s.

    The limiter's own storage is the dev Redis. Every piece the request path can
    reach (the strategy, its storage, the outage fallback and its dead flag) is
    swapped before the first hit, so nothing connects, and monkeypatch restores
    them all afterwards. Never call limiter.reset(): it clears whatever storage the
    limiter holds. Decorate probe routes once, at module scope: decorating a
    function twice stacks its limits.
    """
    storage = MemoryStorage()
    strategy = type(limiter._limiter)
    monkeypatch.setattr(limiter, "_storage", storage)
    monkeypatch.setattr(limiter, "_limiter", strategy(storage))
    monkeypatch.setattr(limiter, "_fallback_limiter", strategy(MemoryStorage()))
    monkeypatch.setattr(limiter, "_storage_dead", False)
    monkeypatch.setattr(limiter, "enabled", True)
    return limiter


@pytest_asyncio.fixture
async def fake_redis():
    redis = fakeredis.aioredis.FakeRedis(decode_responses=True)
    yield redis
    await redis.aclose()


@pytest_asyncio.fixture(autouse=True)
async def patch_redis(fake_redis, monkeypatch):
    monkeypatch.setattr(app.core.cache, "redis_client", fake_redis)
