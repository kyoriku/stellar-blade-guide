# scripts/migrations/add_nest_level_and_hidden_canyon.py

import sys
from pathlib import Path
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from db.database import engine
from models.collectibles import Level, Location


async def migrate():
    async with AsyncSession(engine) as session:
        try:
            # 1. Add Hidden Canyon to Wasteland
            result = await session.execute(select(Level).where(Level.name == 'Wasteland'))
            wasteland = result.scalar_one()

            result = await session.execute(
                select(Location).where(Location.level_id == wasteland.id, Location.name == 'Hidden Canyon')
            )
            if not result.scalar_one_or_none():
                session.add(Location(level_id=wasteland.id, name='Hidden Canyon', display_order=9))
                print("\033[92m✓ Added Hidden Canyon to Wasteland\033[0m")
            else:
                print("\033[93mHidden Canyon already exists in Wasteland, skipping\033[0m")

            # 2. Bump Boss Challenge to display_order 11
            result = await session.execute(select(Level).where(Level.name == 'Boss Challenge'))
            boss_challenge = result.scalar_one_or_none()
            if boss_challenge:
                boss_challenge.display_order = 11
                print("\033[92m✓ Bumped Boss Challenge to display_order 11\033[0m")

            # 3. Create Nest level at display_order 10
            result = await session.execute(select(Level).where(Level.name == 'Nest'))
            nest_level = result.scalar_one_or_none()
            if not nest_level:
                nest_level = Level(name='Nest', display_order=10)
                session.add(nest_level)
                await session.flush()
                print("\033[92m✓ Created Nest level (display_order 10)\033[0m")
            else:
                print("\033[93mNest level already exists, skipping\033[0m")

            # 4. Create Nest location under Nest level
            result = await session.execute(
                select(Location).where(Location.level_id == nest_level.id, Location.name == 'Nest')
            )
            if not result.scalar_one_or_none():
                session.add(Location(level_id=nest_level.id, name='Nest', display_order=1))
                print("\033[92m✓ Created Nest location under Nest level\033[0m")
            else:
                print("\033[93mNest location already exists, skipping\033[0m")

            # 5. Remove Nest location from Spire 4
            result = await session.execute(select(Level).where(Level.name == 'Spire 4'))
            spire_4 = result.scalar_one()

            result = await session.execute(
                select(Location).where(Location.level_id == spire_4.id, Location.name == 'Nest')
            )
            old_nest = result.scalar_one_or_none()
            if old_nest:
                await session.delete(old_nest)
                print("\033[92m✓ Removed Nest location from Spire 4\033[0m")
            else:
                print("\033[93mNo Nest location found in Spire 4, skipping\033[0m")

            await session.commit()
            print("\033[92mDone\033[0m")

        except Exception as e:
            print(f"\033[91mError: {e}\033[0m")
            import traceback
            traceback.print_exc()
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(migrate())