# import sys
# from pathlib import Path
# import asyncio

# from sqlalchemy import select
# from sqlalchemy.ext.asyncio import AsyncSession

# # Add project root
# project_root = Path(__file__).parent.parent.parent
# sys.path.insert(0, str(project_root))

# from db.database import get_db
# from models.walkthroughs import Walkthrough
# from core.cache import invalidate_cache_pattern


# async def seed_walkthroughs():
#     print("Seeding walkthroughs...\n")
    
#     async for db in get_db():  # AsyncSession generator
#         try:
#             # Delete existing walkthrough with id=1
#             result = await db.execute(select(Walkthrough).where(Walkthrough.id == 1))
#             existing = result.scalar_one_or_none()
#             if existing:
#                 print("\033[93mDeleting existing walkthrough...\033[0m")
#                 await db.delete(existing)
#                 await db.commit()

#             def slugify(text: str) -> str:
#               import re
#               text = text.lower()
#               text = re.sub(r'[^\w\s-]', '', text)
#               text = re.sub(r'[\s_]+', '-', text)
#               return text.strip('-')

#             # Star Descent walkthrough
#             star_descent = Walkthrough(
#                 id=1,
#                 slug=slugify("7th Airborne Squad"),
#                 title="7th Airborne Squad",
#                 subtitle="Star Descent",
#                 level="Eidos 7",
#                 mission_type="main-story",
#                 thumbnail_url="/assets/images/Eidos_7/Silent_Street/1_Passcode_r0ar0a_1.jpg",
#                 objectives=[
#                     "Follow Tachy to the Rendezvous Point"
#                 ],
#                 content=[
#                      {
#                 "order": 1,
#                 "section_title": "Tutorial - Basic Combat",
#                 "text": "After crash landing on Earth, Eve will be saved by her partner, Tachy. Start following her along the beach. Shortly after starting, you'll confront a few Thornheads - these are pretty basic creatures with two attacks, low health, and very little strength. Here you'll learn the two basic attack buttons: Square for Weak Attacks and Triangle for Heavy Attacks. You can combo them in different ways to perform unique attacks.",
#                 "tip": "Take your time with this tutorial section. You can check the tutorial menu anytime to review combo patterns.",
#                 "warning": None,
#                 "is_boss": False,
#                 "boss_info": None,
#                 "images": [
#                      {
#                         "url": "/assets/images/Eidos_7/Silent_Street/1_Passcode_r0ar0a_1.jpg",
#                         "alt": "Brute boss fight",
#                         "order": 1
#                     },
#                     {
#                         "url": "/assets/images/Eidos_7/Silent_Street/1_Passcode_r0ar0a_1.jpg",
#                         "alt": "Brute attack pattern",
#                         "order": 2
#                     }
#                 ]
#             },
#             {
#                 "order": 2,
#                 "section_title": "Tutorial - Parrying and Blocking",
#                 "text": "You'll then be introduced to a new enemy type called Beholders. These enemies attack with their blade-like right arm. Take the chance to get comfortable with the parrying and blocking mechanics, which you perform with L1. If you hold L1 well before being attacked, you'll block - this is better than taking the hit, but you'll still receive some damage and your Shield (the bar below your health) gets reduced. If you press L1 a few frames before the enemy attacks, you'll parry them, which mitigates all damage. Press the button at the perfect moment and you'll do a Perfect Parry, which hurts the enemy's balance (the yellow diamonds below their health bar) and leaves them open for a counter-attack.",
#                 "tip": "Perfect Parrying is one of the main mechanics of Stellar Blade. You don't need to master it right now, but start practicing early.",
#                 "warning": "If your Shield reaches zero, your HP becomes exposed to damage.",
#                 "is_boss": False,
#                 "boss_info": None,
#                 "images": [
#                                         {
#                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
#                         "alt": "Brute boss fight",
#                         "order": 1
#                     },
#                     {
#                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_2.jpg",
#                         "alt": "Brute attack pattern",
#                         "order": 2
#                     }
#                 ]
#             },
#             {
#                 "order": 3,
#                 "section_title": "Tutorial - Beta Skills",
#                 "text": "As more enemies appear, you'll be introduced to Beta Skills - special attacks you execute by holding L1 and an action button. Using them consumes your Beta Energy (the squares above your health bar), which recharges every time you successfully parry or attack an enemy. At this point, you can only perform L1 + Square and L1 + Triangle. You'll unlock more skills in the Skill Tree later in the game.",
#                 "tip": "Beta Skills are great for dealing with groups of enemies or breaking through tough defenses.",
#                 "warning": None,
#                 "is_boss": False,
#                 "boss_info": None,
#                 "images": [
#                                         {
#                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
#                         "alt": "Brute boss fight",
#                         "order": 1
#                     },
#                     {
#                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_2.jpg",
#                         "alt": "Brute attack pattern",
#                         "order": 2
#                     }
#                 ]
#             },
#             {
#                 "order": 4,
#                 "section_title": "Tutorial - Healing Items",
#                 "text": "You'll also learn about Potions (called Tumblers), which are your main healing items. You have three at the moment, but they can be expanded. The healing animation is long and cannot be cancelled - while you can walk around during it, you're completely exposed to enemy attacks.",
#                 "tip": None,
#                 "warning": "Always heal when you're safe. Enemies can still damage you during the healing animation.",
#                 "is_boss": False,
#                 "boss_info": None,
#                 "images": [
#                                         {
#                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
#                         "alt": "Brute boss fight",
#                         "order": 1
#                     },
#                     {
#                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_2.jpg",
#                         "alt": "Brute attack pattern",
#                         "order": 2
#                     }
#                 ]
#             },
#             {
#                 "order": 5,
#                 "section_title": "Sprint Sequence",
#                 "text": "Continue clearing enemies and running with Tachy while the buildings around you are coming down. This will be a short section where you learn to sprint. Missiles will be falling around you - watch for red circles on the ground and dodge them. After you steer clear of the falling debris, you'll encounter a short cutscene.",
#                 "tip": None,
#                 "warning": "Red circles on the ground indicate falling debris. Sprint past them or dodge.",
#                 "is_boss": False,
#                 "boss_info": None,
#                 "images": [
#                                         {
#                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
#                         "alt": "Brute boss fight",
#                         "order": 1
#                     },
#                     {
#                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_2.jpg",
#                         "alt": "Brute attack pattern",
#                         "order": 2
#                     }
#                 ]
#             },
#             {
#                 "order": 6,
#                 "section_title": "Boss Fight",
#                 "text": "You'll eventually reach a friendly group being attacked by a big enemy - Brute. This is your first boss fight. The Brute has two huge red balls as hands, which are its only weapons. It can attack in different ways: slow blows when it moves one hand next to the other, faster attacks when it leans its head, a belly lift attack where it moves forward, and spinning attacks when you hear a distinct snarl. When the boss' head flashes yellow, start running back - it will deal a forward blow with both arms that requires two dodges to avoid. When its head glows red, prepare for five consecutive attacks with small pauses between them.",
#                 "tip": "Losing this fight is completely fine - it's not required to win. Tachy will save the day if your HP is depleted, and the story will continue normally. Use this as practice for parrying.",
#                 "warning": "Yellow flash attacks cannot be parried - you must dodge. Red attacks are perfect for practicing Perfect Parries.",
#                 "is_boss": True,
#                 "boss_info": {
#                     "name": "Brute",
#                     "balance_diamonds": 9,
#                     "key_attacks": [
#                         "Slow Blow - Moves one hand next to the other while moving back slightly",
#                         "Fast Attack - Leans head slightly, attacks with the arm it moves first",
#                         "Belly Lift - Lifts one arm to belly, moves forward and attacks",
#                         "Double Spin - Makes distinct snarl, lifts arm above head, performs 2-3 spinning attacks",
#                         "Yellow Flash - Head flashes yellow, both arms slam forward (dodge back twice or run away)",
#                         "Red Flash Combo - Head glows red, 5 consecutive attacks (small pauses between first 3, last 2 almost simultaneous)"
#                     ]
#                 },
#                 "images": [
#                     {
#                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
#                         "alt": "Brute boss fight",
#                         "order": 1
#                     },
#                     {
#                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_2.jpg",
#                         "alt": "Brute attack pattern",
#                         "order": 2
#                     }
#                 ]
#             },
#             {
#                 "order": 7,
#                 "section_title": None,
#                 "text": "After the boss fight, watch the cinematic. You've completed the tutorial mission and will now unlock Xion, your home base.",
#                 "tip": None,
#                 "warning": None,
#                 "is_boss": False,
#                 "boss_info": None,
#                 "images": [
#                                         {
#                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
#                         "alt": "Brute boss fight",
#                         "order": 1
#                     },
#                     {
#                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_2.jpg",
#                         "alt": "Brute attack pattern",
#                         "order": 2
#                     }
#                 ]
#             },
#                 ],
#                 display_order=1,
#             )

