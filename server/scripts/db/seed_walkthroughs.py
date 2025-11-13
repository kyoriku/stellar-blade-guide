# # # import sys
# # # from pathlib import Path

# # # # Add project root to path
# # # project_root = Path(__file__).parent.parent.parent
# # # sys.path.insert(0, str(project_root))

# # # from app.core.database import get_db_session
# # # from app.models.walkthroughs import Walkthrough
# # # from app.core.cache import invalidate_cache_pattern

# # # def seed_walkthroughs():
# # #     """Seed walkthrough data"""
# # #     db = get_db_session()
    
# # #     # Check if already seeded
# # #     existing = db.query(Walkthrough).first()
# # #     if existing:
# # #         print("\033[93m⚠️  Walkthroughs already seeded. Skipping.\033[0m")
# # #         db.close()
# # #         return
    
# # #     # Star Descent walkthrough
# # #     star_descent = Walkthrough(
# # #         id=1,
# # #         type="main_story",
# # #         level="Eidos 7",
# # #         title="Star Descent",
# # #         subtitle="Chapter 1 - Opening Mission",
# # #         prerequisites=[],
# # #         rewards=["Tutorial Complete", "Unlock Xion"],
# # #         steps=[
# # #             {
# # #                 "step_number": 1,
# # #                 "instruction": "After crash landing on Earth, follow Tachy along the beach.",
# # #                 "type": "navigation",
# # #                 "notes": [
# # #                     {
# # #                         "type": "tip",
# # #                         "content": "This is a linear tutorial section. Take your time to learn the controls."
# # #                     }
# # #                 ],
# # #                 "images": []
# # #             },
# # #             {
# # #                 "step_number": 2,
# # #                 "instruction": "Defeat the Thornheads that block your path.",
# # #                 "type": "combat",
# # #                 "combat_info": {
# # #                     "enemies": ["Thornhead x3"],
# # #                     "recommended_level": 1,
# # #                     "difficulty": "tutorial",
# # #                     "strategy": "Basic enemies with two attacks, low health, and very little strength. Use Square for Weak Attacks and Triangle for Heavy Attacks. Practice different combos."
# # #                 },
# # #                 "notes": [
# # #                     {
# # #                         "type": "tip",
# # #                         "content": "Square = Weak Attack, Triangle = Heavy Attack. You can combo them in different ways (check the tutorial menu)."
# # #                     }
# # #                 ],
# # #                 "images": []
# # #             },
# # #             {
# # #                 "step_number": 3,
# # #                 "instruction": "Learn parrying and blocking mechanics against the Beholders.",
# # #                 "type": "combat",
# # #                 "combat_info": {
# # #                     "enemies": ["Beholder x2"],
# # #                     "recommended_level": 1,
# # #                     "difficulty": "tutorial",
# # #                     "strategy": "These enemies attack with their blade-like right arm. Practice the parrying/blocking mechanics using L1.",
# # #                     "key_mechanics": [
# # #                         "Hold L1 early = Block (reduced damage, but Shield depletes)",
# # #                         "Press L1 just before hit = Parry (no damage)",
# # #                         "Press L1 at perfect timing = Perfect Parry (damages enemy Balance)"
# # #                     ]
# # #                 },
# # #                 "notes": [
# # #                     {
# # #                         "type": "tip",
# # #                         "content": "Perfect Parrying is key to mastering Stellar Blade. Start practicing early even though it's not required yet."
# # #                     },
# # #                     {
# # #                         "type": "warning",
# # #                         "content": "If your Shield (bar below health) reaches zero, your HP becomes exposed to damage."
# # #                     }
# # #                 ],
# # #                 "images": []
# # #             },
# # #             {
# # #                 "step_number": 4,
# # #                 "instruction": "Learn Beta Skills as more enemies appear.",
# # #                 "type": "combat",
# # #                 "combat_info": {
# # #                     "enemies": ["Mixed enemies"],
# # #                     "recommended_level": 1,
# # #                     "difficulty": "tutorial",
# # #                     "strategy": "Use Beta Skills (L1 + Square or L1 + Triangle) to deal with groups. Beta Energy recharges when you parry or attack successfully."
# # #                 },
# # #                 "notes": [
# # #                     {
# # #                         "type": "tip",
# # #                         "content": "Beta Skills consume Beta Energy (squares above health bar). At this point you only have L1 + Square and L1 + Triangle. More skills unlock later in the Skill Tree."
# # #                     }
# # #                 ],
# # #                 "images": []
# # #             },
# # #             {
# # #                 "step_number": 5,
# # #                 "instruction": "Learn about Potions (Tumblers) - your main healing items.",
# # #                 "type": "objective",
# # #                 "notes": [
# # #                     {
# # #                         "type": "tip",
# # #                         "content": "You start with 3 Tumblers. They can be expanded later. The healing animation is long and cannot be cancelled - you're completely exposed while healing."
# # #                     },
# # #                     {
# # #                         "type": "warning",
# # #                         "content": "Always heal when safe. You can move during the animation but enemies can still hit you."
# # #                     }
# # #                 ],
# # #                 "images": []
# # #             },
# # #             {
# # #                 "step_number": 6,
# # #                 "instruction": "Continue clearing enemies and following Tachy through the collapsing area.",
# # #                 "type": "navigation",
# # #                 "notes": [
# # #                     {
# # #                         "type": "warning",
# # #                         "content": "Missiles will fall around you. Watch for red circles on the ground and dodge them."
# # #                     }
# # #                 ],
# # #                 "images": []
# # #             },
# # #             {
# # #                 "step_number": 7,
# # #                 "instruction": "Reach the friendly group being attacked and prepare for your first boss fight.",
# # #                 "type": "objective",
# # #                 "notes": [
# # #                     {
# # #                         "type": "warning",
# # #                         "content": "Boss fight ahead! Make sure you have healing items ready."
# # #                     }
# # #                 ],
# # #                 "images": []
# # #             },
# # #             {
# # #                 "step_number": 8,
# # #                 "instruction": "Boss Fight: Defeat the Brute.",
# # #                 "type": "boss",
# # #                 "combat_info": {
# # #                     "enemies": ["Brute"],
# # #                     "recommended_level": 1,
# # #                     "difficulty": "easy",
# # #                     "balance_diamonds": 9,
# # #                     "phases": 1,
# # #                     "strategy": "The Brute uses its two huge red ball-like hands to attack. Learn its patterns and practice Perfect Parries to break its Balance.",
# # #                     "key_attacks": [
# # #                         "Slow Blow - Moves one hand next to the other while moving back slightly",
# # #                         "Fast Attack - Leans head slightly, attacks with the arm it moves first",
# # #                         "Belly Lift - Lifts one arm to belly, moves forward and attacks",
# # #                         "Double Spin - Makes distinct snarl, lifts arm above head, performs 2-3 spinning attacks with pauses between",
# # #                         "Yellow Flash - Head flashes yellow, both arms slam forward (dodge back twice or run away)",
# # #                         "Red Flash Combo - Head glows red, performs 5 consecutive attacks (small pauses between first 3, last 2 are almost simultaneous)"
# # #                     ]
# # #                 },
# # #                 "notes": [
# # #                     {
# # #                         "type": "tip",
# # #                         "content": "Red attacks (when head glows red) are perfect opportunities to practice Perfect Parries and destroy the enemy's Balance. This Brute has 9 Balance diamonds."
# # #                     },
# # #                     {
# # #                         "type": "tip",
# # #                         "content": "For the Yellow Flash double slam, dodge backward twice or run away - a single dodge won't be enough."
# # #                     },
# # #                     {
# # #                         "type": "tip",
# # #                         "content": "If the Brute hits the ground before attacking, it will only deal one blow instead of the usual double slam."
# # #                     },
# # #                     {
# # #                         "type": "warning",
# # #                         "content": "Don't worry if you can't defeat the Brute - it's not required. Tachy will rescue you if your HP is depleted and the story will continue."
# # #                     },
# # #                     {
# # #                         "type": "tip",
# # #                         "content": "This is a great boss to practice parrying fundamentals. Later bosses will be much more challenging."
# # #                     }
# # #                 ],
# # #                 "images": []
# # #             },
# # #             {
# # #                 "step_number": 9,
# # #                 "instruction": "After the boss fight, watch the cinematic. Mission complete!",
# # #                 "type": "objective",
# # #                 "notes": [
# # #                     {
# # #                         "type": "tip",
# # #                         "content": "You've completed the tutorial mission and will now unlock Xion, your home base."
# # #                     }
# # #                 ],
# # #                 "images": []
# # #             }
# # #         ],
# # #         display_order=1
# # #     )
    
