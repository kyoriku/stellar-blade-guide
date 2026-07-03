"""
Tests for reply notifications: emit-on-reply (with null/self guards), the
GET/PATCH notifications API, and the null-actor read guard.

Same SQLite-in-memory strategy as test_comments.py. The app mounts both the
comments and notifications routers so a reply POST exercises the emit path and
the notifications endpoints read it back. Moderation is monkeypatched so no
OpenAI calls happen. Label lookups use content_type='level' (SQLite-safe);
walkthrough/collectible label tables are Postgres-only (JSONB) and rely on the
route's defensive fallback, covered by reasoning rather than a live table here.
"""

from __future__ import annotations

from unittest.mock import AsyncMock

import pytest_asyncio
import routes.comments as comments_module

from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.core.auth import create_access_token
from app.db.database import Base, get_db
from middleware.rate_limit import setup_rate_limiter
from app.models.comments import Comment
from app.models.notifications import Notification
from app.models.collectibles import Level, CollectibleType
from app.models.users import User, OAuthAccount  # noqa: F401 — registers tables with Base
from routes.auth import hash_password
from routes.comments import router as comments_router
from routes.notifications import router as notifications_router


def _make_app(db_session: AsyncSession) -> FastAPI:
    app = FastAPI()
    setup_rate_limiter(app)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.include_router(comments_router, prefix="/api")
    app.include_router(notifications_router, prefix="/api")
    return app


@pytest_asyncio.fixture
async def db_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(
            Base.metadata.create_all,
            tables=[User.__table__, OAuthAccount.__table__, Comment.__table__,
                    Notification.__table__, Level.__table__, CollectibleType.__table__],
        )
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine):
    factory = async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session


async def _make_user(session, email, username):
    u = User(email=email, username=username, password_hash=hash_password("password123"))
    session.add(u)
    await session.commit()
    await session.refresh(u)
    return u


@pytest_asyncio.fixture
async def user_a(db_session):
    return await _make_user(db_session, "a@example.com", "alice")


@pytest_asyncio.fixture
async def user_b(db_session):
    return await _make_user(db_session, "b@example.com", "bob")


def _client(db_session, user=None):
    headers = {}
    if user is not None:
        headers["Authorization"] = f"Bearer {create_access_token(user.id, user.role)}"
    return AsyncClient(transport=ASGITransport(_make_app(db_session)), base_url="http://test", headers=headers)


@pytest_asyncio.fixture(autouse=True)
def _pass_moderation(monkeypatch):
    monkeypatch.setattr(comments_module, "_moderate_content", AsyncMock(return_value=True))


async def _seed_comment(session, user_id, content_type="walkthrough", content_id=1, parent_id=None):
    c = Comment(user_id=user_id, content_type=content_type, content_id=content_id,
                parent_id=parent_id, body="seed")
    session.add(c)
    await session.commit()
    await session.refresh(c)
    return c