#             db.add(star_descent)
#             await db.commit()
        
#         except Exception as e:
#             print(f"\033[31mError seeding walkthrough: {e}\033[0m")
#             import traceback
#             traceback.print_exc()
#             await db.rollback()

#     # Clear cache
#     print("\nClearing Redis cache...")
#     try:
#         await invalidate_cache_pattern("walkthrough:*")
#         print("\033[32mRedis cache cleared\033[0m")
#     except Exception as e:
#         print(f"\033[31mFailed to clear Redis cache: {e}\033[0m")

#     print("\n\033[32mWalkthrough seeded successfully\033[0m")


# if __name__ == "__main__":
#     asyncio.run(seed_walkthroughs())

import sys
from pathlib import Path
import json
import glob
import asyncio

from sqlalchemy import select

# Add project root
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from db.database import get_db
from models.walkthroughs import Walkthrough
from core.cache import invalidate_cache_pattern


def load_all_walkthrough_files():
    """Load all walkthrough JSON files from seed-data/walkthroughs/"""
    seed_dir = project_root / 'seed-data' / 'walkthroughs'
    if not seed_dir.exists():
        print("\033[31m✗ seed-data/walkthroughs directory not found!\033[0m")
        return []

    all_data = []
    json_files = sorted(glob.glob(str(seed_dir / '*' / '*.json')))
    print(f"Found {len(json_files)} walkthrough files\n")

    for json_file in json_files:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            all_data.append(data)
            rel_path = Path(json_file).relative_to(seed_dir)
            print(f"   {rel_path}: {data['title']}")
    
    return all_data


