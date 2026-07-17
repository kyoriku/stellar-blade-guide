import sys
import asyncio
from pathlib import Path

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from app.core.cache import invalidate_cache_pattern

CONTENT_PATTERNS = [
    "collectibles:*",
    "cosmetics:*",
    "upgrades:*",
    "materials:*",
    "walkthroughs:*",
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

asyncio.run(main())