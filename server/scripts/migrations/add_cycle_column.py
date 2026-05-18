import sys
from pathlib import Path
import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from db.database import engine


async def add_cycle_column():
    async with AsyncSession(engine) as session:
        try:
            result = await session.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'collectibles' AND column_name = 'cycle'"
            ))
            if result.scalar_one_or_none():
                print("\033[93mCycle column already exists, skipping\033[0m")
                return

            await session.execute(text(
                "ALTER TABLE collectibles ADD COLUMN cycle VARCHAR(10) NOT NULL DEFAULT 'Base'"
            ))
            await session.commit()
            print("\033[92mAdded cycle column to collectibles table (default: 'Base')\033[0m")

        except Exception as e:
            print(f"\033[91mError adding cycle column: {e}\033[0m")
            import traceback
            traceback.print_exc()
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(add_cycle_column())