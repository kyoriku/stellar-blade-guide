# scripts/migrations/drop_user_progress_user_id_index.py
#
# Drops the redundant standalone index ix_user_progress_user_id.
#
# Why: the composite unique index uq_user_collectible (user_id, collectible_id)
# already serves every lookup that filters on user_id (leading column), including
# the user-deletion ON DELETE CASCADE (DELETE FROM user_progress WHERE user_id = ?)
# and the get/sync reads. The standalone index is pure write/storage overhead.
#
# DROP INDEX CONCURRENTLY caveats (same shape as add_collectible_id_index.py):
#   * It CANNOT run inside a transaction block — so this script uses an AUTOCOMMIT
#     connection rather than the AsyncSession/transaction pattern of the other
#     migrations.
#   * If interrupted it can leave the index half-dropped / INVALID; re-running with
#     IF EXISTS is safe.
#   * Run this AFTER add_collectible_id_index.py so user_id-filtered reads are never
#     without a usable index (the composite covers them throughout, so ordering is
#     not strictly required, but it keeps the intent clear).

import sys
from pathlib import Path
import asyncio

from sqlalchemy import text

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from app.db.database import engine

INDEX_NAME = "ix_user_progress_user_id"
DDL = f"DROP INDEX CONCURRENTLY IF EXISTS {INDEX_NAME}"


async def drop_user_id_index():
    # AUTOCOMMIT: DROP INDEX CONCURRENTLY must not run inside a transaction block.
    async with engine.connect() as conn:
        conn = await conn.execution_options(isolation_level="AUTOCOMMIT")
        try:
            await conn.execute(text("SET statement_timeout = 0"))
            await conn.execute(text(DDL))
            print(f"\033[92m✓ Dropped index {INDEX_NAME} (CONCURRENTLY)\033[0m")
        except Exception as e:
            print(f"\033[91mError dropping {INDEX_NAME}: {e}\033[0m")
            print(
                "\033[93mIf the drop was interrupted, the index may be in an INVALID "
                f"state. Re-run this script (DROP INDEX IF EXISTS is idempotent).\033[0m"
            )
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(drop_user_id_index())
