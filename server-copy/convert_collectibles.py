import psycopg2
import json
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

# Your Silent Street collectibles data (converted from JS to Python)
silent_street_data = [
    {
        "id": 1,
        "title": "Passcode - Eidos 7 - r0ar0a",
        "text": "In the first garage/storage room on the left on Silent Street, where the Creepers crash out of the wall.",
        "type": "Passcode",
        "level": "Eidos 7",
        "location": "Silent Street",
        "images": [
            {"id": 1, "src": "/assets/images/Eidos7/1-SilentStreet/1-Passcode - r0ar0a.1.jpg", "alt": "Passcode - Eidos 7 - r0ar0a"},
            {"id": 2, "src": "/assets/images/Eidos7/1-SilentStreet/1-Passcode - r0ar0a.2.jpg", "alt": "Passcode - Eidos 7 - r0ar0a"},
        ],
    },
    {
        "id": 2,
        "title": "Memorystick - Legionnaire 451's Resolution",
        "text": "After going through the gate, climb up to the right and follow that path to the end for this collectible.",
        "type": "Memorystick",
        "level": "Eidos 7",
        "location": "Silent Street",
        "images": [
            {"id": 3, "src": "/assets/images/Eidos7/1-SilentStreet/2-Memorystick - Legionnaire 451s resolution.1.jpg", "alt": "Memorystick - Legionnaire 451's Resolution"},
            {"id": 4, "src": "/assets/images/Eidos7/1-SilentStreet/2-Memorystick - Legionnaire 451s resolution.2.jpg", "alt": "Memorystick - Legionnaire 451's Resolution"},
        ],
    },
    {
        "id": 3,
        "title": "Robot - Tumbler Expansion Module",
        "text": "Southeast from where you are, follow the alleyway to the end and there'll be a robot there to destroy for loot.",
        "type": "Robot",
        "level": "Eidos 7",
        "location": "Silent Street",
        "images": [
            {"id": 5, "src": "/assets/images/Eidos7/1-SilentStreet/3-Robot 1.jpg", "alt": "Robot - Tumbler Expansion Module"}
        ],
    },
    {
        "id": 4,
        "title": "Legion Supply Box",
        "text": "In the water after passing through the gate.",
        "type": "Supply Box",
        "level": "Eidos 7",
        "location": "Silent Street",
        "images": [
            {"id": 6, "src": "/assets/images/Eidos7/1-SilentStreet/4-Crate 1.jpg", "alt": "Legion Supply Box"}
        ],
    },
    {
        "id": 5,
        "title": "Legion Camp",
        "text": "Back on Silent Street, down there on the left, near to where you just went swimming",
        "type": "Camp",
        "level": "Eidos 7",
        "location": "Silent Street",
        "images": [
            {"id": 7, "src": "/assets/images/Eidos7/1-SilentStreet/5-Legion Camp 1.jpg", "alt": "Legion Camp"}
        ],
    },
    {
        "id": 6,
        "title": "Legion Supply Box",
        "text": "To the left of the bridge in a garage, before going across, where you fight your first Cricket Slasher - hit the car and loot the for the Micro Drive.",
        "type": "Supply Box",
        "level": "Eidos 7",
        "location": "Silent Street",
        "images": [
            {"id": 8, "src": "/assets/images/Eidos7/1-SilentStreet/6-Crate 2.jpg", "alt": "Legion Supply Box"}
        ],
    },
    {
        "id": 7,
        "title": "Legion Supply Box",
        "text": "To the left, when you're halfway across the bridge. Jump over the gap to reach the rooftops and follow to the back.",
        "type": "Supply Box",
        "level": "Eidos 7",
        "location": "Silent Street",
        "images": [
            {"id": 9, "src": "/assets/images/Eidos7/1-SilentStreet/7-Crate 3.1.jpg", "alt": "Legion Supply Box"},
            {"id": 10, "src": "/assets/images/Eidos7/1-SilentStreet/7-Crate 3.2.jpg", "alt": "Legion Supply Box"},
        ],
    },
    {
        "id": 8,
        "title": "Legion Supply Box",
        "text": "To the left of the bridge, drop down, kill the two Cricket Slashers and then the Hydra and open the box to the north. Inside is an Omnibolt, the Combo Attack Enhancement Gear (+14%).",
        "type": "Supply Box",
        "level": "Eidos 7",
        "location": "Silent Street",
        "images": [
            {"id": 11, "src": "/assets/images/Eidos7/1-SilentStreet/8-Crate 4.jpg", "alt": "Legion Supply Box"}
        ],
    },
    {
        "id": 9,
        "title": "Legion Supply Box",
        "text": "To the right after the bridge, near where the Scan tutorial. Climb up near the scaffolding on the right hand side of the road to the top.",
        "type": "Supply Box",
        "level": "Eidos 7",
        "location": "Silent Street",
        "images": [
            {"id": 12, "src": "/assets/images/Eidos7/1-SilentStreet/9-Crate 5.1.jpg", "alt": "Legion Supply Box"},
            {"id": 13, "src": "/assets/images/Eidos7/1-SilentStreet/9-Crate 5.2.jpg", "alt": "Legion Supply Box"},
        ],
    },
    {
        "id": 10,
        "title": "Beta Core",
        "text": "After the ambush with the Mutated Creeper, Creepers and finally the Heavy Guardian, head down the alley to the north-northeast corner and follow it round to the left. There, near a Guardian, is the Beta Core (needed to upgrade your max beta energy).",
        "type": "Beta Core",
        "level": "Eidos 7",
        "location": "Silent Street",
        "images": [
            {"id": 14, "src": "/assets/images/Eidos7/1-SilentStreet/10-Beta Core 1.jpg", "alt": "Beta Core"}
        ],
    },
    {
        "id": 11,
        "title": "Legion Supply Box",
        "text": "Where the ambush took place, head up to the top of the building in the southeast, using the yellow ledges on the southeast wall.",
        "type": "Supply Box",
        "level": "Eidos 7",
        "location": "Silent Street",
        "images": [
            {"id": 15, "src": "/assets/images/Eidos7/1-SilentStreet/11-Crate 6.1.jpg", "alt": "Legion Supply Box"},
            {"id": 16, "src": "/assets/images/Eidos7/1-SilentStreet/11-Crate 6.2.jpg", "alt": "Legion Supply Box"},
        ],
    },
    {
        "id": 12,
        "title": "Memorystick - The Last Words of the Hopeless / Passcode - B0ak0r",
        "text": "Head the correct way after the ambush, and as you get onto the balcony, and before you grab onto the poles, there's a corpse on your left with this passcode and memorystick.",
        "type": "Memorystick",
        "level": "Eidos 7",
        "location": "Silent Street",
        "images": [
            {"id": 17, "src": "/assets/images/Eidos7/1-SilentStreet/12-Memorystick & Passcode (The Last Words of the Hopeless) - B0ak0r.jpg", "alt": "Memorystick - The Last Words of the Hopeless / Passcode - B0ak0r"}
        ],
    },
    {
        "id": 13,
        "title": "Legion Supply Box",
        "text": "In the caged off area in the water section with the ladder. There's a hole in the fence you can use to get in.",
        "type": "Supply Box",
        "level": "Eidos 7",
        "location": "Silent Street",
        "images": [
            {"id": 19, "src": "/assets/images/Eidos7/1-SilentStreet/13-Crate 7.jpg", "alt": "Legion Supply Box"}
        ],
    },
    {
        "id": 14,
        "title": "Memorystick - Louis's Testimony",
        "text": "In the same area as the water and the ladder, climb up the yellow ledges on the northwest wall of the building at the far end. There's a human corpse on the roof.",
        "type": "Memorystick",
        "level": "Eidos 7",
        "location": "Silent Street",
        "images": [
            {"id": 21, "src": "/assets/images/Eidos7/1-SilentStreet/14-Memorystick (Louis Testimony).1.jpg", "alt": "Memorystick - Louis's Testimony"},
            {"id": 22, "src": "/assets/images/Eidos7/1-SilentStreet/14-Memorystick (Louis Testimony).2.jpg", "alt": "Memorystick - Louis's Testimony"},
        ],
    },
    {
        "id": 15,
        "title": "Legion Camp",
        "text": "Up the ladder from the water will be a camp straight ahead.",
        "type": "Camp",
        "level": "Eidos 7",
        "location": "Silent Street",
        "images": [
            {"id": 23, "src": "/assets/images/Eidos7/1-SilentStreet/15-Legion Camp 2.jpg", "alt": "Legion Camp"}
        ],
    },
    {
        "id": 16,
        "title": "Locked Supply Chest",
        "text": "From the camp, head down the ladder and go west to Barker Drugs. The chest is in there.",
        "type": "Locked Chest",
        "level": "Eidos 7",
        "location": "Silent Street",
        "images": [
            {"id": 24, "src": "/assets/images/Eidos7/1-SilentStreet/16-Locked Chest & Memory Stick.1.jpg", "alt": "Locked Legion Chest"},
            {"id": 25, "src": "/assets/images/Eidos7/1-SilentStreet/16-Locked Chest 1.2.jpg", "alt": "Locked Legion Chest"},
        ],
    },
    {
        "id": 17,
        "title": "Memorystick - Lament of Despair",
        "text": "On a corpse in the back of the same room as the locked chest",
        "type": "Memorystick",
        "level": "Eidos 7",
        "location": "Silent Street",
        "images": [
            {"id": 26, "src": "/assets/images/Eidos7/1-SilentStreet/17-Memorystick (Lament of Despair).jpg", "alt": "Memorystick - Lament of Despair"}
        ],
    },
    {
        "id": 18,
        "title": "Document - Series - Plastic Hearts, Vol. 3",
        "text": "After heading through the door (using the Fusion Cell), head left, defeat the Barnacle, and this document is a book on the shelf in the southeast corner.",
        "type": "Document",
        "level": "Eidos 7",
        "location": "Silent Street",
        "images": [
            {"id": 27, "src": "/assets/images/Eidos7/1-SilentStreet/18-Document - Series (Plastic Hearts, Volume 3).jpg", "alt": "Document - Series - Plastic Hearts, Vol. 3"}
        ],
    },
]

