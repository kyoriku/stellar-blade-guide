"""
Comment deletion by rank (app/core/roles.py, which DELETE /api/comments/{id} applies),
and editing, which stays the author's alone.

The rule: you can delete your own comment, or one whose author's role ranks below
yours (admin above moderator above user), by both accounts' roles as they are when the
delete runs. Nobody edits anyone else's comment, the admin included.

DATABASE: aiosqlite with PRAGMA foreign_keys=ON, users and comments only. Every request
opens its own session, as in production: the delete route never loads a comment's
author, and a session shared with the seeding would hand it one from its identity map
where production would fail to load it.

MODERATION: _moderate_content is a recording AsyncMock in every world, so no edit
reaches OpenAI, and a refused edit can show moderation was never asked.

REJECT REASON: a probe middleware records request.state.reject_reason for each
request, the reason the access line prints.
"""

from __future__ import annotations

import re
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import AsyncMock

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event, text
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.routers.comments as comments_module
from app.core.auth import create_access_token
from app.core.roles import ROLE_RANK, USER_RANK, can_delete_comment, role_rank
from app.db.database import Base, get_db
from app.middleware.exception_handlers import add_exception_handlers
from app.middleware.rate_limit import setup_rate_limiter
from app.models.comments import Comment
from app.models.users import OAuthAccount, User  # noqa: F401 (OAuthAccount registers its mapper)
from app.routers.comments import router as comments_router

CLIENT = Path(__file__).resolve().parents[2] / "client" / "src" / "utils" / "roles.ts"
T0 = datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc)
ROLES = ("user", "moderator", "admin")

# name -> (role, active)
ACCOUNTS = {
    "user_a": ("user", True),
    "user_b": ("user", True),
    "mod_a": ("moderator", True),
    "mod_b": ("moderator", True),
    "admin_a": ("admin", True),
    "admin_b": ("admin", True),
    "mod_off": ("moderator", False),
    "typo_mod": ("mod", True),  # a role typed by hand outside the three
}
# Who deletes for each role, and whose comment is someone else's of each role.
ACTOR = {"user": "user_a", "moderator": "mod_a", "admin": "admin_a"}
AUTHOR = {"user": "user_b", "moderator": "mod_b", "admin": "admin_b"}

# One page's comments, oldest first: name -> (author, the comment it replies to, deleted).
COMMENTS = {
    **{f"by_{name}": (name, None, False) for name in ACCOUNTS},
    # Its account was deleted before deletion erased comments: no author, text intact.
    "no_author": (None, None, False),
    "admin_reply": ("admin_b", "by_user_b", False),
    "user_reply": ("user_b", "by_admin_b", False),
    "gone_parent": ("mod_b", None, True),
    "reply_under_gone": ("user_b", "gone_parent", False),
    "gone": ("user_b", None, True),
}

# Someone else's comment: (deleter's role, author's role) -> whether the delete goes through.
RANK = {
    ("user", "user"): False,
    ("user", "moderator"): False,
    ("user", "admin"): False,
    ("moderator", "user"): True,
    ("moderator", "moderator"): False,
    ("moderator", "admin"): False,
    ("admin", "user"): True,
    ("admin", "moderator"): True,
    ("admin", "admin"): False,
}
PAIRS = pytest.mark.parametrize("actor, author", list(RANK), ids=[f"{a}-on-{b}" for a, b in RANK])

REFUSED = (403, {"detail": "Cannot delete this comment"})
NOT_FOUND = (404, {"detail": "Comment not found"})


