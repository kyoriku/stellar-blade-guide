"""
Tests for the comments CRUD endpoints: GET, POST, PATCH, DELETE.

Uses the same SQLite-in-memory strategy as test_auth.py, with its own
fixture chain because the Comment table isn't in conftest's create_all.

Moderation is monkeypatched at the routes.comments._moderate_content boundary
so no OpenAI calls are made. The default fixture mock passes all content;
individual tests override it to return False when testing moderation rejection.

Rate limit testing is intentionally omitted: slowapi's Limiter is created at
module-import time using storage_uri=settings.REDIS_URL, which is a separate
Redis connection from the core.cache.redis_client that the autouse patch_redis
fixture covers. Reliably testing rate limits would require patching slowapi's
internal storage — additional infrastructure for marginal value.

PATCH and DELETE tests seed comments directly into the DB rather than going
through POST, so only the four dedicated POST tests touch the /api/comments/
endpoint via HTTP. This keeps the total POST count well below the 10/min rate
limit even when the full suite is run repeatedly in the same minute window.
"""

from __future__ import annotations

from unittest.mock import AsyncMock

import pytest_asyncio
import app.routers.comments as comments_module

from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.core.auth import create_access_token
from app.db.database import Base, get_db
from app.middleware.rate_limit import setup_rate_limiter
from app.models.comments import Comment
from app.models.users import User, OAuthAccount  # noqa: F401 — registers tables with Base
from app.services.auth import hash_password
from app.routers.comments import router as comments_router


def _make_comments_app(db_session: AsyncSession) -> FastAPI:
    app = FastAPI()
    setup_rate_limiter(app)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.include_router(comments_router, prefix="/api")
    return app


