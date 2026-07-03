import sys
import asyncio
from pathlib import Path
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from app.db.database import engine


async def add_subtype_column():
    async with AsyncSession(engine) as session:
        try:
            result = await session.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'collectibles' AND column_name = 'subtype'"
            ))
            if result.scalar_one_or_none():
                print("\033[33mSubtype column already exists, skipping\033[0m")
                return

            await session.execute(text(
                "ALTER TABLE collectibles ADD COLUMN subtype VARCHAR(50) NULL"
            ))
            await session.commit()
            print("\033[32mAdded subtype column to collectibles table\033[0m")

        except Exception as e:
            print(f"\033[31mError adding subtype column: {e}\033[0m")
            import traceback
            traceback.print_exc()
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(add_subtype_column())
