"""
Export database collectibles to JSON files.

Usage:
    python scripts/db/export.py
"""
import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

import json
import re
from app.core.database import get_db_session
from app.models.collectibles import Level, Location, Collectible
from sqlalchemy.orm import joinedload


def slugify(text):
    """Convert text to URL-friendly slug"""
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    return text.strip('-').lower()


def export_database():
    """Export all collectibles from database to JSON files"""
    db = get_db_session()
    
    print("Starting database export...\n")
    
    # Query all collectibles with relationships
    collectibles = db.query(Collectible).options(
        joinedload(Collectible.types),
        joinedload(Collectible.location).joinedload(Location.level),
        joinedload(Collectible.images)
    ).order_by(Collectible.display_order).all()
    
    print(f"Found {len(collectibles)} collectibles in database\n")

    if len(collectibles) == 0:
        print("\033[31mNo collectibles found in the database. Export aborted to prevent overwriting existing JSON files.\033[0m")
        db.close()
        return

    # Group by level and location
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
            "id": c.id,  # Required: Stable ID for seed script updates
            "level": level_name,
            "location": location_name,
            "types": type_names,  # Array of types
            "title": c.title,
            "description": c.description,
            "display_order": c.display_order,
            "images": [
                {
                    "url": img.cloudinary_url,
                    "alt": img.alt_text,
                    "order": img.display_order
                }
                for img in sorted(c.images, key=lambda x: x.display_order)
            ]
        })
    
    # Create seed-data directory
    seed_dir = project_root / 'seed-data'
    
    if seed_dir.exists():
        import shutil
        print("Removing existing seed-data directory...")
        shutil.rmtree(seed_dir)
    
    seed_dir.mkdir(exist_ok=True)
    
    total_collectibles = 0
    file_count = 0
    
    # Write JSON files
    for level, locations in sorted(grouped.items()):
        level_slug = slugify(level)
        level_dir = seed_dir / level_slug
        level_dir.mkdir(exist_ok=True)
        
        for location, items in sorted(locations.items()):
            location_slug = slugify(location)
            file_path = level_dir / f"{location_slug}.json"
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(items, f, indent=2, ensure_ascii=False)
            
            file_count += 1
            total_collectibles += len(items)
            print(f"{level}/{location}: {len(items)} collectibles exported")
    
    db.close()
    
    print(f"\n\033[32mExport complete!\033[0m")
    print(f"\033[32mFiles: {file_count}\033[0m")
    print(f"\033[32mTotal collectibles: {total_collectibles}\033[0m")
    print(f"\033[32mLocation: {seed_dir}\033[0m")


if __name__ == "__main__":
    print("Starting database export...\n")
    export_database()
    print("\nDatabase export finished.")