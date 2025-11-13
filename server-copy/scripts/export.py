# # import sys
# # import os
# # sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# # import psycopg2
# # import json
# # import re
# # from database import get_db_connection

# # def slugify(text):
# #     """Convert text to filename-safe slug"""
# #     text = re.sub(r'[^\w\s-]', '', text)
# #     text = re.sub(r'[\s_]+', '-', text)
# #     return text.strip('-')

# # def export_database():
# #     """
# #     Export entire database to organized JSON files.
# #     One file per location. Handles duplicates correctly.
# #     """
# #     conn = get_db_connection()
# #     cur = conn.cursor()
    
# #     print("📤 Exporting database to JSON files...\n")
    
# #     # Get all collectibles with their images
# #     # Using DISTINCT ON to handle any duplicate images
# #     cur.execute("""
# #         SELECT 
# #             lev.name as level_name,
# #             lev.display_order as level_order,
# #             loc.name as location_name,
# #             loc.display_order as location_order,
# #             c.id as collectible_id,
# #             ct.name as type_name,
# #             c.title,
# #             c.description,
# #             c.display_order as collectible_order,
# #             COALESCE(
# #                 json_agg(
# #                     DISTINCT jsonb_build_object(
# #                         'url', ci.cloudinary_url,
# #                         'alt', ci.alt_text,
# #                         'order', ci.display_order
# #                     ) ORDER BY jsonb_build_object(
# #                         'url', ci.cloudinary_url,
# #                         'alt', ci.alt_text,
# #                         'order', ci.display_order
# #                     )
# #                 ) FILTER (WHERE ci.id IS NOT NULL),
# #                 '[]'::json
# #             ) as images
# #         FROM collectibles c
# #         JOIN collectible_types ct ON c.type_id = ct.id
# #         JOIN locations loc ON c.location_id = loc.id
# #         JOIN levels lev ON loc.level_id = lev.id
# #         LEFT JOIN collectible_images ci ON c.id = ci.collectible_id
# #         GROUP BY lev.name, lev.display_order, loc.name, loc.display_order, 
# #                  c.id, ct.name, c.title, c.description, c.display_order
# #         ORDER BY lev.display_order, loc.display_order, c.display_order
# #     """)
    
# #     collectibles = cur.fetchall()
# #     cur.close()
# #     conn.close()
    
# #     print(f"Found {len(collectibles)} collectibles in database\n")
    
# #     # Group by level and location
# #     grouped = {}
# #     for col in collectibles:
# #         level = col[0]
# #         location = col[2]
        
# #         if level not in grouped:
# #             grouped[level] = {}
        
# #         if location not in grouped[level]:
# #             grouped[level][location] = []
        
# #         grouped[level][location].append({
# #             "level": level,
# #             "location": location,
# #             "type": col[5],
# #             "title": col[6],
# #             "description": col[7],
# #             "display_order": col[8],
# #             "images": col[9]
# #         })
    
# #     # Write to organized directory structure
# #     seed_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'seed-data')
    
# #     # Clean existing seed-data directory
# #     if os.path.exists(seed_dir):
# #         import shutil
# #         shutil.rmtree(seed_dir)
# #     os.makedirs(seed_dir)
    
# #     total_collectibles = 0
# #     file_count = 0
    
# #     for level, locations in sorted(grouped.items()):
# #         level_slug = slugify(level)
# #         level_dir = os.path.join(seed_dir, level_slug)
# #         os.makedirs(level_dir, exist_ok=True)
        
# #         for location, items in sorted(locations.items()):
# #             location_slug = slugify(location)
# #             file_path = os.path.join(level_dir, f"{location_slug}.json")
            
# #             with open(file_path, 'w', encoding='utf-8') as f:
# #                 json.dump(items, f, indent=2, ensure_ascii=False)
            
# #             file_count += 1
# #             total_collectibles += len(items)
# #             print(f"✅ {level}/{location}: {len(items)} collectibles")
    
# #     print(f"\n✅ Export complete!")
# #     print(f"   Files: {file_count}")
# #     print(f"   Total collectibles: {total_collectibles}")
# #     print(f"   Location: {seed_dir}")

# # if __name__ == "__main__":
# #     export_database()

# import sys
# import os
# sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# import json
# import re
# from database import get_db_session
# from models import Level, Location, Collectible, CollectibleImage
# from sqlalchemy.orm import joinedload

# def slugify(text):
#     text = re.sub(r'[^\w\s-]', '', text)
#     text = re.sub(r'[\s_]+', '-', text)
#     return text.strip('-')

# def export_database():
#     db = get_db_session()
    
