"""
Tests for the progress endpoints: GET own progress, PUT set-complete,
DELETE un-complete, POST sync. (The old POST toggle and its transitional
410 signpost are gone — a POST to /progress/{id} is method-rejected.)

All four endpoints require authentication — 401 for unauthenticated requests.
Token injection follows the test_comments.py pattern: create_access_token()
is called directly, no login endpoint traffic.

DDL strategy:
  - users, oauth_accounts, user_progress: created via Base.metadata.create_all
    (no JSONB columns)
  - collectibles: created via raw SQL with a JSON column (same pattern as
    test_collectibles_route.py). Progress routes only SELECT Collectible.id
    (no relationship traversal), so Level/Location/type tables are not needed.

conftest's autouse patch_redis covers app.core.cache.redis_client.
get_current_user() decodes the JWT and loads the active user row; access tokens
never touch Redis.
"""

from __future__ import annotations

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.core.auth import create_access_token
from app.db.database import Base, get_db
from app.middleware.rate_limit import setup_rate_limiter
from app.models.progress import UserProgress  # noqa: F401 — registers table with Base
from app.models.users import User, OAuthAccount  # noqa: F401 — registers tables with Base
from app.services.auth import hash_password
from app.routers.progress import router as progress_router


def _make_progress_app(db_session: AsyncSession) -> FastAPI:
    app = FastAPI()
    setup_rate_limiter(app)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.include_router(progress_router, prefix="/api")
    return app