@pytest_asyncio.fixture
async def comments_db_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(
            Base.metadata.create_all,
            tables=[User.__table__, OAuthAccount.__table__, Comment.__table__],
        )
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def comments_db_session(comments_db_engine):
    factory = async_sessionmaker(comments_db_engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest_asyncio.fixture
async def test_user(comments_db_session):
    user = User(
        email="testuser@example.com",
        username="testuser",
        password_hash=hash_password("password123"),
    )
    comments_db_session.add(user)
    await comments_db_session.commit()
    await comments_db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def second_user(comments_db_session):
    user = User(
        email="seconduser@example.com",
        username="seconduser",
        password_hash=hash_password("password123"),
    )
    comments_db_session.add(user)
    await comments_db_session.commit()
    await comments_db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def comments_client(comments_db_session, monkeypatch):
    monkeypatch.setattr(comments_module, "_moderate_content", AsyncMock(return_value=True))
    async with AsyncClient(
        transport=ASGITransport(_make_comments_app(comments_db_session)),
        base_url="http://test",
    ) as c:
        yield c


@pytest_asyncio.fixture
async def user_client(comments_db_session, test_user, monkeypatch):
    monkeypatch.setattr(comments_module, "_moderate_content", AsyncMock(return_value=True))
    token = create_access_token(test_user.id, test_user.role)
    async with AsyncClient(
        transport=ASGITransport(_make_comments_app(comments_db_session)),
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    ) as c:
        yield c


@pytest_asyncio.fixture
async def second_user_client(comments_db_session, second_user, monkeypatch):
    monkeypatch.setattr(comments_module, "_moderate_content", AsyncMock(return_value=True))
    token = create_access_token(second_user.id, second_user.role)
    async with AsyncClient(
        transport=ASGITransport(_make_comments_app(comments_db_session)),
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    ) as c:
        yield c


async def _seed_comment(session: AsyncSession, user_id: int, body: str = "Test comment") -> Comment:
    comment = Comment(user_id=user_id, content_type="walkthrough", content_id=1, body=body)
    session.add(comment)
    await session.commit()
    await session.refresh(comment)
    return comment


# ── GET ───────────────────────────────────────────────────────────────────────

async def test_get_comments_empty_returns_empty_list(comments_client):
    r = await comments_client.get("/api/comments/walkthrough/1")
    assert r.status_code == 200
    assert r.json() == []


async def test_get_comments_returns_posted_comment(comments_client, comments_db_session, test_user):
    await _seed_comment(comments_db_session, test_user.id, body="Seeded comment")

    r = await comments_client.get("/api/comments/walkthrough/1")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert data[0]["body"] == "Seeded comment"
    assert data[0]["content_type"] == "walkthrough"
    assert data[0]["content_id"] == 1


async def test_get_comments_invalid_content_type_returns_400(comments_client):
    r = await comments_client.get("/api/comments/invalid/1")
    assert r.status_code == 400


# ── POST ──────────────────────────────────────────────────────────────────────

async def test_post_comment_authenticated_returns_201(user_client):
    r = await user_client.post("/api/comments/", json={
        "content_type": "walkthrough",
        "content_id": 1,
        "body": "A valid comment body",
    })
    assert r.status_code == 201
    body = r.json()
    assert body["body"] == "A valid comment body"
    assert body["content_type"] == "walkthrough"
    assert body["content_id"] == 1
    assert body["user"]["username"] == "testuser"


async def test_post_comment_unauthenticated_returns_401(comments_client):
    r = await comments_client.post("/api/comments/", json={
        "content_type": "walkthrough",
        "content_id": 1,
        "body": "Should be rejected",
    })
    assert r.status_code == 401


async def test_post_comment_flagged_by_moderation_returns_400(user_client, monkeypatch):
    monkeypatch.setattr(comments_module, "_moderate_content", AsyncMock(return_value=False))
    r = await user_client.post("/api/comments/", json={
        "content_type": "walkthrough",
        "content_id": 1,
        "body": "Flagged content",
    })
    assert r.status_code == 400


async def test_post_comment_empty_body_returns_422(user_client):
    r = await user_client.post("/api/comments/", json={
        "content_type": "walkthrough",
        "content_id": 1,
        "body": "",
    })
    assert r.status_code == 422


# ── PATCH ─────────────────────────────────────────────────────────────────────

async def test_edit_own_comment_returns_200(user_client, comments_db_session, test_user):
    comment = await _seed_comment(comments_db_session, test_user.id, body="Original body")

    r = await user_client.patch(f"/api/comments/{comment.id}", json={"body": "Updated body"})
    assert r.status_code == 200
    assert r.json()["body"] == "Updated body"


async def test_edit_other_users_comment_returns_403(second_user_client, comments_db_session, test_user):
    comment = await _seed_comment(comments_db_session, test_user.id)

    r = await second_user_client.patch(f"/api/comments/{comment.id}", json={"body": "Hijacked"})
    assert r.status_code == 403


async def test_edit_flagged_update_returns_400(user_client, comments_db_session, test_user, monkeypatch):
    comment = await _seed_comment(comments_db_session, test_user.id, body="Original body")

    monkeypatch.setattr(comments_module, "_moderate_content", AsyncMock(return_value=False))
    r = await user_client.patch(f"/api/comments/{comment.id}", json={"body": "Flagged edit"})
    assert r.status_code == 400


# ── DELETE ────────────────────────────────────────────────────────────────────

async def test_delete_own_comment_returns_204(user_client, comments_client, comments_db_session, test_user):
    comment = await _seed_comment(comments_db_session, test_user.id, body="To be deleted")

    r = await user_client.delete(f"/api/comments/{comment.id}")
    assert r.status_code == 204

    # Soft-deleted comment with no live replies must not appear in GET results
    get_r = await comments_client.get("/api/comments/walkthrough/1")
    assert get_r.status_code == 200
    ids = [c["id"] for c in get_r.json()]
    assert comment.id not in ids


async def test_delete_other_users_comment_returns_403(second_user_client, comments_db_session, test_user):
    comment = await _seed_comment(comments_db_session, test_user.id)

    r = await second_user_client.delete(f"/api/comments/{comment.id}")
    assert r.status_code == 403


async def test_delete_unauthenticated_returns_401(comments_client, comments_db_session, test_user):
    comment = await _seed_comment(comments_db_session, test_user.id)

    r = await comments_client.delete(f"/api/comments/{comment.id}")
    assert r.status_code == 401
