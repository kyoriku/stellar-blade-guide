"""
Export walkthroughs from database to JSON files

Usage:
  python scripts/db/export_walkthroughs.py
"""
import sys
import os
import json
import asyncio
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from db.database import get_db
from models.walkthroughs import Walkthrough
from sqlalchemy import select


async def export_walkthroughs():
    print("Starting walkthrough export...\n")

    async for db in get_db():
        try:
            # Query all walkthroughs
            result = await db.execute(
                select(Walkthrough).order_by(Walkthrough.display_order)
            )
            walkthroughs = result.scalars().all()

            print(f"Found {len(walkthroughs)} walkthroughs\n")

            if len(walkthroughs) == 0:
                print("\033[31mNo walkthroughs found. Export aborted.\033[0m")
                return

            # Create directory structure
            seed_dir = project_root / 'seed-data' / 'walkthroughs'
            
            if seed_dir.exists():
                import shutil
                print("Removing existing walkthrough seed-data...")
                shutil.rmtree(seed_dir)

            seed_dir.mkdir(parents=True, exist_ok=True)

            # Export each walkthrough
            for w in walkthroughs:
                mission_type_dir = seed_dir / w.mission_type
                mission_type_dir.mkdir(exist_ok=True)

                file_path = mission_type_dir / f"{w.slug}.json"

                walkthrough_data = {
                    "id": w.id,
                    "slug": w.slug,
                    "title": w.title,
                    "subtitle": w.subtitle,
                    "level": w.level,
                    "mission_type": w.mission_type,
                    "thumbnail_url": w.thumbnail_url,
                    "objectives": w.objectives,
                    "content": w.content,
                    "display_order": w.display_order
                }

                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(walkthrough_data, f, indent=2, ensure_ascii=False)

                print(f"✓ {w.mission_type}/{w.slug}.json")

            print(f"\n\033[32m✓ Export complete!\033[0m")
            print(f"\033[32m✓ Exported {len(walkthroughs)} walkthroughs\033[0m")
            print(f"\033[32m✓ Location: {seed_dir}\033[0m")

        except Exception as e:
            print(f"\033[31m✗ Error: {e}\033[0m")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(export_walkthroughs())