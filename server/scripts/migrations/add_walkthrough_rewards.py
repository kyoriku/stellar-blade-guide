import sys
from pathlib import Path
import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from app.db.database import engine

async def add_walkthrough_columns():
    async with AsyncSession(engine) as session:
        try:
            # Check and add rewards column
            result = await session.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'walkthroughs' AND column_name = 'rewards'"
            ))
            if result.scalar_one_or_none():
                print("\033[93mrewards column already exists, skipping\033[0m")
            else:
                await session.execute(text(
                    "ALTER TABLE walkthroughs ADD COLUMN rewards JSONB"
                ))
                print(
                    "\033[92mAdded rewards column to walkthroughs table\033[0m")

            # Check and add available_after column
            result = await session.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'walkthroughs' AND column_name = 'available_after'"
            ))
            if result.scalar_one_or_none():
                print(
                    "\033[93mavailable_after column already exists, skipping\033[0m")
            else:
                await session.execute(text(
                    "ALTER TABLE walkthroughs ADD COLUMN available_after VARCHAR(255)"
                ))
                print(
                    "\033[92mAdded available_after column to walkthroughs table\033[0m")

            await session.commit()

        except Exception as e:
            print(f"\033[91mError adding columns: {e}\033[0m")
            import traceback
            traceback.print_exc()
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(add_walkthrough_columns())
