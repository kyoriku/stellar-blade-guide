"""
Tests for the users endpoints — currently the avatar-moderation paths of
PATCH /api/users/me.

Avatar moderation deliberately fails CLOSED (503 + Retry-After), unlike
comment moderation which fails open: blocking comments during an OpenAI
outage breaks the site's main interaction, whereas an avatar can wait.
These tests pin that contract.

Token injection follows the test_comments.py pattern: create_access_token()
is called directly, no login endpoint traffic.

The avatar pipeline's three external dependencies are stubbed at the
app.services.users module level so the real check_image_moderation() code
path executes end-to-end through the endpoint:
  - httpx.AsyncClient  → the source-URL validation fetch (200, image/png)
  - openai.AsyncOpenAI → moderation (raises / flagged / clean per test)
  - cloudinary.uploader.upload → records calls, returns a stub secure_url

DDL strategy: users + oauth_accounts via Base.metadata.create_all (no JSONB
columns). app.models.comments is imported for the mapper registry only —
User.comments must resolve — but the comments table is never created or
queried here.

conftest's autouse patch_redis / disable_rate_limits cover Redis and slowapi.
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.core.auth import create_access_token
from app.db.database import Base, get_db
from app.middleware.rate_limit import setup_rate_limiter
from app.models.users import User, OAuthAccount  # noqa: F401 — registers tables with Base
from app.models.comments import Comment  # noqa: F401 — User.comments mapper resolution
from app.services.auth import hash_password
from app.routers.users import router as users_router


def _make_users_app(db_session: AsyncSession) -> FastAPI:
    app = FastAPI()
    setup_rate_limiter(app)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.include_router(users_router, prefix="/api")
    return app


@pytest_asyncio.fixture
async def users_db_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(
            Base.metadata.create_all,
            tables=[User.__table__, OAuthAccount.__table__],
        )
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def users_db_session(users_db_engine):
    factory = async_sessionmaker(users_db_engine, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest_asyncio.fixture
async def test_user(users_db_session):
    user = User(
        email="user@example.com",
        username="testuser",
        password_hash=hash_password("password123"),
    )
    users_db_session.add(user)
    await users_db_session.commit()
    await users_db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def user_client(users_db_session, test_user):
    token = create_access_token(test_user.id, test_user.role)
    async with AsyncClient(
        transport=ASGITransport(_make_users_app(users_db_session)),
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    ) as c:
        yield c


# ── Avatar pipeline stubs ─────────────────────────────────────────────────────

class _StubHTTPResponse:
    status_code = 200
    headers = {"content-type": "image/png"}


class _StubHTTPClient:
    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def get(self, url, **kwargs):
        return _StubHTTPResponse()


def _moderation_response(flagged: bool):
    return SimpleNamespace(
        results=[
            SimpleNamespace(
                flagged=flagged,
                categories=SimpleNamespace(harassment=flagged, violence=False),
            )
        ]
    )


def _patch_avatar_pipeline(monkeypatch, moderation) -> list:
    """Stub the avatar pipeline's external calls. `moderation` is an async
    callable standing in for client.moderations.create. Returns the list that
    records cloudinary upload calls."""
    monkeypatch.setattr(
        "app.services.users.httpx.AsyncClient", lambda *a, **k: _StubHTTPClient()
    )
    monkeypatch.setattr(
        "app.services.users.openai.AsyncOpenAI",
        lambda *a, **k: SimpleNamespace(moderations=SimpleNamespace(create=moderation)),
    )

    upload_calls: list = []

    def _stub_upload(url, **kwargs):
        upload_calls.append(url)
        return {"secure_url": "https://res.cloudinary.com/test/avatar.webp"}

    monkeypatch.setattr("app.services.users.cloudinary.uploader.upload", _stub_upload)
    return upload_calls


# ── PATCH /api/users/me — avatar moderation ───────────────────────────────────

async def test_moderation_outage_returns_503(
    user_client, users_db_session, test_user, monkeypatch
):
    async def _create(**kwargs):
        raise ConnectionError("openai unreachable")

    upload_calls = _patch_avatar_pipeline(monkeypatch, _create)

    r = await user_client.patch(
        "/api/users/me", json={"avatar_url": "https://example.com/pic.png"}
    )

    assert r.status_code == 503
    assert "temporarily unavailable" in r.json()["detail"]
    assert r.headers["Retry-After"] == "30"
    assert upload_calls == []
    await users_db_session.refresh(test_user)
    assert test_user.avatar_url is None


async def test_flagged_image_returns_400(
    user_client, users_db_session, test_user, monkeypatch
):
    async def _create(**kwargs):
        return _moderation_response(flagged=True)

    upload_calls = _patch_avatar_pipeline(monkeypatch, _create)

    r = await user_client.patch(
        "/api/users/me", json={"avatar_url": "https://example.com/pic.png"}
    )

    assert r.status_code == 400
    assert "rejected by content moderation" in r.json()["detail"]
    assert upload_calls == []
    await users_db_session.refresh(test_user)
    assert test_user.avatar_url is None


async def test_clean_image_uploads_and_sets_avatar(
    user_client, users_db_session, test_user, monkeypatch
):
    async def _create(**kwargs):
        return _moderation_response(flagged=False)

    upload_calls = _patch_avatar_pipeline(monkeypatch, _create)

    r = await user_client.patch(
        "/api/users/me", json={"avatar_url": "https://example.com/pic.png"}
    )

    assert r.status_code == 200
    assert r.json()["avatar_url"] == "https://res.cloudinary.com/test/avatar.webp"
    assert upload_calls == ["https://example.com/pic.png"]
    await users_db_session.refresh(test_user)
    assert test_user.avatar_url == "https://res.cloudinary.com/test/avatar.webp"
