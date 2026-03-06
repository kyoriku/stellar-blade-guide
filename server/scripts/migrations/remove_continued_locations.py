import sys
from pathlib import Path
import asyncio

from sqlalchemy import select, delete, update, text

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from db.database import engine, AsyncSessionLocal
from models.collectibles import Location, Level


# (continued) locations to remove, and display_order fixes needed after removal
# Format: { level_name: { location_name: None, ..., location_to_reorder: new_display_order } }
CONTINUED_LOCATIONS = [
    'Eidos 7 (Continued)',
    'Xion (Continued)',
    'Scrap Plains (Continued)',
    'Great Canyon (Continued)',
    'Wasteland (Continued)',
]

# display_order fixes per level after deletions
# Only Wasteland needs reordering — the others' (continued) locations were last in their block
DISPLAY_ORDER_FIXES = {
    'Wasteland': {
        'Plant': 7,
        'Forbidden Area': 8,
    }
}


async def migrate():
    async with AsyncSessionLocal() as db:
        try:
            print("\033[96m" + "─" * 60 + "\033[0m")
            print("\033[96mMigration: Remove (Continued) Locations\033[0m")
            print("\033[96m" + "─" * 60 + "\033[0m\n")

            # Fetch all levels for lookup
            levels = {
                l.name: l for l in (await db.execute(select(Level))).scalars()
            }

            # Step 1: Delete (continued) locations
            print("\033[96mStep 1: Deleting (continued) locations...\033[0m")
            for loc_name in CONTINUED_LOCATIONS:
                result = await db.execute(
                    select(Location).where(Location.name == loc_name)
                )
                loc = result.scalar_one_or_none()
                if loc:
                    await db.delete(loc)
                    print(f"  \033[33m✓ Deleted: {loc_name}\033[0m")
                else:
                    print(f"  \033[90m- Not found (already removed?): {loc_name}\033[0m")

            await db.commit()
            print()

            # Step 2: Fix display_orders
            print("\033[96mStep 2: Fixing display_orders...\033[0m")
            for level_name, fixes in DISPLAY_ORDER_FIXES.items():
                level = levels.get(level_name)
                if not level:
                    print(f"  \033[31m✗ Level not found: {level_name}\033[0m")
                    continue
                for loc_name, new_order in fixes.items():
                    result = await db.execute(
                        select(Location).where(
                            Location.level_id == level.id,
                            Location.name == loc_name
                        )
                    )
                    loc = result.scalar_one_or_none()
                    if loc:
                        old_order = loc.display_order
                        loc.display_order = new_order
                        print(f"  \033[32m✓ {level_name} / {loc_name}: {old_order} → {new_order}\033[0m")
                    else:
                        print(f"  \033[31m✗ Location not found: {level_name} / {loc_name}\033[0m")

            await db.commit()
            print()

            # Step 3: Rename Xion → Xion City
            print("\033[96mStep 3: Renaming 'Xion' location to 'Xion City'...\033[0m")
            xion_level = levels.get('Xion')
            if xion_level:
                result = await db.execute(
                    select(Location).where(
                        Location.level_id == xion_level.id,
                        Location.name == 'Xion'
                    )
                )
                loc = result.scalar_one_or_none()
                if loc:
                    loc.name = 'Xion City'
                    await db.commit()
                    print(f"  \033[32m✓ Xion → Xion City\033[0m")
                else:
                    print(f"  \033[90m- Not found (already renamed?)\033[0m")
            else:
                print(f"  \033[31m✗ Xion level not found\033[0m")
            print()

            # Step 4: Verify final state
            print("\033[96mStep 4: Verifying locations...\033[0m")
            for level_name in ['Eidos 7', 'Xion', 'Wasteland']:
                level = levels.get(level_name)
                if not level:
                    continue
                result = await db.execute(
                    select(Location)
                    .where(Location.level_id == level.id)
                    .order_by(Location.display_order)
                )
                locs = result.scalars().all()
                print(f"\n  {level_name}:")
                for loc in locs:
                    print(f"    {loc.display_order}. {loc.name}")

            print()
            print("\033[92m" + "─" * 60 + "\033[0m")
            print("\033[92m✓ Migration complete\033[0m")
            print("\033[92m" + "─" * 60 + "\033[0m")
            print()
            print("\033[96mNext steps:\033[0m")
            print("  1. Update xion.json: 'Xion' → 'Xion City' in all location fields")
            print("  2. Merge (continued) JSON files into main files")
            print("  3. Run renumber_ids.py")
            print("  4. Run seed_collectibles.py")

        except Exception as e:
            print(f"\033[31m✗ Migration failed: {e}\033[0m")
            import traceback
            traceback.print_exc()
            await db.rollback()


if __name__ == "__main__":
    asyncio.run(migrate())