async def seed_walkthroughs():
    print("Seeding walkthroughs...\n")
    
    walkthrough_data = load_all_walkthrough_files()
    if not walkthrough_data:
        print("\033[31m✗ No walkthrough data found!\033[0m")
        return

    print(f"\nSeeding {len(walkthrough_data)} walkthroughs...\n")
    added = 0
    updated = 0
    errors = 0

    async for db in get_db():
        for item in walkthrough_data:
            try:
                walkthrough_id = item.get("id")
                
                # Check if walkthrough exists
                result = await db.execute(
                    select(Walkthrough).where(Walkthrough.id == walkthrough_id)
                )
                existing = result.scalar_one_or_none()

                if existing:
                    # Update existing
                    existing.slug = item["slug"]
                    existing.title = item["title"]
                    existing.subtitle = item.get("subtitle")
                    existing.level = item.get("level")
                    existing.mission_type = item["mission_type"]
                    existing.thumbnail_url = item.get("thumbnail_url")
                    existing.objectives = item.get("objectives")
                    existing.content = item["content"]
                    existing.display_order = item["display_order"]
                    updated += 1
                    print(f"\033[33m↻ Updated: {item['title']}\033[0m")
                else:
                    # Add new
                    new_walkthrough = Walkthrough(
                        id=walkthrough_id,
                        slug=item["slug"],
                        title=item["title"],
                        subtitle=item.get("subtitle"),
                        level=item.get("level"),
                        mission_type=item["mission_type"],
                        thumbnail_url=item.get("thumbnail_url"),
                        objectives=item.get("objectives"),
                        content=item["content"],
                        display_order=item["display_order"]
                    )
                    db.add(new_walkthrough)
                    added += 1
                    print(f"\033[32m✓ Added: {item['title']}\033[0m")

                await db.commit()

            except Exception as e:
                print(f"\033[31m✗ Error with '{item.get('title', 'Unknown')}': {e}\033[0m")
                import traceback
                traceback.print_exc()
                await db.rollback()
                errors += 1

    # Clear cache
    print("\nClearing Redis cache...")
    try:
        await invalidate_cache_pattern("walkthrough*")
        print("\033[32m✓ Redis cache cleared\033[0m")
    except Exception as e:
        print(f"\033[31m✗ Failed to clear Redis cache: {e}\033[0m")

    print(f"\n\033[32m✓ Seeding complete\033[0m")
    print(f"\033[32m✓ Added: {added}\033[0m")
    print(f"\033[32m✓ Updated: {updated}\033[0m")
    print(f"\033[31m✗ Errors: {errors}\033[0m" if errors else f"\033[32m✓ Errors: {errors}\033[0m")


if __name__ == "__main__":
    asyncio.run(seed_walkthroughs())