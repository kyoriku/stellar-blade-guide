import json
import logging
from typing import Optional, Any
import redis.asyncio as redis
from app.config.settings import settings
from app.core.logging import exc_text

logger = logging.getLogger(__name__)

# Async Redis client
redis_client = redis.Redis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
    socket_timeout=2,
    socket_connect_timeout=2,
    retry_on_timeout=False,
    health_check_interval=30,
)


# ── Key construction ────────────────────────────────────────────────────────
#
# A key that embeds a URL segment must be exactly as canonical as the lookup
# behind it — no less, or every spelling that resolves mints its own long-lived
# payload copy (512 case variants of "documents" alone, in the Redis that also
# holds refresh tokens); no more, or a spelling the DB would 404 gets served from
# a warm cache. Level and type resolution is case-insensitive and treats '-' and
# ' ' alike, so those keys go through cache_slug(). Walkthrough resolution is an
# exact, case-sensitive match on kebab slugs, so those keys stay raw: only the
# exact spelling resolves, which already bounds them to one key per row.

def cache_slug(value: str) -> str:
    """Canonical cache-key form of a case-insensitively resolved URL segment."""
    return value.lower().replace(' ', '-')


def walkthrough_cache_keys(normalized_type: str, slug: str) -> tuple[str, str]:
    """(cache_key, miss_key) for one walkthrough detail page, from the raw segments.

    The API route and the SPA head injection must hit the same entry, so this is
    the only place the key shape lives; neither caller builds it inline.
    """
    return f"walkthrough:{normalized_type}:{slug}", f"walkthrough:miss:{normalized_type}:{slug}"


# Bump whenever the same query's results can change: new keys start empty, so a deploy
# needs no flush, and the old image keeps reading its own keys while it drains. The
# version is a suffix because an unversioned key always ends in its limit's digits and
# a versioned one never does, whatever the query; a prefix would collide (the old key
# for the query "v2:nano" is "search:v2:nano:20").
SEARCH_CACHE_VERSION = 3


def search_cache_key(q: str, limit: int) -> str:
    """The Redis key of one search response, for a normalized query. The router builds
    it only through here."""
    return f"search:{q}:{limit}:v{SEARCH_CACHE_VERSION}"


# Redis errors fail open by design: every handler below logs and returns a miss
# so reads fall through to Postgres. Contrast core/auth.py, where Redis errors
# deliberately raise — auth fails closed (503 via error_handler) — and
# invalidate_cache_pattern at the end of this file, which raises for the scripts.
async def get_cache(key: str) -> Optional[dict]:
    try:
        data = await redis_client.get(key)
        if not data:
            return None
        return json.loads(data)
    except json.JSONDecodeError:
        logger.warning(f"Corrupted cache entry for '{key}' — deleting and treating as miss")
        try:
            await redis_client.delete(key)
        except redis.RedisError as e:
            logger.error(f"Failed to delete corrupted key '{key}': {exc_text(e)}")
        return None
    except redis.RedisError as e:
        logger.error(f"Redis error on GET {key}: {exc_text(e)}")
        return None

async def set_cache(key: str, data: Any, ttl: int = settings.CACHE_TTL) -> bool:
    try:
        serialized = json.dumps(data)
    except (TypeError, ValueError) as e:
        logger.error(f"Cache serialization error for '{key}': {exc_text(e)}")
        return False
    try:
        await redis_client.setex(key, ttl, serialized)
        return True
    except redis.RedisError as e:
        logger.error(f"Redis error on SET {key}: {exc_text(e)}")
        return False

async def delete_cache(key: str) -> bool:
    try:
        result = await redis_client.delete(key)
        return bool(result)
    except redis.RedisError as e:
        logger.error(f"Redis error on DELETE {key}: {exc_text(e)}")
        return False

async def get_cache_stats() -> dict:
    try:
        info = await redis_client.info()
        stats = {
            "total_keys": await redis_client.dbsize(),
            "used_memory": info.get("used_memory_human", "unknown"),
            "connected_clients": info.get("connected_clients", 0),
            "keyspace_hits": info.get("keyspace_hits", 0),
            "keyspace_misses": info.get("keyspace_misses", 0),
        }
        
        hits = stats["keyspace_hits"]
        misses = stats["keyspace_misses"]
        total = hits + misses
        
        stats["hit_rate"] = f"{(hits / total * 100):.2f}%" if total > 0 else "N/A"
        return stats
    except redis.RedisError as e:
        logger.error(f"Redis error getting stats: {exc_text(e)}")
        return {}


# How many keys one SCAN call looks at, and how many keys one DEL takes.
SCAN_COUNT = 500
DELETE_CHUNK = 500


async def invalidate_cache_pattern(pattern: str) -> int:
    """Delete every key matching a glob; return how many were deleted.

    For scripts only: the seeders and scripts/cache/clear_content_cache.py. No request
    handler calls it. Unlike the helpers above it fails closed: a Redis error raises, so a
    seed whose clear failed can't report success while Redis still holds the old payloads.

    SCAN walks the keyspace a few hundred keys per call, each call bounded by the client's
    2 s timeout. KEYS walked all of it in one call, which over a slow link could time out
    and read as "no keys". SCAN takes the same glob and returns every key that exists for
    the whole scan; a key written during it is a refill of data that's already current.
    """
    keys = sorted({key async for key in redis_client.scan_iter(match=pattern, count=SCAN_COUNT)})
    deleted = 0
    for start in range(0, len(keys), DELETE_CHUNK):
        deleted += await redis_client.delete(*keys[start:start + DELETE_CHUNK])
    if deleted:
        logger.info(f"→ Cleared {deleted} cache keys matching '{pattern}'")
    return deleted