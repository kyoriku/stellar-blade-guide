"""
Tests for the bulk progress routes: POST /api/progress/bulk/preview (what would
change) and POST /api/progress/bulk (clear, or mark found, every collectible in
one scope: everything, a level or a type, optionally narrowed to one cycle).

DDL mirrors test_user_stats.py: create_all for the tables without JSONB, raw SQL
for collectibles and the mapping table. The app mounts the progress and users
routers, so the stats read-back goes through the real aggregate.

Each request gets its own session from the test engine, as production's get_db
does, so a write that never commits is rolled back when its session closes. State
is read back through GET /api/progress, never session.get: the seed session's
identity map would still hold rows a request deleted.

Expected scopes come from ITEMS, a plain-Python description of the seed world,
filtered the way a level or type page lists items. That oracle shares no code with
the route's SQL.
"""

from __future__ import annotations

import logging
import typing

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select, text
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.core.auth import create_access_token
from app.db.database import Base, get_db
from app.middleware.exception_handlers import add_exception_handlers
from app.middleware.rate_limit import setup_rate_limiter
from app.models.collectibles import (
    Level, Location, CollectibleType, Collectible,
    collectible_type_mappings,  # noqa: F401 (registers the junction table with Base metadata)
)
from app.models.comments import Comment
from app.models.progress import UserProgress
from app.models.users import User, OAuthAccount
from app.routers import progress as progress_routes
from app.routers.progress import router as progress_router
from app.routers.users import CYCLE_DISPLAY_ORDER, router as users_router
from app.schemas.progress import BulkProgressRequest
from app.services.auth import hash_password

MINIMAL_DESCRIPTION = {"type": "text", "content": "Test description"}

# key: (level, types, cycle, quantity). Eidos 7 holds an item of every cycle, so
# each narrowing there has siblings it must leave alone; nano-suits span every
# cycle and both pseudo-levels.
ITEMS: dict[str, tuple[str, tuple[str, ...], str, int]] = {
    "e7_doc": ("Eidos 7", ("documents",), "Base", 1),
    "e7_dual": ("Eidos 7", ("documents", "passcodes"), "Base", 1),
    "e7_module": ("Eidos 7", ("drone-upgrade-modules",), "Base", 3),
    "e7_suit_ngp": ("Eidos 7", ("nano-suits",), "NG+", 1),
    "e7_suit_ngpp": ("Eidos 7", ("nano-suits",), "NG++", 1),
    "e7_suit_dlc": ("Eidos 7", ("nano-suits",), "DLC", 1),
    "x_doc": ("Xion", ("documents",), "Base", 1),
    "x_suit_ngp": ("Xion", ("nano-suits",), "NG+", 1),
    "def_suit_ngp": ("Default", ("nano-suits",), "NG+", 1),
    "boss_suit_base": ("Boss Challenge", ("nano-suits",), "Base", 1),
    "boss_suit_dlc": ("Boss Challenge", ("nano-suits",), "DLC", 1),
}

# Eidos 7's second location: a level scope must take every location of the level.
SECOND_LOCATION = {"e7_suit_ngp", "e7_suit_dlc"}

LEVELS = [("Default", 0), ("Eidos 7", 1), ("Xion", 2), ("Empty Level", 3), ("Boss Challenge", 11)]
TYPES = [
    ("Document", "documents", "collectibles"),
    ("Passcode", "passcodes", "collectibles"),
    ("Drone Upgrade Module", "drone-upgrade-modules", "upgrades"),
    ("Nano Suit", "nano-suits", "cosmetics"),
]

# The second user's rows, inside most scopes and different from the first user's,
# so a lost user filter changes something visible.
OTHER_USER_ITEMS = {"e7_doc", "e7_suit_ngpp", "x_doc", "def_suit_ngp", "boss_suit_dlc"}
# The first user's starting rows for the mark-found tests: two in, most out.
MARK_START = {"e7_module", "x_suit_ngp"}


def _expected(body: dict) -> set[str]:
    """The keys a scope covers, from ITEMS alone."""
    def in_scope(item):
        level, types, cycle, _ = item
        if body["scope"] == "level" and level != body["level"]:
            return False
        if body["scope"] == "type" and body["type"] not in types:
            return False
        return "cycle" not in body or cycle == body["cycle"]
    return {key for key, item in ITEMS.items() if in_scope(item)}


CYCLES = ["Base", "NG+", "NG++", "DLC"]


