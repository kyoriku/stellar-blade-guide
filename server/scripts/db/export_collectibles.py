# """
# Export database collectibles to JSON files (ASYNC)

# Usage:
#   python scripts/db/export_db.py
# """
# import sys
# import os
# import json
# import re
# import asyncio
# from pathlib import Path

# # Add project root to path
# project_root = Path(__file__).parent.parent.parent
# sys.path.insert(0, str(project_root))

# from db.database import get_db
# from models.collectibles import Level, Location, Collectible
# from sqlalchemy.orm import joinedload
# from sqlalchemy import select


# def slugify(text):
#     text = re.sub(r'[^\w\s-]', '', text)
#     text = re.sub(r'[\s_]+', '-', text)
#     return text.strip('-').lower()


# async def export_database():
#     # fastapi dependency async generator wrapper
#     db_gen = get_db()
#     db = await anext(db_gen)

#     try:
#         print("Starting database export...\n")

#         # Query all collectibles with relationships
#         stmt = (
#             select(Collectible)
#             .options(
#                 joinedload(Collectible.types),
#                 joinedload(Collectible.location).joinedload(Location.level),
#                 joinedload(Collectible.images)
#             )
#             .order_by(Collectible.display_order)
#         )

#         result = await db.execute(stmt)
#         collectibles = result.unique().scalars().all()

#         print(f"Found {len(collectibles)} collectibles in database\n")

#         if len(collectibles) == 0:
#             print("\033[31mNo collectibles found in the database. Export aborted to prevent overwriting existing JSON files.\033[0m")
#             return

#         # Group by level and location
#         grouped = {}
#         for c in collectibles:
#             level_name = c.location.level.name
#             location_name = c.location.name

#             grouped.setdefault(level_name, {})
#             grouped[level_name].setdefault(location_name, [])

#             grouped[level_name][location_name].append({
#                 "id": c.id,
#                 "level": level_name,
#                 "location": location_name,
#                 "types": [t.name for t in c.types],
#                 "title": c.title,
#                 "description": c.description,
#                 "display_order": c.display_order,
#                 "images": [
#                     {
#                         "url": img.cloudinary_url,
#                         "alt": img.alt_text,
#                         "order": img.display_order
#                     }
#                     for img in sorted(c.images, key=lambda x: x.display_order)
#                 ]
#             })

#         # Create seed-data directory
#         seed_dir = project_root / 'seed-data' / 'collectibles'

#         if seed_dir.exists():
#             import shutil
#             print("Removing existing seed-data directory...")
#             shutil.rmtree(seed_dir)

#         seed_dir.mkdir(exist_ok=True)

#         total_collectibles = 0
#         file_count = 0

#         # Write JSON files
#         for level, locations in sorted(grouped.items()):
#             level_slug = slugify(level)
#             level_dir = seed_dir / level_slug
#             level_dir.mkdir(exist_ok=True)

#             for location, items in sorted(locations.items()):
#                 location_slug = slugify(location)
#                 file_path = level_dir / f"{location_slug}.json"

#                 with open(file_path, 'w', encoding='utf-8') as f:
#                     json.dump(items, f, indent=2, ensure_ascii=False)

#                 file_count += 1
#                 total_collectibles += len(items)
#                 print(f"{level}/{location}: {len(items)} collectibles exported")

#         print(f"\n\033[32mExport complete!\033[0m")
#         print(f"\033[32mFiles: {file_count}\033[0m")
#         print(f"\033[32mTotal collectibles: {total_collectibles}\033[0m")
#         print(f"\033[32mLocation: {seed_dir}\033[0m")

#     finally:
#         await db_gen.aclose()


# if __name__ == "__main__":
#     print("Starting database export...\n")
#     asyncio.run(export_database())
#     print("\nDatabase export finished.")

"""
Export database collectibles to JSON files (ASYNC)

Usage:
  python scripts/db/export_collectibles.py
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


class CompactJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder that formats arrays compactly on a single line"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.indent_level = 0

    def encode(self, obj):
        if isinstance(obj, list):
            # Keep lists compact on one line
            return '[' + ', '.join(json.dumps(item) for item in obj) + ']'
        return super().encode(obj)

    def iterencode(self, obj, _one_shot=False):
        """Encode while keeping specific arrays compact"""
        if isinstance(obj, dict):
            if not obj:
                yield '{}'
                return
            yield '{\n'
            self.indent_level += 1
            indent = '  ' * self.indent_level
            
            for i, (key, value) in enumerate(obj.items()):
                yield indent + json.dumps(key) + ': '
                
                # Keep 'types' array compact
                if key == 'types' and isinstance(value, list):
                    yield '[' + ', '.join(json.dumps(item) for item in value) + ']'
                else:
                    # Recursively encode other values
                    if isinstance(value, (dict, list)):
                        for chunk in self.iterencode(value):
                            yield chunk
                    else:
                        yield json.dumps(value, ensure_ascii=False)
                
                if i < len(obj) - 1:
                    yield ','
                yield '\n'
            
            self.indent_level -= 1
            yield '  ' * self.indent_level + '}'
        
        elif isinstance(obj, list):
            if not obj:
                yield '[]'
                return
            yield '[\n'
            self.indent_level += 1
            indent = '  ' * self.indent_level
            
            for i, item in enumerate(obj):
                yield indent
                for chunk in self.iterencode(item):
                    yield chunk
                if i < len(obj) - 1:
                    yield ','
                yield '\n'
            
            self.indent_level -= 1
            yield '  ' * self.indent_level + ']'
        
        else:
            yield json.dumps(obj, ensure_ascii=False)


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
        seed_dir = project_root / 'seed-data' / 'collectibles'

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
                    # Use custom encoder for compact types array
                    output = ''.join(CompactJSONEncoder().iterencode(items))
                    f.write(output)

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