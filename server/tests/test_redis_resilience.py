"""
Tests for Redis-outage resilience.

Two layers keep a Redis outage from taking the site down (cause of the
2026-07-02 incident, where a hung Redis socket 500'd every rate-limited route):

1. The slowapi Limiter (core/security.py) bounds socket waits to 2s and falls
   back to per-process in-memory limits (swallow_errors=True,
   in_memory_fallback_enabled=True) instead of raising into every decorated
   route.

2. error_handler_middleware maps redis.exceptions.RedisError to 503 +
   Retry-After for the paths that legitimately fail closed (refresh tokens,
   password reset) — a deliberate dependency-outage signal instead of an
   unhandled 500 with a traceback per request.

Same strategy as test_auth.py: own fixture chain with the User tables in
SQLite, and core.auth's redis_client binding patched to the shared FakeRedis.
"""

from __future__ import annotations

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from redis.exceptions import TimeoutError as RedisTimeoutError
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

import core.auth as core_auth
from core.security import limiter
from db.database import Base, get_db
from models.users import User, OAuthAccount  # noqa: F401 — registers tables with Base
from middleware.error_handler import add_error_handler_middleware
from middleware.rate_limit import setup_rate_limiter
from routes.auth import router as auth_router


def _make_app(db_session: AsyncSession) -> FastAPI:
    app = FastAPI()
    setup_rate_limiter(app)
    add_error_handler_middleware(app)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.include_router(auth_router, prefix="/api")

    @app.get("/api/test-boom")
    async def _boom():
        raise ValueError("not a redis problem")

    return app


@pytest_asyncio.fixture
async def resilience_db_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(
            Base.metadata.create_all,
            tables=[User.__table__, OAuthAccount.__table__],
        )
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def resilience_db_session(resilience_db_engine):
    factory = async_sessionmaker(resilience_db_engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest_asyncio.fixture
async def resilience_client(resilience_db_session, monkeypatch, fake_redis):
    monkeypatch.setattr(core_auth, "redis_client", fake_redis)
    async with AsyncClient(
        transport=ASGITransport(_make_app(resilience_db_session)),
        base_url="http://test",
    ) as c:
        yield c


# ── RedisError → 503 ──────────────────────────────────────────────────────────

async def test_redis_timeout_on_refresh_returns_503(resilience_client, fake_redis, monkeypatch):
    async def _timeout(*args, **kwargs):
        raise RedisTimeoutError("Timeout reading from socket")

    monkeypatch.setattr(fake_redis, "get", _timeout)

    # validate_refresh_token's redis GET runs before any DB access, so a
    # syntactically valid "user_id:token" cookie is all the route needs.
    # Sent as a raw header — httpx's jar won't match cookies to the dotless
    # "test" host.
    r = await resilience_client.post(
        "/api/auth/refresh",
        headers={"Cookie": "refresh_token=1:sometoken"},
    )

    assert r.status_code == 503
    assert r.headers["retry-after"] == "30"
    body = r.json()
    assert body["error"] == "Service temporarily unavailable"
    assert body["path"] == "/api/auth/refresh"


async def test_non_redis_error_still_returns_500(resilience_client):
    r = await resilience_client.get("/api/test-boom")
    assert r.status_code == 500
    assert r.json()["error"] == "Internal server error"


# ── Limiter outage config ─────────────────────────────────────────────────────

def test_limiter_degrades_instead_of_raising():
    # Regression guard for the outage fix: storage errors must fall back to
    # in-memory limits, never propagate into routes.
    assert limiter._swallow_errors is True
    assert limiter._in_memory_fallback_enabled is True
