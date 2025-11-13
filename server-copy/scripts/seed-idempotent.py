# import sys
# import os
# # Add parent directory to path
# sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# import psycopg2
# import json
# from database import get_db_connection

# def seed_database():
#     """
#     Idempotent seed script - can run multiple times safely.
#     Updates existing collectibles or inserts new ones.
#     """
#     conn = get_db_connection()
#     cur = conn.cursor()
    
#     # Load seed data from server root
#     seed_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'seed-data.json')
#     with open(seed_file, 'r') as f:
#         seed_data = json.load(f)
    
#     print(f"📦 Seeding {len(seed_data)} collectibles...")
    
#     added = 0
#     updated = 0
#     errors = 0
    
#     for item in seed_data:
#         try:
#             # Get level_id
#             cur.execute("SELECT id FROM levels WHERE name = %s", (item['level'],))
#             level_result = cur.fetchone()
#             if not level_result:
#                 print(f"⚠️  Level not found: {item['level']}")
#                 errors += 1
#                 continue
#             level_id = level_result[0]
            
#             # Get or create location
#             cur.execute("""
#                 SELECT id FROM locations WHERE name = %s AND level_id = %s
#             """, (item['location'], level_id))
#             location_result = cur.fetchone()
            
#             if not location_result:
#                 # Create location if it doesn't exist
#                 cur.execute("""
#                     INSERT INTO locations (name, level_id, display_order)
#                     VALUES (%s, %s, %s)
#                     RETURNING id
#                 """, (item['location'], level_id, item.get('display_order', 0)))
#                 location_id = cur.fetchone()[0]
#             else:
#                 location_id = location_result[0]
            
#             # Get type_id
#             cur.execute("SELECT id FROM collectible_types WHERE name = %s", (item['type'],))
#             type_result = cur.fetchone()
#             if not type_result:
#                 print(f"⚠️  Type not found: {item['type']}")
#                 errors += 1
#                 continue
#             type_id = type_result[0]
            
#             # Format description
#             desc = item['description']
#             if isinstance(desc, dict):
#                 description_json = json.dumps(desc)
#             elif isinstance(desc, list):
#                 description_json = json.dumps({"type": "list", "items": desc})
#             else:
#                 description_json = json.dumps({"type": "text", "content": desc})
            
#             # Check if collectible exists
#             cur.execute("""
#                 SELECT id FROM collectibles 
#                 WHERE title = %s AND location_id = %s AND type_id = %s
#             """, (item['title'], location_id, type_id))
#             existing = cur.fetchone()
            
#             if existing:
#                 # Update existing
#                 collectible_id = existing[0]
#                 cur.execute("""
#                     UPDATE collectibles 
#                     SET description = %s, display_order = %s
#                     WHERE id = %s
#                 """, (description_json, item['display_order'], collectible_id))
                
#                 # Delete old images
#                 cur.execute("DELETE FROM collectible_images WHERE collectible_id = %s", (collectible_id,))
#                 updated += 1
#             else:
#                 # Insert new
#                 cur.execute("""
#                     INSERT INTO collectibles (location_id, type_id, title, description, display_order)
#                     VALUES (%s, %s, %s, %s, %s)
#                     RETURNING id
#                 """, (location_id, type_id, item['title'], description_json, item['display_order']))
#                 collectible_id = cur.fetchone()[0]
#                 added += 1
            
#             # Insert images
#             for img in item.get('images', []):
#                 cur.execute("""
#                     INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
#                     VALUES (%s, %s, %s, %s)
#                 """, (collectible_id, img['url'], img['alt'], img['order']))
            
#             conn.commit()
            
#         except Exception as e:
#             print(f"❌ Error with {item.get('title', 'Unknown')}: {e}")
#             conn.rollback()
#             errors += 1
    
#     cur.close()
#     conn.close()
    
#     print(f"\n✅ Seeding complete!")
#     print(f"   Added: {added}")
#     print(f"   Updated: {updated}")
#     print(f"   Errors: {errors}")

