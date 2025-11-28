import sys
from pathlib import Path
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Add project root
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from db.database import engine, Base, AsyncSessionLocal
from models.collectibles import Level, Location, CollectibleType
from models.walkthroughs import Walkthrough

async def seed_database():
    # 1 Create tables (sync inside async context)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("\033[92mTables created/verified\033[0m")

    # 2 Use a single session for the seeding process
    async with AsyncSession(engine) as session:
        try:
            # 2a️ Check if already seeded
            result = await session.execute(select(Level))
            if result.scalars().first():
                print("\033[93mDatabase already seeded, skipping\033[0m")
                return

            # 2b️ Insert Levels
            levels_data = [
                Level(name='Eidos 7', display_order=1),
                Level(name='Xion', display_order=2),
                Level(name='Wasteland', display_order=3),
                Level(name='Altess Levoire', display_order=4),
                Level(name='Matrix 11', display_order=5),
                Level(name='Great Desert', display_order=6),
                Level(name='Abyss Levoire', display_order=7),
                Level(name='Eidos 9', display_order=8),
                Level(name='Spire 4', display_order=9),
                # Level(name='Nest', display_order=10),
            ]
            
            session.add_all(levels_data)
            await session.flush()  # Assigns IDs without committing

            levels = {level.name: level for level in levels_data}  # Now levels[name].id works

            # 2c️ Insert Collectible Types
            types_data = [
                CollectibleType(name='Camp'),
                CollectibleType(name='Document'),
                CollectibleType(name='Can'),
                CollectibleType(name='Memorystick'),
                CollectibleType(name='Locked Chest'),
                CollectibleType(name='Supply Chest'),
                CollectibleType(name='Passcode'),
                CollectibleType(name='Robot'),
                CollectibleType(name='Supply Box'),
                CollectibleType(name='Beta Core'),
                CollectibleType(name='Nano Suit'),
                CollectibleType(name='Body Core'),
                CollectibleType(name='Earrings'),
                CollectibleType(name='Exospine'),
                CollectibleType(name='Outfit'),
                CollectibleType(name='Glasses'),
                CollectibleType(name='Item'),
            ]
            session.add_all(types_data)

            # Commit levels and types before fetching IDs
            await session.commit()

            # 2d️ Fetch Level objects for locations
            level_names = ['Eidos 7', 'Xion', 'Wasteland', 'Altess Levoire',
                           'Matrix 11', 'Great Desert', 'Abyss Levoire',
                           'Eidos 9', 'Spire 4']
            levels = {}
            for name in level_names:
                result = await session.execute(select(Level).where(Level.name == name))
                levels[name] = result.scalar_one()

            # 2e️ Insert Locations
            locations_data = [
                # Eidos 7
                Location(level_id=levels['Eidos 7'].id, name='Silent Street', display_order=1),
                Location(level_id=levels['Eidos 7'].id, name='Parking Tower', display_order=2),
                Location(level_id=levels['Eidos 7'].id, name='Abandoned Station', display_order=3),
                Location(level_id=levels['Eidos 7'].id, name='Flooded Commercial Sector', display_order=4),
                Location(level_id=levels['Eidos 7'].id, name='Memory Tower', display_order=5),
                Location(level_id=levels['Eidos 7'].id, name='Construction Zone', display_order=6),
                Location(level_id=levels['Eidos 7'].id, name='City Underground', display_order=7),
                Location(level_id=levels['Eidos 7'].id, name='Crater', display_order=8),
                Location(level_id=levels['Eidos 7'].id, name='Eidos 7 (Continued)', display_order=9),
                
                # Xion
                Location(level_id=levels['Xion'].id, name='Xion', display_order=1),
                Location(level_id=levels['Xion'].id, name='Xion (Continued)', display_order=2),

                # Wasteland
                Location(level_id=levels['Wasteland'].id, name='Barren Lands', display_order=1),
                Location(level_id=levels['Wasteland'].id, name='Great Canyon', display_order=2),
                Location(level_id=levels['Wasteland'].id, name='Scrap Plains', display_order=3),
                Location(level_id=levels['Wasteland'].id, name='Oil Storage Facility', display_order=4),
                Location(level_id=levels['Wasteland'].id, name='Scrap Yard', display_order=5),
                Location(level_id=levels['Wasteland'].id, name='Wasteland Basin', display_order=6),
                Location(level_id=levels['Wasteland'].id, name='Scrap Plains (Continued)', display_order=7),
                Location(level_id=levels['Wasteland'].id, name='Plant', display_order=8),
                Location(level_id=levels['Wasteland'].id, name='Great Canyon (Continued)', display_order=9),
                Location(level_id=levels['Wasteland'].id, name='Forbidden Area', display_order=10),
                Location(level_id=levels['Wasteland'].id, name='Wasteland (Continued)', display_order=11),

                # Altess Levoire
                Location(level_id=levels['Altess Levoire'].id, name='Research Lab Entrance', display_order=1),
                Location(level_id=levels['Altess Levoire'].id, name='Purification Scanner', display_order=2),
                Location(level_id=levels['Altess Levoire'].id, name='Security Center', display_order=3),
                Location(level_id=levels['Altess Levoire'].id, name='Sector A07', display_order=4),
                Location(level_id=levels['Altess Levoire'].id, name='Specimen Preservation Lab', display_order=5),
                Location(level_id=levels['Altess Levoire'].id, name='Top Secret Research Complex', display_order=6),
                Location(level_id=levels['Altess Levoire'].id, name='Deteriorated Lobby', display_order=7),
                Location(level_id=levels['Altess Levoire'].id, name='Air Vent', display_order=8),

                # Matrix 11
                Location(level_id=levels['Matrix 11'].id, name='Closed Off Platform', display_order=1),
                Location(level_id=levels['Matrix 11'].id, name='Landfill', display_order=2),
                Location(level_id=levels['Matrix 11'].id, name='Collapsed Rail Bridge', display_order=3),
                Location(level_id=levels['Matrix 11'].id, name='Underground Sewer', display_order=4),
                Location(level_id=levels['Matrix 11'].id, name='Rotten Labyrinth', display_order=5),
                Location(level_id=levels['Matrix 11'].id, name='Temporary Armoury', display_order=6),
                Location(level_id=levels['Matrix 11'].id, name='Train Graveyard', display_order=7),

                # Great Desert
                Location(level_id=levels['Great Desert'].id, name='Solar Tower', display_order=1),
                Location(level_id=levels['Great Desert'].id, name='Collapsed Overpass', display_order=2),
                Location(level_id=levels['Great Desert'].id, name='Buried Ruins', display_order=3),
                Location(level_id=levels['Great Desert'].id, name='Central Great Desert', display_order=4),
                Location(level_id=levels['Great Desert'].id, name='Northern Great Desert', display_order=5),
                Location(level_id=levels['Great Desert'].id, name='Oasis', display_order=6),

                # Abyss Levoire
                Location(level_id=levels['Abyss Levoire'].id, name='Emergency Exit', display_order=1),
                Location(level_id=levels['Abyss Levoire'].id, name='Closed Lobby', display_order=2),
                Location(level_id=levels['Abyss Levoire'].id, name='Capsule Cluster Room', display_order=3),
                Location(level_id=levels['Abyss Levoire'].id, name='Underground Passage', display_order=4),
                Location(level_id=levels['Abyss Levoire'].id, name='Laboratory Ruins', display_order=5),

                # Eidos 9
                Location(level_id=levels['Eidos 9'].id, name='Fallen Overpass', display_order=1),
                Location(level_id=levels['Eidos 9'].id, name='Submerged City', display_order=2),
                Location(level_id=levels['Eidos 9'].id, name='Atelier', display_order=3),

                # Spire 4
                Location(level_id=levels['Spire 4'].id, name='Orca Space Complex', display_order=1),
                Location(level_id=levels['Spire 4'].id, name='Hypertube', display_order=2),
                Location(level_id=levels['Spire 4'].id, name='Space Logistics Complex', display_order=3),
                Location(level_id=levels['Spire 4'].id, name='Raphael Space Centre', display_order=4),
                Location(level_id=levels['Spire 4'].id, name='Cargo Lift 121', display_order=5),
                Location(level_id=levels['Spire 4'].id, name='Maintenance Sector', display_order=6),
                Location(level_id=levels['Spire 4'].id, name='Tower Outer Wall', display_order=7),
                Location(level_id=levels['Spire 4'].id, name='Passenger Lift 161', display_order=8),
                Location(level_id=levels['Spire 4'].id, name='Prestige Lounge', display_order=9),
                Location(level_id=levels['Spire 4'].id, name='Vermillion Garden', display_order=10),
                Location(level_id=levels['Spire 4'].id, name='High Orbit Station', display_order=11),
                Location(level_id=levels['Spire 4'].id, name='Nest', display_order=12),
            ]
            session.add_all(locations_data)

            # Commit locations
            await session.commit()
            print("\033[92mDatabase seeded successfully\033[0m")

        except Exception as e:
            print(f"\033[91mError seeding database: {e}\033[0m")
            import traceback
            traceback.print_exc()
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(seed_database())
