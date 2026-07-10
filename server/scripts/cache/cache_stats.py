"""
Usage:
  uv run python scripts/cache/cache_stats.py          # dev Redis (REDIS_URL)
  uv run python scripts/cache/cache_stats.py --prod   # prod Redis (PROD_REDIS_URL from server/.env)

Read-only: only INFO and DBSIZE are issued.
"""

import asyncio
import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv

SERVER_DIR = Path(__file__).parent.parent.parent

# --prod must repoint REDIS_URL before the app import below: app.core.cache
# builds its Redis client from settings.REDIS_URL at import time.
if "--prod" in sys.argv:
    load_dotenv(SERVER_DIR / ".env")
    prod_url = os.getenv("PROD_REDIS_URL")
    if not prod_url:
        print("\033[31mPROD_REDIS_URL not set in server/.env\033[0m")
        sys.exit(1)
    os.environ["REDIS_URL"] = prod_url

# try/except import instead of the usual sys.path.insert-then-import: on-save
# import sorters hoist app imports above the path bootstrap and break it.
try:
    from app.core.cache import get_cache_stats
except ModuleNotFoundError:
    sys.path.insert(0, str(SERVER_DIR))
    from app.core.cache import get_cache_stats


def _mask(url):
    return re.sub(r"//([^:/@]+):[^@]*@", r"//\1:*****@", url)


async def main():
    from app.config.settings import settings
    label = "prod" if "--prod" in sys.argv else "dev"
    print(f"\033[96m--- Redis cache stats ({label}: {_mask(settings.REDIS_URL)}) ---\033[0m")
    stats = await get_cache_stats()
    if not stats:
        print("\033[31m[ERROR]\033[0m Redis unreachable (check the URL above)")
        sys.exit(1)
    print(f"  Hit rate:          \033[32m{stats['hit_rate']}\033[0m")
    print(f"  Keyspace hits:     {stats['keyspace_hits']}")
    print(f"  Keyspace misses:   {stats['keyspace_misses']}")
    print(f"  Total keys:        {stats['total_keys']}")
    print(f"  Used memory:       {stats['used_memory']}")
    print(f"  Connected clients: {stats['connected_clients']}")

asyncio.run(main())
