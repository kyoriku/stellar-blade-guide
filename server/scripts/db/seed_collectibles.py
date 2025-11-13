import sys
from pathlib import Path
import json
import glob
import asyncio

from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from db.database import get_db
from models.collectibles import Level, Location, CollectibleType, Collectible, CollectibleImage
from core.cache import invalidate_cache_pattern


def load_all_seed_files():
    seed_dir = project_root / 'seed-data'
    if not seed_dir.exists():
        print("\033[31m✗ seed-data directory not found!\033[0m")
        return []

    all_data = []
    json_files = sorted(glob.glob(str(seed_dir / '*' / '*.json')))
    print(f"Found {len(json_files)} JSON files\n")

    for json_file in json_files:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            all_data.extend(data)
            rel_path = Path(json_file).relative_to(seed_dir)
            print(f"   {rel_path}: {len(data)} items")
    return all_data


async def seed_database():
    seed_data = load_all_seed_files()
    if not seed_data:
        print("\033[31m✗ No seed data found!\033[0m")
        return

    print(f"\nSeeding {len(seed_data)} collectibles...\n")
    added = 0
    updated = 0
    errors = 0

    async for db in get_db():  # async generator returning AsyncSession
        for item in seed_data:
            try:
                # Get level
                result = await db.execute(select(Level).where(Level.name == item['level']))
                level = result.scalar_one_or_none()
                if not level:
                    print(f"\033[31m✗ Level not found: {item['level']}\033[0m")
                    errors += 1
                    continue

                # Get or create location
                result = await db.execute(
                    select(Location).where(
                        (Location.name == item['location']) & (Location.level_id == level.id)
                    )
                )
                location = result.scalar_one_or_none()

                if not location:
                    location = Location(
                        name=item['location'],
                        level_id=level.id,
                        display_order=item.get('display_order', 0)
                    )
                    db.add(location)
                    await db.flush()

                # Handle types
                type_names = item.get('types') or item.get('type')
                if not type_names:
                    print(f"\033[31m✗ No type(s) specified for: {item.get('title', 'Unknown')}\033[0m")
                    errors += 1
                    continue
                if not isinstance(type_names, list):
                    type_names = [type_names]

                collectible_types = []
                for t in type_names:
                    result = await db.execute(select(CollectibleType).where(CollectibleType.name == t))
                    ctype = result.scalar_one_or_none()
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

                # Fetch existing collectible with eager-loaded types
                collectible_id = item.get("id")
                existing = None
                if collectible_id:
                    result = await db.execute(
                        select(Collectible)
                        .options(selectinload(Collectible.types))
                        .where(Collectible.id == collectible_id)
                    )
                    existing = result.scalar_one_or_none()

                # Prepare collectible object
                collectible_obj = Collectible(
                    id=collectible_id,
                    location_id=location.id,
                    title=item["title"],
                    description=description_json,
                    display_order=item.get("display_order", 0),
                )

                # merged = await db.merge(collectible_obj)
                # await db.flush()

                # if existing:
                #     updated += 1
                #     merged.types.clear()  # safe now due to eager load
                # else:
                #     added += 1

                # merged.types.extend(collectible_types)
                existing = await db.scalar(
                    select(Collectible).where(Collectible.id == collectible_id)
                )

                if existing:
                    existing.title = item["title"]
                    existing.description = description_json
                    existing.location_id = location.id
                    existing.display_order = item.get("display_order", 0)
                    existing.types = collectible_types
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
                    added += 1


                # Clear images
                # await db.execute(delete(CollectibleImage).where(CollectibleImage.collectible_id == merged.id))
                # for img in item.get('images', []):
                #     if not img.get('url'):
                #         continue
                #     new_image = CollectibleImage(
                #         collectible_id=merged.id,
                #         cloudinary_url=img['url'],
                #         alt_text=img['alt'],
                #         display_order=img['order']
                #     )
                #     db.add(new_image)

                # await db.commit()
                # Determine which collectible instance we're working with
                collectible_instance = existing if existing else new_collectible

                # Clear images
                await db.execute(
                    delete(CollectibleImage).where(CollectibleImage.collectible_id == collectible_instance.id)
                )

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

                await db.commit()


            except Exception as e:
                print(f"\033[31m✗ Error with '{item.get('title', 'Unknown')}': {e}\033[0m")
                import traceback
                traceback.print_exc()
                await db.rollback()
                errors += 1

    # Clear Redis cache
    print("\nClearing Redis cache...")
    try:
        await invalidate_cache_pattern("*")
        print("\033[32m✓ Redis cache cleared successfully\033[0m")
    except Exception as e:
        print(f"\033[31m✗ Failed to clear Redis cache: {e}\033[0m")

    print(f"\n\033[32m✓ Seeding complete\033[0m")
    print(f"\033[32m✓ Added: {added}\033[0m")
    print(f"\033[32m✓ Updated: {updated}\033[0m")
    print(f"\033[31m✗ Errors: {errors}\033[0m" if errors else f"\033[32m✓ Errors: {errors}\033[0m")


if __name__ == "__main__":
    asyncio.run(seed_database())
