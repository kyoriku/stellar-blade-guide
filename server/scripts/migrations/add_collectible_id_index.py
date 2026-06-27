# scripts/migrations/add_collectible_id_index.py
#
# Adds an index on user_progress.collectible_id.
#
# Why: collectible_id has an ON DELETE CASCADE FK but no index. The composite
# uq_user_collectible index (user_id, collectible_id) cannot serve a
# collectible_id-leading lookup (PostgreSQL < 18 has no index skip scan), so
# deleting a collectible makes Postgres sequentially scan user_progress to find
# the rows to cascade-delete. This index protects that path.
#
# CREATE INDEX CONCURRENTLY caveats (why this script differs from the others):
#   * It CANNOT run inside a transaction block — Postgres raises
#     "CREATE INDEX CONCURRENTLY cannot run inside a transaction block". The other
#     migrations use `async with AsyncSession(engine)` (a transaction), which would
#     fail here, so this script runs the statement on an AUTOCOMMIT connection
#     instead (each statement is its own implicit transaction).
#   * If a CONCURRENTLY build is interrupted partway it leaves an INVALID index
#     behind. Re-running is safe thanks to IF NOT EXISTS, BUT an INVALID leftover
#     must be dropped first or it will linger unused:
#         DROP INDEX IF EXISTS ix_user_progress_collectible_id;
#     (find invalid indexes via:
#         SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;)
#   * The build is bounded by the engine's statement_timeout (10s) and asyncpg
#     command_timeout (10s). user_progress is small so this is fine; this script
#     SETs statement_timeout = 0 on its connection to be safe. If the table is ever
#     large enough that the asyncpg client command_timeout (a connect-time setting
#     on the shared engine) interrupts the build, run it through a dedicated engine
#     without command_timeout.

import sys
from pathlib import Path
import asyncio

from sqlalchemy import text

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from db.database import engine

INDEX_NAME = "ix_user_progress_collectible_id"
DDL = (
    f"CREATE INDEX CONCURRENTLY IF NOT EXISTS {INDEX_NAME} "
    "ON user_progress(collectible_id)"
)


async def add_collectible_id_index():
    # AUTOCOMMIT: CREATE INDEX CONCURRENTLY must not run inside a transaction block.
    async with engine.connect() as conn:
        conn = await conn.execution_options(isolation_level="AUTOCOMMIT")
        try:
            await conn.execute(text("SET statement_timeout = 0"))
            await conn.execute(text(DDL))
            print(f"\033[92m✓ Created index {INDEX_NAME} (CONCURRENTLY)\033[0m")
        except Exception as e:
            print(f"\033[91mError creating {INDEX_NAME}: {e}\033[0m")
            print(
                "\033[93mIf the build was interrupted, an INVALID index may remain. "
                f"Drop it before retrying:  DROP INDEX IF EXISTS {INDEX_NAME};\033[0m"
            )
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(add_collectible_id_index())
