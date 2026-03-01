import sys
from pathlib import Path
import json
import glob
import asyncio

from sqlalchemy import select, delete, text
from sqlalchemy.orm import selectinload

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from db.database import get_db, AsyncSessionLocal
from models.collectibles import Level, Location, CollectibleType, Collectible, CollectibleImage
from core.cache import invalidate_cache_pattern


def load_all_seed_files():
    """Load all seed data from JSON files"""
    seed_dir = project_root / 'seed-data' / 'collectibles'
    if not seed_dir.exists():
        print("\033[31m✗ seed-data directory not found!\033[0m")
        return []

    all_data = []
    json_files = sorted(glob.glob(str(seed_dir / '*' / '*.json')))
    
    print(f"\033[96m━━━ STEP 1: Loading Data ━━━\033[0m")
    print(f"Found {len(json_files)} JSON files\n")

    for json_file in json_files:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            all_data.extend(data)
            rel_path = Path(json_file).relative_to(seed_dir)
            print(f"   {rel_path}: {len(data)} items")
    
    return all_data


async def reset_collectibles_sequence(db):
    """Reset collectibles sequence to match max ID"""
    print("\n\033[96m━━━ STEP 5: Resetting Collectibles Sequence ━━━\033[0m")
    
    result = await db.execute(text("SELECT MAX(id) FROM collectibles"))
    max_id = result.scalar() or 0
    
    if max_id > 0:
        await db.execute(
            text(f"SELECT setval(pg_get_serial_sequence('collectibles', 'id'), {max_id}, true)")
        )
        print(f"  ✓ Collectibles sequence reset to {max_id}")
    else:
        await db.execute(
            text("SELECT setval(pg_get_serial_sequence('collectibles', 'id'), 1, false)")
        )
        print(f"  ✓ Collectibles sequence reset to 1 (table is empty)")
    
    print()


