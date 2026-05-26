"""
Tests for GET /api/levels/{level_name}/locations.

All fixtures come from conftest.py — the levels router (and therefore this
endpoint) is already mounted there, and Level/Location tables are already
created. No local fixtures are needed.

Cache-key note: the route keys Redis on the raw URL parameter, not the
normalized level name. Requesting "eidos-7" and "Eidos 7" both resolve to
the same DB row but produce distinct cache entries ("locations:level:eidos-7"
and "locations:level:Eidos 7") with identical contents. This is a known
quirk, not a bug — both paths work correctly.
"""

import json
from urllib.parse import quote
import pytest
from models.collectibles import Level, Location


async def test_get_locations_empty(client, db_session):
    """Existing level with no locations returns 200 with an empty list."""
    db_session.add(Level(id=1, name="Xion", display_order=1))
    await db_session.commit()

    response = await client.get("/api/levels/Xion/locations")
    assert response.status_code == 200
    assert response.json() == []


async def test_get_locations_with_data(client, db_session):
    """Returns all locations for the level ordered by display_order ascending."""
    db_session.add(Level(id=1, name="Xion", display_order=1))
    await db_session.flush()
    db_session.add_all([
        Location(id=1, level_id=1, name="Zone B", display_order=2),
        Location(id=2, level_id=1, name="Zone A", display_order=1),
    ])
    await db_session.commit()

    response = await client.get("/api/levels/Xion/locations")
    assert response.status_code == 200

    data = response.json()
    assert len(data) == 2
    assert data[0] == {"id": 2, "name": "Zone A", "display_order": 1}
    assert data[1] == {"id": 1, "name": "Zone B", "display_order": 2}


async def test_get_locations_unknown_level(client):
    """Requesting a level that does not exist returns 404."""
    response = await client.get("/api/levels/Nonexistent/locations")
    assert response.status_code == 404


async def test_get_locations_slug_normalization(client, db_session):
    """Hyphen-separated slug resolves to the matching level via title-case + ILIKE fallback."""
    db_session.add(Level(id=1, name="Eidos 7", display_order=1))
    await db_session.flush()
    db_session.add(Location(id=1, level_id=1, name="Silent Street", display_order=1))
    await db_session.commit()

    # "eidos-7" → replace('-', ' ') → "eidos 7" → .title() → "Eidos 7" → ILIKE match
    response = await client.get("/api/levels/eidos-7/locations")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == "Silent Street"


async def test_get_locations_slug_normalization_edge_cases(client, db_session):
    """Additional slug inputs that exercise the replace+title fallback path."""
    db_session.add(Level(id=1, name="Eidos 7", display_order=1))
    await db_session.flush()
    db_session.add(Location(id=1, level_id=1, name="Silent Street", display_order=1))
    await db_session.commit()

    # "EIDOS-7" → replace('-', ' ') → "EIDOS 7" → .title() → "Eidos 7" → ILIKE match
    response = await client.get("/api/levels/EIDOS-7/locations")
    assert response.status_code == 200
    assert response.json()[0]["name"] == "Silent Street"

    # "eidos 7" → replace is a no-op (no hyphens) → .title() → "Eidos 7" → ILIKE match
    response = await client.get(f"/api/levels/{quote('eidos 7', safe='')}/locations")
    assert response.status_code == 200
    assert response.json()[0]["name"] == "Silent Street"


async def test_get_locations_other_level_isolation(client, db_session):
    """Only locations belonging to the requested level are returned."""
    db_session.add_all([
        Level(id=1, name="Xion", display_order=1),
        Level(id=2, name="Eidos 7", display_order=2),
    ])
    await db_session.flush()
    db_session.add_all([
        Location(id=1, level_id=1, name="Xion Location", display_order=1),
        Location(id=2, level_id=2, name="Eidos Location", display_order=1),
    ])
    await db_session.commit()

    response = await client.get("/api/levels/Xion/locations")
    assert response.status_code == 200

    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Xion Location"


async def test_response_shape(client, db_session):
    """Each location item has exactly the fields defined by LocationResponse."""
    db_session.add(Level(id=1, name="Xion", display_order=1))
    await db_session.flush()
    db_session.add(Location(id=1, level_id=1, name="Zone A", display_order=1))
    await db_session.commit()

    response = await client.get("/api/levels/Xion/locations")
    item = response.json()[0]

    assert set(item.keys()) == {"id", "name", "display_order"}
    assert isinstance(item["id"], int)
    assert isinstance(item["name"], str)
    assert isinstance(item["display_order"], int)


async def test_cache_miss_populates_cache(client, db_session, fake_redis):
    """On a cache miss the route queries the DB and writes the result to Redis."""
    db_session.add(Level(id=1, name="Xion", display_order=1))
    await db_session.flush()
    db_session.add(Location(id=1, level_id=1, name="Zone A", display_order=1))
    await db_session.commit()

    assert await fake_redis.get("locations:level:Xion") is None

    response = await client.get("/api/levels/Xion/locations")
    assert response.status_code == 200

    # Cache key uses the raw URL parameter; the stored dict matches response.json()
    # exactly (all three LocationResponse fields are present, no optional-null mismatch).
    cached = json.loads(await fake_redis.get("locations:level:Xion"))
    assert cached == response.json()


async def test_cache_hit_skips_db(client, fake_redis):
    """On a cache hit the route returns cached data without touching the DB."""
    cached_data = [{"id": 99, "name": "Cached Location", "display_order": 1}]
    await fake_redis.set("locations:level:Xion", json.dumps(cached_data))

    # DB is empty — the route would 404 if it hit the DB.
    response = await client.get("/api/levels/Xion/locations")
    assert response.status_code == 200
    assert response.json() == cached_data
