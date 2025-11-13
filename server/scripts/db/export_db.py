"""
Export database collectibles to JSON files (ASYNC)

Usage:
  python scripts/db/export_db.py
"""
import sys
import os
import json
import re
import asyncio
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from db.database import get_db
from models.collectibles import Level, Location, Collectible
from sqlalchemy.orm import joinedload
from sqlalchemy import select


def slugify(text):
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    return text.strip('-').lower()


async def export_database():
    # fastapi dependency async generator wrapper
    db_gen = get_db()
    db = await anext(db_gen)

    try:
        print("Starting database export...\n")

        # Query all collectibles with relationships
        stmt = (
            select(Collectible)
            .options(
                joinedload(Collectible.types),
                joinedload(Collectible.location).joinedload(Location.level),
                joinedload(Collectible.images)
            )
            .order_by(Collectible.display_order)
        )

        result = await db.execute(stmt)
        collectibles = result.unique().scalars().all()

        print(f"Found {len(collectibles)} collectibles in database\n")

        if len(collectibles) == 0:
            print("\033[31mNo collectibles found in the database. Export aborted to prevent overwriting existing JSON files.\033[0m")
            return

        # Group by level and location
        grouped = {}
        for c in collectibles:
            level_name = c.location.level.name
            location_name = c.location.name

            grouped.setdefault(level_name, {})
            grouped[level_name].setdefault(location_name, [])

            grouped[level_name][location_name].append({
                "id": c.id,
                "level": level_name,
                "location": location_name,
                "types": [t.name for t in c.types],
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

        print(f"\n\033[32mExport complete!\033[0m")
        print(f"\033[32mFiles: {file_count}\033[0m")
        print(f"\033[32mTotal collectibles: {total_collectibles}\033[0m")
        print(f"\033[32mLocation: {seed_dir}\033[0m")

    finally:
        await db_gen.aclose()


if __name__ == "__main__":
    print("Starting database export...\n")
    asyncio.run(export_database())
    print("\nDatabase export finished.")