#     print("📤 Exporting database to JSON files...\n")
    
#     collectibles = db.query(Collectible).options(
#         joinedload(Collectible.type),
#         joinedload(Collectible.location).joinedload(Location.level),
#         joinedload(Collectible.images)
#     ).order_by(Collectible.display_order).all()
    
#     print(f"Found {len(collectibles)} collectibles in database\n")
    
#     grouped = {}
#     for c in collectibles:
#         level_name = c.location.level.name
#         location_name = c.location.name
        
#         if level_name not in grouped:
#             grouped[level_name] = {}
        
#         if location_name not in grouped[level_name]:
#             grouped[level_name][location_name] = []
        
#         grouped[level_name][location_name].append({
#             "id": c.id,
#             "level": level_name,
#             "location": location_name,
#             "type": c.type.name,
#             "title": c.title,
#             "description": c.description,
#             "display_order": c.display_order,
#             "images": [{"url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in sorted(c.images, key=lambda x: x.display_order)]
#         })
    
#     seed_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'seed-data')
    
#     if os.path.exists(seed_dir):
#         import shutil
#         shutil.rmtree(seed_dir)
#     os.makedirs(seed_dir)
    
#     total_collectibles = 0
#     file_count = 0
    
#     for level, locations in sorted(grouped.items()):
#         level_slug = slugify(level)
#         level_dir = os.path.join(seed_dir, level_slug)
#         os.makedirs(level_dir, exist_ok=True)
        
#         for location, items in sorted(locations.items()):
#             location_slug = slugify(location)
#             file_path = os.path.join(level_dir, f"{location_slug}.json")
            
#             with open(file_path, 'w', encoding='utf-8') as f:
#                 json.dump(items, f, indent=2, ensure_ascii=False)
            
#             file_count += 1
#             total_collectibles += len(items)
#             print(f"✅ {level}/{location}: {len(items)} collectibles")
    
#     db.close()
    
#     print(f"\n✅ Export complete!")
#     print(f"   Files: {file_count}")
#     print(f"   Total collectibles: {total_collectibles}")
#     print(f"   Location: {seed_dir}")

# if __name__ == "__main__":
#     export_database()

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import re
from database import get_db_session
from models import Level, Location, Collectible, CollectibleImage
from sqlalchemy.orm import joinedload

def slugify(text):
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    return text.strip('-')

def export_database():
    db = get_db_session()
    
    print("📤 Exporting database to JSON files...\n")
    
    collectibles = db.query(Collectible).options(
        joinedload(Collectible.types),
        joinedload(Collectible.location).joinedload(Location.level),
        joinedload(Collectible.images)
    ).order_by(Collectible.display_order).all()
    
    print(f"Found {len(collectibles)} collectibles in database\n")
    
    grouped = {}
    for c in collectibles:
        level_name = c.location.level.name
        location_name = c.location.name
        
        if level_name not in grouped:
            grouped[level_name] = {}
        
        if location_name not in grouped[level_name]:
            grouped[level_name][location_name] = []
        
        # Get all type names for this collectible
        type_names = [t.name for t in c.types]
        
        grouped[level_name][location_name].append({
            "id": c.id, # Required: Stable ID lets seed script update records when any field changes
            "level": level_name,
            "location": location_name,
            "types": type_names,  # Array of types
            "title": c.title,
            "description": c.description,
            "display_order": c.display_order,
            "images": [{"url": img.cloudinary_url, "alt": img.alt_text, "order": img.display_order} for img in sorted(c.images, key=lambda x: x.display_order)]
        })
    
    seed_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'seed-data')
    
    if os.path.exists(seed_dir):
        import shutil
        shutil.rmtree(seed_dir)
    os.makedirs(seed_dir)
    
    total_collectibles = 0
    file_count = 0
    
    for level, locations in sorted(grouped.items()):
        level_slug = slugify(level)
        level_dir = os.path.join(seed_dir, level_slug)
        os.makedirs(level_dir, exist_ok=True)
        
        for location, items in sorted(locations.items()):
            location_slug = slugify(location)
            file_path = os.path.join(level_dir, f"{location_slug}.json")
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(items, f, indent=2, ensure_ascii=False)
            
            file_count += 1
            total_collectibles += len(items)
            print(f"✅ {level}/{location}: {len(items)} collectibles")
    
    db.close()
    
    print(f"\n✅ Export complete!")
    print(f"   Files: {file_count}")
    print(f"   Total collectibles: {total_collectibles}")
    print(f"   Location: {seed_dir}")

if __name__ == "__main__":
    export_database()