import sys
from pathlib import Path
import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from app.db.database import engine


async def split_outfit_types():
    async with AsyncSession(engine) as session:
        try:
            result = await session.execute(text(
                "SELECT name FROM collectible_types WHERE name = 'Drone Appearance'"
            ))
            if result.scalar_one_or_none():
                print("\033[93mType split already completed, skipping\033[0m")
                return

            await session.execute(text(
                "UPDATE collectible_types SET name = 'Drone Appearance' WHERE name = 'Outfit'"
            ))
            print("\033[92m✓ Renamed 'Outfit' → 'Drone Appearance'\033[0m")

            await session.execute(text("""
                INSERT INTO collectible_types (name, category_group, display_order)
                VALUES
                    ('Lily Outfit', 'cosmetics', 5),
                    ('Adam Outfit', 'cosmetics', 6),
                    ('Hairstyle', 'cosmetics', 7)
            """))
            print("\033[92m✓ Created types: Lily Outfit, Adam Outfit, Hairstyle\033[0m")

            await session.commit()
            print("\n\033[92m✓ Migration complete!\033[0m")

        except Exception as e:
            print(f"\033[91mError: {e}\033[0m")
            import traceback
            traceback.print_exc()
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(split_outfit_types())