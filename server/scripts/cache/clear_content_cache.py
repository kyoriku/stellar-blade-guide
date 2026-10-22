import sys
import asyncio
from pathlib import Path

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from app.core.cache import invalidate_cache_pattern

# Every content namespace: the seeders clear these too (seed_collectibles.py the first
# three and search, seed_walkthroughs.py walkthrough* and search), and
# tests/test_cache_isolation.py checks this list covers theirs and leaves auth keys alone.
CONTENT_PATTERNS = [
    "collectibles:*",
    "cosmetics:*",
    "upgrades:*",
    "walkthrough*",   # walkthroughs:all and walkthroughs:type:*, walkthrough:{type}:{slug}, walkthrough:miss:*
    "search:*",
]

async def main():
    print("\033[96m--- Clearing prod content cache ---\033[0m")
    total = 0
    for pattern in CONTENT_PATTERNS:
        count = await invalidate_cache_pattern(pattern)
        if count:
            print(f"\033[32m[CLEARED]\033[0m {pattern} ({count} keys)")
        else:
            print(f"\033[90m[SKIP]\033[0m {pattern} (no keys)")
        total += count
    print(f"\033[32m[DONE]\033[0m {total} keys cleared")

if __name__ == "__main__":
    asyncio.run(main())
