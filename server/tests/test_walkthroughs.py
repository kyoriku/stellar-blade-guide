"""
Tests for the walkthroughs read-only endpoints: GET all, GET by type, GET by type+slug.

All endpoints are public (no auth). No moderation. Uses the same SQLite-in-memory
strategy as test_types.py, with a local fixture chain because the Walkthrough table
isn't in conftest's create_all.

Walkthrough.content uses sqlalchemy.dialects.postgresql.JSONB. SQLAlchemy 2.0
maps JSONB to JSON for non-Postgres backends, storing as TEXT in SQLite. Seeds
pass Python lists/dicts; SQLAlchemy serializes/deserializes them automatically.

conftest's autouse patch_redis covers app.core.cache.redis_client, so walkthroughs
caching goes through FakeRedis with no extra patching needed here.

Rate limit testing is intentionally omitted: slowapi's Limiter is created at
module-import time using storage_uri=settings.REDIS_URL, separate from the
app.core.cache.redis_client the autouse patch_redis fixture covers.
"""

from __future__ import annotations

import pytest_asyncio
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.db.database import get_db
from app.middleware.rate_limit import setup_rate_limiter
from app.models.walkthroughs import Walkthrough as WalkthroughModel  # noqa: F401 — needed for ORM inserts/selects
from app.routers.walkthroughs import router as walkthroughs_router

MINIMAL_CONTENT = [{"order": 1, "text": "Test step", "is_boss": False, "images": []}]


