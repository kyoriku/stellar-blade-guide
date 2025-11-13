# # # # import sys
# # # # import os
# # # # sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# # # # import psycopg2
# # # # import json
# # # # import glob
# # # # from database import get_db_connection

# # # # def load_all_seed_files():
# # # #     """Load all JSON files from seed-data directory"""
# # # #     seed_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'seed-data')
    
# # # #     if not os.path.exists(seed_dir):
# # # #         print("❌ seed-data directory not found!")
# # # #         return []
    
# # # #     all_data = []
# # # #     json_files = sorted(glob.glob(os.path.join(seed_dir, '*', '*.json')))
    
# # # #     print(f"📂 Found {len(json_files)} JSON files\n")
    
# # # #     for json_file in json_files:
# # # #         with open(json_file, 'r', encoding='utf-8') as f:
# # # #             data = json.load(f)
# # # #             all_data.extend(data)
# # # #             rel_path = os.path.relpath(json_file, seed_dir)
# # # #             print(f"   {rel_path}: {len(data)} items")
    
# # # #     return all_data

# # # # def seed_database():
# # # #     """
# # # #     Seed database from JSON files.
# # # #     Idempotent - safe to run multiple times.
# # # #     Updates existing, inserts new, removes duplicates.
# # # #     """
# # # #     conn = get_db_connection()
# # # #     cur = conn.cursor()
    
# # # #     seed_data = load_all_seed_files()
    
# # # #     if not seed_data:
# # # #         print("\n❌ No seed data found!")
# # # #         return
    
# # # #     print(f"\n📦 Seeding {len(seed_data)} collectibles...\n")
    
# # # #     added = 0
# # # #     updated = 0
# # # #     skipped = 0
# # # #     errors = 0
    
# # # #     for item in seed_data:
# # # #         try:
# # # #             # Get level_id
# # # #             cur.execute("SELECT id FROM levels WHERE name = %s", (item['level'],))
# # # #             level_result = cur.fetchone()
# # # #             if not level_result:
# # # #                 print(f"⚠️  Level not found: {item['level']}")
# # # #                 errors += 1
# # # #                 continue
# # # #             level_id = level_result[0]
            
# # # #             # Get or create location
# # # #             cur.execute("""
# # # #                 SELECT id FROM locations WHERE name = %s AND level_id = %s
# # # #             """, (item['location'], level_id))
# # # #             location_result = cur.fetchone()
            
# # # #             if not location_result:
# # # #                 cur.execute("""
# # # #                     INSERT INTO locations (name, level_id, display_order)
# # # #                     VALUES (%s, %s, %s)
# # # #                     RETURNING id
# # # #                 """, (item['location'], level_id, item.get('display_order', 0)))
# # # #                 location_id = cur.fetchone()[0]
# # # #             else:
# # # #                 location_id = location_result[0]
            
# # # #             # Get type_id
# # # #             cur.execute("SELECT id FROM collectible_types WHERE name = %s", (item['type'],))
# # # #             type_result = cur.fetchone()
# # # #             if not type_result:
# # # #                 print(f"⚠️  Type not found: {item['type']}")
# # # #                 errors += 1
# # # #                 continue
# # # #             type_id = type_result[0]
            
# # # #             # Format description
# # # #             desc = item['description']
# # # #             if isinstance(desc, dict):
# # # #                 description_json = json.dumps(desc)
# # # #             elif isinstance(desc, list):
# # # #                 description_json = json.dumps({"type": "list", "items": desc})
# # # #             else:
# # # #                 description_json = json.dumps({"type": "text", "content": desc})
            
# # # #             # Check if collectible exists (by title, location, type, AND display_order)
# # # #             cur.execute("""
# # # #                 SELECT id FROM collectibles 
# # # #                 WHERE title = %s 
# # # #                 AND location_id = %s 
# # # #                 AND type_id = %s 
# # # #                 AND display_order = %s
# # # #             """, (item['title'], location_id, type_id, item['display_order']))
# # # #             existing = cur.fetchone()
            
# # # #             if existing:
# # # #                 collectible_id = existing[0]
                
# # # #                 # Update collectible
# # # #                 cur.execute("""
# # # #                     UPDATE collectibles 
# # # #                     SET description = %s
# # # #                     WHERE id = %s
# # # #                 """, (description_json, collectible_id))
                
