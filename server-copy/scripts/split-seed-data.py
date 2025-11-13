import json
import os
import re

def slugify(text):
    """Convert text to filename-safe slug"""
    # Remove special characters, replace spaces with hyphens
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    return text.strip('-')

def split_seed_data():
    # Load existing seed data
    with open('seed-data.json', 'r') as f:
        all_data = json.load(f)
    
    # Group by level and location
    grouped = {}
    for item in all_data:
        level = item['level']
        location = item['location']
        
        if level not in grouped:
            grouped[level] = {}
        
        if location not in grouped[level]:
            grouped[level][location] = []
        
        grouped[level][location].append(item)
    
    # Create directory structure and write files
    seed_dir = 'seed-data'
    os.makedirs(seed_dir, exist_ok=True)
    
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
            print(f"✅ Created {file_path} ({len(items)} collectibles)")
    
    print(f"\n✅ Split complete! Created {file_count} files")
    print(f"   You can now delete seed-data.json if you want")

if __name__ == "__main__":
    split_seed_data()