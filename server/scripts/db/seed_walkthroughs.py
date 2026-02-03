import sys
from pathlib import Path
import json
import glob
import asyncio

from sqlalchemy import select, delete

# Add project root
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from db.database import get_db
from models.walkthroughs import Walkthrough
from core.cache import invalidate_cache_pattern


def load_all_walkthrough_files():
    """Load all walkthrough JSON files from seed-data/walkthroughs/"""
    seed_dir = project_root / 'seed-data' / 'walkthroughs'
    if not seed_dir.exists():
        print("\033[31m✗ seed-data/walkthroughs directory not found!\033[0m")
        return []

    all_data = []
    json_files = sorted(glob.glob(str(seed_dir / '*' / '*.json')))
    
    print(f"\033[96m━━━ STEP 1: Loading Data ━━━\033[0m")
    print(f"Found {len(json_files)} walkthrough files\n")

    for json_file in json_files:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            all_data.append(data)
            rel_path = Path(json_file).relative_to(seed_dir)
            print(f"   {rel_path}: {data['title']}")
    
    return all_data


async def seed_walkthroughs():
    print("\n\033[96mSeeding walkthroughs...\033[0m\n")
    
    walkthrough_data = load_all_walkthrough_files()
    if not walkthrough_data:
        print("\033[31m✗ No walkthrough data found!\033[0m")
        return

    print(f"\n\033[96m━━━ STEP 2: Seeding {len(walkthrough_data)} Walkthroughs ━━━\033[0m\n")
    added = 0
    updated = 0
    deleted = 0
    errors = 0

    # Track which IDs are in the seed data
    seed_ids = set()

    async for db in get_db():
        # Get all existing walkthroughs
        result = await db.execute(select(Walkthrough))
        existing_walkthroughs = {w.id: w for w in result.scalars().all()}
        
        print(f"Found {len(existing_walkthroughs)} existing walkthroughs in database\n")

        for item in walkthrough_data:
            try:
                walkthrough_id = item.get("id")
                seed_ids.add(walkthrough_id)
                
                # Check if walkthrough exists
                existing = existing_walkthroughs.get(walkthrough_id)

                if existing:
                    # Update existing
                    existing.slug = item["slug"]
                    existing.title = item["title"]
                    existing.subtitle = item.get("subtitle")
                    existing.level = item.get("level")
                    existing.mission_type = item["mission_type"]
                    existing.thumbnail_url = item.get("thumbnail_url")
                    existing.objectives = item.get("objectives")
                    existing.content = item["content"]
                    existing.display_order = item["display_order"]
                    updated += 1
                    print(f"\033[33m↻ Updated: {item['title']}\033[0m")
                else:
                    # Add new
                    new_walkthrough = Walkthrough(
                        id=walkthrough_id,
                        slug=item["slug"],
                        title=item["title"],
                        subtitle=item.get("subtitle"),
                        level=item.get("level"),
                        mission_type=item["mission_type"],
                        thumbnail_url=item.get("thumbnail_url"),
                        objectives=item.get("objectives"),
                        content=item["content"],
                        display_order=item["display_order"]
                    )
                    db.add(new_walkthrough)
                    added += 1
                    print(f"\033[32m✓ Added: {item['title']}\033[0m")

                await db.commit()

            except Exception as e:
                print(f"\033[31m✗ Error with '{item.get('title', 'Unknown')}': {e}\033[0m")
                import traceback
                traceback.print_exc()
                await db.rollback()
                errors += 1

        # STEP 3: Delete walkthroughs not in seed data
        print(f"\n\033[96m━━━ STEP 3: Cleaning Up Orphaned Walkthroughs ━━━\033[0m")
        
        orphaned_ids = set(existing_walkthroughs.keys()) - seed_ids
        
        if orphaned_ids:
            print(f"  Found {len(orphaned_ids)} walkthroughs not in seed data")
            
            # Delete orphaned walkthroughs
            result = await db.execute(
                delete(Walkthrough).where(Walkthrough.id.in_(orphaned_ids))
            )
            deleted = result.rowcount
            
            await db.commit()
            print(f"  \033[33m✓ Deleted {deleted} orphaned walkthroughs\033[0m")
            
            # Show which ones were deleted
            for orphan_id in sorted(orphaned_ids):
                orphan = existing_walkthroughs[orphan_id]
                print(f"    - ID {orphan_id}: {orphan.title}")
        else:
            print(f"  ✓ No orphaned walkthroughs found")

    # STEP 4: Clear cache
    print(f"\n\033[96m━━━ STEP 4: Clearing Cache ━━━\033[0m")
    try:
        await invalidate_cache_pattern("walkthrough*")
        print("\033[32m✓ Redis cache cleared\033[0m")
    except Exception as e:
        print(f"\033[31m✗ Failed to clear Redis cache: {e}\033[0m")

    # Final summary
    print(f"\n\033[96m{'━' * 60}\033[0m")
    print(f"\033[92m✓ SEEDING COMPLETE\033[0m")
    print(f"\033[92m  Added: {added}\033[0m")
    print(f"\033[92m  Updated: {updated}\033[0m")
    if deleted > 0:
        print(f"\033[33m  Deleted: {deleted}\033[0m")
    else:
        print(f"\033[92m  Deleted: {deleted}\033[0m")
    if errors:
        print(f"\033[31m  Errors: {errors}\033[0m")
    else:
        print(f"\033[92m  Errors: {errors}\033[0m")
    print(f"\033[96m{'━' * 60}\033[0m")


if __name__ == "__main__":
    asyncio.run(seed_walkthroughs())