def _with_cycles(scope: dict) -> list[dict]:
    return [scope] + [{**scope, "cycle": c} for c in CYCLES]


SCOPES = [
    *_with_cycles({"scope": "everything"}),
    *_with_cycles({"scope": "level", "level": "Eidos 7"}),
    *_with_cycles({"scope": "type", "type": "nano-suits"}),
    {"scope": "level", "level": "Default"},
    {"scope": "level", "level": "Boss Challenge", "cycle": "DLC"},
    {"scope": "type", "type": "documents"},
    {"scope": "type", "type": "passcodes"},
]


def _scope_id(body: dict) -> str:
    target = body.get("level") or body.get("type") or "everything"
    return f"{target}+{body['cycle']}" if "cycle" in body else target


def _make_app(db_session: AsyncSession) -> FastAPI:
    app = FastAPI()
    setup_rate_limiter(app)
    # The real 422 flattener, as app.main registers it.
    add_exception_handlers(app)

    factory = async_sessionmaker(db_session.bind, expire_on_commit=False)

    async def override_get_db():
        async with factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    app.include_router(progress_router, prefix="/api")
    app.include_router(users_router, prefix="/api")
    return app


@pytest_asyncio.fixture
async def bulk_db_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(
            Base.metadata.create_all,
            tables=[
                User.__table__, OAuthAccount.__table__, UserProgress.__table__,
                Level.__table__, Location.__table__, CollectibleType.__table__,
                Comment.__table__,
            ],
        )
        await conn.execute(text("""
            CREATE TABLE collectibles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location_id INTEGER NOT NULL,
                title VARCHAR(255) NOT NULL,
                description JSON NOT NULL,
                display_order INTEGER NOT NULL,
                cycle VARCHAR(10) NOT NULL DEFAULT 'Base',
                quantity INTEGER NOT NULL DEFAULT 1,
                subtype VARCHAR(50)
            )
        """))
        await conn.execute(text("""
            CREATE TABLE collectible_type_mappings (
                collectible_id INTEGER NOT NULL,
                type_id INTEGER NOT NULL,
                PRIMARY KEY (collectible_id, type_id)
            )
        """))
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def bulk_db_session(bulk_db_engine):
    factory = async_sessionmaker(bulk_db_engine, expire_on_commit=False)
    async with factory() as session:
        yield session


async def _make_user(session: AsyncSession, name: str) -> User:
    user = User(email=f"{name}@example.com", username=name, password_hash=hash_password("password123"))
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


@pytest_asyncio.fixture
async def world(bulk_db_session) -> dict[str, int]:
    """Seeds the catalog in ITEMS and returns {key: collectible id}."""
    session = bulk_db_session
    level_ids, location_ids, type_ids = {}, {}, {}
    for name, order in LEVELS:
        level = Level(name=name, display_order=order)
        session.add(level)
        await session.flush()
        level_ids[name] = level.id
    # Location ids start at 101, so none equals a level id: a level scope that
    # compared the two would otherwise pick the same rows.
    areas = [(name, "area") for name, _ in LEVELS] + [("Eidos 7", "east")]
    for location_id, (name, area) in enumerate(areas, start=101):
        session.add(Location(id=location_id, level_id=level_ids[name], name=f"{name} {area}", display_order=1))
        location_ids[(name, area)] = location_id
    await session.flush()
    for name, slug, group in TYPES:
        ctype = CollectibleType(name=name, slug=slug, category_group=group, display_order=0)
        session.add(ctype)
        await session.flush()
        type_ids[slug] = ctype.id
    ids = {}
    for order, (key, (level, types, cycle, quantity)) in enumerate(ITEMS.items(), start=1):
        area = "east" if key in SECOND_LOCATION else "area"
        item = Collectible(
            location_id=location_ids[(level, area)], title=key, description=MINIMAL_DESCRIPTION,
            display_order=order, cycle=cycle, quantity=quantity,
        )
        session.add(item)
        await session.flush()
        ids[key] = item.id
        for slug in types:
            # Raw SQL: item.types.append() would lazy-load in the async session.
            await session.execute(
                text("INSERT INTO collectible_type_mappings (collectible_id, type_id) VALUES (:c, :t)"),
                {"c": item.id, "t": type_ids[slug]},
            )
    await session.commit()
    return ids


@pytest_asyncio.fixture
async def users(bulk_db_session):
    return await _make_user(bulk_db_session, "first"), await _make_user(bulk_db_session, "second")


