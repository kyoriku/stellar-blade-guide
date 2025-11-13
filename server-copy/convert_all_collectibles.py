import psycopg2
import json
import os
import re
import subprocess
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

OLD_PROJECT_PATH = "/Users/austin/projects/personal/stellar-blade-guide/server/seeds/data"

# Map camelCase directory names to database level names
LEVEL_NAME_MAPPING = {
    'abyssLevoire': 'Abyss Levoire',
    'altessLevoire': 'Altess Levoire',
    'eidos7': 'Eidos 7',
    'eidos9': 'Eidos 9',
    'greatDesert': 'Great Desert',
    'matrix11': 'Matrix 11',
    'spire4': 'Spire 4',
    'wasteland': 'Wasteland',
    'xion': 'Xion'
}

def camel_to_title(camel_str):
    """Convert camelCase to Title Case, handling special cases"""
    # Handle "Continued" suffix specially
    if camel_str.endswith('Continued'):
        base = camel_str[:-9]  # Remove 'Continued'
        base_title = camel_to_title(base)
        return f"{base_title} (Continued)"
    
    # Insert space before uppercase letters, but keep consecutive numbers together
    result = re.sub('([A-Z]+)', r' \1', camel_str)  # Space before capitals
    result = re.sub('([a-z])([0-9])', r'\1 \2', result)  # Space between letter and number
    # Capitalize each word
    result = result.title().strip()
    return result

def parse_js_file(filepath):
    """Use Node.js to parse JS file and convert to JSON"""
    # Create a small Node.js script to parse the file
    node_script = f"""
    const data = require('{filepath}');
    console.log(JSON.stringify(data));
    """
    
    try:
        result = subprocess.run(
            ['node', '-e', node_script],
            capture_output=True,
            text=True,
            check=True
        )
        return json.loads(result.stdout)
    except Exception as e:
        print(f"Error parsing {filepath}: {e}")
        return None

def get_location_mapping(conn):
    """Get all location IDs mapped by level and location name"""
    cur = conn.cursor()
    cur.execute("""
        SELECT lev.name, loc.name, loc.id
        FROM locations loc
        JOIN levels lev ON loc.level_id = lev.id
    """)
    
    mapping = {}
    for row in cur.fetchall():
        level_name, location_name, location_id = row
        if level_name not in mapping:
            mapping[level_name] = {}
        mapping[level_name][location_name] = location_id
    
    cur.close()
    return mapping

def get_type_mapping(conn):
    """Get all collectible type IDs"""
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM collectible_types")
    mapping = {row[1]: row[0] for row in cur.fetchall()}
    cur.close()
    return mapping

def convert_all_collectibles():
    """Main conversion function"""
    
    # Connect to database
    conn = psycopg2.connect(DATABASE_URL)
    location_mapping = get_location_mapping(conn)
    type_mapping = get_type_mapping(conn)
    conn.close()
    
    sql_output = []
    sql_output.append("-- All Stellar Blade Collectibles\n\n")
    
    total_collectibles = 0
    total_images = 0
    skipped_files = []
    
    # Walk through all level directories
    for level_dir in os.listdir(OLD_PROJECT_PATH):
        level_path = os.path.join(OLD_PROJECT_PATH, level_dir)
        
        if not os.path.isdir(level_path):
            continue
        
        # Get proper level name
        level_name = LEVEL_NAME_MAPPING.get(level_dir)
        if not level_name:
            print(f"⚠️  Unknown level directory: {level_dir}")
            continue
        
        print(f"\n📁 Processing {level_name}...")
        
        # Process each location file
        for filename in sorted(os.listdir(level_path)):
            if not filename.endswith('.js'):
                continue
            
            # Get proper location name
            location_camel = filename.replace('.js', '')
            location_name = camel_to_title(location_camel)
            
            # Get location ID
            location_id = location_mapping.get(level_name, {}).get(location_name)
            
            if not location_id:
                print(f"   ⚠️  Location not found in DB: {location_name}")
                skipped_files.append(f"{level_name}/{location_name}")
                continue
            
            # Parse JS file
            filepath = os.path.join(level_path, filename)
            collectibles = parse_js_file(filepath)
            
            if not collectibles:
                print(f"   ⚠️  Could not parse: {filename}")
                skipped_files.append(f"{level_name}/{location_name}")
                continue
            
            print(f"   ✅ {location_name}: {len(collectibles)} collectibles")
            
            # Generate SQL for this location
            sql_output.append(f"-- {level_name} - {location_name}\n")
            
            for item in collectibles:
                # Get type_id
                item_type = item['type']
                # Handle type being an array (take first element)
                if isinstance(item_type, list):
                    item_type = item_type[0] if item_type else None
                
                type_id = type_mapping.get(item_type)
                if not type_id:
                    print(f"      ⚠️  Unknown type: {item_type} for {item['title']}")
                    continue
                
                # Format description
                if isinstance(item['text'], list):
                    description = json.dumps({"type": "list", "items": item['text']})
                else:
                    description = json.dumps({"type": "text", "content": item['text']})
                
                # Escape single quotes
                title = item['title'].replace("'", "''")
                description = description.replace("'", "''")
                
                # Insert collectible
                sql_output.append(f"""
INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES ({location_id}, {type_id}, '{title}', '{description}', {item['id']});
""")
                
                total_collectibles += 1
                
                # Insert images
                for img_index, img in enumerate(item['images'], 1):
                    alt_text = img['alt'].replace("'", "''")
                    cloudinary_url = img['src'].replace("'", "''")
                    
                    sql_output.append(f"""
INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = '{title}' AND location_id = {location_id} AND display_order = {item['id']}), 
        '{cloudinary_url}', '{alt_text}', {img_index});
""")
                    total_images += 1
            
            sql_output.append("\n")
    
    # Write to file
    output_file = 'sql/collectibles_all.sql'
    with open(output_file, 'w') as f:
        f.write(''.join(sql_output))
    
    # Print summary
    print("\n" + "="*60)
    print(f"✅ Conversion Complete!")
    print(f"📊 Total collectibles: {total_collectibles}")
    print(f"🖼️  Total images: {total_images}")
    print(f"💾 Saved to: {output_file}")
    
    if skipped_files:
        print(f"\n⚠️  Skipped {len(skipped_files)} files:")
        for f in skipped_files:
            print(f"   - {f}")
    
    print("\nTo import, run:")
    print(f"psql stellarblade < {output_file}")

if __name__ == "__main__":
    convert_all_collectibles()