# # #     db.add(star_descent)
# # #     db.commit()
# # #     db.close()
    
# # #     # Clear cache
# # #     print("\nClearing Redis cache...")
# # #     try:
# # #         invalidate_cache_pattern("walkthroughs:*")
# # #         print("\033[32m✓ Redis cache cleared\033[0m")
# # #     except Exception as e:
# # #         print(f"\033[31m✗ Failed to clear Redis cache: {e}\033[0m")
    
# # #     print("\n\033[32m✓ Walkthrough seeded successfully\033[0m")

# # # if __name__ == "__main__":
# # #     print("Seeding walkthroughs...\n")
# # #     seed_walkthroughs()

# # import sys
# # from pathlib import Path

# # # Add project root to path
# # project_root = Path(__file__).parent.parent.parent
# # sys.path.insert(0, str(project_root))

# # from app.core.database import get_db_session
# # from app.models.walkthroughs import Walkthrough
# # from app.core.cache import invalidate_cache_pattern

# # def seed_walkthroughs():
# #     """Seed walkthrough data"""
# #     db = get_db_session()
    
# #     # Check if already seeded
# #     existing = db.query(Walkthrough).filter(Walkthrough.id == 1).first()
# #     if existing:
# #         print("\033[93mDeleting existing walkthrough...\033[0m")
# #         db.delete(existing)
# #         db.commit()
    
