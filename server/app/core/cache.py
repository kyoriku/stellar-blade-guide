import json
import logging
from typing import Optional, Any
import redis.asyncio as redis
from app.config.settings import settings

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


# Redis errors fail open by design: every handler below logs and returns a miss
# so reads fall through to Postgres. Contrast core/auth.py, where Redis errors
# deliberately raise — auth fails closed (503 via error_handler).
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
            logger.error(f"Failed to delete corrupted key '{key}': {e}")
        return None
    except redis.RedisError as e:
        logger.error(f"Redis error on GET {key}: {e}")
        return None

async def set_cache(key: str, data: Any, ttl: int = settings.CACHE_TTL) -> bool:
    try:
        serialized = json.dumps(data)
    except (TypeError, ValueError) as e:
        logger.error(f"Cache serialization error for '{key}': {e}")
        return False
    try:
        await redis_client.setex(key, ttl, serialized)
        return True
    except redis.RedisError as e:
        logger.error(f"Redis error on SET {key}: {e}")
        return False

async def delete_cache(key: str) -> bool:
    try:
        result = await redis_client.delete(key)
        return bool(result)
    except redis.RedisError as e:
        logger.error(f"Redis error on DELETE {key}: {e}")
        return False

async def invalidate_cache_pattern(pattern: str) -> int:
    try:
        keys = await redis_client.keys(pattern)
        if keys:
            count = await redis_client.delete(*keys)
            logger.info(f"→ Cleared {count} cache keys matching '{pattern}'")
            return count
        return 0
    except redis.RedisError as e:
        logger.error(f"Redis error on CLEAR {pattern}: {e}")
        return 0

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
        logger.error(f"Redis error getting stats: {e}")
        return {}