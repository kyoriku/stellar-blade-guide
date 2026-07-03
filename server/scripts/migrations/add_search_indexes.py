import sys
from pathlib import Path
import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from app.db.database import engine


async def add_search_indexes():
    async with AsyncSession(engine) as session:
        try:
            await session.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
            print("\033[92m✓ pg_trgm extension ready\033[0m")

            await session.execute(text(
                "CREATE INDEX IF NOT EXISTS ix_collectibles_fts "
                "ON collectibles USING GIN (to_tsvector('english', title))"
            ))
            await session.execute(text(
                "CREATE INDEX IF NOT EXISTS ix_walkthroughs_fts "
                "ON walkthroughs USING GIN ("
                "  to_tsvector('english', title || ' ' || COALESCE(subtitle, '')))"
            ))
            await session.execute(text(
                "CREATE INDEX IF NOT EXISTS ix_levels_fts "
                "ON levels USING GIN (to_tsvector('english', name))"
            ))
            print("\033[92m✓ FTS expression indexes created\033[0m")

            await session.execute(text(
                "CREATE INDEX IF NOT EXISTS ix_collectibles_trgm "
                "ON collectibles USING GIN (title gin_trgm_ops)"
            ))
            await session.execute(text(
                "CREATE INDEX IF NOT EXISTS ix_walkthroughs_trgm "
                "ON walkthroughs USING GIN (title gin_trgm_ops)"
            ))
            await session.execute(text(
                "CREATE INDEX IF NOT EXISTS ix_levels_trgm "
                "ON levels USING GIN (name gin_trgm_ops)"
            ))
            print("\033[92m✓ pg_trgm indexes created\033[0m")

            await session.commit()
            print("\033[92m✓ Search indexes committed\033[0m")

        except Exception as e:
            print(f"\033[91mError creating search indexes: {e}\033[0m")
            import traceback
            traceback.print_exc()
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(add_search_indexes())
