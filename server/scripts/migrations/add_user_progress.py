# scripts/migrations/add_user_progress.py

import sys
from pathlib import Path
import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from db.database import engine


async def add_user_progress_table():
    async with AsyncSession(engine) as session:
        try:
            result = await session.execute(text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_name = 'user_progress'"
            ))
            if result.scalar_one_or_none():
                print("\033[93muser_progress table already exists, skipping\033[0m")
                return

            await session.execute(text("""
                CREATE TABLE user_progress (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    collectible_id INTEGER NOT NULL REFERENCES collectibles(id) ON DELETE CASCADE,
                    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    CONSTRAINT uq_user_collectible UNIQUE (user_id, collectible_id)
                )
            """))
            await session.execute(text(
                "CREATE INDEX ix_user_progress_user_id ON user_progress(user_id)"
            ))
            await session.commit()
            print("\033[92mCreated user_progress table\033[0m")

        except Exception as e:
            print(f"\033[91mError creating user_progress table: {e}\033[0m")
            import traceback
            traceback.print_exc()
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(add_user_progress_table())