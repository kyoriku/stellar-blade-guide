"""
Regression guard: the content-cache clears used by the seeding/dev flow must
never delete refresh-token keys, nor any other key that isn't content.

invalidate_cache_pattern (app/core/cache.py) does redis KEYS(glob) + DELETE, so
its safety depends entirely on the globs callers pass. A caller that ever passed
a glob overlapping `refresh:{uid}:{hash}` would silently log out every user. This
pins that none of the real content globs can match a refresh key, and that the
manual clear covers everything the seeders clear.

Uses the autouse fake_redis (conftest patches app.core.cache.redis_client), and
the real key builders so every seeded key has its exact production shape.
"""

from __future__ import annotations

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

    await clear_content_cache.main()

    for key in _content_keys():
        assert await fake_redis.get(key) is None, key
    for key in _auth_keys():
        assert await fake_redis.get(key) == "1", key
