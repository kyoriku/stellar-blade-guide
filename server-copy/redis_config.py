import redis
import os
from dotenv import load_dotenv
import json
from typing import Optional, Any

load_dotenv()

# Redis connection
REDIS_URL = os.getenv('REDIS_URL')

redis_client = redis.from_url(
    REDIS_URL,
    decode_responses=True
)

def get_cache(key: str) -> Optional[Any]:
    """Get cached data from Redis"""
    try:
        cached_data = redis_client.get(key)
        if cached_data:
            return json.loads(cached_data)
        return None
    except Exception as e:
        print(f"Cache get error: {e}")
        return None

def set_cache(key: str, value: Any, expire: int = 300) -> bool:
    """Set cache in Redis with expiration time in seconds (default 5 minutes)"""
    try:
        redis_client.setex(key, expire, json.dumps(value))
        return True
    except Exception as e:
        print(f"Cache set error: {e}")
        return False

def delete_cache(pattern: str) -> int:
    """Delete all cache keys matching a pattern"""
    try:
        keys = redis_client.keys(pattern)
        if keys:
            return redis_client.delete(*keys)
        return 0
    except Exception as e:
        print(f"Cache delete error: {e}")
        return 0

def clear_all_cache():
    """Clear all cache (use with caution)"""
    try:
        redis_client.flushdb()
        return True
    except Exception as e:
        print(f"Cache clear error: {e}")
        return False