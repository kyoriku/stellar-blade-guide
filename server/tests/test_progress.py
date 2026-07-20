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
get_current_user() only decodes the JWT — no Redis lookup for access tokens.
"""

from __future__ import annotations

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
