"""
Tests for GET /api/levels/.

All fixtures come from conftest.py. This is the baseline file that established
the SQLite-in-memory + fakeredis pattern used across the test suite.
"""

import json
import pytest
from app.models.collectibles import Level


async def test_get_all_levels_empty(client):
    """GET /api/levels/ returns 200 with an empty list when no levels exist."""
    response = await client.get("/api/levels/")
    assert response.status_code == 200
    assert response.json() == []


async def test_get_all_levels_with_data(client, db_session):
    """GET /api/levels/ returns all levels ordered by display_order."""
    db_session.add_all([
        Level(id=1, name="Xion", display_order=2),
        Level(id=2, name="Eidos 7", display_order=1),
    ])
    await db_session.commit()

    response = await client.get("/api/levels/")
    assert response.status_code == 200

    data = response.json()
    assert len(data) == 2
    assert data[0] == {"id": 2, "name": "Eidos 7", "display_order": 1}
    assert data[1] == {"id": 1, "name": "Xion", "display_order": 2}


async def test_response_shape(client, db_session):
    """Each item has exactly the fields defined by LevelResponse."""
    db_session.add(Level(id=1, name="Eidos 7", display_order=1))
    await db_session.commit()

    response = await client.get("/api/levels/")
    item = response.json()[0]

    assert set(item.keys()) == {"id", "name", "display_order"}
    assert isinstance(item["id"], int)
    assert isinstance(item["name"], str)
    assert isinstance(item["display_order"], int)


async def test_cache_miss_populates_cache(client, db_session, fake_redis):
    """On a cache miss the route queries the DB and writes the result to Redis."""
    db_session.add(Level(id=1, name="Eidos 7", display_order=1))
    await db_session.commit()

    assert await fake_redis.get("levels:all") is None

    response = await client.get("/api/levels/")
    assert response.status_code == 200

    cached = json.loads(await fake_redis.get("levels:all"))
    assert cached == response.json()


async def test_cache_hit_skips_db(client, fake_redis):
    """On a cache hit the route returns cached data without touching the DB."""
    cached_data = [{"id": 99, "name": "Cached Level", "display_order": 1}]
    await fake_redis.set("levels:all", json.dumps(cached_data))

    # DB is empty — if the route hits the DB it would return []
    response = await client.get("/api/levels/")
    assert response.status_code == 200
    assert response.json() == cached_data
