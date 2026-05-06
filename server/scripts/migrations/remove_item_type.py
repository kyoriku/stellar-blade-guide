import sys
from pathlib import Path
import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from db.database import engine


async def remove_item_type():
    async with AsyncSession(engine) as session:
        try:
            # Step 0 — idempotency check
            result = await session.execute(
                text("SELECT id FROM collectible_types WHERE name = 'Item'")
            )
            item_id = result.scalar_one_or_none()
            if item_id is None:
                print('"Item" type not found — already removed, nothing to do')
                return

            print(f'Found "Item" type (id={item_id})')

            # Step 1 — collectibles whose ONLY type is "Item"
            result = await session.execute(text("""
                SELECT collectible_id
                FROM collectible_type_mappings
                WHERE collectible_id IN (
                    SELECT collectible_id FROM collectible_type_mappings WHERE type_id = :item_id
                )
                GROUP BY collectible_id
                HAVING COUNT(*) = 1
            """), {"item_id": item_id})
            item_only_ids = [row[0] for row in result.fetchall()]

            # Collectibles with Item among multiple types
            result = await session.execute(text("""
                SELECT COUNT(*) FROM collectible_type_mappings
                WHERE type_id = :item_id
                  AND collectible_id != ALL(:item_only_ids)
            """), {"item_id": item_id, "item_only_ids": item_only_ids or [0]})
            multi_type_count = result.scalar_one()

            print(f"  Collectibles with Item as only type:  {len(item_only_ids)}  → will be deleted")
            print(f"  Collectibles with Item among others:  {multi_type_count}  → mapping-only removal")

            # Delete item-only collectibles (cascades images + mappings)
            if item_only_ids:
                print(f"  Deleting {len(item_only_ids)} collectibles (cascades images + mappings)...", end=" ")
                await session.execute(
                    text("DELETE FROM collectibles WHERE id = ANY(:ids)"),
                    {"ids": item_only_ids}
                )
                print("done")

            # Step 2 — remove any remaining Item mappings (multi-type collectibles)
            print(f"  Removing {multi_type_count} orphaned Item mappings...", end=" ")
            await session.execute(
                text("DELETE FROM collectible_type_mappings WHERE type_id = :item_id"),
                {"item_id": item_id}
            )
            print("done")

            # Step 3 — delete the type row
            print("  Deleting \"Item\" type row...", end=" ")
            await session.execute(
                text("DELETE FROM collectible_types WHERE id = :item_id"),
                {"item_id": item_id}
            )
            print("done")

            await session.commit()
            print(f"\n\033[92m✓ Migration complete")
            print(f"  Removed: {len(item_only_ids)} collectibles, {multi_type_count} cross-type mappings, 1 type row\033[0m")

        except Exception as e:
            print(f"\033[91mError: {e}\033[0m")
            import traceback
            traceback.print_exc()
            await session.rollback()


if __name__ == "__main__":
    asyncio.run(remove_item_type())