def _client(session: AsyncSession, user: User | None) -> AsyncClient:
    headers = {"Authorization": f"Bearer {create_access_token(user.id, user.role)}"} if user else {}
    return AsyncClient(transport=ASGITransport(_make_app(session)), base_url="http://test", headers=headers)


@pytest_asyncio.fixture
async def first_client(bulk_db_session, users):
    async with _client(bulk_db_session, users[0]) as c:
        yield c


@pytest_asyncio.fixture
async def second_client(bulk_db_session, users):
    async with _client(bulk_db_session, users[1]) as c:
        yield c


@pytest_asyncio.fixture
async def guest_client(bulk_db_session):
    async with _client(bulk_db_session, None) as c:
        yield c


async def _tick(session: AsyncSession, user: User, ids: dict[str, int], keys) -> None:
    session.add_all(UserProgress(user_id=user.id, collectible_id=ids[k]) for k in keys)
    await session.commit()


async def _found(client: AsyncClient, ids: dict[str, int]) -> set[str]:
    r = await client.get("/api/progress")
    assert r.status_code == 200
    by_id = {v: k for k, v in ids.items()}
    return {by_id[i] for i in r.json()}


@pytest_asyncio.fixture
async def all_found(bulk_db_session, world, users):
    """The first user has every item; the second has OTHER_USER_ITEMS."""
    await _tick(bulk_db_session, users[0], world, ITEMS)
    await _tick(bulk_db_session, users[1], world, OTHER_USER_ITEMS)


@pytest_asyncio.fixture
async def some_found(bulk_db_session, world, users):
    """The first user has MARK_START; the second has OTHER_USER_ITEMS."""
    await _tick(bulk_db_session, users[0], world, MARK_START)
    await _tick(bulk_db_session, users[1], world, OTHER_USER_ITEMS)


def _qty(keys) -> int:
    return sum(ITEMS[k][3] for k in keys)


# ── Auth ──────────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("path", ["/api/progress/bulk", "/api/progress/bulk/preview"])
async def test_requires_auth(guest_client, world, path):
    r = await guest_client.post(path, json={"action": "clear", "scope": "everything"})
    assert r.status_code == 401


# ── Validation: nothing has a default, nothing is guessed ────────────────────

BAD_BODIES = {
    "empty": {},
    "action only": {"action": "clear"},
    "scope only": {"scope": "everything"},
    "cycle without scope": {"action": "clear", "cycle": "NG+"},
    "unknown action": {"action": "toggle", "scope": "everything"},
    "unknown scope": {"action": "clear", "scope": "all"},
    "unknown cycle": {"action": "clear", "scope": "everything", "cycle": "NG+++"},
    "cycle wrong case": {"action": "clear", "scope": "everything", "cycle": "ng+"},
    "null cycle": {"action": "clear", "scope": "everything", "cycle": None},
    "null level": {"action": "clear", "scope": "level", "level": None},
    "null type": {"action": "clear", "scope": "type", "type": None},
    # Only the null guard refuses these: a null target reads as no target.
    "everything with null level": {"action": "clear", "scope": "everything", "level": None},
    "everything with null type": {"action": "clear", "scope": "everything", "type": None},
    "everything with level": {"action": "clear", "scope": "everything", "level": "Eidos 7"},
    "everything with type": {"action": "clear", "scope": "everything", "type": "documents"},
    "level without level": {"action": "clear", "scope": "level"},
    "type without type": {"action": "clear", "scope": "type"},
    "level with type": {"action": "clear", "scope": "level", "level": "Eidos 7", "type": "documents"},
    "type with level": {"action": "clear", "scope": "type", "type": "documents", "level": "Eidos 7"},
    "extra field": {"action": "clear", "scope": "everything", "ids": [1]},
    "empty level": {"action": "clear", "scope": "level", "level": ""},
}

UNKNOWN_TARGETS = {
    # Each of these resolves on a page (any case, slug form, substring); none may
    # resolve here.
    "level lower case": {"scope": "level", "level": "eidos 7"},
    "level slug": {"scope": "level", "level": "eidos-7"},
    "level missing": {"scope": "level", "level": "Nowhere"},
    "type singular": {"scope": "type", "type": "document"},
    "type name case": {"scope": "type", "type": "Documents"},
    "type substring": {"scope": "type", "type": "nano"},
}


