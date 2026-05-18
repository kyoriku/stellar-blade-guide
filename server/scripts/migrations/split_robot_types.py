import sys
from pathlib import Path
import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from db.database import engine


async def split_robot_types():
    async with AsyncSession(engine) as session:
        try:
            result = await session.execute(text(
                "SELECT name FROM collectible_types WHERE name = 'Tumbler Expansion Module'"
            ))
            if result.scalar_one_or_none():
                print("\033[93mRobot split already completed, skipping\033[0m")
                return

            # Rename Robot → Tumbler Expansion Module
            await session.execute(text(
                "UPDATE collectible_types SET name = 'Tumbler Expansion Module' WHERE name = 'Robot'"
            ))
            print("\033[92m✓ Renamed 'Robot' → 'Tumbler Expansion Module'\033[0m")

            # Create Drone Upgrade Module, Weapon Core, and Gear
            await session.execute(text("""
            INSERT INTO collectible_types (name, category_group, display_order)
            VALUES
                ('Drone Upgrade Module', 'upgrades', 5),
                ('Weapon Core', 'upgrades', 6),
                ('Gear', 'upgrades', 7)
            """))
            print("\033[92m✓ Created types: Drone Upgrade Module, Weapon Core, Gear\033[0m")

            await session.commit()
            print("\n\033[92m✓ Migration complete!\033[0m")

        except Exception as e:
            print(f"\033[91mError: {e}\033[0m")
            import traceback
            traceback.print_exc()
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(split_robot_types())