# # # #                 # Remove old images (we'll re-add from JSON)
# # # #                 cur.execute("DELETE FROM collectible_images WHERE collectible_id = %s", (collectible_id,))
# # # #                 updated += 1
# # # #             else:
# # # #                 # Insert new collectible
# # # #                 cur.execute("""
# # # #                     INSERT INTO collectibles (location_id, type_id, title, description, display_order)
# # # #                     VALUES (%s, %s, %s, %s, %s)
# # # #                     RETURNING id
# # # #                 """, (location_id, type_id, item['title'], description_json, item['display_order']))
# # # #                 collectible_id = cur.fetchone()[0]
# # # #                 added += 1
            
# # # #             # Insert images (with duplicate prevention)
# # # #             inserted_images = set()
# # # #             for img in item.get('images', []):
# # # #                 img_key = (img['url'], img['order'])
# # # #                 if img_key not in inserted_images:
# # # #                     cur.execute("""
# # # #                         INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
# # # #                         VALUES (%s, %s, %s, %s)
# # # #                     """, (collectible_id, img['url'], img['alt'], img['order']))
# # # #                     inserted_images.add(img_key)
            
# # # #             conn.commit()
            
# # # #         except Exception as e:
# # # #             print(f"❌ Error with '{item.get('title', 'Unknown')}': {e}")
# # # #             conn.rollback()
# # # #             errors += 1
    
# # # #     cur.close()
# # # #     conn.close()
    
# # # #     print(f"\n✅ Seeding complete!")
# # # #     print(f"   Added: {added}")
# # # #     print(f"   Updated: {updated}")
# # # #     print(f"   Errors: {errors}")

# # # # if __name__ == "__main__":
# # # #     seed_database()

# # # import sys
# # # import os
# # # sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# # # import json
# # # import glob
# # # from database import get_db_session
# # # from models import Level, Location, CollectibleType, Collectible, CollectibleImage

# # # def load_all_seed_files():
# # #     seed_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'seed-data')
    
# # #     if not os.path.exists(seed_dir):
# # #         print("❌ seed-data directory not found!")
# # #         return []
    
# # #     all_data = []
# # #     json_files = sorted(glob.glob(os.path.join(seed_dir, '*', '*.json')))
    
# # #     print(f"📂 Found {len(json_files)} JSON files\n")
    
# # #     for json_file in json_files:
# # #         with open(json_file, 'r', encoding='utf-8') as f:
# # #             data = json.load(f)
# # #             all_data.extend(data)
# # #             rel_path = os.path.relpath(json_file, seed_dir)
# # #             print(f"   {rel_path}: {len(data)} items")
    
# # #     return all_data

# # # def seed_database():
# # #     db = get_db_session()
# # #     seed_data = load_all_seed_files()
    
# # #     if not seed_data:
# # #         print("\n❌ No seed data found!")
# # #         return
    
# # #     print(f"\n📦 Seeding {len(seed_data)} collectibles...\n")
    
# # #     added = 0
# # #     updated = 0
# # #     errors = 0
    
# # #     for item in seed_data:
# # #         try:
# # #             level = db.query(Level).filter(Level.name == item['level']).first()
# # #             if not level:
# # #                 print(f"⚠️  Level not found: {item['level']}")
# # #                 errors += 1
# # #                 continue
            
# # #             location = db.query(Location).filter(
# # #                 Location.name == item['location'],
# # #                 Location.level_id == level.id
# # #             ).first()
            
# # #             if not location:
# # #                 location = Location(
# # #                     name=item['location'],
# # #                     level_id=level.id,
# # #                     display_order=item.get('display_order', 0)
# # #                 )
# # #                 db.add(location)
# # #                 db.flush()
            
# # #             collectible_type = db.query(CollectibleType).filter(CollectibleType.name == item['type']).first()
# # #             if not collectible_type:
# # #                 print(f"⚠️  Type not found: {item['type']}")
# # #                 errors += 1
# # #                 continue
            
# # #             desc = item['description']
# # #             if isinstance(desc, dict):
# # #                 description_json = desc
# # #             elif isinstance(desc, list):
# # #                 description_json = {"type": "list", "items": desc}
# # #             else:
# # #                 description_json = {"type": "text", "content": desc}
            