# #     # Star Descent walkthrough
# #     star_descent = Walkthrough(
# #         id=1,
# #         type="main_story",
# #         level="Eidos 7",
# #         title="Star Descent",
# #         subtitle="Chapter 1 - Opening Mission",
# #         prerequisites=[],
# #         rewards=["Tutorial Complete", "Unlock Xion"],
# #         steps=[
# #             {
# #                 "step_number": 1,
# #                 "instruction": "After crash landing on Earth, follow Tachy along the beach.",
# #                 "type": "navigation",
# #                 "notes": [
# #                     {
# #                         "type": "tip",
# #                         "content": "This is a linear tutorial section. Take your time to learn the controls."
# #                     }
# #                 ],
# #                 "images": [
# #                     {
# #                         "url": "/assets/images/Abyss_Levoire/3_Capsule_Cluster_Room/1_Legion_Supply_Box.jpg",
# #                         "alt": "Step 1 - Following Tachy on the beach",
# #                         "order": 1
# #                     },
# #                     {
# #                         "url": "/assets/images/Abyss_Levoire/3_Capsule_Cluster_Room/1_Legion_Supply_Box.jpg", 
# #                         "alt": "Step 1 - Beach overview",
# #                         "order": 2
# #                     },
# #                                         {
# #                         "url": "/assets/images/Abyss_Levoire/3_Capsule_Cluster_Room/1_Legion_Supply_Box.jpg", 
# #                         "alt": "Step 1 - Beach overview",
# #                         "order": 2
# #                     }
# #                 ]
# #             },
# #             {
# #                 "step_number": 2,
# #                 "instruction": "Defeat the Thornheads that block your path.",
# #                 "type": "combat",
# #                 "combat_info": {
# #                     "enemies": ["Thornhead x3"],
# #                     "recommended_level": 1,
# #                     "difficulty": "tutorial",
# #                     "strategy": "Basic enemies with two attacks, low health, and very little strength. Use Square for Weak Attacks and Triangle for Heavy Attacks. Practice different combos."
# #                 },
# #                 "notes": [
# #                     {
# #                         "type": "tip",
# #                         "content": "Square = Weak Attack, Triangle = Heavy Attack. You can combo them in different ways (check the tutorial menu)."
# #                     }
# #                 ],
# #                 "images": [
# #                     {
# #                         "url": "/assets/images/Abyss_Levoire/3_Capsule_Cluster_Room/1_Legion_Supply_Box.jpg",
# #                         "alt": "Combat area with Thornheads",
# #                         "order": 1
# #                     }
# #                 ]
# #             },
# #             {
# #                 "step_number": 3,
# #                 "instruction": "Learn parrying and blocking mechanics against the Beholders.",
# #                 "type": "combat",
# #                 "combat_info": {
# #                     "enemies": ["Beholder x2"],
# #                     "recommended_level": 1,
# #                     "difficulty": "tutorial",
# #                     "strategy": "These enemies attack with their blade-like right arm. Practice the parrying/blocking mechanics using L1.",
# #                     "key_mechanics": [
# #                         "Hold L1 early = Block (reduced damage, but Shield depletes)",
# #                         "Press L1 just before hit = Parry (no damage)",
# #                         "Press L1 at perfect timing = Perfect Parry (damages enemy Balance)"
# #                     ]
# #                 },
# #                 "notes": [
# #                     {
# #                         "type": "tip",
# #                         "content": "Perfect Parrying is key to mastering Stellar Blade. Start practicing early even though it's not required yet."
# #                     },
# #                     {
# #                         "type": "warning",
# #                         "content": "If your Shield (bar below health) reaches zero, your HP becomes exposed to damage."
# #                     }
# #                 ],
# #                 "images": [
# #                                         {
# #                         "url": "/assets/images/Abyss_Levoire/3_Capsule_Cluster_Room/1_Legion_Supply_Box.jpg",
# #                         "alt": "Combat area with Thornheads",
# #                         "order": 1
# #                     }
# #                 ]
# #             },
# #             {
# #                 "step_number": 4,
# #                 "instruction": "Learn Beta Skills as more enemies appear.",
# #                 "type": "combat",
# #                 "combat_info": {
# #                     "enemies": ["Mixed enemies"],
# #                     "recommended_level": 1,
# #                     "difficulty": "tutorial",
# #                     "strategy": "Use Beta Skills (L1 + Square or L1 + Triangle) to deal with groups. Beta Energy recharges when you parry or attack successfully."
# #                 },
# #                 "notes": [
# #                     {
# #                         "type": "tip",
# #                         "content": "Beta Skills consume Beta Energy (squares above health bar). At this point you only have L1 + Square and L1 + Triangle. More skills unlock later in the Skill Tree."
# #                     }
# #                 ],
# #                 "images": [
# #                                         {
# #                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
# #                         "alt": "Brute boss - Phase 1",
# #                         "order": 1
# #                     },
# #                     {
# #                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_2.jpg",
# #                         "alt": "Brute boss - Attack pattern",
# #                         "order": 2
# #                     }
# #                 ]
# #             },
# #             {
# #                 "step_number": 5,
# #                 "instruction": "Learn about Potions (Tumblers) - your main healing items.",
# #                 "type": "objective",
# #                 "notes": [
# #                     {
# #                         "type": "tip",
# #                         "content": "You start with 3 Tumblers. They can be expanded later. The healing animation is long and cannot be cancelled - you're completely exposed while healing."
# #                     },
# #                     {
# #                         "type": "warning",
# #                         "content": "Always heal when safe. You can move during the animation but enemies can still hit you."
# #                     }
# #                 ],
# #                 "images": [
# #                                         {
# #                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
# #                         "alt": "Brute boss - Phase 1",
# #                         "order": 1
# #                     },
# #                     {
# #                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_2.jpg",
# #                         "alt": "Brute boss - Attack pattern",
# #                         "order": 2
# #                     }
# #                 ]
# #             },
# #             {
# #                 "step_number": 6,
# #                 "instruction": "Continue clearing enemies and following Tachy through the collapsing area.",
# #                 "type": "navigation",
# #                 "notes": [
# #                     {
# #                         "type": "warning",
# #                         "content": "Missiles will fall around you. Watch for red circles on the ground and dodge them."
# #                     }
# #                 ],
# #                 "images": [
# #                                         {
# #                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
# #                         "alt": "Brute boss - Phase 1",
# #                         "order": 1
# #                     },
# #                     {
# #                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_2.jpg",
# #                         "alt": "Brute boss - Attack pattern",
# #                         "order": 2
# #                     }
# #                 ]
# #             },
# #             {
# #                 "step_number": 7,
# #                 "instruction": "Reach the friendly group being attacked and prepare for your first boss fight.",
# #                 "type": "objective",
# #                 "notes": [
# #                     {
# #                         "type": "warning",
# #                         "content": "Boss fight ahead! Make sure you have healing items ready."
# #                     }
# #                 ],
# #                 "images": [
# #                                         {
# #                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
# #                         "alt": "Brute boss - Phase 1",
# #                         "order": 1
# #                     },
# #                     {
# #                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_2.jpg",
# #                         "alt": "Brute boss - Attack pattern",
# #                         "order": 2
# #                     }
# #                 ]
# #             },
# #             {
# #                 "step_number": 8,
# #                 "instruction": "Boss Fight: Defeat the Brute.",
# #                 "type": "boss",
# #                 "combat_info": {
# #                     "enemies": ["Brute"],
# #                     "recommended_level": 1,
# #                     "difficulty": "easy",
# #                     "balance_diamonds": 9,
# #                     "phases": 1,
# #                     "strategy": "The Brute uses its two huge red ball-like hands to attack. Learn its patterns and practice Perfect Parries to break its Balance.",
# #                     "key_attacks": [
# #                         "Slow Blow - Moves one hand next to the other while moving back slightly",
# #                         "Fast Attack - Leans head slightly, attacks with the arm it moves first",
# #                         "Belly Lift - Lifts one arm to belly, moves forward and attacks",
# #                         "Double Spin - Makes distinct snarl, lifts arm above head, performs 2-3 spinning attacks with pauses between",
# #                         "Yellow Flash - Head flashes yellow, both arms slam forward (dodge back twice or run away)",
# #                         "Red Flash Combo - Head glows red, performs 5 consecutive attacks (small pauses between first 3, last 2 are almost simultaneous)"
# #                     ]
# #                 },
# #                 "notes": [
# #                     {
# #                         "type": "tip",
# #                         "content": "Red attacks (when head glows red) are perfect opportunities to practice Perfect Parries and destroy the enemy's Balance. This Brute has 9 Balance diamonds."
# #                     },
# #                     {
# #                         "type": "tip",
# #                         "content": "For the Yellow Flash double slam, dodge backward twice or run away - a single dodge won't be enough."
# #                     },
# #                     {
# #                         "type": "tip",
# #                         "content": "If the Brute hits the ground before attacking, it will only deal one blow instead of the usual double slam."
# #                     },
# #                     {
# #                         "type": "warning",
# #                         "content": "Don't worry if you can't defeat the Brute - it's not required. Tachy will rescue you if your HP is depleted and the story will continue."
# #                     },
# #                     {
# #                         "type": "tip",
# #                         "content": "This is a great boss to practice parrying fundamentals. Later bosses will be much more challenging."
# #                     }
# #                 ],
# #                 "images": [
# #                     {
# #                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
# #                         "alt": "Brute boss - Phase 1",
# #                         "order": 1
# #                     },
# #                     {
# #                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_2.jpg",
# #                         "alt": "Brute boss - Attack pattern",
# #                         "order": 2
# #                     }
# #                 ]
# #             },
# #             {
# #                 "step_number": 9,
# #                 "instruction": "After the boss fight, watch the cinematic. Mission complete!",
# #                 "type": "objective",
# #                 "notes": [
# #                     {
# #                         "type": "tip",
# #                         "content": "You've completed the tutorial mission and will now unlock Xion, your home base."
# #                     }
# #                 ],
# #                 "images": [
# #                                         {
# #                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
# #                         "alt": "Brute boss - Phase 1",
# #                         "order": 1
# #                     },
# #                 ]
# #             }
# #         ],
# #         display_order=1
# #     )
    