def convert_to_sql():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # Get location_id for "Silent Street" in "Eidos 7"
    cur.execute("""
        SELECT loc.id 
        FROM locations loc
        JOIN levels lev ON loc.level_id = lev.id
        WHERE lev.name = %s AND loc.name = %s
    """, ("Eidos 7", "Silent Street"))
    
    location_result = cur.fetchone()
    if not location_result:
        print("ERROR: Location not found!")
        return
    
    location_id = location_result[0]
    
    # Get all collectible types
    cur.execute("SELECT id, name FROM collectible_types")
    type_mapping = {row[1]: row[0] for row in cur.fetchall()}
    
    cur.close()
    conn.close()
    
    # Generate SQL
    sql_output = []
    sql_output.append("-- Silent Street Collectibles\n")
    
    for item in silent_street_data:
        # Get type_id
        type_id = type_mapping.get(item['type'])
        if not type_id:
            print(f"WARNING: Type '{item['type']}' not found for collectible: {item['title']}")
            continue
        
        # Format description as JSONB
        if isinstance(item['text'], list):
            description = json.dumps({"type": "list", "items": item['text']})
        else:
            description = json.dumps({"type": "text", "content": item['text']})
        
        # Escape single quotes in strings
        title = item['title'].replace("'", "''")
        description = description.replace("'", "''")
        
        # Insert collectible
        sql_output.append(f"""
INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES ({location_id}, {type_id}, '{title}', '{description}', {item['id']})
RETURNING id;
""")
        
        # Insert images (we'll use placeholder URLs for now since you haven't uploaded to Cloudinary yet)
        for img_index, img in enumerate(item['images'], 1):
            alt_text = img['alt'].replace("'", "''")
            cloudinary_url = img['src'].replace("'", "''")
            
            sql_output.append(f"""
INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = '{title}' AND location_id = {location_id} AND display_order = {item['id']}), 
        '{cloudinary_url}', '{alt_text}', {img_index});
""")
    # Write to file
    with open('sql/silent_street_collectibles.sql', 'w') as f:
        f.write(''.join(sql_output))
    
    print(f"✅ Generated SQL for {len(silent_street_data)} collectibles!")
    print("📄 Saved to: sql/silent_street_collectibles.sql")
    print("\nTo import, run:")
    print("psql stellarblade < sql/silent_street_collectibles.sql")

if __name__ == "__main__":
    convert_to_sql()