# # #             # existing = db.query(Collectible).filter(
# # #             #     Collectible.title == item['title'],
# # #             #     Collectible.location_id == location.id,
# # #             #     Collectible.type_id == collectible_type.id,
# # #             #     Collectible.display_order == item['display_order']
# # #             # ).first()
            
# # #             # if existing:
# # #             #     existing.description = description_json
# # #             #     db.query(CollectibleImage).filter(CollectibleImage.collectible_id == existing.id).delete()
# # #             #     collectible_id = existing.id
# # #             #     updated += 1
# # #             # else:
# # #             #     new_collectible = Collectible(
# # #             #         location_id=location.id,
# # #             #         type_id=collectible_type.id,
# # #             #         title=item['title'],
# # #             #         description=description_json,
# # #             #         display_order=item['display_order']
# # #             #     )
# # #             #     db.add(new_collectible)
# # #             #     db.flush()
# # #             #     collectible_id = new_collectible.id
# # #             #     added += 1
# # #             collectible_obj = Collectible(
# # #                 id=item.get("id"),  # use provided ID if present
# # #                 location_id=location.id,
# # #                 type_id=collectible_type.id,
# # #                 title=item["title"],
# # #                 description=description_json,
# # #                 display_order=item["display_order"],
# # #             )

# # #             # merge() will update if exists, insert if not
# # #             merged = db.merge(collectible_obj)
# # #             db.flush()
# # #             collectible_id = merged.id

# # #             # Clear existing images for this collectible (so we can reinsert)
# # #             db.query(CollectibleImage).filter(CollectibleImage.collectible_id == collectible_id).delete()

# # #             inserted_images = set()
# # #             for img in item.get('images', []):
# # #                 img_key = (img['url'], img['order'])
# # #                 if img_key not in inserted_images:
# # #                     new_image = CollectibleImage(
# # #                         collectible_id=collectible_id,
# # #                         cloudinary_url=img['url'],
# # #                         alt_text=img['alt'],
# # #                         display_order=img['order']
# # #                     )
# # #                     db.add(new_image)
# # #                     inserted_images.add(img_key)
            
# # #             db.commit()
            
# # #         except Exception as e:
# # #             print(f"❌ Error with '{item.get('title', 'Unknown')}': {e}")
# # #             db.rollback()
# # #             errors += 1
    
# # #     db.close()
    
# # #     print(f"\n✅ Seeding complete!")
# # #     print(f"   Added: {added}")
# # #     print(f"   Updated: {updated}")
# # #     print(f"   Errors: {errors}")

# # # if __name__ == "__main__":
# # #     seed_database()

# # import sys
# # import os
# # sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# # import json
# # import glob
# # from database import get_db_session
# # from models import Level, Location, CollectibleType, Collectible, CollectibleImage

# # def load_all_seed_files():
# #     seed_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'seed-data')
    
# #     if not os.path.exists(seed_dir):
# #         print("❌ seed-data directory not found!")
# #         return []
    
# #     all_data = []
# #     json_files = sorted(glob.glob(os.path.join(seed_dir, '*', '*.json')))
    
# #     print(f"📂 Found {len(json_files)} JSON files\n")
    
# #     for json_file in json_files:
# #         with open(json_file, 'r', encoding='utf-8') as f:
# #             data = json.load(f)
# #             all_data.extend(data)
# #             rel_path = os.path.relpath(json_file, seed_dir)
# #             print(f"   {rel_path}: {len(data)} items")
    
# #     return all_data

# # def seed_database():
# #     db = get_db_session()
# #     seed_data = load_all_seed_files()
    
# #     if not seed_data:
# #         print("\n❌ No seed data found!")
# #         return
    
# #     print(f"\n📦 Seeding {len(seed_data)} collectibles...\n")
    
# #     added = 0
# #     updated = 0
# #     errors = 0
    
# #     for item in seed_data:
# #         try:
# #             level = db.query(Level).filter(Level.name == item['level']).first()
# #             if not level:
# #                 print(f"⚠️  Level not found: {item['level']}")
# #                 errors += 1
# #                 continue
            
# #             location = db.query(Location).filter(
# #                 Location.name == item['location'],
# #                 Location.level_id == level.id
# #             ).first()
            