async def seed_database():
    # STEP 1: Load seed data
    seed_data = load_all_seed_files()
    if not seed_data:
        print("\033[31m✗ No seed data found!\033[0m")
        return

    added = 0
    updated = 0
    deleted = 0
    errors = 0

    async with AsyncSessionLocal() as db:
        try:
            # STEP 2: Truncate images and reset identity to 1
            print(f"\n\033[96m━━━ STEP 2: Resetting Image IDs ━━━\033[0m")
            await db.execute(text("TRUNCATE TABLE collectible_images RESTART IDENTITY"))
            await db.commit()
            print(f"  ✓ Image IDs reset to 1")

            # STEP 3: Seed collectibles
            print(f"\n\033[96m━━━ STEP 3: Seeding {len(seed_data)} Collectibles ━━━\033[0m\n")
            
            # Pre-cache all lookups
            print("Loading reference data...")
            
            levels = {
                l.name: l for l in (await db.execute(select(Level))).scalars()
            }
            print(f"  Cached {len(levels)} levels")
            
            types = {
                t.name: t for t in (await db.execute(select(CollectibleType))).scalars()
            }
            print(f"  Cached {len(types)} types")
            
            locations = {
                (loc.level_id, loc.name): loc 
                for loc in (await db.execute(select(Location))).scalars()
            }
            print(f"  Cached {len(locations)} locations")
            
            existing_collectibles = {
                c.id: c for c in (
                    await db.execute(
                        select(Collectible).options(selectinload(Collectible.types))
                    )
                ).scalars()
            }
            print(f"  Cached {len(existing_collectibles)} existing collectibles\n")

            # Track which IDs are in the seed data
            seed_ids = set()

            batch_size = 50
            batch_count = 0

            for item in seed_data:
                try:
                    collectible_id = item.get("id")
                    seed_ids.add(collectible_id)
                    
                    # Get level from cache
                    level = levels.get(item['level'])
                    if not level:
                        print(f"\033[31m✗ Level not found: {item['level']}\033[0m")
                        errors += 1
                        continue

                    # Get or create location from cache
                    location_key = (level.id, item['location'])
                    location = locations.get(location_key)

                    if not location:
                        location = Location(
                            name=item['location'],
                            level_id=level.id,
                            display_order=item.get('display_order', 0)
                        )
                        db.add(location)
                        await db.flush()
                        locations[location_key] = location

                    # Handle types from cache
                    type_names = item.get('types') or item.get('type')
                    if not type_names:
                        print(f"\033[31m✗ No type(s) specified for: {item.get('title', 'Unknown')}\033[0m")
                        errors += 1
                        continue
                    if not isinstance(type_names, list):
                        type_names = [type_names]

                    collectible_types = []
                    for t in type_names:
                        ctype = types.get(t)
                        if ctype:
                            collectible_types.append(ctype)
                        else:
                            print(f"\033[31m✗ Type not found: {t}\033[0m")
                            errors += 1

                    if not collectible_types:
                        errors += 1
                        continue

                    # Prepare description
                    desc = item['description']
                    if isinstance(desc, dict):
                        description_json = desc
                    elif isinstance(desc, list):
                        description_json = {"type": "list", "items": desc}
                    else:
                        description_json = {"type": "text", "content": desc}

                    # Check cache for existing collectible
                    existing = existing_collectibles.get(collectible_id)

                    if existing:
                        existing.title = item["title"]
                        existing.description = description_json
                        existing.location_id = location.id
                        existing.display_order = item.get("display_order", 0)
                        existing.types = collectible_types
                        collectible_instance = existing
                        updated += 1
                    else:
                        new_collectible = Collectible(
                            id=collectible_id,
                            title=item["title"],
                            description=description_json,
                            location_id=location.id,
                            display_order=item.get("display_order", 0),
                            types=collectible_types
                        )
                        db.add(new_collectible)
                        collectible_instance = new_collectible
                        existing_collectibles[collectible_id] = new_collectible
                        added += 1

                    # Re-add images (table was truncated at start so no need to delete first)
                    for img in item.get('images', []):
                        if not img.get('url'):
                            continue
                        new_image = CollectibleImage(
                            collectible_id=collectible_instance.id,
                            cloudinary_url=img['url'],
                            alt_text=img['alt'],
                            display_order=img['order']
                        )
                        db.add(new_image)

                    batch_count += 1
                    if batch_count >= batch_size:
                        await db.commit()
                        batch_count = 0
                        print(f"  ✓ Committed batch ({added + updated} processed)")

                except Exception as e:
                    print(f"\033[31m✗ Error with '{item.get('title', 'Unknown')}': {e}\033[0m")
                    import traceback
                    traceback.print_exc()
                    await db.rollback()
                    batch_count = 0
                    errors += 1

            # Commit any remaining
            if batch_count > 0:
                await db.commit()
                print(f"  ✓ Committed final batch")

            # STEP 4: Delete collectibles not in seed data
            print(f"\n\033[96m━━━ STEP 4: Cleaning Up Orphaned Collectibles ━━━\033[0m")
            
            orphaned_ids = set(existing_collectibles.keys()) - seed_ids
            
            if orphaned_ids:
                print(f"  Found {len(orphaned_ids)} collectibles not in seed data")
                
                result = await db.execute(
                    delete(Collectible).where(Collectible.id.in_(orphaned_ids))
                )
                deleted = result.rowcount
                
                await db.commit()
                print(f"  \033[33m✓ Deleted {deleted} orphaned collectibles\033[0m")
                
                for orphan_id in sorted(orphaned_ids):
                    orphan = existing_collectibles[orphan_id]
                    print(f"    - ID {orphan_id}: {orphan.title}")
            else:
                print(f"  ✓ No orphaned collectibles found")

            # STEP 5: Reset collectibles sequence to match max ID
            await reset_collectibles_sequence(db)

        except Exception as e:
            print(f"\033[31m✗ Fatal error: {e}\033[0m")
            import traceback
            traceback.print_exc()
            await db.rollback()
            return

    # STEP 6: Clear Redis cache
    print(f"\n\033[96m━━━ STEP 6: Clearing Cache ━━━\033[0m")
    try:
        await invalidate_cache_pattern("*")
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
    asyncio.run(seed_database())