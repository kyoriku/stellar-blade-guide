"""
Tests for GET /api/users/me/stats — the read-only per-user completion aggregate
(overall + per-type + per-level + per-cycle, plus comments_posted/member_since).

Requires authentication — 401 for unauthenticated requests. Token injection
follows the test_progress.py pattern: create_access_token() directly, no login
traffic. A read-only GET needs no core_auth.redis_client patch —
get_current_user() only decodes the JWT.

DDL strategy (mirrors test_progress.py / test_collectibles_route.py):
  - users, oauth_accounts, user_progress, levels, locations, collectible_types,
    comments: Base.metadata.create_all (no JSONB columns)
  - collectibles, collectible_type_mappings: raw SQL with JSON columns
    (Collectible.description is JSONB — SQLiteTypeCompiler has no visit_JSONB)
"""

from __future__ import annotations

from datetime import datetime

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.core.auth import create_access_token
from app.db.database import Base, get_db
from app.middleware.rate_limit import setup_rate_limiter
from app.models.collectibles import (
    Level, Location, CollectibleType, Collectible,
    collectible_type_mappings,  # noqa: F401 — registers junction table with Base metadata
)
from app.models.comments import Comment
from app.models.progress import UserProgress
from app.models.users import User, OAuthAccount  # noqa: F401 — registers tables with Base
from app.services.auth import hash_password
from app.routers.users import router as users_router

MINIMAL_DESCRIPTION = {"type": "text", "content": "Test description"}


def _make_users_app(db_session: AsyncSession) -> FastAPI:
    app = FastAPI()
    setup_rate_limiter(app)

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.include_router(users_router, prefix="/api")
    return app