@pytest.mark.parametrize("path", ["/api/progress/bulk", "/api/progress/bulk/preview"])
@pytest.mark.parametrize("body", BAD_BODIES.values(), ids=BAD_BODIES.keys())
async def test_bad_bodies_are_rejected_and_change_nothing(first_client, second_client, all_found, world, path, body):
    r = await first_client.post(path, json=body)
    assert r.status_code == 422
    assert await _found(first_client, world) == set(ITEMS)
    assert await _found(second_client, world) == OTHER_USER_ITEMS


@pytest.mark.parametrize("path", ["/api/progress/bulk", "/api/progress/bulk/preview"])
@pytest.mark.parametrize("target", UNKNOWN_TARGETS.values(), ids=UNKNOWN_TARGETS.keys())
async def test_unknown_level_or_type_is_rejected(first_client, all_found, world, path, target):
    r = await first_client.post(path, json={"action": "clear", **target})
    assert r.status_code == 422
    assert r.json()["detail"] in ("Unknown level", "Unknown type")
    assert await _found(first_client, world) == set(ITEMS)


@pytest.mark.parametrize("path", ["/api/progress/bulk", "/api/progress/bulk/preview"])
@pytest.mark.parametrize("field", ["level", "type"])
async def test_a_control_character_is_refused_before_any_lookup(first_client, world, monkeypatch, path, field):
    # Postgres refuses a NUL in a text parameter, so the lookup would fail
    # there. SQLite accepts it and answers "Unknown level", so assert the lookup
    # never runs.
    async def unreachable(*_args):
        raise AssertionError("the scope lookup ran")
    monkeypatch.setattr(progress_routes, "_scope_ids", unreachable)
    r = await first_client.post(path, json={"action": "clear", "scope": field, field: "Eidos 7" + chr(0)})
    assert r.status_code == 422


def test_cycle_values_match_the_stats_order():
    # One list of cycles in step: the request literal and the stats ordering.
    optional = BulkProgressRequest.model_fields["cycle"].annotation
    literal = next(a for a in typing.get_args(optional) if a is not type(None))
    assert typing.get_args(literal) == CYCLE_DISPLAY_ORDER


# ── Scopes: exactly the scope, only the caller ───────────────────────────────

def test_every_cycle_narrowing_has_siblings_to_spare():
    # Guards the seed world itself: each narrowed scope must leave something in
    # its unnarrowed scope untouched, or a dropped cycle filter would go unseen.
    for body in SCOPES:
        if "cycle" in body:
            wider = {k: v for k, v in body.items() if k != "cycle"}
            assert _expected(wider) - _expected(body), _scope_id(body)


@pytest.mark.parametrize("body", SCOPES, ids=[_scope_id(b) for b in SCOPES])
async def test_clear_changes_exactly_the_scope(first_client, second_client, all_found, world, body):
    expected = _expected(body)
    r = await first_client.post("/api/progress/bulk", json={"action": "clear", **body})
    assert r.status_code == 200
    assert r.json() == {"entries": len(expected), "quantity": _qty(expected)}
    assert await _found(first_client, world) == set(ITEMS) - expected
    assert await _found(second_client, world) == OTHER_USER_ITEMS


@pytest.mark.parametrize("body", SCOPES, ids=[_scope_id(b) for b in SCOPES])
async def test_mark_found_changes_exactly_the_scope(first_client, second_client, some_found, world, body):
    expected = _expected(body)
    r = await first_client.post("/api/progress/bulk", json={"action": "mark_found", **body})
    assert r.status_code == 200
    added = expected - MARK_START
    assert r.json() == {"entries": len(added), "quantity": _qty(added)}
    assert await _found(first_client, world) == MARK_START | expected
    assert await _found(second_client, world) == OTHER_USER_ITEMS


async def test_level_and_cycle_leave_the_other_cycles_alone(first_client, all_found, world):
    r = await first_client.post(
        "/api/progress/bulk", json={"action": "clear", "scope": "level", "level": "Eidos 7", "cycle": "NG+"}
    )
    assert r.json()["entries"] == 1
    left = await _found(first_client, world)
    assert "e7_suit_ngp" not in left
    # NG++ sits next to NG+: a prefix or LIKE comparison would take it too.
    assert {"e7_suit_ngpp", "e7_suit_dlc", "e7_doc", "e7_module"} <= left