def _foreign_keys_on(dbapi_connection, _record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def _compiled(statement) -> str:
    """The statement as Postgres would get it: FOR SHARE shows there, and SQLite drops it."""
    return str(statement.compile(dialect=postgresql.dialect()))


class World:
    """One seeded database behind an app with the comments routes."""

    def __init__(self, engine, factory, ids, comments, app, reasons, moderate):
        self.engine = engine
        self.factory = factory
        self.ids = ids
        self.comments = comments
        self.app = app
        self.reasons = reasons
        self.moderate = moderate
        self.http = AsyncClient(transport=ASGITransport(app), base_url="http://test")

    def headers(self, name: str, role: str | None = None) -> dict:
        token = create_access_token(self.ids[name], role or ACCOUNTS[name][0])
        return {"Authorization": f"Bearer {token}"}

    async def delete(self, name: str, comment: str, *, role: str | None = None):
        return await self.http.delete(f"/api/comments/{self.comments[comment]}", headers=self.headers(name, role))

    async def edit(self, name: str, comment: str, body: str = "A better way up"):
        return await self.http.patch(
            f"/api/comments/{self.comments[comment]}", json={"body": body}, headers=self.headers(name),
        )

    async def rows(self) -> dict:
        """Every comment as stored, by name."""
        async with self.engine.connect() as conn:
            result = await conn.execute(text("SELECT * FROM comments ORDER BY id"))
            by_id = {row.id: dict(row._mapping) for row in result}
        return {name: by_id[cid] for name, cid in self.comments.items()}

    async def set_role(self, name: str, role: str) -> None:
        async with self.engine.begin() as conn:
            await conn.execute(text("UPDATE users SET role = :role WHERE id = :id"), {"role": role, "id": self.ids[name]})

    async def close(self) -> None:
        await self.http.aclose()
        await self.engine.dispose()


async def _build_world(moderate) -> World:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    event.listen(engine.sync_engine, "connect", _foreign_keys_on)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all, tables=[User.__table__, Comment.__table__])
        # Without it SQLite ignores ON DELETE SET NULL, which the deleted-author test reads.
        assert (await conn.execute(text("PRAGMA foreign_keys"))).scalar_one() == 1

    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as s:
        users = {}
        for name, (role, active) in ACCOUNTS.items():
            users[name] = User(email=f"{name}@rank.example", username=name, password_hash="x", role=role, is_active=active)
            s.add(users[name])
        await s.flush()
        comments = {}
        for day, (name, (author, parent, deleted)) in enumerate(COMMENTS.items(), start=1):
            posted = T0 + timedelta(days=day)
            comments[name] = Comment(
                user_id=users[author].id if author else None, content_type="walkthrough", content_id=1,
                parent_id=comments[parent].id if parent else None,
                body="[deleted]" if deleted else f"The text of {name}", is_deleted=deleted,
                created_at=posted, updated_at=posted + timedelta(hours=1),
            )
            s.add(comments[name])
            await s.flush()
        await s.commit()
        ids = {name: user.id for name, user in users.items()}
        comment_ids = {name: comment.id for name, comment in comments.items()}

    app = FastAPI()
    setup_rate_limiter(app)
    add_exception_handlers(app)  # the production 422 shape

    async def per_request_db():
        async with factory() as session:
            yield session

    app.dependency_overrides[get_db] = per_request_db
    app.include_router(comments_router, prefix="/api")
    reasons = []

    @app.middleware("http")
    async def probe(request, call_next):
        response = await call_next(request)
        reasons.append(getattr(request.state, "reject_reason", None))
        return response

    return World(engine, factory, ids, comment_ids, app, reasons, moderate)


@pytest_asyncio.fixture
async def world(monkeypatch):
    moderate = AsyncMock(return_value=True)
    monkeypatch.setattr(comments_module, "_moderate_content", moderate)
    built = await _build_world(moderate)
    yield built
    await built.close()


def _erased(before: dict, *names: str) -> dict:
    """The rows as deleting each named comment leaves them: erased in place, its author
    and last-edited time kept."""
    after = dict(before)
    for name in names:
        after[name] = {**before[name], "is_deleted": True, "body": "[deleted]"}
    return after


@contextmanager
def _statements(engine):
    """Every statement the engine sends while the block runs, compiled for Postgres,
    with its parameters."""
    sent = []

    def record(conn, clauseelement, multiparams, params, execution_options):
        compiled = clauseelement.compile(dialect=postgresql.dialect())
        sent.append((str(compiled), compiled.params))

    event.listen(engine.sync_engine, "before_execute", record)
    try:
        yield sent
    finally:
        event.remove(engine.sync_engine, "before_execute", record)


def _locks(sent: list) -> list:
    return [(sql, params) for sql, params in sent if sql.endswith("FOR SHARE")]


