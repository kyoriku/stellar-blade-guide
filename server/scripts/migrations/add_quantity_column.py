import sys
from pathlib import Path
import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from db.database import engine


async def add_quantity_column():
    async with AsyncSession(engine) as session:
        try:
            result = await session.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'collectibles' AND column_name = 'quantity'"
            ))
            if result.scalar_one_or_none():
                print("\033[93mQuantity column already exists, skipping\033[0m")
                return

            await session.execute(text(
                "ALTER TABLE collectibles ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1"
            ))
            await session.commit()
            print("\033[92mAdded quantity column to collectibles table (default: 1)\033[0m")

        except Exception as e:
            print(f"\033[91mError adding quantity column: {e}\033[0m")
            import traceback
            traceback.print_exc()
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(add_quantity_column())