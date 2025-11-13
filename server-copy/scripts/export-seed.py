# import sys
# import os
# # Add parent directory to path so we can import database
# sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# import psycopg2
# import json
# from database import get_db_connection

# def export_to_seed():
#     conn = get_db_connection()
#     cur = conn.cursor()
    
#     # Get all collectibles with their full data
#     cur.execute("""
#         SELECT 
#             lev.name as level_name,
#             loc.name as location_name,
#             ct.name as type_name,
#             c.title,
#             c.description,
#             c.display_order,
#             json_agg(
#                 json_build_object(
#                     'url', ci.cloudinary_url,
#                     'alt', ci.alt_text,
#                     'order', ci.display_order
#                 ) ORDER BY ci.display_order
#             ) FILTER (WHERE ci.id IS NOT NULL) as images
#         FROM collectibles c
#         JOIN collectible_types ct ON c.type_id = ct.id
#         JOIN locations loc ON c.location_id = loc.id
#         JOIN levels lev ON loc.level_id = lev.id
#         LEFT JOIN collectible_images ci ON c.id = ci.collectible_id
#         GROUP BY lev.name, loc.name, ct.name, c.title, c.description, c.display_order, lev.display_order, loc.display_order
#         ORDER BY lev.display_order, loc.display_order, c.display_order
#     """)
    
#     collectibles = cur.fetchall()
#     cur.close()
#     conn.close()
    
#     # Format as TypeScript/JSON
#     seed_data = []
#     for col in collectibles:
#         seed_data.append({
#             "level": col[0],
#             "location": col[1],
#             "type": col[2],
#             "title": col[3],
#             "description": col[4],
#             "display_order": col[5],
#             "images": col[6] if col[6] else []
#         })
    
#     # Write to file in server root
#     output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'seed-data.json')
#     with open(output_path, 'w') as f:
#         json.dump(seed_data, f, indent=2)
    
#     print(f"✅ Exported {len(seed_data)} collectibles to seed-data.json")

# if __name__ == "__main__":
#     export_to_seed()

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2
import json
import re
from database import get_db_connection

def slugify(text):
    """Convert text to filename-safe slug"""
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    return text.strip('-')

def export_to_seed():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Get all collectibles grouped by level and location
    cur.execute("""
        SELECT 
            lev.name as level_name,
            lev.display_order as level_order,
            loc.name as location_name,
            loc.display_order as location_order,
            ct.name as type_name,
            c.id,
            c.title,
            c.description,
            c.display_order,
            json_agg(
                json_build_object(
                    'url', ci.cloudinary_url,
                    'alt', ci.alt_text,
                    'order', ci.display_order
                ) ORDER BY ci.display_order
            ) FILTER (WHERE ci.id IS NOT NULL) as images
        FROM collectibles c
        JOIN collectible_types ct ON c.type_id = ct.id
        JOIN locations loc ON c.location_id = loc.id
        JOIN levels lev ON loc.level_id = lev.id
        LEFT JOIN collectible_images ci ON c.id = ci.collectible_id
        GROUP BY lev.name, lev.display_order, loc.name, loc.display_order, ct.name, c.id, c.title, c.description, c.display_order
        ORDER BY lev.display_order, loc.display_order, c.display_order
    """)
    
    collectibles = cur.fetchall()
    cur.close()
    conn.close()
    
    # Group by level and location
    grouped = {}
    for col in collectibles:
        level = col[0]
        location = col[2]
        
        if level not in grouped:
            grouped[level] = {}
        
        if location not in grouped[level]:
            grouped[level][location] = []
        
        grouped[level][location].append({
            "level": level,
            "location": location,
            "type": col[4],
            "title": col[6],  # Adjusted index because we added c.id
            "description": col[7],
            "display_order": col[8],
            "images": col[9] if col[9] else []
        })
    
    # Create directory structure and write files
    seed_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'seed-data')
    os.makedirs(seed_dir, exist_ok=True)
    
    total_collectibles = 0
    file_count = 0
    
    for level, locations in grouped.items():
        level_slug = slugify(level)
        level_dir = os.path.join(seed_dir, level_slug)
        os.makedirs(level_dir, exist_ok=True)
        
        for location, items in locations.items():
            location_slug = slugify(location)
            file_path = os.path.join(level_dir, f"{location_slug}.json")
            
            with open(file_path, 'w') as f:
                json.dump(items, f, indent=2)
            
            file_count += 1
            total_collectibles += len(items)
            print(f"✅ Exported {file_path} ({len(items)} collectibles)")
    
    print(f"\n✅ Export complete!")
    print(f"   {total_collectibles} collectibles exported to {file_count} files")

if __name__ == "__main__":
    export_to_seed()