def _before_the_lock(world: World, statement: str, uid: int) -> None:
    """Make each request's session run the statement on that account's row, in a
    transaction of its own, just before it reads roles under the lock."""

    async def db():
        async with world.factory() as session:
            execute = session.execute

            async def then_execute(stmt, *args, **kwargs):
                if _compiled(stmt).endswith("FOR SHARE"):
                    async with world.engine.begin() as conn:
                        await conn.execute(text(statement), {"id": uid})
                return await execute(stmt, *args, **kwargs)

            session.execute = then_execute
            yield session

    world.app.dependency_overrides[get_db] = db


# ── Deleting ──────────────────────────────────────────────────────────────────

@PAIRS
async def test_deleting_someone_elses_comment_follows_rank(world, actor, author):
    name = f"by_{AUTHOR[author]}"
    before = await world.rows()

    r = await world.delete(ACTOR[actor], name)

    if RANK[actor, author]:
        assert r.status_code == 204
        assert await world.rows() == _erased(before, name)
        assert world.reasons == [None]
    else:
        assert (r.status_code, r.json()) == REFUSED
        assert await world.rows() == before
        assert world.reasons == ["comment-rank"]


@pytest.mark.parametrize("name", ["user_a", "mod_a", "admin_a", "typo_mod"])
async def test_everyone_deletes_their_own_comment_with_no_role_read(world, name):
    before = await world.rows()

    with _statements(world.engine) as sent:
        r = await world.delete(name, f"by_{name}")

    assert r.status_code == 204
    assert await world.rows() == _erased(before, f"by_{name}")
    assert _locks(sent) == []


async def test_a_user_promoted_since_posting_is_no_longer_a_moderators_to_delete(world):
    await world.set_role("user_b", "moderator")
    before = await world.rows()

    r = await world.delete("mod_a", "by_user_b")

    assert (r.status_code, r.json()) == REFUSED
    assert await world.rows() == before


async def test_a_moderator_demoted_since_posting_is_a_moderators_to_delete(world):
    await world.set_role("mod_b", "user")
    before = await world.rows()

    r = await world.delete("mod_a", "by_mod_b")

    assert r.status_code == 204
    assert await world.rows() == _erased(before, "by_mod_b")


async def test_a_demoted_moderator_can_no_longer_delete_a_users_comment(world):
    await world.set_role("mod_a", "user")
    before = await world.rows()

    # Their token still says moderator.
    r = await world.delete("mod_a", "by_user_b")

    assert (r.status_code, r.json()) == REFUSED
    assert await world.rows() == before


async def test_the_tokens_role_claim_is_never_read(world):
    before = await world.rows()

    # A user's token claiming admin can't delete a moderator's comment...
    r = await world.delete("user_a", "by_mod_b", role="admin")
    assert (r.status_code, r.json()) == REFUSED

    # ...and a moderator's claiming user still deletes a user's.
    r = await world.delete("mod_a", "by_user_b", role="user")
    assert r.status_code == 204
    assert await world.rows() == _erased(before, "by_user_b")


@pytest.mark.parametrize("name, role", [("mod_a", "user"), ("user_b", "moderator")], ids=["deleter-demoted", "author-promoted"])
async def test_a_role_change_that_lands_before_the_lock_counts(world, name, role):
    # A role read before the lock (the deleter's from the start of the request, or the
    # author's with the comment) would let this through.
    _before_the_lock(world, f"UPDATE users SET role = '{role}' WHERE id = :id", world.ids[name])
    before = await world.rows()

    r = await world.delete("mod_a", "by_user_b")

    assert (r.status_code, r.json()) == REFUSED
    assert await world.rows() == before


@pytest.mark.parametrize("name, allowed", [("user_a", False), ("mod_a", True), ("admin_a", True)])
async def test_a_comment_with_no_author_ranks_as_a_users(world, name, allowed):
    before = await world.rows()

    r = await world.delete(name, "no_author")

    if allowed:
        assert r.status_code == 204
        assert await world.rows() == _erased(before, "no_author")
    else:
        assert (r.status_code, r.json()) == REFUSED
        assert await world.rows() == before