async def _unread_count(session, user_id):
    return (await session.execute(
        select(func.count()).select_from(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa: E712
    )).scalar_one()


# ── emit on reply ──────────────────────────────────────────────────────────────

async def test_reply_creates_notification_for_parent_author(db_session, user_a, user_b):
    parent = await _seed_comment(db_session, user_a.id)
    async with _client(db_session, user_b) as c:
        r = await c.post("/api/comments/", json={
            "content_type": "walkthrough", "content_id": 1,
            "parent_id": parent.id, "body": "nice find",
        })
    assert r.status_code == 201
    notes = (await db_session.execute(select(Notification))).scalars().all()
    assert len(notes) == 1
    n = notes[0]
    assert n.user_id == user_a.id            # recipient = parent author
    assert n.actor_id == user_b.id           # actor = replier
    assert n.type == "comment_reply"
    assert n.content_type == "walkthrough" and n.content_id == 1
    assert n.comment_id == r.json()["id"]


async def test_self_reply_creates_no_notification(db_session, user_a):
    parent = await _seed_comment(db_session, user_a.id)
    async with _client(db_session, user_a) as c:
        r = await c.post("/api/comments/", json={
            "content_type": "walkthrough", "content_id": 1,
            "parent_id": parent.id, "body": "replying to myself",
        })
    assert r.status_code == 201
    assert (await db_session.execute(select(func.count()).select_from(Notification))).scalar_one() == 0


async def test_reply_to_anonymous_parent_creates_no_notification(db_session, user_b):
    # Parent author is null (deleted account) — null guard must skip the notification.
    parent = await _seed_comment(db_session, user_id=None)
    async with _client(db_session, user_b) as c:
        r = await c.post("/api/comments/", json={
            "content_type": "walkthrough", "content_id": 1,
            "parent_id": parent.id, "body": "reply to ghost",
        })
    assert r.status_code == 201
    assert (await db_session.execute(select(func.count()).select_from(Notification))).scalar_one() == 0


async def test_top_level_comment_creates_no_notification(db_session, user_a):
    async with _client(db_session, user_a) as c:
        r = await c.post("/api/comments/", json={
            "content_type": "walkthrough", "content_id": 1, "body": "top level",
        })
    assert r.status_code == 201
    assert (await db_session.execute(select(func.count()).select_from(Notification))).scalar_one() == 0


# ── notifications API ────────────────────────────────────────────────────────

async def test_list_requires_auth(db_session):
    async with _client(db_session) as c:
        r = await c.get("/api/notifications")
    assert r.status_code == 401


async def test_list_returns_items_label_url_and_unread_count(db_session, user_a, user_b):
    level = Level(name="Eidos 7", display_order=1)
    db_session.add(level)
    await db_session.commit()
    await db_session.refresh(level)
    reply = await _seed_comment(db_session, user_b.id, content_type="level", content_id=level.id)
    db_session.add(Notification(
        user_id=user_a.id, actor_id=user_b.id, type="comment_reply",
        comment_id=reply.id, content_type="level", content_id=level.id,
    ))
    await db_session.commit()

    async with _client(db_session, user_a) as c:
        r = await c.get("/api/notifications")
    assert r.status_code == 200
    body = r.json()
    assert body["unread_count"] == 1
    item = body["items"][0]
    assert item["actor_username"] == "bob"
    assert item["label"] == "Eidos 7"
    assert item["url"] == f"/levels/eidos-7#comment-{reply.id}"
    assert item["is_read"] is False


async def test_collectible_label_uses_plural_slug_not_singular_name(db_session, user_a, user_b):
    # DB stores the singular type name ("Document"), but the page/URL is the plural
    # slug ("documents"). The label must match the URL, not the singular name.
    ct = CollectibleType(name="Document", category_group="collectibles", slug="documents", display_order=1)
    db_session.add(ct)
    await db_session.commit()
    await db_session.refresh(ct)
    db_session.add(Notification(
        user_id=user_a.id, actor_id=user_b.id, type="comment_reply",
        comment_id=None, content_type="collectible", content_id=ct.id,
    ))
    await db_session.commit()
    async with _client(db_session, user_a) as c:
        r = await c.get("/api/notifications")
    assert r.status_code == 200
    item = r.json()["items"][0]
    assert item["label"] == "Documents"
    assert item["url"] == "/collectibles/documents"


async def test_null_actor_renders_null_username(db_session, user_a):
    db_session.add(Notification(
        user_id=user_a.id, actor_id=None, type="comment_reply",
        comment_id=None, content_type="walkthrough", content_id=1,
    ))
    await db_session.commit()
    async with _client(db_session, user_a) as c:
        r = await c.get("/api/notifications")
    assert r.status_code == 200
    assert r.json()["items"][0]["actor_username"] is None


async def test_mark_read_owner_and_non_owner(db_session, user_a, user_b):
    note = Notification(user_id=user_a.id, actor_id=user_b.id, type="comment_reply",
                        comment_id=None, content_type="walkthrough", content_id=1)
    db_session.add(note)
    await db_session.commit()
    await db_session.refresh(note)

    # non-owner can't mark it read
    async with _client(db_session, user_b) as c:
        r = await c.patch(f"/api/notifications/{note.id}/read")
    assert r.status_code == 404
    assert await _unread_count(db_session, user_a.id) == 1

    # owner can
    async with _client(db_session, user_a) as c:
        r = await c.patch(f"/api/notifications/{note.id}/read")
    assert r.status_code == 200
    assert await _unread_count(db_session, user_a.id) == 0


async def test_mark_all_read(db_session, user_a, user_b):
    for _ in range(3):
        db_session.add(Notification(user_id=user_a.id, actor_id=user_b.id, type="comment_reply",
                                    comment_id=None, content_type="walkthrough", content_id=1))
    await db_session.commit()
    assert await _unread_count(db_session, user_a.id) == 3
    async with _client(db_session, user_a) as c:
        r = await c.post("/api/notifications/read-all")
    assert r.status_code == 200
    assert await _unread_count(db_session, user_a.id) == 0
