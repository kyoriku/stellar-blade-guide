"""
Usage:
  uv run python scripts/cache/cache_stats.py          # dev Redis (REDIS_URL)
  uv run python scripts/cache/cache_stats.py --prod   # prod Redis (PROD_REDIS_URL from server/.env)

Read-only: only INFO and DBSIZE are issued.

--prod first checks that prod Redis answers (scripts/db/check_connections.py, through
the Redis tunnel). Exits 2, with the railway connect line to run, when it doesn't.
"""

import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

SERVER_DIR = Path(__file__).parent.parent.parent
PROD = "--prod" in sys.argv

# try/except import instead of the usual sys.path.insert-then-import: on-save
# import sorters hoist app imports above the path bootstrap and break it.
# check_connections imports nothing that reads REDIS_URL, so it comes before the repoint.
try:
    from scripts.db import check_connections as cc
except ModuleNotFoundError:
    sys.path.insert(0, str(SERVER_DIR))
    from scripts.db import check_connections as cc

# --prod must repoint REDIS_URL before the app import below: app.core.cache
# builds its Redis client from settings.REDIS_URL at import time. The check comes first,
# so a closed tunnel stops here with the line to run.
if PROD:
    load_dotenv(SERVER_DIR / ".env")
    prod_url = os.getenv("PROD_REDIS_URL")
    if not prod_url:
        print("\033[31mPROD_REDIS_URL not set in server/.env\033[0m")
        sys.exit(1)
    os.environ["REDIS_URL"] = prod_url
    cc.require(["Redis"])

# The app import, after the repoint, in the same try/except idiom.
try:
    from app.core.cache import get_cache_stats
except ModuleNotFoundError:
    sys.path.insert(0, str(SERVER_DIR))
    from app.core.cache import get_cache_stats


async def main():
    from app.config.settings import settings
    label = "prod" if PROD else "dev"
    print(f"\033[96m--- Redis cache stats ({label}: {cc.mask('Redis', settings.REDIS_URL)}) ---\033[0m")
    stats = await get_cache_stats()
    if not stats:
        if PROD:
            # get_cache_stats logs the error and returns nothing, so there's no exception here.
            print(cc.lost_message(["Redis"], "the error is above"))
            sys.exit(cc.EXIT_UNREACHABLE)
        print("\033[31m[ERROR]\033[0m Redis unreachable (check the URL above)")
        sys.exit(1)
    print(f"  Hit rate:          \033[32m{stats['hit_rate']}\033[0m")
    print(f"  Keyspace hits:     {stats['keyspace_hits']}")
    print(f"  Keyspace misses:   {stats['keyspace_misses']}")
    print(f"  Total keys:        {stats['total_keys']}")
    print(f"  Used memory:       {stats['used_memory']}")
    print(f"  Connected clients: {stats['connected_clients']}")

asyncio.run(main())
