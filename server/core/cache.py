import json
import logging
from typing import Optional, Any
import redis.asyncio as redis
from config.settings import settings

logger = logging.getLogger(__name__)

# Async Redis client
redis_client = redis.Redis.from_url(
    settings.REDIS_URL,
    decode_responses=True
)

async def get_cache(key: str) -> Optional[dict]:
    try:
        data = await redis_client.get(key)
        return json.loads(data) if data else None
    except redis.RedisError as e:
        logger.error(f"Redis error on GET {key}: {e}")
        return None

async def set_cache(key: str, data: Any, ttl: int = settings.CACHE_TTL_MEDIUM) -> bool:
    try:
        await redis_client.setex(key, ttl, json.dumps(data))
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