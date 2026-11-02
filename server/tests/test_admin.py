"""
Tests for the admin users API (app/routers/admin.py) and the account deletion it
shares with Settings (delete_account in app/services/users.py).

DATABASE: aiosqlite with PRAGMA foreign_keys=ON, asserted, so the cascades account
deletion relies on run as they do on Postgres: an account's progress and the
notifications it received go with it, and the ones it caused lose their actor.
Tables: users, oauth_accounts, comments, notifications and user_progress from the
models, and collectibles in raw SQL, as test_progress.py does (its description column
is JSONB, which SQLite can't create). Every request opens its own session, as in
production, so a route sees only what was committed.

REDIS: app.core.auth imports redis_client by value, so every world patches
core_auth.redis_client to its own fakeredis (conftest's patch reaches only
app.core.cache).

CLOUDINARY: destroy is stubbed and records each public_id, so the real
delete_avatar_from_cloudinary runs.

REJECT REASON: a probe middleware records request.state.reject_reason for each
request, the reason the access line prints.

Seeded addresses never equal their usernames, so a test can look for the local part
and the domain's name in an answer, not only for the whole address.
"""

from __future__ import annotations

import copy
import hashlib
import json
import logging
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import fakeredis
import fakeredis.aioredis
import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event, select, text
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.core.auth as core_auth
import app.routers.admin as admin_routes
import app.routers.users as users_routes
import app.services.users as users_service
from app.core.auth import create_access_token
from app.core.colours import CYAN, RESET
from app.db.database import Base, get_db
from app.middleware.exception_handlers import add_exception_handlers
from app.middleware.rate_limit import setup_rate_limiter
from app.models.comments import Comment
from app.models.notifications import Notification
from app.models.progress import UserProgress
from app.models.users import OAuthAccount, User
from app.routers.admin import router as admin_router
from app.routers.comments import router as comments_router
from app.routers.users import router as users_router
from app.services.users import mask_email

# ── The seeded world ──────────────────────────────────────────────────────────

T0 = datetime(2026, 1, 1, 12, 0, tzinfo=timezone.utc)

# name -> (role, active, email), oldest first: each account joins a day after the last.
ACCOUNTS = {
    "site_admin": ("admin", True, "Owner.One@AdminMail.example"),
    "second_admin": ("admin", True, "backup.two@adminmail.example"),
    "retired_admin": ("admin", False, "gone.three@adminmail.example"),
    "helpful_mod": ("moderator", True, "mod.four@modmail.example"),
    "spam_account": ("user", False, "bulk.five@spammail.example"),
    "newplayer_22": ("user", True, "jo.reader@mailhost.example"),
    "lilyfan": ("user", True, "lily.seven@fanmail.example"),
}
ADDRESSES = [email for _, _, email in ACCOUNTS.values()]
NEWEST_FIRST = list(reversed(ACCOUNTS))
NP_AVATAR = "https://res.cloudinary.com/demo/image/upload/np.webp"

# One page's comments: name -> (author, the comment it replies to, day posted).
COMMENTS = {
    "np_top": ("newplayer_22", None, 1),
    "lily_reply": ("lilyfan", "np_top", 2),     # notifies newplayer_22
    "lily_top": ("lilyfan", None, 3),
    "np_reply": ("newplayer_22", "lily_top", 4),  # notifies lilyfan
    "mod_top": ("helpful_mod", None, 5),
    "spam_top": ("spam_account", None, 6),
}
TEXT = {name: f"The text of {name}" for name in COMMENTS}
# recipient, actor, the reply it points at
NOTIFICATIONS = [("newplayer_22", "lilyfan", "lily_reply"), ("lilyfan", "newplayer_22", "np_reply")]
PROGRESS = [("newplayer_22", 1), ("newplayer_22", 2), ("lilyfan", 1)]
OAUTH = [("newplayer_22", "google", "g-1001"), ("lilyfan", "discord", "d-2002")]
# Accounts with a signed-in session in Redis.
SESSIONS = ("site_admin", "second_admin", "newplayer_22", "lilyfan")

TABLES = ("users", "oauth_accounts", "comments", "notifications", "user_progress", "collectibles")
UNKNOWN_ID = 999_999

# A body each route takes, so a route that answered would really change something.
BODIES = {
    "/admin/users/search": {"q": "new"},
    "/admin/users/{user_id}/role": {"role": "moderator"},
    "/admin/users/{user_id}/active": {"active": False},
}

EXPECTED_ROUTES = [
    ("DELETE", "/admin/users/{user_id}"),
    ("GET", "/admin/users"),
    ("POST", "/admin/users/search"),
    ("POST", "/admin/users/{user_id}/email"),
    ("PUT", "/admin/users/{user_id}/active"),
    ("PUT", "/admin/users/{user_id}/role"),
]


def _routes() -> list[tuple[str, str]]:
    """Every (method, path) on the admin router, read from the router itself, so a
    route added later is swept by every test that uses this."""
    return sorted((method, route.path) for route in admin_router.routes for method in route.methods)


def _id_routes() -> list[tuple[str, str]]:
    return [(method, path) for method, path in _routes() if "{user_id}" in path]


def _url(path: str, uid: int | None = None) -> str:
    return "/api" + (path.replace("{user_id}", str(uid)) if uid is not None else path)