async def test_type_and_cycle_reach_into_both_pseudo_levels(first_client, all_found, world):
    await first_client.post("/api/progress/bulk", json={"action": "clear", "scope": "type", "type": "nano-suits", "cycle": "NG+"})
    left = await _found(first_client, world)
    assert not {"e7_suit_ngp", "x_suit_ngp", "def_suit_ngp"} & left
    assert {"e7_suit_ngpp", "boss_suit_dlc", "boss_suit_base"} <= left
    await first_client.post("/api/progress/bulk", json={"action": "clear", "scope": "type", "type": "nano-suits", "cycle": "DLC"})
    left = await _found(first_client, world)
    assert not {"boss_suit_dlc", "e7_suit_dlc"} & left
    assert "boss_suit_base" in left


async def test_pseudo_level_with_cycle(first_client, all_found, world):
    r = await first_client.post(
        "/api/progress/bulk", json={"action": "clear", "scope": "level", "level": "Boss Challenge", "cycle": "DLC"}
    )
    assert r.json() == {"entries": 1, "quantity": 1}
    left = await _found(first_client, world)
    assert "boss_suit_dlc" not in left and "boss_suit_base" in left


# ── Idempotence and empty scopes ──────────────────────────────────────────────

async def test_mark_all_found_is_idempotent(first_client, second_client, some_found, world):
    body = {"action": "mark_found", "scope": "everything"}
    first = await first_client.post("/api/progress/bulk", json=body)
    assert first.json()["entries"] == len(ITEMS) - len(MARK_START)
    again = await first_client.post("/api/progress/bulk", json=body)
    assert again.status_code == 200
    assert again.json() == {"entries": 0, "quantity": 0}
    assert await _found(first_client, world) == set(ITEMS)
    assert await _found(second_client, world) == OTHER_USER_ITEMS


async def test_the_write_logs_rows_and_quantity(first_client, bulk_db_session, world, users, caplog):
    # The page counts by quantity, so the INFO line carries both units; Eidos 7's x3
    # module makes them differ. One entry is already found, so what changed is not
    # the whole scope, and the line must count what changed.
    await _tick(bulk_db_session, users[0], world, {"e7_doc"})
    body = {"action": "mark_found", "scope": "level", "level": "Eidos 7"}
    keys = _expected(body) - {"e7_doc"}
    assert len(keys) != _qty(keys)
    caplog.set_level(logging.INFO, logger=progress_routes.logger.name)
    r = await first_client.post("/api/progress/bulk", json=body)
    assert r.status_code == 200
    lines = [rec.getMessage() for rec in caplog.records if "bulk mark_found level Eidos 7" in rec.getMessage()]
    assert len(lines) == 1
    assert f": {len(keys)} changed, {_qty(keys)} by quantity" in lines[0]


async def test_clear_with_nothing_found_returns_zero(first_client, world, users):
    r = await first_client.post("/api/progress/bulk", json={"action": "clear", "scope": "everything"})
    assert r.status_code == 200
    assert r.json() == {"entries": 0, "quantity": 0}


@pytest.mark.parametrize("body", [
    {"scope": "level", "level": "Xion", "cycle": "DLC"},
    {"scope": "level", "level": "Empty Level"},
    {"scope": "type", "type": "documents", "cycle": "NG+"},
], ids=["no Xion DLC", "level with no items", "no NG+ documents"])
async def test_an_empty_scope_counts_and_changes_nothing(first_client, all_found, world, body):
    preview = await first_client.post("/api/progress/bulk/preview", json={"action": "clear", **body})
    assert preview.status_code == 200
    assert preview.json() == {"entries": 0, "quantity": 0, "scope_entries": 0, "scope_ids": []}
    r = await first_client.post("/api/progress/bulk", json={"action": "clear", **body})
    assert r.json() == {"entries": 0, "quantity": 0}
    assert await _found(first_client, world) == set(ITEMS)


# ── Counts and the preview ────────────────────────────────────────────────────

async def test_counts_are_weighted_by_quantity(first_client, all_found, world):
    body = {"action": "clear", "scope": "type", "type": "drone-upgrade-modules"}
    preview = (await first_client.post("/api/progress/bulk/preview", json=body)).json()
    assert (preview["entries"], preview["quantity"]) == (1, 3)
    assert (await first_client.post("/api/progress/bulk", json=body)).json() == {"entries": 1, "quantity": 3}