@pytest_asyncio.fixture
async def stats_db_engine():
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
async def stats_db_session(stats_db_engine):
    factory = async_sessionmaker(stats_db_engine, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest_asyncio.fixture
async def test_user(stats_db_session):
    user = User(
        email="user@example.com",
        username="testuser",
        password_hash=hash_password("password123"),
    )
    stats_db_session.add(user)
    await stats_db_session.commit()
    await stats_db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def second_user(stats_db_session):
    user = User(
        email="user2@example.com",
        username="testuser2",
        password_hash=hash_password("password123"),
    )
    stats_db_session.add(user)
    await stats_db_session.commit()
    await stats_db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def guest_client(stats_db_session):
    async with AsyncClient(
        transport=ASGITransport(_make_users_app(stats_db_session)),
        base_url="http://test",
    ) as c:
        yield c


@pytest_asyncio.fixture
async def user_client(stats_db_session, test_user):
    token = create_access_token(test_user.id, test_user.role)
    async with AsyncClient(
        transport=ASGITransport(_make_users_app(stats_db_session)),
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    ) as c:
        yield c


@pytest_asyncio.fixture
async def second_user_client(stats_db_session, second_user):
    token = create_access_token(second_user.id, second_user.role)
    async with AsyncClient(
        transport=ASGITransport(_make_users_app(stats_db_session)),
        base_url="http://test",
        headers={"Authorization": f"Bearer {token}"},
    ) as c:
        yield c


# ── Seed helpers ──────────────────────────────────────────────────────────────

async def _seed_level(session: AsyncSession, name: str = "Xion", display_order: int = 1) -> Level:
    level = Level(name=name, display_order=display_order)
    session.add(level)
    await session.flush()
    return level


async def _seed_location(
    session: AsyncSession, level_id: int, name: str = "Zone A", display_order: int = 1
) -> Location:
    loc = Location(level_id=level_id, name=name, display_order=display_order)
    session.add(loc)
    await session.flush()
    return loc


async def _seed_type(
    session: AsyncSession,
    name: str,
    slug: str,
    category_group: str | None = "collectibles",
    display_order: int = 0,
) -> CollectibleType:
    ctype = CollectibleType(
        name=name, category_group=category_group, slug=slug, display_order=display_order
    )
    session.add(ctype)
    await session.flush()
    return ctype


async def _seed_collectible(
    session: AsyncSession,
    location_id: int,
    title: str = "Test Item",
    cycle: str | None = None,
    quantity: int | None = None,
    display_order: int = 1,
) -> Collectible:
    # cycle/quantity=None omit the column so the DDL defaults apply —
    # exercising the same server_default paths production relies on.
    kwargs = dict(
        location_id=location_id,
        title=title,
        description=MINIMAL_DESCRIPTION,
        display_order=display_order,
    )
    if cycle is not None:
        kwargs["cycle"] = cycle
    if quantity is not None:
        kwargs["quantity"] = quantity
    c = Collectible(**kwargs)
    session.add(c)
    await session.flush()
    return c


async def _map_type(session: AsyncSession, collectible_id: int, type_id: int) -> None:
    # Raw SQL — c.types.append() would lazy-load in the async session (MissingGreenlet).
    await session.execute(
        text("INSERT INTO collectible_type_mappings (collectible_id, type_id) VALUES (:cid, :tid)"),
        {"cid": collectible_id, "tid": type_id},
    )


async def _complete(session: AsyncSession, user_id: int, collectible_id: int) -> None:
    session.add(UserProgress(user_id=user_id, collectible_id=collectible_id))
    await session.flush()


async def _seed_comment(
    session: AsyncSession,
    user_id: int,
    is_deleted: bool = False,
    is_approved: bool = True,
) -> None:
    session.add(Comment(
        user_id=user_id,
        content_type="walkthrough",
        content_id=1,
        body="a comment",
        is_deleted=is_deleted,
        is_approved=is_approved,
    ))
    await session.flush()


async def _get_stats(client: AsyncClient) -> dict:
    r = await client.get("/api/users/me/stats")
    assert r.status_code == 200
    return r.json()


# ── Auth ──────────────────────────────────────────────────────────────────────

async def test_stats_requires_auth(guest_client):
    r = await guest_client.get("/api/users/me/stats")
    assert r.status_code == 401


# ── Shape ─────────────────────────────────────────────────────────────────────

async def test_empty_catalog_returns_zero_shape(user_client):
    data = await _get_stats(user_client)
    assert data["total"] == {"completed": 0, "total": 0}
    assert data["categories"] == []
    assert data["types"] == []
    assert data["levels"] == []
    assert data["cycles"] == []
    assert data["quantity_overrides"] == {}
    assert data["comments_posted"] == 0
    # member_since must be a parseable ISO timestamp even for a brand-new user
    assert datetime.fromisoformat(data["member_since"])


async def test_response_top_level_keys(user_client):
    data = await _get_stats(user_client)
    assert set(data.keys()) == {
        "total", "categories", "types", "levels", "cycles",
        "quantity_overrides", "comments_posted", "member_since",
    }


# ── Aggregation ───────────────────────────────────────────────────────────────

async def test_fresh_user_all_zeros(user_client, stats_db_session):
    level = await _seed_level(stats_db_session)
    loc = await _seed_location(stats_db_session, level.id)
    ctype = await _seed_type(stats_db_session, "Document", "documents")
    for i in range(2):
        c = await _seed_collectible(stats_db_session, loc.id, title=f"Doc {i}")
        await _map_type(stats_db_session, c.id, ctype.id)
    await stats_db_session.commit()

    data = await _get_stats(user_client)
    assert data["total"] == {"completed": 0, "total": 2}
    assert data["types"] == [
        {"name": "Document", "slug": "documents", "category": "collectibles",
         "completed": 0, "total": 2}
    ]
    assert data["levels"] == [
        {"name": "Xion", "order": 1, "completed": 0, "total": 2}
    ]
    assert data["cycles"] == [{"name": "Base", "completed": 0, "total": 2}]


async def test_dual_typed_item_counted_once_overall_once_per_type(
    user_client, stats_db_session, test_user
):
    level = await _seed_level(stats_db_session)
    loc = await _seed_location(stats_db_session, level.id)
    memorystick = await _seed_type(stats_db_session, "Memorystick", "memorysticks", display_order=1)
    passcode = await _seed_type(stats_db_session, "Passcode", "passcodes", display_order=2)
    c = await _seed_collectible(stats_db_session, loc.id, title="Dual Item")
    await _map_type(stats_db_session, c.id, memorystick.id)
    await _map_type(stats_db_session, c.id, passcode.id)
    await _complete(stats_db_session, test_user.id, c.id)
    await stats_db_session.commit()

    data = await _get_stats(user_client)
    # One row in the catalog, one completion — never double-counted overall...
    assert data["total"] == {"completed": 1, "total": 1}
    # ...but present in each of its type buckets.
    by_name = {t["name"]: t for t in data["types"]}
    assert by_name["Memorystick"] == {
        "name": "Memorystick", "slug": "memorysticks", "category": "collectibles",
        "completed": 1, "total": 1,
    }
    assert by_name["Passcode"]["completed"] == 1
    assert sum(t["total"] for t in data["types"]) > data["total"]["total"]


async def test_category_group_null_coalesces_to_collectibles(user_client, stats_db_session):
    await _seed_type(stats_db_session, "Legacy Type", "legacy-types", category_group=None)
    await _seed_type(stats_db_session, "Gear", "gear", category_group="upgrades")
    await stats_db_session.commit()

    data = await _get_stats(user_client)
    by_name = {t["name"]: t for t in data["types"]}
    assert by_name["Legacy Type"]["category"] == "collectibles"
    assert by_name["Gear"]["category"] == "upgrades"


async def test_type_with_no_collectibles_has_zero_total(user_client, stats_db_session):
    await _seed_type(stats_db_session, "Empty Type", "empty-types")
    await stats_db_session.commit()

    data = await _get_stats(user_client)
    assert data["types"] == [
        {"name": "Empty Type", "slug": "empty-types", "category": "collectibles",
         "completed": 0, "total": 0}
    ]


async def test_types_ordered_by_display_order(user_client, stats_db_session):
    await _seed_type(stats_db_session, "Second", "seconds", display_order=2)
    await _seed_type(stats_db_session, "First", "firsts", display_order=1)
    await stats_db_session.commit()

    data = await _get_stats(user_client)
    assert [t["name"] for t in data["types"]] == ["First", "Second"]


async def test_level_attribution_and_order(user_client, stats_db_session, test_user):
    later = await _seed_level(stats_db_session, name="Great Desert", display_order=2)
    earlier = await _seed_level(stats_db_session, name="Eidos 7", display_order=1)
    loc_later = await _seed_location(stats_db_session, later.id)
    loc_earlier = await _seed_location(stats_db_session, earlier.id, name="Zone B")
    in_later = await _seed_collectible(stats_db_session, loc_later.id, title="Desert Item")
    await _seed_collectible(stats_db_session, loc_earlier.id, title="Eidos Item")
    await _complete(stats_db_session, test_user.id, in_later.id)
    await stats_db_session.commit()

    data = await _get_stats(user_client)
    assert data["levels"] == [
        {"name": "Eidos 7", "order": 1, "completed": 0, "total": 1},
        {"name": "Great Desert", "order": 2, "completed": 1, "total": 1},
    ]


async def test_cycle_default_base_and_fixed_order(user_client, stats_db_session, test_user):
    level = await _seed_level(stats_db_session)
    loc = await _seed_location(stats_db_session, level.id)
    await _seed_collectible(stats_db_session, loc.id, title="Implicit Base")  # no cycle
    ng_plus = await _seed_collectible(stats_db_session, loc.id, title="NG+ Item", cycle="NG+")
    await _seed_collectible(stats_db_session, loc.id, title="DLC Item", cycle="DLC")
    await _complete(stats_db_session, test_user.id, ng_plus.id)
    await stats_db_session.commit()

    data = await _get_stats(user_client)
    # Fixed Base → NG+ → NG++ → DLC ordering; unseeded cycles simply absent.
    assert data["cycles"] == [
        {"name": "Base", "completed": 0, "total": 1},
        {"name": "NG+", "completed": 1, "total": 1},
        {"name": "DLC", "completed": 0, "total": 1},
    ]


async def test_unmapped_collectible_counts_overall_but_in_no_type(
    user_client, stats_db_session, test_user
):
    level = await _seed_level(stats_db_session)
    loc = await _seed_location(stats_db_session, level.id)
    await _seed_type(stats_db_session, "Document", "documents")
    unmapped = await _seed_collectible(stats_db_session, loc.id, title="No Type")
    await _complete(stats_db_session, test_user.id, unmapped.id)
    await stats_db_session.commit()

    data = await _get_stats(user_client)
    # Overall, level, and cycle all include it; the type bucket never sees it.
    assert data["total"] == {"completed": 1, "total": 1}
    assert data["levels"][0]["total"] == 1
    assert data["cycles"] == [{"name": "Base", "completed": 1, "total": 1}]
    assert data["types"] == [
        {"name": "Document", "slug": "documents", "category": "collectibles",
         "completed": 0, "total": 0}
    ]


async def test_two_user_isolation(user_client, second_user_client, stats_db_session, test_user):
    level = await _seed_level(stats_db_session)
    loc = await _seed_location(stats_db_session, level.id)
    c = await _seed_collectible(stats_db_session, loc.id)
    await _complete(stats_db_session, test_user.id, c.id)
    await stats_db_session.commit()

    first = await _get_stats(user_client)
    second = await _get_stats(second_user_client)
    assert first["total"] == {"completed": 1, "total": 1}
    assert second["total"] == {"completed": 0, "total": 1}


# ── Quantity weighting ────────────────────────────────────────────────────────
# All counts are quantity-weighted: a checked xN entry credits N. The default
# quantity is 1, so every test above doubles as the qty=1 case; these pin the
# weighted paths, which COUNT-vs-SUM regressions would otherwise not surface.

async def test_quantity_weighted_totals_across_all_buckets(
    user_client, stats_db_session, test_user
):
    level = await _seed_level(stats_db_session)
    loc = await _seed_location(stats_db_session, level.id)
    ctype = await _seed_type(stats_db_session, "Drone Upgrade Module", "drone-upgrade-modules")
    double = await _seed_collectible(stats_db_session, loc.id, title="x2 Drop", quantity=2)
    await _seed_collectible(stats_db_session, loc.id, title="Single")  # default quantity 1
    await _map_type(stats_db_session, double.id, ctype.id)
    await _complete(stats_db_session, test_user.id, double.id)
    await stats_db_session.commit()

    data = await _get_stats(user_client)
    # One checked x2 entry credits 2; the unchecked single still adds 1 to totals.
    assert data["total"] == {"completed": 2, "total": 3}
    assert data["types"] == [
        {"name": "Drone Upgrade Module", "slug": "drone-upgrade-modules",
         "category": "collectibles", "completed": 2, "total": 2}
    ]
    assert data["levels"] == [{"name": "Xion", "order": 1, "completed": 2, "total": 3}]
    assert data["cycles"] == [{"name": "Base", "completed": 2, "total": 3}]


async def test_unchecked_multiquantity_credits_zero(user_client, stats_db_session):
    level = await _seed_level(stats_db_session)
    loc = await _seed_location(stats_db_session, level.id)
    await _seed_collectible(stats_db_session, loc.id, title="x5 Chest", quantity=5)
    await stats_db_session.commit()

    data = await _get_stats(user_client)
    assert data["total"] == {"completed": 0, "total": 5}


async def test_dual_typed_multiquantity_credits_full_weight_per_type(
    user_client, stats_db_session, test_user
):
    level = await _seed_level(stats_db_session)
    loc = await _seed_location(stats_db_session, level.id)
    type_a = await _seed_type(stats_db_session, "Type A", "type-a", display_order=1)
    type_b = await _seed_type(stats_db_session, "Type B", "type-b", display_order=2)
    c = await _seed_collectible(stats_db_session, loc.id, title="Dual x2", quantity=2)
    await _map_type(stats_db_session, c.id, type_a.id)
    await _map_type(stats_db_session, c.id, type_b.id)
    await _complete(stats_db_session, test_user.id, c.id)
    await stats_db_session.commit()

    data = await _get_stats(user_client)
    assert data["total"] == {"completed": 2, "total": 2}
    by_name = {t["name"]: t for t in data["types"]}
    assert by_name["Type A"] == {"name": "Type A", "slug": "type-a",
                                 "category": "collectibles", "completed": 2, "total": 2}
    assert by_name["Type B"]["completed"] == 2


async def test_quantity_overrides_is_sparse_map_of_multiquantity_ids(
    user_client, stats_db_session
):
    level = await _seed_level(stats_db_session)
    loc = await _seed_location(stats_db_session, level.id)
    double = await _seed_collectible(stats_db_session, loc.id, title="x2", quantity=2)
    five = await _seed_collectible(stats_db_session, loc.id, title="x5", quantity=5)
    await _seed_collectible(stats_db_session, loc.id, title="Single")  # excluded: qty 1
    await stats_db_session.commit()

    data = await _get_stats(user_client)
    # JSON object keys are strings on the wire — the client relies on that.
    assert data["quantity_overrides"] == {str(double.id): 2, str(five.id): 5}


# ── Category rollups ──────────────────────────────────────────────────────────

async def test_dual_typed_within_category_counted_once_in_rollup(
    user_client, stats_db_session, test_user
):
    level = await _seed_level(stats_db_session)
    loc = await _seed_location(stats_db_session, level.id)
    memorystick = await _seed_type(stats_db_session, "Memorystick", "memorysticks")
    passcode = await _seed_type(stats_db_session, "Passcode", "passcodes")
    c = await _seed_collectible(stats_db_session, loc.id, title="Dual Item")
    await _map_type(stats_db_session, c.id, memorystick.id)
    await _map_type(stats_db_session, c.id, passcode.id)
    await _complete(stats_db_session, test_user.id, c.id)
    await stats_db_session.commit()

    data = await _get_stats(user_client)
    # The type rows double-list it (per-type views), the category rollup must not.
    assert sum(t["total"] for t in data["types"]) == 2
    assert data["categories"] == [
        {"category": "collectibles", "completed": 1, "total": 1}
    ]


async def test_category_rollups_weighted_ordered_and_coalesced(
    user_client, stats_db_session, test_user
):
    level = await _seed_level(stats_db_session)
    loc = await _seed_location(stats_db_session, level.id)
    gear = await _seed_type(stats_db_session, "Gear", "gear", category_group="upgrades")
    legacy = await _seed_type(stats_db_session, "Legacy", "legacy", category_group=None)
    double = await _seed_collectible(stats_db_session, loc.id, title="x2 Gear", quantity=2)
    single = await _seed_collectible(stats_db_session, loc.id, title="Legacy Item")
    await _map_type(stats_db_session, double.id, gear.id)
    await _map_type(stats_db_session, single.id, legacy.id)
    await _complete(stats_db_session, test_user.id, double.id)
    await stats_db_session.commit()

    data = await _get_stats(user_client)
    # NULL category_group coalesces into collectibles; fixed display order
    # (collectibles before upgrades); quantity-weighted completion.
    assert data["categories"] == [
        {"category": "collectibles", "completed": 0, "total": 1},
        {"category": "upgrades", "completed": 2, "total": 2},
    ]


# ── Comments ──────────────────────────────────────────────────────────────────

async def test_comments_posted_counts_visible_only(user_client, stats_db_session, test_user):
    await _seed_comment(stats_db_session, test_user.id)
    await _seed_comment(stats_db_session, test_user.id, is_deleted=True)
    await _seed_comment(stats_db_session, test_user.id, is_approved=False)
    await stats_db_session.commit()

    data = await _get_stats(user_client)
    assert data["comments_posted"] == 1


async def test_comments_posted_scoped_to_user(user_client, stats_db_session, second_user):
    await _seed_comment(stats_db_session, second_user.id)
    await stats_db_session.commit()

    data = await _get_stats(user_client)
    assert data["comments_posted"] == 0
