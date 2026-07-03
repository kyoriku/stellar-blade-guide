"""
Tests for the collectibles route endpoints: level-grouped by type, category sub-routes
(upgrades, cosmetics, materials), levels-by-name, and cross-category isolation.

All endpoints are public (no auth). Uses a local fixture chain because Collectible.description
is sqlalchemy.dialects.postgresql.JSONB — SQLiteTypeCompiler has no visit_JSONB handler, so
Base.metadata.create_all fails for that table.

DDL strategy:
  - Level, Location, CollectibleType: created via Base.metadata.create_all (no JSONB columns)
  - Collectible, collectible_type_mappings, collectible_images: created via raw SQL with JSON
    columns. JSONB type processors (inherited from JSON) still handle Python ↔ JSON conversion
    for DML. SQLite ignores FK constraints by default, so creation order doesn't matter.

conftest's autouse patch_redis covers app.core.cache.redis_client — no extra patching needed.
"""

from __future__ import annotations

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.db.database import Base, get_db
from app.middleware.rate_limit import setup_rate_limiter
from app.models.collectibles import (
    Level, Location, CollectibleType, Collectible, CollectibleImage,  # noqa: F401
    collectible_type_mappings,  # noqa: F401 — registers junction table with Base metadata
)
from app.routers.collectibles import (
    collectibles_router, upgrades_router, cosmetics_router,
    materials_router, levels_router,
)

MINIMAL_DESCRIPTION = {"type": "text", "content": "Test description"}