@pytest_asyncio.fixture
async def progress_db_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(
            Base.metadata.create_all,
            tables=[User.__table__, OAuthAccount.__table__, UserProgress.__table__],
        )
        # Collectible.description is JSONB — SQLiteTypeCompiler has no visit_JSONB.
        # Create via raw SQL with a JSON column. Only the table's existence matters;
        # progress routes SELECT Collectible.id scalars without traversing relationships.
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
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def progress_db_session(progress_db_engine):
    factory = async_sessionmaker(progress_db_engine, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest_asyncio.fixture
async def test_user(progress_db_session):
    user = User(
        email="user@example.com",
        username="testuser",
        password_hash=hash_password("password123"),
    )
    progress_db_session.add(user)
    await progress_db_session.commit()
    await progress_db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def second_user(progress_db_session):
    user = User(
        email="user2@example.com",
        username="testuser2",
        password_hash=hash_password("password123"),
    )
    progress_db_session.add(user)
    await progress_db_session.commit()
    await progress_db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def progress_client(progress_db_session):
    async with AsyncClient(
        transport=ASGITransport(_make_progress_app(progress_db_session)),
        base_url="http://test",
    ) as c:
        yield c


@pytest_asyncio.fixture
async def user_client(progress_db_session, test_user):
    token = create_access_token(test_user.id, test_user.role)
    async with AsyncClient(
        transport=ASGITransport(_make_progress_app(progress_db_session)),
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    ) as c:
        yield c


@pytest_asyncio.fixture
async def second_user_client(progress_db_session, second_user):
    token = create_access_token(second_user.id, second_user.role)
    async with AsyncClient(
        transport=ASGITransport(_make_progress_app(progress_db_session)),
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    ) as c:
        yield c


async def _seed_collectible(session: AsyncSession, collectible_id: int = 1) -> None:
    await session.execute(
        text(
            "INSERT INTO collectibles (id, location_id, title, description, display_order) "
            "VALUES (:id, 1, 'Test Item', :desc, 1)"
        ),
        {"id": collectible_id, "desc": '{"type": "text", "content": "test"}'},
    )
    await session.commit()


# ── GET /api/progress ─────────────────────────────────────────────────────────

async def test_get_progress_unauthenticated_returns_401(progress_client):
    r = await progress_client.get("/api/progress")
    assert r.status_code == 401


async def test_get_progress_returns_completed_ids(user_client, progress_db_session, test_user):
    await _seed_collectible(progress_db_session, collectible_id=7)
    progress_db_session.add(UserProgress(user_id=test_user.id, collectible_id=7))
    await progress_db_session.commit()

    r = await user_client.get("/api/progress")
    assert r.status_code == 200
    assert r.json() == [7]


# ── POST /api/progress/{collectible_id} — no such route ───────────────────────

async def test_post_to_progress_id_has_no_handler(progress_client):
    # The blind toggle and its 410 signpost are both gone. PUT/DELETE remain
    # registered on this path, so routing rejects the method itself — a POST
    # handler reappearing here (toggle-style or otherwise) would flip this.
    r = await progress_client.post("/api/progress/1")
    assert r.status_code == 405


# ── PUT /api/progress/{collectible_id} (idempotent set-complete) ──────────────

async def test_put_unauthenticated_returns_401(progress_client):
    r = await progress_client.put("/api/progress/1")
    assert r.status_code == 401


async def test_put_marks_collectible_as_completed(user_client, progress_db_session):
    await _seed_collectible(progress_db_session, collectible_id=1)

    r = await user_client.put("/api/progress/1")
    assert r.status_code == 200
    assert r.json() == {"status": "added", "collectible_id": 1}

    r = await user_client.get("/api/progress")
    assert r.json() == [1]


async def test_put_twice_is_idempotent_and_signals_no_op(user_client, progress_db_session):
    # The stale-tab incident shape: re-asserting a completion must NOT invert it
    # (the POST toggle deleted the row here). already_complete is the drift
    # signal the client uses to schedule a re-sync.
    await _seed_collectible(progress_db_session, collectible_id=1)

    r1 = await user_client.put("/api/progress/1")
    assert r1.json()["status"] == "added"

    r2 = await user_client.put("/api/progress/1")
    assert r2.status_code == 200
    assert r2.json() == {"status": "already_complete", "collectible_id": 1}

    r = await user_client.get("/api/progress")
    assert r.json() == [1]


async def test_put_nonexistent_collectible_returns_404(user_client):
    r = await user_client.put("/api/progress/999")
    assert r.status_code == 404


@pytest.mark.parametrize("cid", [0, -1, 2**31, 2**63])
async def test_put_and_delete_outside_int4_are_the_unknown_id_404(user_client, progress_db_session, cid):
    # 2**63 would raise binding to SQLite without the guard, as 2**31 does in Postgres.
    # The others get a row SQLite can hold, so a guard with the wrong bound would find
    # it and answer 200: the 404 must come from the bound, before any query.
    if cid < 2**63:
        await _seed_collectible(progress_db_session, collectible_id=cid)
    for r in (await user_client.put(f"/api/progress/{cid}"), await user_client.delete(f"/api/progress/{cid}")):
        assert r.status_code == 404
        assert r.json() == {"detail": "Collectible not found"}


def test_put_skips_a_held_row_before_it_takes_a_sequence_value():
    # Postgres takes a nextval() for a candidate row before it checks conflicts, so
    # the NOT EXISTS must sit in the SELECT. SQLite drops the constraint name, so the
    # Postgres compile is what pins it.
    from sqlalchemy.dialects import postgresql
    from app.routers.progress import _put_stmt

    sql = " ".join(str(_put_stmt(1, 2).compile(dialect=postgresql.dialect())).split())
    assert sql.startswith("INSERT INTO user_progress (user_id, collectible_id) SELECT ")
    assert (
        " WHERE NOT (EXISTS (SELECT * FROM user_progress WHERE user_progress.user_id = %(user_id_1)s"
        " AND user_progress.collectible_id = %(collectible_id_1)s))"
    ) in sql
    assert sql.endswith(
        " ON CONFLICT ON CONSTRAINT uq_user_collectible DO NOTHING RETURNING user_progress.collectible_id"
    )


async def test_put_skips_only_the_row_itself(user_client, second_user_client, progress_db_session):
    # The NOT EXISTS is per user and per collectible: another of the user's rows, or
    # another user's row for the same collectible, must not stop the insert.
    await _seed_collectible(progress_db_session, collectible_id=1)
    await _seed_collectible(progress_db_session, collectible_id=2)

    assert (await user_client.put("/api/progress/1")).json()["status"] == "added"
    assert (await user_client.put("/api/progress/2")).json()["status"] == "added"
    assert sorted((await user_client.get("/api/progress")).json()) == [1, 2]
    assert (await second_user_client.put("/api/progress/1")).json()["status"] == "added"


# ── DELETE /api/progress/{collectible_id} (idempotent un-complete) ────────────

async def test_delete_unauthenticated_returns_401(progress_client):
    r = await progress_client.delete("/api/progress/1")
    assert r.status_code == 401


async def test_delete_removes_completion(user_client, progress_db_session):
    await _seed_collectible(progress_db_session, collectible_id=1)

    await user_client.put("/api/progress/1")
    r = await user_client.delete("/api/progress/1")
    assert r.status_code == 200
    assert r.json() == {"status": "removed", "collectible_id": 1}

    r = await user_client.get("/api/progress")
    assert r.json() == []


async def test_delete_twice_is_idempotent_and_signals_no_op(user_client, progress_db_session):
    await _seed_collectible(progress_db_session, collectible_id=1)

    await user_client.put("/api/progress/1")
    await user_client.delete("/api/progress/1")

    r = await user_client.delete("/api/progress/1")
    assert r.status_code == 200
    assert r.json() == {"status": "not_found", "collectible_id": 1}


async def test_delete_nonexistent_collectible_returns_404(user_client):
    r = await user_client.delete("/api/progress/999")
    assert r.status_code == 404


async def test_put_delete_round_trip(user_client, progress_db_session):
    await _seed_collectible(progress_db_session, collectible_id=1)

    assert (await user_client.put("/api/progress/1")).json()["status"] == "added"
    assert (await user_client.delete("/api/progress/1")).json()["status"] == "removed"
    assert (await user_client.put("/api/progress/1")).json()["status"] == "added"

    r = await user_client.get("/api/progress")
    assert r.json() == [1]


# ── POST /api/progress/sync ───────────────────────────────────────────────────

async def test_sync_unauthenticated_returns_401(progress_client):
    r = await progress_client.post("/api/progress/sync", json={"collectible_ids": [1]})
    assert r.status_code == 401


async def test_sync_with_valid_ids_returns_added_count(user_client, progress_db_session):
    await _seed_collectible(progress_db_session, collectible_id=1)
    await _seed_collectible(progress_db_session, collectible_id=2)

    r = await user_client.post("/api/progress/sync", json={"collectible_ids": [1, 2]})
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["added"] == 2


async def test_sync_with_empty_list_returns_zero(user_client):
    r = await user_client.post("/api/progress/sync", json={"collectible_ids": []})
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["added"] == 0


async def test_sync_silently_drops_nonexistent_collectible_ids(user_client):
    # ID 999 has no row in collectibles — sync validates against the DB and drops it
    r = await user_client.post("/api/progress/sync", json={"collectible_ids": [999]})
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["added"] == 0


async def test_sync_is_additive_only_never_deletes(user_client, progress_db_session):
    # Hard invariant: sync merges guest ids INTO existing progress; it must never
    # remove server-side completions, no matter what the client posts.
    await _seed_collectible(progress_db_session, collectible_id=1)
    await _seed_collectible(progress_db_session, collectible_id=2)

    await user_client.put("/api/progress/1")

    r = await user_client.post("/api/progress/sync", json={"collectible_ids": [2]})
    assert r.status_code == 200
    assert r.json()["added"] == 1

    r = await user_client.get("/api/progress")
    assert sorted(r.json()) == [1, 2]


async def test_sync_counts_a_repeated_id_once(user_client, progress_db_session):
    await _seed_collectible(progress_db_session, collectible_id=1)

    r = await user_client.post("/api/progress/sync", json={"collectible_ids": [1, 1]})
    assert r.status_code == 200
    assert r.json()["added"] == 1
    assert (await user_client.get("/api/progress")).json() == [1]


async def test_sync_of_ids_already_held_adds_nothing(user_client, progress_db_session):
    await _seed_collectible(progress_db_session, collectible_id=1)
    await user_client.put("/api/progress/1")

    r = await user_client.post("/api/progress/sync", json={"collectible_ids": [1]})
    assert r.status_code == 200
    assert r.json()["added"] == 0


async def test_sync_takes_up_to_2000_ids(user_client):
    r = await user_client.post("/api/progress/sync", json={"collectible_ids": list(range(1, 2001))})
    assert r.status_code == 200
    assert r.json()["added"] == 0  # none of them exist in this database

    r = await user_client.post("/api/progress/sync", json={"collectible_ids": list(range(1, 2002))})
    assert r.status_code == 422


async def test_sync_adds_only_what_it_was_sent(user_client, progress_db_session):
    # A repeat, an unknown id, and a collectible nobody sent that must stay unfound.
    for cid in (1, 2, 3):
        await _seed_collectible(progress_db_session, collectible_id=cid)

    r = await user_client.post("/api/progress/sync", json={"collectible_ids": [3, 3, 1, 999]})
    assert r.status_code == 200
    assert r.json()["added"] == 2
    assert sorted((await user_client.get("/api/progress")).json()) == [1, 3]


async def test_sync_drops_ids_outside_int4_like_unknown_ones(user_client, progress_db_session):
    # Postgres refuses to bind 2**31 to an int4 parameter; SQLite only refuses past
    # int8, so 2**63 is what would reach this database and raise without the filter.
    # Rows at 0, -1 and 2**31 (which SQLite can hold) make a filter with the wrong
    # bound add them, so the bound itself is pinned, not only the filter's presence.
    for cid in (1, 0, -1, 2**31):
        await _seed_collectible(progress_db_session, collectible_id=cid)

    r = await user_client.post("/api/progress/sync", json={"collectible_ids": [1, 0, -1, 2**31, 2**63]})
    assert r.status_code == 200
    assert r.json()["added"] == 1
    assert (await user_client.get("/api/progress")).json() == [1]

    r = await user_client.post("/api/progress/sync", json={"collectible_ids": [2**31, 2**63]})
    assert r.json() == {"status": "ok", "added": 0}


async def test_sync_inserts_through_the_bulk_statement(user_client, progress_db_session, monkeypatch):
    # One insert for both routes, so the NOT EXISTS and the lock order cannot drift apart.
    from app.routers import progress as progress_routes

    await _seed_collectible(progress_db_session, collectible_id=1)
    calls = []
    real = progress_routes._mark_found_stmt

    def spy(user_id, scope):
        calls.append(user_id)
        return real(user_id, scope)

    monkeypatch.setattr(progress_routes, "_mark_found_stmt", spy)
    r = await user_client.post("/api/progress/sync", json={"collectible_ids": [1]})
    assert r.json()["added"] == 1
    assert len(calls) == 1


# ── Isolation ─────────────────────────────────────────────────────────────────

async def test_progress_isolation_between_users(
    user_client, second_user_client, progress_db_session
):
    await _seed_collectible(progress_db_session, collectible_id=1)

    # User A marks collectible 1 as complete
    r = await user_client.put("/api/progress/1")
    assert r.status_code == 200
    assert r.json()["status"] == "added"

    # User B's GET must return an empty list — collectible 1 must not appear
    r = await second_user_client.get("/api/progress")
    assert r.status_code == 200
    assert r.json() == []


async def test_delete_is_scoped_to_current_user(
    user_client, second_user_client, progress_db_session
):
    # Pins the user_id predicate in the DELETE verb: user B un-completing an
    # item must never touch user A's row for the same collectible.
    await _seed_collectible(progress_db_session, collectible_id=1)

    r = await user_client.put("/api/progress/1")
    assert r.json()["status"] == "added"

    r = await second_user_client.delete("/api/progress/1")
    assert r.status_code == 200
    assert r.json()["status"] == "not_found"

    r = await user_client.get("/api/progress")
    assert r.json() == [1]
