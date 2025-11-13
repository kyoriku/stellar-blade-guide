"""
Seed database with collectibles data from JSON files.

Usage:
    python scripts/db/seed.py
"""
import sys
import os
from pathlib import Path

# Add project root to path so we can import app modules
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

import json
import glob
from app.core.database import get_db_session
from app.models.collectibles import Level, Location, CollectibleType, Collectible, CollectibleImage
from app.core.cache import invalidate_cache_pattern


def load_all_seed_files():
    """Load all JSON seed files from seed-data directory"""
    seed_dir = project_root / 'seed-data'
    
    if not seed_dir.exists():
        print("\033[31m✗ seed-data directory not found!\033[0m")
        print(f"   Expected: {seed_dir}")
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


def seed_database():
    """Seed the database with collectibles from JSON files"""
    db = get_db_session()
    seed_data = load_all_seed_files()
    
    if not seed_data:
        print("\033[31m✗ No seed data found!\033[0m")
        return
    
    print(f"\nSeeding {len(seed_data)} collectibles...\n")
    
    added = 0
    updated = 0
    errors = 0
    
    for item in seed_data:
        try:
            # Get level
            level = db.query(Level).filter(Level.name == item['level']).first()
            if not level:
                print(f"\033[31m✗ Level not found: {item['level']}\033[0m")
                errors += 1
                continue
            
            # Get or create location
            location = db.query(Location).filter(
                Location.name == item['location'],
                Location.level_id == level.id
            ).first()
            
            if not location:
                location = Location(
                    name=item['location'],
                    level_id=level.id,
                    display_order=item.get('display_order', 0)
                )
                db.add(location)
                db.flush()
            
            # Handle both old format (single type) and new format (multiple types)
            type_names = []
            if 'types' in item:
                types_value = item['types']
                if isinstance(types_value, list):
                    type_names = types_value
                else:
                    type_names = [types_value]
            elif 'type' in item:
                type_value = item['type']
                if isinstance(type_value, list):
                    type_names = type_value
                else:
                    type_names = [type_value]
            else:
                print(f"\033[31m✗ No type(s) specified for: {item.get('title', 'Unknown')}\033[0m")
                errors += 1
                continue
            
            # Flatten if nested lists
            flattened_types = []
            for t in type_names:
                if isinstance(t, list):
                    flattened_types.extend(t)
                else:
                    flattened_types.append(t)
            type_names = flattened_types
            
            # Fetch type objects
            collectible_types = []
            for type_name in type_names:
                if not isinstance(type_name, str):
                    print(f"\033[31m✗ Invalid type name (not a string): {type_name} for '{item.get('title', 'Unknown')}'\033[0m")
                    continue
                    
                collectible_type = db.query(CollectibleType).filter(
                    CollectibleType.name == type_name
                ).first()
                
                if not collectible_type:
                    print(f"\033[31m✗ Type not found: {type_name}\033[0m")
                    errors += 1
                    continue
                collectible_types.append(collectible_type)
            
            if not collectible_types:
                print(f"\033[31m✗ No valid types found for: {item.get('title', 'Unknown')}'\033[0m")
                errors += 1
                continue
            
            # Prepare description as JSONB
            desc = item['description']
            if isinstance(desc, dict):
                description_json = desc
            elif isinstance(desc, list):
                description_json = {"type": "list", "items": desc}
            else:
                description_json = {"type": "text", "content": desc}
            
            # Check if collectible exists
            existing = db.query(Collectible).filter(
                Collectible.id == item.get("id")
            ).first() if item.get("id") else None

            collectible_obj = Collectible(
                id=item.get("id"),
                location_id=location.id,
                title=item["title"],
                description=description_json,
                display_order=item["display_order"],
            )

            # merge() updates if exists, inserts if not
            merged = db.merge(collectible_obj)
            db.flush()
            collectible_id = merged.id

            if existing:
                updated += 1
                merged.types.clear()
            else:
                added += 1

            merged.types.extend(collectible_types)

            # Clear and re-insert images
            db.query(CollectibleImage).filter(
                CollectibleImage.collectible_id == collectible_id
            ).delete()

            inserted_images = set()
            for img in item.get('images', []):
                if not img.get('url'):
                    print(f"   \033[31m✗ Skipping image with null URL for '{item['title']}'\033[0m")
                    continue
                
                img_key = (img['url'], img['order'])
                if img_key not in inserted_images:
                    new_image = CollectibleImage(
                        collectible_id=collectible_id,
                        cloudinary_url=img['url'],
                        alt_text=img['alt'],
                        display_order=img['order']
                    )
                    db.add(new_image)
                    inserted_images.add(img_key)
            
            db.commit()
            
        except Exception as e:
            print(f"\033[31m✗ Error with '{item.get('title', 'Unknown')}': {e}\033[0m")
            import traceback
            traceback.print_exc()
            db.rollback()
            errors += 1
    
    db.close()
    
    # Clear Redis cache
    print("\nClearing Redis cache...")
    try:
        invalidate_cache_pattern("*")
        print("\033[32m✓ Redis cache cleared successfully\033[0m")
    except Exception as e:
        print(f"\033[31m✗ Failed to clear Redis cache: {e}\033[0m")

    print(f"\n\033[32m✓ Seeding complete\033[0m")
    print(f"\033[32m✓ Added: {added}\033[0m")
    print(f"\033[32m✓ Updated: {updated}\033[0m")
    if errors == 0:
        print(f"\033[32m✓ Errors: {errors}\033[0m")
    else:
        print(f"\033[31m✗ Errors: {errors}\033[0m")


if __name__ == "__main__":
    print("Starting database seed...\n")
    seed_database()
