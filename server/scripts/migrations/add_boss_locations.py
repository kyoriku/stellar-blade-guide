# scripts/migrations/add_boss_locations.py

import sys
from pathlib import Path
import asyncio

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from db.database import engine
from models.collectibles import Level, Location


NEW_LOCATIONS = [
    ("Matrix 11", "Contaminated Water Purification Plant", 8),
    ("Altess Levoire", "Heart of the Infection", 9),
    ("Abyss Levoire", "Heart of the Contamination", 6),
]


async def add_boss_locations():
    async with AsyncSession(engine) as session:
        try:
            for level_name, location_name, display_order in NEW_LOCATIONS:
                # Get level
                result = await session.execute(
                    select(Level).where(Level.name == level_name)
                )
                level = result.scalar_one_or_none()
                if not level:
                    print(f"\033[91mLevel '{level_name}' not found, skipping\033[0m")
                    continue

                # Check if location already exists
                result = await session.execute(
                    select(Location).where(
                        Location.level_id == level.id,
                        Location.name == location_name,
                    )
                )
                if result.scalar_one_or_none():
                    print(f"\033[93m{location_name} already exists in {level_name}, skipping\033[0m")
                    continue

                session.add(Location(
                    level_id=level.id,
                    name=location_name,
                    display_order=display_order,
                ))
                print(f"\033[92m✓ Added {location_name} to {level_name} (order: {display_order})\033[0m")

            await session.commit()
            print(f"\033[92mDone\033[0m")

        except Exception as e:
            print(f"\033[91mError adding locations: {e}\033[0m")
            import traceback
            traceback.print_exc()
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(add_boss_locations())