# #             if not location:
# #                 location = Location(
# #                     name=item['location'],
# #                     level_id=level.id,
# #                     display_order=item.get('display_order', 0)
# #                 )
# #                 db.add(location)
# #                 db.flush()
            
# #             collectible_type = db.query(CollectibleType).filter(CollectibleType.name == item['type']).first()
# #             if not collectible_type:
# #                 print(f"⚠️  Type not found: {item['type']}")
# #                 errors += 1
# #                 continue
            
# #             desc = item['description']
# #             if isinstance(desc, dict):
# #                 description_json = desc
# #             elif isinstance(desc, list):
# #                 description_json = {"type": "list", "items": desc}
# #             else:
# #                 description_json = {"type": "text", "content": desc}
            
# #             # Check if collectible already exists (before merging)
# #             existing = db.query(Collectible).filter(Collectible.id == item.get("id")).first() if item.get("id") else None

# #             collectible_obj = Collectible(
# #                 id=item.get("id"),  # use provided ID if present
# #                 location_id=location.id,
# #                 type_id=collectible_type.id,
# #                 title=item["title"],
# #                 description=description_json,
# #                 display_order=item["display_order"],
# #             )

# #             # merge() will update if exists, insert if not
# #             merged = db.merge(collectible_obj)
# #             db.flush()
# #             collectible_id = merged.id

# #             # Track if this was an add or update
# #             if existing:
# #                 updated += 1
# #             else:
# #                 added += 1

# #             # Clear existing images for this collectible (so we can reinsert)
# #             db.query(CollectibleImage).filter(CollectibleImage.collectible_id == collectible_id).delete()

# #             inserted_images = set()
# #             for img in item.get('images', []):
# #                 img_key = (img['url'], img['order'])
# #                 if img_key not in inserted_images:
# #                     new_image = CollectibleImage(
# #                         collectible_id=collectible_id,
# #                         cloudinary_url=img['url'],
# #                         alt_text=img['alt'],
# #                         display_order=img['order']
# #                     )
# #                     db.add(new_image)
# #                     inserted_images.add(img_key)
            
# #             db.commit()
            
# #         except Exception as e:
# #             print(f"❌ Error with '{item.get('title', 'Unknown')}': {e}")
# #             db.rollback()
# #             errors += 1
    
# #     db.close()
    
# #     print(f"\n✅ Seeding complete!")
# #     print(f"   Added: {added}")
# #     print(f"   Updated: {updated}")
# #     print(f"   Errors: {errors}")

# # if __name__ == "__main__":
# #     seed_database()

# import sys
# import os
# sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# import json
# import glob
# from database import get_db_session
# from models import Level, Location, CollectibleType, Collectible, CollectibleImage

# def load_all_seed_files():
#     seed_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'seed-data')
    
#     if not os.path.exists(seed_dir):
#         print("❌ seed-data directory not found!")
#         return []
    
#     all_data = []
#     json_files = sorted(glob.glob(os.path.join(seed_dir, '*', '*.json')))
    
#     print(f"📂 Found {len(json_files)} JSON files\n")
    
#     for json_file in json_files:
#         with open(json_file, 'r', encoding='utf-8') as f:
#             data = json.load(f)
#             all_data.extend(data)
#             rel_path = os.path.relpath(json_file, seed_dir)
#             print(f"   {rel_path}: {len(data)} items")
    
#     return all_data

# def seed_database():
#     db = get_db_session()
#     seed_data = load_all_seed_files()
    
#     if not seed_data:
#         print("\n❌ No seed data found!")
#         return
    
#     print(f"\n📦 Seeding {len(seed_data)} collectibles...\n")
    
#     added = 0
#     updated = 0
#     errors = 0
    
#     for item in seed_data:
#         try:
#             level = db.query(Level).filter(Level.name == item['level']).first()
#             if not level:
#                 print(f"⚠️  Level not found: {item['level']}")
#                 errors += 1
#                 continue
            
#             location = db.query(Location).filter(
#                 Location.name == item['location'],
#                 Location.level_id == level.id
#             ).first()
            
#             if not location:
#                 location = Location(
#                     name=item['location'],
#                     level_id=level.id,
#                     display_order=item.get('display_order', 0)
#                 )
#                 db.add(location)
#                 db.flush()
            
