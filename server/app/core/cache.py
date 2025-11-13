# # import json
# # import redis
# # from typing import Any, Optional
# # from app.config import settings

# # redis_client = redis.Redis.from_url(
# #     settings.REDIS_URL,
# #     decode_responses=True
# # )

# # def get_cache(key: str) -> Optional[Any]:
# #     try:
# #         data = redis_client.get(key)
# #         if data:
# #             return json.loads(data)
# #         return None
# #     except Exception as e:
# #         print(f"Cache get error: {e}")
# #         return None

# # def set_cache(key: str, value: Any, expire: int = 3600) -> bool:
# #     try:
# #         redis_client.setex(
# #             key,
# #             expire,
# #             json.dumps(value)
# #         )
# #         return True
# #     except Exception as e:
# #         print(f"Cache set error: {e}")
# #         return False

# # def delete_cache(key: str) -> bool:
# #     try:
# #         redis_client.delete(key)
# #         return True
# #     except Exception as e:
# #         print(f"Cache delete error: {e}")
# #         return False

# # def invalidate_cache_pattern(pattern: str) -> int:
# #     try:
# #         keys = redis_client.keys(pattern)
# #         if keys:
# #             return redis_client.delete(*keys)
# #         return 0
# #     except Exception as e:
# #         print(f"Cache invalidation error: {e}")
# #         return 0

# """
# Redis cache utilities with detailed logging.
# """
# import json
# import time
# import logging
# from typing import Optional, Any

# import redis
# from app.config import settings

# logger = logging.getLogger(__name__)

# # Initialize Redis client
# redis_client = redis.Redis.from_url(
#     settings.REDIS_URL,
#     decode_responses=True
# )


# def get_cache(key: str, endpoint: str = None) -> Optional[dict]:
#     """
#     Get data from Redis cache with logging.
    
#     Args:
#         key: Cache key
#         endpoint: Optional endpoint path for logging
        
#     Returns:
#         Cached data if found, None otherwise
#     """
#     start_time = time.time()
    
#     try:
#         data = redis_client.get(key)
#         duration_ms = (time.time() - start_time) * 1000
        
#         if data:
#             endpoint_info = f" | {endpoint}" if endpoint else ""
#             logger.info(f"→ CACHE HIT: {key}{endpoint_info} | {duration_ms:.2f}ms")
#             return json.loads(data)
#         else:
#             endpoint_info = f" | {endpoint}" if endpoint else ""
#             logger.info(f"→ CACHE MISS: {key}{endpoint_info}")
#             return None
            
#     except redis.RedisError as e:
#         logger.error(f"❌ Redis error on GET {key}: {e}")
#         return None


# def set_cache(
#     key: str, 
#     data: Any, 
#     ttl: int = settings.CACHE_TTL_MEDIUM,
#     endpoint: str = None
# ) -> bool:
#     """
#     Set data in Redis cache with logging.
    
#     Args:
#         key: Cache key
#         data: Data to cache (will be JSON serialized)
#         ttl: Time to live in seconds
#         endpoint: Optional endpoint path for logging
        
#     Returns:
#         True if successful, False otherwise
#     """
#     start_time = time.time()
    
#     try:
#         redis_client.setex(
#             key,
#             ttl,
#             json.dumps(data)
#         )
#         duration_ms = (time.time() - start_time) * 1000
#         endpoint_info = f" | {endpoint}" if endpoint else ""
#         logger.info(f"→ CACHE SET: {key}{endpoint_info} | {duration_ms:.2f}ms")
#         return True
        
#     except redis.RedisError as e:
#         logger.error(f"❌ Redis error on SET {key}: {e}")
#         return False


# def delete_cache(key: str, endpoint: str = None) -> bool:
#     """
#     Delete key from Redis cache with logging.
    
#     Args:
#         key: Cache key to delete
#         endpoint: Optional endpoint path for logging
        
#     Returns:
#         True if key existed and was deleted, False otherwise
#     """
#     try:
#         result = redis_client.delete(key)
#         endpoint_info = f" | {endpoint}" if endpoint else ""
        
#         if result:
#             logger.info(f"🗑️  CACHE DELETE: {key}{endpoint_info}")
#         else:
#             logger.warning(f"⚠️  CACHE DELETE MISS: {key}{endpoint_info} (key didn't exist)")
            
#         return bool(result)
        
#     except redis.RedisError as e:
#         logger.error(f"❌ Redis error on DELETE {key}: {e}")
#         return False


# def clear_cache_pattern(pattern: str) -> int:
#     """
#     Clear all cache keys matching a pattern.
    
#     Args:
#         pattern: Redis key pattern (e.g., "collectibles:*")
        
