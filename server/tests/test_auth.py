"""
Tests for auth flow: register, login, token refresh, logout, and protected routes.

Uses the same SQLite-in-memory strategy as other test files, with its own fixture
chain because the User/OAuthAccount tables aren't in conftest's create_all.

fakeredis: conftest.py's autouse patch_redis patches core.cache.redis_client.
core/auth.py's token helpers (store_refresh_token, validate_refresh_token,
revoke_refresh_token) import redis_client directly from core.cache, giving
core.auth its own binding. The auth_client fixture patches that binding too so
all token operations hit the same in-memory FakeRedis.
"""

from __future__ import annotations

import pytest_asyncio
import jwt
from datetime import datetime, timedelta, timezone

from fastapi import Depends, FastAPI
from fastapi.responses import JSONResponse
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

import app.core.auth as core_auth
from app.db.database import Base, get_db
from app.models.users import User, OAuthAccount  # noqa: F401 — registers tables with Base
from app.middleware.rate_limit import setup_rate_limiter
from app.middleware.exception_handlers import add_exception_handlers
from app.routers.auth import router as auth_router
from app.services.auth import hash_password
from app.core.auth import get_current_user, SECRET_KEY, ALGORITHM


def _make_auth_app(db_session: AsyncSession) -> FastAPI:
    app = FastAPI()
    setup_rate_limiter(app)
    add_exception_handlers(app)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.include_router(auth_router, prefix="/api")

    @app.get("/api/test-protected")
    async def _stub(user=Depends(get_current_user)):
        return JSONResponse({"user_id": user.id})

    return app


@pytest_asyncio.fixture
async def auth_db_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(
            Base.metadata.create_all,
            tables=[User.__table__, OAuthAccount.__table__],
        )
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def auth_db_session(auth_db_engine):
    factory = async_sessionmaker(auth_db_engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest_asyncio.fixture
async def auth_client(auth_db_session, monkeypatch, fake_redis):
    monkeypatch.setattr(core_auth, "redis_client", fake_redis)
    async with AsyncClient(
        transport=ASGITransport(_make_auth_app(auth_db_session)),
        base_url="http://test",
    ) as c:
        yield c


@pytest_asyncio.fixture
async def test_user(auth_db_session):
    user = User(
        email="testuser@example.com",
        username="testuser",
        password_hash=hash_password("password123"),
    )
    auth_db_session.add(user)
    await auth_db_session.commit()
    await auth_db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def authenticated_client(auth_db_session, test_user, monkeypatch, fake_redis):
    monkeypatch.setattr(core_auth, "redis_client", fake_redis)
    app = _make_auth_app(auth_db_session)
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as login_c:
        r = await login_c.post(
            "/api/auth/login",
            json={"email": test_user.email, "password": "password123"},
        )
        token = r.json()["access_token"]
    async with AsyncClient(
        transport=ASGITransport(app),
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    ) as c:
        yield c


# ── Registration ──────────────────────────────────────────────────────────────

async def test_register_new_user_returns_token(auth_client):
    r = await auth_client.post("/api/auth/register", json={
        "email": "newuser@example.com",
        "username": "newuser",
        "password": "password123",
    })
    assert r.status_code == 201
    body = r.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert "user" in body
    assert "refresh_token" in r.cookies


async def test_register_duplicate_email_returns_409(auth_client, test_user):
    r = await auth_client.post("/api/auth/register", json={
        "email": test_user.email,
        "username": "otherusername",
        "password": "password123",
    })
    assert r.status_code == 409


async def test_register_invalid_password_returns_422(auth_client):
    r = await auth_client.post("/api/auth/register", json={
        "email": "short@example.com",
        "username": "shortpass",
        "password": "abc",
    })
    assert r.status_code == 422


async def test_register_invalid_email_returns_friendly_message(auth_client):
    r = await auth_client.post("/api/auth/register", json={
        "email": "not-an-email",
        "username": "bademail",
        "password": "password123",
    })
    assert r.status_code == 422
    # Custom message instead of the email-validator library default. The app's
    # RequestValidationError handler flattens 422s to a single string detail.
    assert "Please enter a valid email address" in r.json()["detail"]


async def test_register_normalizes_email_domain(auth_client):
    # FriendlyEmail must preserve EmailStr's normalization (lowercased domain,
    # stripped) so uniqueness lookups keep working.
    r = await auth_client.post("/api/auth/register", json={
        "email": "  Mixed@EXAMPLE.COM  ",
        "username": "mixedcase",
        "password": "password123",
    })
    assert r.status_code == 201
    assert r.json()["user"]["email"] == "Mixed@example.com"


# ── Login ─────────────────────────────────────────────────────────────────────

async def test_login_valid_credentials_returns_token(auth_client, test_user):
    r = await auth_client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "password123",
    })
    assert r.status_code == 200
    body = r.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert "refresh_token" in r.cookies