# #     db.add(star_descent)
# #     db.commit()
# #     db.close()
    
# #     # Clear cache
# #     print("\nClearing Redis cache...")
# #     try:
# #         invalidate_cache_pattern("walkthrough:*")
# #         print("\033[32m✓ Redis cache cleared\033[0m")
# #     except Exception as e:
# #         print(f"\033[31m✗ Failed to clear Redis cache: {e}\033[0m")
    
# #     print("\n\033[32m✓ Walkthrough seeded successfully\033[0m")

# # if __name__ == "__main__":
# #     print("Seeding walkthroughs...\n")
# #     seed_walkthroughs()

# import sys
# from pathlib import Path

# project_root = Path(__file__).parent.parent.parent
# sys.path.insert(0, str(project_root))

# from app.core.database import get_db_session
# from app.models.walkthroughs import Walkthrough
# from app.core.cache import invalidate_cache_pattern

# def seed_walkthroughs():
#     """Seed walkthrough data"""
#     db = get_db_session()
    
#     # Delete existing
#     existing = db.query(Walkthrough).filter(Walkthrough.id == 1).first()
#     if existing:
#         print("\033[93m⚠️  Deleting existing walkthrough...\033[0m")
#         db.delete(existing)
#         db.commit()
    
#     # Star Descent walkthrough
#     star_descent = Walkthrough(
#         id=1,
#         title="Star Descent",
#         subtitle="7th Airborne Squad",
#         level="Eidos 7",
#         mission_type="main_story",
#         objectives=[
#             "Follow Tachy to the Rendezvous Point"
#         ],
#         content=[
#             {
#                 "order": 1,
#                 "text": "After gaining control of Eve, follow Tachy to the Rendezvous point. Continue following her as you go through the game's main tutorial.",
#                 "is_boss": False,
#                 "images": [
#                                         {
#                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
#                         "alt": "Brute boss fight",
#                         "order": 1
#                     },
#                                         {
#                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
#                         "alt": "Brute boss fight",
#                         "order": 1
#                     },
#                 ]
#             },
#             {
#                 "order": 2,
#                 "text": "Once you gain access to sprinting, avoid the red marks on the floor. These indicate debris will fall and cause damage.",
#                 "is_boss": False,
#                 "images": [
#                                         {
#                         "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
#                         "alt": "Brute boss fight",
#                         "order": 1
#                     },
#                 ]
#             },
#             {
#                 "order": 3,
#                 "text": "After the sprinting sequence, prepare for a boss fight against Brute.",
#                 "is_boss": True,
#                 "boss_tips": [
#                     "Losing the fight will still progress the story",
#                     "Use the fight to practice parrying",
#                     "Yellow attacks cannot be parried - dodge instead"
#                 ],
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
#             }
#         ],
#         display_order=1
#     )
    