def _foreign_keys_on(dbapi_connection, _record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


async def _seed_session(redis, user_id: int, name: str) -> None:
    """One signed-in session with a fixed token, so two worlds hold the same keys."""
    sid = hashlib.md5(name.encode()).hexdigest()
    token = f"{sid}.{uuid.UUID(int=user_id)}"
    ttl = 7 * 24 * 60 * 60
    await redis.set(core_auth._refresh_key(user_id, token), core_auth.encode_session_value(1_790_000_000), ex=ttl)
    await redis.set(core_auth._family_key(user_id, sid), "1", ex=ttl)


class World:
    """One seeded database and Redis behind an app with the admin, users and comments
    routes."""

    def __init__(self, engine, redis, ids, comments, app, reasons):
        self.engine = engine
        self.factory = async_sessionmaker(engine, expire_on_commit=False)
        self.redis = redis
        self.ids = ids
        self.comments = comments
        self.reasons = reasons
        self.http = AsyncClient(transport=ASGITransport(app), base_url="http://test")

    def token(self, name: str, role: str | None = None) -> str:
        return create_access_token(self.ids[name], role or ACCOUNTS[name][0])

    async def call(self, method: str, path: str, who: str | None = None, *, token: str | None = None, **kwargs):
        headers = dict(kwargs.pop("headers", {}))
        if who is not None:
            token = self.token(who)
        if token is not None:
            headers["Authorization"] = f"Bearer {token}"
        return await self.http.request(method, path, headers=headers, **kwargs)

    async def state(self) -> dict:
        """Everything a request could change: every table's rows, and every Redis key
        with its value and whether it still expires."""
        tables = {}
        async with self.engine.connect() as conn:
            for table in TABLES:
                rows = await conn.execute(text(f"SELECT * FROM {table} ORDER BY id"))
                tables[table] = [dict(row._mapping) for row in rows]
        keys = {}
        for key in sorted(await self.redis.keys("*")):
            keys[key] = (await self.redis.get(key), await self.redis.ttl(key) > 0)
        return {"db": tables, "redis": keys}

    async def row(self, name: str):
        async with self.factory() as s:
            return (await s.execute(select(User).where(User.id == self.ids[name]))).scalar_one_or_none()

    async def close(self) -> None:
        await self.http.aclose()
        await self.engine.dispose()


async def _build_world(redis) -> World:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    event.listen(engine.sync_engine, "connect", _foreign_keys_on)
    async with engine.begin() as conn:
        await conn.execute(text("CREATE TABLE collectibles (id INTEGER PRIMARY KEY, title VARCHAR(255) NOT NULL)"))
        await conn.run_sync(
            Base.metadata.create_all,
            tables=[User.__table__, OAuthAccount.__table__, Comment.__table__,
                    Notification.__table__, UserProgress.__table__],
        )
        # Without it SQLite ignores every ON DELETE, and deletion would look complete
        # while leaving progress and notifications behind.
        assert (await conn.execute(text("PRAGMA foreign_keys"))).scalar_one() == 1
        await conn.execute(text("INSERT INTO collectibles (id, title) VALUES (1, 'Can 1'), (2, 'Can 2'), (3, 'Can 3')"))

    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as s:
        users = {}
        for day, (name, (role, active, email)) in enumerate(ACCOUNTS.items(), start=1):
            joined = T0 + timedelta(days=day)
            users[name] = User(
                email=email, username=name, password_hash="x", role=role, is_active=active,
                avatar_url=NP_AVATAR if name == "newplayer_22" else None,
                created_at=joined, updated_at=joined,
            )
            s.add(users[name])
            await s.flush()
        comments = {}
        for name, (author, parent, day) in COMMENTS.items():
            posted = T0 + timedelta(days=10 + day)
            comment = Comment(
                user_id=users[author].id, content_type="walkthrough", content_id=1,
                parent_id=comments[parent].id if parent else None, body=TEXT[name],
                created_at=posted, updated_at=posted + timedelta(hours=day),
            )
            s.add(comment)
            await s.flush()
            comments[name] = comment
        for i, (recipient, actor, reply) in enumerate(NOTIFICATIONS):
            s.add(Notification(
                user_id=users[recipient].id, actor_id=users[actor].id, type="comment_reply",
                comment_id=comments[reply].id, content_type="walkthrough", content_id=1,
                is_read=False, created_at=T0 + timedelta(days=20 + i),
            ))
        for i, (name, collectible_id) in enumerate(PROGRESS):
            s.add(UserProgress(user_id=users[name].id, collectible_id=collectible_id,
                               completed_at=T0 + timedelta(days=30 + i)))
        for name, provider, provider_user_id in OAUTH:
            s.add(OAuthAccount(user_id=users[name].id, provider=provider, provider_user_id=provider_user_id))
        await s.commit()
        ids = {name: user.id for name, user in users.items()}
        comment_ids = {name: comment.id for name, comment in comments.items()}

    for name in SESSIONS:
        await _seed_session(redis, ids[name], name)
    # Keys no deletion or deactivation may touch.
    await redis.set("collectibles:level:eidos-7", "[]", ex=3600)
    await redis.set("oauth_state:google:unrelated", "1", ex=600)

    app = FastAPI()
    setup_rate_limiter(app)
    add_exception_handlers(app)  # the production 422 shape

    async def per_request_db():
        async with factory() as session:
            yield session

    app.dependency_overrides[get_db] = per_request_db
    app.include_router(admin_router, prefix="/api")
    app.include_router(users_router, prefix="/api")
    app.include_router(comments_router, prefix="/api")
    reasons = []

    @app.middleware("http")
    async def probe(request, call_next):
        response = await call_next(request)
        reasons.append(getattr(request.state, "reject_reason", None))
        return response

    return World(engine, redis, ids, comment_ids, app, reasons)


def _stub_destroy(monkeypatch) -> list:
    calls = []

    def destroy(public_id, **kwargs):
        calls.append(public_id)
        return {"result": "ok"}

    monkeypatch.setattr("app.services.users.cloudinary.uploader.destroy", destroy)
    return calls


@pytest_asyncio.fixture
async def world(fake_redis, monkeypatch):
    monkeypatch.setattr(core_auth, "redis_client", fake_redis)
    built = await _build_world(fake_redis)
    built.destroyed = _stub_destroy(monkeypatch)
    yield built
    await built.close()


@pytest.fixture
def app_log(caplog):
    caplog.set_level(logging.INFO, logger="app")
    return caplog


def _lines(caplog, *loggers: str) -> list[str]:
    """The action lines: the routes', and the deletion line delete_account writes. The
    avatar call's own lines are left out; world.destroyed records that call."""
    names = loggers or ("app.routers.admin", "app.routers.users", "app.services.users")
    return [
        record.getMessage() for record in caplog.records
        if record.name in names and "Cloudinary avatar" not in record.getMessage()
    ]


def _avatar(uid: int) -> str:
    return f"stellar-blade/avatars/user-{uid}.webp"


@contextmanager
def _statements(engine):
    """Every statement the engine sends while the block runs, compiled for Postgres
    (where FOR UPDATE shows; SQLite drops it), with its parameters."""
    sent = []

    def record(conn, clauseelement, multiparams, params, execution_options):
        compiled = clauseelement.compile(dialect=postgresql.dialect())
        sent.append((str(compiled), repr(compiled.params), repr(multiparams), repr(params)))

    event.listen(engine.sync_engine, "before_execute", record)
    try:
        yield sent
    finally:
        event.remove(engine.sync_engine, "before_execute", record)


# ── The guard ─────────────────────────────────────────────────────────────────

def test_the_router_holds_the_six_routes_each_behind_the_admin_check():
    assert _routes() == EXPECTED_ROUTES
    assert [d.dependency for d in admin_router.dependencies] == [admin_routes.require_admin]
    for route in admin_router.routes:
        assert [d.dependency for d in route.dependencies] == [admin_routes.require_admin], route.path


async def test_no_one_but_an_active_admin_gets_through_any_route(world, app_log):
    known = world.ids["newplayer_22"]
    callers = {
        "signed out": (None, 401, "Not authenticated"),
        "not a token": ("not-a-token", 401, "Invalid or expired token"),
        "deactivated admin": (world.token("retired_admin"), 401, "User not found or inactive"),
        "user": (world.token("lilyfan"), 403, "Insufficient permissions"),
        "moderator": (world.token("helpful_mod"), 403, "Insufficient permissions"),
        # The role comes from the database; the token's claim is never read.
        "user whose token claims admin": (world.token("lilyfan", role="admin"), 403, "Insufficient permissions"),
    }
    before = await world.state()
    answered = []
    for method, path in _routes():
        for uid in ([known, UNKNOWN_ID, 2**63] if "{user_id}" in path else [None]):
            for label, (token, code, detail) in callers.items():
                r = await world.call(method, _url(path, uid), token=token, json=BODIES.get(path))
                assert (r.status_code, r.json()) == (code, {"detail": detail}), (label, method, path, uid)
                answered.append(r.text)
    assert len(answered) == len(callers) * sum(3 if "{user_id}" in path else 1 for _, path in _routes())
    assert await world.state() == before
    assert world.destroyed == []
    assert [record.getMessage() for record in app_log.records if "Admin" in record.getMessage()] == []
    for text_ in answered:
        assert _leaks(text_) == []


async def test_admin_accounts_cant_be_changed_here_the_callers_own_included(world, app_log):
    before = await world.state()
    for target in ("site_admin", "second_admin", "retired_admin"):
        for method, path in _id_routes():
            r = await world.call(method, _url(path, world.ids[target]), who="site_admin", json=BODIES.get(path))
            assert (r.status_code, r.json()) == (403, {"detail": "Admin accounts can't be changed here."}), (target, method, path)
            assert world.reasons[-1] == "admin-target"
    # Nothing changed, the admins' own sessions included, and nothing was revealed.
    assert await world.state() == before
    assert world.destroyed == []
    assert _lines(app_log) == []


@pytest.mark.parametrize("uid", [0, -1, 2**31, 2**63])
async def test_an_id_no_account_can_have_is_the_user_404(world, uid):
    # Postgres refuses 2**31 for an int4 parameter; SQLite holds it, so the rows here
    # make a guard with the wrong bound find one, and 2**63 raises with no guard at all.
    if uid < 2**63:
        async with world.factory() as s:
            s.add(User(id=uid, email=f"far{abs(uid)}@faraway.example", username=f"far_{abs(uid)}", password_hash="x"))
            await s.commit()
    before = await world.state()
    for method, path in _id_routes():
        r = await world.call(method, _url(path, uid), who="site_admin", json=BODIES.get(path))
        assert (r.status_code, r.json()) == (404, {"detail": "User not found"}), (method, path)
        assert world.reasons[-1] is None
    assert await world.state() == before


async def test_an_unknown_account_is_the_user_404(world):
    before = await world.state()
    for method, path in _id_routes():
        r = await world.call(method, _url(path, UNKNOWN_ID), who="site_admin", json=BODIES.get(path))
        assert (r.status_code, r.json()) == (404, {"detail": "User not found"}), (method, path)
    assert await world.state() == before
    assert world.destroyed == []


# ── Deletion: one function behind Settings and the admin page ─────────────────

def _expected_after_deletion(before: dict, uid: int) -> dict:
    """What deleting account uid must leave: the row and its OAuth links gone, its
    comments erased with their own times, its progress and the notifications it
    received gone, the ones it caused without an actor, and its sessions ended."""
    db = copy.deepcopy(before["db"])
    db["users"] = [r for r in db["users"] if r["id"] != uid]
    db["oauth_accounts"] = [r for r in db["oauth_accounts"] if r["user_id"] != uid]
    for r in db["comments"]:
        if r["user_id"] == uid:
            r.update(user_id=None, is_deleted=1, body="[deleted]")
    db["notifications"] = [r for r in db["notifications"] if r["user_id"] != uid]
    for r in db["notifications"]:
        if r["actor_id"] == uid:
            r["actor_id"] = None
    db["user_progress"] = [r for r in db["user_progress"] if r["user_id"] != uid]
    redis = {key: value for key, value in before["redis"].items() if not key.startswith(f"refresh:{uid}:")}
    return {"db": db, "redis": redis}


def _assert_covers_every_kind(before: dict, uid: int) -> None:
    """The world holds every kind of row a deletion touches, for the account and for
    others, so neither half of a comparison can pass by having nothing to change."""
    db = before["db"]
    for table, column in (("oauth_accounts", "user_id"), ("comments", "user_id"),
                          ("notifications", "user_id"), ("notifications", "actor_id"),
                          ("user_progress", "user_id")):
        values = [r[column] for r in db[table]]
        assert uid in values, (table, column)
        assert any(v not in (uid, None) for v in values), (table, column)
    mine = [key for key in before["redis"] if key.startswith(f"refresh:{uid}:")]
    assert len(mine) == 2
    assert len(before["redis"]) > len(mine)


def _from_the_lock(sent: list) -> list:
    lock = next(i for i, (sql, *_) in enumerate(sent) if "FROM users" in sql and sql.endswith("FOR UPDATE"))
    return sent[lock:]


async def test_settings_and_the_admin_page_delete_an_account_the_same_way(monkeypatch):
    destroyed = _stub_destroy(monkeypatch)
    results = {}
    for door in ("settings", "admin"):
        redis = fakeredis.aioredis.FakeRedis(server=fakeredis.FakeServer(), decode_responses=True)
        monkeypatch.setattr(core_auth, "redis_client", redis)
        world = await _build_world(redis)
        try:
            uid = world.ids["newplayer_22"]
            before = await world.state()
            destroyed.clear()
            with _statements(world.engine) as sent:
                if door == "settings":
                    r = await world.call("DELETE", "/api/users/me", who="newplayer_22")
                else:
                    r = await world.call("DELETE", f"/api/admin/users/{uid}", who="site_admin")
            assert r.status_code == 204, (door, r.text)
            results[door] = SimpleNamespace(
                uid=uid, before=before, after=await world.state(),
                destroyed=list(destroyed), sql=_from_the_lock(sent),
            )
        finally:
            await world.close()
            await redis.aclose()

    settings, admin = results["settings"], results["admin"]
    assert settings.before == admin.before  # two identical worlds
    _assert_covers_every_kind(settings.before, settings.uid)
    assert settings.after == admin.after
    assert settings.destroyed == admin.destroyed == [_avatar(settings.uid)]
    assert settings.sql == admin.sql
    # Equal, and right: two identical wrong results can't pass.
    assert settings.after == _expected_after_deletion(settings.before, settings.uid)
    shown = [sql for sql, *_ in settings.sql]
    erase = [i for i, sql in enumerate(shown) if sql.startswith("UPDATE comments")]
    delete = [i for i, sql in enumerate(shown) if sql.startswith("DELETE FROM users")]
    assert len(erase) == len(delete) == 1, shown
    assert 0 < erase[0] < delete[0]


async def test_settings_and_the_admin_page_call_the_one_delete_account(world, monkeypatch):
    assert users_routes.delete_account is users_service.delete_account
    assert admin_routes.delete_account is users_service.delete_account
    real = users_service.delete_account
    calls = []

    async def spy(db, user, **kwargs):
        calls.append((user.id, kwargs))
        return await real(db, user, **kwargs)

    monkeypatch.setattr(users_routes, "delete_account", spy)
    monkeypatch.setattr(admin_routes, "delete_account", spy)

    assert (await world.call("DELETE", "/api/users/me", who="lilyfan")).status_code == 204
    np = world.ids["newplayer_22"]
    assert (await world.call("DELETE", f"/api/admin/users/{np}", who="site_admin")).status_code == 204
    # The admin page names who acted, for the line the function logs.
    assert calls == [(world.ids["lilyfan"], {}), (np, {"admin_id": world.ids["site_admin"]})]


@pytest.mark.parametrize("door", ["settings", "admin"])
async def test_a_deletion_is_logged_before_the_avatar_call(world, monkeypatch, app_log, door):
    # The line is the deletion's only record, and the avatar call can take up to 15
    # seconds, so the line is written as the deletion commits: a deploy or a crash
    # during the call must not leave a deletion with no record.
    np, admin = world.ids["newplayer_22"], world.ids["site_admin"]
    line = (f"{CYAN}User {np} deleted their account{RESET}" if door == "settings"
            else f"{CYAN}Admin {admin} deleted user {np}{RESET}")
    logged_at_destroy = []

    def destroy(public_id, **kwargs):
        logged_at_destroy.append(_lines(app_log))
        return {"result": "ok"}

    monkeypatch.setattr("app.services.users.cloudinary.uploader.destroy", destroy)

    if door == "settings":
        r = await world.call("DELETE", "/api/users/me", who="newplayer_22")
    else:
        r = await world.call("DELETE", f"/api/admin/users/{np}", who="site_admin")

    assert r.status_code == 204
    assert logged_at_destroy == [[line]]
    assert _lines(app_log) == [line]


async def test_settings_refuses_an_admin_account_before_signing_anyone_out(world, monkeypatch, app_log):
    revoked = []

    async def revoke(user_id):
        revoked.append(user_id)

    monkeypatch.setattr(users_service, "revoke_all_refresh_tokens", revoke)
    before = await world.state()

    r = await world.call("DELETE", "/api/users/me", who="site_admin")

    assert (r.status_code, r.json()) == (403, {"detail": "Admin accounts can't be deleted."})
    assert revoked == []
    assert await world.state() == before
    assert world.destroyed == []
    assert _lines(app_log) == []


async def test_the_admin_page_can_delete_a_deactivated_account(world, app_log):
    spam = world.ids["spam_account"]
    before = await world.state()

    r = await world.call("DELETE", f"/api/admin/users/{spam}", who="site_admin")

    assert r.status_code == 204
    assert await world.state() == _expected_after_deletion(before, spam)
    assert await world.row("spam_account") is None
    assert world.destroyed == [_avatar(spam)]
    assert _lines(app_log) == [f"{CYAN}Admin {world.ids['site_admin']} deleted user {spam}{RESET}"]


def _meanwhile(world, monkeypatch, statement: str) -> None:
    """Patch the revoke delete_account runs first so that, before it ends the
    sessions, another transaction runs the statement on the account's row."""
    real = users_service.revoke_all_refresh_tokens

    async def then_revoke(user_id):
        async with world.engine.begin() as conn:
            await conn.execute(text(statement), {"id": user_id})
        await real(user_id)

    monkeypatch.setattr(users_service, "revoke_all_refresh_tokens", then_revoke)


async def _np_comment_bodies(world) -> dict:
    async with world.factory() as s:
        rows = await s.execute(select(Comment.id, Comment.body))
        by_id = dict(rows.all())
    return {name: by_id[world.comments[name]] for name in ("np_top", "np_reply")}


@pytest.mark.parametrize("door", ["settings", "admin"])
async def test_an_account_deleted_meanwhile_is_left_to_the_deletion_that_won(world, monkeypatch, app_log, door):
    _meanwhile(world, monkeypatch, "DELETE FROM users WHERE id = :id")
    np = world.ids["newplayer_22"]

    if door == "settings":
        r = await world.call("DELETE", "/api/users/me", who="newplayer_22")
        assert r.status_code == 204
    else:
        r = await world.call("DELETE", f"/api/admin/users/{np}", who="site_admin")
        assert (r.status_code, r.json()) == (404, {"detail": "User not found"})

    assert await world.row("newplayer_22") is None
    # Nothing written after the lock found no row: the raw DELETE cleared the link
    # (ON DELETE SET NULL) and left the text, which this request didn't erase.
    assert await _np_comment_bodies(world) == {"np_top": TEXT["np_top"], "np_reply": TEXT["np_reply"]}
    assert world.destroyed == []
    assert _lines(app_log) == []


@pytest.mark.parametrize("door", ["settings", "admin"])
async def test_a_promotion_that_lands_before_the_lock_is_refused(world, monkeypatch, app_log, door):
    _meanwhile(world, monkeypatch, "UPDATE users SET role = 'admin' WHERE id = :id")
    np = world.ids["newplayer_22"]

    if door == "settings":
        r = await world.call("DELETE", "/api/users/me", who="newplayer_22")
    else:
        r = await world.call("DELETE", f"/api/admin/users/{np}", who="site_admin")

    assert (r.status_code, r.json()) == (403, {"detail": "Admin accounts can't be deleted."})
    row = await world.row("newplayer_22")
    assert (row.role, row.is_active) == ("admin", True)
    assert await _np_comment_bodies(world) == {"np_top": TEXT["np_top"], "np_reply": TEXT["np_reply"]}
    assert world.destroyed == []
    assert _lines(app_log) == []
    # The window's one cost: the sessions had already ended.
    assert [key for key in await world.redis.keys("*") if key.startswith(f"refresh:{np}:")] == []


# ── Roles and status ──────────────────────────────────────────────────────────

async def _role_on_comments(world, name: str = "np_top") -> str:
    r = await world.call("GET", "/api/comments/walkthrough/1")
    assert r.status_code == 200
    (comment,) = [c for c in r.json() if c["id"] == world.comments[name]]
    return comment["user"]["role"]


async def test_a_role_change_shows_on_comments_and_counts_at_once(world):
    np = world.ids["newplayer_22"]
    assert await _role_on_comments(world) == "user"

    r = await world.call("PUT", f"/api/admin/users/{np}/role", who="site_admin", json={"role": "moderator"})
    assert r.status_code == 200
    assert (r.json()["role"], (await world.row("newplayer_22")).role) == ("moderator", "moderator")
    assert await _role_on_comments(world) == "moderator"
    # A moderator may delete a user's comment, whatever the token's role claim says.
    lily_top = world.comments["lily_top"]
    r = await world.call("DELETE", f"/api/comments/{lily_top}", token=world.token("newplayer_22", role="user"))
    assert r.status_code == 204

    r = await world.call("PUT", f"/api/admin/users/{np}/role", who="site_admin", json={"role": "user"})
    assert (r.status_code, r.json()["role"]) == (200, "user")
    assert await _role_on_comments(world) == "user"
    # The demoted moderator's next delete of a user's comment is refused.
    lily_reply = world.comments["lily_reply"]
    r = await world.call("DELETE", f"/api/comments/{lily_reply}", token=world.token("newplayer_22", role="moderator"))
    assert (r.status_code, r.json()) == (403, {"detail": "Cannot delete this comment"})


@pytest.mark.parametrize("body", [
    {"role": "admin"},
    {"role": "superuser"},
    {"role": "Moderator"},
    {"role": None},
    {},
    {"role": "moderator", "extra": True},
])
async def test_a_role_the_route_doesnt_offer_is_a_422_with_nothing_changed(world, app_log, body):
    np = world.ids["newplayer_22"]
    before = await world.state()
    r = await world.call("PUT", f"/api/admin/users/{np}/role", who="site_admin", json=body)
    assert r.status_code == 422
    assert await world.state() == before
    assert _lines(app_log) == []


@pytest.mark.parametrize("body", [
    {"active": "false"},
    {"active": 0},
    {"active": None},
    {},
    {"active": False, "extra": True},
])
async def test_a_status_body_the_route_doesnt_take_is_a_422_with_nothing_changed(world, app_log, body):
    np = world.ids["newplayer_22"]
    before = await world.state()
    r = await world.call("PUT", f"/api/admin/users/{np}/active", who="site_admin", json=body)
    assert r.status_code == 422
    assert await world.state() == before
    assert _lines(app_log) == []


@pytest.mark.parametrize("path, body", [
    ("/admin/users/{user_id}/role", {"role": "moderator"}),
    ("/admin/users/{user_id}/active", {"active": False}),
])
@pytest.mark.parametrize("statement", [
    "UPDATE users SET role = 'admin' WHERE id = :id",
    "DELETE FROM users WHERE id = :id",
])
async def test_a_write_to_an_account_promoted_or_deleted_after_the_lookup_is_the_404(world, monkeypatch, app_log, path, body, statement):
    # The guarded UPDATE matches no row, so nothing is written to an account that has
    # become an admin's, or no longer exists, since _target read it.
    real = admin_routes._target

    async def then_changed(request, db, user_id):
        user = await real(request, db, user_id)
        async with world.engine.begin() as conn:
            await conn.execute(text(statement), {"id": user_id})
        return user

    monkeypatch.setattr(admin_routes, "_target", then_changed)
    np = world.ids["newplayer_22"]

    r = await world.call("PUT", _url(path, np), who="site_admin", json=body)

    assert (r.status_code, r.json()) == (404, {"detail": "User not found"})
    row = await world.row("newplayer_22")
    if statement.startswith("UPDATE"):
        assert (row.role, row.is_active) == ("admin", True)
    else:
        assert row is None
    assert _lines(app_log) == []


async def test_reactivating_an_active_account_changes_nothing(world, monkeypatch, app_log):
    # The press can come from a list loaded before the last reactivation: the account
    # keeps its sessions, nothing is written and nothing is logged.
    np = world.ids["newplayer_22"]
    revoked = []

    async def revoke(user_id):
        revoked.append(user_id)

    monkeypatch.setattr(admin_routes, "revoke_all_refresh_tokens", revoke)
    before = await world.state()

    r = await world.call("PUT", f"/api/admin/users/{np}/active", who="site_admin", json={"active": True})

    assert (r.status_code, r.json()["is_active"]) == (200, True)
    assert revoked == []
    assert await world.state() == before
    assert _lines(app_log) == []


async def test_a_write_answers_with_what_it_wrote_when_the_account_goes_just_after(world, monkeypatch):
    # The account is deleted between the write's commit and the answer: the answer is
    # built from the row as written, never a reload that would find nothing (a 500).
    real = admin_routes._write_unless_admin

    async def then_deleted(db, user_id, **values):
        await real(db, user_id, **values)
        async with world.engine.begin() as conn:
            await conn.execute(text("DELETE FROM users WHERE id = :id"), {"id": user_id})

    monkeypatch.setattr(admin_routes, "_write_unless_admin", then_deleted)
    np, lily = world.ids["newplayer_22"], world.ids["lilyfan"]

    r = await world.call("PUT", f"/api/admin/users/{np}/role", who="site_admin", json={"role": "moderator"})
    assert (r.status_code, r.json()["id"], r.json()["role"]) == (200, np, "moderator")
    r = await world.call("PUT", f"/api/admin/users/{lily}/active", who="site_admin", json={"active": False})
    assert (r.status_code, r.json()["id"], r.json()["is_active"]) == (200, lily, False)
    assert await world.row("newplayer_22") is None and await world.row("lilyfan") is None


async def test_a_role_set_by_hand_outside_the_three_still_lists_and_can_be_put_right(world):
    # Admins are made in SQL and the column has no constraint, so a typo can happen:
    # it must not take the whole list down.
    lily = world.ids["lilyfan"]
    async with world.engine.begin() as conn:
        await conn.execute(text("UPDATE users SET role = 'mod' WHERE id = :id"), {"id": lily})

    r = await world.call("GET", "/api/admin/users", who="site_admin")
    assert r.status_code == 200
    assert {row["username"]: row["role"] for row in r.json()}["lilyfan"] == "mod"
    r = await world.call("POST", "/api/admin/users/search", who="site_admin", json={"q": "lily"})
    assert (r.status_code, [row["role"] for row in r.json()]) == (200, ["mod"])

    r = await world.call("PUT", f"/api/admin/users/{lily}/role", who="site_admin", json={"role": "moderator"})
    assert (r.status_code, r.json()["role"]) == (200, "moderator")
    assert (await world.row("lilyfan")).role == "moderator"


async def test_deactivating_and_reactivating_flip_the_flag_and_end_every_session(world, monkeypatch):
    np = world.ids["newplayer_22"]
    real = admin_routes.revoke_all_refresh_tokens
    at_revoke = []

    async def revoke(user_id):
        # What the row says when the sessions end: still the old value, so the
        # revoke runs before the write.
        at_revoke.append((user_id, (await world.row("newplayer_22")).is_active))
        await real(user_id)

    monkeypatch.setattr(admin_routes, "revoke_all_refresh_tokens", revoke)

    def others(state):
        return {k: v for k, v in state["redis"].items() if not k.startswith(f"refresh:{np}:")}

    before = await world.state()
    assert len([key for key in before["redis"] if key.startswith(f"refresh:{np}:")]) == 2
    r = await world.call("PUT", f"/api/admin/users/{np}/active", who="site_admin", json={"active": False})
    assert (r.status_code, r.json()["is_active"]) == (200, False)
    after = await world.state()
    assert (await world.row("newplayer_22")).is_active is False
    assert [key for key in after["redis"] if key.startswith(f"refresh:{np}:")] == []
    assert others(after) == others(before)
    # And the account's own access token, unexpired, no longer gets through.
    assert (await world.call("DELETE", "/api/users/me", who="newplayer_22")).status_code == 401

    # A session left from before the deactivation can't come back with the account.
    await _seed_session(world.redis, np, "newplayer_22")
    r = await world.call("PUT", f"/api/admin/users/{np}/active", who="site_admin", json={"active": True})
    assert (r.status_code, r.json()["is_active"]) == (200, True)
    assert (await world.row("newplayer_22")).is_active is True
    assert [key for key in await world.redis.keys("*") if key.startswith(f"refresh:{np}:")] == []
    assert at_revoke == [(np, True), (np, False)]


# ── What the answers hold ─────────────────────────────────────────────────────

def _leaks(text_: str) -> list[str]:
    """Any seeded address in the text, whole or by its local part or domain name."""
    lowered = text_.lower()
    found = []
    for address in ADDRESSES:
        local, domain = address.lower().split("@")
        found += [part for part in (address.lower(), local, domain.split(".")[0]) if part in lowered]
    return found


async def test_no_answer_but_the_reveal_holds_an_address(world):
    np = world.ids["newplayer_22"]
    answers = [await world.call("GET", "/api/admin/users", who="site_admin")]
    for q in ("", "new", "jo.reader@mailhost.example", "OWNER.ONE@ADMINMAIL.EXAMPLE", "mail", "jo.reader"):
        answers.append(await world.call("POST", "/api/admin/users/search", who="site_admin", json={"q": q}))
    for body in ({"role": "moderator"}, {"role": "user"}):
        answers.append(await world.call("PUT", f"/api/admin/users/{np}/role", who="site_admin", json=body))
    for body in ({"active": False}, {"active": True}):
        answers.append(await world.call("PUT", f"/api/admin/users/{np}/active", who="site_admin", json=body))
    answers.append(await world.call("POST", f"/api/admin/users/{world.ids['second_admin']}/email", who="site_admin"))
    answers.append(await world.call("POST", f"/api/admin/users/{UNKNOWN_ID}/email", who="site_admin"))
    assert [r.status_code for r in answers] == [200] * 11 + [403, 404]
    assert len(answers[0].json()) == len(ACCOUNTS)
    for r in answers:
        assert _leaks(r.text) == [], r.request.url

    r = await world.call("POST", f"/api/admin/users/{np}/email", who="site_admin")
    assert (r.status_code, r.json()) == (200, {"id": np, "email": "jo.reader@mailhost.example"})


async def test_each_row_holds_the_masked_address_and_the_accounts_state(world):
    r = await world.call("GET", "/api/admin/users", who="site_admin")
    assert r.status_code == 200
    rows = {row["username"]: row for row in r.json()}
    assert rows["newplayer_22"] == {
        "id": world.ids["newplayer_22"],
        "username": "newplayer_22",
        "avatar_url": NP_AVATAR,
        "email_masked": "j***@m***.example",
        "role": "user",
        "is_active": True,
        "created_at": rows["newplayer_22"]["created_at"],
    }
    # Stored mixed case, masked as stored.
    assert rows["site_admin"]["email_masked"] == "O***@A***.example"
    assert (rows["spam_account"]["is_active"], rows["helpful_mod"]["role"]) == (False, "moderator")
    assert datetime.fromisoformat(rows["newplayer_22"]["created_at"]).replace(tzinfo=None) == datetime(2026, 1, 7, 12, 0)


# ── List and search ───────────────────────────────────────────────────────────

async def _add_accounts(world, *names: str, joined: datetime | None = None) -> None:
    async with world.factory() as s:
        for name in names:
            s.add(User(email=f"{name.lower()}.extra@extramail.example", username=name, password_hash="x",
                       created_at=joined or T0, updated_at=joined or T0))
        await s.commit()


async def _list(world) -> list[str]:
    r = await world.call("GET", "/api/admin/users", who="site_admin")
    assert r.status_code == 200
    return [row["username"] for row in r.json()]


async def _search(world, q) -> list[str]:
    r = await world.call("POST", "/api/admin/users/search", who="site_admin", json={"q": q})
    assert r.status_code == 200, r.text
    return [row["username"] for row in r.json()]


async def test_the_list_is_every_account_newest_first_ties_broken_by_id(world):
    assert await _list(world) == NEWEST_FIRST
    # Two more joining at the same moment as newplayer_22: the later id comes first.
    await _add_accounts(world, "tie_one", "tie_two", joined=T0 + timedelta(days=6))
    assert await _list(world) == ["lilyfan", "tie_two", "tie_one", "newplayer_22", "spam_account",
                                  "helpful_mod", "retired_admin", "second_admin", "site_admin"]


async def test_a_username_matches_by_any_part_in_any_case(world):
    assert await _search(world, "PLAYER") == ["newplayer_22"]
    assert await _search(world, "  Player_2 ") == ["newplayer_22"]
    assert await _search(world, "admin") == ["retired_admin", "second_admin", "site_admin"]


async def test_an_email_matches_only_whole_in_any_case(world):
    assert await _search(world, "JO.READER@MAILHOST.EXAMPLE") == ["newplayer_22"]
    assert await _search(world, "owner.one@adminmail.example") == ["site_admin"]
    for part in ("jo.reader", "jo.reader@", "@mailhost.example", "mailhost.example",
                 "jo.reader@mailhost", "o.reader@mailhost.example"):
        assert await _search(world, part) == [], part


async def test_like_wildcards_match_literally(world):
    await _add_accounts(world, "rate_10", "rateX10")
    # An unescaped _ matches any one character, so "e_1" would find rateX10 too.
    assert await _search(world, "e_1") == ["rate_10"]
    assert await _search(world, "_") == [name for name in NEWEST_FIRST if "_" in name] + ["rate_10"]
    # An unescaped % matches everything; no username holds one, or a backslash.
    for q in ("%", "%%", "50%", "\\", "\\%", "a\\_"):
        assert await _search(world, q) == [], q


async def test_a_blank_search_is_the_whole_list(world):
    whole = (await world.call("GET", "/api/admin/users", who="site_admin")).json()
    assert len(whole) == len(ACCOUNTS)
    for q in ("", "   ", "\t\n "):
        r = await world.call("POST", "/api/admin/users/search", who="site_admin", json={"q": q})
        assert (r.status_code, r.json()) == (200, whole), repr(q)


@pytest.mark.parametrize("q", ["new" + chr(0), chr(0), "new" + chr(0xD800), chr(0xDFFF) + "player"])
async def test_a_search_the_database_cant_take_finds_nothing_without_a_query(world, q):
    # Built by hand: json.dumps writes the surrogate as an ASCII escape, as
    # JSON.stringify sends one.
    with _statements(world.engine) as sent:
        r = await world.call("POST", "/api/admin/users/search", who="site_admin",
                             content=json.dumps({"q": q}), headers={"content-type": "application/json"})
    assert (r.status_code, r.json()) == (200, [])
    # The one statement is the admin check's read of the caller.
    assert len(sent) == 1, sent
    assert "users.is_active" in sent[0][0]


@pytest.mark.parametrize("body, detail", [
    ({"q": "a" * 256}, "Search text can't be longer than 255 characters"),
    ({"q": "a" * 255 + chr(0xD800)}, "Search text can't be longer than 255 characters"),
    ({"q": "new", "extra": True}, "Extra inputs are not permitted"),
    ({}, "Field required"),
    ({"q": None}, "Input should be a valid string"),
    ({"q": 5}, "Input should be a valid string"),
])
async def test_a_search_body_the_route_doesnt_take_is_a_422(world, body, detail):
    r = await world.call("POST", "/api/admin/users/search", who="site_admin",
                         content=json.dumps(body), headers={"content-type": "application/json"})
    assert (r.status_code, r.json()) == (422, {"detail": detail})


async def test_a_search_of_255_characters_is_taken(world):
    assert await _search(world, "a" * 255) == []


async def test_a_search_that_finds_an_account_by_its_whole_address_is_logged(world, app_log):
    # Matching a whole address ties it to an account, as a reveal does, so each account
    # found that way gets a line, by number; the text typed is never logged. A search
    # by username, part of an address or an address nobody has writes nothing.
    admin, np = world.ids["site_admin"], world.ids["newplayer_22"]
    searches = {
        "new": ["newplayer_22"],
        "jo.reader@": [],
        "nobody@nowhere.example": [],
        "  JO.READER@MAILHOST.EXAMPLE ": ["newplayer_22"],
        "owner.one@adminmail.example": ["site_admin"],
    }
    for q, found in searches.items():
        assert await _search(world, q) == found, q
    assert _lines(app_log) == [
        f"{CYAN}Admin {admin} found user {np} by email address{RESET}",
        f"{CYAN}Admin {admin} found user {admin} by email address{RESET}",
    ]


async def test_every_limit_counts_per_admin_account_not_per_address(world, rate_limits_on):
    # A session has one budget wherever it calls from, a stolen token used from many
    # addresses included: the reveal's ten a minute across eleven addresses.
    np = world.ids["newplayer_22"]

    async def reveal(who: str, ip: str) -> int:
        r = await world.call("POST", f"/api/admin/users/{np}/email", who=who, headers={"cf-connecting-ip": ip})
        return r.status_code

    assert [await reveal("site_admin", f"203.0.113.{i}") for i in range(1, 12)] == [200] * 10 + [429]
    # Another admin account has a budget of its own, from the same address.
    assert await reveal("second_admin", "203.0.113.1") == 200


# ── mask_email ────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("email, masked", [
    ("kyoriku@gmail.com", "k***@g***.com"),
    ("a@b.co", "a***@b***.co"),
    ("first.last@mail.example.co.uk", "f***@m***.uk"),
    ("Owner.One@AdminMail.example", "O***@A***.example"),
    ("user+tag@sub.domain.org", "u***@s***.org"),
])
def test_mask_email_shows_the_first_character_of_each_half_and_the_last_label(email, masked):
    assert mask_email(email) == masked


