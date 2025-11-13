import sys
import os
from pathlib import Path

# Add project root to path so we can import app modules
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from app.core.database import get_db_session, engine, Base
from app.models.collectibles import Level, Location, CollectibleType
from app.models.walkthroughs import Walkthrough

def seed_database():
    Base.metadata.create_all(bind=engine)
    print("\033[92m✓ Tables created/verified\033[0m")

    db = get_db_session()
    
    try:
        # Check if already seeded
        if db.query(Level).first():
            print("\033[93m⚠ Database already seeded, skipping\033[0m")
            return
        
        # Insert Levels
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
            Level(name='Nest', display_order=10),
        ]
        db.add_all(levels_data)
        db.commit()
        
        # Insert Collectible Types
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
        ]
        db.add_all(types_data)
        db.commit()
        
        # Get level IDs for locations
        eidos_7 = db.query(Level).filter_by(name='Eidos 7').first()
        xion = db.query(Level).filter_by(name='Xion').first()
        wasteland = db.query(Level).filter_by(name='Wasteland').first()
        altess = db.query(Level).filter_by(name='Altess Levoire').first()
        matrix = db.query(Level).filter_by(name='Matrix 11').first()
        desert = db.query(Level).filter_by(name='Great Desert').first()
        abyss = db.query(Level).filter_by(name='Abyss Levoire').first()
        eidos_9 = db.query(Level).filter_by(name='Eidos 9').first()
        spire = db.query(Level).filter_by(name='Spire 4').first()
        nest = db.query(Level).filter_by(name='Nest').first()
        
        # Insert Locations
        locations_data = [
            # Eidos 7
            Location(level_id=eidos_7.id, name='Silent Street', display_order=1),
            Location(level_id=eidos_7.id, name='Parking Tower', display_order=2),
            Location(level_id=eidos_7.id, name='Abandoned Station', display_order=3),
            Location(level_id=eidos_7.id, name='Flooded Commercial Sector', display_order=4),
            Location(level_id=eidos_7.id, name='Memory Tower', display_order=5),
            Location(level_id=eidos_7.id, name='Construction Zone', display_order=6),
            Location(level_id=eidos_7.id, name='City Underground', display_order=7),
            Location(level_id=eidos_7.id, name='Crater', display_order=8),
            Location(level_id=eidos_7.id, name='Eidos 7 (Continued)', display_order=9),
            
            # Xion
            Location(level_id=xion.id, name='Xion', display_order=1),
            Location(level_id=xion.id, name='Xion (Continued)', display_order=2),
            
            # Wasteland
            Location(level_id=wasteland.id, name='Barren Lands', display_order=1),
            Location(level_id=wasteland.id, name='Great Canyon', display_order=2),
            Location(level_id=wasteland.id, name='Scrap Plains', display_order=3),
            Location(level_id=wasteland.id, name='Oil Storage Facility', display_order=4),
            Location(level_id=wasteland.id, name='Scrap Yard', display_order=5),
            Location(level_id=wasteland.id, name='Wasteland Basin', display_order=6),
            Location(level_id=wasteland.id, name='Scrap Plains (Continued)', display_order=7),
            Location(level_id=wasteland.id, name='Plant', display_order=8),
            Location(level_id=wasteland.id, name='Great Canyon (Continued)', display_order=9),
            Location(level_id=wasteland.id, name='Forbidden Area', display_order=10),
            Location(level_id=wasteland.id, name='Wasteland (Continued)', display_order=11),
            
            # Altess Levoire
            Location(level_id=altess.id, name='Research Lab Entrance', display_order=1),
            Location(level_id=altess.id, name='Purification Scanner', display_order=2),
            Location(level_id=altess.id, name='Security Center', display_order=3),
            Location(level_id=altess.id, name='Sector A07', display_order=4),
            Location(level_id=altess.id, name='Specimen Preservation Lab', display_order=5),
            Location(level_id=altess.id, name='Top Secret Research Complex', display_order=6),
            Location(level_id=altess.id, name='Deteriorated Lobby', display_order=7),
            Location(level_id=altess.id, name='Air Vent', display_order=8),
            
            # Matrix 11
            Location(level_id=matrix.id, name='Closed Off Platform', display_order=1),
            Location(level_id=matrix.id, name='Landfill', display_order=2),
            Location(level_id=matrix.id, name='Collapsed Rail Bridge', display_order=3),
            Location(level_id=matrix.id, name='Underground Sewer', display_order=4),
            Location(level_id=matrix.id, name='Rotten Labyrinth', display_order=5),
            Location(level_id=matrix.id, name='Temporary Armoury', display_order=6),
            Location(level_id=matrix.id, name='Train Graveyard', display_order=7),
            
            # Great Desert
            Location(level_id=desert.id, name='Solar Tower', display_order=1),
            Location(level_id=desert.id, name='Collapsed Overpass', display_order=2),
            Location(level_id=desert.id, name='Buried Ruins', display_order=3),
            Location(level_id=desert.id, name='Central Great Desert', display_order=4),
            Location(level_id=desert.id, name='Northern Great Desert', display_order=5),
            Location(level_id=desert.id, name='Oasis', display_order=6),
            
            # Abyss Levoire
            Location(level_id=abyss.id, name='Emergency Exit', display_order=1),
            Location(level_id=abyss.id, name='Closed Lobby', display_order=2),
            Location(level_id=abyss.id, name='Capsule Cluster Room', display_order=3),
            Location(level_id=abyss.id, name='Underground Passage', display_order=4),
            Location(level_id=abyss.id, name='Laboratory Ruins', display_order=5),
            
            # Eidos 9
            Location(level_id=eidos_9.id, name='Fallen Overpass', display_order=1),
            Location(level_id=eidos_9.id, name='Submerged City', display_order=2),
            Location(level_id=eidos_9.id, name='Atelier', display_order=3),
            
            # Spire 4
            Location(level_id=spire.id, name='Orca Space Complex', display_order=1),
            Location(level_id=spire.id, name='Hypertube', display_order=2),
            Location(level_id=spire.id, name='Space Logistics Complex', display_order=3),
            Location(level_id=spire.id, name='Raphael Space Centre', display_order=4),
            Location(level_id=spire.id, name='Cargo Lift 121', display_order=5),
            Location(level_id=spire.id, name='Maintenance Sector', display_order=6),
            Location(level_id=spire.id, name='Tower Outer Wall', display_order=7),
            Location(level_id=spire.id, name='Passenger Lift 161', display_order=8),
            Location(level_id=spire.id, name='Prestige Lounge', display_order=9),
            Location(level_id=spire.id, name='Vermillion Garden', display_order=10),
            Location(level_id=spire.id, name='High Orbit Station', display_order=11),
            
            # Nest
            Location(level_id=nest.id, name='Nest', display_order=1),
        ]
        db.add_all(locations_data)
        db.commit()
        
        print("\033[92m✓ Database seeded successfully\033[0m")
        
    except Exception as e:
        print(f"\033[91m✗ Error seeding database: {e}\033[0m")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()