@pytest.mark.parametrize("name, allowed", [("mod_a", False), ("admin_a", True)])
async def test_a_deactivated_author_keeps_their_rank(world, name, allowed):
    before = await world.rows()

    r = await world.delete(name, "by_mod_off")

    if allowed:
        assert r.status_code == 204
        assert await world.rows() == _erased(before, "by_mod_off")
    else:
        assert (r.status_code, r.json()) == REFUSED
        assert await world.rows() == before


async def test_a_deactivated_account_deletes_nothing(world):
    before = await world.rows()

    for comment in ("by_mod_off", "by_user_b"):
        r = await world.delete("mod_off", comment)
        assert (r.status_code, r.json()) == (401, {"detail": "User not found or inactive"})

    assert await world.rows() == before


async def test_a_role_typed_by_hand_ranks_as_a_user(world):
    before = await world.rows()

    # As the deleter, a user's powers...
    r = await world.delete("typo_mod", "by_user_b")
    assert (r.status_code, r.json()) == REFUSED
    assert await world.rows() == before

    # ...and as the author, a user's comment: not another user's to delete, but a
    # moderator's.
    r = await world.delete("user_a", "by_typo_mod")
    assert (r.status_code, r.json()) == REFUSED
    assert await world.rows() == before
    r = await world.delete("mod_a", "by_typo_mod")
    assert r.status_code == 204
    assert await world.rows() == _erased(before, "by_typo_mod")


@pytest.mark.parametrize("name, comment, allowed", [
    ("mod_a", "admin_reply", False),      # an admin's reply under a user's comment
    ("admin_a", "admin_reply", False),
    ("mod_a", "user_reply", True),        # a user's reply under an admin's comment
    ("user_a", "user_reply", False),
    ("mod_a", "reply_under_gone", True),  # a user's reply under a deleted moderator's comment
    ("user_a", "reply_under_gone", False),
], ids=lambda value: value if isinstance(value, str) else None)
async def test_a_reply_follows_its_own_authors_rank(world, name, comment, allowed):
    before = await world.rows()

    r = await world.delete(name, comment)

    if allowed:
        assert r.status_code == 204
        assert await world.rows() == _erased(before, comment)
    else:
        assert (r.status_code, r.json()) == REFUSED
        assert await world.rows() == before


@pytest.mark.parametrize("name", ["user_a", "user_b", "mod_a", "admin_a"])
async def test_a_deleted_comment_is_a_404_before_any_role_is_read(world, name):
    before = await world.rows()

    with _statements(world.engine) as sent:
        r = await world.delete(name, "gone")

    assert (r.status_code, r.json()) == NOT_FOUND
    assert _locks(sent) == []
    assert await world.rows() == before


async def test_an_author_deleted_meanwhile_is_a_404_with_nothing_written(world):
    author = world.ids["user_b"]
    _before_the_lock(world, "DELETE FROM users WHERE id = :id", author)
    before = await world.rows()

    r = await world.delete("mod_a", "by_user_b")

    assert (r.status_code, r.json()) == NOT_FOUND
    assert world.reasons == [None]
    # The raw DELETE cleared the author's links (ON DELETE SET NULL) and left every
    # text; this request erased nothing.
    assert await world.rows() == {
        name: {**row, "user_id": None} if row["user_id"] == author else row for name, row in before.items()
    }


async def test_a_deleter_deleted_meanwhile_ranks_as_no_one_and_writes_nothing(world):
    deleter = world.ids["mod_a"]
    # Their account went (another tab, or the admin) after the request started.
    _before_the_lock(world, "DELETE FROM users WHERE id = :id", deleter)
    before = await world.rows()

    r = await world.delete("mod_a", "by_user_b")

    assert (r.status_code, r.json()) == REFUSED
    assert world.reasons == ["comment-rank"]
    # Only the raw DELETE's own change: their comments lost their author.
    assert await world.rows() == {
        name: {**row, "user_id": None} if row["user_id"] == deleter else row for name, row in before.items()
    }


async def test_both_roles_are_read_under_a_share_lock_before_the_write(world):
    with _statements(world.engine) as sent:
        r = await world.delete("mod_a", "by_user_b")

    assert r.status_code == 204
    ((sql, params),) = _locks(sent)
    assert sql.startswith("SELECT users.id, users.role \nFROM users \nWHERE users.id IN ")
    (ids,) = params.values()
    assert sorted(ids) == sorted([world.ids["mod_a"], world.ids["user_b"]])
    shown = [statement for statement, _ in sent]
    assert shown.index(sql) < next(i for i, statement in enumerate(shown) if statement.startswith("UPDATE comments"))