#             # Handle both old format (single type) and new format (multiple types)
#             type_names = []
#             if 'types' in item:
#                 # New format: array of types
#                 types_value = item['types']
#                 if isinstance(types_value, list):
#                     type_names = types_value
#                 else:
#                     type_names = [types_value]
#             elif 'type' in item:
#                 # Old format: single type
#                 type_value = item['type']
#                 if isinstance(type_value, list):
#                     type_names = type_value
#                 else:
#                     type_names = [type_value]
#             else:
#                 print(f"⚠️  No type(s) specified for: {item.get('title', 'Unknown')}")
#                 errors += 1
#                 continue
            
#             # Flatten if somehow we got nested lists
#             flattened_types = []
#             for t in type_names:
#                 if isinstance(t, list):
#                     flattened_types.extend(t)
#                 else:
#                     flattened_types.append(t)
#             type_names = flattened_types
            
#             # Fetch all type objects - query each type individually
#             collectible_types = []
#             for type_name in type_names:
#                 if not isinstance(type_name, str):
#                     print(f"⚠️  Invalid type name (not a string): {type_name} for '{item.get('title', 'Unknown')}'")
#                     continue
                    
#                 collectible_type = db.query(CollectibleType).filter(CollectibleType.name == type_name).first()
#                 if not collectible_type:
#                     print(f"⚠️  Type not found: {type_name}")
#                     errors += 1
#                     continue
#                 collectible_types.append(collectible_type)
            
#             if not collectible_types:
#                 print(f"⚠️  No valid types found for: {item.get('title', 'Unknown')}'")
#                 errors += 1
#                 continue
            
#             desc = item['description']
#             if isinstance(desc, dict):
#                 description_json = desc
#             elif isinstance(desc, list):
#                 description_json = {"type": "list", "items": desc}
#             else:
#                 description_json = {"type": "text", "content": desc}
            
#             # Check if collectible already exists (before merging)
#             existing = db.query(Collectible).filter(Collectible.id == item.get("id")).first() if item.get("id") else None

#             collectible_obj = Collectible(
#                 id=item.get("id"),  # use provided ID if present
#                 location_id=location.id,
#                 title=item["title"],
#                 description=description_json,
#                 display_order=item["display_order"],
#             )

#             # merge() will update if exists, insert if not
#             merged = db.merge(collectible_obj)
#             db.flush()
#             collectible_id = merged.id

#             # Track if this was an add or update
#             if existing:
#                 updated += 1
#                 # Clear existing type mappings
#                 merged.types.clear()
#             else:
#                 added += 1

#             # Add type associations
#             merged.types.extend(collectible_types)

#             # Clear existing images for this collectible (so we can reinsert)
#             db.query(CollectibleImage).filter(CollectibleImage.collectible_id == collectible_id).delete()

#             # Insert images
#             inserted_images = set()
#             for img in item.get('images', []):
#                 img_key = (img['url'], img['order'])
#                 if img_key not in inserted_images:
#                     new_image = CollectibleImage(
#                         collectible_id=collectible_id,
#                         cloudinary_url=img['url'],
#                         alt_text=img['alt'],
#                         display_order=img['order']
#                     )
#                     db.add(new_image)
#                     inserted_images.add(img_key)
            
#             db.commit()
            
#         except Exception as e:
#             print(f"❌ Error with '{item.get('title', 'Unknown')}': {e}")
#             import traceback
#             traceback.print_exc()
#             db.rollback()
#             errors += 1
    
#     db.close()
    
#     print(f"\n✅ Seeding complete!")
#     print(f"   Added: {added}")
#     print(f"   Updated: {updated}")
#     print(f"   Errors: {errors}")

# if __name__ == "__main__":
#     seed_database()

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import glob
from database import get_db_session
from models import Level, Location, CollectibleType, Collectible, CollectibleImage
from redis_config import clear_all_cache

def load_all_seed_files():
    seed_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'seed-data')
    
    if not os.path.exists(seed_dir):
        print("❌ seed-data directory not found!")
        return []
    
    all_data = []
    json_files = sorted(glob.glob(os.path.join(seed_dir, '*', '*.json')))
    
    print(f"📂 Found {len(json_files)} JSON files\n")
    
    for json_file in json_files:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            all_data.extend(data)
            rel_path = os.path.relpath(json_file, seed_dir)
            print(f"   {rel_path}: {len(data)} items")
    
    return all_data