@pytest_asyncio.fixture
async def collectibles_db_engine():
    # Level, Location, CollectibleType have no JSONB — create_all works for these three.
    # Collectible.description is JSONB; create via raw SQL with JSON columns instead.
    # collectible_type_mappings and collectible_images depend on collectibles but SQLite
    # doesn't enforce FK constraints, so creation order is unrestricted.
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(
            Base.metadata.create_all,
            tables=[Level.__table__, Location.__table__, CollectibleType.__table__],
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
        await conn.execute(text("""
            CREATE TABLE collectible_images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                collectible_id INTEGER NOT NULL,
                cloudinary_url VARCHAR(500) NOT NULL,
                alt_text VARCHAR(255) NOT NULL,
                display_order INTEGER NOT NULL
            )
        """))
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def collectibles_db_session(collectibles_db_engine):
    factory = async_sessionmaker(collectibles_db_engine, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest_asyncio.fixture
async def collectibles_client(collectibles_db_session):
    app = FastAPI()
    setup_rate_limiter(app)
    app.include_router(collectibles_router, prefix="/api")
    app.include_router(upgrades_router, prefix="/api")
    app.include_router(cosmetics_router, prefix="/api")
    app.include_router(materials_router, prefix="/api")
    app.include_router(levels_router, prefix="/api")

    async def override_get_db():
        yield collectibles_db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


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
    category_group: str,
    slug: str,
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
    ctype: CollectibleType,
    title: str = "Test Item",
    display_order: int = 1,
) -> Collectible:
    c = Collectible(
        location_id=location_id,
        title=title,
        description=MINIMAL_DESCRIPTION,
        display_order=display_order,
        cycle="Base",
        quantity=1,
    )
    session.add(c)
    await session.flush()  # get c.id before inserting into junction
    # Use raw SQL for the junction insert — c.types.append() triggers a lazy load
    # in the async session (MissingGreenlet), so bypass the ORM relationship entirely.
    await session.execute(
        text("INSERT INTO collectible_type_mappings (collectible_id, type_id) VALUES (:cid, :tid)"),
        {"cid": c.id, "tid": ctype.id},
    )
    await session.commit()
    await session.refresh(c)
    return c


# ── Level-grouped response ────────────────────────────────────────────────────

async def test_get_collectibles_by_type_returns_level_grouped_response(
    collectibles_client, collectibles_db_session
):
    level = await _seed_level(collectibles_db_session)
    loc = await _seed_location(collectibles_db_session, level.id)
    ctype = await _seed_type(collectibles_db_session, "Document", "collectibles", "documents")
    await _seed_collectible(collectibles_db_session, loc.id, ctype)

    r = await collectibles_client.get("/api/collectibles/documents")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["level_name"] == "Xion"


async def test_get_collectibles_by_type_level_grouped_shape(
    collectibles_client, collectibles_db_session
):
    level = await _seed_level(collectibles_db_session)
    loc = await _seed_location(collectibles_db_session, level.id)
    ctype = await _seed_type(collectibles_db_session, "Document", "collectibles", "documents")
    await _seed_collectible(collectibles_db_session, loc.id, ctype)

    r = await collectibles_client.get("/api/collectibles/documents")
    assert r.status_code == 200
    level_entry = r.json()[0]

    assert set(level_entry.keys()) == {"level_id", "level_name", "level_order", "type_id", "locations"}

    location_entry = level_entry["locations"][0]
    assert set(location_entry.keys()) == {"location_id", "location_name", "location_order", "collectibles"}

    collectible = location_entry["collectibles"][0]
    assert set(collectible.keys()) == {
        "id", "title", "description", "display_order",
        "cycle", "quantity", "subtype", "types", "images",
    }
    assert collectible["cycle"] == "Base"
    assert collectible["quantity"] == 1
    assert collectible["types"] == ["Document"]
    assert collectible["images"] == []


async def test_get_collectibles_by_type_unknown_type_returns_404(collectibles_client):
    r = await collectibles_client.get("/api/collectibles/no-such-type")
    assert r.status_code == 404


async def test_get_collectibles_by_type_groups_across_multiple_levels(
    collectibles_client, collectibles_db_session
):
    level1 = await _seed_level(collectibles_db_session, "Xion", display_order=1)
    level2 = await _seed_level(collectibles_db_session, "Eidos 7", display_order=2)
    loc1 = await _seed_location(collectibles_db_session, level1.id, "Zone A")
    loc2 = await _seed_location(collectibles_db_session, level2.id, "Zone B")
    ctype = await _seed_type(collectibles_db_session, "Memorystick", "collectibles", "memorysticks")
    await _seed_collectible(collectibles_db_session, loc1.id, ctype, title="Stick 1", display_order=1)
    await _seed_collectible(collectibles_db_session, loc2.id, ctype, title="Stick 2", display_order=2)

    r = await collectibles_client.get("/api/collectibles/memorysticks")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 2
    level_names = [entry["level_name"] for entry in data]
    assert "Xion" in level_names
    assert "Eidos 7" in level_names


# ── Collectible item shape ────────────────────────────────────────────────────

async def test_collectible_item_shape_has_expected_fields(
    collectibles_client, collectibles_db_session
):
    level = await _seed_level(collectibles_db_session)
    loc = await _seed_location(collectibles_db_session, level.id)
    ctype = await _seed_type(collectibles_db_session, "Passcode", "collectibles", "passcodes")
    await _seed_collectible(collectibles_db_session, loc.id, ctype, title="Code 001")

    r = await collectibles_client.get("/api/collectibles/passcodes")
    assert r.status_code == 200
    collectible = r.json()[0]["locations"][0]["collectibles"][0]

    assert collectible["title"] == "Code 001"
    assert collectible["description"] == MINIMAL_DESCRIPTION
    assert collectible["cycle"] == "Base"
    assert collectible["quantity"] == 1
    assert collectible["subtype"] is None
    assert isinstance(collectible["types"], list)
    assert isinstance(collectible["images"], list)


# ── Category sub-route happy paths ───────────────────────────────────────────

async def test_get_upgrades_by_type_returns_results(
    collectibles_client, collectibles_db_session
):
    level = await _seed_level(collectibles_db_session)
    loc = await _seed_location(collectibles_db_session, level.id)
    ctype = await _seed_type(collectibles_db_session, "Beta Core", "upgrades", "beta-cores")
    await _seed_collectible(collectibles_db_session, loc.id, ctype)

    r = await collectibles_client.get("/api/upgrades/beta-cores")
    assert r.status_code == 200
    assert len(r.json()) == 1


async def test_get_cosmetics_by_type_returns_results(
    collectibles_client, collectibles_db_session
):
    level = await _seed_level(collectibles_db_session)
    loc = await _seed_location(collectibles_db_session, level.id)
    ctype = await _seed_type(collectibles_db_session, "Hairstyle", "cosmetics", "hairstyles")
    await _seed_collectible(collectibles_db_session, loc.id, ctype)

    r = await collectibles_client.get("/api/cosmetics/hairstyles")
    assert r.status_code == 200
    assert len(r.json()) == 1


async def test_get_materials_by_type_returns_results(
    collectibles_client, collectibles_db_session
):
    level = await _seed_level(collectibles_db_session)
    loc = await _seed_location(collectibles_db_session, level.id)
    ctype = await _seed_type(collectibles_db_session, "Can", "materials", "cans")
    await _seed_collectible(collectibles_db_session, loc.id, ctype)

    r = await collectibles_client.get("/api/materials/cans")
    assert r.status_code == 200
    assert len(r.json()) == 1


# ── Cross-category isolation ──────────────────────────────────────────────────

async def test_cross_category_collectibles_type_not_accessible_as_upgrades(
    collectibles_client, collectibles_db_session
):
    level = await _seed_level(collectibles_db_session)
    loc = await _seed_location(collectibles_db_session, level.id)
    ctype = await _seed_type(collectibles_db_session, "Document", "collectibles", "documents")
    await _seed_collectible(collectibles_db_session, loc.id, ctype)

    # Reachable via the correct category
    r_ok = await collectibles_client.get("/api/collectibles/documents")
    assert r_ok.status_code == 200

    # Category filter must be enforced — 'collectibles' type is invisible to upgrades router
    r_bad = await collectibles_client.get("/api/upgrades/documents")
    assert r_bad.status_code == 404


# ── _normalize_slug integration via HTTP ─────────────────────────────────────

async def test_normalize_slug_pluralized_url_resolves_to_type(
    collectibles_client, collectibles_db_session
):
    level = await _seed_level(collectibles_db_session)
    loc = await _seed_location(collectibles_db_session, level.id)
    # DB name is "Nano Suit"; plural URL slug "nano-suits" must resolve via _normalize_slug
    ctype = await _seed_type(collectibles_db_session, "Nano Suit", "collectibles", "nano-suits")
    await _seed_collectible(collectibles_db_session, loc.id, ctype)

    r = await collectibles_client.get("/api/collectibles/nano-suits")
    assert r.status_code == 200
    collectible = r.json()[0]["locations"][0]["collectibles"][0]
    assert collectible["types"] == ["Nano Suit"]


# ── GET /api/levels/{level_name} with collectibles ───────────────────────────

async def test_get_level_collectibles_returns_flat_location_grouped_response(
    collectibles_client, collectibles_db_session
):
    level = await _seed_level(collectibles_db_session, "Xion")
    loc = await _seed_location(collectibles_db_session, level.id, "Silent Street")
    ctype = await _seed_type(collectibles_db_session, "Camp", "collectibles", "camps")
    await _seed_collectible(collectibles_db_session, loc.id, ctype, title="Camp Alpha")

    r = await collectibles_client.get("/api/levels/Xion")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    entry = data[0]

    # Flat shape: one dict per location, level_id present but no nested level list
    assert set(entry.keys()) == {"level_id", "location_id", "location_name", "location_order", "collectibles"}
    assert entry["location_name"] == "Silent Street"
    assert len(entry["collectibles"]) == 1
    assert entry["collectibles"][0]["title"] == "Camp Alpha"