@pytest_asyncio.fixture
async def walkthroughs_db_engine():
    # sqlalchemy.dialects.postgresql.JSONB has no SQLiteTypeCompiler visitor, so
    # Base.metadata.create_all fails for this table. Create it manually with JSON
    # columns instead. JSONB's type processors (inherited from JSON) still handle
    # Python ↔ JSON string conversion for DML operations.
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE walkthroughs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug VARCHAR(150) NOT NULL UNIQUE,
                title VARCHAR(255) NOT NULL,
                subtitle VARCHAR(255),
                level VARCHAR(100),
                mission_type VARCHAR(50) NOT NULL,
                objectives JSON,
                content JSON NOT NULL,
                display_order INTEGER NOT NULL,
                thumbnail_url VARCHAR(255),
                rewards JSON,
                available_after VARCHAR(255)
            )
        """))
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def walkthroughs_db_session(walkthroughs_db_engine):
    factory = async_sessionmaker(walkthroughs_db_engine, expire_on_commit=False)
    async with factory() as session:
        yield session


@pytest_asyncio.fixture
async def walkthroughs_client(walkthroughs_db_session):
    app = FastAPI()
    setup_rate_limiter(app)
    app.include_router(walkthroughs_router, prefix="/api")

    async def override_get_db():
        yield walkthroughs_db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


async def _seed_walkthrough(
    session: AsyncSession,
    *,
    slug: str,
    title: str,
    mission_type: str,
    display_order: int = 1,
) -> WalkthroughModel:
    w = WalkthroughModel(
        slug=slug,
        title=title,
        mission_type=mission_type,
        content=MINIMAL_CONTENT,
        display_order=display_order,
    )
    session.add(w)
    await session.commit()
    await session.refresh(w)
    return w


# ── GET all ───────────────────────────────────────────────────────────────────

async def test_get_all_walkthroughs_empty_returns_empty_list(walkthroughs_client):
    r = await walkthroughs_client.get("/api/walkthroughs/")
    assert r.status_code == 200
    assert r.json() == []


async def test_get_all_walkthroughs_with_data_returns_ordered_list(
    walkthroughs_client, walkthroughs_db_session
):
    await _seed_walkthrough(walkthroughs_db_session, slug="first", title="First", mission_type="main-story", display_order=2)
    await _seed_walkthrough(walkthroughs_db_session, slug="second", title="Second", mission_type="side-quest", display_order=1)

    r = await walkthroughs_client.get("/api/walkthroughs/")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 2
    assert data[0]["slug"] == "second"  # display_order=1 comes first
    assert data[1]["slug"] == "first"


async def test_get_all_walkthroughs_list_item_shape(walkthroughs_client, walkthroughs_db_session):
    await _seed_walkthrough(walkthroughs_db_session, slug="shape-test", title="Shape Test", mission_type="main-story")

    r = await walkthroughs_client.get("/api/walkthroughs/")
    assert r.status_code == 200
    item = r.json()[0]

    expected_keys = {"id", "slug", "title", "subtitle", "level", "mission_type", "display_order", "thumbnail_url", "available_after"}
    assert set(item.keys()) == expected_keys
    # content, objectives, rewards must NOT appear in list response
    assert "content" not in item
    assert "objectives" not in item
    assert "rewards" not in item


# ── GET by type ───────────────────────────────────────────────────────────────

async def test_get_walkthroughs_by_type_returns_matching_only(
    walkthroughs_client, walkthroughs_db_session
):
    await _seed_walkthrough(walkthroughs_db_session, slug="main-one", title="Main One", mission_type="main-story", display_order=1)
    await _seed_walkthrough(walkthroughs_db_session, slug="side-one", title="Side One", mission_type="side-quest", display_order=2)

    r = await walkthroughs_client.get("/api/walkthroughs/main-story")
    assert r.status_code == 200
    data = r.json()
    assert len(data) == 1
    assert data[0]["slug"] == "main-one"
    assert data[0]["mission_type"] == "main-story"


async def test_get_walkthroughs_by_type_unknown_returns_404(walkthroughs_client):
    r = await walkthroughs_client.get("/api/walkthroughs/unknown-type")
    assert r.status_code == 404


# ── GET detail ────────────────────────────────────────────────────────────────

async def test_get_walkthrough_detail_returns_full_shape(walkthroughs_client, walkthroughs_db_session):
    await _seed_walkthrough(walkthroughs_db_session, slug="detail-slug", title="Detail Test", mission_type="main-story")

    r = await walkthroughs_client.get("/api/walkthroughs/main-story/detail-slug")
    assert r.status_code == 200
    data = r.json()
    assert data["slug"] == "detail-slug"
    assert data["title"] == "Detail Test"
    assert data["mission_type"] == "main-story"
    # Detail-only fields present
    assert "content" in data
    assert "objectives" in data
    assert "rewards" in data
    assert isinstance(data["content"], list)
    assert len(data["content"]) == 1


async def test_get_walkthrough_detail_unknown_slug_returns_404(walkthroughs_client, walkthroughs_db_session):
    await _seed_walkthrough(walkthroughs_db_session, slug="real-slug", title="Real", mission_type="main-story")
    r = await walkthroughs_client.get("/api/walkthroughs/main-story/no-such-slug")
    assert r.status_code == 404


async def test_get_walkthrough_detail_wrong_type_returns_404(walkthroughs_client, walkthroughs_db_session):
    await _seed_walkthrough(walkthroughs_db_session, slug="typed-slug", title="Typed", mission_type="main-story")
    # Correct slug, wrong type — type filter must be enforced, not just slug
    r = await walkthroughs_client.get("/api/walkthroughs/side-quest/typed-slug")
    assert r.status_code == 404
    body = r.json()
    # Error response only — no walkthrough data leaked
    assert "detail" in body
    assert "slug" not in body
    assert "content" not in body


# ── LIKE metacharacters in path slugs ────────────────────────────────────────

async def test_get_walkthrough_detail_percent_slugs_return_404(
    walkthroughs_client, walkthroughs_db_session
):
    """`%` in either segment used to reach the ILIKE fallback unescaped: with two
    rows it matched everything and scalar_one_or_none() raised -> 500."""
    await _seed_walkthrough(walkthroughs_db_session, slug="one", title="One", mission_type="main-story", display_order=1)
    await _seed_walkthrough(walkthroughs_db_session, slug="two", title="Two", mission_type="main-story", display_order=2)

    r = await walkthroughs_client.get("/api/walkthroughs/%25/%25")
    assert r.status_code == 404

    r = await walkthroughs_client.get("/api/walkthroughs/main-story/%25")
    assert r.status_code == 404


async def test_get_walkthrough_detail_case_insensitive_fallback_still_resolves(
    walkthroughs_client, walkthroughs_db_session
):
    # The fallback compares the title-cased, space-separated form of each URL
    # segment case-insensitively, so it only ever matches rows stored that way.
    await _seed_walkthrough(walkthroughs_db_session, slug="Detail Slug", title="Detail", mission_type="Main Story")

    r = await walkthroughs_client.get("/api/walkthroughs/main-story/detail-slug")
    assert r.status_code == 200
    assert r.json()["slug"] == "Detail Slug"


# ── Cache keys are exactly as canonical as the lookup behind them ─────────────
#
# Walkthrough resolution is an exact, case-sensitive match on kebab slugs, so the
# keys stay raw: a canonicalised key would serve MAIN-STORY from a warm cache
# while a cold cache 404s it. Bounded anyway, because only the exact spelling
# ever resolves and writes.

async def test_detail_cache_key_only_written_by_the_spelling_that_resolves(
    walkthroughs_client, walkthroughs_db_session, fake_redis
):
    await _seed_walkthrough(walkthroughs_db_session, slug="detail-slug", title="Detail", mission_type="main-story")

    r = await walkthroughs_client.get("/api/walkthroughs/main-story/detail-slug")
    assert r.status_code == 200
    # Warm cache must not change the answer for a spelling the DB rejects.
    r = await walkthroughs_client.get("/api/walkthroughs/MAIN-STORY/DETAIL-SLUG")
    assert r.status_code == 404
    assert await fake_redis.keys("walkthrough:*") == ["walkthrough:main-story:detail-slug"]


async def test_by_type_cache_key_is_raw_and_exact(walkthroughs_client, walkthroughs_db_session, fake_redis):
    await _seed_walkthrough(walkthroughs_db_session, slug="main-one", title="Main One", mission_type="main-story")

    # _normalize_type strips a trailing s, so both spellings resolve; one key.
    for spelling in ("main-story", "main-storys"):
        r = await walkthroughs_client.get(f"/api/walkthroughs/{spelling}")
        assert r.status_code == 200, spelling
    # Case variant: 404 from the DB even with the canonical entry warm, and no write.
    r = await walkthroughs_client.get("/api/walkthroughs/MAIN-STORY")
    assert r.status_code == 404
    assert await fake_redis.keys("walkthroughs:type:*") == ["walkthroughs:type:main-story"]