def seed_database():
    db = get_db_session()
    seed_data = load_all_seed_files()
    
    if not seed_data:
        print("\n❌ No seed data found!")
        return
    
    print(f"\n📦 Seeding {len(seed_data)} collectibles...\n")
    
    added = 0
    updated = 0
    errors = 0
    
    for item in seed_data:
        try:
            level = db.query(Level).filter(Level.name == item['level']).first()
            if not level:
                print(f"⚠️  Level not found: {item['level']}")
                errors += 1
                continue
            
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
                # New format: array of types
                types_value = item['types']
                if isinstance(types_value, list):
                    type_names = types_value
                else:
                    type_names = [types_value]
            elif 'type' in item:
                # Old format: single type
                type_value = item['type']
                if isinstance(type_value, list):
                    type_names = type_value
                else:
                    type_names = [type_value]
            else:
                print(f"⚠️  No type(s) specified for: {item.get('title', 'Unknown')}")
                errors += 1
                continue
            
            # Flatten if somehow we got nested lists
            flattened_types = []
            for t in type_names:
                if isinstance(t, list):
                    flattened_types.extend(t)
                else:
                    flattened_types.append(t)
            type_names = flattened_types
            
            # Fetch all type objects - query each type individually
            collectible_types = []
            for type_name in type_names:
                if not isinstance(type_name, str):
                    print(f"⚠️  Invalid type name (not a string): {type_name} for '{item.get('title', 'Unknown')}'")
                    continue
                    
                collectible_type = db.query(CollectibleType).filter(CollectibleType.name == type_name).first()
                if not collectible_type:
                    print(f"⚠️  Type not found: {type_name}")
                    errors += 1
                    continue
                collectible_types.append(collectible_type)
            
            if not collectible_types:
                print(f"⚠️  No valid types found for: {item.get('title', 'Unknown')}'")
                errors += 1
                continue
            
            desc = item['description']
            if isinstance(desc, dict):
                description_json = desc
            elif isinstance(desc, list):
                description_json = {"type": "list", "items": desc}
            else:
                description_json = {"type": "text", "content": desc}
            
            # Check if collectible already exists (before merging)
            existing = db.query(Collectible).filter(Collectible.id == item.get("id")).first() if item.get("id") else None

            collectible_obj = Collectible(
                id=item.get("id"),  # use provided ID if present # Required: Without ID, any field change creates duplicate
                location_id=location.id,
                title=item["title"],
                description=description_json,
                display_order=item["display_order"],
            )

            # merge() will update if exists, insert if not
            merged = db.merge(collectible_obj)
            db.flush()
            collectible_id = merged.id

            # Track if this was an add or update
            if existing:
                updated += 1
                # Clear existing type mappings
                merged.types.clear()
            else:
                added += 1

            # Add type associations
            merged.types.extend(collectible_types)

            # Clear existing images for this collectible (so we can reinsert)
            db.query(CollectibleImage).filter(CollectibleImage.collectible_id == collectible_id).delete()

            # Insert images
            # inserted_images = set()
            # for img in item.get('images', []):
            #     img_key = (img['url'], img['order'])
            #     if img_key not in inserted_images:
            #         new_image = CollectibleImage(
            #             collectible_id=collectible_id,
            #             cloudinary_url=img['url'],
            #             alt_text=img['alt'],
            #             display_order=img['order']
            #         )
            #         db.add(new_image)
            #         inserted_images.add(img_key)
            # Insert images
            inserted_images = set()
            for img in item.get('images', []):
                # Skip images with null/empty URLs
                if not img.get('url'):
                    print(f"   ⚠️  Skipping image with null URL for '{item['title']}'")
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
            print(f"❌ Error with '{item.get('title', 'Unknown')}': {e}")
            import traceback
            traceback.print_exc()
            db.rollback()
            errors += 1
    
    db.close()
    
    # Clear Redis cache after successful seeding
    print("\n🗑️  Clearing Redis cache...")
    if clear_all_cache():
        print("✅ Redis cache cleared successfully")
    else:
        print("⚠️  Failed to clear Redis cache")
    
    print(f"\n✅ Seeding complete!")
    print(f"   Added: {added}")
    print(f"   Updated: {updated}")
    print(f"   Errors: {errors}")

if __name__ == "__main__":
    seed_database()