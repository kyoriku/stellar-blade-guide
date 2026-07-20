"""
Regression guard: the content-cache clears used by the seeding/dev flow must
never delete refresh-token keys.

invalidate_cache_pattern (app/core/cache.py) does redis KEYS(glob) + DELETE, so
its safety depends entirely on the globs callers pass. A caller that ever passed
a glob overlapping `refresh:{uid}:{hash}` would silently log out every user. This
pins that none of the real content globs can match a refresh key.

Uses the autouse fake_redis (conftest patches app.core.cache.redis_client), and
the real _refresh_key so the seeded token has the exact production key shape.
"""

from __future__ import annotations

from app.core.cache import invalidate_cache_pattern
from app.core.auth import _refresh_key

# Every glob the seed/clear flow passes to invalidate_cache_pattern. Keep in
# sync with the sources — a new content namespace added there belongs here:
#   scripts/cache/clear_content_cache.py   (collectibles/cosmetics/upgrades/materials/walkthroughs)
#   scripts/db/seed_collectibles.py        (+ search)
#   scripts/db/seed_walkthroughs.py        (walkthrough*)
CONTENT_PATTERNS = [
    "collectibles:*",
    "cosmetics:*",
    "upgrades:*",
    "materials:*",
    "walkthroughs:*",
    "search:*",
    "walkthrough*",
]


async def test_content_cache_clears_never_match_refresh_tokens(fake_redis):
    # A real refresh-token key (exact prod shape) beside one cached key per
    # content glob that clear is meant to remove.
    refresh_key = _refresh_key(42, "opaque-refresh-token-value")
    await fake_redis.set(refresh_key, "1")

    content_keys = [p.replace("*", "sample") for p in CONTENT_PATTERNS]
    for key in content_keys:
        await fake_redis.set(key, "cached")

    for pattern in CONTENT_PATTERNS:
        await invalidate_cache_pattern(pattern)

    # Every content key is gone; the refresh token survives every clear.
    assert await fake_redis.get(refresh_key) == "1"
    for key in content_keys:
        assert await fake_redis.get(key) is None