@pytest.mark.parametrize("action", ["clear", "mark_found"])
@pytest.mark.parametrize("body", SCOPES, ids=[_scope_id(b) for b in SCOPES])
async def test_preview_matches_the_write_and_writes_nothing(first_client, some_found, world, action, body):
    request = {"action": action, **body}
    expected = _expected(body)
    preview = (await first_client.post("/api/progress/bulk/preview", json=request)).json()
    assert await _found(first_client, world) == MARK_START
    assert sorted(preview["scope_ids"]) == preview["scope_ids"]
    assert {k for k, v in world.items() if v in preview["scope_ids"]} == expected
    assert preview["scope_entries"] == len(expected)
    write = (await first_client.post("/api/progress/bulk", json=request)).json()
    assert {"entries": preview["entries"], "quantity": preview["quantity"]} == write
    changing = expected & MARK_START if action == "clear" else expected - MARK_START
    assert write == {"entries": len(changing), "quantity": _qty(changing)}


# ── Stats read the new state ──────────────────────────────────────────────────

def _stat(rows: list[dict], key: str, value: str) -> int:
    return next(r["completed"] for r in rows if r[key] == value)


async def test_stats_follow_a_narrowed_clear(first_client, all_found, world):
    before = (await first_client.get("/api/users/me/stats")).json()
    await first_client.post("/api/progress/bulk", json={"action": "clear", "scope": "level", "level": "Eidos 7", "cycle": "NG+"})
    after = (await first_client.get("/api/users/me/stats")).json()
    assert after["total"]["completed"] == before["total"]["completed"] - 1
    assert _stat(after["levels"], "name", "Eidos 7") == _stat(before["levels"], "name", "Eidos 7") - 1
    assert _stat(after["cycles"], "name", "NG+") == _stat(before["cycles"], "name", "NG+") - 1
    assert _stat(after["types"], "slug", "nano-suits") == _stat(before["types"], "slug", "nano-suits") - 1
    assert _stat(after["levels"], "name", "Xion") == _stat(before["levels"], "name", "Xion")


async def test_stats_show_a_shared_item_leaving_both_types(first_client, all_found, world):
    before = (await first_client.get("/api/users/me/stats")).json()
    await first_client.post("/api/progress/bulk", json={"action": "clear", "scope": "type", "type": "passcodes"})
    after = (await first_client.get("/api/users/me/stats")).json()
    assert _stat(after["types"], "slug", "passcodes") == 0
    # The dual-typed item was a document too, and the category counts it once.
    assert _stat(after["types"], "slug", "documents") == _stat(before["types"], "slug", "documents") - 1
    assert _stat(after["categories"], "category", "collectibles") == _stat(before["categories"], "category", "collectibles") - 1


async def test_stats_follow_mark_all_found(first_client, some_found, world):
    await first_client.post("/api/progress/bulk", json={"action": "mark_found", "scope": "everything"})
    stats = (await first_client.get("/api/users/me/stats")).json()
    assert stats["total"] == {"completed": _qty(ITEMS), "total": _qty(ITEMS)}


# ── What only the Postgres statement shows ────────────────────────────────────

def _pg_sql(stmt) -> str:
    return str(stmt.compile(dialect=postgresql.asyncpg.dialect()))


def test_mark_found_names_the_constraint_and_skips_owned_rows():
    # SQLite drops the constraint name, so a misspelled one would pass every
    # route test above; and the anti-join cannot be observed without a sequence.
    sql = _pg_sql(progress_routes._mark_found_stmt(1, select(Collectible.id)))
    assert "ON CONFLICT ON CONSTRAINT uq_user_collectible DO NOTHING" in sql
    assert "NOT (EXISTS" in sql
    assert "RETURNING user_progress.collectible_id" in sql


def test_clear_is_scoped_to_the_user():
    sql = _pg_sql(progress_routes._clear_stmt(1, select(Collectible.id)))
    assert "user_progress.user_id = $1::INTEGER" in sql


# ── Rate limit ────────────────────────────────────────────────────────────────
# The only tests that run the limiter. slowapi refuses a handler with no `request`
# parameter when the module loads, but it checks that `request` is the Starlette
# Request only on a limited call: a body parameter given that name would pass
# every other test and 500 every call in production.

async def test_the_write_is_limited_to_ten_a_minute(first_client, world, users, rate_limits_on):
    body = {"action": "clear", "scope": "everything"}
    codes = [(await first_client.post("/api/progress/bulk", json=body)).status_code for _ in range(11)]
    assert codes == [200] * 10 + [429]


async def test_the_preview_runs_under_the_limiter(first_client, world, users, rate_limits_on):
    r = await first_client.post("/api/progress/bulk/preview", json={"action": "clear", "scope": "everything"})
    assert r.status_code == 200