# if __name__ == "__main__":
#     seed_database()

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2
import json
import glob
from database import get_db_connection

def load_all_seed_data():
    """Load all JSON files from seed-data directory"""
    seed_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'seed-data')
    
    all_data = []
    
    # Find all .json files in subdirectories
    json_files = glob.glob(os.path.join(seed_dir, '*', '*.json'))
    
    for json_file in sorted(json_files):
        with open(json_file, 'r') as f:
            data = json.load(f)
            all_data.extend(data)
            print(f"📂 Loaded {len(data)} items from {os.path.basename(os.path.dirname(json_file))}/{os.path.basename(json_file)}")
    
    return all_data

def seed_database():
    """
    Idempotent seed script - can run multiple times safely.
    Updates existing collectibles or inserts new ones.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Load seed data from all files
    seed_data = load_all_seed_data()
    
    print(f"\n📦 Seeding {len(seed_data)} collectibles...")
    
    added = 0
    updated = 0
    errors = 0
    
    for item in seed_data:
        try:
            # Get level_id
            cur.execute("SELECT id FROM levels WHERE name = %s", (item['level'],))
            level_result = cur.fetchone()
            if not level_result:
                print(f"⚠️  Level not found: {item['level']}")
                errors += 1
                continue
            level_id = level_result[0]
            
            # Get or create location
            cur.execute("""
                SELECT id FROM locations WHERE name = %s AND level_id = %s
            """, (item['location'], level_id))
            location_result = cur.fetchone()
            
            if not location_result:
                # Create location if it doesn't exist
                cur.execute("""
                    INSERT INTO locations (name, level_id, display_order)
                    VALUES (%s, %s, %s)
                    RETURNING id
                """, (item['location'], level_id, item.get('display_order', 0)))
                location_id = cur.fetchone()[0]
            else:
                location_id = location_result[0]
            
            # Get type_id
            cur.execute("SELECT id FROM collectible_types WHERE name = %s", (item['type'],))
            type_result = cur.fetchone()
            if not type_result:
                print(f"⚠️  Type not found: {item['type']}")
                errors += 1
                continue
            type_id = type_result[0]
            
            # Format description
            desc = item['description']
            if isinstance(desc, dict):
                description_json = json.dumps(desc)
            elif isinstance(desc, list):
                description_json = json.dumps({"type": "list", "items": desc})
            else:
                description_json = json.dumps({"type": "text", "content": desc})
            
            # Check if collectible exists
            cur.execute("""
                SELECT id FROM collectibles 
                WHERE title = %s AND location_id = %s AND type_id = %s
            """, (item['title'], location_id, type_id))
            existing = cur.fetchone()
            
            if existing:
                # Update existing
                collectible_id = existing[0]
                cur.execute("""
                    UPDATE collectibles 
                    SET description = %s, display_order = %s
                    WHERE id = %s
                """, (description_json, item['display_order'], collectible_id))
                
                # Delete old images
                cur.execute("DELETE FROM collectible_images WHERE collectible_id = %s", (collectible_id,))
                updated += 1
            else:
                # Insert new
                cur.execute("""
                    INSERT INTO collectibles (location_id, type_id, title, description, display_order)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                """, (location_id, type_id, item['title'], description_json, item['display_order']))
                collectible_id = cur.fetchone()[0]
                added += 1
            
            # Insert images
            for img in item.get('images', []):
                cur.execute("""
                    INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
                    VALUES (%s, %s, %s, %s)
                """, (collectible_id, img['url'], img['alt'], img['order']))
            
            conn.commit()
            
        except Exception as e:
            print(f"❌ Error with {item.get('title', 'Unknown')}: {e}")
            conn.rollback()
            errors += 1
    
    cur.close()
    conn.close()
    
    print(f"\n✅ Seeding complete!")
    print(f"   Added: {added}")
    print(f"   Updated: {updated}")
    print(f"   Errors: {errors}")

if __name__ == "__main__":
    seed_database()