#     db.add(star_descent)
#     db.commit()
#     db.close()
    
#     # Clear cache
#     print("\nClearing Redis cache...")
#     try:
#         invalidate_cache_pattern("walkthrough:*")
#         print("\033[32m✓ Redis cache cleared\033[0m")
#     except Exception as e:
#         print(f"\033[31m✗ Failed to clear Redis cache: {e}\033[0m")
    
#     print("\n\033[32m✓ Walkthrough seeded successfully\033[0m")

# if __name__ == "__main__":
#     print("Seeding walkthroughs...\n")
#     seed_walkthroughs()

import sys
from pathlib import Path

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from app.core.database import get_db_session
from app.models.walkthroughs import Walkthrough
from app.core.cache import invalidate_cache_pattern

def seed_walkthroughs():
    """Seed walkthrough data"""
    db = get_db_session()
    
    # Delete existing
    existing = db.query(Walkthrough).filter(Walkthrough.id == 1).first()
    if existing:
        print("\033[93m⚠️  Deleting existing walkthrough...\033[0m")
        db.delete(existing)
        db.commit()
    
    # Star Descent walkthrough
    star_descent = Walkthrough(
        id=1,
        title="7th Airborne Squad",
        subtitle="Star Descent",
        level="Eidos 7",
        mission_type="main_story",
        objectives=[
            "Follow Tachy to the Rendezvous Point"
        ],
        content=[
            {
                "order": 1,
                "section_title": "Tutorial - Basic Combat",
                "text": "After crash landing on Earth, Eve will be saved by her partner, Tachy. Start following her along the beach. Shortly after starting, you'll confront a few Thornheads - these are pretty basic creatures with two attacks, low health, and very little strength. Here you'll learn the two basic attack buttons: Square for Weak Attacks and Triangle for Heavy Attacks. You can combo them in different ways to perform unique attacks.",
                "tip": "Take your time with this tutorial section. You can check the tutorial menu anytime to review combo patterns.",
                "warning": None,
                "is_boss": False,
                "boss_info": None,
                "images": [
                     {
                        "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
                        "alt": "Brute boss fight",
                        "order": 1
                    },
                    {
                        "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_2.jpg",
                        "alt": "Brute attack pattern",
                        "order": 2
                    }
                ]
            },
            {
                "order": 2,
                "section_title": "Tutorial - Parrying and Blocking",
                "text": "You'll then be introduced to a new enemy type called Beholders. These enemies attack with their blade-like right arm. Take the chance to get comfortable with the parrying and blocking mechanics, which you perform with L1. If you hold L1 well before being attacked, you'll block - this is better than taking the hit, but you'll still receive some damage and your Shield (the bar below your health) gets reduced. If you press L1 a few frames before the enemy attacks, you'll parry them, which mitigates all damage. Press the button at the perfect moment and you'll do a Perfect Parry, which hurts the enemy's balance (the yellow diamonds below their health bar) and leaves them open for a counter-attack.",
                "tip": "Perfect Parrying is one of the main mechanics of Stellar Blade. You don't need to master it right now, but start practicing early.",
                "warning": "If your Shield reaches zero, your HP becomes exposed to damage.",
                "is_boss": False,
                "boss_info": None,
                "images": [
                                        {
                        "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
                        "alt": "Brute boss fight",
                        "order": 1
                    },
                    {
                        "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_2.jpg",
                        "alt": "Brute attack pattern",
                        "order": 2
                    }
                ]
            },
            {
                "order": 3,
                "section_title": "Tutorial - Beta Skills",
                "text": "As more enemies appear, you'll be introduced to Beta Skills - special attacks you execute by holding L1 and an action button. Using them consumes your Beta Energy (the squares above your health bar), which recharges every time you successfully parry or attack an enemy. At this point, you can only perform L1 + Square and L1 + Triangle. You'll unlock more skills in the Skill Tree later in the game.",
                "tip": "Beta Skills are great for dealing with groups of enemies or breaking through tough defenses.",
                "warning": None,
                "is_boss": False,
                "boss_info": None,
                "images": [
                                        {
                        "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
                        "alt": "Brute boss fight",
                        "order": 1
                    },
                    {
                        "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_2.jpg",
                        "alt": "Brute attack pattern",
                        "order": 2
                    }
                ]
            },
            {
                "order": 4,
                "section_title": "Tutorial - Healing Items",
                "text": "You'll also learn about Potions (called Tumblers), which are your main healing items. You have three at the moment, but they can be expanded. The healing animation is long and cannot be cancelled - while you can walk around during it, you're completely exposed to enemy attacks.",
                "tip": None,
                "warning": "Always heal when you're safe. Enemies can still damage you during the healing animation.",
                "is_boss": False,
                "boss_info": None,
                "images": [
                                        {
                        "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
                        "alt": "Brute boss fight",
                        "order": 1
                    },
                    {
                        "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_2.jpg",
                        "alt": "Brute attack pattern",
                        "order": 2
                    }
                ]
            },
            {
                "order": 5,
                "section_title": "Sprint Sequence",
                "text": "Continue clearing enemies and running with Tachy while the buildings around you are coming down. This will be a short section where you learn to sprint. Missiles will be falling around you - watch for red circles on the ground and dodge them. After you steer clear of the falling debris, you'll encounter a short cutscene.",
                "tip": None,
                "warning": "Red circles on the ground indicate falling debris. Sprint past them or dodge.",
                "is_boss": False,
                "boss_info": None,
                "images": [
                                        {
                        "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
                        "alt": "Brute boss fight",
                        "order": 1
                    },
                    {
                        "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_2.jpg",
                        "alt": "Brute attack pattern",
                        "order": 2
                    }
                ]
            },
            {
                "order": 6,
                "section_title": "Boss Fight",
                "text": "You'll eventually reach a friendly group being attacked by a big enemy - Brute. This is your first boss fight. The Brute has two huge red balls as hands, which are its only weapons. It can attack in different ways: slow blows when it moves one hand next to the other, faster attacks when it leans its head, a belly lift attack where it moves forward, and spinning attacks when you hear a distinct snarl. When the boss' head flashes yellow, start running back - it will deal a forward blow with both arms that requires two dodges to avoid. When its head glows red, prepare for five consecutive attacks with small pauses between them.",
                "tip": "Losing this fight is completely fine - it's not required to win. Tachy will save the day if your HP is depleted, and the story will continue normally. Use this as practice for parrying.",
                "warning": "Yellow flash attacks cannot be parried - you must dodge. Red attacks are perfect for practicing Perfect Parries.",
                "is_boss": True,
                "boss_info": {
                    "name": "Brute",
                    "balance_diamonds": 9,
                    "key_attacks": [
                        "Slow Blow - Moves one hand next to the other while moving back slightly",
                        "Fast Attack - Leans head slightly, attacks with the arm it moves first",
                        "Belly Lift - Lifts one arm to belly, moves forward and attacks",
                        "Double Spin - Makes distinct snarl, lifts arm above head, performs 2-3 spinning attacks",
                        "Yellow Flash - Head flashes yellow, both arms slam forward (dodge back twice or run away)",
                        "Red Flash Combo - Head glows red, 5 consecutive attacks (small pauses between first 3, last 2 almost simultaneous)"
                    ]
                },
                "images": [
                    {
                        "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
                        "alt": "Brute boss fight",
                        "order": 1
                    },
                    {
                        "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_2.jpg",
                        "alt": "Brute attack pattern",
                        "order": 2
                    }
                ]
            },
            {
                "order": 7,
                "section_title": None,
                "text": "After the boss fight, watch the cinematic. You've completed the tutorial mission and will now unlock Xion, your home base.",
                "tip": None,
                "warning": None,
                "is_boss": False,
                "boss_info": None,
                "images": [
                                        {
                        "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg",
                        "alt": "Brute boss fight",
                        "order": 1
                    },
                    {
                        "url": "/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_2.jpg",
                        "alt": "Brute attack pattern",
                        "order": 2
                    }
                ]
            },
        ],
        display_order=1,
    )
    
    db.add(star_descent)
    db.commit()
    db.close()
    
    # Clear cache
    print("\nClearing Redis cache...")
    try:
        invalidate_cache_pattern("walkthrough:*")
        print("\033[32m✓ Redis cache cleared\033[0m")
    except Exception as e:
        print(f"\033[31m✗ Failed to clear Redis cache: {e}\033[0m")
    
    print("\n\033[32m✓ Walkthrough seeded successfully\033[0m")

if __name__ == "__main__":
    print("Seeding walkthroughs...\n")
    seed_walkthroughs()