async def test_a_comment_with_no_author_locks_only_the_deleters_row(world):
    with _statements(world.engine) as sent:
        r = await world.delete("mod_a", "no_author")

    assert r.status_code == 204
    ((_, params),) = _locks(sent)
    assert list(params.values()) == [[world.ids["mod_a"]]]


# ── Editing ───────────────────────────────────────────────────────────────────

@PAIRS
async def test_nobody_edits_someone_elses_comment_whatever_their_rank(world, actor, author):
    before = await world.rows()

    r = await world.edit(ACTOR[actor], f"by_{AUTHOR[author]}")

    assert (r.status_code, r.json()) == (403, {"detail": "Cannot edit this comment"})
    world.moderate.assert_not_called()
    assert await world.rows() == before


@pytest.mark.parametrize("name", ["user_a", "mod_a", "admin_a"])
async def test_nobody_edits_a_comment_with_no_author(world, name):
    before = await world.rows()

    r = await world.edit(name, "no_author")

    assert (r.status_code, r.json()) == (403, {"detail": "Cannot edit this comment"})
    world.moderate.assert_not_called()
    assert await world.rows() == before


@pytest.mark.parametrize("role", ROLES)
async def test_everyone_edits_their_own_comment(world, role):
    name = f"by_{ACTOR[role]}"
    before = await world.rows()

    r = await world.edit(ACTOR[role], name, "A better way up")

    assert (r.status_code, r.json()["body"]) == (200, "A better way up")
    world.moderate.assert_awaited_once_with("A better way up")
    after = await world.rows()
    assert after[name]["body"] == "A better way up"
    assert {k: v for k, v in after.items() if k != name} == {k: v for k, v in before.items() if k != name}


# ── The rule itself, and its mirror ───────────────────────────────────────────

def test_the_client_mirrors_the_ranks_and_the_fallback():
    # A missing file or a changed line fails here; nothing is skipped.
    lines = CLIENT.read_text().splitlines()
    assert f"const USER_RANK = {USER_RANK}" in lines
    (line,) = [line for line in lines if line.startswith("const ROLE_RANK = new Map<string, number>([")]
    pairs = re.findall(r"\['([^']*)', (\w+)\]", line)
    assert {role: USER_RANK if value == "USER_RANK" else int(value) for role, value in pairs} == ROLE_RANK
    assert "  return ROLE_RANK.get(role ?? '') ?? USER_RANK" in lines


# Roles typed by hand outside the three, and keys a JavaScript object would find on its
# prototype: each ranks as a user. client/src/utils/roles.test.ts holds the same tables.
@pytest.mark.parametrize("role, rank", [
    ("user", 1), ("moderator", 2), ("admin", 3),
    ("Admin", 1), ("admin ", 1), ("mod", 1), ("", 1), (None, 1),
    ("constructor", 1), ("__proto__", 1), ("toString", 1),
])
def test_role_rank(role, rank):
    assert role_rank(role) == rank


@pytest.mark.parametrize("actor_role, author_role, allowed", [
    *[(actor, author, allowed) for (actor, author), allowed in RANK.items()],
    ("mod", "user", False),
    ("user", "mod", False),
    ("moderator", "mod", True),
    ("Admin", "user", False),
    ("user", "Admin", False),
    ("moderator", "Admin", True),
    ("constructor", "user", False),
    ("admin", "__proto__", True),
])
def test_can_delete_someone_elses_comment(actor_role, author_role, allowed):
    assert can_delete_comment(1, actor_role, 2, author_role) is allowed


@pytest.mark.parametrize("role", [*ROLES, "mod"])
def test_can_delete_your_own_comment_whatever_your_role(role):
    assert can_delete_comment(1, role, 1, role) is True


@pytest.mark.parametrize("actor_role, allowed", [("user", False), ("moderator", True), ("admin", True)])
def test_a_comment_with_no_author_counts_as_a_users(actor_role, allowed):
    assert can_delete_comment(1, actor_role, None, None) is allowed
