"""
Tests for the comments CRUD endpoints: GET, POST, PATCH, DELETE.

Uses the same SQLite-in-memory strategy as test_auth.py, with its own
fixture chain because the Comment table isn't in conftest's create_all.

Moderation is monkeypatched at the app.routers.comments._moderate_content boundary
so no OpenAI calls are made. The default fixture mock passes all content;
individual tests override it to return False when testing moderation rejection.

Rate limits are off here, as in every file (conftest.disable_rate_limits). The
limiter's own behaviour and every route's limit values are pinned in
test_rate_limit.py, which opts back in with the rate_limits_on fixture.

PATCH and DELETE tests seed comments directly into the DB rather than going
through POST, so only the dedicated POST tests touch the /api/comments/
endpoint via HTTP.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock

import openai
import pytest
import pytest_asyncio
import app.routers.comments as comments_module

from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.core.auth import create_access_token
from app.db.database import Base, get_db
from app.middleware.exception_handlers import add_exception_handlers
from app.middleware.rate_limit import setup_rate_limiter
from app.models.comments import Comment
from app.models.users import User, OAuthAccount  # noqa: F401 — registers tables with Base
from app.services.auth import hash_password
from app.routers.comments import router as comments_router


def _make_comments_app(db_session: AsyncSession) -> FastAPI:
    app = FastAPI()
    setup_rate_limiter(app)
    # The production 422 shape, one flat detail string, which is what the client shows.
    add_exception_handlers(app)

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


async def test_post_comment_with_a_nul_is_refused_before_moderation(user_client, monkeypatch):
    # Postgres refuses a NUL in text (SQLite does not, so the failure cannot show here):
    # the body model must refuse it before the moderation call and the INSERT.
    moderate = AsyncMock(return_value=True)
    monkeypatch.setattr(comments_module, "_moderate_content", moderate)
    r = await user_client.post("/api/comments/", json={
        "content_type": "walkthrough",
        "content_id": 1,
        "body": "hi" + chr(0) + "there",
    })
    assert r.status_code == 422
    moderate.assert_not_called()


async def test_post_comment_with_a_lone_surrogate_is_refused_before_moderation(user_client, monkeypatch):
    # Half of an emoji's surrogate pair has no UTF-8 form, so the driver cannot send it
    # and the INSERT would fail after moderation ran. json.dumps writes it as an
    # ASCII escape, as a browser's JSON.stringify does, so the body is built here rather
    # than left to the test client's json= encoding.
    import json

    moderate = AsyncMock(return_value=True)
    monkeypatch.setattr(comments_module, "_moderate_content", moderate)
    r = await user_client.post("/api/comments/", headers={"Content-Type": "application/json"}, content=json.dumps({
        "content_type": "walkthrough",
        "content_id": 1,
        "body": "a" + chr(0xD800) + "b",
    }))
    assert r.status_code == 422
    assert r.json() == {"detail": "Comment body contains a character that can't be saved"}
    moderate.assert_not_called()


async def test_post_comment_keeps_a_whole_emoji(user_client):
    # A whole emoji is one code point, which UTF-8 encodes fine.
    body = "nice " + chr(0x1F600)
    r = await user_client.post("/api/comments/", json={
        "content_type": "walkthrough",
        "content_id": 1,
        "body": body,
    })
    assert r.status_code == 201
    assert r.json()["body"] == body


async def test_post_comment_keeps_line_breaks_and_tabs(user_client):
    # Line breaks and tabs are kept: the check is not isprintable(), which would refuse them.
    body = "line one" + chr(10) + "line two" + chr(9) + "end"
    r = await user_client.post("/api/comments/", json={
        "content_type": "walkthrough",
        "content_id": 1,
        "body": body,
    })
    assert r.status_code == 201
    assert r.json()["body"] == body


async def test_reply_to_a_deleted_comment_is_the_parent_404(user_client, comments_db_session, test_user, monkeypatch):
    # The page offers no Reply on a deleted comment, and a reply sent anyway would bring
    # it back as "[deleted]", so it gets the missing parent's answer, before moderation.
    moderate = AsyncMock(return_value=True)
    monkeypatch.setattr(comments_module, "_moderate_content", moderate)
    parent = Comment(user_id=test_user.id, content_type="walkthrough", content_id=1,
                     body="[deleted]", is_deleted=True)
    comments_db_session.add(parent)
    await comments_db_session.commit()

    r = await user_client.post("/api/comments/", json={
        "content_type": "walkthrough",
        "content_id": 1,
        "body": "Reply",
        "parent_id": parent.id,
    })
    assert r.status_code == 404
    assert r.json() == {"detail": "Parent comment not found"}
    moderate.assert_not_called()
    assert (await comments_db_session.execute(select(func.count()).select_from(Comment))).scalar_one() == 1


# ── PATCH ─────────────────────────────────────────────────────────────────────

async def test_edit_own_comment_returns_200(user_client, comments_db_session, test_user):
    comment = await _seed_comment(comments_db_session, test_user.id, body="Original body")

    r = await user_client.patch(f"/api/comments/{comment.id}", json={"body": "Updated body"})
    assert r.status_code == 200
    assert r.json()["body"] == "Updated body"


async def _updated_at(session: AsyncSession, comment_id: int):
    return (await session.execute(select(Comment.updated_at).where(Comment.id == comment_id))).scalar_one()


POSTED = datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc)


async def test_edit_moves_the_comments_updated_at(user_client, comments_db_session, test_user):
    # A delete keeps the time (see DELETE below) and an edit still moves it, so it stays
    # the time a comment was last edited.
    comment = Comment(user_id=test_user.id, content_type="walkthrough", content_id=1,
                      body="Original body", created_at=POSTED, updated_at=POSTED)
    comments_db_session.add(comment)
    await comments_db_session.commit()
    before = await _updated_at(comments_db_session, comment.id)

    r = await user_client.patch(f"/api/comments/{comment.id}", json={"body": "Updated body"})
    assert r.status_code == 200
    assert await _updated_at(comments_db_session, comment.id) != before


async def test_an_edit_never_lands_in_a_comment_deleted_during_its_moderation(user_client, comments_db_session, test_user, monkeypatch):
    # Moderation can take seconds, and the comment may be deleted meanwhile, by its
    # account's deletion, a moderator or another tab. The edit gets the 404, and the
    # erased row keeps no text.
    # The id is read once: the route's rollback expires every object in the session the
    # test shares with it.
    cid = (await _seed_comment(comments_db_session, test_user.id, body="Original body")).id

    async def deleted_while_moderating(text):
        await comments_db_session.execute(
            update(Comment).where(Comment.id == cid).values(is_deleted=True, body="[deleted]")
        )
        await comments_db_session.commit()
        return True

    monkeypatch.setattr(comments_module, "_moderate_content", deleted_while_moderating)
    r = await user_client.patch(f"/api/comments/{cid}", json={"body": "Edited text"})
    assert r.status_code == 404
    assert r.json() == {"detail": "Comment not found"}
    row = (await comments_db_session.execute(
        select(Comment.is_deleted, Comment.body).where(Comment.id == cid)
    )).one()
    assert tuple(row) == (True, "[deleted]")


async def test_edit_other_users_comment_returns_403(second_user_client, comments_db_session, test_user):
    comment = await _seed_comment(comments_db_session, test_user.id)

    r = await second_user_client.patch(f"/api/comments/{comment.id}", json={"body": "Hijacked"})
    assert r.status_code == 403


async def test_edit_flagged_update_returns_400(user_client, comments_db_session, test_user, monkeypatch):
    comment = await _seed_comment(comments_db_session, test_user.id, body="Original body")

    monkeypatch.setattr(comments_module, "_moderate_content", AsyncMock(return_value=False))
    r = await user_client.patch(f"/api/comments/{comment.id}", json={"body": "Flagged edit"})
    assert r.status_code == 400


async def test_edit_with_a_nul_is_refused_before_moderation(user_client, comments_db_session, test_user, monkeypatch):
    comment = await _seed_comment(comments_db_session, test_user.id, body="Original body")

    moderate = AsyncMock(return_value=True)
    monkeypatch.setattr(comments_module, "_moderate_content", moderate)
    r = await user_client.patch(f"/api/comments/{comment.id}", json={"body": "edited" + chr(0)})
    assert r.status_code == 422
    moderate.assert_not_called()


async def test_edit_with_a_lone_surrogate_is_refused_before_moderation(user_client, comments_db_session, test_user, monkeypatch):
    import json  # built by hand, as in the create test

    comment = await _seed_comment(comments_db_session, test_user.id, body="Original body")

    moderate = AsyncMock(return_value=True)
    monkeypatch.setattr(comments_module, "_moderate_content", moderate)
    r = await user_client.patch(f"/api/comments/{comment.id}", headers={"Content-Type": "application/json"},
                                content=json.dumps({"body": "edited " + chr(0xDFFF)}))
    assert r.status_code == 422
    assert r.json() == {"detail": "Comment body contains a character that can't be saved"}
    moderate.assert_not_called()


async def test_edit_keeps_a_whole_emoji(user_client, comments_db_session, test_user):
    comment = await _seed_comment(comments_db_session, test_user.id, body="Original body")

    body = "edited " + chr(0x1F600)
    r = await user_client.patch(f"/api/comments/{comment.id}", json={"body": body})
    assert r.status_code == 200
    assert r.json()["body"] == body


async def test_edit_keeps_line_breaks_and_tabs(user_client, comments_db_session, test_user):
    # The edit request has its own validator, so it is pinned on its own.
    comment = await _seed_comment(comments_db_session, test_user.id, body="Original body")

    body = "line one" + chr(10) + "line two" + chr(9) + "end"
    r = await user_client.patch(f"/api/comments/{comment.id}", json={"body": body})
    assert r.status_code == 200
    assert r.json()["body"] == body


# ── Ids past int4 ─────────────────────────────────────────────────────────────
# Postgres refuses to bind 2**31 to an int4 parameter. SQLite binds up to
# int8, so a row is seeded at 2**31, where a guard with the wrong bound would find
# it, and 2**63 raises in SQLite with no guard at all.

async def test_list_for_content_past_int4_is_the_empty_answer(comments_client, comments_db_session, test_user):
    comments_db_session.add(Comment(user_id=test_user.id, content_type="walkthrough", content_id=2**31, body="Far"))
    await comments_db_session.commit()
    for cid in (2**31, 2**63):
        r = await comments_client.get(f"/api/comments/walkthrough/{cid}")
        assert r.status_code == 200
        assert r.json() == []


@pytest.mark.parametrize("cid", [0, 2**31, 2**63])
async def test_post_comment_for_content_outside_int4_is_refused(user_client, monkeypatch, cid):
    moderate = AsyncMock(return_value=True)
    monkeypatch.setattr(comments_module, "_moderate_content", moderate)
    r = await user_client.post("/api/comments/", json={
        "content_type": "walkthrough",
        "content_id": cid,
        "body": "Hello",
    })
    assert r.status_code == 422
    assert r.json() == {"detail": "content_id must be a valid id"}
    moderate.assert_not_called()


@pytest.mark.parametrize("pid", [2**31, 2**63])
async def test_reply_to_a_parent_past_int4_is_the_parent_404(user_client, comments_db_session, test_user, pid):
    if pid < 2**63:
        comments_db_session.add(Comment(id=pid, user_id=test_user.id, content_type="walkthrough",
                                        content_id=1, body="Parent"))
        await comments_db_session.commit()
    r = await user_client.post("/api/comments/", json={
        "content_type": "walkthrough",
        "content_id": 1,
        "body": "Reply",
        "parent_id": pid,
    })
    assert r.status_code == 404
    assert r.json() == {"detail": "Parent comment not found"}


@pytest.mark.parametrize("cid", [2**31, 2**63])
async def test_edit_and_delete_past_int4_are_the_comment_404(user_client, comments_db_session, test_user, cid):
    if cid < 2**63:
        comments_db_session.add(Comment(id=cid, user_id=test_user.id, content_type="walkthrough",
                                        content_id=1, body="Mine"))
        await comments_db_session.commit()
    edit = await user_client.patch(f"/api/comments/{cid}", json={"body": "Edited"})
    delete = await user_client.delete(f"/api/comments/{cid}")
    for r in (edit, delete):
        assert r.status_code == 404
        assert r.json() == {"detail": "Comment not found"}


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


async def test_delete_keeps_the_comments_updated_at(user_client, comments_db_session, test_user):
    # A deletion time would set the comment apart from one erased with its account,
    # which keeps its own (DELETE /api/users/me), and show when it was deleted.
    comment = Comment(user_id=test_user.id, content_type="walkthrough", content_id=1,
                      body="Edited once", created_at=POSTED, updated_at=POSTED + timedelta(hours=1))
    comments_db_session.add(comment)
    await comments_db_session.commit()
    before = await _updated_at(comments_db_session, comment.id)

    r = await user_client.delete(f"/api/comments/{comment.id}")
    assert r.status_code == 204

    row = (await comments_db_session.execute(
        select(Comment.is_deleted, Comment.body, Comment.updated_at).where(Comment.id == comment.id)
    )).one()
    assert tuple(row) == (True, "[deleted]", before)


async def test_delete_other_users_comment_returns_403(second_user_client, comments_db_session, test_user):
    comment = await _seed_comment(comments_db_session, test_user.id)

    r = await second_user_client.delete(f"/api/comments/{comment.id}")
    assert r.status_code == 403


async def test_delete_unauthenticated_returns_401(comments_client, comments_db_session, test_user):
    comment = await _seed_comment(comments_db_session, test_user.id)

    r = await comments_client.delete(f"/api/comments/{comment.id}")
    assert r.status_code == 401


async def test_moderation_client_has_explicit_bounds():
    # The OpenAI SDK defaults to a 600s timeout with 2 retries. This call runs
    # while the request holds a pooled DB connection, so those defaults would
    # let an OpenAI incident pin the pool for ~30 minutes per in-flight comment.
    from app.services.comments import openai_client

    timeout = openai_client.timeout
    assert timeout != openai.DEFAULT_TIMEOUT
    read_timeout = timeout if isinstance(timeout, (int, float)) else timeout.read
    assert read_timeout <= 30
    assert openai_client.max_retries <= 1