async def test_login_wrong_password_returns_401(auth_client, test_user):
    r = await auth_client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "wrongpassword",
    })
    assert r.status_code == 401


async def test_login_nonexistent_email_returns_401(auth_client):
    r = await auth_client.post("/api/auth/login", json={
        "email": "nobody@example.com",
        "password": "password123",
    })
    assert r.status_code == 401


# ── Token refresh ─────────────────────────────────────────────────────────────

async def test_refresh_valid_cookie_returns_new_token(auth_client, test_user):
    await auth_client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "password123",
    })
    r = await auth_client.post("/api/auth/refresh")
    assert r.status_code == 200
    assert "access_token" in r.json()


async def test_refresh_missing_cookie_returns_401(auth_client):
    r = await auth_client.post("/api/auth/refresh")
    assert r.status_code == 401


async def test_refresh_revoked_token_returns_401(auth_client, test_user):
    r_login = await auth_client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "password123",
    })
    # Capture raw cookie value before logout clears the client jar
    saved_value = r_login.cookies["refresh_token"]

    # Logout revokes the token in Redis and clears it from auth_client.cookies
    await auth_client.post("/api/auth/logout")

    # Re-send the revoked cookie as a raw header — cookies added to httpx's jar
    # via cookies.set(domain="test") are silently never sent to the dotless
    # "test" host, so the jar route would pass via the no-cookie branch instead.
    r = await auth_client.post(
        "/api/auth/refresh",
        headers={"Cookie": f"refresh_token={saved_value}"},
    )
    assert r.status_code == 401
    # Pin the branch: revoked-in-Redis, not missing/malformed cookie
    assert r.json()["detail"] == "Refresh token invalid or expired"


# ── Logout ────────────────────────────────────────────────────────────────────

async def test_logout_returns_204(auth_client, test_user):
    await auth_client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "password123",
    })
    r = await auth_client.post("/api/auth/logout")
    assert r.status_code == 204


# ── Protected route ───────────────────────────────────────────────────────────

async def test_protected_valid_token_returns_200(authenticated_client):
    r = await authenticated_client.get("/api/test-protected")
    assert r.status_code == 200
    assert "user_id" in r.json()


async def test_protected_no_header_returns_401(auth_client):
    r = await auth_client.get("/api/test-protected")
    assert r.status_code == 401


async def test_protected_malformed_header_returns_401(auth_client):
    r = await auth_client.get("/api/test-protected", headers={"Authorization": "Token abc123"})
    assert r.status_code == 401


async def test_protected_expired_token_returns_401(auth_client, test_user):
    expired_token = jwt.encode(
        {
            "sub": str(test_user.id),
            "role": test_user.role,
            "type": "access",
            "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
            "iat": datetime.now(timezone.utc) - timedelta(hours=1),
        },
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    r = await auth_client.get(
        "/api/test-protected",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert r.status_code == 401
