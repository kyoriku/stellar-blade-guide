"""
Regression guard: the content-cache clears used by the seeding/dev flow must
never delete refresh-token keys, nor any other key that isn't content.

invalidate_cache_pattern (app/core/cache.py) does redis SCAN(glob) + DELETE, so
its safety depends entirely on the globs callers pass. A caller that ever passed
a glob overlapping `refresh:{uid}:{hash}` would silently log out every user. This
pins that none of the real content globs can match a refresh key, and that the
manual clear covers everything the seeders clear. It also pins that SCAN deletes
exactly what the KEYS it replaced matched, and that a Redis error raises instead of
reading as "no keys".

Uses the autouse fake_redis (conftest patches app.core.cache.redis_client), and
the real key builders so every seeded key has its exact production shape.
"""

from __future__ import annotations

import pytest
from redis.exceptions import ConnectionError as RedisConnectionError
from redis.exceptions import RedisError

from app.core import cache
from app.core.auth import _family_key, _refresh_key
from app.core.cache import invalidate_cache_pattern, search_cache_key, walkthrough_cache_keys
from app.services.auth import reset_cooldown_key
from app.services.oauth_state import _state_key
from scripts.cache import clear_content_cache

# The manual clear's globs, imported so this can't drift from the script.
CONTENT_PATTERNS = clear_content_cache.CONTENT_PATTERNS
# The globs the seeders pass to invalidate_cache_pattern. Keep in sync with them:
#   scripts/db/seed_collectibles.py        (collectibles/cosmetics/upgrades + search)
#   scripts/db/seed_walkthroughs.py        (walkthrough* + search)
SEED_PATTERNS = ["collectibles:*", "cosmetics:*", "upgrades:*", "search:*", "walkthrough*"]


def _auth_keys() -> list[str]:
    """One key of every kind no content clear may touch."""
    return [
        _refresh_key(42, "opaque-refresh-token-value"),
        _family_key(42, "0" * 32),                 # the session family shares the prefix
        "password_reset:3f2c1a9e-0000-4000-8000-000000000000",
        reset_cooldown_key("player@example.com"),
        _state_key("google", "opaque-state"),
        "LIMITS:LIMITER/203.0.113.7/app.routers.search.search/30/1/minute",
    ]


def _content_keys() -> list[str]:
    """One key of every content shape, current and left over from older images."""
    detail, miss = walkthrough_cache_keys("side-quest", "lost-ark")
    return [
        "collectibles:level:eidos-7", "collectibles:type:documents", "cosmetics:nano-suits", "upgrades:beta-cores",
        "walkthroughs:all", "walkthroughs:type:side-quest", detail, miss,
        search_cache_key("nano", 20), "search:nano:20:v2", "search:nano:20",
    ]


async def test_content_cache_clears_never_match_refresh_tokens(fake_redis):
    # A real refresh-token key (exact prod shape) beside one cached key per
    # content glob that clear is meant to remove.
    refresh_key = _refresh_key(42, "opaque-refresh-token-value")
    await fake_redis.set(refresh_key, "1")
    # The session family shares the prefix; losing it ends the session.
    family_key = _family_key(42, "0" * 32)
    await fake_redis.set(family_key, "1")

    patterns = sorted(set(CONTENT_PATTERNS) | set(SEED_PATTERNS))
    content_keys = [p.replace("*", "sample") for p in patterns]
    for key in content_keys:
        await fake_redis.set(key, "cached")

    for pattern in patterns:
        await invalidate_cache_pattern(pattern)

    # Every content key is gone; the refresh token survives every clear.
    assert await fake_redis.get(refresh_key) == "1"
    assert await fake_redis.get(family_key) == "1"
    for key in content_keys:
        assert await fake_redis.get(key) is None


def test_the_manual_clear_covers_everything_the_seeders_clear():
    # It used to miss walkthrough:* and search:*, so a manual clear left stale detail
    # pages and searches behind.
    assert set(SEED_PATTERNS) <= set(CONTENT_PATTERNS)


async def test_the_manual_clear_removes_every_content_key_and_nothing_else(fake_redis):
    for key in _auth_keys() + _content_keys():
        await fake_redis.set(key, "1")

    assert await clear_content_cache.main() is True

    for key in _content_keys():
        assert await fake_redis.get(key) is None, key
    for key in _auth_keys():
        assert await fake_redis.get(key) == "1", key


async def test_scan_deletes_exactly_what_keys_matched(fake_redis):
    # More keys than one SCAN call looks at, so the cursor has to come round several
    # times, and of shapes that sit right beside the globs.
    keys = _auth_keys() + _content_keys()
    keys += [f"collectibles:type:t{i}" for i in range(3 * cache.SCAN_COUNT)]
    keys += ["walkthrough", "walkthroughs", "xcollectibles:level:a", "search", "searches:x"]
    for key in keys:
        await fake_redis.set(key, "1")

    for pattern in sorted(set(CONTENT_PATTERNS) | set(SEED_PATTERNS)):
        matched = set(await fake_redis.keys(pattern))
        before = set(await fake_redis.keys("*"))
        assert await invalidate_cache_pattern(pattern) == len(matched)
        assert before - set(await fake_redis.keys("*")) == matched, pattern

    for key in _auth_keys() + ["xcollectibles:level:a", "searches:x"]:
        assert await fake_redis.get(key) == "1", key


class _DeadRedis:
    """A client whose connection is gone, the way a dropped tunnel looks to redis-py."""

    async def scan_iter(self, **_):
        raise RedisConnectionError("Error connecting to host.docker.internal:16379.")
        yield  # an async generator, like the real scan_iter

    async def delete(self, *_):
        raise AssertionError("nothing to delete when the scan failed")


async def test_a_redis_error_raises_instead_of_reading_as_no_keys(monkeypatch):
    monkeypatch.setattr(cache, "redis_client", _DeadRedis())
    with pytest.raises(RedisError):
        await invalidate_cache_pattern("collectibles:*")


async def test_the_manual_clear_fails_and_names_the_pattern(monkeypatch, capsys):
    monkeypatch.setattr(cache, "redis_client", _DeadRedis())
    assert await clear_content_cache.main() is False
    assert "✗ Clearing collectibles:* failed: ConnectionError" in capsys.readouterr().out
