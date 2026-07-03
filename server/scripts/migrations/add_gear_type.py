import sys
from pathlib import Path
import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from app.db.database import engine


async def add_gear_type():
    async with AsyncSession(engine) as session:
        try:
            result = await session.execute(text(
                "SELECT name FROM collectible_types WHERE name = 'Gear'"
            ))
            if result.scalar_one_or_none():
                print("\033[93mGear type already exists, skipping\033[0m")
                return

            await session.execute(text(
                "INSERT INTO collectible_types (name, category_group, display_order) VALUES ('Gear', 'upgrades', 7)"
            ))
            await session.commit()
            print("\033[92m✓ Created type: Gear\033[0m")

        except Exception as e:
            print(f"\033[91mError: {e}\033[0m")
            import traceback
            traceback.print_exc()
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(add_gear_type())