@pytest.mark.parametrize("email", [
    "",
    "no-at-sign",
    "@example.com",
    "user@",
    "user@localhost",
    "user@.com",
    "user@example.",
    "user@exa..mple.com",
    "a@b@example.com",
    "@",
])
def test_a_malformed_address_is_masked_whole(email):
    assert mask_email(email) == "***"


# ── Log lines ─────────────────────────────────────────────────────────────────

async def test_every_action_logs_one_line_naming_accounts_by_number(world, app_log):
    admin, np, spam, lily = (world.ids[name] for name in ("site_admin", "newplayer_22", "spam_account", "lilyfan"))
    calls = [
        ("POST", f"/api/admin/users/{np}/email", "site_admin", None),
        ("PUT", f"/api/admin/users/{np}/role", "site_admin", {"role": "moderator"}),
        ("PUT", f"/api/admin/users/{np}/role", "site_admin", {"role": "user"}),
        ("PUT", f"/api/admin/users/{np}/active", "site_admin", {"active": False}),
        ("PUT", f"/api/admin/users/{np}/active", "site_admin", {"active": True}),
        ("DELETE", f"/api/admin/users/{spam}", "site_admin", None),
        ("DELETE", "/api/users/me", "lilyfan", None),
        # Read-only and refused requests write no line.
        ("GET", "/api/admin/users", "site_admin", None),
        ("POST", "/api/admin/users/search", "site_admin", {"q": "new"}),
        ("POST", f"/api/admin/users/{admin}/email", "site_admin", None),
    ]
    codes = [(await world.call(method, path, who=who, json=body)).status_code for method, path, who, body in calls]
    assert codes == [200, 200, 200, 200, 200, 204, 204, 200, 200, 403]
    assert _lines(app_log) == [
        f"{CYAN}Admin {admin} revealed the email address of user {np}{RESET}",
        f"{CYAN}Admin {admin} set user {np} role to moderator{RESET}",
        f"{CYAN}Admin {admin} set user {np} role to user{RESET}",
        f"{CYAN}Admin {admin} deactivated user {np}{RESET}",
        f"{CYAN}Admin {admin} reactivated user {np}{RESET}",
        f"{CYAN}Admin {admin} deleted user {spam}{RESET}",
        f"{CYAN}User {lily} deleted their account{RESET}",
    ]
