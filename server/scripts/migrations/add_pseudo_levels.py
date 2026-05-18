import sys
from pathlib import Path
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from db.database import engine, Base, AsyncSessionLocal
from models.collectibles import Level, Location


async def add_pseudo_levels():
    async with AsyncSession(engine) as session:
        try:
            # Check if already added
            result = await session.execute(select(Level).where(Level.name == 'Default'))
            if result.scalar_one_or_none():
                print("\033[93mPseudo-levels already exist, skipping\033[0m")
                return

            # Add Default level (display_order=0, before Eidos 7)
            default_level = Level(name='Default', display_order=0)
            session.add(default_level)
            await session.flush()

            default_location = Location(
                level_id=default_level.id,
                name='Default',
                display_order=1
            )
            session.add(default_location)

            # Add Boss Challenge level (display_order=10, after Spire 4)
            boss_level = Level(name='Boss Challenge', display_order=10)
            session.add(boss_level)
            await session.flush()

            boss_location = Location(
                level_id=boss_level.id,
                name='Boss Challenge',
                display_order=1
            )
            session.add(boss_location)

            await session.commit()
            print("\033[92mAdded pseudo-levels: Default (order 0) and Boss Challenge (order 10)\033[0m")

        except Exception as e:
            print(f"\033[91mError adding pseudo-levels: {e}\033[0m")
            import traceback
            traceback.print_exc()
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(add_pseudo_levels())