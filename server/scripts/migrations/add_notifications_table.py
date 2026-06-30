# scripts/migrations/add_notifications_table.py

import sys
from pathlib import Path
import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from db.database import engine


async def add_notifications_table():
    async with AsyncSession(engine) as session:
        try:
            result = await session.execute(text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_name = 'notifications'"
            ))
            if result.scalar_one_or_none():
                print("\033[93mnotifications table already exists, skipping\033[0m")
                return

            await session.execute(text("""
                CREATE TABLE notifications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    type VARCHAR(50) NOT NULL,
                    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
                    content_type VARCHAR(50) NOT NULL,
                    content_id INTEGER NOT NULL,
                    is_read BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """))
            await session.execute(text(
                "CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read)"
            ))
            await session.execute(text(
                "CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at)"
            ))
            await session.commit()
            print("\033[92mCreated notifications table\033[0m")

        except Exception as e:
            print(f"\033[91mError creating notifications table: {e}\033[0m")
            import traceback
            traceback.print_exc()
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(add_notifications_table())