#     Returns:
#         Number of keys deleted
#     """
#     try:
#         keys = redis_client.keys(pattern)
#         if keys:
#             count = redis_client.delete(*keys)
#             logger.info(f"🗑️  CACHE CLEAR: {pattern} | {count} keys deleted")
#             return count
#         else:
#             logger.info(f"🗑️  CACHE CLEAR: {pattern} | 0 keys found")
#             return 0
            
#     except redis.RedisError as e:
#         logger.error(f"❌ Redis error on CLEAR {pattern}: {e}")
#         return 0


# def get_cache_stats() -> dict:
#     """
#     Get cache statistics.
    
#     Returns:
#         Dict with cache stats
#     """
#     try:
#         info = redis_client.info()
#         stats = {
#             "total_keys": redis_client.dbsize(),
#             "used_memory": info.get("used_memory_human", "unknown"),
#             "connected_clients": info.get("connected_clients", 0),
#             "total_commands": info.get("total_commands_processed", 0),
#             "keyspace_hits": info.get("keyspace_hits", 0),
#             "keyspace_misses": info.get("keyspace_misses", 0),
#         }
        
#         # Calculate hit rate
#         hits = stats["keyspace_hits"]
#         misses = stats["keyspace_misses"]
#         total = hits + misses
        
#         if total > 0:
#             stats["hit_rate"] = f"{(hits / total * 100):.2f}%"
#         else:
#             stats["hit_rate"] = "N/A"
            
#         return stats
        
#     except redis.RedisError as e:
#         logger.error(f"❌ Redis error getting stats: {e}")
#         return {}

"""
Redis cache utilities.
"""
import json
import logging
from typing import Optional, Any

import redis
from app.config import settings

logger = logging.getLogger(__name__)

# Initialize Redis client
redis_client = redis.Redis.from_url(
    settings.REDIS_URL,
    decode_responses=True
)


def get_cache(key: str, endpoint: str = None) -> Optional[dict]:
    """
    Get data from Redis cache.
    
    Args:
        key: Cache key
        endpoint: Optional endpoint path (unused, kept for compatibility)
        
    Returns:
        Cached data if found, None otherwise
    """
    try:
        data = redis_client.get(key)
        if data:
            return json.loads(data)
        return None
    except redis.RedisError as e:
        logger.error(f"Redis error on GET {key}: {e}")
        return None


def set_cache(
    key: str, 
    data: Any, 
    ttl: int = settings.CACHE_TTL_MEDIUM,
    endpoint: str = None
) -> bool:
    """
    Set data in Redis cache.
    
    Args:
        key: Cache key
        data: Data to cache (will be JSON serialized)
        ttl: Time to live in seconds
        endpoint: Optional endpoint path (unused, kept for compatibility)
        
    Returns:
        True if successful, False otherwise
    """
    try:
        redis_client.setex(key, ttl, json.dumps(data))
        return True
    except redis.RedisError as e:
        logger.error(f"Redis error on SET {key}: {e}")
        return False


def delete_cache(key: str, endpoint: str = None) -> bool:
    """
    Delete key from Redis cache.
    
    Args:
        key: Cache key to delete
        endpoint: Optional endpoint path (unused, kept for compatibility)
        
    Returns:
        True if key existed and was deleted, False otherwise
    """
    try:
        result = redis_client.delete(key)
        return bool(result)
    except redis.RedisError as e:
        logger.error(f"Redis error on DELETE {key}: {e}")
        return False


def invalidate_cache_pattern(pattern: str) -> int:
    """
    Clear all cache keys matching a pattern.
    
    Args:
        pattern: Redis key pattern (e.g., "collectibles:*")
        
    Returns:
        Number of keys deleted
    """
    try:
        keys = redis_client.keys(pattern)
        if keys:
            count = redis_client.delete(*keys)
            logger.info(f"→ Cleared {count} cache keys matching '{pattern}'")
            return count
        return 0
    except redis.RedisError as e:
        logger.error(f"Redis error on CLEAR {pattern}: {e}")
        return 0


def get_cache_stats() -> dict:
    """
    Get cache statistics.
    
    Returns:
        Dict with cache stats
    """
    try:
        info = redis_client.info()
        stats = {
            "total_keys": redis_client.dbsize(),
            "used_memory": info.get("used_memory_human", "unknown"),
            "connected_clients": info.get("connected_clients", 0),
            "total_commands": info.get("total_commands_processed", 0),
            "keyspace_hits": info.get("keyspace_hits", 0),
            "keyspace_misses": info.get("keyspace_misses", 0),
        }
        
        # Calculate hit rate
        hits = stats["keyspace_hits"]
        misses = stats["keyspace_misses"]
        total = hits + misses
        
        if total > 0:
            stats["hit_rate"] = f"{(hits / total * 100):.2f}%"
        else:
            stats["hit_rate"] = "N/A"
            
        return stats
    except redis.RedisError as e:
        logger.error(f"Redis error getting stats: {e}")
        return {}