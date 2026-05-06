import sys
from pathlib import Path
import asyncio

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from db.database import engine

TYPE_SLUG_MAP = {
    # collectibles
    "Camp":                     "camps",
    "Can":                      "cans",
    "Document":                 "documents",
    "Memorystick":              "memorysticks",
    "Passcode":                 "passcodes",
    # upgrades
    "Beta Core":                "beta-cores",
    "Body Core":                "body-cores",
    "Exospine":                 "exospines",
    "Tumbler Expansion Module": "tumbler-expansion-modules",
    "Drone Upgrade Module":     "drone-upgrade-modules",
    "Weapon Core":              "weapon-cores",
    "Gear":                     "gear",
    # cosmetics
    "Earrings":                 "earrings",
    "Glasses":                  "glasses",
    "Nano Suit":                "nano-suits",
    "Drone Appearance":         "drone-appearances",
    "Lily Outfit":              "lily-outfits",
    "Adam Outfit":              "adam-outfits",
    "Hairstyle":                "hairstyles",
    # materials
    "Supply Box":               "supply-boxes",
    "Supply Chest":             "supply-chests",
}


async def add_type_slug():
    async with AsyncSession(engine) as session:
        try:
            # Step 1 — column existence check
            result = await session.execute(text("""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'collectible_types' AND column_name = 'slug'
            """))
            col_exists = result.scalar_one_or_none() is not None

            if col_exists:
                result = await session.execute(text(
                    "SELECT COUNT(*) FROM collectible_types WHERE slug IS NULL"
                ))
                null_count = result.scalar_one()
                if null_count == 0:
                    result = await session.execute(text(
                        "SELECT COUNT(*) FROM collectible_types"
                    ))
                    total = result.scalar_one()
                    print(f"\033[93mMigration already fully applied — {total}/{total} slugs present, column is NOT NULL\033[0m")
                    return
                print(f"Column exists with {null_count} NULL slug(s) — recovery run, re-populating...")
            else:
                # Step 2 — add nullable column
                await session.execute(text(
                    "ALTER TABLE collectible_types ADD COLUMN slug VARCHAR(100)"
                ))
                print("Added slug column (nullable)")

                # Step 3 — partial unique index
                await session.execute(text("""
                    CREATE UNIQUE INDEX IF NOT EXISTS collectible_types_slug_key
                    ON collectible_types (slug)
                    WHERE slug IS NOT NULL
                """))
                print("Created partial unique index on slug")

            # Step 4 — populate
            result = await session.execute(text(
                "SELECT id, name FROM collectible_types"
            ))
            rows = result.fetchall()

            missing = []
            populated = 0
            for row_id, name in rows:
                slug = TYPE_SLUG_MAP.get(name)
                if slug:
                    await session.execute(
                        text("UPDATE collectible_types SET slug = :slug WHERE id = :id"),
                        {"slug": slug, "id": row_id}
                    )
                    populated += 1
                else:
                    missing.append(name)

            if missing:
                raise RuntimeError(
                    f"No slug mapping for types: {missing}. "
                    "Update TYPE_SLUG_MAP and retry."
                )

            # Step 5 — verify
            result = await session.execute(text(
                "SELECT COUNT(*) FROM collectible_types WHERE slug IS NULL"
            ))
            null_count = result.scalar_one()
            if null_count > 0:
                raise RuntimeError(f"{null_count} rows still have NULL slug after population")

            # Step 6 — NOT NULL constraint
            await session.execute(text(
                "ALTER TABLE collectible_types ALTER COLUMN slug SET NOT NULL"
            ))

            await session.commit()
            print(f"\n\033[92m✓ Migration complete")
            print(f"  Populated {populated}/{len(rows)} slugs, slug column is NOT NULL\033[0m")

        except Exception as e:
            print(f"\033[91mError: {e}\033[0m")
            import traceback
            traceback.print_exc()
            await session.rollback()
            raise


if __name__ == "__main__":
    asyncio.run(add_type_slug())
