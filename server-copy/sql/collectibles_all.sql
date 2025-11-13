-- All Stellar Blade Collectibles

-- Spire 4 - Cargo Lift 121

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (56, 1, 'Legion Camp', '{"type": "text", "content": " On the left as you enter the lift."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 56 AND display_order = 1), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/1_Legion_Camp.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (56, 12, 'Robot - Tumbler Expansion Module', '{"type": "text", "content": "Push the yellow crate up to the blue crate near it and climb to the top. Follow it northwest to this robot"}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 56 AND display_order = 2), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/2_Robot_Tumbler_Expansion_Module_1.jpg', 'Robot - Tumbler Expansion Module', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 56 AND display_order = 2), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/2_Robot_Tumbler_Expansion_Module_2.jpg', 'Robot - Tumbler Expansion Module', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 56 AND display_order = 2), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/2_Robot_Tumbler_Expansion_Module_3.jpg', 'Robot - Tumbler Expansion Module', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 56 AND display_order = 2), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/2_Robot_Tumbler_Expansion_Module_4.jpg', 'Robot - Tumbler Expansion Module', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (56, 13, 'Legion Supply Box', '{"type": "text", "content": "In the southwest corner, on the ground level."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 56 AND display_order = 3), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/3_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (56, 4, 'Memorystick - Legionnaire 759''s Resignation', '{"type": "text", "content": "From the supply box turn around and go in that hole in the side of the storage. Move one of the yellow crates on the right so you can get through the hole in the wall, where the Legion is."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 759''s Resignation' AND location_id = 56 AND display_order = 4), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/4_Memorystick_Legionnaire_759''s_Resignation_1.jpg', 'Memorystick - Legionnaire 759''s Resignation', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 759''s Resignation' AND location_id = 56 AND display_order = 4), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/4_Memorystick_Legionnaire_759''s_Resignation_2.jpg', 'Memorystick - Legionnaire 759''s Resignation', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 759''s Resignation' AND location_id = 56 AND display_order = 4), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/4_Memorystick_Legionnaire_759''s_Resignation_3.jpg', 'Memorystick - Legionnaire 759''s Resignation', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (56, 5, 'Locked Supply Chest', '{"type": "text", "content": "In the northwest corner, under the stairs, push the yellow box forward so you can climb over."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 56 AND display_order = 5), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/5_Locked_Supply_Chest_1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 56 AND display_order = 5), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/5_Locked_Supply_Chest_2.jpg', 'Locked Supply Chest', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 56 AND display_order = 5), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/5_Locked_Supply_Chest_3.jpg', 'Locked Supply Chest', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (56, 17, 'Body Core', '{"type": "text", "content": "Go out through the door at the top, take a left, and go to the top of the stairs. Instead of going left, go down the lift. The body is under the stairs."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 56 AND display_order = 6), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/6_Body_Core_1.jpg', 'Body Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 56 AND display_order = 6), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/6_Body_Core_2.jpg', 'Body Core', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 56 AND display_order = 6), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/6_Body_Core_3.jpg', 'Body Core', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (56, 22, 'Glasses - Large Round', '{"type": "text", "content": "Climb the elevator shaft to the top and go all the way to the northeast and drop down. The glasses are inside that box."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Glasses - Large Round' AND location_id = 56 AND display_order = 7), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/7_Glasses_Large_Round_1.jpg', 'Glasses - Large Round', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Glasses - Large Round' AND location_id = 56 AND display_order = 7), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/7_Glasses_Large_Round_2.jpg', 'Glasses - Large Round', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Glasses - Large Round' AND location_id = 56 AND display_order = 7), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/7_Glasses_Large_Round_3.jpg', 'Glasses - Large Round', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (56, 4, 'Memorystick - Legionnaire 761''s Request', '{"type": "text", "content": "Go back up the lift and carry on to the objective. This one is right in the next room off the previous corridor."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 761''s Request' AND location_id = 56 AND display_order = 8), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/8_Memorystick_Legionnaire_761''s_Request.jpg', 'Memorystick - Legionnaire 761''s Request', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (56, 4, 'Memorystick - Legionnaire 760''s Memory', '{"type": "text", "content": "Head through the first Machine Hive and then head northeast through the next one. The body is behind the second one."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 760''s Memory' AND location_id = 56 AND display_order = 9), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/9_Memorystick_Legionnaire_760''s_Memory.jpg', 'Memorystick - Legionnaire 760''s Memory', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (56, 4, 'Memorystick - Legionnaire 743''s Shock', '{"type": "text", "content": "Head further in and you''ll come across the body with this memorystick."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 743''s Shock' AND location_id = 56 AND display_order = 10), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/10_Memorystick_Legionnaire_743''s_Shock.jpg', 'Memorystick - Legionnaire 743''s Shock', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (56, 4, 'Memorystick - John''s Retrospection', '{"type": "text", "content": "Go round the corner, start a fight on the 2 Lumps, and another will join in behind you., there''s another body under the staircase."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - John''s Retrospection' AND location_id = 56 AND display_order = 11), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/11_Memorystick_John''s_Retrospection.jpg', 'Memorystick - John''s Retrospection', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (56, 4, 'Memorystick - Legionnaire 719''s Memory', '{"type": "text", "content": "Return to where that third Lump came from and you''ll find this memorystick."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 719''s Memory' AND location_id = 56 AND display_order = 12), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/12_Memorystick_Legionnaire_719''s_Memory.jpg', 'Memorystick - Legionnaire 719''s Memory', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (56, 13, 'Legion Supply Box', '{"type": "text", "content": "Head southeast and round the corner to the right. The chest is there."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 56 AND display_order = 13), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/13_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (56, 13, 'Legion Supply Box', '{"type": "text", "content": "Head up the stairs in the previous room and jump onto the containers. Then, go through the gaps in the southwest wall and head to the far south for this chest. Contains Omnibolt and Burst Enhancement Gear."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 56 AND display_order = 14), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/14_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 56 AND display_order = 14), 
        '/assets/images/Spire_4/5_Cargo_Lift_121/14_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

-- Spire 4 - High Orbit Station

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (62, 14, 'Beta Core', '{"type": "text", "content": "As soon as you reach the top of the elevator shaft, instantly turn to the left to find a corpse with the Beta Core."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 62 AND display_order = 1), 
        '/assets/images/Spire_4/11_High_Orbit_Station/1_Beta_Core.jpg', 'Beta Core', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (62, 1, 'Supply Camp', '{"type": "text", "content": "There''s a supply camp on the right side of the same room as the Beta Core."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp' AND location_id = 62 AND display_order = 2), 
        '/assets/images/Spire_4/11_High_Orbit_Station/2_Supply_Camp.jpg', 'Supply Camp', 1);

-- Spire 4 - Hypertube

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (53, 14, 'Beta Core', '{"type": "text", "content": "Straight ahead when you enter the room, if you jump out and to the right, around the wall, you can grab this now."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 53 AND display_order = 1), 
        '/assets/images/Spire_4/2_Hypertube/1_Beta_Core_1.jpg', 'Beta Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 53 AND display_order = 1), 
        '/assets/images/Spire_4/2_Hypertube/1_Beta_Core_2.jpg', 'Beta Core', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (53, 13, 'Legion Supply Box', '{"type": "text", "content": "Head back, and in the northeast corner, near a droid, is a suppl box. Contains Omnibolt and Melee Protection Gear (3 star)."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 53 AND display_order = 2), 
        '/assets/images/Spire_4/2_Hypertube/2_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 53 AND display_order = 2), 
        '/assets/images/Spire_4/2_Hypertube/2_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (53, 5, 'Locked Supply Chest', '{"type": "text", "content": "Go down the ladder near to where the Beta Core is, and there''s a cache opposite it."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 53 AND display_order = 3), 
        '/assets/images/Spire_4/2_Hypertube/3_Locked_Supply_Chest.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (53, 4, 'Memorystick - Legionnaire 798''s Advice', '{"type": "text", "content": "Down below, to the left of the second power machine."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 798''s Advice' AND location_id = 53 AND display_order = 4), 
        '/assets/images/Spire_4/2_Hypertube/4_Memorystick_Legionnaire_798''s_Advice.jpg', 'Memorystick - Legionnaire 798''s Advice', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (53, 13, 'Legion Supply Box', '{"type": "text", "content": "South-southeast from the generator. Behind the fence. In the main downstairs area."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 53 AND display_order = 5), 
        '/assets/images/Spire_4/2_Hypertube/5_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (53, 12, 'Robot - Tumbler Expansion Module', '{"type": "text", "content": "Directly south is a robot, hiding super close by."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 53 AND display_order = 6), 
        '/assets/images/Spire_4/2_Hypertube/6_Robot_Tumbler_Expansion_Module_1.jpg', 'Robot - Tumbler Expansion Module', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 53 AND display_order = 6), 
        '/assets/images/Spire_4/2_Hypertube/6_Robot_Tumbler_Expansion_Module_2.jpg', 'Robot - Tumbler Expansion Module', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (53, 13, 'Legion Supply Box', '{"type": "text", "content": "Up the stairs, on the way to the final generator."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 53 AND display_order = 7), 
        '/assets/images/Spire_4/2_Hypertube/7_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 53 AND display_order = 7), 
        '/assets/images/Spire_4/2_Hypertube/7_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (53, 13, 'Legion Supply Box', '{"type": "text", "content": "After the brief boss fight and hypertube section, head into the southeast corner and there''s a supply box there."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 53 AND display_order = 8), 
        '/assets/images/Spire_4/2_Hypertube/8_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 53 AND display_order = 8), 
        '/assets/images/Spire_4/2_Hypertube/8_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (53, 4, 'Memorystick - Legionnaire 708''s Shout', '{"type": "text", "content": "Next to the staircase that leads up to the way out."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 708''s Shout' AND location_id = 53 AND display_order = 9), 
        '/assets/images/Spire_4/2_Hypertube/9_Memorystick_Legionnaire_708''s_Shout_1.jpg', 'Memorystick - Legionnaire 708''s Shout', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 708''s Shout' AND location_id = 53 AND display_order = 9), 
        '/assets/images/Spire_4/2_Hypertube/9_Memorystick_Legionnaire_708''s_Shout_2.jpg', 'Memorystick - Legionnaire 708''s Shout', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (53, 1, 'Supply Camp - Space Logistics Complex Entrance', '{"type": "text", "content": "Next to the door on the way out of the area."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Space Logistics Complex Entrance' AND location_id = 53 AND display_order = 10), 
        '/assets/images/Spire_4/2_Hypertube/10_Supply_Camp_Space_Logistics_Complex_Entrance.jpg', 'Supply Camp - Space Logistics Complex Entrance', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (53, 15, 'Nano Suit - Orca Engineer', '{"type": "text", "content": "Behind the Supply Camp (east side)."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Orca Engineer' AND location_id = 53 AND display_order = 11), 
        '/assets/images/Spire_4/2_Hypertube/11_Nano_Suit_Orca_Engineer_1.jpg', 'Nano Suit - Orca Engineer', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Orca Engineer' AND location_id = 53 AND display_order = 11), 
        '/assets/images/Spire_4/2_Hypertube/11_Nano_Suit_Orca_Engineer_2.jpg', 'Nano Suit - Orca Engineer', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (53, 3, 'Can - Milky Pop', '{"type": "text", "content": "Upstairs in the southeast corner of the large warehouse (before leaving through the door out of the area), after the brief boss figh with Belial."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Milky Pop' AND location_id = 53 AND display_order = 12), 
        '/assets/images/Spire_4/2_Hypertube/12_Can_Milky_Pop_1.jpg', 'Can - Milky Pop', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Milky Pop' AND location_id = 53 AND display_order = 12), 
        '/assets/images/Spire_4/2_Hypertube/12_Can_Milky_Pop_2.jpg', 'Can - Milky Pop', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Milky Pop' AND location_id = 53 AND display_order = 12), 
        '/assets/images/Spire_4/2_Hypertube/12_Can_Milky_Pop_3.jpg', 'Can - Milky Pop', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (53, 4, 'Memorystick - Legionnaire 721''s Plea', '{"type": "text", "content": "When you finally leave the area, this corpse is in the airlock of sorts."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 721''s Plea' AND location_id = 53 AND display_order = 13), 
        '/assets/images/Spire_4/2_Hypertube/13_Memorystick_Legionnaire_721''s_Plea.jpg', 'Memorystick - Legionnaire 721''s Plea', 1);

-- Spire 4 - Maintenance Sector

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (57, 1, 'Legion Camp', '{"type": "text", "content": "Once you reach the Maintenance Sector, you can reach the camp by going across the beams on the right end of the room."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 57 AND display_order = 1), 
        '/assets/images/Spire_4/6_Maintenance_Sector/1_Legion_Camp.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (57, 13, 'Legion Supply Box', '{"type": "text", "content": "From the camp, go across the wall running section and follow the swing bars to the next floor. The crate will be to your right once you''re on the next floor."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 57 AND display_order = 2), 
        '/assets/images/Spire_4/6_Maintenance_Sector/2_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 57 AND display_order = 2), 
        '/assets/images/Spire_4/6_Maintenance_Sector/2_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

-- Spire 4 - Nest

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (63, 1, 'Legion Camp', '{"type": "text", "content": "When back on earth, going to fight the Elder Naytiba, this camp is on the left after you see the message from Raven."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 63 AND display_order = 1), 
        '/assets/images/Spire_4/12_Nest/1_Legion_Camp_Hidden_Canyon_1.jpg', 'Legion Camp', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 63 AND display_order = 1), 
        '/assets/images/Spire_4/12_Nest/1_Legion_Camp_Hidden_Canyon_2.jpg', 'Legion Camp', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (63, 1, 'Supply Camp', '{"type": "text", "content": "In the nest on the right."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp' AND location_id = 63 AND display_order = 2), 
        '/assets/images/Spire_4/12_Nest/2_Supply_Camp_Nest.jpg', 'Supply Camp', 1);

-- Spire 4 - Orca Space Complex

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (52, 1, 'Legion Camp - Space Complex Entryway', '{"type": "text", "content": "By the Tetrapod at the start of the level."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - Space Complex Entryway' AND location_id = 52 AND display_order = 1), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/1_Legion_Camp_Space_Complex_Entryway.jpg', 'Legion Camp - Space Complex Entryway', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (52, 4, 'Memorystick - Legionnaire 753''s Memory', '{"type": "text", "content": "Inside the cave once you dive underwater, there will be a corpse with the memory stick."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 753''s Memory' AND location_id = 52 AND display_order = 2), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/2_Memorystick_Legionnaire_753''s_Memory_1.jpg', 'Memorystick - Legionnaire 753''s Memory', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 753''s Memory' AND location_id = 52 AND display_order = 2), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/2_Memorystick_Legionnaire_753''s_Memory_2.jpg', 'Memorystick - Legionnaire 753''s Memory', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (52, 4, 'Memorystick - Legionnaire 717''s Order', '{"type": "text", "content": "In the next area, near the dam, next to some Houndborgs."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 717''s Order' AND location_id = 52 AND display_order = 3), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/3_Memorystick_Legionnaire_717''s_Order.jpg', 'Memorystick - Legionnaire 717''s Order', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (52, 4, 'Memorystick - Legionnaire 742''s Complaint', '{"type": "text", "content": "Head through the door underneath the waterwall. Also contains the passcode: L0rnKy."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 742''s Complaint' AND location_id = 52 AND display_order = 4), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/4_Memorystick_Legionnaire_742''s_Complaint_1.jpg', 'Memorystick - Legionnaire 742''s Complaint', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 742''s Complaint' AND location_id = 52 AND display_order = 4), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/4_Memorystick_Legionnaire_742''s_Complaint_2.jpg', 'Memorystick - Legionnaire 742''s Complaint', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (52, 16, 'Drone Apperance - Lop Bunny Pack', '{"type": "text", "content": "Climb the pillar in the northeast and in the pipe you''ll find this drone pack."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Drone Apperance - Lop Bunny Pack' AND location_id = 52 AND display_order = 5), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/5_Drone_Pack_Lop_Bunny_1.jpg', 'Drone Pack - Lop Bunny Pack', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Drone Apperance - Lop Bunny Pack' AND location_id = 52 AND display_order = 5), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/5_Drone_Pack_Lop_Bunny_2.jpg', 'Drone Pack - Lop Bunny Pack', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (52, 1, 'Legion Camp', '{"type": "text", "content": "Up the ladders in the far corner, leading up to the water controls."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 52 AND display_order = 6), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/6_Legion_Camp_1.jpg', 'Legion Camp', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 52 AND display_order = 6), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/6_Legion_Camp_2.jpg', 'Legion Camp', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (52, 4, 'Memorystick - Legionnaire 712''s Memory', '{"type": "text", "content": "Once you''ve made it through the door into the facility, when the corridor forks, the left one has this memorystick in it."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 712''s Memory' AND location_id = 52 AND display_order = 7), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/7_Memorystick_Legionnaire_712''s_Memory_1.jpg', 'Memorystick - Legionnaire 712''s Memory', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 712''s Memory' AND location_id = 52 AND display_order = 7), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/7_Memorystick_Legionnaire_712''s_Memory_2.jpg', 'Memorystick - Legionnaire 712''s Memory', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (52, 13, 'Legion Supply Box', '{"type": "text", "content": "There''s also a crate to shoot down above it."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 52 AND display_order = 8), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/8_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 52 AND display_order = 8), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/8_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (52, 13, 'Legion Supply Box', '{"type": "text", "content": "At the end of the corridor, before going up the stairs to the Body Core (the next collectible)."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 52 AND display_order = 9), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/9_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 52 AND display_order = 9), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/9_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (52, 17, 'Body Core', '{"type": "text", "content": "Now go up the stairs and there''s a human at the end of the path with this core. In some shallow water."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 52 AND display_order = 10), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/10_Body_Core_1.jpg', 'Body Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 52 AND display_order = 10), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/10_Body_Core_2.jpg', 'Body Core', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (52, 4, 'Memorystick - Legionnaire 466''s Memory', '{"type": "text", "content": "On the correct route, just down the rocks from where the actual route is taking you."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 466''s Memory' AND location_id = 52 AND display_order = 11), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/11_Memorystick_Legionnaire_466''s_Memory_1.jpg', 'Memorystick - Legionnaire 466''s Memory', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 466''s Memory' AND location_id = 52 AND display_order = 11), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/11_Memorystick_Legionnaire_466''s_Memory_2.jpg', 'Memorystick - Legionnaire 466''s Memory', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 466''s Memory' AND location_id = 52 AND display_order = 11), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/11_Memorystick_Legionnaire_466''s_Memory_3.jpg', 'Memorystick - Legionnaire 466''s Memory', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (52, 13, 'Legion Supply Box', '{"type": "text", "content": "Once you reach the section where the floor stars falling, go through the door on the left and the crate is inside."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 52 AND display_order = 12), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/12_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 52 AND display_order = 12), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/12_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (52, 4, 'Memorystick - Legionnaire 716''s Proposal', '{"type": "text", "content": "AAfter jumping across the sections of the floor that area falling, there will be a corpse with the memory stick right by the stairs. ."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 716''s Proposal' AND location_id = 52 AND display_order = 13), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/13_Memorystick_Legionnaire_716''s_Proposal.jpg', 'Memorystick - Legionnaire 716''s Proposal', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (52, 1, 'Supply Camp - Hypertube Entrance', '{"type": "text", "content": "At the top of the stairs, before you enter the hypertube."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Hypertube Entrance' AND location_id = 52 AND display_order = 14), 
        '/assets/images/Spire_4/1_Orca_Space_Complex/14_Supply_Camp_Hypertube_Entrance.jpg', 'Supply Camp - Hypertube Entrance', 1);

-- Spire 4 - Passenger Lift 161

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (59, 1, 'Legion Camp', '{"type": "text", "content": "Once you enter the Passenger Elevator, the camp will be directly to your left."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 59 AND display_order = 1), 
        '/assets/images/Spire_4/8_Passenger_Lift_161/1_Legion_Camp.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (59, 13, 'Legion Supply Box', '{"type": "text", "content": "Straight ahead, behind Arisa."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 59 AND display_order = 2), 
        '/assets/images/Spire_4/8_Passenger_Lift_161/2_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (59, 13, 'Legion Supply Box', '{"type": "text", "content": "After lifting the Code Red and going up to the second floor of the Passenger Elevator, there will be a crate on the right side."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 59 AND display_order = 3), 
        '/assets/images/Spire_4/8_Passenger_Lift_161/3_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (59, 14, 'Beta Core', '{"type": "text", "content": "After going up the rope leading to the 4th floor, it''ll be on a corpse near the bed."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 59 AND display_order = 4), 
        '/assets/images/Spire_4/8_Passenger_Lift_161/4_Beta_Core_1.jpg', 'Beta Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 59 AND display_order = 4), 
        '/assets/images/Spire_4/8_Passenger_Lift_161/4_Beta_Core_2.jpg', 'Beta Core', 2);

-- Spire 4 - Prestige Lounge

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (60, 18, 'Earrings - Silver Tooth', '{"type": "text", "content": "After reaching the lounge-like area, there will be a crate by the couches."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Earrings - Silver Tooth' AND location_id = 60 AND display_order = 1), 
        '/assets/images/Spire_4/9_Prestige_Lounge/1_Earrings_Silver_Tooth.jpg', 'Earrings - Silver Tooth', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (60, 1, 'Supply Camp', '{"type": "text", "content": "Automatically activated during a cutscene after going through the door in the lounge."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp' AND location_id = 60 AND display_order = 2), 
        '/assets/images/Spire_4/9_Prestige_Lounge/2_Supply_Camp.jpg', 'Supply Camp', 1);

-- Spire 4 - Raphael Space Centre

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (55, 4, 'Memorystick - Terry''s Resignation', '{"type": "text", "content": "In the next room, on the left, by a barricade."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Terry''s Resignation' AND location_id = 55 AND display_order = 1), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/1_Memorystick_Terry''s_Resignation.jpg', 'Memorystick - Terry''s Resignation', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (55, 4, 'Memorystick - Jim''s Resolution', '{"type": "text", "content": "Next to the previous memorystick."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Jim''s Resolution' AND location_id = 55 AND display_order = 2), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/2_Memorystick_Jim''s_Resolution.jpg', 'Memorystick - Jim''s Resolution', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (55, 4, 'Memorystick - Kane''s Memory / Passcode - nErBEr', '{"type": "text", "content": "Further north of the other two, nearer the far wall."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Kane''s Memory / Passcode - nErBEr' AND location_id = 55 AND display_order = 3), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/3_Memorystick_Kane''s_Memory_and_Passcode.jpg', 'Memorystick - Kane''s Memory / Passcode - nErBEr', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (55, 4, 'Memorystick - Legionnaire 749''s Testament', '{"type": "text", "content": "Southeast from the other one, leaning up against the Information Kiosk."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 749''s Testament' AND location_id = 55 AND display_order = 4), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/4_Memorystick_Legionnaire_749''s_Testament.jpg', 'Memorystick - Legionnaire 749''s Testament', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (55, 4, 'Memorystick - Legionnaire 715''s Advice', '{"type": "text", "content": "Head further east from the previous one and this one is slumped against some seats."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 715''s Advice' AND location_id = 55 AND display_order = 5), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/5_Memorystick_Legionnaire_715''s_Advice.jpg', 'Memorystick - Legionnaire 715''s Advice', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (55, 3, 'Can - Nectar Apple', '{"type": "text", "content": "The other side of the seats, behind him."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Nectar Apple' AND location_id = 55 AND display_order = 6), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/6_Can_Nectar_Apple_1.jpg', 'Can - Nectar Apple', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Nectar Apple' AND location_id = 55 AND display_order = 6), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/6_Can_Nectar_Apple_2.jpg', 'Can - Nectar Apple', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (55, 2, 'Document - Promotions - Welcome to the Raphael Space Centre!', '{"type": "text", "content": "Actually in the information kiosk in the middle of the area."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions - Welcome to the Raphael Space Centre!' AND location_id = 55 AND display_order = 7), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/7_Document_Promotions_Welcome_to_the_Raphael_Space_Centre.jpg', 'Document - Promotions - Welcome to the Raphael Space Centre!', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (55, 4, 'Memorystick - Legionnaire 729''s Memory', '{"type": "text", "content": "This body is in the southwest corner of the foyer. Same area."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 729''s Memory' AND location_id = 55 AND display_order = 8), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/8_Memorystick_Legionnaire_729''s_Memory.jpg', 'Memorystick - Legionnaire 729''s Memory', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (55, 17, 'Body Core', '{"type": "text", "content": "In Gate 2 (after using the passcode), this body is found near the contaminated crates in the middle."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 55 AND display_order = 9), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/9_Body_Core_1.jpg', 'Body Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 55 AND display_order = 9), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/9_Body_Core_2.jpg', 'Body Core', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (55, 13, 'Legion Supply Box', '{"type": "text", "content": "In the door on your right as you head to the other door on the other side of the foyer. Careful, it''s guarded by a Heavy Droid who has 4 Aid Drones as wingmen."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 55 AND display_order = 10), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/10_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (55, 15, 'Nano Suit - Black Rose', '{"type": "text", "content": "In the east corner (next to where you need to go) is a laser puzzle room. Approach the box, and then dodge the lasers and make your way to the control panel on the eastern wall."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Black Rose' AND location_id = 55 AND display_order = 11), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/11_Nano_Suit_Black_Rose_1.jpg', 'Nano Suit - Black Rose', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Black Rose' AND location_id = 55 AND display_order = 11), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/11_Nano_Suit_Black_Rose_2.jpg', 'Nano Suit - Black Rose', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Black Rose' AND location_id = 55 AND display_order = 11), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/11_Nano_Suit_Black_Rose_3.jpg', 'Nano Suit - Black Rose', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (55, 12, 'Robot - Drone Upgrade Modules', '{"type": "text", "content": "On the right as you walk into the next room, hiding in all the contaminated materials."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Drone Upgrade Modules' AND location_id = 55 AND display_order = 12), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/12_Robot_Drone_Upgrade_Modules.jpg', 'Robot - Drone Upgrade Modules', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (55, 4, 'Memorystick - Legionnaire 251''s Resolution', '{"type": "text", "content": "On the left as you walk in through the main door (north)."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 251''s Resolution' AND location_id = 55 AND display_order = 13), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/13_Memorystick_Legionnaire_251''s_Resolution.jpg', 'Memorystick - Legionnaire 251''s Resolution', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (55, 4, 'Memorystick - Legionnaire 212''s End', '{"type": "text", "content": "Just next to the aforementioned body."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 212''s End' AND location_id = 55 AND display_order = 14), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/14_Memorystick_Legionnaire_212''s_End.jpg', 'Memorystick - Legionnaire 212''s End', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (55, 4, 'Memorystick - Legionnaire 754''s Shout', '{"type": "text", "content": "North from the last pair of bodies, slumped in the corner of the room."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 754''s Shout' AND location_id = 55 AND display_order = 15), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/15_Memorystick_Legionnaire_754''s_Shout.jpg', 'Memorystick - Legionnaire 754''s Shout', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (55, 13, 'Legion Supply Box', '{"type": "text", "content": "Now head east from that body to the far wall. There''s a crate there."}', 16);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 55 AND display_order = 16), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/16_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (55, 4, 'Memorystick - Legionnaire 751''s Testament', '{"type": "text", "content": "You''ll find this one slumped up against the south wall of the same room."}', 17);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 751''s Testament' AND location_id = 55 AND display_order = 17), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/17_Memorystick_Legionnaire_751''s_Testament.jpg', 'Memorystick - Legionnaire 751''s Testament', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (55, 19, 'Supply Camp - Raphael Space Centre Lobby', '{"type": "text", "content": "In the east corner of the same room."}', 18);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Raphael Space Centre Lobby' AND location_id = 55 AND display_order = 18), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/18_Supply_Camp_Raphael_Space_Centre_Lobby.jpg', 'Supply Camp - Raphael Space Centre Lobby', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (55, 13, 'Legion Supply Box', '{"type": "text", "content": "Opposite the cargo elevator."}', 19);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 55 AND display_order = 19), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/19_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (55, 13, 'Legion Supply Box', '{"type": "text", "content": "After you get out the lift, it''s straight ahead of you."}', 20);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 55 AND display_order = 20), 
        '/assets/images/Spire_4/4_Raphael_Space_Centre/20_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

-- Spire 4 - Space Logistics Complex

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 13, 'Legion Supply Box', '{"type": "text", "content": "In the northwest corner of the next area. Contains an Omnibolt and Beta Recovery Gear (3 star)"}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 54 AND display_order = 1), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/1_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 13, 'Legion Supply Box', '{"type": "text", "content": "There''s another one in the northeast corner."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 54 AND display_order = 2), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/2_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 20, 'Exospine - Judgement-Type', '{"type": "text", "content": "Put the 4 balls in their respective holes in the first open area and this will literally drop out of the sky. Well, the container it''s in will."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Judgement-Type' AND location_id = 54 AND display_order = 3), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/3_Exospine_Judgement_Type_1.jpg', 'Exospine - Judgement-Type', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Judgement-Type' AND location_id = 54 AND display_order = 3), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/3_Exospine_Judgement_Type_2.jpg', 'Exospine - Judgement-Type', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Judgement-Type' AND location_id = 54 AND display_order = 3), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/3_Exospine_Judgement_Type_3.jpg', 'Exospine - Judgement-Type', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Judgement-Type' AND location_id = 54 AND display_order = 3), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/3_Exospine_Judgement_Type_4.jpg', 'Exospine - Judgement-Type', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Judgement-Type' AND location_id = 54 AND display_order = 3), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/3_Exospine_Judgement_Type_5.jpg', 'Exospine - Judgement-Type', 5);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 4, 'Memorystick - Legionnaire 725''s Question', '{"type": "text", "content": "After the chase sequence, directly ahead of you."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 725''s Question' AND location_id = 54 AND display_order = 4), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/4_Memorystick_Legionnaire_725''s_Question.jpg', 'Memorystick - Legionnaire 725''s Question', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 13, 'Legion Supply Box', '{"type": "text", "content": "South from the dead body, up a ladder on the west side"}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 54 AND display_order = 5), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/5_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 1, 'Legion Camp', '{"type": "text", "content": "After getting past the first set of lasers."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 54 AND display_order = 6), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/6_Legion_Camp.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 13, 'Legion Supply Box', '{"type": "text", "content": "After the first main conveyor belt, where you have to go right and the boxes are coming down on a slope, head up that slope and follow it to the end. There''s a supply box with an Omnibolt and Burst Charge Gear (3 star) inside."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 54 AND display_order = 7), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/7_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 54 AND display_order = 7), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/7_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 54 AND display_order = 7), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/7_Legion_Supply_Box_3.jpg', 'Legion Supply Box', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 13, 'Legion Supply Box', '{"type": "text", "content": "At the top of the fast moving conveyor belt that goes up, jump up and to the right for this chest. Only crafting supplies, so if you don''t want to risk it, you''re not missing much."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 54 AND display_order = 8), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/8_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 54 AND display_order = 8), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/8_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 54 AND display_order = 8), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/8_Legion_Supply_Box_3.jpg', 'Legion Supply Box', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 17, 'Body Core', '{"type": "text", "content": "After you drop down, before moving through the next set of lasers, do a 180, there''s a Body Core there under the conveyor belt ramp."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 54 AND display_order = 9), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/9_Body_Core.jpg', 'Body Core', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 1, 'Supply Camp - Space Logistics Centre', '{"type": "text", "content": "After finishing the conveyor belt section, this camp is straight ahead."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Space Logistics Centre' AND location_id = 54 AND display_order = 10), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/10_Supply_Camp_Space_Logistics_Centre.jpg', 'Supply Camp - Space Logistics Centre', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 3, 'Can - Liquid Lightning', '{"type": "text", "content": "East of the Supply Camp, behind a crate. Perhaps the easiest to find out of all of them so far."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Liquid Lightning' AND location_id = 54 AND display_order = 11), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/11_Can_Liquid_Lightning_1.jpg', 'Can - Liquid Lightning', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Liquid Lightning' AND location_id = 54 AND display_order = 11), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/11_Can_Liquid_Lightning_2.jpg', 'Can - Liquid Lightning', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Liquid Lightning' AND location_id = 54 AND display_order = 11), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/11_Can_Liquid_Lightning_3.jpg', 'Can - Liquid Lightning', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 4, 'Memorystick - Legionnaire 775''s Plea', '{"type": "text", "content": "Where the ropes are, drop down and deal with the enemies. This memorystick is on the body in the corner."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 775''s Plea' AND location_id = 54 AND display_order = 12), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/12_Memorystick_Legionnaire_775''s_Plea_1.jpg', 'Memorystick - Legionnaire 775''s Plea', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 775''s Plea' AND location_id = 54 AND display_order = 12), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/12_Memorystick_Legionnaire_775''s_Plea_2.jpg', 'Memorystick - Legionnaire 775''s Plea', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 13, 'Legion Supply Box', '{"type": "text", "content": "After swinging on the ropes, while the way out is up, look right and jump across for this crate. Needs the Hacking Tool."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 54 AND display_order = 13), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/13_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 54 AND display_order = 13), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/13_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 5, 'Locked Supply Chest', '{"type": "text", "content": "Turn east from the supply box and climb onto the shipping crates. This cache is round the back."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 54 AND display_order = 14), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/14_Locked_Supply_Chest_1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 54 AND display_order = 14), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/14_Locked_Supply_Chest_2.jpg', 'Locked Supply Chest', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 13, 'Legion Supply Box', '{"type": "text", "content": "Opposite the ladder you need to get out is a crate. Use the moving crates to get across to it."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 54 AND display_order = 15), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/15_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 54 AND display_order = 15), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/15_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 1, 'Legion Camp', '{"type": "text", "content": "Through the big door and down the rope. On your left."}', 16);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 54 AND display_order = 16), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/16_Legion_Camp.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 13, 'Legion Supply Box', '{"type": "text", "content": "As you come back around the cars (after doing a U-turn of sorts), there''s a supply box in the corner, behind some security barricades. Just contains some crafting supplies."}', 17);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 54 AND display_order = 17), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/17_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 54 AND display_order = 17), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/17_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 12, 'Robot - Tumbler Expansion Module', '{"type": "text", "content": "This one is on the main route, just under the turrets, before the entrace to the Raphael Space Centre."}', 18);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 54 AND display_order = 18), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/18_Robot_Tumbler_Expansion_Module_1.jpg', 'Robot - Tumbler Expansion Module', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 54 AND display_order = 18), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/18_Robot_Tumbler_Expansion_Module_2.jpg', 'Robot - Tumbler Expansion Module', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 4, 'Memorystick - Legionnaire 738''s Memory', '{"type": "text", "content": "As soon as you get out of the turret fire, while crossing the plaza, this one is in the door."}', 19);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 738''s Memory' AND location_id = 54 AND display_order = 19), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/19_Memorystick_Legionnaire_738''s_Memory.jpg', 'Memorystick - Legionnaire 738''s Memory', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 1, 'Legion Camp', '{"type": "text", "content": "At the end of the corridor in the building."}', 20);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 54 AND display_order = 20), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/20_Legion_Camp.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (54, 12, 'Robot - Document - Promotions - Orca Aerospace Company Promotion', '{"type": "text", "content": "Just to the north of the Legion Camp, before you go through the door into the next area."}', 21);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Document - Promotions - Orca Aerospace Company Promotion' AND location_id = 54 AND display_order = 21), 
        '/assets/images/Spire_4/3_Space_Logistics_Complex/21_Robot_Document_Promotions_Orca_Aerospace_Company_Production.jpg', 'Robot - Document - Promotions - Orca Aerospace Company Promotion', 1);

-- Spire 4 - Tower Outer Wall

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (58, 12, 'Robot - Drone Upgrade Module', '{"type": "text", "content": "Once you''re outside going across the beams, jump across to another beam and follow it to the end. Once you''re at the end, climb up the yellow ledges to find a robot that will drop the Drone Upgrade Module."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Drone Upgrade Module' AND location_id = 58 AND display_order = 1), 
        '/assets/images/Spire_4/7_Tower_Outer_Wall/1_Robot_Drone_Upgrade_Module_1.jpg', 'Robot - Drone Upgrade Module', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Drone Upgrade Module' AND location_id = 58 AND display_order = 1), 
        '/assets/images/Spire_4/7_Tower_Outer_Wall/1_Robot_Drone_Upgrade_Module_2.jpg', 'Robot - Drone Upgrade Module', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Drone Upgrade Module' AND location_id = 58 AND display_order = 1), 
        '/assets/images/Spire_4/7_Tower_Outer_Wall/1_Robot_Drone_Upgrade_Module_3.jpg', 'Robot - Drone Upgrade Module', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (58, 13, 'Legion Supply Box', '{"type": "text", "content": "Once you''re back inside the building, drop down and there will be a crate underneath you."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 58 AND display_order = 2), 
        '/assets/images/Spire_4/7_Tower_Outer_Wall/2_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (58, 3, 'Can - Moonwell', '{"type": "text", "content": "From the previous crate, after defeating the Machine Hive, you can jump around the wall to the right and there will be a vending machine at the end with the can inside. If you miss this one, you can fish it up from the Oasis in the Great Desert using Strange Bait after finishing Spire 4"}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Moonwell' AND location_id = 58 AND display_order = 3), 
        '/assets/images/Spire_4/7_Tower_Outer_Wall/3_Can_Moonwell_1.jpg', 'Can - Moonwell', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Moonwell' AND location_id = 58 AND display_order = 3), 
        '/assets/images/Spire_4/7_Tower_Outer_Wall/3_Can_Moonwell_2.jpg', 'Can - Moonwell', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Moonwell' AND location_id = 58 AND display_order = 3), 
        '/assets/images/Spire_4/7_Tower_Outer_Wall/3_Can_Moonwell_3.jpg', 'Can - Moonwell', 3);

-- Spire 4 - Vermillion Garden

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (61, 15, 'Nano Suit - Photogenic', '{"type": "text", "content": "After leaving the boss fight arena, this crate is in the next room, straight ahead of you."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Photogenic' AND location_id = 61 AND display_order = 1), 
        '/assets/images/Spire_4/10_Vermillion_Garden/1_Nano_Suit_Photogenic.jpg', 'Nano Suit - Photogenic', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (61, 13, 'Legion Supply Box', '{"type": "text", "content": "There''s a supply box beside the crate with the Nano Suit."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 61 AND display_order = 2), 
        '/assets/images/Spire_4/10_Vermillion_Garden/2_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (61, 13, 'Legion Supply Box', '{"type": "text", "content": "Inside the elevator shaft, take the first moving yellow ledge and jump off to the right to find the crate. Contains 2 Omnibolts and Risk Taking Gear (3 star)"}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 61 AND display_order = 3), 
        '/assets/images/Spire_4/10_Vermillion_Garden/3_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 61 AND display_order = 3), 
        '/assets/images/Spire_4/10_Vermillion_Garden/3_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 61 AND display_order = 3), 
        '/assets/images/Spire_4/10_Vermillion_Garden/3_Legion_Supply_Box_3.jpg', 'Legion Supply Box', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (61, 13, 'Legion Supply Box', '{"type": "text", "content": "After taking the third moving yellow ledge, the next crate will be on the left side."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 61 AND display_order = 4), 
        '/assets/images/Spire_4/10_Vermillion_Garden/4_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 61 AND display_order = 4), 
        '/assets/images/Spire_4/10_Vermillion_Garden/4_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

-- Wasteland - Barren Lands

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 1, 'Supply Camp - Hidden Path', '{"type": "text", "content": "As soon as you enter the area. However, you need to restore power at the Solar Tower to use it (side quest, \u201cReboot\u201d)."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Hidden Path' AND location_id = 12 AND display_order = 1), 
        '/assets/images/Wasteland/1-BarrenLands/1-Supply Camp-Hidden Path.1.jpg', 'Supply Camp (Hidden Path)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Hidden Path' AND location_id = 12 AND display_order = 1), 
        '/assets/images/Wasteland/1-BarrenLands/1-Supply Camp-Hidden Path.2.jpg', 'Supply Camp (Hidden Path)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 4, 'Memorystick - Amanda''s Memory', '{"type": "text", "content": "From the supply camp, head southwest and there''ll be a human corpse as the area opens up a little"}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Amanda''s Memory' AND location_id = 12 AND display_order = 2), 
        '/assets/images/Wasteland/1-BarrenLands/2-Memorystick-Amanda''s Memory.1.jpg', 'Memorystick (Amanda''s Memory)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Amanda''s Memory' AND location_id = 12 AND display_order = 2), 
        '/assets/images/Wasteland/1-BarrenLands/2-Memorystick-Amanda''s Memory.2.jpg', 'Memorystick (Amanda''s Memory)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 4, 'Memorystick - Donna''s Memory', '{"type": "text", "content": "The corpse next to the previous memorystick is actually part of the \u201cMissing Wife\u201d Request. Interact to get this memorystick."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Donna''s Memory' AND location_id = 12 AND display_order = 3), 
        '/assets/images/Wasteland/1-BarrenLands/3-Memorystick-Donna''s Memory.1.jpg', 'Memorystick (Donna''s Memory)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Donna''s Memory' AND location_id = 12 AND display_order = 3), 
        '/assets/images/Wasteland/1-BarrenLands/3-Memorystick-Donna''s Memory.2.jpg', 'Memorystick (Donna''s Memory)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 13, 'Legion Supply Box', '{"type": "text", "content": "Just slightly southwest from the previous memorysticks."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 12 AND display_order = 4), 
        '/assets/images/Wasteland/1-BarrenLands/4-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 12 AND display_order = 4), 
        '/assets/images/Wasteland/1-BarrenLands/4-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 12, 'Robot - Document - Series - The Xion #2', '{"type": "text", "content": "East of the supply camp is a robot who drops this document."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Document - Series - The Xion #2' AND location_id = 12 AND display_order = 5), 
        '/assets/images/Wasteland/1-BarrenLands/5-Robot-Documents-Series-The Xion 2.1.jpg', 'Robot - Documents - Series (The Xion #2)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Document - Series - The Xion #2' AND location_id = 12 AND display_order = 5), 
        '/assets/images/Wasteland/1-BarrenLands/5-Robot-Documents-Series-The Xion 2.2.jpg', 'Robot - Documents - Series (The Xion #2)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 4, 'Memorystick - Citizen 439''s Resignation', '{"type": "text", "content": "Southeast of the Hidden Path supply camp is a large dead tree with a human corpse at its base."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Citizen 439''s Resignation' AND location_id = 12 AND display_order = 6), 
        '/assets/images/Wasteland/1-BarrenLands/6-Memorystick-Citizen 439''s Resignation.1.jpg', 'Memorystick (Citizen 439''s Resignation)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Citizen 439''s Resignation' AND location_id = 12 AND display_order = 6), 
        '/assets/images/Wasteland/1-BarrenLands/6-Memorystick-Citizen 439''s Resignation.2.jpg', 'Memorystick (Citizen 439''s Resignation)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 13, 'Legion Supply Box', '{"type": "text", "content": "East of the previous memorystick."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 12 AND display_order = 7), 
        '/assets/images/Wasteland/1-BarrenLands/7-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 12 AND display_order = 7), 
        '/assets/images/Wasteland/1-BarrenLands/7-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 4, 'Memorystick - Sentinel 78''s Consolation', '{"type": "text", "content": "Just slightly southeast of the waypoint, behind a massive steel girder."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 78''s Consolation' AND location_id = 12 AND display_order = 8), 
        '/assets/images/Wasteland/1-BarrenLands/9-Memorystick-Sentinel 78''s Consolation.1.jpg', 'Memorystick (Sentinel 78''s Consolation)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 78''s Consolation' AND location_id = 12 AND display_order = 8), 
        '/assets/images/Wasteland/1-BarrenLands/9-Memorystick-Sentinel 78''s Consolation.2.jpg', 'Memorystick (Sentinel 78''s Consolation)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 13, 'Legion Supply Box', '{"type": "text", "content": "Not far south from the Waypoint (northeast of the Barren Land Legion Camp)."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 12 AND display_order = 9), 
        '/assets/images/Wasteland/1-BarrenLands/10-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 12 AND display_order = 9), 
        '/assets/images/Wasteland/1-BarrenLands/10-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 1, 'Legion Camp - Barren Land', '{"type": "text", "content": "Southwest of the previous supply box is the Barren Land Legion Camp."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - Barren Land' AND location_id = 12 AND display_order = 10), 
        '/assets/images/Wasteland/1-BarrenLands/11-Legion Camp.1.jpg', 'Legion Camp', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - Barren Land' AND location_id = 12 AND display_order = 10), 
        '/assets/images/Wasteland/1-BarrenLands/11-Legion Camp.2.jpg', 'Legion Camp', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 4, 'Memorystick - Scavenger 160''s Advice', '{"type": "text", "content": "Just northwest of the Barren Land Legion Camp is a Hedgeboar by two corpses."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Scavenger 160''s Advice' AND location_id = 12 AND display_order = 11), 
        '/assets/images/Wasteland/1-BarrenLands/12-Memorystick-Scavenger 160''s Advice.1.jpg', 'Memorystick (Scavenger 160''s Advice)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Scavenger 160''s Advice' AND location_id = 12 AND display_order = 11), 
        '/assets/images/Wasteland/1-BarrenLands/12-Memorystick-Scavenger 160''s Advice.2.jpg', 'Memorystick (Scavenger 160''s Advice)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 4, 'Memorystick - Scavenger 102''s Decision', '{"type": "text", "content": "The other corpse is next to the previous Memorystick."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Scavenger 102''s Decision' AND location_id = 12 AND display_order = 12), 
        '/assets/images/Wasteland/1-BarrenLands/13-Memorystick-Scavenger 102''s Decision.1.jpg', 'Memorystick (Scavenger 102''s Decision)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Scavenger 102''s Decision' AND location_id = 12 AND display_order = 12), 
        '/assets/images/Wasteland/1-BarrenLands/13-Memorystick-Scavenger 102''s Decision.2.jpg', 'Memorystick (Scavenger 102''s Decision)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 4, 'Memorystick (Legionnaire 311''s Resolution)', '{"type": "text", "content": "Slumped up against the west side of the Solar Tower."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Legionnaire 311''s Resolution)' AND location_id = 12 AND display_order = 13), 
        '/assets/images/Wasteland/1-BarrenLands/14-Memorystick-Legionnaire 311''s Resolution.1.jpg', 'Memorystick (Legionnaire 311''s Resolution)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Legionnaire 311''s Resolution)' AND location_id = 12 AND display_order = 13), 
        '/assets/images/Wasteland/1-BarrenLands/14-Memorystick-Legionnaire 311''s Resolution.2.jpg', 'Memorystick (Legionnaire 311''s Resolution)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 20, 'Exospine - Camouflage-Type', '{"type": "text", "content": "At the top of the Solar Tower, in the western area of the Wasteland."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Camouflage-Type' AND location_id = 12 AND display_order = 14), 
        '/assets/images/Wasteland/1-BarrenLands/15-Camouflage-Type Exospine.1.jpg', 'Camouflage-Type Exospine', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Camouflage-Type' AND location_id = 12 AND display_order = 14), 
        '/assets/images/Wasteland/1-BarrenLands/15-Camouflage-Type Exospine.2.jpg', 'Camouflage-Type Exospine', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 4, 'Memorystick (Legionnaire 323''s Warning)', '{"type": "text", "content": "West of the Solar Tower is a body, at the base of a billboard."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Legionnaire 323''s Warning)' AND location_id = 12 AND display_order = 15), 
        '/assets/images/Wasteland/1-BarrenLands/16-Memorystick-Legionnaire 323''s Warning.1.jpg', 'Memorystick (Legionnaire 323''s Warning)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Legionnaire 323''s Warning)' AND location_id = 12 AND display_order = 15), 
        '/assets/images/Wasteland/1-BarrenLands/16-Memorystick-Legionnaire 323''s Warning.2.jpg', 'Memorystick (Legionnaire 323''s Warning)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 3, 'Can - Potential Tempest', '{"type": "text", "content": "Turn on 2 consoles in the area north of the Solar Tower, then push the yellow box to the shipping container in the middle of the area to turn on the final console. The chest next to it will open, which has this can inside."}', 16);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Potential Tempest' AND location_id = 12 AND display_order = 16), 
        '/assets/images/Wasteland/1-BarrenLands/17-Can-Potential Tempest.1.jpg', 'Can - Potential Tempest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Potential Tempest' AND location_id = 12 AND display_order = 16), 
        '/assets/images/Wasteland/1-BarrenLands/17-Can-Potential Tempest.2.jpg', 'Can - Potential Tempest', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Potential Tempest' AND location_id = 12 AND display_order = 16), 
        '/assets/images/Wasteland/1-BarrenLands/17-Can-Potential Tempest.3.jpg', 'Can - Potential Tempest', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Potential Tempest' AND location_id = 12 AND display_order = 16), 
        '/assets/images/Wasteland/1-BarrenLands/17-Can-Potential Tempest.4.jpg', 'Can - Potential Tempest', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Potential Tempest' AND location_id = 12 AND display_order = 16), 
        '/assets/images/Wasteland/1-BarrenLands/17-Can-Potential Tempest.5.jpg', 'Can - Potential Tempest', 5);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 4, 'Memorystick (The Search for a Haven)', '{"type": "text", "content": "Head northeast of the Solar Tower and climb the cliffs up to the large open area to the northwest. There''s a corpse at the entrance."}', 17);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (The Search for a Haven)' AND location_id = 12 AND display_order = 17), 
        '/assets/images/Wasteland/1-BarrenLands/18-Memorystick-The Search for a Haven.1.jpg', 'Memorystick (The Search for a Haven)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (The Search for a Haven)' AND location_id = 12 AND display_order = 17), 
        '/assets/images/Wasteland/1-BarrenLands/18-Memorystick-The Search for a Haven.2.jpg', 'Memorystick (The Search for a Haven)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 21, 'Lily Outfit (Rainy Day)', '{"type": "text", "content": "North of the previous memorystick, in the haven. Underwater. Ignore the other chest for now (the locked one), as that''s part of another quest later on when you have the Fishing Rod."}', 18);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Lily Outfit (Rainy Day)' AND location_id = 12 AND display_order = 18), 
        '/assets/images/Wasteland/1-BarrenLands/19-Lily Outfit-Rainy Day.1.jpg', 'Lily Outfit (Rainy Day)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Lily Outfit (Rainy Day)' AND location_id = 12 AND display_order = 18), 
        '/assets/images/Wasteland/1-BarrenLands/19-Lily Outfit-Rainy Day.2.jpg', 'Lily Outfit (Rainy Day)', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Lily Outfit (Rainy Day)' AND location_id = 12 AND display_order = 18), 
        '/assets/images/Wasteland/1-BarrenLands/19-Lily Outfit-Rainy Day.3.jpg', 'Lily Outfit (Rainy Day)', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 15, 'Nano Suit - Racer''s High', '{"type": "text", "content": "Head back out from the haven, go east and drop down onto the rocks for this Nano Suit."}', 19);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Racer''s High' AND location_id = 12 AND display_order = 19), 
        '/assets/images/Wasteland/1-BarrenLands/20-Nano Suit-Racer''s High.1.jpg', 'Nano Suit - Racer''s High', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Racer''s High' AND location_id = 12 AND display_order = 19), 
        '/assets/images/Wasteland/1-BarrenLands/20-Nano Suit-Racer''s High.2.jpg', 'Nano Suit - Racer''s High', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 1, 'Supply Camp (Solar Tower Entrance)', '{"type": "text", "content": "You''ll find this camp east of the Solar Tower."}', 20);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp (Solar Tower Entrance)' AND location_id = 12 AND display_order = 20), 
        '/assets/images/Wasteland/1-BarrenLands/21-Supply Camp-Solar Tower Entrance.1.jpg', 'Supply Camp (Solar Tower Entrance)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp (Solar Tower Entrance)' AND location_id = 12 AND display_order = 20), 
        '/assets/images/Wasteland/1-BarrenLands/21-Supply Camp-Solar Tower Entrance.2.jpg', 'Supply Camp (Solar Tower Entrance)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 4, 'Memorystick (Marco''s Recollection)', '{"type": "text", "content": "Just to the northeast of the Supply Camp is a human corpse with this memorystick."}', 21);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Marco''s Recollection)' AND location_id = 12 AND display_order = 21), 
        '/assets/images/Wasteland/1-BarrenLands/22-Memorystick-Marco''s Recollection.1.jpg', 'Memorystick (Marco''s Recollection)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Marco''s Recollection)' AND location_id = 12 AND display_order = 21), 
        '/assets/images/Wasteland/1-BarrenLands/22-Memorystick-Marco''s Recollection.2.jpg', 'Memorystick (Marco''s Recollection)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 12, 'Robot - Mind Map Copy', '{"type": "text", "content": "Southeast of the Barren Land Legion Camp is a robot with a Mind Map Copy inside. Part of Su and Enya''s side quest, \u201cLooking At You.\u201d"}', 22);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Mind Map Copy' AND location_id = 12 AND display_order = 22), 
        '/assets/images/Wasteland/1-BarrenLands/23-Robot-Mind Map Copy.1.jpg', 'Robot - Mind Map Copy', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Mind Map Copy' AND location_id = 12 AND display_order = 22), 
        '/assets/images/Wasteland/1-BarrenLands/23-Robot-Mind Map Copy.2.jpg', 'Robot - Mind Map Copy', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 12, 'Robot - Mind Map Copy', '{"type": "text", "content": "East of the Hidden Path Supply Camp is a path that leads to a dead end. It''s heavily guarded, and has a robot in the middle. Part of Su and Enya''s side quest, \u201cLooking At You.\u201d"}', 23);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Mind Map Copy' AND location_id = 12 AND display_order = 23), 
        '/assets/images/Wasteland/1-BarrenLands/24-Robot-Mind Map Copy.1.jpg', 'Robot - Mind Map Copy', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Mind Map Copy' AND location_id = 12 AND display_order = 23), 
        '/assets/images/Wasteland/1-BarrenLands/24-Robot-Mind Map Copy.2.jpg', 'Robot - Mind Map Copy', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 20, 'Exospine - Impact-Type', '{"type": "text", "content": "Defeat the three waves of enemies in the small arena to the north of the Robot and you''ll find this in the case at the end."}', 24);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Impact-Type' AND location_id = 12 AND display_order = 24), 
        '/assets/images/Wasteland/1-BarrenLands/26-Impact-Type Exospine.1.jpg', 'Impact-Type Exospine', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Impact-Type' AND location_id = 12 AND display_order = 24), 
        '/assets/images/Wasteland/1-BarrenLands/26-Impact-Type Exospine.2.jpg', 'Impact-Type Exospine', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 4, 'Memorystick (Scavenger 248''s Despair)', '{"type": "text", "content": "South of the previous area. On the cliffs to the west."}', 25);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Scavenger 248''s Despair)' AND location_id = 12 AND display_order = 25), 
        '/assets/images/Wasteland/1-BarrenLands/27-Memorystick-Scavenger 248''s Despair.1.jpg', 'Memorystick (Scavenger 248''s Despair)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Scavenger 248''s Despair)' AND location_id = 12 AND display_order = 25), 
        '/assets/images/Wasteland/1-BarrenLands/27-Memorystick-Scavenger 248''s Despair.2.jpg', 'Memorystick (Scavenger 248''s Despair)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 13, 'Legion Supply Box', '{"type": "text", "content": "East of the previous memorystick. At the end of a small dead end."}', 26);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 12 AND display_order = 26), 
        '/assets/images/Wasteland/1-BarrenLands/28-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 12 AND display_order = 26), 
        '/assets/images/Wasteland/1-BarrenLands/28-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 4, 'Memorystick (Sentinel 82''s Report)', '{"type": "text", "content": "South of the previous supply crate, just jump down the cliff and it''s by an enemy or two."}', 27);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Sentinel 82''s Report)' AND location_id = 12 AND display_order = 27), 
        '/assets/images/Wasteland/1-BarrenLands/30-Memorystick-Sentinel 82''s Report.1.jpg', 'Memorystick (Sentinel 82''s Report)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Sentinel 82''s Report)' AND location_id = 12 AND display_order = 27), 
        '/assets/images/Wasteland/1-BarrenLands/30-Memorystick-Sentinel 82''s Report.2.jpg', 'Memorystick (Sentinel 82''s Report)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 4, 'Memorystick (Scavenger 131''s Memory)', '{"type": "text", "content": "South of the previous memorystick, in the southeast corner of the dead end area."}', 28);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Scavenger 131''s Memory)' AND location_id = 12 AND display_order = 28), 
        '/assets/images/Wasteland/1-BarrenLands/29-Memorystick-Scavenger 131''s Memory.1.jpg', 'Memorystick (Scavenger 131''s Memory)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Scavenger 131''s Memory)' AND location_id = 12 AND display_order = 28), 
        '/assets/images/Wasteland/1-BarrenLands/29-Memorystick-Scavenger 131''s Memory.2.jpg', 'Memorystick (Scavenger 131''s Memory)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (12, 3, 'Can - GrainT Corn', '{"type": "text", "content": "On the eastern path from the previous items (the path that leads to Altess Levoire)"}', 29);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - GrainT Corn' AND location_id = 12 AND display_order = 29), 
        '/assets/images/Wasteland/1-BarrenLands/31-Can-GrainT Corn.1.jpg', 'Can - GrainT Corn', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - GrainT Corn' AND location_id = 12 AND display_order = 29), 
        '/assets/images/Wasteland/1-BarrenLands/31-Can-GrainT Corn.2.jpg', 'Can - GrainT Corn', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - GrainT Corn' AND location_id = 12 AND display_order = 29), 
        '/assets/images/Wasteland/1-BarrenLands/31-Can-GrainT Corn.3.jpg', 'Can - GrainT Corn', 3);

-- Wasteland - Forbidden Area

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (21, 3, 'Can - Cryo The Clear', '{"type": "text", "content": "Head down the rope into the large pit in the southeast Scrap Plains and into a cell-like door on the western side of the structure. Probably about midway up. This is the location of the \u201cLife of the Scavengers\u201d side quest."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo The Clear' AND location_id = 21 AND display_order = 1), 
        '/assets/images/Wasteland/10-ForbiddenArea/1-Can-Cryo The Clear.1.jpg', 'Can - Cryo The Clear', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo The Clear' AND location_id = 21 AND display_order = 1), 
        '/assets/images/Wasteland/10-ForbiddenArea/1-Can-Cryo The Clear.2.jpg', 'Can - Cryo The Clear', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo The Clear' AND location_id = 21 AND display_order = 1), 
        '/assets/images/Wasteland/10-ForbiddenArea/1-Can-Cryo The Clear.3.jpg', 'Can - Cryo The Clear', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo The Clear' AND location_id = 21 AND display_order = 1), 
        '/assets/images/Wasteland/10-ForbiddenArea/1-Can-Cryo The Clear.4.jpg', 'Can - Cryo The Clear', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo The Clear' AND location_id = 21 AND display_order = 1), 
        '/assets/images/Wasteland/10-ForbiddenArea/1-Can-Cryo The Clear.5.jpg', 'Can - Cryo The Clear', 5);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (21, 4, 'Memorystick - Tommy''s Testament', '{"type": "text", "content": "Interact with Tommy''s body after defeating the Brute."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Tommy''s Testament' AND location_id = 21 AND display_order = 2), 
        '/assets/images/Wasteland/10-ForbiddenArea/3-Memorystick-Tommy''s Testament.1.jpg', 'Memorystick (Tommy''s Testament)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Tommy''s Testament' AND location_id = 21 AND display_order = 2), 
        '/assets/images/Wasteland/10-ForbiddenArea/3-Memorystick-Tommy''s Testament.2.jpg', 'Memorystick (Tommy''s Testament)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (21, 15, 'Nano Suit - Sporty Yellow', '{"type": "text", "content": "In a chest where the Brute came from in the Forbidden Area. Directly behind Tommy''s body."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Sporty Yellow' AND location_id = 21 AND display_order = 3), 
        '/assets/images/Wasteland/10-ForbiddenArea/4-Sporty Yellow Nano Suit.1.jpg', 'Nano Suit - Sporty Yellow', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Sporty Yellow' AND location_id = 21 AND display_order = 3), 
        '/assets/images/Wasteland/10-ForbiddenArea/4-Sporty Yellow Nano Suit.2.jpg', 'Nano Suit - Sporty Yellow', 2);

-- Wasteland - Great Canyon

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 4, 'Memorystick (Citizen 224''s Memory)', '{"type": "text", "content": "Head south from the Barren Land Legion Camp into the Great Canyon. Straight ahead is a corpse by a car (and a few Hedgeboars)."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Citizen 224''s Memory)' AND location_id = 13 AND display_order = 1), 
        '/assets/images/Wasteland/2-GreatCanyon/1-Memorystick-Citizen 224''s Memory.1.jpg', 'Memorystick (Citizen 224''s Memory)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Citizen 224''s Memory)' AND location_id = 13 AND display_order = 1), 
        '/assets/images/Wasteland/2-GreatCanyon/1-Memorystick-Citizen 224''s Memory.2.jpg', 'Memorystick (Citizen 224''s Memory)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 13, 'Legion Supply Box', '{"type": "text", "content": "Just slightly south of the aforementioned memorystick."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 13 AND display_order = 2), 
        '/assets/images/Wasteland/2-GreatCanyon/2-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 13 AND display_order = 2), 
        '/assets/images/Wasteland/2-GreatCanyon/2-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 4, 'Memorystick (Scavenger 212''s Testament)', '{"type": "text", "content": "Head west from the two previous collectibles, and there''ll be a human corpse in the next passageway."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Scavenger 212''s Testament)' AND location_id = 13 AND display_order = 3), 
        '/assets/images/Wasteland/2-GreatCanyon/3-Memorystick-Scavenger 212''s Testament.1.jpg', 'Memorystick (Scavenger 212''s Testament)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Scavenger 212''s Testament)' AND location_id = 13 AND display_order = 3), 
        '/assets/images/Wasteland/2-GreatCanyon/3-Memorystick-Scavenger 212''s Testament.2.jpg', 'Memorystick (Scavenger 212''s Testament)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 4, 'Memorystick (Citizen 212''s Memory)', '{"type": "text", "content": "Continue west from the previous memorystick and there''ll be two Hedgeboars. Next to it is this human corpse and memorystick."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Citizen 212''s Memory)' AND location_id = 13 AND display_order = 4), 
        '/assets/images/Wasteland/2-GreatCanyon/4-Memorystick-Citizen 212''s Memory.1.jpg', 'Memorystick (Citizen 212''s Memory)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Citizen 212''s Memory)' AND location_id = 13 AND display_order = 4), 
        '/assets/images/Wasteland/2-GreatCanyon/4-Memorystick-Citizen 212''s Memory.2.jpg', 'Memorystick (Citizen 212''s Memory)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 13, 'Legion Supply Box', '{"type": "text", "content": "Next to the previous memorystick."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 13 AND display_order = 5), 
        '/assets/images/Wasteland/2-GreatCanyon/5-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 13 AND display_order = 5), 
        '/assets/images/Wasteland/2-GreatCanyon/5-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 5, 'Locked Supply Chest', '{"type": "text", "content": "Southwest of the corridor you came into the area, up the hill, is opposite the abandoned ship, is this locked supply crate. Opens with the d-pad mini-game."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 13 AND display_order = 6), 
        '/assets/images/Wasteland/2-GreatCanyon/6-Locked Supply Chest.1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 13 AND display_order = 6), 
        '/assets/images/Wasteland/2-GreatCanyon/6-Locked Supply Chest.2.jpg', 'Locked Supply Chest', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 13, 'Legion Supply Box', '{"type": "text", "content": "South of the previous locked chest is a Legion Supply box with 2 Omnibolts and Combat Supply Gear."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 13 AND display_order = 7), 
        '/assets/images/Wasteland/2-GreatCanyon/7-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 13 AND display_order = 7), 
        '/assets/images/Wasteland/2-GreatCanyon/7-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 4, 'Memorystick (Citizen 303''s Plea)', '{"type": "text", "content": "Inside the ship (the south side) there''s a corpse inside, inside a shipping container."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Citizen 303''s Plea)' AND location_id = 13 AND display_order = 8), 
        '/assets/images/Wasteland/2-GreatCanyon/8-Memorystick-Citizen 303''s Plea.1.jpg', 'Memorystick (Citizen 303''s Plea)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Citizen 303''s Plea)' AND location_id = 13 AND display_order = 8), 
        '/assets/images/Wasteland/2-GreatCanyon/8-Memorystick-Citizen 303''s Plea.2.jpg', 'Memorystick (Citizen 303''s Plea)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 12, 'Robot - Passcode - 0nrrrS', '{"type": "text", "content": "Inside the shipping container next to the memorystick one (still inside the ship). You get into it via the same shipping container."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Passcode - 0nrrrS' AND location_id = 13 AND display_order = 9), 
        '/assets/images/Wasteland/2-GreatCanyon/9-Robot-Passcode-0nrrrS.1.jpg', 'Robot - Passcode - 0nrrrS', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Passcode - 0nrrrS' AND location_id = 13 AND display_order = 9), 
        '/assets/images/Wasteland/2-GreatCanyon/9-Robot-Passcode-0nrrrS.2.jpg', 'Robot - Passcode - 0nrrrS', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 3, 'Can - Cryo Cafe Original', '{"type": "text", "content": "Behind the ship (west side). Head out via a hole in the wall near the last two collectibles and then head south."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo Cafe Original' AND location_id = 13 AND display_order = 10), 
        '/assets/images/Wasteland/2-GreatCanyon/10-Can-Cryo Cafe Original.1.jpg', 'Can - Cryo Cafe Original', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo Cafe Original' AND location_id = 13 AND display_order = 10), 
        '/assets/images/Wasteland/2-GreatCanyon/10-Can-Cryo Cafe Original.2.jpg', 'Can - Cryo Cafe Original', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo Cafe Original' AND location_id = 13 AND display_order = 10), 
        '/assets/images/Wasteland/2-GreatCanyon/10-Can-Cryo Cafe Original.3.jpg', 'Can - Cryo Cafe Original', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 13, 'Legion Supply Box', '{"type": "text", "content": "Northeast of the ship is a load of old abandoned cars. This box in the middle of them. Inside is 2 x Omnibolts and Training Gear"}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 13 AND display_order = 11), 
        '/assets/images/Wasteland/2-GreatCanyon/11-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 13 AND display_order = 11), 
        '/assets/images/Wasteland/2-GreatCanyon/11-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 12, 'Robot - Tumbler Expansion Module', '{"type": "text", "content": "In the northwest corner of the large ship, you''ll find this robot (south of the Solar Tower region)."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 13 AND display_order = 12), 
        '/assets/images/Wasteland/2-GreatCanyon/12-Robot-Tumbler Expansion Module.1.jpg', 'Robot - Tumbler Expansion Module', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 13 AND display_order = 12), 
        '/assets/images/Wasteland/2-GreatCanyon/12-Robot-Tumbler Expansion Module.2.jpg', 'Robot - Tumbler Expansion Module', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 3, 'Can - Behemoth Green', '{"type": "text", "content": "East of the ship to the south-southeast of the Solar Tower Entrance is a chest that needs 2 spheres to open. The one is next to it. The other is to the southwest. There is a can inside."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Behemoth Green' AND location_id = 13 AND display_order = 13), 
        '/assets/images/Wasteland/2-GreatCanyon/13-Can-Behemoth Green.1.jpg', 'Can - Behemoth Green', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Behemoth Green' AND location_id = 13 AND display_order = 13), 
        '/assets/images/Wasteland/2-GreatCanyon/13-Can-Behemoth Green.2.jpg', 'Can - Behemoth Green', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Behemoth Green' AND location_id = 13 AND display_order = 13), 
        '/assets/images/Wasteland/2-GreatCanyon/13-Can-Behemoth Green.3.jpg', 'Can - Behemoth Green', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Behemoth Green' AND location_id = 13 AND display_order = 13), 
        '/assets/images/Wasteland/2-GreatCanyon/13-Can-Behemoth Green.4.jpg', 'Can - Behemoth Green', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 13, 'Legion Supply Box', '{"type": "text", "content": "Southwest of the previous box is a Legion Supply Box."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 13 AND display_order = 14), 
        '/assets/images/Wasteland/2-GreatCanyon/14-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 13 AND display_order = 14), 
        '/assets/images/Wasteland/2-GreatCanyon/14-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 1, 'Supply Camp (Western Great Canyon)', '{"type": "text", "content": "East of the large ship (and south-southeast of the Solar Tower Entrance Supply Camp) is this Supply Camp."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp (Western Great Canyon)' AND location_id = 13 AND display_order = 15), 
        '/assets/images/Wasteland/2-GreatCanyon/15-Supply Camp-Western Great Canyon.1.jpg', 'Supply Camp (Western Great Canyon)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp (Western Great Canyon)' AND location_id = 13 AND display_order = 15), 
        '/assets/images/Wasteland/2-GreatCanyon/15-Supply Camp-Western Great Canyon.2.jpg', 'Supply Camp (Western Great Canyon)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 2, 'Document - Prayers - Chapter of Trial 5 - d', '{"type": "text", "content": "East of the supply camp, in the closest cliffface is a small cave with a shrine in it."}', 16);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Prayers - Chapter of Trial 5 - d' AND location_id = 13 AND display_order = 16), 
        '/assets/images/Wasteland/2-GreatCanyon/16-Document-Prayers-Chapter of Trial 5-d.1.jpg', 'Documents Prayers - Chapter of Trial 5 - d', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Prayers - Chapter of Trial 5 - d' AND location_id = 13 AND display_order = 16), 
        '/assets/images/Wasteland/2-GreatCanyon/16-Document-Prayers-Chapter of Trial 5-d.2.jpg', 'Documents Prayers - Chapter of Trial 5 - d', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 4, 'Memorystick (Scavenger 103''s Farewell)', '{"type": "text", "content": "Southeast of the Western Great Canyon Supply Camp (in the middle of some red plants - watch out for the Tentacles)."}', 17);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Scavenger 103''s Farewell)' AND location_id = 13 AND display_order = 17), 
        '/assets/images/Wasteland/2-GreatCanyon/17-Memorystick-Scavenger 103''s Farewell.1.jpg', 'Memorystick (Scavenger 103''s Farewell)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Scavenger 103''s Farewell)' AND location_id = 13 AND display_order = 17), 
        '/assets/images/Wasteland/2-GreatCanyon/17-Memorystick-Scavenger 103''s Farewell.2.jpg', 'Memorystick (Scavenger 103''s Farewell)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 1, 'Legion Camp (Central Great Canyon)', '{"type": "text", "content": "East of the previous Supply Camp is this Legion Camp."}', 18);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp (Central Great Canyon)' AND location_id = 13 AND display_order = 18), 
        '/assets/images/Wasteland/2-GreatCanyon/18-Legion Camp-Central Grand Canyon.1.jpg', 'Legion Camp (Central Great Canyon)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp (Central Great Canyon)' AND location_id = 13 AND display_order = 18), 
        '/assets/images/Wasteland/2-GreatCanyon/18-Legion Camp-Central Grand Canyon.2.jpg', 'Legion Camp (Central Great Canyon)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 13, 'Legion Supply Box', '{"type": "text", "content": "A little further southeast of the Legion Camp is this Supply Box."}', 19);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 13 AND display_order = 19), 
        '/assets/images/Wasteland/2-GreatCanyon/19-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 13 AND display_order = 19), 
        '/assets/images/Wasteland/2-GreatCanyon/19-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 4, 'Memorystick (Yohan''s Testimony)', '{"type": "text", "content": "Next to the previous Supply Box."}', 20);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Yohan''s Testimony)' AND location_id = 13 AND display_order = 20), 
        '/assets/images/Wasteland/2-GreatCanyon/20-Memorystick-Yohan''s Testimony.1.jpg', 'Memorystick (Yohan''s Testimony)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Yohan''s Testimony)' AND location_id = 13 AND display_order = 20), 
        '/assets/images/Wasteland/2-GreatCanyon/20-Memorystick-Yohan''s Testimony.2.jpg', 'Memorystick (Yohan''s Testimony)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 4, 'Memorystick (Citizen 275''s Testimony)', '{"type": "text", "content": "Northwest of the Central Great Canyon Legion Camp is a corpse with this memorystick."}', 21);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Citizen 275''s Testimony)' AND location_id = 13 AND display_order = 21), 
        '/assets/images/Wasteland/2-GreatCanyon/21-Memorystick-Citizen 275''s Testimony.1.jpg', 'Memorystick (Citizen 275''s Testimony)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Citizen 275''s Testimony)' AND location_id = 13 AND display_order = 21), 
        '/assets/images/Wasteland/2-GreatCanyon/21-Memorystick-Citizen 275''s Testimony.2.jpg', 'Memorystick (Citizen 275''s Testimony)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 4, 'Memorystick (Sentinel 27''s Testimony)', '{"type": "text", "content": "Northeast from the Central Great Canyon Legion Camp is a small nook in the cliff face. Inside you''ll find two human corpses, one with this memorystick."}', 22);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Sentinel 27''s Testimony)' AND location_id = 13 AND display_order = 22), 
        '/assets/images/Wasteland/2-GreatCanyon/22-Memorystick-Sentinel 27''s Testimony.1.jpg', 'Memorystick (Sentinel 27''s Testimony)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Sentinel 27''s Testimony)' AND location_id = 13 AND display_order = 22), 
        '/assets/images/Wasteland/2-GreatCanyon/22-Memorystick-Sentinel 27''s Testimony.2.jpg', 'Memorystick (Sentinel 27''s Testimony)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 17, 'Body Core', '{"type": "text", "content": "Next to the previous memorystick."}', 23);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 13 AND display_order = 23), 
        '/assets/images/Wasteland/2-GreatCanyon/23-Body Core.1.jpg', 'Body Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 13 AND display_order = 23), 
        '/assets/images/Wasteland/2-GreatCanyon/23-Body Core.2.jpg', 'Body Core', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 12, 'Robot - Drone Upgrade Modules', '{"type": "text", "content": "East of the two previous collectibles, on a thin path that heads east."}', 24);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Drone Upgrade Modules' AND location_id = 13 AND display_order = 24), 
        '/assets/images/Wasteland/2-GreatCanyon/24-Robot-2x Drone Upgrade Modules.1.jpg', 'Robot - Drone Upgrade Modules', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Drone Upgrade Modules' AND location_id = 13 AND display_order = 24), 
        '/assets/images/Wasteland/2-GreatCanyon/24-Robot-2x Drone Upgrade Modules.2.jpg', 'Robot - Drone Upgrade Modules', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 4, 'Memorystick (Sentinel 188''s Advice)', '{"type": "text", "content": "Carry on east past the robot until you hit a dead-end, where you''ll find this memorystick."}', 25);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Sentinel 188''s Advice)' AND location_id = 13 AND display_order = 25), 
        '/assets/images/Wasteland/2-GreatCanyon/25-Memorystick-Sentinel 188''s Advice.1.jpg', 'Memorystick (Sentinel 188''s Advice)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Sentinel 188''s Advice)' AND location_id = 13 AND display_order = 25), 
        '/assets/images/Wasteland/2-GreatCanyon/25-Memorystick-Sentinel 188''s Advice.2.jpg', 'Memorystick (Sentinel 188''s Advice)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 13, 'Legion Supply Box', '{"type": "text", "content": "West of the small nook where you found the Body Core and Memorystick."}', 26);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 13 AND display_order = 26), 
        '/assets/images/Wasteland/2-GreatCanyon/26-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 13 AND display_order = 26), 
        '/assets/images/Wasteland/2-GreatCanyon/26-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 13, 'Legion Supply Box', '{"type": "text", "content": "Head northwest from the previous box to get to this box (in a dead end near 2 Hedgeboars)."}', 27);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 13 AND display_order = 27), 
        '/assets/images/Wasteland/2-GreatCanyon/27-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 13 AND display_order = 27), 
        '/assets/images/Wasteland/2-GreatCanyon/27-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (13, 3, 'Can - Cryo Zero', '{"type": "text", "content": "Head south from the previous supply box to a large crate. Opening it will free a flying dartboard. Shoot it and follow it south. Shoot it again, and again, follow it south and then east. Shoot it to get it to drop the can."}', 28);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo Zero' AND location_id = 13 AND display_order = 28), 
        '/assets/images/Wasteland/2-GreatCanyon/28-Can-Cryo Zero.1.jpg', 'Can - Cryo Zero', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo Zero' AND location_id = 13 AND display_order = 28), 
        '/assets/images/Wasteland/2-GreatCanyon/28-Can-Cryo Zero.2.jpg', 'Can - Cryo Zero', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo Zero' AND location_id = 13 AND display_order = 28), 
        '/assets/images/Wasteland/2-GreatCanyon/28-Can-Cryo Zero.3.jpg', 'Can - Cryo Zero', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo Zero' AND location_id = 13 AND display_order = 28), 
        '/assets/images/Wasteland/2-GreatCanyon/28-Can-Cryo Zero.4.jpg', 'Can - Cryo Zero', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo Zero' AND location_id = 13 AND display_order = 28), 
        '/assets/images/Wasteland/2-GreatCanyon/28-Can-Cryo Zero.5.jpg', 'Can - Cryo Zero', 5);

-- Wasteland - Great Canyon (Continued)

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (20, 1, 'Legion Camp - Eastern Great Canyon', '{"type": "text", "content": "In the south east corner of the area just before you take the elevator down towards Altess Levoire."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - Eastern Great Canyon' AND location_id = 20 AND display_order = 1), 
        '/assets/images/Wasteland/9-GreatCanyonCont/1-Legion Camp-Eastern Great Canyon.1.jpg', 'Legion Camp (Eastern Great Canyon)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - Eastern Great Canyon' AND location_id = 20 AND display_order = 1), 
        '/assets/images/Wasteland/9-GreatCanyonCont/1-Legion Camp-Eastern Great Canyon.2.jpg', 'Legion Camp (Eastern Great Canyon)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (20, 4, 'Memorystick - Legionnaire 295''s Orders', '{"type": "text", "content": "To the left of the lift (slightly west of the Eastern Great Canyon Legion Camp)."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 295''s Orders' AND location_id = 20 AND display_order = 2), 
        '/assets/images/Wasteland/9-GreatCanyonCont/2-Memorystick-Legionnaire 295''s Orders.1.jpg', 'Memorystick (Legionnaire 295''s Orders)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 295''s Orders' AND location_id = 20 AND display_order = 2), 
        '/assets/images/Wasteland/9-GreatCanyonCont/2-Memorystick-Legionnaire 295''s Orders.2.jpg', 'Memorystick (Legionnaire 295''s Orders)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (20, 20, 'Exospine - Eagle Eye-Type', '{"type": "text", "content": "To the right of the lift that leads down towards the main mission objective."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Eagle Eye-Type' AND location_id = 20 AND display_order = 3), 
        '/assets/images/Wasteland/9-GreatCanyonCont/3-Eagle Eye-Type Exospine.1.jpg', 'Eagle Eye-Type Exospine', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Eagle Eye-Type' AND location_id = 20 AND display_order = 3), 
        '/assets/images/Wasteland/9-GreatCanyonCont/3-Eagle Eye-Type Exospine.2.jpg', 'Eagle Eye-Type Exospine', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (20, 4, 'Memorystick - Scavenger 216''s Advice', '{"type": "text", "content": "Head southwest from the bottom of the lift to the gate. The human body with with memorystick is there."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Scavenger 216''s Advice' AND location_id = 20 AND display_order = 4), 
        '/assets/images/Wasteland/9-GreatCanyonCont/4-Memorystick-Scavenger 216''s Advice.1.jpg', 'Memorystick (Scavenger 216''s Advice)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Scavenger 216''s Advice' AND location_id = 20 AND display_order = 4), 
        '/assets/images/Wasteland/9-GreatCanyonCont/4-Memorystick-Scavenger 216''s Advice.2.jpg', 'Memorystick (Scavenger 216''s Advice)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (20, 2, 'Document - Prayers - Chapter of Trial 6 - S', '{"type": "text", "content": "From the elevator, heading northwest, before the path goes directly west, on the right (east) is a dead end. In that southern wall is a small cave with a shrine in it."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Prayers - Chapter of Trial 6 - S' AND location_id = 20 AND display_order = 5), 
        '/assets/images/Wasteland/9-GreatCanyonCont/5-Document-Prayers-Chapter of Trial 6-S.1.jpg', 'Document - Prayers (Chapter of Trial 6 - S)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Prayers - Chapter of Trial 6 - S' AND location_id = 20 AND display_order = 5), 
        '/assets/images/Wasteland/9-GreatCanyonCont/5-Document-Prayers-Chapter of Trial 6-S.2.jpg', 'Document - Prayers (Chapter of Trial 6 - S)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (20, 17, 'Body Core', '{"type": "text", "content": "As the path bends west, go east and destroy the crates. There''s a corpse with a Body Core hidden by said crates."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 20 AND display_order = 6), 
        '/assets/images/Wasteland/9-GreatCanyonCont/6-Body Core.1.jpg', 'Body Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 20 AND display_order = 6), 
        '/assets/images/Wasteland/9-GreatCanyonCont/6-Body Core.2.jpg', 'Body Core', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (20, 1, 'Supply Camp - Altess Levoire Entrance', '{"type": "text", "content": "Directly before the entrance to Altess Levoire."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Altess Levoire Entrance' AND location_id = 20 AND display_order = 7), 
        '/assets/images/Wasteland/9-GreatCanyonCont/7-Supply Camp-Altess Levoire Entrance.1.jpg', 'Supply Camp (Altess Levoire Entrance)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Altess Levoire Entrance' AND location_id = 20 AND display_order = 7), 
        '/assets/images/Wasteland/9-GreatCanyonCont/7-Supply Camp-Altess Levoire Entrance.2.jpg', 'Supply Camp (Altess Levoire Entrance)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (20, 13, 'Legion Supply Box', '{"type": "text", "content": "East of the entrance to Altess Levoire is a gate. Go through it towards the other gate, and then turn north and climb the cliffs to the top. Then, head south and jump over the gap to another set of rocks. There''s a chest up there. Inside is an Omnibolt and Fixed Damage Gear (2 star)."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 20 AND display_order = 8), 
        '/assets/images/Wasteland/9-GreatCanyonCont/8-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 20 AND display_order = 8), 
        '/assets/images/Wasteland/9-GreatCanyonCont/8-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 20 AND display_order = 8), 
        '/assets/images/Wasteland/9-GreatCanyonCont/8-Legion Supply Box.3.jpg', 'Legion Supply Box', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 20 AND display_order = 8), 
        '/assets/images/Wasteland/9-GreatCanyonCont/8-Legion Supply Box.4.jpg', 'Legion Supply Box', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (20, 2, 'Document - Series - The Truth, Article 1', '{"type": "text", "content": "Drop down a level and head east to the end where you will see a newspaper dispenser. Interact with it for this document. There''s also a Drone Upgrade Module beside it."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series - The Truth, Article 1' AND location_id = 20 AND display_order = 9), 
        '/assets/images/Wasteland/9-GreatCanyonCont/9-Document-Series-The Truth Article 1.1.jpg', 'Document - Series (The Truth, Article 1)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series - The Truth, Article 1' AND location_id = 20 AND display_order = 9), 
        '/assets/images/Wasteland/9-GreatCanyonCont/9-Document-Series-The Truth Article 1.2.jpg', 'Document - Series (The Truth, Article 1)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (20, 15, 'Nano Suit - Crew Style (NG+ Only)', '{"type": "text", "content": "From there, head back west and traverse the cliff on the southwest side. Before you cross the bridge there''s a Nano Suit box there, on the right."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Crew Style (NG+ Only)' AND location_id = 20 AND display_order = 10), 
        '/assets/images/Wasteland/9-GreatCanyonCont/10-Crew Style Nano Suit.1.jpg', 'Nano Suit - Crew Style', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Crew Style (NG+ Only)' AND location_id = 20 AND display_order = 10), 
        '/assets/images/Wasteland/9-GreatCanyonCont/10-Crew Style Nano Suit.2.jpg', 'Nano Suit - Crew Style', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Crew Style (NG+ Only)' AND location_id = 20 AND display_order = 10), 
        '/assets/images/Wasteland/9-GreatCanyonCont/10-Crew Style Nano Suit.3.jpg', 'Nano Suit - Crew Style', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (20, 4, 'Memorystick - Sentinel 65''s Testament', '{"type": "text", "content": "Cross the bridge and drop into the courtyard down below."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 65''s Testament' AND location_id = 20 AND display_order = 11), 
        '/assets/images/Wasteland/9-GreatCanyonCont/11-Memorystick-Sentinel 65''s Testament.1.jpg', 'Memorystick (Sentinel 65''s Testament)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 65''s Testament' AND location_id = 20 AND display_order = 11), 
        '/assets/images/Wasteland/9-GreatCanyonCont/11-Memorystick-Sentinel 65''s Testament.2.jpg', 'Memorystick (Sentinel 65''s Testament)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (20, 3, 'Can - GrainT Barley', '{"type": "text", "content": "Solve the pressure plate puzzle in the same area, by putting all 3 carts on the left-hand pressure plate (so it reads 23 on the left and 3 on the right)."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - GrainT Barley' AND location_id = 20 AND display_order = 12), 
        '/assets/images/Wasteland/9-GreatCanyonCont/12-Can-GrainT Barley.1.jpg', 'Can - GrainT Barley', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - GrainT Barley' AND location_id = 20 AND display_order = 12), 
        '/assets/images/Wasteland/9-GreatCanyonCont/12-Can-GrainT Barley.2.jpg', 'Can - GrainT Barley', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - GrainT Barley' AND location_id = 20 AND display_order = 12), 
        '/assets/images/Wasteland/9-GreatCanyonCont/12-Can-GrainT Barley.3.jpg', 'Can - GrainT Barley', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - GrainT Barley' AND location_id = 20 AND display_order = 12), 
        '/assets/images/Wasteland/9-GreatCanyonCont/12-Can-GrainT Barley.4.jpg', 'Can - GrainT Barley', 4);

-- Wasteland - Oil Storage Facility

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (15, 4, 'Memorystick - Lee''s Complaint', '{"type": "text", "content": "This is part of the \u201cUrgent Information\u201d side quest."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Lee''s Complaint' AND location_id = 15 AND display_order = 1), 
        '/assets/images/Wasteland/4-OilStorageFacility/1-Memorystick-Lee''s Complaint.1.jpg', 'Memorystick (Lee''s Complaint)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Lee''s Complaint' AND location_id = 15 AND display_order = 1), 
        '/assets/images/Wasteland/4-OilStorageFacility/1-Memorystick-Lee''s Complaint.2.jpg', 'Memorystick (Lee''s Complaint)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (15, 4, 'Memorystick - Woo''s Record', '{"type": "text", "content": "This is part of the \u201cUrgent Information\u201d side quest."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Woo''s Record' AND location_id = 15 AND display_order = 2), 
        '/assets/images/Wasteland/4-OilStorageFacility/2-Memorystick-Woo''s Record.1.jpg', 'Memorystick (Young''s Screams)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Woo''s Record' AND location_id = 15 AND display_order = 2), 
        '/assets/images/Wasteland/4-OilStorageFacility/2-Memorystick-Woo''s Record.2.jpg', 'Memorystick (Young''s Screams)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (15, 4, 'Memorystick - Young''s Screams', '{"type": "text", "content": "This is part of the \u201cUrgent Information\u201d side quest."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Young''s Screams' AND location_id = 15 AND display_order = 3), 
        '/assets/images/Wasteland/4-OilStorageFacility/3-Memorystick-Young''s Screams.1.jpg', 'Memorystick (Young''s Screams)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Young''s Screams' AND location_id = 15 AND display_order = 3), 
        '/assets/images/Wasteland/4-OilStorageFacility/3-Memorystick-Young''s Screams.2.jpg', 'Memorystick (Young''s Screams)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (15, 17, 'Body Core', '{"type": "text", "content": "Right at the northside of the oil storage facility, inside a shipping container."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 15 AND display_order = 4), 
        '/assets/images/Wasteland/4-OilStorageFacility/4-Body Core.1.jpg', 'Body Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 15 AND display_order = 4), 
        '/assets/images/Wasteland/4-OilStorageFacility/4-Body Core.2.jpg', 'Body Core', 2);

-- Wasteland - Plant

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (19, 4, 'Memorystick - Luke''s Memory', '{"type": "text", "content": "At the bottom of the water in the middle of the Plant."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Luke''s Memory' AND location_id = 19 AND display_order = 1), 
        '/assets/images/Wasteland/8-Plant/1-Memorystick-Luke''s Memory.1.jpg', 'Memorystick (Luke''s Memory)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Luke''s Memory' AND location_id = 19 AND display_order = 1), 
        '/assets/images/Wasteland/8-Plant/1-Memorystick-Luke''s Memory.2.jpg', 'Memorystick (Luke''s Memory)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (19, 4, 'Memorystick - Go''s Memory', '{"type": "text", "content": "Once you pick up the \u201cIncarceration\u201d side quest from the guy in the shipping container, you''ll find another corpse in the water. This one with this memorystick."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Go''s Memory' AND location_id = 19 AND display_order = 2), 
        '/assets/images/Wasteland/8-Plant/2-Memorystick-Go''s Memory.1.jpg', 'Memorystick (Go''s Memory)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Go''s Memory' AND location_id = 19 AND display_order = 2), 
        '/assets/images/Wasteland/8-Plant/2-Memorystick-Go''s Memory.2.jpg', 'Memorystick (Go''s Memory)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (19, 13, 'Legion Supply Box', '{"type": "text", "content": "Above the red lights in the middle of the water, on that platform."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 19 AND display_order = 3), 
        '/assets/images/Wasteland/8-Plant/3-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 19 AND display_order = 3), 
        '/assets/images/Wasteland/8-Plant/3-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (19, 3, 'Can - The Machinetta Cafe Latte', '{"type": "text", "content": "Push all three storage trolleys on the pressure plates and this will drop from the crane."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Machinetta Cafe Latte' AND location_id = 19 AND display_order = 4), 
        '/assets/images/Wasteland/8-Plant/4-Can-The Machinetta Cafe Latte.1.jpg', 'Can - The Machinetta Cafe Latte', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Machinetta Cafe Latte' AND location_id = 19 AND display_order = 4), 
        '/assets/images/Wasteland/8-Plant/4-Can-The Machinetta Cafe Latte.2.jpg', 'Can - The Machinetta Cafe Latte', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Machinetta Cafe Latte' AND location_id = 19 AND display_order = 4), 
        '/assets/images/Wasteland/8-Plant/4-Can-The Machinetta Cafe Latte.3.jpg', 'Can - The Machinetta Cafe Latte', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Machinetta Cafe Latte' AND location_id = 19 AND display_order = 4), 
        '/assets/images/Wasteland/8-Plant/4-Can-The Machinetta Cafe Latte.4.jpg', 'Can - The Machinetta Cafe Latte', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Machinetta Cafe Latte' AND location_id = 19 AND display_order = 4), 
        '/assets/images/Wasteland/8-Plant/4-Can-The Machinetta Cafe Latte.5.jpg', 'Can - The Machinetta Cafe Latte', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Machinetta Cafe Latte' AND location_id = 19 AND display_order = 4), 
        '/assets/images/Wasteland/8-Plant/4-Can-The Machinetta Cafe Latte.6.jpg', 'Can - The Machinetta Cafe Latte', 6);

-- Wasteland - Scrap Plains

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 1, 'Supply Camp (Central Scrap Plains)', '{"type": "text", "content": "As soon as you enter the Scrap Plains from the Barren Lands."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp (Central Scrap Plains)' AND location_id = 14 AND display_order = 1), 
        '/assets/images/Wasteland/3-ScrapPlains/1-Supply Camp-Central Scrap Plains.1.jpg', 'Supply Camp (Central Scrap Plains)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp (Central Scrap Plains)' AND location_id = 14 AND display_order = 1), 
        '/assets/images/Wasteland/3-ScrapPlains/1-Supply Camp-Central Scrap Plains.2.jpg', 'Supply Camp (Central Scrap Plains)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 2, 'Document - Log Data - S2RV1C2-7812''s Data', '{"type": "text", "content": "Southeast of the supply camp is a small yellow droid. Interact with it to unlock this log."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Log Data - S2RV1C2-7812''s Data' AND location_id = 14 AND display_order = 2), 
        '/assets/images/Wasteland/3-ScrapPlains/2-Document-Log Data-S2RV1C2-7812''s Data.1.jpg', 'Document - Log Data (S2RV1C2-7812''s Data)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Log Data - S2RV1C2-7812''s Data' AND location_id = 14 AND display_order = 2), 
        '/assets/images/Wasteland/3-ScrapPlains/2-Document-Log Data-S2RV1C2-7812''s Data.2.jpg', 'Document - Log Data (S2RV1C2-7812''s Data)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 13, 'Legion Supply Box', '{"type": "text", "content": "Further southeast of the previous document. Inside a shipping container near the edge of the cliff."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 14 AND display_order = 3), 
        '/assets/images/Wasteland/3-ScrapPlains/3-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 14 AND display_order = 3), 
        '/assets/images/Wasteland/3-ScrapPlains/3-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 13, 'Locked Legion Supply Box', '{"type": "text", "content": "South of the previous Supply Box, in a small area that you can get to by heading west from the previous supply box. Shoot the barrels to free the box from tar. Need the Hacking Tool to unlock."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Legion Supply Box' AND location_id = 14 AND display_order = 4), 
        '/assets/images/Wasteland/3-ScrapPlains/4-Locked Legion Supply Box.1.jpg', 'Locked Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Legion Supply Box' AND location_id = 14 AND display_order = 4), 
        '/assets/images/Wasteland/3-ScrapPlains/4-Locked Legion Supply Box.2.jpg', 'Locked Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 14, 'Beta Core', '{"type": "text", "content": "Head east from the last lot of collectibles to the building by the scrap piles. In the middle of the scrap piles is a human corpse with this Beta Core."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 14 AND display_order = 5), 
        '/assets/images/Wasteland/3-ScrapPlains/5-Beta Core.1.jpg', 'Beta Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 14 AND display_order = 5), 
        '/assets/images/Wasteland/3-ScrapPlains/5-Beta Core.2.jpg', 'Beta Core', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 2, 'Document - Messages - Do Not Disturb', '{"type": "text", "content": "On the front of the building east of the previous collectible. Near the ladder."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Messages - Do Not Disturb' AND location_id = 14 AND display_order = 6), 
        '/assets/images/Wasteland/3-ScrapPlains/6-Document-Messages-Do Not Disturb.1.jpg', 'Document - Messages (Do Not Disturb)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Messages - Do Not Disturb' AND location_id = 14 AND display_order = 6), 
        '/assets/images/Wasteland/3-ScrapPlains/6-Document-Messages-Do Not Disturb.2.jpg', 'Document - Messages (Do Not Disturb)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 1, 'Legion Camp - Bus Stop', '{"type": "text", "content": "Northeast of the previous shack is a literal bus stop which doubles up as a camp."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - Bus Stop' AND location_id = 14 AND display_order = 7), 
        '/assets/images/Wasteland/3-ScrapPlains/7-Legion Camp-Bus Stop.1.jpg', 'Legion Camp (Bus Stop)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - Bus Stop' AND location_id = 14 AND display_order = 7), 
        '/assets/images/Wasteland/3-ScrapPlains/7-Legion Camp-Bus Stop.2.jpg', 'Legion Camp (Bus Stop)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 13, 'Legion Supply Box', '{"type": "text", "content": "East of the Bus Stop, in a container. Contains Ranged Enhancement Gear and 1 Omnibolt."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 14 AND display_order = 8), 
        '/assets/images/Wasteland/3-ScrapPlains/8-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 14 AND display_order = 8), 
        '/assets/images/Wasteland/3-ScrapPlains/8-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 12, 'Robot - Passcode - rB0aya', '{"type": "text", "content": "Southeast of the bus stop are some ruins with a robot inside."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Passcode - rB0aya' AND location_id = 14 AND display_order = 9), 
        '/assets/images/Wasteland/3-ScrapPlains/9-Robot-Passcode-rB0aya.1.jpg', 'Robot - Passcode (rB0aya)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Passcode - rB0aya' AND location_id = 14 AND display_order = 9), 
        '/assets/images/Wasteland/3-ScrapPlains/9-Robot-Passcode-rB0aya.2.jpg', 'Robot - Passcode (rB0aya)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 12, 'Robot - Drone Upgrade Modules', '{"type": "text", "content": "South-southeast of the bus stop, all the way down to the end of the level is a broken highway. Get on the highway and the robot is to the far south (watch out for the turret though)."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Drone Upgrade Modules' AND location_id = 14 AND display_order = 10), 
        '/assets/images/Wasteland/3-ScrapPlains/11-Robot-2x Drone Upgrade Modules.1.jpg', 'Robot - Drone Upgrade Modules', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Drone Upgrade Modules' AND location_id = 14 AND display_order = 10), 
        '/assets/images/Wasteland/3-ScrapPlains/11-Robot-2x Drone Upgrade Modules.2.jpg', 'Robot - Drone Upgrade Modules', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 13, 'Legion Supply Box', '{"type": "text", "content": "Go up and to the east from the Waypoint, climbing towards the top. On the way you''ll pass a crate."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 14 AND display_order = 11), 
        '/assets/images/Wasteland/3-ScrapPlains/12-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 14 AND display_order = 11), 
        '/assets/images/Wasteland/3-ScrapPlains/12-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 14, 'Beta Core', '{"type": "text", "content": "Keep climbing to the top (above the Waypoint), and there''s a body with a Beta Core on the edge."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 14 AND display_order = 12), 
        '/assets/images/Wasteland/3-ScrapPlains/13-Beta Core.1.jpg', 'Beta Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 14 AND display_order = 12), 
        '/assets/images/Wasteland/3-ScrapPlains/13-Beta Core.2.jpg', 'Beta Core', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 5, 'Locked Supply Chest', '{"type": "text", "content": "Now head northeast from up top and out the back of the collapsed buildings. Contains 5x Drone Upgrade Modules."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 14 AND display_order = 13), 
        '/assets/images/Wasteland/3-ScrapPlains/14-Locked Legion Supply Chest.1.jpg', 'Locked Legion Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 14 AND display_order = 13), 
        '/assets/images/Wasteland/3-ScrapPlains/14-Locked Legion Supply Chest.2.jpg', 'Locked Legion Supply Chest', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 4, 'Memorystick (Sentinel 90''s Resignation)', '{"type": "text", "content": "Back west of the bus stop (northeast of the Central Scrap Plains)."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Sentinel 90''s Resignation)' AND location_id = 14 AND display_order = 14), 
        '/assets/images/Wasteland/3-ScrapPlains/15-Memorystick-Sentinel 90''s Resignation.1.jpg', 'Memorystick (Sentinel 90''s Resignation)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Sentinel 90''s Resignation)' AND location_id = 14 AND display_order = 14), 
        '/assets/images/Wasteland/3-ScrapPlains/15-Memorystick-Sentinel 90''s Resignation.2.jpg', 'Memorystick (Sentinel 90''s Resignation)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 13, 'Legion Supply Box', '{"type": "text", "content": "Northwest of the Central Scrap Plains Supply Camp, under a small shelter by the cliff face."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 14 AND display_order = 15), 
        '/assets/images/Wasteland/3-ScrapPlains/17-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 14 AND display_order = 15), 
        '/assets/images/Wasteland/3-ScrapPlains/17-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 13, 'Legion Supply Box', '{"type": "text", "content": "Southwest of the Waypoint, up the slope, near a large generator."}', 16);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 14 AND display_order = 16), 
        '/assets/images/Wasteland/3-ScrapPlains/19-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 14 AND display_order = 16), 
        '/assets/images/Wasteland/3-ScrapPlains/19-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 12, 'Robot - Passcode - uyKLaB', '{"type": "text", "content": "As you keep heading up past the two turrets from below, look southwest and there''ll be a robot there."}', 17);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Passcode - uyKLaB' AND location_id = 14 AND display_order = 17), 
        '/assets/images/Wasteland/3-ScrapPlains/20-Robot-Passcode-uyKLaB.1.jpg', 'Robot - Passcode (uyKLaB)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Passcode - uyKLaB' AND location_id = 14 AND display_order = 17), 
        '/assets/images/Wasteland/3-ScrapPlains/20-Robot-Passcode-uyKLaB.2.jpg', 'Robot - Passcode (uyKLaB)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 13, 'Legion Supply Box', '{"type": "text", "content": "Right behind the robot."}', 18);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 14 AND display_order = 18), 
        '/assets/images/Wasteland/3-ScrapPlains/21-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 14 AND display_order = 18), 
        '/assets/images/Wasteland/3-ScrapPlains/21-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 5, 'Locked Supply Chest', '{"type": "text", "content": "You need to destroy all the red drones working on the towers (and turn the power on down the button) in the same area as the other two. Once done, the door will open on the shack at the top of the hill. Contains 2 WB Pumps."}', 19);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 14 AND display_order = 19), 
        '/assets/images/Wasteland/3-ScrapPlains/22-Locked Legion Supply Chest.1.jpg', 'Locked Legion Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 14 AND display_order = 19), 
        '/assets/images/Wasteland/3-ScrapPlains/22-Locked Legion Supply Chest.2.jpg', 'Locked Legion Supply Chest', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 14 AND display_order = 19), 
        '/assets/images/Wasteland/3-ScrapPlains/22-Locked Legion Supply Chest.3.jpg', 'Locked Legion Supply Chest', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 14 AND display_order = 19), 
        '/assets/images/Wasteland/3-ScrapPlains/22-Locked Legion Supply Chest.4.jpg', 'Locked Legion Supply Chest', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 3, 'Can - Corsair Lager', '{"type": "text", "content": "Northwest of the Waypoint is a yellow structure. The crate is up high. Head to the north of that dead end from where you are. At the top is a level that drops one of the platforms on a timer. Pull the lever, race back, avoid the two turrets, and the chest is all yours."}', 20);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Corsair Lager' AND location_id = 14 AND display_order = 20), 
        '/assets/images/Wasteland/3-ScrapPlains/23-Can-Corsair Lager.1.jpg', 'Can - Corsair Lager', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Corsair Lager' AND location_id = 14 AND display_order = 20), 
        '/assets/images/Wasteland/3-ScrapPlains/23-Can-Corsair Lager.2.jpg', 'Can - Corsair Lager', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Corsair Lager' AND location_id = 14 AND display_order = 20), 
        '/assets/images/Wasteland/3-ScrapPlains/23-Can-Corsair Lager.3.jpg', 'Can - Corsair Lager', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Corsair Lager' AND location_id = 14 AND display_order = 20), 
        '/assets/images/Wasteland/3-ScrapPlains/23-Can-Corsair Lager.4.jpg', 'Can - Corsair Lager', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 5, 'Locked Supply Chest', '{"type": "text", "content": "North of the Waypoint, jump on the yellow bus and onto the back of the monorail. Contains 4x Bionic Field Generators."}', 21);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 14 AND display_order = 21), 
        '/assets/images/Wasteland/3-ScrapPlains/24-Locked Legion Supply Chest.1.jpg', 'Locked Legion Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 14 AND display_order = 21), 
        '/assets/images/Wasteland/3-ScrapPlains/24-Locked Legion Supply Chest.2.jpg', 'Locked Legion Supply Chest', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 14 AND display_order = 21), 
        '/assets/images/Wasteland/3-ScrapPlains/24-Locked Legion Supply Chest.3.jpg', 'Locked Legion Supply Chest', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (14, 4, 'Memorystick (Scavenger 114''s Wish)', '{"type": "text", "content": "Drop down, and slightly north of the monorail cabin is a dead human."}', 22);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Scavenger 114''s Wish)' AND location_id = 14 AND display_order = 22), 
        '/assets/images/Wasteland/3-ScrapPlains/25-Memorystick-Scavenger 114''s Wish.1.jpg', 'Memorystick (Scavenger 114''s Wish)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Scavenger 114''s Wish)' AND location_id = 14 AND display_order = 22), 
        '/assets/images/Wasteland/3-ScrapPlains/25-Memorystick-Scavenger 114''s Wish.2.jpg', 'Memorystick (Scavenger 114''s Wish)', 2);

-- Wasteland - Scrap Plains (Continued)

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (18, 1, 'Supply Camp - Junkyard', '{"type": "text", "content": "When you get through the wallrunning tutorial as you head south, there''ll be a camp on the left."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Junkyard' AND location_id = 18 AND display_order = 1), 
        '/assets/images/Wasteland/7-ScrapPlainsCont/1-Supply Camp-Junkyard.1.jpg', 'Supply Camp (Junkyard)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Junkyard' AND location_id = 18 AND display_order = 1), 
        '/assets/images/Wasteland/7-ScrapPlainsCont/1-Supply Camp-Junkyard.2.jpg', 'Supply Camp (Junkyard)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (18, 3, 'Can - Pixie Zero', '{"type": "text", "content": "Just nearby the previous one, head to the northern edge and shoot the 3 girders where the drone is. Doing that will cause the drone to fly upwards and dig up a can for you."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Pixie Zero' AND location_id = 18 AND display_order = 2), 
        '/assets/images/Wasteland/7-ScrapPlainsCont/2-Can-Pixie Zero.1.jpg', 'Can - Pixie Zero', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Pixie Zero' AND location_id = 18 AND display_order = 2), 
        '/assets/images/Wasteland/7-ScrapPlainsCont/2-Can-Pixie Zero.2.jpg', 'Can - Pixie Zero', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Pixie Zero' AND location_id = 18 AND display_order = 2), 
        '/assets/images/Wasteland/7-ScrapPlainsCont/2-Can-Pixie Zero.3.jpg', 'Can - Pixie Zero', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Pixie Zero' AND location_id = 18 AND display_order = 2), 
        '/assets/images/Wasteland/7-ScrapPlainsCont/2-Can-Pixie Zero.4.jpg', 'Can - Pixie Zero', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (18, 13, 'Legion Supply Box', '{"type": "text", "content": "Northwest of the Junkyard Supply Camp, before you get on the path to the northwest and then northeast, there''s a small dead end to the east."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 18 AND display_order = 3), 
        '/assets/images/Wasteland/7-ScrapPlainsCont/3-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 18 AND display_order = 3), 
        '/assets/images/Wasteland/7-ScrapPlainsCont/3-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (18, 4, 'Memorystick - Albert''s Memory', '{"type": "text", "content": "Follow the path to the top to a load of crates and building materials. This dead body is on the other side of them."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Albert''s Memory' AND location_id = 18 AND display_order = 4), 
        '/assets/images/Wasteland/7-ScrapPlainsCont/4-Memorystick-Albert''s Memory.1.jpg', 'Memorystick (Albert''s Memory)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Albert''s Memory' AND location_id = 18 AND display_order = 4), 
        '/assets/images/Wasteland/7-ScrapPlainsCont/4-Memorystick-Albert''s Memory.2.jpg', 'Memorystick (Albert''s Memory)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (18, 4, 'Memorystick - Aaron''s Memory / Passcode - aSaSaS', '{"type": "text", "content": "Hit the button near Albert''s body, and then shoot the targets in the same order they appear to unlock where they came from. Down there is Aaron''s body (and a passcode for Xion: aSaSaS)."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Aaron''s Memory / Passcode - aSaSaS' AND location_id = 18 AND display_order = 5), 
        '/assets/images/Wasteland/7-ScrapPlainsCont/5-Memorystick-Aaron''s Memory & Passcode for Xion - aSaSaS.1.jpg', 'Memorystick (Aaron''s Memory) & Passcode - aSaSaS', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Aaron''s Memory / Passcode - aSaSaS' AND location_id = 18 AND display_order = 5), 
        '/assets/images/Wasteland/7-ScrapPlainsCont/5-Memorystick-Aaron''s Memory & Passcode for Xion - aSaSaS.2.jpg', 'Memorystick (Aaron''s Memory) & Passcode - aSaSaS', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Aaron''s Memory / Passcode - aSaSaS' AND location_id = 18 AND display_order = 5), 
        '/assets/images/Wasteland/7-ScrapPlainsCont/5-Memorystick-Aaron''s Memory & Passcode for Xion - aSaSaS.3.jpg', 'Memorystick (Aaron''s Memory) & Passcode - aSaSaS', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (18, 5, 'Locked Supply Chest', '{"type": "text", "content": "Southeast of the Junkyard Supply Camp is a chest, near a drone. Code to get in is 0nrrrS."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 18 AND display_order = 6), 
        '/assets/images/Wasteland/7-ScrapPlainsCont/6-Locked Legion Chest.1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 18 AND display_order = 6), 
        '/assets/images/Wasteland/7-ScrapPlainsCont/6-Locked Legion Chest.2.jpg', 'Locked Supply Chest', 2);

-- Wasteland - Scrap Yard

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (16, 1, 'Supply Camp - Scrap Yard Entrance', '{"type": "text", "content": "Follow the path down from the northeast and you''ll come to a small robot town (Scrap Yard), as well as this Supply Camp."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Scrap Yard Entrance' AND location_id = 16 AND display_order = 1), 
        '/assets/images/Wasteland/5-ScrapYard/1-Supply Camp-Scrap Yard Entrance.1.jpg', 'Supply Camp (Scrap Yard Entrance)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Scrap Yard Entrance' AND location_id = 16 AND display_order = 1), 
        '/assets/images/Wasteland/5-ScrapYard/1-Supply Camp-Scrap Yard Entrance.2.jpg', 'Supply Camp (Scrap Yard Entrance)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (16, 13, 'Legion Supply Box', '{"type": "text", "content": "in the northeast corner of the Scrap Yard, but even with a yellow box, the ladder appears not to have collision detection. Come back when you have the Double Jump if you can''t get it."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 16 AND display_order = 2), 
        '/assets/images/Wasteland/5-ScrapYard/3-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 16 AND display_order = 2), 
        '/assets/images/Wasteland/5-ScrapYard/3-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (16, 13, 'Legion Supply Box', '{"type": "text", "content": "There''s another one in the south corner of the area. Climb up and jump over a fence to reach the back wall."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 16 AND display_order = 3), 
        '/assets/images/Wasteland/5-ScrapYard/4-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 16 AND display_order = 3), 
        '/assets/images/Wasteland/5-ScrapYard/4-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (16, 2, 'Available to purchase from D1G-g2r:', '{"type": "list", "items": ["2 Weapon Cores", "3 Tumbler Expansion Modules", "5 Drone Upgrade Modules", "3 Omnibolts", "Nano Element", "Advanced Nano Element", "Extreme Nano Element", "Document - Information - Service Drones", "Document - Series - Plastic Hearts, Vol. 2", "Document - Information - Conspiracy", "Oval Horn-Rimmed Glasses", "Metal-Framed Glasses", "Cat''s Eye Glasses"]}', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (16, 22, 'D1G-g2r Level 2 Affinity:', '{"type": "list", "items": ["Brown Horn-Rimmed Glasses", "Laboratory Goggles", "Polygonal-Framed Glasses", "Square-Framed Glasses"]}', 5);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (16, 22, 'D1G-g2r Level 3 Affinity:', '{"type": "list", "items": ["Classic Round Glasses", "Skinny Sunglasses", "Orange Aviators", "Oversized Sunglasses"]}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'D1G-g2r Level 3 Affinity:' AND location_id = 16 AND display_order = 6), 
        '/assets/images/Wasteland/5-ScrapYard/5-D1G-g2r.1.jpg', 'Document - Information - Service Drones', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'D1G-g2r Level 3 Affinity:' AND location_id = 16 AND display_order = 6), 
        '/assets/images/Wasteland/5-ScrapYard/5-D1G-g2r.2.jpg', 'Document - Series - Plastic Hearts, Vol. 2', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'D1G-g2r Level 3 Affinity:' AND location_id = 16 AND display_order = 6), 
        '/assets/images/Wasteland/5-ScrapYard/5-D1G-g2r.3.jpg', 'Document - Information - Conspiracy', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (16, 5, 'Locked Supply Chest', '{"type": "text", "content": "Leave D1G-g2r''s Scrap Yard and head southeast. Unlock the gate (to open the shortcut) and then unlock the Locked Chest (with the d-pad mini-game)."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 16 AND display_order = 7), 
        '/assets/images/Wasteland/5-ScrapYard/2-Locked Legion Supply Chest.1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 16 AND display_order = 7), 
        '/assets/images/Wasteland/5-ScrapYard/2-Locked Legion Supply Chest.2.jpg', 'Locked Supply Chest', 2);

-- Wasteland - Wasteland Basin

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (17, 4, 'Memorystick - Sentinel 47''s Decision', '{"type": "text", "content": "Carry on south up the hill from the Corrupter Boss Fight."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 47''s Decision' AND location_id = 17 AND display_order = 1), 
        '/assets/images/Wasteland/6-WastelandBasin/1-Memorystick - Sentinel 47''s Decision.1.jpg', 'Memorystick (Sentinel 47''s Decision)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 47''s Decision' AND location_id = 17 AND display_order = 1), 
        '/assets/images/Wasteland/6-WastelandBasin/1-Memorystick - Sentinel 47''s Decision.2.jpg', 'Memorystick (Sentinel 47''s Decision)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (17, 15, 'Nano Suit - Holiday Bunny', '{"type": "text", "content": "Next to the human body where the memorystick came from is a small box where this Nano Suit can be found."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Holiday Bunny' AND location_id = 17 AND display_order = 2), 
        '/assets/images/Wasteland/6-WastelandBasin/2-Nano Suit - Holiday Bunny.1.jpg', 'Nano Suit - Holiday Bunny', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Holiday Bunny' AND location_id = 17 AND display_order = 2), 
        '/assets/images/Wasteland/6-WastelandBasin/2-Nano Suit - Holiday Bunny.2.jpg', 'Nano Suit - Holiday Bunny', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (17, 13, 'Legion Supply Box', '{"type": "text", "content": "Southwest of the waypoint is a decently sized encampment. Clear the enemies, and then use the batteries on the pressure plates to open the gates. First, the one on the left to free the orange box. Second on the right to free the second battery. Then, put both of the batteries on the plates to open the door. Push the orange box southwest, and use it to get on top of the place where you freed the trapped battery. Has an Omnibolt and Gold Gear inside of it."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 17 AND display_order = 3), 
        '/assets/images/Wasteland/6-WastelandBasin/3-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 17 AND display_order = 3), 
        '/assets/images/Wasteland/6-WastelandBasin/3-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (17, 15, 'Nano Suit - Cyber Magician', '{"type": "text", "content": "Drop down, push the orange box through the main gate and onto the big platform. Then jump up and climb the rope, interact with the chest, and shoot all the targets except the red ones before they disappear. Do that and this nano suit is all yours."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Cyber Magician' AND location_id = 17 AND display_order = 4), 
        '/assets/images/Wasteland/6-WastelandBasin/4-Nano Suit - Cyber Magician.1.jpg', 'Nano Suit - Cyber Magician', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Cyber Magician' AND location_id = 17 AND display_order = 4), 
        '/assets/images/Wasteland/6-WastelandBasin/4-Nano Suit - Cyber Magician.2.jpg', 'Nano Suit - Cyber Magician', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Cyber Magician' AND location_id = 17 AND display_order = 4), 
        '/assets/images/Wasteland/6-WastelandBasin/4-Nano Suit - Cyber Magician.3.jpg', 'Nano Suit - Cyber Magician', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Cyber Magician' AND location_id = 17 AND display_order = 4), 
        '/assets/images/Wasteland/6-WastelandBasin/4-Nano Suit - Cyber Magician.4.jpg', 'Nano Suit - Cyber Magician', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (17, 4, 'Memorystick - Citizen 290''s Prayer', '{"type": "text", "content": "Follow the path west from the waypoint, the memorystick is between the ruined building and the rocky hill."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Citizen 290''s Prayer' AND location_id = 17 AND display_order = 5), 
        '/assets/images/Wasteland/6-WastelandBasin/5-Memorystick - Citizen 290''s Prayer.1.jpg', 'Memorystick (Citizen 290''s Prayer)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Citizen 290''s Prayer' AND location_id = 17 AND display_order = 5), 
        '/assets/images/Wasteland/6-WastelandBasin/5-Memorystick - Citizen 290''s Prayer.2.jpg', 'Memorystick (Citizen 290''s Prayer)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (17, 3, 'Can - Bayern Hefe WeissBier', '{"type": "text", "content": "Pull a 180 from the memorystick, and the Fiz machine is straight ahead."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Bayern Hefe WeissBier' AND location_id = 17 AND display_order = 6), 
        '/assets/images/Wasteland/6-WastelandBasin/6-Can - Bayern Hefe WeissBier.1.jpg', 'Can - Bayern Hefe WeissBier', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Bayern Hefe WeissBier' AND location_id = 17 AND display_order = 6), 
        '/assets/images/Wasteland/6-WastelandBasin/6-Can - Bayern Hefe WeissBier.2.jpg', 'Can - Bayern Hefe WeissBier', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Bayern Hefe WeissBier' AND location_id = 17 AND display_order = 6), 
        '/assets/images/Wasteland/6-WastelandBasin/6-Can - Bayern Hefe WeissBier.3.jpg', 'Can - Bayern Hefe WeissBier', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (17, 2, 'Document - Series - The Truth, Article 5', '{"type": "text", "content": "Continue on the path west from the Fiz machine until you come to a small open-area, on the north side, next to a vending machine, is a blue newspaper dispensary. Interact to get this document."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series - The Truth, Article 5' AND location_id = 17 AND display_order = 7), 
        '/assets/images/Wasteland/6-WastelandBasin/7-Documents - Series - The Truth Article 5.1.jpg', 'Document - Series (The Truth, Article 5)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series - The Truth, Article 5' AND location_id = 17 AND display_order = 7), 
        '/assets/images/Wasteland/6-WastelandBasin/7-Documents - Series - The Truth Article 5.2.jpg', 'Document - Series (The Truth, Article 5)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (17, 13, 'Legion Supply Box', '{"type": "text", "content": "Opposite the previous collectible, behind the ruins to the south."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 17 AND display_order = 8), 
        '/assets/images/Wasteland/6-WastelandBasin/8-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 17 AND display_order = 8), 
        '/assets/images/Wasteland/6-WastelandBasin/8-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

-- Wasteland - Wasteland (Continued)

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (22, 3, 'Can - Mountain Sparkle Haller', '{"type": "text", "content": "Now that you have Double Jump, fast-travel to the Western Great Canyon Supply Camp and head north, and climb the cliffs to the north. Keep running, jumping and climbing until you reach the top. There\u2019s an ice chest with this can in it."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Mountain Sparkle Haller' AND location_id = 22 AND display_order = 1), 
        '/assets/images/Wasteland/11-WastelandCont/1-Can-Mountain Sparkle Haller.1.jpg', 'Can - Mountain Sparkle Haller', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Mountain Sparkle Haller' AND location_id = 22 AND display_order = 1), 
        '/assets/images/Wasteland/11-WastelandCont/1-Can-Mountain Sparkle Haller.2.jpg', 'Can - Mountain Sparkle Haller', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Mountain Sparkle Haller' AND location_id = 22 AND display_order = 1), 
        '/assets/images/Wasteland/11-WastelandCont/1-Can-Mountain Sparkle Haller.3.jpg', 'Can - Mountain Sparkle Haller', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Mountain Sparkle Haller' AND location_id = 22 AND display_order = 1), 
        '/assets/images/Wasteland/11-WastelandCont/1-Can-Mountain Sparkle Haller.4.jpg', 'Can - Mountain Sparkle Haller', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Mountain Sparkle Haller' AND location_id = 22 AND display_order = 1), 
        '/assets/images/Wasteland/11-WastelandCont/1-Can-Mountain Sparkle Haller.5.jpg', 'Can - Mountain Sparkle Haller', 5);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (22, 14, 'Beta Core', '{"type": "text", "content": "Just to the right of the can is a human body with this Beta Core in it."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 22 AND display_order = 2), 
        '/assets/images/Wasteland/11-WastelandCont/2-Beta Core.1.jpg', 'Beta Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 22 AND display_order = 2), 
        '/assets/images/Wasteland/11-WastelandCont/2-Beta Core.2.jpg', 'Beta Core', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (22, 21, 'Adam Outfit (Junkman)', '{"type": "text", "content": "Head up further (to the north) and then head west and south across the bridge. There you''ll find a lot of enemies and also a crate with this inside."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Adam Outfit (Junkman)' AND location_id = 22 AND display_order = 3), 
        '/assets/images/Wasteland/11-WastelandCont/3-Junkman-Adam Outfit.1.jpg', 'Adam Outfit (Junkman)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Adam Outfit (Junkman)' AND location_id = 22 AND display_order = 3), 
        '/assets/images/Wasteland/11-WastelandCont/3-Junkman-Adam Outfit.2.jpg', 'Adam Outfit (Junkman)', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Adam Outfit (Junkman)' AND location_id = 22 AND display_order = 3), 
        '/assets/images/Wasteland/11-WastelandCont/3-Junkman-Adam Outfit.3.jpg', 'Adam Outfit (Junkman)', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (22, 13, 'Legion Supply Box', '{"type": "text", "content": "Northeast of the Barren Land Legion Camp is a wall you can climb (near the waypoint, north facing cliff face)."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 22 AND display_order = 4), 
        '/assets/images/Wasteland/11-WastelandCont/4-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 22 AND display_order = 4), 
        '/assets/images/Wasteland/11-WastelandCont/4-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 22 AND display_order = 4), 
        '/assets/images/Wasteland/11-WastelandCont/4-Legion Supply Box.3.jpg', 'Legion Supply Box', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (22, 2, 'Document - Journal - Investigation Journal', '{"type": "text", "content": "You''ll find this as part of the side quest, \u201cKeeping Secrets\u201d - part of the Su and Enya storyline. North of the Solar Tower."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - Investigation Journal' AND location_id = 22 AND display_order = 5), 
        '/assets/images/Wasteland/11-WastelandCont/5-Document-Journal Investigation Journal.1.jpg', 'Document - Journal (Investigation Journal)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - Investigation Journal' AND location_id = 22 AND display_order = 5), 
        '/assets/images/Wasteland/11-WastelandCont/5-Document-Journal Investigation Journal.2.jpg', 'Document - Journal (Investigation Journal)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (22, 2, 'Document - Journal - Search Record', '{"type": "text", "content": "Also part of the side quest, \u201cKeeping Secrets\u201d - part of the Su and Enya storyline. Northeast of the Solar Tower."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - Search Record' AND location_id = 22 AND display_order = 6), 
        '/assets/images/Wasteland/11-WastelandCont/6-Document-Journal-Search Record.1.jpg', 'Document - Journal (Search Record)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - Search Record' AND location_id = 22 AND display_order = 6), 
        '/assets/images/Wasteland/11-WastelandCont/6-Document-Journal-Search Record.2.jpg', 'Document - Journal (Search Record)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (22, 2, 'Document - Journal - Arin''s Journal', '{"type": "text", "content": "During \u201cStolen Treasure,\u201d you''ll have to head to the Villa in the Scrap Plains (east of the Central Scrap Plains Supply Camp). Upstairs near the bot. Part of the quest."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - Arin''s Journal' AND location_id = 22 AND display_order = 7), 
        '/assets/images/Wasteland/11-WastelandCont/7-Document-Journal-Arin''s Journal.1.jpg', 'Document - Journal (Arin''s Journal)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - Arin''s Journal' AND location_id = 22 AND display_order = 7), 
        '/assets/images/Wasteland/11-WastelandCont/7-Document-Journal-Arin''s Journal.2.jpg', 'Document - Journal (Arin''s Journal)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (22, 14, 'Beta Core', '{"type": "text", "content": "Northwest of the Junkyard Supply Camp is a wallrunning section that you need to Double Jump for. Head back there and follow the path to the end for this Beta Core."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 22 AND display_order = 8), 
        '/assets/images/Wasteland/11-WastelandCont/8-Beta Core.1.jpg', 'Beta Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 22 AND display_order = 8), 
        '/assets/images/Wasteland/11-WastelandCont/8-Beta Core.2.jpg', 'Beta Core', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 22 AND display_order = 8), 
        '/assets/images/Wasteland/11-WastelandCont/8-Beta Core.3.jpg', 'Beta Core', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (22, 3, 'Can - Elixir Green', '{"type": "text", "content": "East-northeast of the Central Scrap Plains Supply Camp (just slightly west of the Waypoint) are some metal platforms. Climb to the top (needs Double Jump) and you''ll find the can up there.Use the ramp on the west to get up top."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Elixir Green' AND location_id = 22 AND display_order = 9), 
        '/assets/images/Wasteland/11-WastelandCont/9-Can-Elixir Green.1.jpg', 'Can - Elixir Green', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Elixir Green' AND location_id = 22 AND display_order = 9), 
        '/assets/images/Wasteland/11-WastelandCont/9-Can-Elixir Green.2.jpg', 'Can - Elixir Green', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Elixir Green' AND location_id = 22 AND display_order = 9), 
        '/assets/images/Wasteland/11-WastelandCont/9-Can-Elixir Green.3.jpg', 'Can - Elixir Green', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Elixir Green' AND location_id = 22 AND display_order = 9), 
        '/assets/images/Wasteland/11-WastelandCont/9-Can-Elixir Green.4.jpg', 'Can - Elixir Green', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (22, 3, 'Can - The Haven Green Tea', '{"type": "text", "content": "take the path up to the north from the Solar Tower and bend round to the east, when you drop down (while still heading east), where the Racer''s High Nano Suit was, you''re actually going to want to drop down to the south, and then platform the way along a few cliffs and up a lot of them too. There''s only one way to go, so stick on the path and you''ll be at the ladder and the can in no time."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Haven Green Tea' AND location_id = 22 AND display_order = 10), 
        '/assets/images/Wasteland/11-WastelandCont/10-Can-The Haven Green Tea.1.jpg', 'Can - The Haven Green Tea', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Haven Green Tea' AND location_id = 22 AND display_order = 10), 
        '/assets/images/Wasteland/11-WastelandCont/10-Can-The Haven Green Tea.2.jpg', 'Can - The Haven Green Tea', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Haven Green Tea' AND location_id = 22 AND display_order = 10), 
        '/assets/images/Wasteland/11-WastelandCont/10-Can-The Haven Green Tea.3.jpg', 'Can - The Haven Green Tea', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Haven Green Tea' AND location_id = 22 AND display_order = 10), 
        '/assets/images/Wasteland/11-WastelandCont/10-Can-The Haven Green Tea.4.jpg', 'Can - The Haven Green Tea', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (22, 3, 'Can - Nectar Orange', '{"type": "text", "content": "Next to the Central Great Canyon Legion Camp is a billboard. Pull over the yellow crate from the north to the steel girder. Double jump up and walk across the billboard for this can."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Nectar Orange' AND location_id = 22 AND display_order = 11), 
        '/assets/images/Wasteland/11-WastelandCont/11-Can-Nectar Orange.1.jpg', 'Can - Nectar Orange', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Nectar Orange' AND location_id = 22 AND display_order = 11), 
        '/assets/images/Wasteland/11-WastelandCont/11-Can-Nectar Orange.2.jpg', 'Can - Nectar Orange', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Nectar Orange' AND location_id = 22 AND display_order = 11), 
        '/assets/images/Wasteland/11-WastelandCont/11-Can-Nectar Orange.3.jpg', 'Can - Nectar Orange', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (22, 15, 'Nano Suit - La Vie En Rose', '{"type": "text", "content": "Use the code B0aydS on the ship container to the west of the Western Grand Canyon Supply Camp (part of the \u201cRecruit Passcode Specialists\u201d Request)."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - La Vie En Rose' AND location_id = 22 AND display_order = 12), 
        '/assets/images/Wasteland/11-WastelandCont/12-Nano Suit & Document-Prayers.jpg', 'Nano Suit - La Vie En Rose', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - La Vie En Rose' AND location_id = 22 AND display_order = 12), 
        '/assets/images/Wasteland/11-WastelandCont/12-Nano Suit-La Vie En Rose.1.jpg', 'Nano Suit - La Vie En Rose', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - La Vie En Rose' AND location_id = 22 AND display_order = 12), 
        '/assets/images/Wasteland/11-WastelandCont/12-Nano Suit-La Vie En Rose.2.jpg', 'Nano Suit - La Vie En Rose', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (22, 2, 'Document - Prayers - Chapter of Salvation 0 - Omega', '{"type": "text", "content": "In the same container as the previous Nano Suit."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Prayers - Chapter of Salvation 0 - Omega' AND location_id = 22 AND display_order = 13), 
        '/assets/images/Wasteland/11-WastelandCont/13-Document-Prayers-Chapter of Salvation 0-Omega.1.jpg', 'Document - Prayers (Chapter of Salvation 0 - Omega)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Prayers - Chapter of Salvation 0 - Omega' AND location_id = 22 AND display_order = 13), 
        '/assets/images/Wasteland/11-WastelandCont/13-Document-Prayers-Chapter of Salvation 0-Omega.2.jpg', 'Document - Prayers (Chapter of Salvation 0 - Omega)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (22, 2, 'Document - Messages - I''m Leaving', '{"type": "text", "content": "After finishing D1g-g2r''s side quests he''ll leave to go to Xion. When he does, return to the Wasteland and head to the Scrapyard. On a large computer screen to the east of the entrance (under a box and by a ladder), you''ll be able to interact with the screen to grab this collectible."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Messages - I''m Leaving' AND location_id = 22 AND display_order = 14), 
        '/assets/images/Wasteland/11-WastelandCont/14-Document - Messages - I''m Leaving.1.jpg', 'Document - Messages - I''m Leaving', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Messages - I''m Leaving' AND location_id = 22 AND display_order = 14), 
        '/assets/images/Wasteland/11-WastelandCont/14-Document - Messages - I''m Leaving.2.jpg', 'Document - Messages - I''m Leaving', 2);

-- Matrix 11 - Closed Off Platform

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (31, 1, 'Supply Camp', '{"type": "text", "content": "As soon as you land on Matrix 11, it''s on your left."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp' AND location_id = 31 AND display_order = 1), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/1_Supply_Camp.jpg', 'Supply Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (31, 2, 'Document - Announcements - Great Desert Crossing Exploration Team Advertisement', '{"type": "text", "content": "You''ll find this one on the floor by the fast-travel phone booth in the Supply Camp."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Announcements - Great Desert Crossing Exploration Team Advertisement' AND location_id = 31 AND display_order = 2), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/2_Document_Announcements_Great_Desert_Crossing_Exploration_Team_Advertisement.jpg', 'Document - Announcements - Great Desert Crossing Exploration Team Advertisement', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (31, 4, 'Great Desert Memorystick - The Last Theorum of an Unknown', '{"type": "text", "content": "Before taking the lift down from the landing pad, head right into the toilets and the human corpse is there."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Great Desert Memorystick - The Last Theorum of an Unknown' AND location_id = 31 AND display_order = 3), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/3_Memorystick_The_Last _Theorum_of_an_Unknown_1.jpg', 'Great Desert Memorystick - The Last Theorum of an Unknown', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Great Desert Memorystick - The Last Theorum of an Unknown' AND location_id = 31 AND display_order = 3), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/3_Memorystick_The_Last _Theorum_of_an_Unknown_2.jpg', 'Great Desert Memorystick - The Last Theorum of an Unknown', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (31, 18, 'Earrings - Blue Point', '{"type": "text", "content": "Before going up the ladder over the train carriage (which you can actually wander through the doors of too), go into the train carriage. There''s a crate down the east end."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Earrings - Blue Point' AND location_id = 31 AND display_order = 4), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/4_Earrings_Blue_Point_1.jpg', 'Earrings - Blue Point', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Earrings - Blue Point' AND location_id = 31 AND display_order = 4), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/4_Earrings_Blue_Point_2.jpg', 'Earrings - Blue Point', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (31, 13, 'Legion Supply Box', '{"type": "text", "content": "When you fight your first two Skullings, there''s a box in that corridor (south side)."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 31 AND display_order = 5), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/5_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (31, 12, 'Robot - Document - Announcements - Transport Delay Notice', '{"type": "text", "content": "Crash through the wooden struts down the stairs and the robot is right ahead."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Document - Announcements - Transport Delay Notice' AND location_id = 31 AND display_order = 6), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/6_Robot_Document_Announcements_Transport_Delay_Notice.jpg', 'Robot - Document - Announcements - Transport Delay Notice', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (31, 5, 'Locked Supply Chest', '{"type": "text", "content": "West of the next carriage, outside, is another chest."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 31 AND display_order = 7), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/7_Locked_Supply_Chest.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (31, 4, 'Memorystick - Employee 38''s Memory', '{"type": "text", "content": "In the next train track section, on the right. Hard to miss."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Employee 38''s Memory' AND location_id = 31 AND display_order = 8), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/8_Memorystick_Employee_38''s_Memory.jpg', 'Memorystick - Employee 38''s Memory', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (31, 13, 'Legion Supply Box', '{"type": "text", "content": "After defeating your first Skull Trooper, head to the right and double back to where you come from (opening the shortcut). The chest is there."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 31 AND display_order = 9), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/9_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (31, 4, 'Memorystick - Legionnarie 547''s Testimony', '{"type": "text", "content": "After Adam tells you to take the high road. On the left is a blocked door with a yellow sign above it. Approach it and an enemy will crash through. In the room it came out of is a memorystick and a supply box."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnarie 547''s Testimony' AND location_id = 31 AND display_order = 10), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/10_Memorystick_Legionnarie_547''s_Testimony_1.jpg', 'Memorystick - Legionnarie 547''s Testimony', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnarie 547''s Testimony' AND location_id = 31 AND display_order = 10), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/10_Memorystick_Legionnarie_547''s_Testimony_2.jpg', 'Memorystick - Legionnarie 547''s Testimony', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (31, 13, 'Legion Supply Box', '{"type": "text", "content": "Same area, has a Melee Protection Gear (2 star) and an Omnibolt inside of it."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 31 AND display_order = 11), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/11_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (31, 15, 'Nano Suit - Daily Knitted Dress', '{"type": "text", "content": "In the next open-ish area, there''s a train carriage (after a fight with a handful of enemies) on the south wall. Down the end is a crate with this Nano Suit inside."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Daily Knitted Dress' AND location_id = 31 AND display_order = 12), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/12_Nano_Suit_Daily_Knitted_Dress_1.jpg', 'Nano Suit - Daily Knitted Dress', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Daily Knitted Dress' AND location_id = 31 AND display_order = 12), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/12_Nano_Suit_Daily_Knitted_Dress_2.jpg', 'Nano Suit - Daily Knitted Dress', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (31, 4, 'Memorystick - Legionnarie 569''s Recollection', '{"type": "text", "content": "When you see the Hive blocking the way, take a left out the door, there''s a body with a memory stick just to the right."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnarie 569''s Recollection' AND location_id = 31 AND display_order = 13), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/13_Memorystick_Legionnarie_569''s_Recollection_1.jpg', 'Memorystick - Legionnarie 569''s Recollection', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnarie 569''s Recollection' AND location_id = 31 AND display_order = 13), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/13_Memorystick_Legionnarie_569''s_Recollection_2.jpg', 'Memorystick - Legionnarie 569''s Recollection', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (31, 12, 'Robot - Tumbler Expansion Module', '{"type": "text", "content": "Head southwest of the previous memorystick and there''s a robot there with a Tumbler Expansion Module inside."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 31 AND display_order = 14), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/14_Robot_Tumbler_Expansion_Module.jpg', 'Robot - Tumbler Expansion Module', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (31, 1, 'Legion Camp', '{"type": "text", "content": "At the end of the train tracks and down the ladder is safety."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 31 AND display_order = 15), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/15_Legion_Camp.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (31, 12, 'Robot - Drone Upgrade Modules', '{"type": "text", "content": "Above the Legion Camp (just one level up, above the workbench) - Contains 2 x Drone Upgrade Modules."}', 16);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Drone Upgrade Modules' AND location_id = 31 AND display_order = 16), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/16_Robot_Drone_Upgrade_Modules.jpg', 'Robot - Drone Upgrade Modules', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (31, 20, 'Exospine - Reflex-Type', '{"type": "text", "content": "In the front of the train carriage that just flew down the tracks and crashed."}', 17);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Reflex-Type' AND location_id = 31 AND display_order = 17), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/17_Exospine_Reflex_Type_1.jpg', 'Exospine - Reflex-Type', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Reflex-Type' AND location_id = 31 AND display_order = 17), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/17_Exospine_Reflex_Type_2.jpg', 'Exospine - Reflex-Type', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (31, 4, 'Memorystick - Legionnaire 552''s Advice / Passcode - ardu0d', '{"type": "text", "content": "In the next corridor, head to the end and take a right. The corpse and passcode are at the end of that small corridor."}', 18);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 552''s Advice / Passcode - ardu0d' AND location_id = 31 AND display_order = 18), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/18_Memorystick_Legionnaire_552''s_Advice_&_Passcode_1.jpg', 'Memorystick - Legionnaire 552''s Advice / Passcode - ardu0d', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 552''s Advice / Passcode - ardu0d' AND location_id = 31 AND display_order = 18), 
        '/assets/images/Matrix_11/1_Closed_Off_Platform/18_Memorystick_Legionnaire_552''s_Advice_&_Passcode_2.jpg', 'Memorystick - Legionnaire 552''s Advice / Passcode - ardu0d', 2);

-- Matrix 11 - Collapsed Rail Bridge

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 13, 'Legion Supply Box', '{"type": "text", "content": "As soon as you step onto the bridge, there will be a staircase on the right. Go down the stairs and you will find the Legion Supply Box."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 33 AND display_order = 1), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/0_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 33 AND display_order = 1), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/0_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 12, 'Robot - Drone Upgrade Modules', '{"type": "text", "content": "Follow the collapsed bridge to the end, and there''s a robot in that area with 2 Skull enemies."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Drone Upgrade Modules' AND location_id = 33 AND display_order = 2), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/1_Robot_Drone_Upgrade_Modules_1.jpg', 'Robot - Drone Upgrade Modules', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Drone Upgrade Modules' AND location_id = 33 AND display_order = 2), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/1_Robot_Drone_Upgrade_Modules_2.jpg', 'Robot - Drone Upgrade Modules', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 13, 'Legion Supply Box', '{"type": "text", "content": "Turn around from the robot and climb the stairs to find a supply box. Contains an Omnibolt and Critical Enhancement Gear."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 33 AND display_order = 3), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/2_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 13, 'Legion Supply Box', '{"type": "text", "content": "Up top, after the QTE train sequence, on the main road."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 33 AND display_order = 4), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/3_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 1, 'Supply Camp - Twisted Iron Bridge', '{"type": "text", "content": "At the end of the tunnel upstairs."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Twisted Iron Bridge' AND location_id = 33 AND display_order = 5), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/4_Supply_Camp_Twisted_Iron_Bridge.jpg', 'Supply Camp - Twisted Iron Bridge', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 21, 'Adam Outfit - Chameleon', '{"type": "text", "content": "In the next broken bridge area, after going through the Hive infested train carriage, on the right-hand side of the next carriage."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Adam Outfit - Chameleon' AND location_id = 33 AND display_order = 6), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/5_Adam_Outfit_Chameleon_1.jpg', 'Adam Outfit - Chameleon', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Adam Outfit - Chameleon' AND location_id = 33 AND display_order = 6), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/5_Adam_Outfit_Chameleon_2.jpg', 'Adam Outfit - Chameleon', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 5, 'Locked Supply Chest', '{"type": "text", "content": "In the next area where 3 Skull enemies are."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 33 AND display_order = 7), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/6_Locked_Supply_Chest_1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 33 AND display_order = 7), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/6_Locked_Supply_Chest_2.jpg', 'Locked Supply Chest', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 14, 'Beta Core', '{"type": "text", "content": "After observing the view from the bridge, in the next area, inside the carriage on the left, you''ll find a Beta Core."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 33 AND display_order = 8), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/7_Beta_Core_1.jpg', 'Beta Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 33 AND display_order = 8), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/7_Beta_Core_2.jpg', 'Beta Core', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 13, 'Legion Supply Box', '{"type": "text", "content": "At the end of the platform level, before going down the ladder."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 33 AND display_order = 9), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/8_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 13, 'Legion Supply Box', '{"type": "text", "content": "At the bottom of the ladder, under the stairs to the right."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 33 AND display_order = 10), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/9_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 33 AND display_order = 10), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/9_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 4, 'Memorystick - Alex''s Memory', '{"type": "text", "content": "In the next area after going down the ladder, at the end of the corridor down low."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Alex''s Memory' AND location_id = 33 AND display_order = 11), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/10_Memorystick_Alex''s_Memory.jpg', 'Memorystick - Alex''s Memory', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 13, 'Legion Supply Box', '{"type": "text", "content": "Do a 180 from the last collectible, and look to the southeast."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 33 AND display_order = 12), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/11_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 17, 'Body Core', '{"type": "text", "content": "On the walkway of the area the last two collectibles were in, in the northeast corner."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 33 AND display_order = 13), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/12_Body_Core_1.jpg', 'Body Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 33 AND display_order = 13), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/12_Body_Core_2.jpg', 'Body Core', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 13, 'Legion Supply Box', '{"type": "text", "content": "In the next area, in the northeast corner, behind a Hive monster. It contains an Omnibolt and Speed Increase Gear (2 star)."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 33 AND display_order = 14), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/13_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 4, 'Memorystick - Robert''s Last Farewell', '{"type": "text", "content": "Above the previous chest, up the stairs, against the wall."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Robert''s Last Farewell' AND location_id = 33 AND display_order = 15), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/14_Memorystick_Robert''s_Last_Farewell_1.jpg', 'Memorystick - Robert''s Last Farewell', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Robert''s Last Farewell' AND location_id = 33 AND display_order = 15), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/14_Memorystick_Robert''s_Last_Farewell_2.jpg', 'Memorystick - Robert''s Last Farewell', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 1, 'Legion Camp', '{"type": "text", "content": "At the end of this area is a Legion Camp which Adam will say you should rest at."}', 16);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 33 AND display_order = 16), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/15_Legion_Camp.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 13, 'Legion Supply Box', '{"type": "text", "content": "After climbing the carriage up, do a 180 and look behind it."}', 17);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 33 AND display_order = 17), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/16_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 3, 'Can - Cryo Cafe Vanilla', '{"type": "text", "content": "In the southwest corner of the Rail Yard where you fight the Stalker, on the platform along the edge."}', 18);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo Cafe Vanilla' AND location_id = 33 AND display_order = 18), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/17_Can_Cryo_Cafe_Vanilla_1.jpg', 'Can - Cryo Cafe Vanilla', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo Cafe Vanilla' AND location_id = 33 AND display_order = 18), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/17_Can_Cryo_Cafe_Vanilla_2.jpg', 'Can - Cryo Cafe Vanilla', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 12, 'Robot - Tumbler Expansion Module', '{"type": "text", "content": "Just up a level to the north from the previous can."}', 19);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 33 AND display_order = 19), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/18_Robot_Tumbler_Expansion_Module.jpg', 'Robot - Tumbler Expansion Module', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 1, 'Supply Camp - Rail Yard', '{"type": "text", "content": " Using N72R5 to open the gate after the Stalker fight will walk you straight into this supply camp."}', 20);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Rail Yard' AND location_id = 33 AND display_order = 20), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/19_Supply_Camp_Rail_Yard.jpg', 'Supply Camp - Rail Yard', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (33, 4, 'Memorystick - Legionnaire 514''s Memory', '{"type": "text", "content": "Just before entering the sewers (after going down some stairs), do a 180 and head east until you hit the dead end. The body with the memorystick is there."}', 21);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 514''s Memory' AND location_id = 33 AND display_order = 21), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/20_Memorystick_Legionnaire_514''s_Memory_1.jpg', 'Memorystick - Legionnaire 514''s Memory', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 514''s Memory' AND location_id = 33 AND display_order = 21), 
        '/assets/images/Matrix_11/3_Collapsed_Rail_Bridge/20_Memorystick_Legionnaire_514''s_Memory_2.jpg', 'Memorystick - Legionnaire 514''s Memory', 2);

-- Matrix 11 - Landfill

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (32, 13, 'Legion Supply Box', '{"type": "text", "content": "On the opposite side of the upper terrace as you reach the landfill area."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 32 AND display_order = 1), 
        '/assets/images/Matrix_11/2_Landfill/1_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (32, 4, 'Memorystick - Employee 33''s Determination', '{"type": "text", "content": "Head down the lift and downstairs, where the Mites are, is a body with this memorystick."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Employee 33''s Determination' AND location_id = 32 AND display_order = 2), 
        '/assets/images/Matrix_11/2_Landfill/2_Memorystick_Employee_33''s_Determination.jpg', 'Memorystick - Employee 33''s Determination', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (32, 13, 'Legion Supply Box', '{"type": "text", "content": "On the left-hand side of the actual landfill, up a level from the garbage and the enemies."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 32 AND display_order = 3), 
        '/assets/images/Matrix_11/2_Landfill/3_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 32 AND display_order = 3), 
        '/assets/images/Matrix_11/2_Landfill/3_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (32, 5, 'Locked Supply Chest', '{"type": "text", "content": "In the middle of the landfill area. Passcode is from the body before (ardu0d). Also contains the Fusion Cell."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 32 AND display_order = 4), 
        '/assets/images/Matrix_11/2_Landfill/4_Locked_Supply_Chest.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (32, 4, 'Memorystick - Legionnaire 507''s Regret', '{"type": "text", "content": "As you come out of the landfill (after using the Fusion Cell), on the right, on the train tracks."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 507''s Regret' AND location_id = 32 AND display_order = 5), 
        '/assets/images/Matrix_11/2_Landfill/5_Memorystick_Legionnaire_507''s_Regret.jpg', 'Memorystick - Legionnaire 507''s Regret', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (32, 17, 'Body Core', '{"type": "text", "content": "Head forward from the last memorystick, and then take a left. Destroy the Hive and this human body and the Body Core is behind it."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 32 AND display_order = 6), 
        '/assets/images/Matrix_11/2_Landfill/6_Body_Core_1.jpg', 'Body Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 32 AND display_order = 6), 
        '/assets/images/Matrix_11/2_Landfill/6_Body_Core_2.jpg', 'Body Core', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (32, 1, 'Legion Camp', '{"type": "text", "content": "Head forward from the last memorystick, and then take a left. Destroy the Hive and this human body and the Body Core is behind it."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 32 AND display_order = 7), 
        '/assets/images/Matrix_11/2_Landfill/7_Legion_Camp.jpg', 'Legion Camp', 1);

-- Matrix 11 - Rotten Labyrinth

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 13, 'Locked Legion Supply Box', '{"type": "text", "content": "In the first room of the Rotten Labyrinth, up on a walkway to the left (same room as the Hive)."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Legion Supply Box' AND location_id = 35 AND display_order = 1), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/1_Locked_Supply_Box_1.jpg', 'Locked Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Legion Supply Box' AND location_id = 35 AND display_order = 1), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/1_Locked_Supply_Box_2.jpg', 'Locked Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 4, 'Memorystick - Pascal''s Warning', '{"type": "text", "content": "Head down the north tunnel before leaving that first room and there''ll be a body in the short tunnel at the end."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Pascal''s Warning' AND location_id = 35 AND display_order = 2), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/2_Memorystick_Pascal''s_Warning_1.jpg', 'Memorystick - Pascal''s Warning', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Pascal''s Warning' AND location_id = 35 AND display_order = 2), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/2_Memorystick_Pascal''s_Warning_2.jpg', 'Memorystick - Pascal''s Warning', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 4, 'Memorystick - Daisy''s Memory', '{"type": "text", "content": "In the next curved corridor, that leads into the next room."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Daisy''s Memory' AND location_id = 35 AND display_order = 3), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/3_Memorystick_Daisy''s_Memory.jpg', 'Memorystick - Daisy''s Memory', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 12, 'Robot - Passcode - yBKBdB (upside down y)', '{"type": "text", "content": "In the next room with 2 Cricket Butchers in them. Climb up the ladder to the west as you walk in, and then jump across to the other side. The robot is there."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Passcode - yBKBdB (upside down y)' AND location_id = 35 AND display_order = 4), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/4_Robot_Passcode.jpg', 'Robot - Passcode', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 14, 'Beta Core', '{"type": "text", "content": "In the north-northeast corner of the same room. Climb the ladder (where you will eventually put in the Fusion Cell) and then turn around. In that room straight ahead, down the bottom, is a Beta Core."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 35 AND display_order = 5), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/5_Beta_Core.jpg', 'Beta Core', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 4, 'Memorystick - Harry''s Memory', '{"type": "text", "content": "Opposite the place where you put in the Fusion Cell. Up top. Jump and swing across."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Harry''s Memory' AND location_id = 35 AND display_order = 6), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/6_Memorystick_Harry''s_Memory.jpg', 'Memorystick - Harry''s Memory', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 4, 'Memorystick - Jesse''s Memory', '{"type": "text", "content": "After climbing the elevator shaft and going down the stairs. Look to the north and there''s a body in that dead end."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Jesse''s Memory' AND location_id = 35 AND display_order = 7), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/7_Memorystick_Jesse''s_Memory.jpg', 'Memorystick - Jesse''s Memory', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 12, 'Robot - Tumbler Expansion Module', '{"type": "text", "content": "Head down the ladder and take a left at the junction. The robot is up the stairs there."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 35 AND display_order = 8), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/8_Robot_Tumbler_Expansion_Module.jpg', 'Robot - Tumbler Expansion Module', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 5, 'Locked Supply Chest', '{"type": "text", "content": "Follow the corridor west and then on the right will be an offshoot of a corridor (next to a corpse). The chest (with the Fusion Cell) is at the end."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 35 AND display_order = 9), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/9_Locked_Supply_Chest.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 4, 'Memorystick - Leona''s Advice', '{"type": "text", "content": "After using the Fusion Cell to open the door, the memorystick is on the body straight ahead, on a mattress."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Leona''s Advice' AND location_id = 35 AND display_order = 10), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/10_Memorystick_Leona''s_Advice.jpg', 'Memorystick - Leona''s Advice', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 20, 'Exospine - Beta Trance-Type', '{"type": "text", "content": "Head east from the main junction and destroy the two planks (and 3 enemies). The box with this Exospine is straight ahead."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Beta Trance-Type' AND location_id = 35 AND display_order = 11), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/11_Exospine_Beta_Trance_Type_1.jpg', 'Exospine - Beta Trance-Type', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Beta Trance-Type' AND location_id = 35 AND display_order = 11), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/11_Exospine_Beta_Trance_Type_2.jpg', 'Exospine - Beta Trance-Type', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 2, 'Document - Journal - Crevice', '{"type": "text", "content": "Head back to the main corridor and then head west. Opposite the Fusion Cell locked door, there''s a machine there with this journal."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - Crevice' AND location_id = 35 AND display_order = 12), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/12_Document_Journal_Crevice.jpg', 'Document - Journal - Crevice', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 2, 'Document - Journal - Z''s Diary', '{"type": "text", "content": "In the room where the survivors were, head left and interact with the bookcase."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - Z''s Diary' AND location_id = 35 AND display_order = 13), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/13_Document_Journal_Z''s_Diary_1.jpg', 'Document - Journal - Z''s Diary', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - Z''s Diary' AND location_id = 35 AND display_order = 13), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/13_Document_Journal_Z''s_Diary_2.jpg', 'Document - Journal - Z''s Diary', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 5, 'Locked Supply Chest', '{"type": "text", "content": "Next to the guitar is a locked chest (needs Passcode yBKBdB)."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 35 AND display_order = 14), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/14_Locked_Supply_Chest.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 13, 'Legion Supply Box', '{"type": "text", "content": "In the southwest corner near the beds."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 35 AND display_order = 15), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/15_Legion_Supply_Box.jpg', 'Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 4, 'Memorystick - Susan''s Warning', '{"type": "text", "content": "In the back corner, near the bunk beds, on top of a mattress."}', 16);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Susan''s Warning' AND location_id = 35 AND display_order = 16), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/16_Memorystick_Susan''s_Warning.jpg', 'Memorystick', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 2, 'Document - Messages - J''s Memo', '{"type": "text", "content": "Interact with the notice board near the neon Liquor sign downstairs in the same area."}', 17);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Messages - J''s Memo' AND location_id = 35 AND display_order = 17), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/17_Document_Messages_J''s_Memo.jpg', 'Document - Messages - J''s Memo', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 1, 'Legion Camp', '{"type": "text", "content": "Same room, head up the ladder and it''s smack bang in front of you."}', 18);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 35 AND display_order = 18), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/18_Legion_Camp.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 13, 'Legion Supply Box', '{"type": "text", "content": "Next to the Legion Camp."}', 19);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 35 AND display_order = 19), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/19_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 2, 'Document - Prayers - Chapter of Trial 1- B', '{"type": "text", "content": "On the actual memorial."}', 20);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Prayers - Chapter of Trial 1- B' AND location_id = 35 AND display_order = 20), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/20_Document_Prayers_Chapter_of_Trial_1_B.jpg', 'Document - Prayers - Chapter of Trial 1- B', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 4, 'Memorystick - Jake''s Speech', '{"type": "text", "content": "In the memorial room, on the right-hand side. Next to the Fusion Cell."}', 21);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Jake''s Speech' AND location_id = 35 AND display_order = 21), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/21_Memorystick_Jake''s_Speech.jpg', 'Memorystick - Jake''s Speech', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 15, 'Nano Suit - Daily Force', '{"type": "text", "content": "As you leave, look up to the right of the entrance, there''s a chest there with this nano suit design inside."}', 22);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Daily Force' AND location_id = 35 AND display_order = 22), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/22_Nano_Suit_Daily_Force_1.jpg', 'Nano Suit - Daily Force', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Daily Force' AND location_id = 35 AND display_order = 22), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/22_Nano_Suit_Daily_Force_2.jpg', 'Nano Suit - Daily Force', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 12, 'Robot - Drone Upgrade Module', '{"type": "text", "content": "Head back downstairs and head up the tunnel to the northeast. There''s a robot there."}', 23);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Drone Upgrade Module' AND location_id = 35 AND display_order = 23), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/23_Robot_Drone_Upgrade_Modules.jpg', 'Robot - Drone Upgrade Module', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 13, 'Legion Supply Box', '{"type": "text", "content": "Just up to the left of the first Hive monster."}', 24);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 35 AND display_order = 24), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/24_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 4, 'Memorystick - Katherine''s Testament', '{"type": "text", "content": "Destroy the second Hive monster, and take the tunnel that it was covering."}', 25);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Katherine''s Testament' AND location_id = 35 AND display_order = 25), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/25_Memorystick_Katherine''s_Testament.jpg', 'Memorystick - Katherine''s Testament', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 14, 'Beta Core', '{"type": "text", "content": "In the same area, just in a different offshoot of a tunnel (southern one)."}', 26);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 35 AND display_order = 26), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/26_Beta_Core.jpg', 'Beta Core', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 4, 'Memorystick - Sam''s Resignation', '{"type": "text", "content": "After sliding down the ramp and ending up in front of the old generator, there''s a corpse next to it."}', 27);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sam''s Resignation' AND location_id = 35 AND display_order = 27), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/27_Memorystick_Sam''s_Resignation.jpg', 'Memorystick - Sam''s Resignation', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (35, 13, 'Legion Supply Box', '{"type": "text", "content": "The other side of the lift (use the controls to jump on and jump over the fence). Need the Hacking Tool installed."}', 28);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 35 AND display_order = 28), 
        '/assets/images/Matrix_11/5_Rotten_Labyrinth/28_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

-- Matrix 11 - Temporary Armoury

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (36, 1, 'Supply Camp - Temporary Armoury Entrance', '{"type": "text", "content": "At the bottom of the lift."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Temporary Armoury Entrance' AND location_id = 36 AND display_order = 1), 
        '/assets/images/Matrix_11/6_Temporary_Armoury/1_Supply_Camp_Temporary_Armoury_Entrance.jpg', 'Supply Camp - Temporary Armoury Entrance', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (36, 13, 'Legion Supply Box', '{"type": "text", "content": "Northwest corner of the boss fight arena (on the shipping crates, inside a shipping crate)."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 36 AND display_order = 2), 
        '/assets/images/Matrix_11/6_Temporary_Armoury/2_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 36 AND display_order = 2), 
        '/assets/images/Matrix_11/6_Temporary_Armoury/2_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (36, 13, 'Legion Supply Box', '{"type": "text", "content": "In the eastern corner, behind a shipping crate. Contains 2 Omnibolts and Burst Enhancement Gear."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 36 AND display_order = 3), 
        '/assets/images/Matrix_11/6_Temporary_Armoury/3_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 36 AND display_order = 3), 
        '/assets/images/Matrix_11/6_Temporary_Armoury/3_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (36, 3, 'Can - Newfoundland Dry', '{"type": "text", "content": "In the southwest corner of the boss fight arena."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Newfoundland Dry' AND location_id = 36 AND display_order = 4), 
        '/assets/images/Matrix_11/6_Temporary_Armoury/4_Can_Newfoundland_Dry_1.jpg', 'Can - Newfoundland Dry', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Newfoundland Dry' AND location_id = 36 AND display_order = 4), 
        '/assets/images/Matrix_11/6_Temporary_Armoury/4_Can_Newfoundland_Dry_2.jpg', 'Can - Newfoundland Dry', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Newfoundland Dry' AND location_id = 36 AND display_order = 4), 
        '/assets/images/Matrix_11/6_Temporary_Armoury/4_Can_Newfoundland_Dry_3.jpg', 'Can - Newfoundland Dry', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (36, 13, 'Legion Supply Box', '{"type": "text", "content": "Next to the aforementioned can."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 36 AND display_order = 5), 
        '/assets/images/Matrix_11/6_Temporary_Armoury/5_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (36, 5, 'Locked Supply Chest', '{"type": "text", "content": "On the way out of the arena (up on the southern walkway)."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 36 AND display_order = 6), 
        '/assets/images/Matrix_11/6_Temporary_Armoury/6_Locked_Supply_Chest.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (36, 1, 'Legion Camp', '{"type": "text", "content": "As you leave the arena in the southeast corner."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 36 AND display_order = 7), 
        '/assets/images/Matrix_11/6_Temporary_Armoury/7_Legion_Camp.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (36, 13, 'Legion Supply Box', '{"type": "text", "content": "Slide down the lift shaft and there''s a crate on a platform at the bottom. It contains an Omnibolt and Shield Destruction Gear (2 star)."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 36 AND display_order = 8), 
        '/assets/images/Matrix_11/6_Temporary_Armoury/8_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

-- Matrix 11 - Train Graveyard

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (37, 12, 'Robot - Tumbler Expansion Module', '{"type": "text", "content": "In the Train Graveyard, on the south side of the long flooded tunnel, inside a locked container (the right of the two)."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 37 AND display_order = 1), 
        '/assets/images/Matrix_11/7_Train_Graveyard/1_Robot_Tumbler_Expansion_Module_1.jpg', 'Robot - Tumbler Expansion Module', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (37, 13, 'Legion Supply Box', '{"type": "text", "content": "Swim through the shipping containers to the north of that carriage above and this is on top of a shipping container."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 37 AND display_order = 2), 
        '/assets/images/Matrix_11/7_Train_Graveyard/2_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (37, 7, 'Passcode - unydKa', '{"type": "text", "content": "About midway down, underneath 2 Skull monsters, inside a train carriage underwater, there''s a corpse with a passcode."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Passcode - unydKa' AND location_id = 37 AND display_order = 3), 
        '/assets/images/Matrix_11/7_Train_Graveyard/3_Passcode.jpg', 'Passcode - unydKa', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (37, 17, 'Body Core', '{"type": "text", "content": "To the northwest of the previous carriage is a platform above the water. There is a body with a Body Core on top. Use the wooden planks to jump over to it."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 37 AND display_order = 4), 
        '/assets/images/Matrix_11/7_Train_Graveyard/4_Body_Core_1.jpg', 'Body Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 37 AND display_order = 4), 
        '/assets/images/Matrix_11/7_Train_Graveyard/4_Body_Core_2.jpg', 'Body Core', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (37, 3, 'Can - Corsair Ale', '{"type": "text", "content": "If you follow the passage to the north, you can swim under (near the middle to the left). There you''ll find this can on the eastern side."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Corsair Ale' AND location_id = 37 AND display_order = 5), 
        '/assets/images/Matrix_11/7_Train_Graveyard/5_Can_Corsair_Ale_1.jpg', 'Can - Corsair Ale', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Corsair Ale' AND location_id = 37 AND display_order = 5), 
        '/assets/images/Matrix_11/7_Train_Graveyard/5_Can_Corsair_Ale_2.jpg', 'Can - Corsair Ale', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Corsair Ale' AND location_id = 37 AND display_order = 5), 
        '/assets/images/Matrix_11/7_Train_Graveyard/5_Can_Corsair_Ale_3.jpg', 'Can - Corsair Ale', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (37, 1, 'Legion Camp', '{"type": "text", "content": "After leaving the flooded tunnel, there''s a Legion Camp as you exit."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 37 AND display_order = 6), 
        '/assets/images/Matrix_11/7_Train_Graveyard/6_Legion_Camp.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (37, 4, 'Memorystick - Legionnaire 516''s Memory', '{"type": "text", "content": "Underneath the Legion Camp, in a dead end."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 516''s Memory' AND location_id = 37 AND display_order = 7), 
        '/assets/images/Matrix_11/7_Train_Graveyard/7_Memorystick_Legionnaire_516''s_Memory.jpg', 'Memorystick - Legionnaire 516''s Memory', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (37, 12, 'Robot - Drone Upgrade Modules', '{"type": "text", "content": "After sliding down the shaft full of turbines, do a 180 and head to the east. There''s a robot there."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Drone Upgrade Modules' AND location_id = 37 AND display_order = 8), 
        '/assets/images/Matrix_11/7_Train_Graveyard/8_Robot_Drone_Upgrade_Modules.jpg', 'Robot - Drone Upgrade Modules', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (37, 4, 'Memorystick - Legionnaire 511''s Prayer', '{"type": "text", "content": "Near the Hive at the top of the staircase, after passing through the tunnel after the sliding set-piece."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 511''s Prayer' AND location_id = 37 AND display_order = 9), 
        '/assets/images/Matrix_11/7_Train_Graveyard/9_Memorystick_Legionnaire_511''s_Prayer.jpg', 'Memorystick - Legionnaire 511''s Prayer', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (37, 1, 'Supply Camp - Contaminated Water Purification Plant Entrance', '{"type": "text", "content": "At the top of said stairs, behind the Hive."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Contaminated Water Purification Plant Entrance' AND location_id = 37 AND display_order = 10), 
        '/assets/images/Matrix_11/7_Train_Graveyard/10_Supply_Camp_Contaminated_Water_Purification_Plant_Entrance.jpg', 'Supply Camp - Contaminated Water Purification Plant Entrance', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (37, 17, 'Body Core', '{"type": "text", "content": "Above the Supply Camp, and beneath the door to the boss fight."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 37 AND display_order = 11), 
        '/assets/images/Matrix_11/7_Train_Graveyard/11_Body_Core.jpg', 'Body Core', 1);

-- Matrix 11 - Underground Sewer

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (34, 4, 'Memorystick - Jamie''s Plea', '{"type": "text", "content": "After EVE says \u201cThis area\u2026\u201d, head down, and there are a load of dead bodies down there. In the northeast corner there are two together. One will have this memorystick on it."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Jamie''s Plea' AND location_id = 34 AND display_order = 1), 
        '/assets/images/Matrix_11/4_Underground_Sewer/1_Memorystick_Jamie''s_Plea.jpg', 'Memorystick - Jamie''s Plea', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (34, 7, 'Passcode - EKaKdS', '{"type": "text", "content": "The other body (mentioned above) will have this passcode on it."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Passcode - EKaKdS' AND location_id = 34 AND display_order = 2), 
        '/assets/images/Matrix_11/4_Underground_Sewer/2_Passcode.jpg', 'Passcode - EKaKdS', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (34, 15, 'Nano Suit - Daily Mascot', '{"type": "text", "content": "If you head back up and head south-southwest a Skull will crash through the wall. Defeat the enemies and go into the room where the Skull crashed through from."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Daily Mascot' AND location_id = 34 AND display_order = 3), 
        '/assets/images/Matrix_11/4_Underground_Sewer/3_Nano_Suit_Daily_Mascot.jpg', 'Nano Suit - Daily Mascot', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (34, 5, 'Locked Supply Chest', '{"type": "text", "content": "At the end of the corridor (south) where the previously mentioned Skull came from. Needs the EKaKds passcode. Contains the Fusion Cell."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 34 AND display_order = 4), 
        '/assets/images/Matrix_11/4_Underground_Sewer/4_Locked_Supply_Chest.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (34, 4, 'Memorystick - Paul''s Memory', '{"type": "text", "content": "Behind the aforementioned chest."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Paul''s Memory' AND location_id = 34 AND display_order = 5), 
        '/assets/images/Matrix_11/4_Underground_Sewer/5_Memorystick_Paul''s_Memory.jpg', 'Memorystick - Paul''s Memory', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (34, 4, 'Memorystick - Norman''s Advice', '{"type": "text", "content": "After going up the lift and crossing the walkway, this body is straight ahead, next to the floodgate."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Norman''s Advice' AND location_id = 34 AND display_order = 6), 
        '/assets/images/Matrix_11/4_Underground_Sewer/6_Memorystick_Norman''s_Advice_1.jpg', 'Memorystick - Norman''s Advice', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Norman''s Advice' AND location_id = 34 AND display_order = 6), 
        '/assets/images/Matrix_11/4_Underground_Sewer/6_Memorystick_Norman''s_Advice_2.jpg', 'Memorystick - Norman''s Advice', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (34, 20, 'Exospine - Burst Trance-Type', '{"type": "text", "content": "Head north and then west into a small room. The chest with this item is inside."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Burst Trance-Type' AND location_id = 34 AND display_order = 7), 
        '/assets/images/Matrix_11/4_Underground_Sewer/7_Exospine_Burst_Trance_Type_1.jpg', 'Exospine - Burst Trance-Type', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Burst Trance-Type' AND location_id = 34 AND display_order = 7), 
        '/assets/images/Matrix_11/4_Underground_Sewer/7_Exospine_Burst_Trance_Type_2.jpg', 'Exospine - Burst Trance-Type', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (34, 12, 'Robot - Document - Log Data - To the Little Drone', '{"type": "text", "content": "Head southwest and into the floodgate control room. Firstly, however, head upstairs and there is a robot above it."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Document - Log Data - To the Little Drone' AND location_id = 34 AND display_order = 8), 
        '/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_1.jpg', 'Robot - Document - Log Data - To the Little Drone', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Document - Log Data - To the Little Drone' AND location_id = 34 AND display_order = 8), 
        '/assets/images/Matrix_11/4_Underground_Sewer/8_Robot_Document_Log_To_the_Little_Drone_2.jpg', 'Robot - Document - Log Data - To the Little Drone', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (34, 5, 'Locked Supply Chest', '{"type": "text", "content": "After opening the floodgates, head towards the objective, but instead of going the correct way, swim down to the south. There''s a hole in the roof in that passage where you found the Fusion Cell."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 34 AND display_order = 9), 
        '/assets/images/Matrix_11/4_Underground_Sewer/9_Locked_Supply_Chest_1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 34 AND display_order = 9), 
        '/assets/images/Matrix_11/4_Underground_Sewer/9_Locked_Supply_Chest_2.jpg', 'Locked Supply Chest', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (34, 14, 'Beta Core', '{"type": "text", "content": "Again, before heading the correct way, while in the central chamber, dive down and head into the northeast corner. When you''re in the corner, swim to the surface and there you''ll find a Beta Core."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 34 AND display_order = 10), 
        '/assets/images/Matrix_11/4_Underground_Sewer/10_Beta_Core_1.jpg', 'Beta Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 34 AND display_order = 10), 
        '/assets/images/Matrix_11/4_Underground_Sewer/10_Beta_Core_2.jpg', 'Beta Core', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (34, 13, 'Legion Supply Box', '{"type": "text", "content": "In the right corner of the corridor, after you open the main quest objective door."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 34 AND display_order = 11), 
        '/assets/images/Matrix_11/4_Underground_Sewer/11_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (34, 1, 'Legion Camp', '{"type": "text", "content": "Down the bottom of the stairs."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 34 AND display_order = 12), 
        '/assets/images/Matrix_11/4_Underground_Sewer/12_Legion_Camp.jpg', 'Legion Camp', 1);

-- Great Desert - Buried Ruins

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 4, 'Memorystick - Laughter of the Isolated', '{"type": "text", "content": "Before going north, head west and then north through the rocks. The building straight ahead (to the left) has two Turret Droids in it. The memorystick is under them."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Laughter of the Isolated' AND location_id = 40 AND display_order = 1), 
        '/assets/images/Great_Desert/3_Buried_Ruins/1_Memorystick_Laughter_of_the_Isolated_1.jpg', 'Memorystick - Laughter of the Isolated', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Laughter of the Isolated' AND location_id = 40 AND display_order = 1), 
        '/assets/images/Great_Desert/3_Buried_Ruins/1_Memorystick_Laughter_of_the_Isolated_2.jpg', 'Memorystick - Laughter of the Isolated', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 1, 'Legion Camp - West of Buried Ruins', '{"type": "text", "content": "Head north, along the outer wall, to unlock the West of Buried Ruins Legion Camp."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - West of Buried Ruins' AND location_id = 40 AND display_order = 2), 
        '/assets/images/Great_Desert/3_Buried_Ruins/2_Legion_Camp_West_of_Buried_Ruins_1.jpg', 'Legion Camp - West of Buried Ruins', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - West of Buried Ruins' AND location_id = 40 AND display_order = 2), 
        '/assets/images/Great_Desert/3_Buried_Ruins/2_Legion_Camp_West_of_Buried_Ruins_2.jpg', 'Legion Camp - West of Buried Ruins', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 3, 'Can - Starwell ', '{"type": "text", "content": "West of the legion camp is a Road Closed sign in front of a large rock. In the middle will be a glint every so often. Drop a Smart Mine and it''ll spawn 2 Creepers and a Lurker (as well as this can chest). Kill the enemies, grab the can."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Starwell ' AND location_id = 40 AND display_order = 3), 
        '/assets/images/Great_Desert/3_Buried_Ruins/3_Can_Starwell_1.jpg', 'Can - Starwell', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Starwell ' AND location_id = 40 AND display_order = 3), 
        '/assets/images/Great_Desert/3_Buried_Ruins/3_Can_Starwell_2.jpg', 'Can - Starwell', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Starwell ' AND location_id = 40 AND display_order = 3), 
        '/assets/images/Great_Desert/3_Buried_Ruins/3_Can_Starwell_3.jpg', 'Can - Starwell', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Starwell ' AND location_id = 40 AND display_order = 3), 
        '/assets/images/Great_Desert/3_Buried_Ruins/3_Can_Starwell_4.jpg', 'Can - Starwell', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Starwell ' AND location_id = 40 AND display_order = 3), 
        '/assets/images/Great_Desert/3_Buried_Ruins/3_Can_Starwell_5.jpg', 'Can - Starwell', 5);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 13, 'Legion Supply Box', '{"type": "text", "content": "In the next area to the right, in the northeast corner, is a supply chest."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 4), 
        '/assets/images/Great_Desert/3_Buried_Ruins/4_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 4), 
        '/assets/images/Great_Desert/3_Buried_Ruins/4_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 4, 'Memorystick - May''s Memory', '{"type": "text", "content": "South of the previous collectible is a enclosed area, which is where you need to go for the \u201cA Treasure with a Name\u201d side quest. This is the 1st of 3 memorysticks to collect."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - May''s Memory' AND location_id = 40 AND display_order = 5), 
        '/assets/images/Great_Desert/3_Buried_Ruins/5_Memorystick_May''s_Memory_1.jpg', 'Memorystick - May''s Memory', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - May''s Memory' AND location_id = 40 AND display_order = 5), 
        '/assets/images/Great_Desert/3_Buried_Ruins/5_Memorystick_May''s_Memory_2.jpg', 'Memorystick - May''s Memory', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - May''s Memory' AND location_id = 40 AND display_order = 5), 
        '/assets/images/Great_Desert/3_Buried_Ruins/5_Memorystick_May''s_Memory_3.jpg', 'Memorystick - May''s Memory', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 4, 'Memorystick - August''s Memory', '{"type": "text", "content": "Also part of the \u201cA Treasure with a Name\u201d side quest. This is the 2nd of 3 memorysticks to collect."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - August''s Memory' AND location_id = 40 AND display_order = 6), 
        '/assets/images/Great_Desert/3_Buried_Ruins/6_Memorystick_August''s_Memory_1.jpg', 'Memorystick - August''s Memory', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - August''s Memory' AND location_id = 40 AND display_order = 6), 
        '/assets/images/Great_Desert/3_Buried_Ruins/6_Memorystick_August''s_Memory_2.jpg', 'Memorystick - August''s Memory', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 4, 'Memorystick - July''s Memory', '{"type": "text", "content": "Also part of the \u201cA Treasure with a Name\u201d side quest. This is the 3rd of 3 memorysticks to collect."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - July''s Memory' AND location_id = 40 AND display_order = 7), 
        '/assets/images/Great_Desert/3_Buried_Ruins/7_Memorystick_July''s_Memory_1.jpg', 'Memorystick - July''s Memory', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - July''s Memory' AND location_id = 40 AND display_order = 7), 
        '/assets/images/Great_Desert/3_Buried_Ruins/7_Memorystick_July''s_Memory_2.jpg', 'Memorystick - July''s Memory', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 2, 'Document - Log Data - S2RV1C2-99991''s Data', '{"type": "text", "content": "From the Legion Camp, go forward under the green light, and to the right is a bot with this document on it."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Log Data - S2RV1C2-99991''s Data' AND location_id = 40 AND display_order = 8), 
        '/assets/images/Great_Desert/3_Buried_Ruins/8_Document_Log_Data_S2RV1C2_99991''s_Data_1.jpg', 'Document - Log Data - S2RV1C2-99991''s Data', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Log Data - S2RV1C2-99991''s Data' AND location_id = 40 AND display_order = 8), 
        '/assets/images/Great_Desert/3_Buried_Ruins/8_Document_Log_Data_S2RV1C2_99991''s_Data_2.jpg', 'Document - Log Data - S2RV1C2-99991''s Data', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 4, 'Memorystick - Citizen 360''s Complaint', '{"type": "text", "content": "Just slightly north of the previous bot is a human, near a knee high wall."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Citizen 360''s Complaint' AND location_id = 40 AND display_order = 9), 
        '/assets/images/Great_Desert/3_Buried_Ruins/9_Memorystick_Citizen_360''s_Complaint_1.jpg', 'Memorystick - Citizen 360''s Complaint', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Citizen 360''s Complaint' AND location_id = 40 AND display_order = 9), 
        '/assets/images/Great_Desert/3_Buried_Ruins/9_Memorystick_Citizen_360''s_Complaint_2.jpg', 'Memorystick - Citizen 360''s Complaint', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 12, 'Robot - Drone Upgrade Modules', '{"type": "text", "content": "Southeast of the memorystick, on the main road from the south, is a robot behind a bus."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Drone Upgrade Modules' AND location_id = 40 AND display_order = 10), 
        '/assets/images/Great_Desert/3_Buried_Ruins/10_Robot_Drone_Upgrade_Modules_1.jpg', 'Robot - Drone Upgrade Modules', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Drone Upgrade Modules' AND location_id = 40 AND display_order = 10), 
        '/assets/images/Great_Desert/3_Buried_Ruins/10_Robot_Drone_Upgrade_Modules_2.jpg', 'Robot - Drone Upgrade Modules', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 4, 'Memorystick - Scavenger 388''s Plea', '{"type": "text", "content": "Further south, near an Old Droid and a couple of Droid Turrets."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Scavenger 388''s Plea' AND location_id = 40 AND display_order = 11), 
        '/assets/images/Great_Desert/3_Buried_Ruins/11_Memorystick_Scavenger_388''s_Plea_1.jpg', 'Memorystick - Scavenger 388''s Plea', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Scavenger 388''s Plea' AND location_id = 40 AND display_order = 11), 
        '/assets/images/Great_Desert/3_Buried_Ruins/11_Memorystick_Scavenger_388''s_Plea_2.jpg', 'Memorystick - Scavenger 388''s Plea', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 13, 'Legion Supply Box', '{"type": "text", "content": "Back to where you found Citizen 360''s Complaint. Head west to get into a warehouse where this chest is."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 12), 
        '/assets/images/Great_Desert/3_Buried_Ruins/12_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 12), 
        '/assets/images/Great_Desert/3_Buried_Ruins/12_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 13, 'Legion Supply Box', '{"type": "text", "content": "In the northeastern part of the ruins, there''s a bus and a ladder leading to the roofs. Head up. On the first roof you jump to, there''s a supply chest there."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 13), 
        '/assets/images/Great_Desert/3_Buried_Ruins/13_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 13), 
        '/assets/images/Great_Desert/3_Buried_Ruins/13_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 13), 
        '/assets/images/Great_Desert/3_Buried_Ruins/13_Legion_Supply_Box_3.jpg', 'Legion Supply Box', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 13, 'Legion Supply Box', '{"type": "text", "content": "On the next roof, the one with the big yellow box to move."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 14), 
        '/assets/images/Great_Desert/3_Buried_Ruins/14_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 14), 
        '/assets/images/Great_Desert/3_Buried_Ruins/14_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 3, 'Can - Potential Frost', '{"type": "text", "content": "On the next roof, where you have to wall jump, do a 180 and you''ll see a can crate behind some lasers. Jump and dodge to get through them to get this can."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Potential Frost' AND location_id = 40 AND display_order = 15), 
        '/assets/images/Great_Desert/3_Buried_Ruins/15_Can_Potential_Frost_1.jpg', 'Can - Potential Frost', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Potential Frost' AND location_id = 40 AND display_order = 15), 
        '/assets/images/Great_Desert/3_Buried_Ruins/15_Can_Potential_Frost_2.jpg', 'Can - Potential Frost', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Potential Frost' AND location_id = 40 AND display_order = 15), 
        '/assets/images/Great_Desert/3_Buried_Ruins/15_Can_Potential_Frost_3.jpg', 'Can - Potential Frost', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Potential Frost' AND location_id = 40 AND display_order = 15), 
        '/assets/images/Great_Desert/3_Buried_Ruins/15_Can_Potential_Frost_4.jpg', 'Can - Potential Frost', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Potential Frost' AND location_id = 40 AND display_order = 15), 
        '/assets/images/Great_Desert/3_Buried_Ruins/15_Can_Potential_Frost_5.jpg', 'Can - Potential Frost', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Potential Frost' AND location_id = 40 AND display_order = 15), 
        '/assets/images/Great_Desert/3_Buried_Ruins/15_Can_Potential_Frost_6.jpg', 'Can - Potential Frost', 6);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 4, 'Memorystick - Yo''s Mutterings, Ryu''s Rage, So''s Resolution, Lune''s Last Words, Mel''s Faith and Raan''s Testament', '{"type": "text", "content": "Defeat Abaddon on the roof during the side quest, \u201cAn Eye for an Eye, a Tooth for a Tooth\u201d and it''ll drop 6 memorysticks."}', 16);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Yo''s Mutterings, Ryu''s Rage, So''s Resolution, Lune''s Last Words, Mel''s Faith and Raan''s Testament' AND location_id = 40 AND display_order = 16), 
        '/assets/images/Great_Desert/3_Buried_Ruins/16_Memorystick_Yo''s_Mutterings_Ryu''s_Rage_So''s_Resolution_Lune''s_Last_Words_Mel''s_Faith_and_Raan''s_Testament_1.jpg', 'Memorystick - Yo''s Mutterings, Ryu''s Rage, So''s Resolution, Lune''s Last Words, Mel''s Faith and Raan''s Testament', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Yo''s Mutterings, Ryu''s Rage, So''s Resolution, Lune''s Last Words, Mel''s Faith and Raan''s Testament' AND location_id = 40 AND display_order = 16), 
        '/assets/images/Great_Desert/3_Buried_Ruins/16_Memorystick_Yo''s_Mutterings_Ryu''s_Rage_So''s_Resolution_Lune''s_Last_Words_Mel''s_Faith_and_Raan''s_Testament_2.jpg', 'Memorystick - Yo''s Mutterings, Ryu''s Rage, So''s Resolution, Lune''s Last Words, Mel''s Faith and Raan''s Testament', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Yo''s Mutterings, Ryu''s Rage, So''s Resolution, Lune''s Last Words, Mel''s Faith and Raan''s Testament' AND location_id = 40 AND display_order = 16), 
        '/assets/images/Great_Desert/3_Buried_Ruins/16_Memorystick_Yo''s_Mutterings_Ryu''s_Rage_So''s_Resolution_Lune''s_Last_Words_Mel''s_Faith_and_Raan''s_Testament_3.jpg', 'Memorystick - Yo''s Mutterings, Ryu''s Rage, So''s Resolution, Lune''s Last Words, Mel''s Faith and Raan''s Testament', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 1, 'Supply Camp - Crumbling Rooftop', '{"type": "text", "content": "From the rooftop, head east-northeast for this supply samp. On the adjacent rooftop."}', 17);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Crumbling Rooftop' AND location_id = 40 AND display_order = 17), 
        '/assets/images/Great_Desert/3_Buried_Ruins/17_Supply_Camp_Crumbling_Rooftop_1.jpg', 'Supply Camp - Crumbling Rooftop', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Crumbling Rooftop' AND location_id = 40 AND display_order = 17), 
        '/assets/images/Great_Desert/3_Buried_Ruins/17_Supply_Camp_Crumbling_Rooftop_2.jpg', 'Supply Camp - Crumbling Rooftop', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 13, 'Legion Supply Box', '{"type": "text", "content": "On the rooftop to the north of the supply camp."}', 18);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 18), 
        '/assets/images/Great_Desert/3_Buried_Ruins/18_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 18), 
        '/assets/images/Great_Desert/3_Buried_Ruins/18_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 3, 'Can - Johnson''s Highball Ginger', '{"type": "text", "content": "Drop down to the east, and then in the southeast corner of the next area you''ll see a Fiz machine with this can."}', 19);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Johnson''s Highball Ginger' AND location_id = 40 AND display_order = 19), 
        '/assets/images/Great_Desert/3_Buried_Ruins/19_Can_Johnson''s_Highball_Ginger_1.jpg', 'Can - Johnson''s Highball Ginger', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Johnson''s Highball Ginger' AND location_id = 40 AND display_order = 19), 
        '/assets/images/Great_Desert/3_Buried_Ruins/19_Can_Johnson''s_Highball_Ginger_2.jpg', 'Can - Johnson''s Highball Ginger', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Johnson''s Highball Ginger' AND location_id = 40 AND display_order = 19), 
        '/assets/images/Great_Desert/3_Buried_Ruins/19_Can_Johnson''s_Highball_Ginger_3.jpg', 'Can - Johnson''s Highball Ginger', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 4, 'Memorystick - Scavenger 438''s Plea', '{"type": "text", "content": "Behind the Fiz machine, on the other side of the wall."}', 20);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Scavenger 438''s Plea' AND location_id = 40 AND display_order = 20), 
        '/assets/images/Great_Desert/3_Buried_Ruins/20_Memorystick_Scavenger_438''s_Plea_1.jpg', 'Memorystick - Scavenger 438''s Plea', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Scavenger 438''s Plea' AND location_id = 40 AND display_order = 20), 
        '/assets/images/Great_Desert/3_Buried_Ruins/20_Memorystick_Scavenger_438''s_Plea_2.jpg', 'Memorystick - Scavenger 438''s Plea', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 5, 'Locked Supply Chest', '{"type": "text", "content": "Head west and into the building underneath the Supply Camp. Requires a passcode, which you''ll find in the Opera House. Contains 3 Omnibolts."}', 21);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 40 AND display_order = 21), 
        '/assets/images/Great_Desert/3_Buried_Ruins/21_Locked_Supply_Chest_1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 40 AND display_order = 21), 
        '/assets/images/Great_Desert/3_Buried_Ruins/21_Locked_Supply_Chest_2.jpg', 'Locked Supply Chest', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 13, 'Legion Supply Box', '{"type": "text", "content": "Now head east to the dome shaped building. There''s a supply box on the western side."}', 22);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 22), 
        '/assets/images/Great_Desert/3_Buried_Ruins/22_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 22), 
        '/assets/images/Great_Desert/3_Buried_Ruins/22_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 2, 'Document - Series - The Truth, Article 6', '{"type": "text", "content": "Just to the northeast of the supply box is a newspaper dispenser with this newspaper in."}', 23);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series - The Truth, Article 6' AND location_id = 40 AND display_order = 23), 
        '/assets/images/Great_Desert/3_Buried_Ruins/23_Document_Series_The_Truth_Article_6_1.jpg', 'Document - Series - The Truth, Article 6', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series - The Truth, Article 6' AND location_id = 40 AND display_order = 23), 
        '/assets/images/Great_Desert/3_Buried_Ruins/23_Document_Series_The_Truth_Article_6_2.jpg', 'Document - Series - The Truth, Article 6', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 12, 'Robot - Passcode - nnauud', '{"type": "text", "content": "Downstairs in the Opera House (the dome shaped building) is a robot with this passcode."}', 24);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Passcode - nnauud' AND location_id = 40 AND display_order = 24), 
        '/assets/images/Great_Desert/3_Buried_Ruins/24_Robot_Passcode_nnauud_1.jpg', 'Robot - Passcode - nnauud', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Passcode - nnauud' AND location_id = 40 AND display_order = 24), 
        '/assets/images/Great_Desert/3_Buried_Ruins/24_Robot_Passcode_nnauud_2.jpg', 'Robot - Passcode - nnauud', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 4, 'Memorystick - Sentinel 477''s Plea', '{"type": "text", "content": "Northeast corner of the Opera House, near a bus."}', 25);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 477''s Plea' AND location_id = 40 AND display_order = 25), 
        '/assets/images/Great_Desert/3_Buried_Ruins/25_Memorystick_Sentinel_477''s_Plea_1.jpg', 'Memorystick - Sentinel 477''s Plea', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 477''s Plea' AND location_id = 40 AND display_order = 25), 
        '/assets/images/Great_Desert/3_Buried_Ruins/25_Memorystick_Sentinel_477''s_Plea_2.jpg', 'Memorystick - Sentinel 477''s Plea', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 3, 'Can - The Haven Milk Tea', '{"type": "text", "content": "To get this one, you need to solve a door puzzle to the north of the Opera House. Take out the turret and then put the hover storage on the pressure plates, so that they all equal 4, 6 and 7 (from west to east). Once you''ve done that and got all greens, open the door to the northeast. Inside is a can chest."}', 26);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Haven Milk Tea' AND location_id = 40 AND display_order = 26), 
        '/assets/images/Great_Desert/3_Buried_Ruins/26_Can_The_Haven_Milk_Tea_1.jpg', 'Can - The Haven Milk Tea', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Haven Milk Tea' AND location_id = 40 AND display_order = 26), 
        '/assets/images/Great_Desert/3_Buried_Ruins/26_Can_The_Haven_Milk_Tea_2.jpg', 'Can - The Haven Milk Tea', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Haven Milk Tea' AND location_id = 40 AND display_order = 26), 
        '/assets/images/Great_Desert/3_Buried_Ruins/26_Can_The_Haven_Milk_Tea_3.jpg', 'Can - The Haven Milk Tea', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Haven Milk Tea' AND location_id = 40 AND display_order = 26), 
        '/assets/images/Great_Desert/3_Buried_Ruins/26_Can_The_Haven_Milk_Tea_4.jpg', 'Can - The Haven Milk Tea', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Haven Milk Tea' AND location_id = 40 AND display_order = 26), 
        '/assets/images/Great_Desert/3_Buried_Ruins/26_Can_The_Haven_Milk_Tea_5.jpg', 'Can - The Haven Milk Tea', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Haven Milk Tea' AND location_id = 40 AND display_order = 26), 
        '/assets/images/Great_Desert/3_Buried_Ruins/26_Can_The_Haven_Milk_Tea_6.jpg', 'Can - The Haven Milk Tea', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Haven Milk Tea' AND location_id = 40 AND display_order = 26), 
        '/assets/images/Great_Desert/3_Buried_Ruins/26_Can_The_Haven_Milk_Tea_7.jpg', 'Can - The Haven Milk Tea', 7);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 13, 'Legion Supply Box', '{"type": "text", "content": "Same garage is a supply crate. Contains Gold Gear (3 star) and an Omnibolt."}', 27);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 27), 
        '/assets/images/Great_Desert/3_Buried_Ruins/27_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 27), 
        '/assets/images/Great_Desert/3_Buried_Ruins/27_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 13, 'Legion Supply Box', '{"type": "text", "content": "Northeast of the puzzle area, on the road out of the ruins."}', 28);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 28), 
        '/assets/images/Great_Desert/3_Buried_Ruins/28_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 28), 
        '/assets/images/Great_Desert/3_Buried_Ruins/28_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 3, 'Can - Behemoth Black', '{"type": "text", "content": "East of the previous pressure plate puzzle is another one. This time put the yellow boxes on 12, 2 and 13. Once you do, the can pops out the chest at the south end of the area."}', 29);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Behemoth Black' AND location_id = 40 AND display_order = 29), 
        '/assets/images/Great_Desert/3_Buried_Ruins/29_Can_Behemoth_Black_1.jpg', 'Can - Behemoth Black', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Behemoth Black' AND location_id = 40 AND display_order = 29), 
        '/assets/images/Great_Desert/3_Buried_Ruins/29_Can_Behemoth_Black_2.jpg', 'Can - Behemoth Black', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Behemoth Black' AND location_id = 40 AND display_order = 29), 
        '/assets/images/Great_Desert/3_Buried_Ruins/29_Can_Behemoth_Black_3.jpg', 'Can - Behemoth Black', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Behemoth Black' AND location_id = 40 AND display_order = 29), 
        '/assets/images/Great_Desert/3_Buried_Ruins/29_Can_Behemoth_Black_4.jpg', 'Can - Behemoth Black', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Behemoth Black' AND location_id = 40 AND display_order = 29), 
        '/assets/images/Great_Desert/3_Buried_Ruins/29_Can_Behemoth_Black_5.jpg', 'Can - Behemoth Black', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Behemoth Black' AND location_id = 40 AND display_order = 29), 
        '/assets/images/Great_Desert/3_Buried_Ruins/29_Can_Behemoth_Black_6.jpg', 'Can - Behemoth Black', 6);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 17, 'Body Core', '{"type": "text", "content": "At the end of the northeastern street is a body with a Body Core on it."}', 30);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 40 AND display_order = 30), 
        '/assets/images/Great_Desert/3_Buried_Ruins/30_Body_Core_1.jpg', 'Body Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 40 AND display_order = 30), 
        '/assets/images/Great_Desert/3_Buried_Ruins/30_Body_Core_2.jpg', 'Body Core', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 1, 'Legion Camp - Middle Path Between Ruins', '{"type": "text", "content": "Head south-southeast from the Opera House and then take the street east. The Legion Camp is midway down that street."}', 31);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - Middle Path Between Ruins' AND location_id = 40 AND display_order = 31), 
        '/assets/images/Great_Desert/3_Buried_Ruins/31_Legion_Camp_Middle_Path_Between_Ruins_1.jpg', 'Legion Camp - Middle Path Between Ruins', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - Middle Path Between Ruins' AND location_id = 40 AND display_order = 31), 
        '/assets/images/Great_Desert/3_Buried_Ruins/31_Legion_Camp_Middle_Path_Between_Ruins_2.jpg', 'Legion Camp - Middle Path Between Ruins', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 3, 'Can - Mountain Sparkle Everest', '{"type": "text", "content": "Head northeast from the camp and push the yellow block all the way to the north to block the lasers. The can is behind the lasers."}', 32);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Mountain Sparkle Everest' AND location_id = 40 AND display_order = 32), 
        '/assets/images/Great_Desert/3_Buried_Ruins/32_Can_Mountain_Sparkle_Everest_1.jpg', 'Can - Mountain Sparkle Everest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Mountain Sparkle Everest' AND location_id = 40 AND display_order = 32), 
        '/assets/images/Great_Desert/3_Buried_Ruins/32_Can_Mountain_Sparkle_Everest_2.jpg', 'Can - Mountain Sparkle Everest', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Mountain Sparkle Everest' AND location_id = 40 AND display_order = 32), 
        '/assets/images/Great_Desert/3_Buried_Ruins/32_Can_Mountain_Sparkle_Everest_3.jpg', 'Can - Mountain Sparkle Everest', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Mountain Sparkle Everest' AND location_id = 40 AND display_order = 32), 
        '/assets/images/Great_Desert/3_Buried_Ruins/32_Can_Mountain_Sparkle_Everest_4.jpg', 'Can - Mountain Sparkle Everest', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 13, 'Legion Supply Box', '{"type": "text", "content": "South of the Opera House, jump into the building near the explosive crates. The supply box is straight ahead. Can only be opened with the Hacking Tool (which you should have by now)."}', 33);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 33), 
        '/assets/images/Great_Desert/3_Buried_Ruins/33_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 33), 
        '/assets/images/Great_Desert/3_Buried_Ruins/33_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 33), 
        '/assets/images/Great_Desert/3_Buried_Ruins/33_Legion_Supply_Box_3.jpg', 'Legion Supply Box', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 3, 'Can - Liquid Nuclear', '{"type": "text", "content": "From inside the same area, head to the right and over the wall. Push the yellow block all the way around to reach the yellow ledge at the other end of the room. Then jump up, go to the left and drop down."}', 34);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Liquid Nuclear' AND location_id = 40 AND display_order = 34), 
        '/assets/images/Great_Desert/3_Buried_Ruins/34_Can_Liquid_Nuclear_1.jpg', 'Can - Liquid Nuclear', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Liquid Nuclear' AND location_id = 40 AND display_order = 34), 
        '/assets/images/Great_Desert/3_Buried_Ruins/34_Can_Liquid_Nuclear_2.jpg', 'Can - Liquid Nuclear', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Liquid Nuclear' AND location_id = 40 AND display_order = 34), 
        '/assets/images/Great_Desert/3_Buried_Ruins/34_Can_Liquid_Nuclear_3.jpg', 'Can - Liquid Nuclear', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Liquid Nuclear' AND location_id = 40 AND display_order = 34), 
        '/assets/images/Great_Desert/3_Buried_Ruins/34_Can_Liquid_Nuclear_4.jpg', 'Can - Liquid Nuclear', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Liquid Nuclear' AND location_id = 40 AND display_order = 34), 
        '/assets/images/Great_Desert/3_Buried_Ruins/34_Can_Liquid_Nuclear_5.jpg', 'Can - Liquid Nuclear', 5);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 4, 'Memorystick - Sentinel 39''s Resolution', '{"type": "text", "content": "In the same area as the can above."}', 35);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 39''s Resolution' AND location_id = 40 AND display_order = 35), 
        '/assets/images/Great_Desert/3_Buried_Ruins/35_Memorystick_Sentinel_39''s_Resolution_1.jpg', 'Memorystick - Sentinel 39''s Resolution', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 39''s Resolution' AND location_id = 40 AND display_order = 35), 
        '/assets/images/Great_Desert/3_Buried_Ruins/35_Memorystick_Sentinel_39''s_Resolution_2.jpg', 'Memorystick - Sentinel 39''s Resolution', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 13, 'Legion Supply Box', '{"type": "text", "content": "South of the previous collectibles are some lasers hiding another chest. The middle sensors are on a timer. When they''re off, jump through them to get this supply box."}', 36);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 36), 
        '/assets/images/Great_Desert/3_Buried_Ruins/36_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 36), 
        '/assets/images/Great_Desert/3_Buried_Ruins/36_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 36), 
        '/assets/images/Great_Desert/3_Buried_Ruins/36_Legion_Supply_Box_3.jpg', 'Legion Supply Box', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 14, 'Beta Core', '{"type": "text", "content": "Northwest from the previous supply box and slightly southwest of the Crumbling Rooftop supply camp is a body with a Beta Core."}', 37);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 40 AND display_order = 37), 
        '/assets/images/Great_Desert/3_Buried_Ruins/37_Beta_Core_1.jpg', 'Beta Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 40 AND display_order = 37), 
        '/assets/images/Great_Desert/3_Buried_Ruins/37_Beta_Core_2.jpg', 'Beta Core', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 1, 'Legion Camp - North of Buried Ruins', '{"type": "text", "content": "North from the previous beta core and slightly northwest from the Crumbling Rooftop supply camp is the North of Buried Ruins legion camp."}', 38);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - North of Buried Ruins' AND location_id = 40 AND display_order = 38), 
        '/assets/images/Great_Desert/3_Buried_Ruins/38_Legion_Camp_North_of_Buried_Ruins_1.jpg', 'Legion Camp - North of Buried Ruins', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - North of Buried Ruins' AND location_id = 40 AND display_order = 38), 
        '/assets/images/Great_Desert/3_Buried_Ruins/38_Legion_Camp_North_of_Buried_Ruins_2.jpg', 'Legion Camp - North of Buried Ruins', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 1, 'Supply Camp - Buried Ruins Outskirts', '{"type": "text", "content": "North-northeast of the North of Buried Ruins legion camp."}', 39);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Buried Ruins Outskirts' AND location_id = 40 AND display_order = 39), 
        '/assets/images/Great_Desert/3_Buried_Ruins/39_Supply_Camp_Buried_Ruins_Outskirts_1.jpg', 'Supply Camp - Buried Ruins Outskirts', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Buried Ruins Outskirts' AND location_id = 40 AND display_order = 39), 
        '/assets/images/Great_Desert/3_Buried_Ruins/39_Supply_Camp_Buried_Ruins_Outskirts_2.jpg', 'Supply Camp - Buried Ruins Outskirts', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 13, 'Legion Supply Box', '{"type": "text", "content": "Heading Northwest along the outskirts of the Buried Ruins, roughly west of the North of Buried Ruins Legion Camp, is a building you can enter with this crate inside. Contains 2 Omnibolts and Combo Attack Enhancement Gear (2 star)."}', 40);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 40), 
        '/assets/images/Great_Desert/3_Buried_Ruins/40_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 40), 
        '/assets/images/Great_Desert/3_Buried_Ruins/40_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 4, 'Memorystick - Sentinel 15''s Plea', '{"type": "text", "content": "Southwest of the Buried Ruins, at the base of one of the pillars of the large highway overhead. "}', 41);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 15''s Plea' AND location_id = 40 AND display_order = 41), 
        '/assets/images/Great_Desert/3_Buried_Ruins/41_Memorystick_Sentinel_15''s_Plea_1.jpg', 'Memorystick - Sentinel 15''s Plea', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 15''s Plea' AND location_id = 40 AND display_order = 41), 
        '/assets/images/Great_Desert/3_Buried_Ruins/41_Memorystick_Sentinel_15''s_Plea_2.jpg', 'Memorystick - Sentinel 15''s Plea', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (40, 13, 'Legion Supply Box', '{"type": "text", "content": "West of the previous collectible. Move the yellow box to pillar with the bars, then jump up and across. The supply box is at the top."}', 42);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 42), 
        '/assets/images/Great_Desert/3_Buried_Ruins/42_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 42), 
        '/assets/images/Great_Desert/3_Buried_Ruins/42_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 40 AND display_order = 42), 
        '/assets/images/Great_Desert/3_Buried_Ruins/42_Legion_Supply_Box_3.jpg', 'Legion Supply Box', 3);

-- Great Desert - Central Great Desert

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 13, 'Legion Supply Box', '{"type": "text", "content": "Next to the rock formation beside the waypoint."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 41 AND display_order = 1), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/1_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 41 AND display_order = 1), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/1_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 4, 'Memorystick - Citizen 206''s Memory', '{"type": "text", "content": "Slightly west is a rock formation. On the eastern side is a body with this memorystick."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Citizen 206''s Memory' AND location_id = 41 AND display_order = 2), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/2_Memorystick_Citizen_206''s_Memory_1.jpg', 'Memorystick - Citizen 206''s Memory', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Citizen 206''s Memory' AND location_id = 41 AND display_order = 2), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/2_Memorystick_Citizen_206''s_Memory_2.jpg', 'Memorystick - Citizen 206''s Memory', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 13, 'Legion Supply Box', '{"type": "text", "content": "Inside the same rock formation is a supply box. Use an Explosive Round to destroy the wood blocking the way in."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 41 AND display_order = 3), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/3_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 41 AND display_order = 3), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/3_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 41 AND display_order = 3), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/3_Legion_Supply_Box_3.jpg', 'Legion Supply Box', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 4, 'Memorystick - Emil''s Lament', '{"type": "text", "content": "South of the previous supply box, in the rocks, near the cliff face."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Emil''s Lament' AND location_id = 41 AND display_order = 4), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/4_Memorystick_Emil''s_Lament_1.jpg', 'Memorystick - Emil''s Lament', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Emil''s Lament' AND location_id = 41 AND display_order = 4), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/4_Memorystick_Emil''s_Lament_2.jpg', 'Memorystick - Emil''s Lament', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 3, 'Can - Newfoundland Dry Zero', '{"type": "text", "content": "A little further northwest from the memorystick, in a ditch, is a crate sticking out of the sand. Shoot it for this can."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Newfoundland Dry Zero' AND location_id = 41 AND display_order = 5), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/5_Can_Newfoundland_Dry_Zero_1.jpg', 'Can - Newfoundland Dry Zero', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Newfoundland Dry Zero' AND location_id = 41 AND display_order = 5), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/5_Can_Newfoundland_Dry_Zero_2.jpg', 'Can - Newfoundland Dry Zero', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Newfoundland Dry Zero' AND location_id = 41 AND display_order = 5), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/5_Can_Newfoundland_Dry_Zero_3.jpg', 'Can - Newfoundland Dry Zero', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Newfoundland Dry Zero' AND location_id = 41 AND display_order = 5), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/5_Can_Newfoundland_Dry_Zero_4.jpg', 'Can - Newfoundland Dry Zero', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 12, 'Robot - Document - Series - The Xion #4', '{"type": "text", "content": "West of the previous can, in some rocks."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Document - Series - The Xion #4' AND location_id = 41 AND display_order = 6), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/6_Robot_Document_Series_The_Xion_4_1.jpg', 'Robot - Document - Series - The Xion #4', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Document - Series - The Xion #4' AND location_id = 41 AND display_order = 6), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/6_Robot_Document_Series_The_Xion_4_2.jpg', 'Robot - Document - Series - The Xion #4', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 1, 'Supply Camp - Exile''s Passage', '{"type": "text", "content": "On the road to Xion, in the far southwest of the Great Desert."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Exile''s Passage' AND location_id = 41 AND display_order = 7), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/7_Supply_Camp_Exile''s_Passage_1.jpg', 'Supply Camp - Exile''s Passage', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Exile''s Passage' AND location_id = 41 AND display_order = 7), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/7_Supply_Camp_Exile''s_Passage_2.jpg', 'Supply Camp - Exile''s Passage', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 13, 'Legion Supply Box', '{"type": "text", "content": "Directly north of the path to Xion (west-northwest from the Central Great Desert Supply Camp)."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 41 AND display_order = 8), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/8_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 41 AND display_order = 8), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/8_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 4, 'Memorystick - Sentinel 82''s Memory', '{"type": "text", "content": "Slightly east from the previous supply box, outside a rock formation."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 82''s Memory' AND location_id = 41 AND display_order = 9), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/9_Memorystick_Sentinel_82''s_Memory_1.jpg', 'Memorystick - Sentinel 82''s Memory', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 82''s Memory' AND location_id = 41 AND display_order = 9), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/9_Memorystick_Sentinel_82''s_Memory_2.jpg', 'Memorystick - Sentinel 82''s Memory', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 4, 'Memorystick - Citizen 109''s Resolution', '{"type": "text", "content": "Inside the aforementioned rock structure."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Citizen 109''s Resolution' AND location_id = 41 AND display_order = 10), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/10_Memorystick_Citizen_109''s_Resolution_1.jpg', 'Memorystick - Citizen 109''s Resolution', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Citizen 109''s Resolution' AND location_id = 41 AND display_order = 10), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/10_Memorystick_Citizen_109''s_Resolution_2.jpg', 'Memorystick - Citizen 109''s Resolution', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 13, 'Legion Supply Box', '{"type": "text", "content": "Next to the previous memorystick."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 41 AND display_order = 11), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/11_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 41 AND display_order = 11), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/11_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 3, 'Can - Nectar Cranberry', '{"type": "text", "content": "Northwest of the rock formation with the previous collectibles, climb the wall and platform on the drones until you can reach the platform with the ice camp cooler."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Nectar Cranberry' AND location_id = 41 AND display_order = 12), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/12_Can_Nectar_Cranberry_1.jpg', 'Can - Nectar Cranberry', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Nectar Cranberry' AND location_id = 41 AND display_order = 12), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/12_Can_Nectar_Cranberry_2.jpg', 'Can - Nectar Cranberry', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Nectar Cranberry' AND location_id = 41 AND display_order = 12), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/12_Can_Nectar_Cranberry_3.jpg', 'Can - Nectar Cranberry', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Nectar Cranberry' AND location_id = 41 AND display_order = 12), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/12_Can_Nectar_Cranberry_4.jpg', 'Can - Nectar Cranberry', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 4, 'Memorystick - Galaxy Alan''s Lament / Passcode - yyyya0', '{"type": "text", "content": "From the previous can, just forward and to the west. There''s a door you can open there. The corpse is inside with the memorystick and passcode."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Galaxy Alan''s Lament / Passcode - yyyya0' AND location_id = 41 AND display_order = 13), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/13_Memorystick_Galaxy_Alan''s_Lament_and_Passcode_yyyya0_1.jpg', 'Memorystick - Galaxy Alan''s Lament', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Galaxy Alan''s Lament / Passcode - yyyya0' AND location_id = 41 AND display_order = 13), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/13_Memorystick_Galaxy_Alan''s_Lament_and_Passcode_yyyya0_2.jpg', 'Memorystick - Galaxy Alan''s Lament', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Galaxy Alan''s Lament / Passcode - yyyya0' AND location_id = 41 AND display_order = 13), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/13_Memorystick_Galaxy_Alan''s_Lament_and_Passcode_yyyya0_3.jpg', 'Memorystick - Galaxy Alan''s Lament', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Galaxy Alan''s Lament / Passcode - yyyya0' AND location_id = 41 AND display_order = 13), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/13_Memorystick_Galaxy_Alan''s_Lament_and_Passcode_yyyya0_4.jpg', 'Memorystick - Galaxy Alan''s Lament', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 13, 'Legion Supply Box', '{"type": "text", "content": "On the other side of the same room where you just got the previous memorystick and passcode from."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 41 AND display_order = 14), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/14_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 41 AND display_order = 14), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/14_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 1, 'Legion Camp - Northern Great Desert', '{"type": "text", "content": "Northeast of the previous collectibles. Slightly south-southeast from the Tetrapod."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - Northern Great Desert' AND location_id = 41 AND display_order = 15), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/15_Legion_Camp_Northern_Great_Desert_1.jpg', 'Legion Camp - Northern Great Desert', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - Northern Great Desert' AND location_id = 41 AND display_order = 15), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/15_Legion_Camp_Northern_Great_Desert_2.jpg', 'Legion Camp - Northern Great Desert', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 4, 'Memorystick - Citizen 246''s Recollection', '{"type": "text", "content": "At the top of the building next to the Legion Camp."}', 16);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Citizen 246''s Recollection' AND location_id = 41 AND display_order = 16), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/16_Memorystick_Citizen_246''s_Recollection_1.jpg', 'Memorystick - Citizen 246''s Recollection', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Citizen 246''s Recollection' AND location_id = 41 AND display_order = 16), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/16_Memorystick_Citizen_246''s_Recollection_2.jpg', 'Memorystick - Citizen 246''s Recollection', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Citizen 246''s Recollection' AND location_id = 41 AND display_order = 16), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/16_Memorystick_Citizen_246''s_Recollection_3.jpg', 'Memorystick - Citizen 246''s Recollection', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 2, 'Document - Books - I Heard It', '{"type": "text", "content": "Next to the aforementioned corpse is a bookcase with this book, as part of the \u201cLet There Be Light Again\u201d side quest."}', 17);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Books - I Heard It' AND location_id = 41 AND display_order = 17), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/17_Document_Books_I_Heard_It_1.jpg', 'Document - Books - I Heard It', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Books - I Heard It' AND location_id = 41 AND display_order = 17), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/17_Document_Books_I_Heard_It_2.jpg', 'Document - Books - I Heard It', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 13, 'Legion Supply Box', '{"type": "text", "content": "West-northwest of the previous Legion Camp, near a bridge protruding out of the sand."}', 18);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 41 AND display_order = 18), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/18_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 41 AND display_order = 18), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/18_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 3, 'Can - Milky Pop Zero', '{"type": "text", "content": "Head north from the previous supply box and go around the back of the rock feature. Climb up on the north-facing wall, look up and shoot a target to the northeast, and then use the swinging poles and rope to get up to the top where the ice camp cooler is."}', 19);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Milky Pop Zero' AND location_id = 41 AND display_order = 19), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/19_Can_Milky_Pop_Zero_1.jpg', 'Can - Milky Pop Zero', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Milky Pop Zero' AND location_id = 41 AND display_order = 19), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/19_Can_Milky_Pop_Zero_2.jpg', 'Can - Milky Pop Zero', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Milky Pop Zero' AND location_id = 41 AND display_order = 19), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/19_Can_Milky_Pop_Zero_3.jpg', 'Can - Milky Pop Zero', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Milky Pop Zero' AND location_id = 41 AND display_order = 19), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/19_Can_Milky_Pop_Zero_4.jpg', 'Can - Milky Pop Zero', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Milky Pop Zero' AND location_id = 41 AND display_order = 19), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/19_Can_Milky_Pop_Zero_5.jpg', 'Can - Milky Pop Zero', 5);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 14, 'Beta Core', '{"type": "text", "content": "Head south from the can, and drop down to the southeast. There''s a body with a Beta Core there."}', 20);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 41 AND display_order = 20), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/20_Beta_Core_1.jpg', 'Beta Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 41 AND display_order = 20), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/20_Beta_Core_2.jpg', 'Beta Core', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 13, 'Legion Supply Box', '{"type": "text", "content": "North of the Tetrapod are two rock features. On the westside of the most northerly one is this crate."}', 21);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 41 AND display_order = 21), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/21_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 41 AND display_order = 21), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/21_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (41, 4, 'Memorystick - Scavenger 390''s Memory', '{"type": "text", "content": "West-northwest of the previous supply box are old ruins of a building. At the top is this memorystick. You can climb up using the interior of the building, and double jump and dash from the opposite corner to get there."}', 22);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Scavenger 390''s Memory' AND location_id = 41 AND display_order = 22), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/22_Memorystick_Scavenger_390''s_Memory_1.jpg', 'Memorystick - Scavenger 390''s Memory', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Scavenger 390''s Memory' AND location_id = 41 AND display_order = 22), 
        '/assets/images/Great_Desert/4_Central_Great_Desert/22_Memorystick_Scavenger_390''s_Memory_2.jpg', 'Memorystick - Scavenger 390''s Memory', 2);

-- Great Desert - Collapsed Overpass

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (39, 13, 'Legion Supply Box', '{"type": "text", "content": "Follow the Collapsed Overpass to the southern tunnel. There''s a supply box inside. Need the Hacking Tool to open."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 39 AND display_order = 1), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/1_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 39 AND display_order = 1), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/1_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (39, 4, 'Memorystick - Words Spoken: Embracing Death with a Smile', '{"type": "text", "content": "Head west into the other overpass. Jump over the two swinging poles, and at the bottom is a corpse with this memorystick."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Words Spoken: Embracing Death with a Smile' AND location_id = 39 AND display_order = 2), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/2_Memorystick_Words_Spoken_Embracing_Death_with_a_Smile_1.jpg', 'Memorystick - Words Spoken: Embracing Death with a Smile', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Words Spoken: Embracing Death with a Smile' AND location_id = 39 AND display_order = 2), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/2_Memorystick_Words_Spoken_Embracing_Death_with_a_Smile_2.jpg', 'Memorystick - Words Spoken: Embracing Death with a Smile', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (39, 4, 'Memorystick - Words Spoken: Finding Peace Before Death', '{"type": "text", "content": "Head south of the other collectible and you''ll find this one, by a locked door."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Words Spoken: Finding Peace Before Death' AND location_id = 39 AND display_order = 3), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/3_Memorystick_Words_Spoken_Finding_Peace_Before_Death_1.jpg', 'Memorystick - Words Spoken: Finding Peace Before Death', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Words Spoken: Finding Peace Before Death' AND location_id = 39 AND display_order = 3), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/3_Memorystick_Words_Spoken_Finding_Peace_Before_Death_2.jpg', 'Memorystick - Words Spoken: Finding Peace Before Death', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (39, 4, 'Memorystick - Jerome''s Faith', '{"type": "text", "content": "Continue on up the western overpass to the north, and just as you come back outside, there''s a body by a car."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Jerome''s Faith' AND location_id = 39 AND display_order = 4), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/4_Memorystick_Jerome''s_Faith_1.jpg', 'Memorystick - Jerome''s Faith', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Jerome''s Faith' AND location_id = 39 AND display_order = 4), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/4_Memorystick_Jerome''s_Faith_2.jpg', 'Memorystick - Jerome''s Faith', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (39, 13, 'Legion Supply Box', '{"type": "text", "content": "Continue north along the road. Slide down and use the pole to make it over the gap. The crate is there on the left, on the other side."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 39 AND display_order = 5), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/5_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 39 AND display_order = 5), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/5_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (39, 13, 'Legion Supply Box', '{"type": "text", "content": "Continue north, and next to two Old Droids, on the right is this crate."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 39 AND display_order = 6), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/6_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 39 AND display_order = 6), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/6_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (39, 14, 'Beta Core', '{"type": "text", "content": "Use the yellow box in that area to climb the wall. On the other side, to the north, near a car, is a body with a Beta Core."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 39 AND display_order = 7), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/7_Beta_Core_1.jpg', 'Beta Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 39 AND display_order = 7), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/7_Beta_Core_2.jpg', 'Beta Core', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 39 AND display_order = 7), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/7_Beta_Core_3.jpg', 'Beta Core', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (39, 13, 'Legion Supply Box', '{"type": "text", "content": "East-northeast of the Way to the Solar Tower supply camp is a load of boxes and explosives, with a supply crate in the middle."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 39 AND display_order = 8), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/8_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 39 AND display_order = 8), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/8_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (39, 4, 'Memorystick - Sentinel 41''s Memory', '{"type": "text", "content": "Head back towards the buried ruins. North of where the Legion Camp is, on the east side is a bus (east of the Waypoint). Stand on the bus and double jump up to the swinging poles, and then onto the rope to get to the roof. The body is up there."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 41''s Memory' AND location_id = 39 AND display_order = 9), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/9_Memorystick_Sentinel_41''s_Memory_1.jpg', 'Memorystick - Sentinel 41''s Memory', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 41''s Memory' AND location_id = 39 AND display_order = 9), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/9_Memorystick_Sentinel_41''s_Memory_2.jpg', 'Memorystick - Sentinel 41''s Memory', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 41''s Memory' AND location_id = 39 AND display_order = 9), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/9_Memorystick_Sentinel_41''s_Memory_3.jpg', 'Memorystick - Sentinel 41''s Memory', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (39, 13, 'Legion Supply box', '{"type": "text", "content": "From there head east to the overpass and then head south until you see a bus up top. Shoot the barrels next to it and the bus will drop, allowing you to climb up. The crate is just as you get up."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply box' AND location_id = 39 AND display_order = 10), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/10_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply box' AND location_id = 39 AND display_order = 10), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/10_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply box' AND location_id = 39 AND display_order = 10), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/10_Legion_Supply_Box_3.jpg', 'Legion Supply Box', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (39, 15, 'Nano Suit - Blue Monsoon', '{"type": "text", "content": "There''s one to the south of the previous collectible but it won''t open. Need to have accepted the \u201cPrecious Treasure\u201d request to open it."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Blue Monsoon' AND location_id = 39 AND display_order = 11), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/11_Nano_Suit_Blue_Monsoon_1.jpg', 'Nano Suit - Blue Monsoon', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Blue Monsoon' AND location_id = 39 AND display_order = 11), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/11_Nano_Suit_Blue_Monsoon_2.jpg', 'Nano Suit - Blue Monsoon', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (39, 1, 'Supply Camp - Debris-Filled Entryway', '{"type": "text", "content": "To the north of the previous collectibles is another Supply Camp."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Debris-Filled Entryway' AND location_id = 39 AND display_order = 12), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/12_Supply_Camp_Debris_Filled_Entryway_1.jpg', 'Supply Camp - Debris-Filled Entryway', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Debris-Filled Entryway' AND location_id = 39 AND display_order = 12), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/12_Supply_Camp_Debris_Filled_Entryway_2.jpg', 'Supply Camp - Debris-Filled Entryway', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (39, 3, 'Can - Johnson''s Highball Lemon', '{"type": "text", "content": "Southeast of the Debris-Filled Entryway is some quick sand. On the southeast of that (east of the Waypoint north of the Solar Tower) is a cave. Head inside, kill the 2 Lurkers, and then push the yellow crate to the end and climb the wall. The can crate is at the top."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Johnson''s Highball Lemon' AND location_id = 39 AND display_order = 13), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/13_Can_Johnson''s_Highball_Lemon_1.jpg', 'Can - Johnson''s Highball Lemon', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Johnson''s Highball Lemon' AND location_id = 39 AND display_order = 13), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/13_Can_Johnson''s_Highball_Lemon_2.jpg', 'Can - Johnson''s Highball Lemon', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Johnson''s Highball Lemon' AND location_id = 39 AND display_order = 13), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/13_Can_Johnson''s_Highball_Lemon_3.jpg', 'Can - Johnson''s Highball Lemon', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Johnson''s Highball Lemon' AND location_id = 39 AND display_order = 13), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/13_Can_Johnson''s_Highball_Lemon_4.jpg', 'Can - Johnson''s Highball Lemon', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Johnson''s Highball Lemon' AND location_id = 39 AND display_order = 13), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/13_Can_Johnson''s_Highball_Lemon_5.jpg', 'Can - Johnson''s Highball Lemon', 5);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (39, 4, 'Memorystick Scavenger 404''s Advice', '{"type": "text", "content": "North of the Supply Camp is a human by a Daily Grind billboard."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick Scavenger 404''s Advice' AND location_id = 39 AND display_order = 14), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/14_Memorystick_Scavenger_404''s_Advice_1.jpg', 'Memorystick Scavenger 404''s Advice', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick Scavenger 404''s Advice' AND location_id = 39 AND display_order = 14), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/14_Memorystick_Scavenger_404''s_Advice_2.jpg', 'Memorystick Scavenger 404''s Advice', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (39, 13, 'Legion Supply Box', '{"type": "text", "content": "Just north of the previous memorystick is a supply crate."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 39 AND display_order = 15), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/15_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 39 AND display_order = 15), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/15_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (39, 17, 'Body Core', '{"type": "text", "content": "From the supply camp, head east into the ruins and there''s a body and a Body Core inside one of the western most buildings."}', 16);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 39 AND display_order = 16), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/16_Body_Core_1.jpg', 'Body Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 39 AND display_order = 16), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/16_Body_Core_2.jpg', 'Body Core', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (39, 13, 'Legion Supply Box', '{"type": "text", "content": "Head east to the far buildings and there''s a supply crate down low, towards the east side of the ruins. Contains 2 Omnibolts and Ranged Protection Gear (2 star)."}', 17);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 39 AND display_order = 17), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/17_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 39 AND display_order = 17), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/17_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (39, 13, 'Legion Supply Box', '{"type": "text", "content": "Head southeast of the previous one, onto the roof with the yellow box. Push it south, and climb on it to be able to latch onto the wall opposite it. Climb to the top, and in the northeast corner of the rooftop with a ramp is this crate. Contains 2 Omnibolts and Ranged Enhancement Gear (2 star)."}', 18);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 39 AND display_order = 18), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/18_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 39 AND display_order = 18), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/18_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 39 AND display_order = 18), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/18_Legion_Supply_Box_3.jpg', 'Legion Supply Box', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (39, 12, 'Robot - Tumbler Expansion Module', '{"type": "text", "content": "Now take the ramp west and jump from pole to pole until you reach the robot on a roof."}', 19);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 39 AND display_order = 19), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/19_Robot_1.jpg', 'Robot - Tumbler Expansion Module', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 39 AND display_order = 19), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/19_Robot_2.jpg', 'Robot - Tumbler Expansion Module', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 39 AND display_order = 19), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/19_Robot_3.jpg', 'Robot - Tumbler Expansion Module', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (39, 15, 'Nano Suit - Black Wave', '{"type": "text", "content": "From there, head west, before then jumping up to the roof to the south. The Nano Suit is up there."}', 20);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Black Wave' AND location_id = 39 AND display_order = 20), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/20_Nano_Suit_Black_Wave_1.jpg', 'Nano Suit - Black Wave', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Black Wave' AND location_id = 39 AND display_order = 20), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/20_Nano_Suit_Black_Wave_2.jpg', 'Nano Suit - Black Wave', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Black Wave' AND location_id = 39 AND display_order = 20), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/20_Nano_Suit_Black_Wave_3.jpg', 'Nano Suit - Black Wave', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Black Wave' AND location_id = 39 AND display_order = 20), 
        '/assets/images/Great_Desert/2_Collapsed_Overpass/20_Nano_Suit_Black_Wave_4.jpg', 'Nano Suit - Black Wave', 4);

-- Great Desert - Northern Great Desert

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 1, 'Legion Camp - Hypertube', '{"type": "text", "content": "West of the Tetrapod, on the east side of the large tubes (the Hypertubes)."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - Hypertube' AND location_id = 42 AND display_order = 1), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/1_Legion_Camp_Hypertube_1.jpg', 'Legion Camp - Hypertube', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - Hypertube' AND location_id = 42 AND display_order = 1), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/1_Legion_Camp_Hypertube_2.jpg', 'Legion Camp - Hypertube', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 20, 'Exospine - Suppression-Type', '{"type": "text", "content": "Slightly northeast of the Legion Camp is a platform with two Turret Droids on it. The crate with this Exospine is in, is on there"}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Suppression-Type' AND location_id = 42 AND display_order = 2), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/2_Exospine_Suppression_Type_1.jpg', 'Exospine - Suppression-Type', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Suppression-Type' AND location_id = 42 AND display_order = 2), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/2_Exospine_Suppression_Type_2.jpg', 'Exospine - Suppression-Type', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 4, 'Memorystick - Exile''s Resolution', '{"type": "text", "content": "North of the Legion Camp, near the Hypertube entrance is a shipping crate with a body on it."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Exile''s Resolution' AND location_id = 42 AND display_order = 3), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/3_Memorystick_Exile''s_Resolution_1.jpg', 'Memorystick - Exile''s Resolution', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Exile''s Resolution' AND location_id = 42 AND display_order = 3), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/3_Memorystick_Exile''s_Resolution_2.jpg', 'Memorystick - Exile''s Resolution', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 2, 'Document - Messages - Third Road', '{"type": "text", "content": "Next to the corpse that had the aforementioned memorystick. Appears to contain a code: u0ydByKaySSynSyrBy (all y''s are upside down)."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Messages - Third Road' AND location_id = 42 AND display_order = 4), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/4_Document_Messages_Third_Road_1.jpg', 'Document - Messages - Third Road', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Messages - Third Road' AND location_id = 42 AND display_order = 4), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/4_Document_Messages_Third_Road_2.jpg', 'Document - Messages - Third Road', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 2, 'Document - Journal - Orca Aerospace Company Hypertube System', '{"type": "text", "content": "As part of \u201cThe King of the Tunnel\u201d side quest, after jumping into the Hyperspace tunnel, you''ll end up on the other side of the map. When in the water, dive down to the bottom to find a body with this document."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - Orca Aerospace Company Hypertube System' AND location_id = 42 AND display_order = 5), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/5_Document_Journal_Orca_Aerospace_Company_Hypertube_System_1.jpg', 'Document - Journal - Orca Aerospace Company Hypertube System', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - Orca Aerospace Company Hypertube System' AND location_id = 42 AND display_order = 5), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/5_Document_Journal_Orca_Aerospace_Company_Hypertube_System_2.jpg', 'Document - Journal - Orca Aerospace Company Hypertube System', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - Orca Aerospace Company Hypertube System' AND location_id = 42 AND display_order = 5), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/5_Document_Journal_Orca_Aerospace_Company_Hypertube_System_3.jpg', 'Document - Journal - Orca Aerospace Company Hypertube System', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - Orca Aerospace Company Hypertube System' AND location_id = 42 AND display_order = 5), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/5_Document_Journal_Orca_Aerospace_Company_Hypertube_System_4.jpg', 'Document - Journal - Orca Aerospace Company Hypertube System', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 5, 'Locked Supply Chest', '{"type": "text", "content": "Still under the water, on the south side, is a crate to open (it has the quest Fusion Cell inside, as well as some goodies). Also has loads of Micro Coils, Micro Motors and Micro Drives too."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 42 AND display_order = 6), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/6_Locked_Supply_Chest_1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 42 AND display_order = 6), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/6_Locked_Supply_Chest_2.jpg', 'Locked Supply Chest', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 2, 'Document - Prayer - Chapter of Trial 4 - y', '{"type": "text", "content": "Head south out of the water and climb onto land. There''s a shrine at the end with this prayer."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Prayer - Chapter of Trial 4 - y' AND location_id = 42 AND display_order = 7), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/7_Document_Prayer_Chapter_of_Trial_4_y_1.jpg', 'Document - Prayer - Chapter of Trial 4 - y', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Prayer - Chapter of Trial 4 - y' AND location_id = 42 AND display_order = 7), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/7_Document_Prayer_Chapter_of_Trial_4_y_2.jpg', 'Document - Prayer - Chapter of Trial 4 - y', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 4, 'Memorystick - Rambling of the Ascended', '{"type": "text", "content": "Head east up the slope, and you''ll come across this body on your way out."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Rambling of the Ascended' AND location_id = 42 AND display_order = 8), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/8_Memorystick_Rambling_of_the_Ascended_1.jpg', 'Memorystick - Rambling of the Ascended', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Rambling of the Ascended' AND location_id = 42 AND display_order = 8), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/8_Memorystick_Rambling_of_the_Ascended_2.jpg', 'Memorystick - Rambling of the Ascended', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 4, 'Memorystick - Lament of the Fearful', '{"type": "text", "content": "Carry on up the path until you reach the rope at the end. The corpse is there on the right."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Lament of the Fearful' AND location_id = 42 AND display_order = 9), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/9_Memorystick_Lament_of_the_Fearful_1.jpg', 'Memorystick - Lament of the Fearful', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Lament of the Fearful' AND location_id = 42 AND display_order = 9), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/9_Memorystick_Lament_of_the_Fearful_2.jpg', 'Memorystick - Lament of the Fearful', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 1, 'Legion Camp - Underground Secret Passage', '{"type": "text", "content": "As soon as you come out of the secret passage and go through the gate, the camp is there. When outside, find the nearest fast-travel point and return to Hypertube legion camp (via fast-traveling to the Tetrapod)."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - Underground Secret Passage' AND location_id = 42 AND display_order = 10), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/10_Legion_Camp_Underground_Secret_Passage_1.jpg', 'Legion Camp - Underground Secret Passage', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - Underground Secret Passage' AND location_id = 42 AND display_order = 10), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/10_Legion_Camp_Underground_Secret_Passage_2.jpg', 'Legion Camp - Underground Secret Passage', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 12, 'Robot - Document - Series - Plastic Hearts, Vol. 4', '{"type": "text", "content": "West of the Hypertube legion camp, on the east side of a massive statue, is a robot with this document in."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Document - Series - Plastic Hearts, Vol. 4' AND location_id = 42 AND display_order = 11), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/11_Robot_Document_Series_Plastic_Hearts_Vol_4_1.jpg', 'Robot - Document - Series - Plastic Hearts, Vol. 4', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Document - Series - Plastic Hearts, Vol. 4' AND location_id = 42 AND display_order = 11), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/11_Robot_Document_Series_Plastic_Hearts_Vol_4_2.jpg', 'Robot - Document - Series - Plastic Hearts, Vol. 4', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 13, 'Legion Supply Box', '{"type": "text", "content": "On the west side of the statue, up on some scaffolding."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 42 AND display_order = 12), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/12_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 42 AND display_order = 12), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/12_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 4, 'Memorystick - Echo''s Lament', '{"type": "text", "content": "West of the large statue above, is another statue. There''s a body there, that has a memorystick as part of the \u201cA United People Cannot be Defeated\u201d side quest."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Echo''s Lament' AND location_id = 42 AND display_order = 13), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/13_Memorystick_Echo''s_Lament_1.jpg', 'Memorystick - Echo''s Lament', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Echo''s Lament' AND location_id = 42 AND display_order = 13), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/13_Memorystick_Echo''s_Lament_2.jpg', 'Memorystick - Echo''s Lament', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 5, 'Locked Supply Chest', '{"type": "text", "content": "Behind the statue is a passcode locked chest, that has something to do with the Third Road document (u0ydByKaySSynSyrBy). Passcode is yyyyyy (upside down y''s, as that''s every third character in the cipher)."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 42 AND display_order = 14), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/14_Locked_Supply_Chest_1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 42 AND display_order = 14), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/14_Locked_Supply_Chest_2.jpg', 'Locked Supply Chest', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 42 AND display_order = 14), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/14_Locked_Supply_Chest_3.jpg', 'Locked Supply Chest', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 2, 'Document - Messages - Truth of the Cradle / The Truth Under the City of Xion', '{"type": "text", "content": "As part of the \u201cA United People Cannot be Defeated\u201d side quest, just a bit further north and you''ll have to shoot down some crates with these two documents in them."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Messages - Truth of the Cradle / The Truth Under the City of Xion' AND location_id = 42 AND display_order = 15), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/15_Document_Messages_Truth_of_the_Cradle_and_The_Truth_Under_the_City_of_Xion_1.jpg', 'Document - Messages - Truth of the Cradle / The Truth Under the City of Xion', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Messages - Truth of the Cradle / The Truth Under the City of Xion' AND location_id = 42 AND display_order = 15), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/15_Document_Messages_Truth_of_the_Cradle_and_The_Truth_Under_the_City_of_Xion_2.jpg', 'Document - Messages - Truth of the Cradle / The Truth Under the City of Xion', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 2, 'Document - Journal - I Saw It', '{"type": "text", "content": "Northwest of the Hypertube Legion Camp is a pod. Next to it is a document. As part of \u201cLet There Be Light Again\u201d side quest."}', 16);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - I Saw It' AND location_id = 42 AND display_order = 16), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/16_Document_Journal_I_Saw_It_1.jpg', 'Document - Journal - I Saw It', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - I Saw It' AND location_id = 42 AND display_order = 16), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/16_Document_Journal_I_Saw_It_2.jpg', 'Document - Journal - I Saw It', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 1, 'Supply Camp - Great Desert Outskirts', '{"type": "text", "content": "North-northwest from the Hypertube Legion Camp is this Supply Camp. Just to the south of the large ship."}', 17);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Great Desert Outskirts' AND location_id = 42 AND display_order = 17), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/17_Supply_Camp_Great_Desert_Outskirts_1.jpg', 'Supply Camp - Great Desert Outskirts', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Great Desert Outskirts' AND location_id = 42 AND display_order = 17), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/17_Supply_Camp_Great_Desert_Outskirts_2.jpg', 'Supply Camp - Great Desert Outskirts', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 4, 'Memorystick - Citizen 779''s Consolation', '{"type": "text", "content": "Just to the northwest of the camp, by the rocks."}', 18);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Citizen 779''s Consolation' AND location_id = 42 AND display_order = 18), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/18_Memorystick_Citizen_779''s_Consolation_1.jpg', 'Memorystick - Citizen 779''s Consolation', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Citizen 779''s Consolation' AND location_id = 42 AND display_order = 18), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/18_Memorystick_Citizen_779''s_Consolation_2.jpg', 'Memorystick - Citizen 779''s Consolation', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 4, 'Memorystick - We Must Find Them', '{"type": "text", "content": "East of the Great Desert Outskirts Supply Camp is a medium-sized statue with pillars sticking out the ground. The two corpses by the central statue have memorysticks on them."}', 19);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - We Must Find Them' AND location_id = 42 AND display_order = 19), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/19_Memorystick_We_Must_Find_Them_1.jpg', 'Memorystick - We Must Find Them', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - We Must Find Them' AND location_id = 42 AND display_order = 19), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/19_Memorystick_We_Must_Find_Them_2.jpg', 'Memorystick - We Must Find Them', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 4, 'Memorystick - Believer''s Screams', '{"type": "text", "content": "On the other side of the statue."}', 20);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Believer''s Screams' AND location_id = 42 AND display_order = 20), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/20_Memorystick_Believer''s_Screams_1.jpg', 'Memorystick - Believer''s Screams', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Believer''s Screams' AND location_id = 42 AND display_order = 20), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/20_Memorystick_Believer''s_Screams_2.jpg', 'Memorystick - Believer''s Screams', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 4, 'Memorystick - Scavenger 103''s Memory', '{"type": "text", "content": "North of the ship, by a tree, pretty much out of the map, you''ll find a body with this memorystick."}', 21);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Scavenger 103''s Memory' AND location_id = 42 AND display_order = 21), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/21_Memorystick_Scavenger_103''s_Memory_1.jpg', 'Memorystick - Scavenger 103''s Memory', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Scavenger 103''s Memory' AND location_id = 42 AND display_order = 21), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/21_Memorystick_Scavenger_103''s_Memory_2.jpg', 'Memorystick - Scavenger 103''s Memory', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 3, 'Can - Cryo Cafe Mocha', '{"type": "text", "content": "East-northeast of the Great Desert Outskirts Supply is an Ice Camp cooler. Interact with it, shoot the 3 targets, and then pick up the can."}', 22);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo Cafe Mocha' AND location_id = 42 AND display_order = 22), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/22_Can_Cryo_Cafe_Mocha_1.jpg', 'Can - Cryo Cafe Mocha', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo Cafe Mocha' AND location_id = 42 AND display_order = 22), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/22_Can_Cryo_Cafe_Mocha_2.jpg', 'Can - Cryo Cafe Mocha', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo Cafe Mocha' AND location_id = 42 AND display_order = 22), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/22_Can_Cryo_Cafe_Mocha_3.jpg', 'Can - Cryo Cafe Mocha', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo Cafe Mocha' AND location_id = 42 AND display_order = 22), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/22_Can_Cryo_Cafe_Mocha_4.jpg', 'Can - Cryo Cafe Mocha', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 12, 'Robot - Drone Upgrade Module', '{"type": "text", "content": "East-southeast from the ship is a large statue. There''s a robot next to it."}', 23);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Drone Upgrade Module' AND location_id = 42 AND display_order = 23), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/23_Robot_Drone_Upgrade_Module_1.jpg', 'Robot - Drone Upgrade Module', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Drone Upgrade Module' AND location_id = 42 AND display_order = 23), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/23_Robot_Drone_Upgrade_Module_2.jpg', 'Robot - Drone Upgrade Module', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 4, 'Memorystick - Scavenger 173''s Lament', '{"type": "text", "content": "East-northeast from the robot are some ruins. Next to the yellow box is a human body with this memorystick."}', 24);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Scavenger 173''s Lament' AND location_id = 42 AND display_order = 24), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/24_Memorystick_Scavenger_173''s_Lament_1.jpg', 'Memorystick - Scavenger 173''s Lament', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Scavenger 173''s Lament' AND location_id = 42 AND display_order = 24), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/24_Memorystick_Scavenger_173''s_Lament_2.jpg', 'Memorystick - Scavenger 173''s Lament', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 15, 'Nano Suit - Daily Sailor', '{"type": "text", "content": "Free the yellow box by exploding the barrels, then use it to climb up the north wall, before heading out the back and scaling around the outside of the building to get to the top. When up there use the poles to get across to the Nano Suit crate."}', 25);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Daily Sailor' AND location_id = 42 AND display_order = 25), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/25_Nano_Suit_Daily_Sailor_1.jpg', 'Nano Suit - Daily Sailor', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Daily Sailor' AND location_id = 42 AND display_order = 25), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/25_Nano_Suit_Daily_Sailor_2.jpg', 'Nano Suit - Daily Sailor', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Daily Sailor' AND location_id = 42 AND display_order = 25), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/25_Nano_Suit_Daily_Sailor_3.jpg', 'Nano Suit - Daily Sailor', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Daily Sailor' AND location_id = 42 AND display_order = 25), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/25_Nano_Suit_Daily_Sailor_4.jpg', 'Nano Suit - Daily Sailor', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 1, 'Supply Camp - Twin Rocks', '{"type": "text", "content": "East of the building where the last two collectibles were."}', 26);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Twin Rocks' AND location_id = 42 AND display_order = 26), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/26_Supply_Camp_Twin_Rocks_1.jpg', 'Supply Camp - Twin Rocks', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Twin Rocks' AND location_id = 42 AND display_order = 26), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/26_Supply_Camp_Twin_Rocks_2.jpg', 'Supply Camp - Twin Rocks', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 2, 'Document - Promotions - Ark-Tech Pioneers Developing the Green Land!', '{"type": "text", "content": "ast of the Supply Camp, midway up the remains of a building - use the rocks around the edge to get up to this level."}', 27);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions - Ark-Tech Pioneers Developing the Green Land!' AND location_id = 42 AND display_order = 27), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/27_Document_Promotions_Ark_Tech_Pioneers_Developing_the_Green_Land_1.jpg', 'Document - Promotions - Ark-Tech Pioneers Developing the Green Land!', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions - Ark-Tech Pioneers Developing the Green Land!' AND location_id = 42 AND display_order = 27), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/27_Document_Promotions_Ark_Tech_Pioneers_Developing_the_Green_Land_2.jpg', 'Document - Promotions - Ark-Tech Pioneers Developing the Green Land!', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions - Ark-Tech Pioneers Developing the Green Land!' AND location_id = 42 AND display_order = 27), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/27_Document_Promotions_Ark_Tech_Pioneers_Developing_the_Green_Land_3.jpg', 'Document - Promotions - Ark-Tech Pioneers Developing the Green Land!', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions - Ark-Tech Pioneers Developing the Green Land!' AND location_id = 42 AND display_order = 27), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/27_Document_Promotions_Ark_Tech_Pioneers_Developing_the_Green_Land_4.jpg', 'Document - Promotions - Ark-Tech Pioneers Developing the Green Land!', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 5, 'Locked Supply Chest', '{"type": "text", "content": "Up top in the same building is this locked supply chest. Beat the mini-game to gain access."}', 28);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 42 AND display_order = 28), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/28_Locked_Supply_Chest_1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 42 AND display_order = 28), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/28_Locked_Supply_Chest_2.jpg', 'Locked Supply Chest', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 42 AND display_order = 28), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/28_Locked_Supply_Chest_3.jpg', 'Locked Supply Chest', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 1, 'Supply Camp - Abyss Levoire Entrance', '{"type": "text", "content": "Just  to the west of the Abyss Levoire."}', 29);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Abyss Levoire Entrance' AND location_id = 42 AND display_order = 29), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/29_Supply_Camp_Abyss_Levoire_Entrance_1.jpg', 'Supply Camp - Abyss Levoire Entrance', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Abyss Levoire Entrance' AND location_id = 42 AND display_order = 29), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/29_Supply_Camp_Abyss_Levoire_Entrance_2.jpg', 'Supply Camp - Abyss Levoire Entrance', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 4, 'Memorystick - Sentinel 95''s Regret', '{"type": "text", "content": "Northeast of the Abyss Levoire (up the hill, near some crates and barrels)."}', 30);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 95''s Regret' AND location_id = 42 AND display_order = 30), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/30_Memorystick_Sentinel_95''s_Regret_1.jpg', 'Memorystick - Sentinel 95''s Regret', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 95''s Regret' AND location_id = 42 AND display_order = 30), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/30_Memorystick_Sentinel_95''s_Regret_2.jpg', 'Memorystick - Sentinel 95''s Regret', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 2, 'Document - Prayer - Chapter of Trial 2 - 0', '{"type": "text", "content": "East of the previous memorysticks are a load of dilapidated buildings. This is one floor up in one of the western ones."}', 31);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Prayer - Chapter of Trial 2 - 0' AND location_id = 42 AND display_order = 31), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/31_Document_Prayer_Chapter_of_Trial_2_0_1.jpg', 'Document - Prayer - Chapter of Trial 2 - 0', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Prayer - Chapter of Trial 2 - 0' AND location_id = 42 AND display_order = 31), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/31_Document_Prayer_Chapter_of_Trial_2_0_2.jpg', 'Document - Prayer - Chapter of Trial 2 - 0', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 4, 'Memorystick - Sentinel 71''s Resignation', '{"type": "text", "content": "East of the previous one, inside another set of ruinous buildings. In the centre of this small collection of buildings."}', 32);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 71''s Resignation' AND location_id = 42 AND display_order = 32), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/32_Memorystick_Sentinel_71''s_Resignation_1.jpg', 'Memorystick - Sentinel 71''s Resignation', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 71''s Resignation' AND location_id = 42 AND display_order = 32), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/32_Memorystick_Sentinel_71''s_Resignation_2.jpg', 'Memorystick - Sentinel 71''s Resignation', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 4, 'Memorystick - Naomi''s Testament', '{"type": "text", "content": "The northeastern most building, just at the base of it, outside."}', 33);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Naomi''s Testament' AND location_id = 42 AND display_order = 33), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/33_Memorystick_Naomi''s_Testament_1.jpg', 'Memorystick - Naomi''s Testament', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Naomi''s Testament' AND location_id = 42 AND display_order = 33), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/33_Memorystick_Naomi''s_Testament_2.jpg', 'Memorystick - Naomi''s Testament', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 3, 'Can - Liquid Fire', '{"type": "text", "content": "South of the aforementioned memorystick, on the roof, is an Ice Camp cooler. Interact with it and shoot the explosive barrels before they hit you to unlock this one. Make sure you have plenty of ammo!"}', 34);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Liquid Fire' AND location_id = 42 AND display_order = 34), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/34_Can_Liquid_Fire_1.jpg', 'Can - Liquid Fire', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Liquid Fire' AND location_id = 42 AND display_order = 34), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/34_Can_Liquid_Fire_2.jpg', 'Can - Liquid Fire', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Liquid Fire' AND location_id = 42 AND display_order = 34), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/34_Can_Liquid_Fire_3.jpg', 'Can - Liquid Fire', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Liquid Fire' AND location_id = 42 AND display_order = 34), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/34_Can_Liquid_Fire_4.jpg', 'Can - Liquid Fire', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 12, 'Robot - Passcode - yBLLda', '{"type": "text", "content": "Just to the north of the Buried Ruins Outskirt Supply Camp is a robot. Kill it for this passcode."}', 35);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Passcode - yBLLda' AND location_id = 42 AND display_order = 35), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/35_Robot_Passcode_yBLLda_1.jpg', 'Robot - Passcode - yBLLda', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Passcode - yBLLda' AND location_id = 42 AND display_order = 35), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/35_Robot_Passcode_yBLLda_2.jpg', 'Robot - Passcode - yBLLda', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (42, 5, 'Locked Supply Chest', '{"type": "text", "content": "North of the aforementioned Supply Camp. Shoot the target to the north to drop a rope. Then head northeast to the crates at the end. You then want to swing from rope to rope, until you get dropped onto the chest. The passcode is yBLLda."}', 36);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 42 AND display_order = 36), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/36_Locked_Supply_Chest_1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 42 AND display_order = 36), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/36_Locked_Supply_Chest_2.jpg', 'Locked Supply Chest', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 42 AND display_order = 36), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/36_Locked_Supply_Chest_3.jpg', 'Locked Supply Chest', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 42 AND display_order = 36), 
        '/assets/images/Great_Desert/5_Northern_Great_Desert/36_Locked_Supply_Chest_4.jpg', 'Locked Supply Chest', 4);

-- Great Desert - Oasis

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (43, 1, 'Supply Camp - Oasis', '{"type": "text", "content": "On the northern shore of the Oasis pond."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Oasis' AND location_id = 43 AND display_order = 1), 
        '/assets/images/Great_Desert/6_Oasis/1_Supply_Camp_Oasis_1.jpg', 'Supply Camp - Oasis', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Oasis' AND location_id = 43 AND display_order = 1), 
        '/assets/images/Great_Desert/6_Oasis/1_Supply_Camp_Oasis_2.jpg', 'Supply Camp - Oasis', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (43, 15, 'Nano Suit - Cybernetic Bondage', '{"type": "text", "content": "Just west of the Oasis Supply Camp, underwater, is a locked supply crate Contains the Cybernetic Bondage Nano Suit Design Pattern. Passcode to get in is: yyyya0"}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Cybernetic Bondage' AND location_id = 43 AND display_order = 2), 
        '/assets/images/Great_Desert/6_Oasis/2_Nano_Suit_Cybernetic_Bondage_1.jpg', 'Nano Suit - Cybernetic Bondage', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Cybernetic Bondage' AND location_id = 43 AND display_order = 2), 
        '/assets/images/Great_Desert/6_Oasis/2_Nano_Suit_Cybernetic_Bondage_2.jpg', 'Nano Suit - Cybernetic Bondage', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (43, 4, 'Memorystick - Sentinel 55''s Decision', '{"type": "text", "content": "Northwest of the Oasis Supply Camp, next to some boxes on the ridge of a hill."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 55''s Decision' AND location_id = 43 AND display_order = 3), 
        '/assets/images/Great_Desert/6_Oasis/3_Memorystick_Sentinel_55''s_Decision_1.jpg', 'Memorystick - Sentinel 55''s Decision', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 55''s Decision' AND location_id = 43 AND display_order = 3), 
        '/assets/images/Great_Desert/6_Oasis/3_Memorystick_Sentinel_55''s_Decision_2.jpg', 'Memorystick - Sentinel 55''s Decision', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (43, 4, 'Memorystick - Harry''s Recollection', '{"type": "text", "content": "In the southwest corner of the Oasis."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Harry''s Recollection' AND location_id = 43 AND display_order = 4), 
        '/assets/images/Great_Desert/6_Oasis/4_Memorystick_Harry''s_Recollection_1.jpg', 'Memorystick - Harry''s Recollection', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Harry''s Recollection' AND location_id = 43 AND display_order = 4), 
        '/assets/images/Great_Desert/6_Oasis/4_Memorystick_Harry''s_Recollection_2.jpg', 'Memorystick - Harry''s Recollection', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (43, 3, 'Can - Nectar Grape', '{"type": "text", "content": "South of the Oasis, near a platform with a cable running to it, is a Fiz machine with this can in."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Nectar Grape' AND location_id = 43 AND display_order = 5), 
        '/assets/images/Great_Desert/6_Oasis/5_Can_Nectar_Grape_1.jpg', 'Can - Nectar Grape', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Nectar Grape' AND location_id = 43 AND display_order = 5), 
        '/assets/images/Great_Desert/6_Oasis/5_Can_Nectar_Grape_2.jpg', 'Can - Nectar Grape', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Nectar Grape' AND location_id = 43 AND display_order = 5), 
        '/assets/images/Great_Desert/6_Oasis/5_Can_Nectar_Grape_3.jpg', 'Can - Nectar Grape', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (43, 13, 'Legion Supply Box', '{"type": "text", "content": "Just slightly south of the aforementioned can."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 43 AND display_order = 6), 
        '/assets/images/Great_Desert/6_Oasis/6_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 43 AND display_order = 6), 
        '/assets/images/Great_Desert/6_Oasis/6_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (43, 13, 'Legion Supply Box', '{"type": "text", "content": "Southwest corner of the Oasis (on the southwest side of the outer wall)."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 43 AND display_order = 7), 
        '/assets/images/Great_Desert/6_Oasis/7_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 43 AND display_order = 7), 
        '/assets/images/Great_Desert/6_Oasis/7_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (43, 4, 'Memorystick - I Felt It', '{"type": "text", "content": "Northeast of the Oasis, on top of the Hypertube. Part of the \u201cLet There Be Light Again\u201d side quest."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - I Felt It' AND location_id = 43 AND display_order = 8), 
        '/assets/images/Great_Desert/6_Oasis/8_Memorystick_I_Felt_It_1.jpg', 'Memorystick - I Felt It', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - I Felt It' AND location_id = 43 AND display_order = 8), 
        '/assets/images/Great_Desert/6_Oasis/8_Memorystick_I_Felt_It_2.jpg', 'Memorystick - I Felt It', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (43, 2, 'Document - Journal - Damaged Legacy', '{"type": "text", "content": "This is dropped by the same person you got the previous memorystick off."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - Damaged Legacy' AND location_id = 43 AND display_order = 9), 
        '/assets/images/Great_Desert/6_Oasis/9_Document_Journals_Damaged_Legacy_1.jpg', 'Document - Journal - Damaged Legacy', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - Damaged Legacy' AND location_id = 43 AND display_order = 9), 
        '/assets/images/Great_Desert/6_Oasis/9_Document_Journals_Damaged_Legacy_2.jpg', 'Document - Journal - Damaged Legacy', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (43, 3, 'Can - The Haven Early Grey', '{"type": "text", "content": "Follow the Hypertube all the way east and you''ll find the cooler at the end."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Haven Early Grey' AND location_id = 43 AND display_order = 10), 
        '/assets/images/Great_Desert/6_Oasis/10_Can_The_Haven_Early_Grey_1.jpg', 'Can - The Haven Early Grey', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Haven Early Grey' AND location_id = 43 AND display_order = 10), 
        '/assets/images/Great_Desert/6_Oasis/10_Can_The_Haven_Early_Grey_2.jpg', 'Can - The Haven Early Grey', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Haven Early Grey' AND location_id = 43 AND display_order = 10), 
        '/assets/images/Great_Desert/6_Oasis/10_Can_The_Haven_Early_Grey_3.jpg', 'Can - The Haven Early Grey', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (43, 4, 'Memorystick - Sentinel 46''s Memory', '{"type": "text", "content": "East of the Oasis, before the Buried Ruins, next to a sign sticking out of the sand."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 46''s Memory' AND location_id = 43 AND display_order = 11), 
        '/assets/images/Great_Desert/6_Oasis/11_Memorystick_Sentinel_46''s_Memory_1.jpg', 'Memorystick - Sentinel 46''s Memory', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 46''s Memory' AND location_id = 43 AND display_order = 11), 
        '/assets/images/Great_Desert/6_Oasis/11_Memorystick_Sentinel_46''s_Memory_2.jpg', 'Memorystick - Sentinel 46''s Memory', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (43, 3, 'Can - Cryo the Malt', '{"type": "text", "content": "Just northeast of West of Buried Ruins Legion Camp is a mini-game of sorts. Firstly, you need to shoot a floating target to drop a rope. Second, you need to climb up and power the generator. Thirdly, you need to race to the second and third before the time expires. Do that, and you''ll open the garage door below where you end up, which has a can inside."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo the Malt' AND location_id = 43 AND display_order = 12), 
        '/assets/images/Great_Desert/6_Oasis/12_Can_Cryo_the_Malt_1.jpg', 'Can - Cryo the Malt', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo the Malt' AND location_id = 43 AND display_order = 12), 
        '/assets/images/Great_Desert/6_Oasis/12_Can_Cryo_the_Malt_2.jpg', 'Can - Cryo the Malt', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo the Malt' AND location_id = 43 AND display_order = 12), 
        '/assets/images/Great_Desert/6_Oasis/12_Can_Cryo_the_Malt_3.jpg', 'Can - Cryo the Malt', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo the Malt' AND location_id = 43 AND display_order = 12), 
        '/assets/images/Great_Desert/6_Oasis/12_Can_Cryo_the_Malt_4.jpg', 'Can - Cryo the Malt', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo the Malt' AND location_id = 43 AND display_order = 12), 
        '/assets/images/Great_Desert/6_Oasis/12_Can_Cryo_the_Malt_5.jpg', 'Can - Cryo the Malt', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo the Malt' AND location_id = 43 AND display_order = 12), 
        '/assets/images/Great_Desert/6_Oasis/12_Can_Cryo_the_Malt_6.jpg', 'Can - Cryo the Malt', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo the Malt' AND location_id = 43 AND display_order = 12), 
        '/assets/images/Great_Desert/6_Oasis/12_Can_Cryo_the_Malt_7.jpg', 'Can - Cryo the Malt', 7);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (43, 4, 'Memorystick - Luthor''s Revelation', '{"type": "text", "content": "On the rooftop where you hit the final switch for the previous can mini-game."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Luthor''s Revelation' AND location_id = 43 AND display_order = 13), 
        '/assets/images/Great_Desert/6_Oasis/13_Memorystick_Luthor''s_Revelation_1.jpg', 'Memorystick - Luthor''s Revelation', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Luthor''s Revelation' AND location_id = 43 AND display_order = 13), 
        '/assets/images/Great_Desert/6_Oasis/13_Memorystick_Luthor''s_Revelation_2.jpg', 'Memorystick - Luthor''s Revelation', 2);

-- Great Desert - Solar Tower

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 1, 'Supply Camp - Great Desert', '{"type": "text", "content": "As soon as you land in the Great Desert, this camp is right next to the Tetrapod."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Great Desert' AND location_id = 38 AND display_order = 1), 
        '/assets/images/Great_Desert/1_Solar_Tower/1_Supply_Camp_Great_Desert_1.jpg', 'Supply Camp - Great Desert', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Great Desert' AND location_id = 38 AND display_order = 1), 
        '/assets/images/Great_Desert/1_Solar_Tower/1_Supply_Camp_Great_Desert_2.jpg', 'Supply Camp - Great Desert', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 1, 'Supply Camp - Central Great Desert', '{"type": "text", "content": "South from the small rocky hill where you begin the \u201cReboot!!!\u201d side quest. Move the yellow box around until you can jump up to the ledge. The supply camp is there."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Central Great Desert' AND location_id = 38 AND display_order = 2), 
        '/assets/images/Great_Desert/1_Solar_Tower/2_Supply_Camp_Central_Great_Desert_1.jpg', 'Supply Camp - Central Great Desert', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Central Great Desert' AND location_id = 38 AND display_order = 2), 
        '/assets/images/Great_Desert/1_Solar_Tower/2_Supply_Camp_Central_Great_Desert_2.jpg', 'Supply Camp - Central Great Desert', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 5, 'Locked Supply Chest', '{"type": "text", "content": "Look up to the East while standing up on the supply camp ledge. You will see a small target hovering in the air, shoot it and a rope will drop out of it. Jump and swing across to the other side to find the chest."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 38 AND display_order = 3), 
        '/assets/images/Great_Desert/1_Solar_Tower/3_Locked_Supply_Chest_1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 38 AND display_order = 3), 
        '/assets/images/Great_Desert/1_Solar_Tower/3_Locked_Supply_Chest_2.jpg', 'Locked Supply Chest', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 38 AND display_order = 3), 
        '/assets/images/Great_Desert/1_Solar_Tower/3_Locked_Supply_Chest_3.jpg', 'Locked Supply Chest', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 17, 'Body Core', '{"type": "text", "content": "Back on the supply camp ledge, look to the South and you will see some ledges you can jump to. Jump across to the ledge and continue around to find the Body Core."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 38 AND display_order = 4), 
        '/assets/images/Great_Desert/1_Solar_Tower/4_Body_Core_1.jpg', 'Body Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 38 AND display_order = 4), 
        '/assets/images/Great_Desert/1_Solar_Tower/4_Body_Core_2.jpg', 'Body Core', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 38 AND display_order = 4), 
        '/assets/images/Great_Desert/1_Solar_Tower/4_Body_Core_3.jpg', 'Body Core', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 13, 'Legion Supply Box', '{"type": "text", "content": "On the ground level directly beneath the previous Body Core."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 38 AND display_order = 5), 
        '/assets/images/Great_Desert/1_Solar_Tower/5_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 38 AND display_order = 5), 
        '/assets/images/Great_Desert/1_Solar_Tower/5_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 13, 'Legion Supply Box', '{"type": "text", "content": "Southwest of the previous supply box, in the middle of the desert."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 38 AND display_order = 6), 
        '/assets/images/Great_Desert/1_Solar_Tower/6_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 38 AND display_order = 6), 
        '/assets/images/Great_Desert/1_Solar_Tower/6_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 13, 'Legion Supply Box', '{"type": "text", "content": "South of the previous supply box, on the scaffolding behind a sign."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 38 AND display_order = 7), 
        '/assets/images/Great_Desert/1_Solar_Tower/7_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 38 AND display_order = 7), 
        '/assets/images/Great_Desert/1_Solar_Tower/7_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 12, 'Robot - Passcode', '{"type": "text", "content": "East of the previous collectible, behind a fence that can be entered by breaking the boxes."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Passcode' AND location_id = 38 AND display_order = 8), 
        '/assets/images/Great_Desert/1_Solar_Tower/8_Robot_Passcode_unSEE3r_1.jpg', 'Robot - Passcode', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Passcode' AND location_id = 38 AND display_order = 8), 
        '/assets/images/Great_Desert/1_Solar_Tower/8_Robot_Passcode_unSEE3r_2.jpg', 'Robot - Passcode', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 4, 'Memorystick - Lament of the Isolated', '{"type": "text", "content": "Next to the aforementioned robot."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Lament of the Isolated' AND location_id = 38 AND display_order = 9), 
        '/assets/images/Great_Desert/1_Solar_Tower/9_Memorystick_Lament_of_the_Isolated_1.jpg', 'Memorystick - Lament of the Isolated', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Lament of the Isolated' AND location_id = 38 AND display_order = 9), 
        '/assets/images/Great_Desert/1_Solar_Tower/9_Memorystick_Lament_of_the_Isolated_2.jpg', 'Memorystick - Lament of the Isolated', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 13, 'Legion Supply Box', '{"type": "text", "content": "On the roof of the building. Use the ledges to climb up."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 38 AND display_order = 10), 
        '/assets/images/Great_Desert/1_Solar_Tower/10_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 38 AND display_order = 10), 
        '/assets/images/Great_Desert/1_Solar_Tower/10_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 38 AND display_order = 10), 
        '/assets/images/Great_Desert/1_Solar_Tower/10_Legion_Supply_Box_3.jpg', 'Legion Supply Box', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 4, 'Memorystick - Failed Sentinel''s Lament', '{"type": "text", "content": "Also on the same roof, near the previous bupply Box."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Failed Sentinel''s Lament' AND location_id = 38 AND display_order = 11), 
        '/assets/images/Great_Desert/1_Solar_Tower/11_Memorystick_Failed_Sentinel''s_Lament_1.jpg', 'Memorystick - Failed Sentinel''s Lament', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Failed Sentinel''s Lament' AND location_id = 38 AND display_order = 11), 
        '/assets/images/Great_Desert/1_Solar_Tower/11_Memorystick_Failed_Sentinel''s_Lament_2.jpg', 'Memorystick - Failed Sentinel''s Lament', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 4, 'Memorystick - Citizen 218''s Memory', '{"type": "text", "content": "Southeast from the ruined building, underneath the overpass, between a car and a bus."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Citizen 218''s Memory' AND location_id = 38 AND display_order = 12), 
        '/assets/images/Great_Desert/1_Solar_Tower/12_Memorystick_Citizen_218''s_Memory_1.jpg', 'Memorystick - Citizen 218''s Memory', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Citizen 218''s Memory' AND location_id = 38 AND display_order = 12), 
        '/assets/images/Great_Desert/1_Solar_Tower/12_Memorystick_Citizen_218''s_Memory_2.jpg', 'Memorystick - Citizen 218''s Memory', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 1, 'Supply Camp - Abandoned Overpass', '{"type": "text", "content": "North-northwest of the Solar Tower, up on the overpass, above the previous collectible."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Abandoned Overpass' AND location_id = 38 AND display_order = 13), 
        '/assets/images/Great_Desert/1_Solar_Tower/13_Supply_Camp_Abandoned_Overpass_1.jpg', 'Supply Camp - Abandoned Overpass', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Abandoned Overpass' AND location_id = 38 AND display_order = 13), 
        '/assets/images/Great_Desert/1_Solar_Tower/13_Supply_Camp_Abandoned_Overpass_2.jpg', 'Supply Camp - Abandoned Overpass', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 2, 'Document - Series - Notes on EVE Protocol 4', '{"type": "text", "content": "West of the supply camp, by some rubble."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series - Notes on EVE Protocol 4' AND location_id = 38 AND display_order = 14), 
        '/assets/images/Great_Desert/1_Solar_Tower/14_Document_Series_Notes_on_EVE_Protocol_4_1.jpg', 'Document - Series - Notes on EVE Protocol 4', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series - Notes on EVE Protocol 4' AND location_id = 38 AND display_order = 14), 
        '/assets/images/Great_Desert/1_Solar_Tower/14_Document_Series_Notes_on_EVE_Protocol_4_2.jpg', 'Document - Series - Notes on EVE Protocol 4', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 4, 'Memorystick - Sentinel 58''s Advice', '{"type": "text", "content": "To the left of the previous collectible, by the same pile of rubble."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 58''s Advice' AND location_id = 38 AND display_order = 15), 
        '/assets/images/Great_Desert/1_Solar_Tower/15_Memorystick_Sentinel_58''s_Advice_1.jpg', 'Memorystick - Sentinel 58''s Advice', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Sentinel 58''s Advice' AND location_id = 38 AND display_order = 15), 
        '/assets/images/Great_Desert/1_Solar_Tower/15_Memorystick_Sentinel_58''s_Advice_2.jpg', 'Memorystick - Sentinel 58''s Advice', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 4, 'Memorystick - Whiiir Whiiir', '{"type": "text", "content": "Follow the overpass west until you see a red car by the edge. The sentinel is leaning against the western side of the car."}', 16);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Whiiir Whiiir' AND location_id = 38 AND display_order = 16), 
        '/assets/images/Great_Desert/1_Solar_Tower/16_Memorystick_Whiiir_Whiiir_1.jpg', 'Memorystick - Whiiir Whiiir', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Whiiir Whiiir' AND location_id = 38 AND display_order = 16), 
        '/assets/images/Great_Desert/1_Solar_Tower/16_Memorystick_Whiiir_Whiiir_2.jpg', 'Memorystick - Whiiir Whiiir', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 20, 'Exospine - Recovery-Type', '{"type": "text", "content": "Just slightly north of the previous memorystick. On the metal walkway of the overpass."}', 17);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Recovery-Type' AND location_id = 38 AND display_order = 17), 
        '/assets/images/Great_Desert/1_Solar_Tower/17_Exospine_Recovery_Type_1.jpg', 'Exospine - Recovery-Type', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Recovery-Type' AND location_id = 38 AND display_order = 17), 
        '/assets/images/Great_Desert/1_Solar_Tower/17_Exospine_Recovery_Type_2.jpg', 'Exospine - Recovery-Type', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 1, 'Supply Camp - Way to the Solar Tower', '{"type": "text", "content": "Directly to the east of the Abandoned Overpass supply camp."}', 18);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Way to the Solar Tower' AND location_id = 38 AND display_order = 18), 
        '/assets/images/Great_Desert/1_Solar_Tower/18_Supply_Camp_Way_to_the_Solar_Tower_1.jpg', 'Supply Camp - Way to the Solar Tower', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Way to the Solar Tower' AND location_id = 38 AND display_order = 18), 
        '/assets/images/Great_Desert/1_Solar_Tower/18_Supply_Camp_Way_to_the_Solar_Tower_2.jpg', 'Supply Camp - Way to the Solar Tower', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 4, 'Memorystick - Teddy''s Memory / Passcode', '{"type": "text", "content": "To the south-southeast of the Solar Tower, in the corner of the fenced off area, by a floodlight. The passcode is: naEdrr, and it opens Teddy''s Locker in Xion."}', 19);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Teddy''s Memory / Passcode' AND location_id = 38 AND display_order = 19), 
        '/assets/images/Great_Desert/1_Solar_Tower/19_Memorystick_Teddy''s_Memory_&_Passcode_1.jpg', 'Memorystick - Teddy''s Memory', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Teddy''s Memory / Passcode' AND location_id = 38 AND display_order = 19), 
        '/assets/images/Great_Desert/1_Solar_Tower/19_Memorystick_Teddy''s_Memory_&_Passcode_2.jpg', 'Memorystick - Teddy''s Memory', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 5, 'Locked Supply Chest', '{"type": "text", "content": "About halfway up the solar tower."}', 20);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 38 AND display_order = 20), 
        '/assets/images/Great_Desert/1_Solar_Tower/20_Locked_Supply_Chest_1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 38 AND display_order = 20), 
        '/assets/images/Great_Desert/1_Solar_Tower/20_Locked_Supply_Chest_2.jpg', 'Locked Supply Chest', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 23, 'Lily Outfit - Off-Duty', '{"type": "text", "content": "Around the other side of the solar tower."}', 21);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Lily Outfit - Off-Duty' AND location_id = 38 AND display_order = 21), 
        '/assets/images/Great_Desert/1_Solar_Tower/21_Lily_Outfit_Off-Duty_1.jpg', 'Lily Outfit - Off-Duty', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Lily Outfit - Off-Duty' AND location_id = 38 AND display_order = 21), 
        '/assets/images/Great_Desert/1_Solar_Tower/21_Lily_Outfit_Off-Duty_2.jpg', 'Lily Outfit - Off-Duty', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 13, 'Legion Supply Box', '{"type": "text", "content": "Northwest of the solar tower, up on the cliffs overlooking the area. Contains an Omnibolt and Training Gear."}', 22);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 38 AND display_order = 22), 
        '/assets/images/Great_Desert/1_Solar_Tower/22_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 38 AND display_order = 22), 
        '/assets/images/Great_Desert/1_Solar_Tower/22_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 5, 'Locked Supply Chest', '{"type": "text", "content": "Follow the cliffs to the west until you come across a crate to open. Make sure you have some ammo with you."}', 23);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 38 AND display_order = 23), 
        '/assets/images/Great_Desert/1_Solar_Tower/23_Locked_Supply_Chest_1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 38 AND display_order = 23), 
        '/assets/images/Great_Desert/1_Solar_Tower/23_Locked_Supply_Chest_2.jpg', 'Locked Supply Chest', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 2, 'Document - Log Data - S2RV1C2-875687''s Data', '{"type": "text", "content": "East from the previous supply chest in the ruined city area."}', 24);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Log Data - S2RV1C2-875687''s Data' AND location_id = 38 AND display_order = 24), 
        '/assets/images/Great_Desert/1_Solar_Tower/24_Document_Log_Data_S2RV1C2_875687''s_Data_1.jpg', 'Document - Log Data - S2RV1C2-875687''s Data', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Log Data - S2RV1C2-875687''s Data' AND location_id = 38 AND display_order = 24), 
        '/assets/images/Great_Desert/1_Solar_Tower/24_Document_Log_Data_S2RV1C2_875687''s_Data_2.jpg', 'Document - Log Data - S2RV1C2-875687''s Data', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 1, 'Legion Camp - South of Buried Ruins', '{"type": "text", "content": "Northeast of the Solar Tower, in an enclosed area in the ruins (if you''re coming from the above document, then destroy the barrel in the southern wall to get access to this area)."}', 25);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - South of Buried Ruins' AND location_id = 38 AND display_order = 25), 
        '/assets/images/Great_Desert/1_Solar_Tower/25_Legion_Camp_South_of_Buried_Ruins_1.jpg', 'Legion Camp - South of Buried Ruins', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp - South of Buried Ruins' AND location_id = 38 AND display_order = 25), 
        '/assets/images/Great_Desert/1_Solar_Tower/25_Legion_Camp_South_of_Buried_Ruins_2.jpg', 'Legion Camp - South of Buried Ruins', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 2, 'Document - Series - The Truth, Article 4', '{"type": "text", "content": "Just slightly north of the South of Buried Ruins Legion Camp."}', 26);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series - The Truth, Article 4' AND location_id = 38 AND display_order = 26), 
        '/assets/images/Great_Desert/1_Solar_Tower/26_Document_Series_The_Truth_Article_4_1.jpg', 'Document - Series - The Truth, Article 4', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series - The Truth, Article 4' AND location_id = 38 AND display_order = 26), 
        '/assets/images/Great_Desert/1_Solar_Tower/26_Document_Series_The_Truth_Article_4_2.jpg', 'Document - Series - The Truth, Article 4', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 2, 'Document - Prayer - Chapter of Trial 3 - a', '{"type": "text", "content": "Head east out the gate and then head into the building to the north. This collectible is there, in a box on the shrine."}', 27);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Prayer - Chapter of Trial 3 - a' AND location_id = 38 AND display_order = 27), 
        '/assets/images/Great_Desert/1_Solar_Tower/27_Document_Prayer_Chapter_of_Trial_3_a_1.jpg', 'Document - Prayer - Chapter of Trial 3 - a', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Prayer - Chapter of Trial 3 - a' AND location_id = 38 AND display_order = 27), 
        '/assets/images/Great_Desert/1_Solar_Tower/27_Document_Prayer_Chapter_of_Trial_3_a_2.jpg', 'Document - Prayer - Chapter of Trial 3 - a', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 5, 'Locked Supply Chest', '{"type": "text", "content": "South of the previous collectible, in a building, up a floor."}', 28);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 38 AND display_order = 28), 
        '/assets/images/Great_Desert/1_Solar_Tower/28_Locked_Supply_Chest_1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 38 AND display_order = 28), 
        '/assets/images/Great_Desert/1_Solar_Tower/28_Locked_Supply_Chest_2.jpg', 'Locked Supply Chest', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (38, 13, 'Legion Supply Box', '{"type": "text", "content": "South of the ruins (on the other side of them). Near a downed telegraph pole."}', 29);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 38 AND display_order = 29), 
        '/assets/images/Great_Desert/1_Solar_Tower/29_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 38 AND display_order = 29), 
        '/assets/images/Great_Desert/1_Solar_Tower/29_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

-- Xion - Xion

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 1, 'Supply Camp', '{"type": "text", "content": "Directly behind you at the beginning of the level, between Adam''s tetrapod and Lily''s workshop. Can''t be missed, as it''s the main base of operations and you''ll be visiting it frequently."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp' AND location_id = 10 AND display_order = 1), 
        '/assets/images/Xion/1-Xion/1-Supply Camp.1.jpg', 'Supply Camp', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp' AND location_id = 10 AND display_order = 1), 
        '/assets/images/Xion/1-Xion/1-Supply Camp.2.jpg', 'Supply Camp', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 13, 'Legion Supply Box', '{"type": "text", "content": " East of the tetrapod, just drop down a level to get it. Includes 2 Omnibolts and Ranged Protection Gear."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 10 AND display_order = 2), 
        '/assets/images/Xion/1-Xion/2-Crate.1.jpg', 'Legion Supply Crate', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 10 AND display_order = 2), 
        '/assets/images/Xion/1-Xion/2-Crate.2.jpg', 'Legion Supply Crate', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 1, 'Legion Camp', '{"type": "text", "content": "Outside the Presence Chamber (following Adam, as part of the story)."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 10 AND display_order = 3), 
        '/assets/images/Xion/1-Xion/3-Camp.1.jpg', 'Camp', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 10 AND display_order = 3), 
        '/assets/images/Xion/1-Xion/3-Camp.2.jpg', 'Camp', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Document - Series (The Xion #3', '{"type": "text", "content": "After coming out of the Presence Chamber (and a load of cutscenes), head to the left-hand corner of the room you enter into."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series (The Xion #3' AND location_id = 10 AND display_order = 4), 
        '/assets/images/Xion/1-Xion/4-Document-Series-The Xion 3.1.jpg', 'Document - Series (The Xion #3)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series (The Xion #3' AND location_id = 10 AND display_order = 4), 
        '/assets/images/Xion/1-Xion/4-Document-Series-The Xion 3.2.jpg', 'Document - Series (The Xion #3)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 13, 'Legion Supply Box', '{"type": "text", "content": "After Adam and Lily part ways with you, head to the cafe on the right and go behind the counter. Contains 2 x Omnibolt and Risk Taking Gear."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 10 AND display_order = 5), 
        '/assets/images/Xion/1-Xion/5-Crate.1.jpg', 'Legion Supply Crate', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 10 AND display_order = 5), 
        '/assets/images/Xion/1-Xion/5-Crate.2.jpg', 'Legion Supply Crate', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Document - Promotions (Attention, Citizens! 2)', '{"type": "text", "content": "A few steps left of the waypoint near where Adam and Lily parted ways with you outside of the Presence Chamber."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions (Attention, Citizens! 2)' AND location_id = 10 AND display_order = 6), 
        '/assets/images/Xion/1-Xion/6-Document-Promotions-Attention, Citizens! 2.1.jpg', 'Document - Promotions (Attention, Citizens! 2)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions (Attention, Citizens! 2)' AND location_id = 10 AND display_order = 6), 
        '/assets/images/Xion/1-Xion/6-Document-Promotions-Attention, Citizens! 2.2.jpg', 'Document - Promotions (Attention, Citizens! 2)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Document - Promotions (Attention, Citizens! 1)', '{"type": "text", "content": "Just to the right of the waypoint."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions (Attention, Citizens! 1)' AND location_id = 10 AND display_order = 7), 
        '/assets/images/Xion/1-Xion/7-Document-Promotions-Attention, Citizens! 1.1.jpg', 'Document - Promotions (Attention, Citizens! 1)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions (Attention, Citizens! 1)' AND location_id = 10 AND display_order = 7), 
        '/assets/images/Xion/1-Xion/7-Document-Promotions-Attention, Citizens! 1.2.jpg', 'Document - Promotions (Attention, Citizens! 1)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Document -  Promotions (Funding Announcements: Colony Bound Rocket)', '{"type": "text", "content": "From the waypoint, turn 180 degrees and run forward. On a metal shutter, to the right of a blue work desk."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document -  Promotions (Funding Announcements: Colony Bound Rocket)' AND location_id = 10 AND display_order = 8), 
        '/assets/images/Xion/1-Xion/8-Document-Promotions-Funding Announcements Colony Bound Rocket.1.jpg', 'Document - Promotions (Funding Announcements: Colony Bound Rocket)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document -  Promotions (Funding Announcements: Colony Bound Rocket)' AND location_id = 10 AND display_order = 8), 
        '/assets/images/Xion/1-Xion/8-Document-Promotions-Funding Announcements Colony Bound Rocket.2.jpg', 'Document - Promotions (Funding Announcements: Colony Bound Rocket)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Document - Series (Plastic Hearts, Vol. 5)', '{"type": "text", "content": "Head down the stairs next to the last collectible, until you hit Gwen Hair Salon. Then take a left down the stairs. The collectible is on a barrel down that corridor (that has a dead-end with a red banner)."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series (Plastic Hearts, Vol. 5)' AND location_id = 10 AND display_order = 9), 
        '/assets/images/Xion/1-Xion/9-Document-Series-Plastic Hearts, Vol 5.1.jpg', 'Document - Series (Plastic Hearts, Vol. 5)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series (Plastic Hearts, Vol. 5)' AND location_id = 10 AND display_order = 9), 
        '/assets/images/Xion/1-Xion/9-Document-Series-Plastic Hearts, Vol 5.2.jpg', 'Document - Series (Plastic Hearts, Vol. 5)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 3, 'Can - The Machinetta Americano', '{"type": "text", "content": "Do a 180 from the last collectible, and up high on the other side of the street/alleyway, is a Fiz machine. Interact and it''ll drop this can."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Machinetta Americano' AND location_id = 10 AND display_order = 10), 
        '/assets/images/Xion/1-Xion/10-Can-The Machinetta Americano.1.jpg', 'Can (The Machinetta Americano)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Machinetta Americano' AND location_id = 10 AND display_order = 10), 
        '/assets/images/Xion/1-Xion/10-Can-The Machinetta Americano.2.jpg', 'Can (The Machinetta Americano)', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Machinetta Americano' AND location_id = 10 AND display_order = 10), 
        '/assets/images/Xion/1-Xion/10-Can-The Machinetta Americano.3.jpg', 'Can (The Machinetta Americano)', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Document - Promotions (Help Wanted)', '{"type": "text", "content": "Leave the alleyway and head towards Sisters'' Junk. When you see the Liquor neon sign, there''s a collectible to the left of it, near a doorway (down a few steps)."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions (Help Wanted)' AND location_id = 10 AND display_order = 11), 
        '/assets/images/Xion/1-Xion/11-Document-Promotions-Help Wanted.1.jpg', 'Document - Promotions (Help Wanted)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions (Help Wanted)' AND location_id = 10 AND display_order = 11), 
        '/assets/images/Xion/1-Xion/11-Document-Promotions-Help Wanted.2.jpg', 'Document - Promotions (Help Wanted)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Document - Series (The Truth, Article 2)', '{"type": "text", "content": "Do another 180 and head towards the vending machines behind you. To its left is a blue newspaper box. Interact with it. It''s opposite the stairs up to Sisters'' Junk."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series (The Truth, Article 2)' AND location_id = 10 AND display_order = 12), 
        '/assets/images/Xion/1-Xion/12-Document-Series-The Truth, Article 2.1.jpg', 'Document - Series (The Truth, Article 2)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series (The Truth, Article 2)' AND location_id = 10 AND display_order = 12), 
        '/assets/images/Xion/1-Xion/12-Document-Series-The Truth, Article 2.2.jpg', 'Document - Series (The Truth, Article 2)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Document - Promotions (For You Dimwits Still Believing In Mother Sphere)', '{"type": "text", "content": "After heading up the stairs to Sisters'' Junk, take a left and there''s another poster there, in the corner near the fence."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions (For You Dimwits Still Believing In Mother Sphere)' AND location_id = 10 AND display_order = 13), 
        '/assets/images/Xion/1-Xion/13-Document-Promotions-For You Dimwits Still Believing In Mother Sphere.1.jpg', 'Document - Promotions (For You Dimwits Still Believing In Mother Sphere)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions (For You Dimwits Still Believing In Mother Sphere)' AND location_id = 10 AND display_order = 13), 
        '/assets/images/Xion/1-Xion/13-Document-Promotions-For You Dimwits Still Believing In Mother Sphere.2.jpg', 'Document - Promotions (For You Dimwits Still Believing In Mother Sphere)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Document - Promotions (Curse the Heaven''s Royalty)', '{"type": "text", "content": "Before going down the stairs to Sisters'' Junk, head up the stairs to the right of them. The poster is on a metal shutter up the stairs to the right."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions (Curse the Heaven''s Royalty)' AND location_id = 10 AND display_order = 14), 
        '/assets/images/Xion/1-Xion/14-Document-Promotions-Curse the Heaven''s Royalty.1.jpg', 'Document - Promotions (Curse the Heaven''s Royalty)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions (Curse the Heaven''s Royalty)' AND location_id = 10 AND display_order = 14), 
        '/assets/images/Xion/1-Xion/14-Document-Promotions-Curse the Heaven''s Royalty.2.jpg', 'Document - Promotions (Curse the Heaven''s Royalty)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 5, 'Locked Supply Chest', '{"type": "text", "content": "Carry on along the balcony above Sisters'' Junk until you hit a doorway with some stairs up on the right. There''s a chest at the top of the stairs. Beat the directional passcode mini game to open it."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 10 AND display_order = 15), 
        '/assets/images/Xion/1-Xion/15-Locked Supply Chest.1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 10 AND display_order = 15), 
        '/assets/images/Xion/1-Xion/15-Locked Supply Chest.2.jpg', 'Locked Supply Chest', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Document - Promotions (Prayer Meeting Guide)', '{"type": "text", "content": "From the previous chest, go down the stairs and head right. The poster is on a metal shutter to the right."}', 16);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions (Prayer Meeting Guide)' AND location_id = 10 AND display_order = 16), 
        '/assets/images/Xion/1-Xion/16-Document-Promotions-Prayer Meeting Guide.1.jpg', 'Document - Promotions (Prayer Meeting Guide)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions (Prayer Meeting Guide)' AND location_id = 10 AND display_order = 16), 
        '/assets/images/Xion/1-Xion/16-Document-Promotions-Prayer Meeting Guide.2.jpg', 'Document - Promotions (Prayer Meeting Guide)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 3, 'Can - Mountain Sparkle Mont Blanc', '{"type": "text", "content": "To the left of the previous poster (above Sisters'' Junk), is another Fiz machine where you can get this can."}', 17);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Mountain Sparkle Mont Blanc' AND location_id = 10 AND display_order = 17), 
        '/assets/images/Xion/1-Xion/17-Can-Mountain Sparkle Mont Blanc.1.jpg', 'Can - Mountain Sparkle Mont Blanc', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Mountain Sparkle Mont Blanc' AND location_id = 10 AND display_order = 17), 
        '/assets/images/Xion/1-Xion/17-Can-Mountain Sparkle Mont Blanc.2.jpg', 'Can - Mountain Sparkle Mont Blanc- ', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Mountain Sparkle Mont Blanc' AND location_id = 10 AND display_order = 17), 
        '/assets/images/Xion/1-Xion/17-Can-Mountain Sparkle Mont Blanc.3.jpg', 'Can - Mountain Sparkle Mont Blanc- ', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Document - Series - The Lost 72 Years 2', '{"type": "text", "content": "To the left of Sisters'' Junk is this book."}', 18);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series - The Lost 72 Years 2' AND location_id = 10 AND display_order = 18), 
        '/assets/images/Xion/1-Xion/18-Document-Series-The Lost 72 Years 2.1.jpg', 'Document - Series (The Lost 72 Years 2)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series - The Lost 72 Years 2' AND location_id = 10 AND display_order = 18), 
        '/assets/images/Xion/1-Xion/18-Document-Series-The Lost 72 Years 2.2.jpg', 'Document - Series (The Lost 72 Years 2)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Document - Promotions (Xion Freedom Liberation Alliance Flyer)', '{"type": "text", "content": "Down the stairs from Sisters'' Junk, take a right (south) until you reach a steam grate on the floor, and then head left. The poster is on a metal shutter in the thin alleyway."}', 19);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions (Xion Freedom Liberation Alliance Flyer)' AND location_id = 10 AND display_order = 19), 
        '/assets/images/Xion/1-Xion/19-Document-Promotions-Xion Freedom Liberation Alliance Flyer.1.jpg', 'Document - Promotions (Xion Freedom Liberation Alliance Flyer)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions (Xion Freedom Liberation Alliance Flyer)' AND location_id = 10 AND display_order = 19), 
        '/assets/images/Xion/1-Xion/19-Document-Promotions-Xion Freedom Liberation Alliance Flyer.2.jpg', 'Document - Promotions (Xion Freedom Liberation Alliance Flyer)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 3, 'Can - Bayern Weissbier Dunkel', '{"type": "text", "content": "Between the waypoint and the bulletin board is an alleyway with this can at the end of it."}', 20);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Bayern Weissbier Dunkel' AND location_id = 10 AND display_order = 20), 
        '/assets/images/Xion/1-Xion/20-Can-Bayern Weissbier Dunkel.1.jpg', 'Can - Bayern Weissbier Dunkel', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Bayern Weissbier Dunkel' AND location_id = 10 AND display_order = 20), 
        '/assets/images/Xion/1-Xion/20-Can-Bayern Weissbier Dunkel.2.jpg', 'Can - Bayern Weissbier Dunkel', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Bayern Weissbier Dunkel' AND location_id = 10 AND display_order = 20), 
        '/assets/images/Xion/1-Xion/20-Can-Bayern Weissbier Dunkel.3.jpg', 'Can - Bayern Weissbier Dunkel', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 3, 'Can - Dionysus 3', '{"type": "text", "content": "180 from the previous can, head back up the alley and head to the right. At the top of the hill take the stairs and there''s another can in front of you."}', 21);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Dionysus 3' AND location_id = 10 AND display_order = 21), 
        '/assets/images/Xion/1-Xion/21-Can-Dionysus 3.1.jpg', 'Can - Dionysus 3', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Dionysus 3' AND location_id = 10 AND display_order = 21), 
        '/assets/images/Xion/1-Xion/21-Can-Dionysus 3.2.jpg', 'Can - Dionysus 3', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Dionysus 3' AND location_id = 10 AND display_order = 21), 
        '/assets/images/Xion/1-Xion/21-Can-Dionysus 3.3.jpg', 'Can - Dionysus 3', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 13, 'Legion Supply Box', '{"type": "text", "content": "Right next to the Bulletin Board."}', 22);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 10 AND display_order = 22), 
        '/assets/images/Xion/1-Xion/22-Legion Supply Crate.1.jpg', 'Legion Supply Crate', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 10 AND display_order = 22), 
        '/assets/images/Xion/1-Xion/22-Legion Supply Crate.2.jpg', 'Legion Supply Crate', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Document - Series (The Lost 72 Years 1)', '{"type": "text", "content": "On the bench opposite Roxanne and the Bulletin Board."}', 23);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series (The Lost 72 Years 1)' AND location_id = 10 AND display_order = 23), 
        '/assets/images/Xion/1-Xion/23-Document-Series-The Lost 72 Years 1.1.jpg', 'Document - Series (The Lost 72 Years 1)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series (The Lost 72 Years 1)' AND location_id = 10 AND display_order = 23), 
        '/assets/images/Xion/1-Xion/23-Document-Series-The Lost 72 Years 1.2.jpg', 'Document - Series (The Lost 72 Years 1)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Available to purchase from Roxanne:', '{"type": "list", "items": ["Document - Information: Solar Tower", "Document - Information: Can", "Document - Information: Crazy Drone", "Document - Information: Prayer Password", "Document - Information: Personal Link with Orcal", "Document - Series (The Xion #6)", "Document - Series (Plastic Hearts, Vol. 1)", "Document - Series (Notes on EVE Protocol 3)"]}', 24);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Available to purchase from Roxanne:' AND location_id = 10 AND display_order = 24), 
        '/assets/images/Xion/1-Xion/24-Roxanne.2.jpg', 'Document - Series (The Xion #6)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Available to purchase from Roxanne:' AND location_id = 10 AND display_order = 24), 
        '/assets/images/Xion/1-Xion/24-Roxanne.3.jpg', 'Document - Series (Plastic Hearts, Vol. 1)', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Available to purchase from Roxanne:' AND location_id = 10 AND display_order = 24), 
        '/assets/images/Xion/1-Xion/24-Roxanne.4.jpg', 'Document - Series (Notes on EVE Protocol 3)', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 15, 'Roxanne Level 2 Affinity:', '{"type": "list", "items": ["Nano Suit Design Pattern: Planet Diving Suit (2nd)", "Nano Suit Design Pattern: Orca Exploration Suit"]}', 25);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 15, 'Roxanne Level 3 Affinity:', '{"type": "list", "items": ["Nano Suit Design Pattern: Keyhole Dress", "Nano Suit Design Pattern: Cybernetic Dress", "Nano Suit Design Pattern: Moutan Peony"]}', 26);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Available to purchase from Roxanne after restoring the second Hyper Cell:', '{"type": "list", "items": ["Document - Information: Oasis", "Document - Information: Hypertube"]}', 27);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Available to purchase from Roxanne after restoring the second Hyper Cell:' AND location_id = 10 AND display_order = 27), 
        '/assets/images/Xion/1-Xion/24-Roxanne.1.jpg', 'Document - Information: Oasis', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 3, 'Can - Behemoth Red', '{"type": "text", "content": "In an alleyway that leads to The Last Gulp (where Su and Enya are) there''s a Fiz machine on the left as you start to head down the alleyway."}', 28);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Behemoth Red' AND location_id = 10 AND display_order = 28), 
        '/assets/images/Xion/1-Xion/25-Can-Behemoth Red.1.jpg', 'Can - Behemoth Red', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Behemoth Red' AND location_id = 10 AND display_order = 28), 
        '/assets/images/Xion/1-Xion/25-Can-Behemoth Red.2.jpg', 'Can - Behemoth Red', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Behemoth Red' AND location_id = 10 AND display_order = 28), 
        '/assets/images/Xion/1-Xion/25-Can-Behemoth Red.3.jpg', 'Can - Behemoth Red', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Document - Promotions (Angels Are Rigged)', '{"type": "text", "content": "On the wall by the body for the Missing Husband Request, near The Last Gulp."}', 29);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions (Angels Are Rigged)' AND location_id = 10 AND display_order = 29), 
        '/assets/images/Xion/1-Xion/26-Document-Promotions-Angels Are Rigged.1.jpg', 'Document - Promotions (Angels Are Rigged)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions (Angels Are Rigged)' AND location_id = 10 AND display_order = 29), 
        '/assets/images/Xion/1-Xion/26-Document-Promotions-Angels Are Rigged.2.jpg', 'Document - Promotions (Angels Are Rigged)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 4, 'Memorystick (Matthew''s Memory)', '{"type": "text", "content": "On the ground directly to the left of the Angel Is A Lie poster."}', 30);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Matthew''s Memory)' AND location_id = 10 AND display_order = 30), 
        '/assets/images/Xion/1-Xion/27-Memorystick-Matthew''s Memory.jpg', 'Memorystick (Matthew''s Memory)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Matthew''s Memory)' AND location_id = 10 AND display_order = 30), 
        '/assets/images/Xion/1-Xion/26-Document-Promotions-Angels Are Rigged.2.jpg', 'Document - Promotions (Angels Are Rigged)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Document - Series (The Xion #5)', '{"type": "text", "content": "By the fence at the end of the same alley as the previous document and memorystick."}', 31);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series (The Xion #5)' AND location_id = 10 AND display_order = 31), 
        '/assets/images/Xion/1-Xion/28-Document-Series-The Xion 5.jpg', 'Document - Series (The Xion #5)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series (The Xion #5)' AND location_id = 10 AND display_order = 31), 
        '/assets/images/Xion/1-Xion/26-Document-Promotions-Angels Are Rigged.2.jpg', 'Document - Promotions (Angels Are Rigged)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 3, 'Can - The Machinetta Caramel Macchiato', '{"type": "text", "content": "At the far end of the northern plaza with the large planet sculpture in the centre, in the far right hand corner (to the right of Delloih), up some stairs, there is a Fiz machine."}', 32);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Machinetta Caramel Macchiato' AND location_id = 10 AND display_order = 32), 
        '/assets/images/Xion/1-Xion/29-Can-The Machinetta Caramel Macchiato.1.jpg', 'Can - The Machinetta Caramel Macchiato', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Machinetta Caramel Macchiato' AND location_id = 10 AND display_order = 32), 
        '/assets/images/Xion/1-Xion/29-Can-The Machinetta Caramel Macchiato.2.jpg', 'Can - The Machinetta Caramel Macchiato', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - The Machinetta Caramel Macchiato' AND location_id = 10 AND display_order = 32), 
        '/assets/images/Xion/1-Xion/29-Can-The Machinetta Caramel Macchiato.3.jpg', 'Can - The Machinetta Caramel Macchiato', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Document - Series (The Xion #1)', '{"type": "text", "content": "Just to the left of the Fiz machine is this document."}', 33);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series (The Xion #1)' AND location_id = 10 AND display_order = 33), 
        '/assets/images/Xion/1-Xion/30-Document-Series-The Xion 1.1.jpg', 'Document - Series (The Xion #1)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series (The Xion #1)' AND location_id = 10 AND display_order = 33), 
        '/assets/images/Xion/1-Xion/30-Document-Series-The Xion 1.2.jpg', 'Document - Series (The Xion #1)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 3, 'Can - Pixie', '{"type": "text", "content": "To the left of the Delloih place, outside a window display with mannequins and near a skateboard."}', 34);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Pixie' AND location_id = 10 AND display_order = 34), 
        '/assets/images/Xion/1-Xion/31-Can-Pixie.1.jpg', 'Can - Pixie', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Pixie' AND location_id = 10 AND display_order = 34), 
        '/assets/images/Xion/1-Xion/31-Can-Pixie.2.jpg', 'Can - Pixie', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Pixie' AND location_id = 10 AND display_order = 34), 
        '/assets/images/Xion/1-Xion/31-Can-Pixie.3.jpg', 'Can - Pixie', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 12, 'Robot - Passcode - 00KKKE', '{"type": "text", "content": "In a metal crate in the far north of the map (to the left of Delloih, opposite the cafe near the entrance to Presence Chamber)."}', 35);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Passcode - 00KKKE' AND location_id = 10 AND display_order = 35), 
        '/assets/images/Xion/1-Xion/32-Robot-Passcode-00KKKE.1.jpg', 'Robot - Passcode - 00KKKE', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Passcode - 00KKKE' AND location_id = 10 AND display_order = 35), 
        '/assets/images/Xion/1-Xion/32-Robot-Passcode-00KKKE.2.jpg', 'Robot - Passcode - 00KKKE', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 5, 'Locked Supply Chest', '{"type": "text", "content": "If you look forward from the cafe, with it behind you, cross the plaza to the other side until you see Delloih. Take the stairs to the left of it and around that building is a locked chest. The passcode from the robot unlocks this crate."}', 36);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 10 AND display_order = 36), 
        '/assets/images/Xion/1-Xion/33-Locked Supply Chest.1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 10 AND display_order = 36), 
        '/assets/images/Xion/1-Xion/33-Locked Supply Chest.2.jpg', 'Locked Supply Chest', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Document - Log Data (CT27932)', '{"type": "text", "content": "Visit the console in The Cradle, underneath Xion after accepting the Sleeping Beauty Request and you''ll get this document."}', 37);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Log Data (CT27932)' AND location_id = 10 AND display_order = 37), 
        '/assets/images/Xion/1-Xion/34-Document-Log Data-CT27932.1.jpg', 'Document - Log Data (CT27932)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Log Data (CT27932)' AND location_id = 10 AND display_order = 37), 
        '/assets/images/Xion/1-Xion/34-Document-Log Data-CT27932.2.jpg', 'Document - Log Data (CT27932)', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Log Data (CT27932)' AND location_id = 10 AND display_order = 37), 
        '/assets/images/Xion/1-Xion/34-Document-Log Data-CT27932.3.jpg', 'Document - Log Data (CT27932)', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 13, 'Legion Supply Box', '{"type": "text", "content": "On the roof next to the bizarre shop with the statue inside, near the entrance/exit to Xion."}', 38);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 10 AND display_order = 38), 
        '/assets/images/Xion/1-Xion/35-Legion Supply Crate.1.jpg', 'Legion Supply Crate', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 10 AND display_order = 38), 
        '/assets/images/Xion/1-Xion/35-Legion Supply Crate.2.jpg', 'Legion Supply Crate', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 10 AND display_order = 38), 
        '/assets/images/Xion/1-Xion/35-Legion Supply Crate.3.jpg', 'Legion Supply Crate', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Document - Series (Book of Faith and Wisdom 2:1-4), Series (The Lost 72 Years 3) & Book (How to Speak with Style)', '{"type": "text", "content": "In the alleyway to the right of the exit (as if you''re leaving Xion to head back to the ship), at the end of said alleyway is a book store. You''ll find these books on the shelves."}', 39);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series (Book of Faith and Wisdom 2:1-4), Series (The Lost 72 Years 3) & Book (How to Speak with Style)' AND location_id = 10 AND display_order = 39), 
        '/assets/images/Xion/1-Xion/36-Document-Series-Book of Faith and Wisdom 2 1-4, Series-The Lost 72 Years 3 & Book-How to Speak with Style.1.jpg', 'Document - Series (Book of Faith and Wisdom 2:1-4)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series (Book of Faith and Wisdom 2:1-4), Series (The Lost 72 Years 3) & Book (How to Speak with Style)' AND location_id = 10 AND display_order = 39), 
        '/assets/images/Xion/1-Xion/36-Document-Series-Book of Faith and Wisdom 2 1-4, Series-The Lost 72 Years 3 & Book-How to Speak with Style.2.jpg', 'Document - Series (Book of Faith and Wisdom 2:1-4)', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series (Book of Faith and Wisdom 2:1-4), Series (The Lost 72 Years 3) & Book (How to Speak with Style)' AND location_id = 10 AND display_order = 39), 
        '/assets/images/Xion/1-Xion/36-Document-Series-Book of Faith and Wisdom 2 1-4, Series-The Lost 72 Years 3 & Book-How to Speak with Style.3.jpg', 'Document - Series (Book of Faith and Wisdom 2:1-4)', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series (Book of Faith and Wisdom 2:1-4), Series (The Lost 72 Years 3) & Book (How to Speak with Style)' AND location_id = 10 AND display_order = 39), 
        '/assets/images/Xion/1-Xion/36-Document-Series-Book of Faith and Wisdom 2 1-4, Series-The Lost 72 Years 3 & Book-How to Speak with Style.4.jpg', 'Series (The Lost 72 Years 3)', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series (Book of Faith and Wisdom 2:1-4), Series (The Lost 72 Years 3) & Book (How to Speak with Style)' AND location_id = 10 AND display_order = 39), 
        '/assets/images/Xion/1-Xion/36-Document-Series-Book of Faith and Wisdom 2 1-4, Series-The Lost 72 Years 3 & Book-How to Speak with Style.5.jpg', 'Series (The Lost 72 Years 3)', 5);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Document - Series (Notes on EVE Protocol 1)', '{"type": "text", "content": "On your way back to the safehouse, on the final bridge, before you start to cross it. On the side on the right."}', 40);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series (Notes on EVE Protocol 1)' AND location_id = 10 AND display_order = 40), 
        '/assets/images/Xion/1-Xion/37-Document-Series-Notes on EVE Protocol 1.1.jpg', 'Document - Series (Notes on EVE Protocol 1)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series (Notes on EVE Protocol 1)' AND location_id = 10 AND display_order = 40), 
        '/assets/images/Xion/1-Xion/37-Document-Series-Notes on EVE Protocol 1.2.jpg', 'Document - Series (Notes on EVE Protocol 1)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 13, 'Legion Supply Box', '{"type": "text", "content": "Where the 3 bridges converge in Xion is a rope. Go down the rope, down the ladder, and follow the platforms to the end."}', 41);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 10 AND display_order = 41), 
        '/assets/images/Xion/1-Xion/38-Legion Supply Crate.1.jpg', 'Legion Supply Crate', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 10 AND display_order = 41), 
        '/assets/images/Xion/1-Xion/38-Legion Supply Crate.2.jpg', 'Legion Supply Crate', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 10 AND display_order = 41), 
        '/assets/images/Xion/1-Xion/38 & 39-Crate & Can.jpg', 'Legion Supply Crate', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 3, 'Can - GrainT Oolong', '{"type": "text", "content": "There''s also a can on the rock behind the supply box. Jump over to pick it up."}', 42);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - GrainT Oolong' AND location_id = 10 AND display_order = 42), 
        '/assets/images/Xion/1-Xion/39-Can-GrainT Oolong.1.jpg', 'Can - GrainT Oolong', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - GrainT Oolong' AND location_id = 10 AND display_order = 42), 
        '/assets/images/Xion/1-Xion/38 & 39-Crate & Can.jpg', 'Legion Supply Crate', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - GrainT Oolong' AND location_id = 10 AND display_order = 42), 
        '/assets/images/Xion/1-Xion/39-Can-GrainT Oolong.2.jpg', 'Can - GrainT Oolong', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Documents - Journal (DB372-25)', '{"type": "text", "content": "Submerged in the small pond by the exit to the Wasteland. If you picked up the Lost Device request from the Bulletin Board, just follow the quest marker."}', 43);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Documents - Journal (DB372-25)' AND location_id = 10 AND display_order = 43), 
        '/assets/images/Xion/1-Xion/40-Documents-Journal-DB372-25.1.jpg', 'Documents - Journal (DB372-25)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Documents - Journal (DB372-25)' AND location_id = 10 AND display_order = 43), 
        '/assets/images/Xion/1-Xion/40-Documents-Journal-DB372-25.2.jpg', 'Documents - Journal (DB372-25)', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (10, 2, 'Document - Messages (Kasim''s Memo)', '{"type": "text", "content": "In the Gwen Hair Salon (which opens up after you agree to go to the Wasteland on foot), which is in the centre of Xion, near the stairs that leads to Sisters'' Junk."}', 44);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Messages (Kasim''s Memo)' AND location_id = 10 AND display_order = 44), 
        '/assets/images/Xion/1-Xion/41-Document-Messages-Kasim''s Memo.1.jpg', 'Document - Messages (Kasim''s Memo)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Messages (Kasim''s Memo)' AND location_id = 10 AND display_order = 44), 
        '/assets/images/Xion/1-Xion/41-Document-Messages-Kasim''s Memo.2.jpg', 'Document - Messages (Kasim''s Memo)', 2);

-- Xion - Xion (Continued)

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (11, 2, 'Document - Messages - Request Letter', '{"type": "text", "content": "Speak to the young girl to the south of the entrance to Xion (down the ladder). She''ll give you this document, which will start the \u201cOblivion\u201d side quest."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Messages - Request Letter' AND location_id = 11 AND display_order = 1), 
        '/assets/images/Xion/2-XionContinued/1-Documents - Messages (Request Letter).jpg', 'Document - Messages - Request Letter', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (11, 2, 'Available to purchase from Lyle:', '{"type": "list", "items": ["Document - Book - Light of the Colony", "Document - Book - Angel Accepting Shed Tears", "Document - Book - For a Better World", "Document - Book - Book of Quotes 1", "Document - Book - Eidos Company Promotion", "Document - Book - Tattered Report 1", "Document - Series - Notes on EVE Protocol 2"]}', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (11, 15, 'Lyle Level 2 Affinity:', '{"type": "list", "items": ["Nano Suit Design Pattern: Daily Biker", "Nano Suit Design Pattern: Black Full Dress"]}', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (11, 15, 'Lyle Level 3 Affinity:', '{"type": "list", "items": ["Nano Suit Design Pattern: Junk Mechanic", "Nano Suit Design Pattern: Daily Denim"]}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Lyle Level 3 Affinity:' AND location_id = 11 AND display_order = 4), 
        '/assets/images/Xion/2-XionContinued/2-Lyle''s Shop.1.jpg', 'Document - Book - Light of the Colony', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Lyle Level 3 Affinity:' AND location_id = 11 AND display_order = 4), 
        '/assets/images/Xion/2-XionContinued/2-Lyle''s Shop.2.jpg', 'Document - Book - Book of Quotes 1', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Lyle Level 3 Affinity:' AND location_id = 11 AND display_order = 4), 
        '/assets/images/Xion/2-XionContinued/2-Lyle''s Shop.3.jpg', 'Document - Series - Notes on EVE Protocol 2', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (11, 5, 'Locked Supply Chest', '{"type": "text", "content": "Next to Sisters'' Junk is a chest that can be opened once you''ve found Tommy in the \u201cLife of the Scavengers\u201d side quest."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 11 AND display_order = 5), 
        '/assets/images/Xion/2-XionContinued/3-Locked Legion Supply Chest.1.jpg', 'Locked Legion Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 11 AND display_order = 5), 
        '/assets/images/Xion/2-XionContinued/3-Locked Legion Supply Chest.2.jpg', 'Locked Legion Supply Chest', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (11, 13, 'Legion Supply Box / Document - Journal - Aaron''s Journal', '{"type": "text", "content": "Return to the area where the \u201cAngel of Death\u201d side quest ambush took place and you can enter the garage now with the aSaSaS code (which can be found in the Junkyard in the Wasteland)."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box / Document - Journal - Aaron''s Journal' AND location_id = 11 AND display_order = 6), 
        '/assets/images/Xion/2-XionContinued/4-Documents - Journal (Aaron''s Journal) - (& Legion Supply Crate).1.jpg', 'Legion Supply Box / Document - Journal - Aaron''s Journal', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box / Document - Journal - Aaron''s Journal' AND location_id = 11 AND display_order = 6), 
        '/assets/images/Xion/2-XionContinued/4-Documents - Journal (Aaron''s Journal) - (& Legion Supply Crate).2.jpg', 'Legion Supply Box / Document - Journal - Aaron''s Journal', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box / Document - Journal - Aaron''s Journal' AND location_id = 11 AND display_order = 6), 
        '/assets/images/Xion/2-XionContinued/4-Documents - Journal (Aaron''s Journal) - (& Legion Supply Crate).3.jpg', 'Legion Supply Box / Document - Journal - Aaron''s Journal', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box / Document - Journal - Aaron''s Journal' AND location_id = 11 AND display_order = 6), 
        '/assets/images/Xion/2-XionContinued/4-Documents - Journal (Aaron''s Journal) - (& Legion Supply Crate).4.jpg', 'Legion Supply Box / Document - Journal - Aaron''s Journal', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (11, 13, 'Legion Supply Box', '{"type": "text", "content": "West of Gwen Hair Salon is a locked door. Use the passcode naEdrr to open it, which you get from the Great Desert, to the south-southeast of the Solar Tower in the south."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 11 AND display_order = 7), 
        '/assets/images/Xion/2-XionContinued/5-Legion Supply Box.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 11 AND display_order = 7), 
        '/assets/images/Xion/2-XionContinued/5-Legion Supply Box.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 11 AND display_order = 7), 
        '/assets/images/Xion/2-XionContinued/5-Legion Supply Box.3.jpg', 'Legion Supply Box', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (11, 2, 'Document - Promotions - To My Allies', '{"type": "text", "content": "Just south of the Gwen Hair Salon, at some point, you''ll find a document, which will start the side quest \u201cA United People Cannot be Defended.\u201d Didn''t show up until we returned from a prolonged stint in the Great Desert."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions - To My Allies' AND location_id = 11 AND display_order = 8), 
        '/assets/images/Xion/2-XionContinued/6-Documents - Promotions (To My Allies).1.jpg', 'Document - Promotions - To My Allies', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions - To My Allies' AND location_id = 11 AND display_order = 8), 
        '/assets/images/Xion/2-XionContinued/6-Documents - Promotions (To My Allies).2.jpg', 'Document - Promotions - To My Allies', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (11, 2, 'Document - Series - The Lost 72 Years 4', '{"type": "text", "content": "Opposite the southernmost Waypoint in Xion (triggered by some completion of a side quest, we imagine)."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series - The Lost 72 Years 4' AND location_id = 11 AND display_order = 9), 
        '/assets/images/Xion/2-XionContinued/7-Document - Series (The Last 72 Years 4).1.jpg', 'Document - Series - The Lost 72 Years 4', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series - The Lost 72 Years 4' AND location_id = 11 AND display_order = 9), 
        '/assets/images/Xion/2-XionContinued/7-Document - Series (The Last 72 Years 4).2.jpg', 'Document - Series - The Lost 72 Years 4', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (11, 2, 'Document - Promotions - Introducing the Ark-Tech''s Ark!', '{"type": "text", "content": "Speak to Mann after returning from Altess Levoire to start the \u201cLost Ark side\u201d mission. Follow the waypoint to the northeast of Xion, and you will come across the body of the radical."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions - Introducing the Ark-Tech''s Ark!' AND location_id = 11 AND display_order = 10), 
        '/assets/images/Xion/2-XionContinued/8-Document - Promotions (Introducing the Ark-Tech''s Ark!).1.jpg', 'Document - Promotions - Introducing the Ark-Tech''s Ark!', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions - Introducing the Ark-Tech''s Ark!' AND location_id = 11 AND display_order = 10), 
        '/assets/images/Xion/2-XionContinued/8-Document - Promotions (Introducing the Ark-Tech''s Ark!).2.jpg', 'Document - Promotions - Introducing the Ark-Tech''s Ark!', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (11, 2, 'Document - Promotions - Experience Ark-Tech''s Ark!', '{"type": "text", "content": "After investigating the body, head over to the second location that has just been marked on your map. Check at the device next to the entrance of the Ark for this document."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions - Experience Ark-Tech''s Ark!' AND location_id = 11 AND display_order = 11), 
        '/assets/images/Xion/2-XionContinued/9-Document - Promotions (Experience Ark-Tech''s Ark!).2.jpg', 'Document - Promotions - Experience Ark-Tech''s Ark!', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions - Experience Ark-Tech''s Ark!' AND location_id = 11 AND display_order = 11), 
        '/assets/images/Xion/2-XionContinued/9-Document - Promotions (Experience Ark-Tech''s Ark!).3.jpg', 'Document - Promotions - Experience Ark-Tech''s Ark!', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (11, 4, 'Memorystick - Lament of the Trapped', '{"type": "text", "content": "Once inside, you have to investigate four bodies in order to determine what happened inside of the Ark. The first one is right at the door."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Lament of the Trapped' AND location_id = 11 AND display_order = 12), 
        '/assets/images/Xion/2-XionContinued/10-Memorystick - Lament of the Trapped.1.jpg', 'Memorystick - Lament of the Trapped', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Lament of the Trapped' AND location_id = 11 AND display_order = 12), 
        '/assets/images/Xion/2-XionContinued/10-Memorystick - Lament of the Trapped.2.jpg', 'Memorystick - Lament of the Trapped', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (11, 4, 'Memorystick - Monolog of a Trapped Man', '{"type": "text", "content": "The second body is in a small room on the left side, kneeling by a chair."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Monolog of a Trapped Man' AND location_id = 11 AND display_order = 13), 
        '/assets/images/Xion/2-XionContinued/11-Memorystick - Monolog of a Trapped Man.1.jpg', 'Memorystick - Monolog of a Trapped Man', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Monolog of a Trapped Man' AND location_id = 11 AND display_order = 13), 
        '/assets/images/Xion/2-XionContinued/11-Memorystick - Monolog of a Trapped Man.2.jpg', 'Memorystick - Monolog of a Trapped Man', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (11, 4, 'Memorystick - Let Me Out', '{"type": "text", "content": "The next body is in the big room on the right side, by a large pile of bodies."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Let Me Out' AND location_id = 11 AND display_order = 14), 
        '/assets/images/Xion/2-XionContinued/12-Memorystick - Let Me Out.1.jpg', 'Memorystick - Let Me Out', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Let Me Out' AND location_id = 11 AND display_order = 14), 
        '/assets/images/Xion/2-XionContinued/12-Memorystick - Let Me Out.2.jpg', 'Memorystick - Let Me Out', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (11, 4, 'Memorystick - Who Are You Guys', '{"type": "text", "content": "The last body is in the same room as the previous one, turn around and you''ll see it against the wall by one of the doors."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Who Are You Guys' AND location_id = 11 AND display_order = 15), 
        '/assets/images/Xion/2-XionContinued/13-Memorystick - Who Are You Guys.1.jpg', 'Memorystick - Who Are You Guys', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Who Are You Guys' AND location_id = 11 AND display_order = 15), 
        '/assets/images/Xion/2-XionContinued/13-Memorystick - Who Are You Guys.2.jpg', 'Memorystick - Who Are You Guys', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (11, 2, 'Document - Promotions - Ark-Tech Delivers Its Best Service By Protecting Its Customers!', '{"type": "text", "content": "Check the large monitor inside the same room, it''s just up the steps from the pile of bodies."}', 16);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions - Ark-Tech Delivers Its Best Service By Protecting Its Customers!' AND location_id = 11 AND display_order = 16), 
        '/assets/images/Xion/2-XionContinued/14-Document - Promotions (Ark-Tech Delivers Its Best Service By Protecting Its Customers!).1.jpg', 'Document - Promotions - Ark-Tech Delivers Its Best Service By Protecting Its Customers!', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Promotions - Ark-Tech Delivers Its Best Service By Protecting Its Customers!' AND location_id = 11 AND display_order = 16), 
        '/assets/images/Xion/2-XionContinued/14-Document - Promotions (Ark-Tech Delivers Its Best Service By Protecting Its Customers!).2.jpg', 'Document - Promotions - Ark-Tech Delivers Its Best Service By Protecting Its Customers!', 2);

-- Eidos 7 - Abandoned Station

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (3, 4, 'Memorystick - Respite of the Hopeful / Passcode - oBukoB', '{"type": "text", "content": "After entering the flooded facility, to the right of the first door (north wall) is a corpse underwater with both this memorystick and passcode."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Respite of the Hopeful / Passcode - oBukoB' AND location_id = 3 AND display_order = 1), 
        '/assets/images/Eidos7/3-AbandonedStation/1-Memorystick (Respite of the Hopeful) & Passcode - oBukoB.jpg', 'Memorystick - Respite of the Hopeful / Passcode - oBukoB', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (3, 1, 'Supply Camp - Abandoned Station', '{"type": "text", "content": "Up the elevator shaft in the Abandoned Station."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Abandoned Station' AND location_id = 3 AND display_order = 2), 
        '/assets/images/Eidos7/3-AbandonedStation/2-Supply Camp (Abandoned Station).jpg', 'Supply Camp - Abandoned Station', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (3, 4, 'Memorystick - Legionnaire 244''s Memory', '{"type": "text", "content": "As you get out of the monorail on the other side."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 244''s Memory' AND location_id = 3 AND display_order = 3), 
        '/assets/images/Eidos7/3-AbandonedStation/3-Memorystick (Legionnaire 244''s Memory).jpg', 'Memorystick - Legionnaire 244''s Memory', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (3, 15, 'Nano Suit - Planet Diving Suit (7th) V2', '{"type": "text", "content": "In the southwest corner, in a small room, in the tram station at the beginning of the level (before heading outside towards the objective)."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Planet Diving Suit (7th) V2' AND location_id = 3 AND display_order = 4), 
        '/assets/images/Eidos7/3-AbandonedStation/4-Planet Diving Suit (7th) V2 Nano Suit.jpg', 'Nano Suit - Planet Diving Suit (7th) V2', 1);

-- Eidos 7 - City Underground

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (7, 1, 'Legion Camp', '{"type": "text", "content": "After crossing over the steel beam, this camp is through the door on the left."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 7 AND display_order = 1), 
        '/assets/images/Eidos7/7-CityUnderground/1-Legion Camp 8.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (7, 5, 'Locked Supply Chest', '{"type": "text", "content": "At the first crossroads, there''s a chest you can''t miss on the corner at the intersection."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 7 AND display_order = 2), 
        '/assets/images/Eidos7/7-CityUnderground/2-Locked Chest 4.jpg', 'Legion Supply Chest', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (7, 4, 'Memorystick (Legionnaire 220''s Memory)', '{"type": "text", "content": "Follow the southern corridor to the end, and before going outside there''s a human corpse on the right at the end."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Legionnaire 220''s Memory)' AND location_id = 7 AND display_order = 3), 
        '/assets/images/Eidos7/7-CityUnderground/3-Memorystick (Legionnaire 220''s Memory).jpg', 'Memorystick (Legionnaire 220''s Memory)', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (7, 17, 'Body Core', '{"type": "text", "content": "Head outside from the previous human corpse and you''ll find another human with a Body Core."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 7 AND display_order = 4), 
        '/assets/images/Eidos7/7-CityUnderground/4-Body Core 5.jpg', 'Body Core', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (7, 12, 'Robot - Tumbler Expansion Module', '{"type": "text", "content": "Head down the west tunnel now, but before you head right at the end, take the northern tunnel down to the end. At the end is a robot with this relic."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 7 AND display_order = 5), 
        '/assets/images/Eidos7/7-CityUnderground/5-Robot 5.jpg', 'Robot - Tumbler Expansion Module', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (7, 4, 'Memorystick (Legionnaire 498''s Wish)', '{"type": "text", "content": "In the same area, head into the water behind the robot and you''ll find another human corpse."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Legionnaire 498''s Wish)' AND location_id = 7 AND display_order = 6), 
        '/assets/images/Eidos7/7-CityUnderground/6-Memorystick (Legionnaire 498''s Wish).jpg', 'Memorystick (Legionnaire 498''s Wish)', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (7, 4, 'Memorystick (Legionnaire 248''s Complaint)', '{"type": "text", "content": "After the tunnel collapses a bit, and you have to jump down onto the pipe, at the top look left. There''s another human corpse there."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Legionnaire 248''s Complaint)' AND location_id = 7 AND display_order = 7), 
        '/assets/images/Eidos7/7-CityUnderground/7-Memorystick (Legionnaire 248''s Complaint).jpg', 'Memorystick (Legionnaire 248''s Complaint)', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (7, 14, 'Beta Core', '{"type": "text", "content": "After climbing up to the top (after the pipe section), instead of going north and down the hole, head northeast and down that hole. There''s a human dead body there with this core on it."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 7 AND display_order = 8), 
        '/assets/images/Eidos7/7-CityUnderground/8-Beta Core 5.jpg', 'Beta Core', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (7, 4, 'Memorystick (Lament of the Disappointed)', '{"type": "text", "content": "After getting back on course from the previous collectible and dropping down the hole, there''s a human corpse as you drop with this memorystick on it."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Lament of the Disappointed)' AND location_id = 7 AND display_order = 9), 
        '/assets/images/Eidos7/7-CityUnderground/9-Memorystick (Lament of the Disappointed).jpg', 'Memorystick (Lament of the Disappointed)', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (7, 13, 'Legion Supply Box', '{"type": "text", "content": "Use the pole to get across the gap and take the rope down. There''s a human corpse down there (with no memorystick). However, behind said corpse is this supply box. There''s also another corpse (only XP) down there too."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 7 AND display_order = 10), 
        '/assets/images/Eidos7/7-CityUnderground/10-Crate 21.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 7 AND display_order = 10), 
        '/assets/images/Eidos7/7-CityUnderground/10-Crate 21.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (7, 1, 'Legion Camp', '{"type": "text", "content": "Take the rope back up, go left down the tunnel and then right to find this camp."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 7 AND display_order = 11), 
        '/assets/images/Eidos7/7-CityUnderground/11-Legion Camp 9.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (7, 4, 'Memorystick (Legionnaire 268''s Prayer)', '{"type": "text", "content": "Follow the corridor directly ahead of the camp to the end and head right. There''s a human corpse at the end. Also includes the Floodgate Key."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Legionnaire 268''s Prayer)' AND location_id = 7 AND display_order = 12), 
        '/assets/images/Eidos7/7-CityUnderground/12-Memorystick (Legionnaire 268''s Prayer).jpg', 'Memorystick (Legionnaire 268''s Prayer)', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (7, 13, 'Legion Supply Box', '{"type": "text", "content": "There''s a box just behind the aforementioned corpse. Includes an Omnbolt and Speed Increase Gear."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 7 AND display_order = 13), 
        '/assets/images/Eidos7/7-CityUnderground/13-Crate 22.jpg', 'Legion Supply Crate', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (7, 12, 'Robot - Drone Upgrade Module', '{"type": "text", "content": "When Adam says the exit is to the right (after opening the second floodgate), down that corridor to the right is this bot and this relic."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Drone Upgrade Module' AND location_id = 7 AND display_order = 14), 
        '/assets/images/Eidos7/7-CityUnderground/14-Robot 6.jpg', 'Robot - Drone Upgrade Module', 1);

-- Eidos 7 - Construction Zone

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (6, 13, 'Locked Legion Supply Box', '{"type": "text", "content": "Need Drone Hacking Tool to unlock - After dropping into the construction zone (off the road), the chest is behind you, to the east, near a large truck and some shipping containers. We''ll include this later when you can return to the area and get the rest of the collectibles."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Legion Supply Box' AND location_id = 6 AND display_order = 1), 
        '/assets/images/Eidos7/6-ConstructionZone/1-Crate 16.jpg', 'Locked Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (6, 4, 'Memorystick (Legionnaire 286''s Recollection)', '{"type": "text", "content": "Southwest of where you drop in, on the ground level, underneath a half-finished floor, is this corpse."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Legionnaire 286''s Recollection)' AND location_id = 6 AND display_order = 2), 
        '/assets/images/Eidos7/6-ConstructionZone/2-Memorystick (Legionnaire 286''s Recollection).jpg', 'Memorystick (Legionnaire 286''s Recollection)', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (6, 13, 'Legion Supply Box', '{"type": "text", "content": "Follow the corridor round on the ground, all the way to the southwest. There you''ll find this case with some supplies, an Omnibolt, and the Beta Enhancement Gear."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 6 AND display_order = 3), 
        '/assets/images/Eidos7/6-ConstructionZone/3-Crate 17.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (6, 1, 'Supply Camp - Construction Zone', '{"type": "text", "content": "In the centre of the Construction Zone area. On the same level as the area you drop in at. Above the two previous collectibles (in-between them)."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Construction Zone' AND location_id = 6 AND display_order = 4), 
        '/assets/images/Eidos7/6-ConstructionZone/4-Supply Camp (Construction Zone).jpg', 'Supply Camp (Construction Zone)', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (6, 5, 'Locked Supply Chest', '{"type": "text", "content": "In the northwest building, in the corner near the generator."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 6 AND display_order = 5), 
        '/assets/images/Eidos7/6-ConstructionZone/5-Locked Chest 3.jpg', 'Locked Legion Supply Chest', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (6, 20, 'Exospine - Protection-Type', '{"type": "text", "content": "In the northwest corner (to the right of the elevator and up the shipping crates). Pretty much above the Locked Supply Chest."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Protection-Type' AND location_id = 6 AND display_order = 6), 
        '/assets/images/Eidos7/6-ConstructionZone/6-Protection Type Exospine.jpg', 'Protection Type Exospine', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (6, 13, 'Legion Supply Box', '{"type": "text", "content": "Turn on the generator to power the elevator, and go up the lift. At the top, jump to the north for this supply box."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 6 AND display_order = 7), 
        '/assets/images/Eidos7/6-ConstructionZone/7-Crate 18.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 6 AND display_order = 7), 
        '/assets/images/Eidos7/6-ConstructionZone/7-Crate 18.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (6, 4, 'Memorystick (Legionnaire 212''s Question)', '{"type": "text", "content": "Beneath where the lift takes you to in the northwest corner. When going for the previous supply box, on your way back you''ll end up in this room where the corpse is."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Legionnaire 212''s Question)' AND location_id = 6 AND display_order = 8), 
        '/assets/images/Eidos7/6-ConstructionZone/8-Memorystick (Legionnaire 212''s Question).jpg', 'Memorystick (Legionnaire 212''s Question)', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (6, 4, 'Memorystick (Athena 82''s Orders)', '{"type": "text", "content": "In the northern area of the Construction Zone (after passing a statue), there''s a corpse there, inside the building."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Athena 82''s Orders)' AND location_id = 6 AND display_order = 9), 
        '/assets/images/Eidos7/6-ConstructionZone/9-Memorystick (Athena 82''s Orders).jpg', 'Memorystick (Athena 82''s Orders)', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (6, 13, 'Legion Supply Box', '{"type": "text", "content": "Head out the window to the south from the crate with the crane ID card, and look to the southwest. Run and jump onto that rope and swing to the platforms over the other side. Then, jump onto the scaffolding to the southwest. The supply crate is a level down from the top of said scaffolding."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 6 AND display_order = 10), 
        '/assets/images/Eidos7/6-ConstructionZone/10-Crate 19.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (6, 12, 'Robot - Tumbler Expansion Module', '{"type": "text", "content": "South of the supply camp in the middle of the Construction Zone is this robot with a Tumbler Expansion Module."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 6 AND display_order = 11), 
        '/assets/images/Eidos7/6-ConstructionZone/11-Robot 4.jpg', 'Robot - Tumbler Expansion Module', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (6, 3, 'Can - Potential Blast', '{"type": "text", "content": "In the east-southeast corner (near another lift), climb the wrecked building to the top, and you''ll find a can on the table there."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Potential Blast' AND location_id = 6 AND display_order = 12), 
        '/assets/images/Eidos7/6-ConstructionZone/12-Can - Potential Blast.1.jpg', 'Can - Potential Blast', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Potential Blast' AND location_id = 6 AND display_order = 12), 
        '/assets/images/Eidos7/6-ConstructionZone/12-Can - Potential Blast.2.jpg', 'Can - Potential Blast', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (6, 4, 'Memorystick (Legionnaire 326''s Transmission)', '{"type": "text", "content": "Use the crane to position the large steel beam to the east (near the digger). Then, use it to jump up to the two openings in the wall. The left one leads to a floor with a corpse to get this transmission from."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick (Legionnaire 326''s Transmission)' AND location_id = 6 AND display_order = 13), 
        '/assets/images/Eidos7/6-ConstructionZone/13-Memorystick (Legionnaire 326''s Transmission).jpg', 'Memorystick (Legionnaire 326''s Transmission)', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (6, 17, 'Body Core', '{"type": "text", "content": "Get back on the beam and jump into the other building. The Body Core is on the floor there."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 6 AND display_order = 14), 
        '/assets/images/Eidos7/6-ConstructionZone/14-Body Core 4.jpg', 'Body Core', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (6, 18, 'Earrings - Crimson Tear', '{"type": "text", "content": "Turn around and use the yellow ledges to climb up to the next floor. The earrings are in the back of the room."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Earrings - Crimson Tear' AND location_id = 6 AND display_order = 15), 
        '/assets/images/Eidos7/6-ConstructionZone/15-Crimson Tear Earrings.jpg', 'Crimson Tear Earrings', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (6, 13, 'Legion Supply Box', '{"type": "text", "content": "Use the crane to destroy the wall to the left of the exit out of the Construction Zone, then head round to grab it before moving on."}', 16);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 6 AND display_order = 16), 
        '/assets/images/Eidos7/6-ConstructionZone/16-Crate 20.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 6 AND display_order = 16), 
        '/assets/images/Eidos7/6-ConstructionZone/16-Crate 20.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (6, 15, 'Nano Suit - Red Passion', '{"type": "text", "content": "Use the crane to destroy the right wall this time, and use the beam to get across into that room. This Nano Suit is inside."}', 17);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Red Passion' AND location_id = 6 AND display_order = 17), 
        '/assets/images/Eidos7/6-ConstructionZone/17-Red Passion Nano Suit.1.jpg', 'Nano Suit - Red Passion', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Red Passion' AND location_id = 6 AND display_order = 17), 
        '/assets/images/Eidos7/6-ConstructionZone/17-Red Passion Nano Suit.2.jpg', 'Red Passion Nano Suit', 2);

-- Eidos 7 - Crater

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (8, 4, 'Memorystick - Legionnaire 274''s Memory', '{"type": "text", "content": "By a rock as soon as you enter the Crater area (near the small bit of water)."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 274''s Memory' AND location_id = 8 AND display_order = 1), 
        '/assets/images/Eidos7/8-Crater/1-Memorystick (Legionnaire 274''s Memory).jpg', 'Memorystick (Legionnaire 274''s Memory)', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (8, 1, 'Supply Camp - Crater', '{"type": "text", "content": "Just to the right, up the rocks, when you enter the Crater area. Hard to miss."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Crater' AND location_id = 8 AND display_order = 2), 
        '/assets/images/Eidos7/8-Crater/2-Supply Camp (Crater).jpg', 'Supply Camp (Crater)', 1);

-- Eidos 7 - Eidos 7 (Continued)

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (9, 5, 'Locked Supply Chest', '{"type": "text", "content": "In Bar 99 on Silent Street, you can now open this cache if you picked up the \u201cLegion''s Secret Stash\u201d Request. Code is 1228."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 9 AND display_order = 1), 
        '/assets/images/Eidos7/9-Eidos7Continued/1-Legion Supply Chest.1.jpg', 'Locked Legion Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 9 AND display_order = 1), 
        '/assets/images/Eidos7/9-Eidos7Continued/1-Legion Supply Chest.2.jpg', 'Locked Legion Supply Chest', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (9, 2, 'Document - Books - The Words of the Devout Felix', '{"type": "text", "content": " As part of \u201cThe Words of the Mother Sphere\u201d side quest (from Francis, at the book shop in Xion). In the library near Silent Street."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Books - The Words of the Devout Felix' AND location_id = 9 AND display_order = 2), 
        '/assets/images/Eidos7/9-Eidos7Continued/2-Document - Books - The Words of the Devout Felix.1.jpg', 'Document - Books - The Words of the Devout Felix', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Books - The Words of the Devout Felix' AND location_id = 9 AND display_order = 2), 
        '/assets/images/Eidos7/9-Eidos7Continued/2-Document - Books - The Words of the Devout Felix.2.jpg', 'Document - Books - The Words of the Devout Felix', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (9, 2, 'Documents - Announcements - :::WARNING:::', '{"type": "text", "content": "Head back to the Hall of Records, and interact with the plinth in the plaza, as part of the \u201cTaboo\u201d side quest."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Documents - Announcements - :::WARNING:::' AND location_id = 9 AND display_order = 3), 
        '/assets/images/Eidos7/9-Eidos7Continued/3-Document - Announcements - WARNING.1.jpg', 'Documents - Announcements - :::WARNING:::', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Documents - Announcements - :::WARNING:::' AND location_id = 9 AND display_order = 3), 
        '/assets/images/Eidos7/9-Eidos7Continued/3-Document - Announcements - WARNING.2.jpg', 'Documents - Announcements - :::WARNING:::', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (9, 18, 'Earrings - Hanging Memory', '{"type": "text", "content": "Return to where you fought the Gigas when you have the \u201cGenerous Drop Pod\u201d Request."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Earrings - Hanging Memory' AND location_id = 9 AND display_order = 4), 
        '/assets/images/Eidos7/9-Eidos7Continued/4-Earrings - Hanging Memory.1.jpg', 'Earrings - Hanging Memory', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Earrings - Hanging Memory' AND location_id = 9 AND display_order = 4), 
        '/assets/images/Eidos7/9-Eidos7Continued/4-Earrings - Hanging Memory.2.jpg', 'Earrings - Hanging Memory', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (9, 13, 'Legion Supply Box', '{"type": "text", "content": "In the northwest corner of the Flooded Commercial Sector, if you drop down to the near where you lifted the floodgates."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 9 AND display_order = 5), 
        '/assets/images/Eidos7/9-Eidos7Continued/5-Legion Supply Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (9, 13, 'Legion Supply Box', '{"type": "text", "content": "Take the ramp down into the proper main area of the commercial sector. There''s a supply box in the northwest corner."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 9 AND display_order = 6), 
        '/assets/images/Eidos7/9-Eidos7Continued/6-Legion Supply Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (9, 12, 'Robot - Passcode - aaaddK', '{"type": "text", "content": "In the path to the east of the Wayfield Diner (pretty much underneath it) is a robot with the passcode needed for the next chest."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Passcode - aaaddK' AND location_id = 9 AND display_order = 7), 
        '/assets/images/Eidos7/9-Eidos7Continued/7-Robot - Passcode - aaaddK.jpg', 'Robot - Passcode', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (9, 5, 'Locked Supply Chest', '{"type": "text", "content": "In the southwest corner, on one of the balconies, inside the Wayfield Diner (pretty much above the previous robot)."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 9 AND display_order = 8), 
        '/assets/images/Eidos7/9-Eidos7Continued/8-Locked Legion Supply Chest.jpg', 'Locked Legion Supply Chest', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (9, 3, 'Can - Elixir Carrot', '{"type": "text", "content": "Head north from where you found the robot and inside The Red Grill (with a flashing neon red closed sign) is this can."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Elixir Carrot' AND location_id = 9 AND display_order = 9), 
        '/assets/images/Eidos7/9-Eidos7Continued/9-Can - Elixir Carrot.1.jpg', 'Can - Elixir Carrot', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Elixir Carrot' AND location_id = 9 AND display_order = 9), 
        '/assets/images/Eidos7/9-Eidos7Continued/9-Can - Elixir Carrot.2.jpg', 'Can - Elixir Carrot', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (9, 15, 'Nano Suit - Wasteland Adventurer', '{"type": "text", "content": "Head down a level by the nearby rope (south of the can) and in the southwest corner is this Nano Suit design."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Wasteland Adventurer' AND location_id = 9 AND display_order = 10), 
        '/assets/images/Eidos7/9-Eidos7Continued/10-Nano Suit - Wasteland Adventurer.jpg', 'Nano Suit - Wasteland Adventurer', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (9, 13, 'Legion Supply Box', '{"type": "text", "content": "Follow the path around to the northwest and climb the ramps to the top. There''s a supply chest up there."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 9 AND display_order = 11), 
        '/assets/images/Eidos7/9-Eidos7Continued/11-Legion Supply Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (9, 3, 'Can - Cryo Original', '{"type": "text", "content": "Head back down and follow the path around to the southeast. After passing the liquor store, you''ll come across a Fizz machine on the left."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo Original' AND location_id = 9 AND display_order = 12), 
        '/assets/images/Eidos7/9-Eidos7Continued/12-Can - Cryo Original.1.jpg', 'Can - Cryo Original', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Can - Cryo Original' AND location_id = 9 AND display_order = 12), 
        '/assets/images/Eidos7/9-Eidos7Continued/12-Can - Cryo Original.2.jpg', 'Can - Cryo Original', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (9, 4, 'Memorystick - She Is Here', '{"type": "text", "content": "As part of the Oblivion side quest, you''ll head to Warehouse 77, where you''ll find this inside along with the next 5 collectibles."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - She Is Here' AND location_id = 9 AND display_order = 13), 
        '/assets/images/Eidos7/9-Eidos7Continued/13-Memorystick - .jpg', 'Memorystick - She Is Here', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - She Is Here' AND location_id = 9 AND display_order = 13), 
        '/assets/images/Eidos7/9-Eidos7Continued/13-Memorystick - She Is Here.jpg', 'Memorystick - She Is Here', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (9, 4, 'Memorystick - Help', '{"type": "text", "content": "Inside Warehouse 77, at the bottom of the ladder."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Help' AND location_id = 9 AND display_order = 14), 
        '/assets/images/Eidos7/9-Eidos7Continued/14-Memorystick - Help.jpg', 'Memorystick - Help', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (9, 2, 'Document - Series - Book of Faith and Wisdom 2:3-6', '{"type": "text", "content": "Inside Warehouse 77, also at the bottom of the ladder."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series - Book of Faith and Wisdom 2:3-6' AND location_id = 9 AND display_order = 15), 
        '/assets/images/Eidos7/9-Eidos7Continued/15-Memorystick - Book of Faith and Wisdom 2-3-6.jpg', 'Document - Series - Book of Faith and Wisdom 2:3-6', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (9, 4, 'Memorystick - A Melancholic Cry', '{"type": "text", "content": "Inside Warehouse 77, also at the bottom of the ladder."}', 16);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - A Melancholic Cry' AND location_id = 9 AND display_order = 16), 
        '/assets/images/Eidos7/9-Eidos7Continued/16-Memorystick - A Melancholic Cry.jpg', 'Memorystick - A Melancholic Cry', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (9, 4, 'Memorystick - Memory of Despair', '{"type": "text", "content": "Inside Warehouse 77, also at the bottom of the ladder."}', 17);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Memory of Despair' AND location_id = 9 AND display_order = 17), 
        '/assets/images/Eidos7/9-Eidos7Continued/17-Memorystick - Memory of Despair.jpg', 'Memorystick - Memory of Despair', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (9, 4, 'Memorystick - Voice of Objection', '{"type": "text", "content": "Inside Warehouse 77, on the small section above the other bodies."}', 18);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Voice of Objection' AND location_id = 9 AND display_order = 18), 
        '/assets/images/Eidos7/9-Eidos7Continued/18-Memorystick - Voice of Objection.jpg', 'Memorystick - Voice of Objection', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (9, 2, 'Document - Journal - Survival Journal', '{"type": "text", "content": "Part of the \u201cEnd of the Nightmare\u201d side quest in the previously flooded Commercial District (have to lift the floodgates, fast-travel to a different place, and then return to Eidos 7 for this one to appear).  North side of the river, at the lowest level you can go"}', 19);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - Survival Journal' AND location_id = 9 AND display_order = 19), 
        '/assets/images/Eidos7/9-Eidos7Continued/19-Document - Journal - Survival Journal.1.jpg', 'Document - Journal (Survival Journal)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - Survival Journal' AND location_id = 9 AND display_order = 19), 
        '/assets/images/Eidos7/9-Eidos7Continued/19-Document - Journal - Survival Journal.2.jpg', 'Document - Journal (Survival Journal)', 2);

-- Eidos 7 - Flooded Commercial Sector

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (4, 1, 'Legion Camp', '{"type": "text", "content": "At the base of the stairs leading out of the monorail station."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 4 AND display_order = 1), 
        '/assets/images/Eidos7/4-FloodedCommercialSector/1-Legion Camp 5.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (4, 4, 'Memorystick - Legionnaire 272''s Eyewitness Account', '{"type": "text", "content": "Head north from the bottom of the monorail stairs (away from the objective), and there''s a corpse there on the left with this memory stick."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 272''s Eyewitness Account' AND location_id = 4 AND display_order = 2), 
        '/assets/images/Eidos7/4-FloodedCommercialSector/2-Memorystick (Legionnaire 272''s Eyewitness Account).jpg', 'Memorystick - Legionnaire 272''s Eyewitness Account', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (4, 14, 'Beta Core', '{"type": "text", "content": "Further north, near the northernmost chainlink fence is a corpse with this Beta Core."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 4 AND display_order = 3), 
        '/assets/images/Eidos7/4-FloodedCommercialSector/3-Beta Core 2.jpg', 'Beta Core', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (4, 13, 'Legion Supply Box', '{"type": "text", "content": "Northeast of the monorail station, over the river, head into the far northeast corner. Drop down onto the ledges and shimmy to the east. You''ll reach a plaza with a Mutated Hydra. In the east corner is Caliente, a store with this supply box."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 4 AND display_order = 4), 
        '/assets/images/Eidos7/4-FloodedCommercialSector/4-Crate 12.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (4, 20, 'Exospine - Grenadier-Type', '{"type": "text", "content": "On the northern side of the plaza is a walkway. At the end is a crate with this Exospine in it."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Grenadier-Type' AND location_id = 4 AND display_order = 5), 
        '/assets/images/Eidos7/4-FloodedCommercialSector/5-Grenadier-Type Exospine.jpg', 'Grenadier-Type Exospine', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (4, 7, 'Passcode - aau0B0', '{"type": "text", "content": "Head back across the ledges you used to get to this plaza and continue south. Climb up the yellow grabbable ledges and there''ll be a group of stone monsters (1 real) by this corpse, underneath the Barker Drugs sign."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Passcode - aau0B0' AND location_id = 4 AND display_order = 6), 
        '/assets/images/Eidos7/4-FloodedCommercialSector/6-Passcode - aau0B0.1.jpg', 'Passcode - aau0B0', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Passcode - aau0B0' AND location_id = 4 AND display_order = 6), 
        '/assets/images/Eidos7/4-FloodedCommercialSector/6-Passcode - aau0B0.2.jpg', 'Passcode - aau0B0', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (4, 1, 'Supply Camp - Plaza Entryway', '{"type": "text", "content": "After using the passcode to unlock the 317 gate, head through and the supply camp is straight ahead."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Plaza Entryway' AND location_id = 4 AND display_order = 7), 
        '/assets/images/Eidos7/4-FloodedCommercialSector/7-Supply Camp (Plaza Entryway).jpg', 'Supply Camp - Plaza Entryway', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (4, 13, 'Legion Supply Box', '{"type": "text", "content": "East of the plaza entryway camp, by an enemy ambush of sorts. Hard to miss this one."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 4 AND display_order = 8), 
        '/assets/images/Eidos7/4-FloodedCommercialSector/8-Crate 13.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (4, 4, 'Memorystick - Memory of a Believer', '{"type": "text", "content": "Further east from the supply box, to the right of the ladder."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Memory of a Believer' AND location_id = 4 AND display_order = 9), 
        '/assets/images/Eidos7/4-FloodedCommercialSector/9-Memorystick (Memory of a Believer).1.jpg', 'Memorystick - Memory of a Believer', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Memory of a Believer' AND location_id = 4 AND display_order = 9), 
        '/assets/images/Eidos7/4-FloodedCommercialSector/9-Memorystick (Memory of a Believer).2.jpg', 'Memorystick - Memory of a Believer', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (4, 4, 'Memorystick - Legionnaire 249''s Memory', '{"type": "text", "content": "In the next area, having dropped down after climbing up, in the north corner there''s a pool with lily pads. The corpse is in the water."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 249''s Memory' AND location_id = 4 AND display_order = 10), 
        '/assets/images/Eidos7/4-FloodedCommercialSector/10-Memorystick (Legionnaire 249''s Memory).1.jpg', 'Memorystick - Legionnaire 249''s Memory', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 249''s Memory' AND location_id = 4 AND display_order = 10), 
        '/assets/images/Eidos7/4-FloodedCommercialSector/10-Memorystick (Legionnaire 249''s Memory).2.jpg', 'Memorystick - Legionnaire 249''s Memory', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (4, 4, 'Memorystick - Bitter Suicide Note', '{"type": "text", "content": "After using the clock to open the Club Bpemr door (1225), there''s a corpse straight ahead, near a teapot and a small camp."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Bitter Suicide Note' AND location_id = 4 AND display_order = 11), 
        '/assets/images/Eidos7/4-FloodedCommercialSector/11-Memorystick (Bitter Suicide Note).jpg', 'Memorystick - Bitter Suicide Note', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (4, 1, 'Legion Camp', '{"type": "text", "content": "After climbing the ladder and dropping down, there''s a camp to the west."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 4 AND display_order = 12), 
        '/assets/images/Eidos7/4-FloodedCommercialSector/12-Legion Camp 6.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (4, 4, 'Memorystick - Max''s Memory', '{"type": "text", "content": "To the northeast of the camp, up the stairs, there''s a corpse there near a statue."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Max''s Memory' AND location_id = 4 AND display_order = 13), 
        '/assets/images/Eidos7/4-FloodedCommercialSector/13-Memorystick (Max''s Memory).jpg', 'Memorystick - Max''s Memory', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (4, 16, 'Drone Appearance - Armoured Pack', '{"type": "text", "content": "Before heading up and over the bridge to the otherside of the abyss, from the camp head west and down. Use the poles to cross the gap and you''ll come to an area with a Barnacle. Defeat it, and in a small enclosure to the southwest is this skin)."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Drone Appearance - Armoured Pack' AND location_id = 4 AND display_order = 14), 
        '/assets/images/Eidos7/4-FloodedCommercialSector/14-Armoured Pack (Drone Skin-Appearance Pack).1.jpg', 'Drone Appearance - Armoured Pack', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Drone Appearance - Armoured Pack' AND location_id = 4 AND display_order = 14), 
        '/assets/images/Eidos7/4-FloodedCommercialSector/14-Armoured Pack (Drone Skin-Appearance Pack).2.jpg', 'Drone Appearance - Armoured Pack', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Drone Appearance - Armoured Pack' AND location_id = 4 AND display_order = 14), 
        '/assets/images/Eidos7/4-FloodedCommercialSector/14-Armoured Pack (Drone Skin-Appearance Pack).3.jpg', 'Drone Appearance - Armoured Pack', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (4, 14, 'Beta Core', '{"type": "text", "content": "In the same area as the drone skin, on the northside, is a corpse with this beta core."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 4 AND display_order = 15), 
        '/assets/images/Eidos7/4-FloodedCommercialSector/15-Beta Core 3.jpg', 'Beta Core', 1);

-- Eidos 7 - Memory Tower

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (5, 13, 'Legion Supply Box', '{"type": "text", "content": "Northwest of where you enter the plaza, down a metal walkway, and into an alleyway. The box is there."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 5 AND display_order = 1), 
        '/assets/images/Eidos7/5-MemoryTower/1-Crate 14.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 5 AND display_order = 1), 
        '/assets/images/Eidos7/5-MemoryTower/1-Crate 14.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (5, 4, 'Memorystick - Artemis 132''s Credentials', '{"type": "text", "content": "South of the pillar (that leads to the Hall of Records) you see when you get into the area is a corpse."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Artemis 132''s Credentials' AND location_id = 5 AND display_order = 2), 
        '/assets/images/Eidos7/5-MemoryTower/2-Memorystick (Artemis 132''s Credentials).jpg', 'Memorystick - Artemis 132''s Credentials', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (5, 4, 'Memorystick - Artemis 8''s Orders / Passcode - yuak0k', '{"type": "text", "content": "To the east of the pillar in the plaza is another corpse."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Artemis 8''s Orders / Passcode - yuak0k' AND location_id = 5 AND display_order = 3), 
        '/assets/images/Eidos7/5-MemoryTower/3-Memorystick (Artemis 8''s Orders) & Passcode - yuak0k.jpg', 'Memorystick - Artemis 8''s Orders / Passcode - yuak0k', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (5, 4, 'Memorystick - Artemis 49''s Reply', '{"type": "text", "content": "On the south side of the area where you fought the Corrupter is a corpse with this memorystick."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Artemis 49''s Reply' AND location_id = 5 AND display_order = 4), 
        '/assets/images/Eidos7/5-MemoryTower/4-Memorystick (Artemis 49''s Reply).jpg', 'Memorystick - Artemis 49''s Reply', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (5, 14, 'Beta Core', '{"type": "text", "content": "In Northeast corner of the Corrupter battle area there''s an alleyway. Head down it slightly (just down the stairs), and to the right is a corpse with this Beta Core on it. Inside The Red Grill (with flashing neon ''closed'' sign)."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 5 AND display_order = 5), 
        '/assets/images/Eidos7/5-MemoryTower/5-Beta Core 4.jpg', 'Beta Core', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (5, 13, 'Legion Supply Box', '{"type": "text", "content": "In the northeast corner of the upstairs area is a Legion Supply Box."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 5 AND display_order = 6), 
        '/assets/images/Eidos7/5-MemoryTower/6-Crate 15.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 5 AND display_order = 6), 
        '/assets/images/Eidos7/5-MemoryTower/6-Crate 15.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (5, 12, 'Robot - Tumbler Expansion Module', '{"type": "text", "content": "At the end of the road (don''t go up the ladder yet) is a relic robot. Destroy it to get the Tumbler Expansion Module."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 5 AND display_order = 7), 
        '/assets/images/Eidos7/5-MemoryTower/7-Robot 3.jpg', 'Robot (Tumbler Expansion Module)', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (5, 1, 'Legion Camp', '{"type": "text", "content": "Up the ladder and to the north is the next camp."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 5 AND display_order = 8), 
        '/assets/images/Eidos7/5-MemoryTower/8-Legion Camp 7.jpg', 'Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (5, 4, 'Memorystick - Legionnaire 214''s Testament', '{"type": "text", "content": "Just to the north of the camp is a corpse with this memorystick."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 214''s Testament' AND location_id = 5 AND display_order = 9), 
        '/assets/images/Eidos7/5-MemoryTower/9-Memorystick (Legionnaire 214''s Testament).jpg', 'Memorystick - Legionnaire 214''s Testament', 1);

-- Eidos 7 - Parking Tower

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (2, 17, 'Body Core', '{"type": "text", "content": "In the Parking Tower, underneath the first set of stairs up."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 2 AND display_order = 1), 
        '/assets/images/Eidos7/2-ParkingTower/1-Body Core 1.1.jpg', 'Passcode - Eidos 7 - r0ar0a', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 2 AND display_order = 1), 
        '/assets/images/Eidos7/2-ParkingTower/1-Body Core 1.2.jpg', 'Passcode - Eidos 7 - r0ar0a', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (2, 1, 'Supply Camp - Parking Tower 2nd Floor', '{"type": "text", "content": "Up the set of stairs into the parking garage."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Parking Tower 2nd Floor' AND location_id = 2 AND display_order = 2), 
        '/assets/images/Eidos7/2-ParkingTower/2-Supply Camp (Parking Tower 2nd Floor).jpg', 'Supply Camp (Parking Tower 2nd Floor)', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (2, 1, 'Legion Camp', '{"type": "text", "content": "In the southwest corner of the Parking Tower roof."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 2 AND display_order = 3), 
        '/assets/images/Eidos7/2-ParkingTower/3-Legion Camp 3.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (2, 4, 'Memorystick - Legionnaire 204''s Memory', '{"type": "text", "content": "Down the southeast ramp from the roof is a corpse with this memorystick."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 204''s Memory' AND location_id = 2 AND display_order = 4), 
        '/assets/images/Eidos7/2-ParkingTower/4-Memorystick (Legionnaire 204''s Memory).jpg', 'Memorystick (Legionnaire 204''s Memory)', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (2, 13, 'Legion Supply Box', '{"type": "text", "content": "In the southwest corner of the parking lot third floor (opposite the previous memorystick, in the corner)."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 2 AND display_order = 5), 
        '/assets/images/Eidos7/2-ParkingTower/5-Crate 8.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (2, 20, 'Exospine - Chain-Type', '{"type": "text", "content": "In the northeast corner of the second floor inside the Parking Tower."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Chain-Type' AND location_id = 2 AND display_order = 6), 
        '/assets/images/Eidos7/2-ParkingTower/6-Chain-Type Exospine.1.jpg', 'Chain-Type Exospine', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Exospine - Chain-Type' AND location_id = 2 AND display_order = 6), 
        '/assets/images/Eidos7/2-ParkingTower/6-Chain-Type Exospine.2.jpg', 'Chain-Type Exospine', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (2, 1, 'Legion Camp', '{"type": "text", "content": "Opposite the exit of the parking garage, the camera will focus on it as you exit."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 2 AND display_order = 7), 
        '/assets/images/Eidos7/2-ParkingTower/7-Legion Camp 4.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (2, 13, 'Legion Supply Box', '{"type": "text", "content": "From the camp, head right to the corner of the building on your right. Climb up the yellow crate and shimmy around to the roof. Kill the Guardian, climb up again, kill the Cricket Slasher. In there is a Legion Supply Drop."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 2 AND display_order = 8), 
        '/assets/images/Eidos7/2-ParkingTower/8-Crate 9.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 2 AND display_order = 8), 
        '/assets/images/Eidos7/2-ParkingTower/8-Crate 9.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 2 AND display_order = 8), 
        '/assets/images/Eidos7/2-ParkingTower/8-Crate 9.3.jpg', 'Legion Supply Box', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (2, 2, 'Document - Messages - Memo', '{"type": "text", "content": "In the same room, on the wall."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Messages - Memo' AND location_id = 2 AND display_order = 9), 
        '/assets/images/Eidos7/2-ParkingTower/9-Document - Messages (Memo).jpg', 'Document - Messages (Memo)', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (2, 2, 'Document - The Truth, Article 3', '{"type": "text", "content": "Head north of the camp, and then head east at the end. In a building called Otenb Pomakc is a blue box where you''d usually find a newspaper. It''s basically underneath the room you just climbed to."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - The Truth, Article 3' AND location_id = 2 AND display_order = 10), 
        '/assets/images/Eidos7/2-ParkingTower/10-Document - The Truth, Article 3.jpg', 'Document - The Truth, Article 3', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (2, 4, 'Memorystick - Outcry to the Sky', '{"type": "text", "content": "Opposite the previous collectible, near a statue, you''ll find another human corpse with a memorystick."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Outcry to the Sky' AND location_id = 2 AND display_order = 11), 
        '/assets/images/Eidos7/2-ParkingTower/11-Memorystick (Outcry to the Sky).jpg', 'Memorystick - Outcry to the Sky', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (2, 17, 'Body Core', '{"type": "text", "content": "Head north from the previous two collectibles (towards Gate 6) and then head down the stairs to an underground area, before heading up the stairs straight ahead. At the far end of that area (north), near two explosive barrells and a Cosnia Kolzen sign is another human and another Body Core."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 2 AND display_order = 12), 
        '/assets/images/Eidos7/2-ParkingTower/12-Body Core 2.1.jpg', 'Body Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 2 AND display_order = 12), 
        '/assets/images/Eidos7/2-ParkingTower/12-Body Core 2.2.jpg', 'Body Core', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (2, 17, 'Body Core', '{"type": "text", "content": "Head southwest out of the Parking Tower and follow the alley around, on the corner is a small bar/pub with lights on inside. The Body Core is on a body inside the shop."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 2 AND display_order = 13), 
        '/assets/images/Eidos7/2-ParkingTower/13-Body Core 3.1.jpg', 'Body Core', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Body Core' AND location_id = 2 AND display_order = 13), 
        '/assets/images/Eidos7/2-ParkingTower/13-Body Core 3.2.jpg', 'Body Core', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (2, 5, 'Locked Supply Chest', '{"type": "text", "content": "South of the parking lot, near the previous body core is a locked chest. Contains Omnibolt & Fixed Damage Gear."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 2 AND display_order = 14), 
        '/assets/images/Eidos7/2-ParkingTower/14-Locked Chest 2.jpg', 'Locked Legion Supply Chest', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (2, 12, 'Robot - Drone Upgrade Module x2', '{"type": "text", "content": "In the same area as the previous collectibles. To the north by the fence/gate is a treasure/relic lootbot."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Drone Upgrade Module x2' AND location_id = 2 AND display_order = 15), 
        '/assets/images/Eidos7/2-ParkingTower/15-Robot 2.jpg', 'Robot - Drone Upgrade Module x2', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (2, 4, 'Memorystick - Legionnaire 302''s Sorrow', '{"type": "text", "content": "From the camp, head left and head east this time. Next to the two enemies who ambush you past the bus, use the yellow box on the left to climb the wall and drop into the alley nearby. The human corpse and memorystick is at the west side of the alley."}', 16);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 302''s Sorrow' AND location_id = 2 AND display_order = 16), 
        '/assets/images/Eidos7/2-ParkingTower/16-Memorystick (Legionnaire 302''s Sorrow).1.jpg', 'Memorystick - Legionnaire 302''s Sorrow', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 302''s Sorrow' AND location_id = 2 AND display_order = 16), 
        '/assets/images/Eidos7/2-ParkingTower/16-Memorystick (Legionnaire 302''s Sorrow).2.jpg', 'Memorystick - Legionnaire 302''s Sorrow', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (2, 13, 'Legion Supply Box', '{"type": "text", "content": "North of gate 12, which is east and then north from the camp, is a Dozer and a car with a fusion core, this box is right next to the car."}', 17);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 2 AND display_order = 17), 
        '/assets/images/Eidos7/2-ParkingTower/17-Crate 10.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (2, 4, 'Memorystick - Request to Mother Sphere', '{"type": "text", "content": "East and then north from the camp (also north of gate 1), on the eastern wall, under cover, is a body with this memorystick."}', 18);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Request to Mother Sphere' AND location_id = 2 AND display_order = 18), 
        '/assets/images/Eidos7/2-ParkingTower/18-Memorystick (Request to Mother Sphere).jpg', 'Memorystick - Request to Mother Sphere', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (2, 13, 'Legion Supply Box', '{"type": "text", "content": "Head slightly north of the corpse and turn around and climb the side of the building. There''s a supply crate up top."}', 19);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 2 AND display_order = 19), 
        '/assets/images/Eidos7/2-ParkingTower/19-Crate 11.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 2 AND display_order = 19), 
        '/assets/images/Eidos7/2-ParkingTower/19-Crate 11.2.jpg', 'Legion Supply Box', 2);

-- Eidos 7 - Silent Street

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (1, 7, 'Passcode - Eidos 7 - r0ar0a', '{"type": "text", "content": "In the first garage/storage room on the left on Silent Street, where the Creepers crash out of the wall."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Passcode - Eidos 7 - r0ar0a' AND location_id = 1 AND display_order = 1), 
        '/assets/images/Eidos7/1-SilentStreet/1-Passcode - r0ar0a.1.jpg', 'Passcode - Eidos 7 - r0ar0a', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Passcode - Eidos 7 - r0ar0a' AND location_id = 1 AND display_order = 1), 
        '/assets/images/Eidos7/1-SilentStreet/1-Passcode - r0ar0a.2.jpg', 'Passcode - Eidos 7 - r0ar0a', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (1, 4, 'Memorystick - Legionnaire 451''s Resolution', '{"type": "text", "content": "After going through the gate, climb up to the right and follow that path to the end for this collectible."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 451''s Resolution' AND location_id = 1 AND display_order = 2), 
        '/assets/images/Eidos7/1-SilentStreet/2-Memorystick - Legionnaire 451s resolution.1.jpg', 'Memorystick - Legionnaire 451''s Resolution', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 451''s Resolution' AND location_id = 1 AND display_order = 2), 
        '/assets/images/Eidos7/1-SilentStreet/2-Memorystick - Legionnaire 451s resolution.2.jpg', 'Memorystick - Legionnaire 451''s Resolution', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (1, 12, 'Robot - Tumbler Expansion Module', '{"type": "text", "content": "Southeast from where you are, follow the alleyway to the end and there''ll be a robot there to destroy for loot."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 1 AND display_order = 3), 
        '/assets/images/Eidos7/1-SilentStreet/3-Robot 1.jpg', 'Robot - Tumbler Expansion Module', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (1, 13, 'Legion Supply Box', '{"type": "text", "content": "In the water after passing through the gate."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 1 AND display_order = 4), 
        '/assets/images/Eidos7/1-SilentStreet/4-Crate 1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (1, 1, 'Legion Camp', '{"type": "text", "content": "Back on Silent Street, down there on the left, near to where you just went swimming"}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 1 AND display_order = 5), 
        '/assets/images/Eidos7/1-SilentStreet/5-Legion Camp 1.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (1, 13, 'Legion Supply Box', '{"type": "text", "content": "To the left of the bridge in a garage, before going across, where you fight your first Cricket Slasher - hit the car and loot the for the Micro Drive."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 1 AND display_order = 6), 
        '/assets/images/Eidos7/1-SilentStreet/6-Crate 2.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (1, 13, 'Legion Supply Box', '{"type": "text", "content": "To the left, when you''re halfway across the bridge. Jump over the gap to reach the rooftops and follow to the back."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 1 AND display_order = 7), 
        '/assets/images/Eidos7/1-SilentStreet/7-Crate 3.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 1 AND display_order = 7), 
        '/assets/images/Eidos7/1-SilentStreet/7-Crate 3.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (1, 13, 'Legion Supply Box', '{"type": "text", "content": "To the left of the bridge, drop down, kill the two Cricket Slashers and then the Hydra and open the box to the north. Inside is an Omnibolt, the Combo Attack Enhancement Gear (+14%)."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 1 AND display_order = 8), 
        '/assets/images/Eidos7/1-SilentStreet/8-Crate 4.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (1, 13, 'Legion Supply Box', '{"type": "text", "content": "To the right after the bridge, near where the Scan tutorial. Climb up near the scaffolding on the right hand side of the road to the top."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 1 AND display_order = 9), 
        '/assets/images/Eidos7/1-SilentStreet/9-Crate 5.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 1 AND display_order = 9), 
        '/assets/images/Eidos7/1-SilentStreet/9-Crate 5.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (1, 14, 'Beta Core', '{"type": "text", "content": "After the ambush with the Mutated Creeper, Creepers and finally the Heavy Guardian, head down the alley to the north-northeast corner and follow it round to the left. There, near a Guardian, is the Beta Core (needed to upgrade your max beta energy)."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Beta Core' AND location_id = 1 AND display_order = 10), 
        '/assets/images/Eidos7/1-SilentStreet/10-Beta Core 1.jpg', 'Beta Core', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (1, 13, 'Legion Supply Box', '{"type": "text", "content": "Where the ambush took place, head up to the top of the building in the southeast, using the yellow ledges on the southeast wall."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 1 AND display_order = 11), 
        '/assets/images/Eidos7/1-SilentStreet/11-Crate 6.1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 1 AND display_order = 11), 
        '/assets/images/Eidos7/1-SilentStreet/11-Crate 6.2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (1, 4, 'Memorystick - The Last Words of the Hopeless / Passcode - B0ak0r', '{"type": "text", "content": "Head the correct way after the ambush, and as you get onto the balcony, and before you grab onto the poles, there''s a corpse on your left with this passcode and memorystick."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - The Last Words of the Hopeless / Passcode - B0ak0r' AND location_id = 1 AND display_order = 12), 
        '/assets/images/Eidos7/1-SilentStreet/12-Memorystick & Passcode (The Last Words of the Hopeless) - B0ak0r.jpg', 'Memorystick - The Last Words of the Hopeless / Passcode - B0ak0r', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (1, 13, 'Legion Supply Box', '{"type": "text", "content": "In the caged off area in the water section with the ladder. There''s a hole in the fence you can use to get in."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 1 AND display_order = 13), 
        '/assets/images/Eidos7/1-SilentStreet/13-Crate 7.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (1, 4, 'Memorystick - Louis''s Testimony', '{"type": "text", "content": "In the same area as the water and the ladder, climb up the yellow ledges on the northwest wall of the building at the far end. There''s a human corpse on the roof."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Louis''s Testimony' AND location_id = 1 AND display_order = 14), 
        '/assets/images/Eidos7/1-SilentStreet/14-Memorystick (Louis Testimony).1.jpg', 'Memorystick - Louis''s Testimony', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Louis''s Testimony' AND location_id = 1 AND display_order = 14), 
        '/assets/images/Eidos7/1-SilentStreet/14-Memorystick (Louis Testimony).2.jpg', 'Memorystick - Louis''s Testimony', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (1, 1, 'Legion Camp', '{"type": "text", "content": "Up the ladder from the water will be a camp straight ahead."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 1 AND display_order = 15), 
        '/assets/images/Eidos7/1-SilentStreet/15-Legion Camp 2.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (1, 5, 'Locked Supply Chest', '{"type": "text", "content": "From the camp, head down the ladder and go west to Barker Drugs. The chest is in there."}', 16);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 1 AND display_order = 16), 
        '/assets/images/Eidos7/1-SilentStreet/16-Locked Chest & Memory Stick.1.jpg', 'Locked Legion Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 1 AND display_order = 16), 
        '/assets/images/Eidos7/1-SilentStreet/16-Locked Chest 1.2.jpg', 'Locked Legion Chest', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (1, 4, 'Memorystick - Lament of Despair', '{"type": "text", "content": "On a corpse in the back of the same room as the locked chest"}', 17);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Lament of Despair' AND location_id = 1 AND display_order = 17), 
        '/assets/images/Eidos7/1-SilentStreet/17-Memorystick (Lament of Despair).jpg', 'Memorystick - Lament of Despair', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (1, 2, 'Document - Series - Plastic Hearts, Vol. 3', '{"type": "text", "content": "After heading through the door (using the Fusion Cell), head left, defeat the Barnacle, and this document is a book on the shelf in the southeast corner."}', 18);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Series - Plastic Hearts, Vol. 3' AND location_id = 1 AND display_order = 18), 
        '/assets/images/Eidos7/1-SilentStreet/18-Document - Series (Plastic Hearts, Volume 3).jpg', 'Document - Series - Plastic Hearts, Vol. 3', 1);

-- Eidos 9 - Atelier

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (51, 13, 'Legion Supply Box', '{"type": "text", "content": "After going down the red slide and reaching the floating cargo containers, right before jumping onto the main island, you can jump to the half-submerged cargo container. You''ll land in the water and have to swim a little bit to the cargo container, but you shouldn''t die depending on how far you managed to jump. From here, jump towards the smaller island, where there will be a crate behind the rubble."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 51 AND display_order = 1), 
        '/assets/images/Eidos_9/3_Atelier/1_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 51 AND display_order = 1), 
        '/assets/images/Eidos_9/3_Atelier/1_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (51, 1, 'Legion Camp', '{"type": "text", "content": "Once you reach the Atelier, the camp will be on the pathway around to the entrance."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 51 AND display_order = 2), 
        '/assets/images/Eidos_9/3_Atelier/2_Legion_Camp_1.jpg', 'Legion Camp', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 51 AND display_order = 2), 
        '/assets/images/Eidos_9/3_Atelier/2_Legion_Camp_2.jpg', 'Legion Camp', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (51, 2, 'Document - Messages - What Will You Choose', '{"type": "text", "content": "On the ground inside the Atelier."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Messages - What Will You Choose' AND location_id = 51 AND display_order = 3), 
        '/assets/images/Eidos_9/3_Atelier/3_Document_Messages_What_Will_You_Choose.jpg', 'Document', 1);

-- Eidos 9 - Fallen Overpass

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 5, 'Locked Supply Chest', '{"type": "text", "content": "As soon as you land on Eidos 9, there will be a chest behind the Tetrapod. You''ll need to do a sound puzzle to open it."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 49 AND display_order = 1), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/1_Locked_Supply_Chest.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 4, 'Memorystick - Legionnaire 158''s Memory', '{"type": "text", "content": "Once you jump onto the highway, the corpse with the memory stick will be leaning against one of the cars on the right side."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 158''s Memory' AND location_id = 49 AND display_order = 2), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/2_Memorystick_Legionnaire_158''s_Memory.jpg', 'Memorystick - Legionnaire 158''s Memory', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 13, 'Legion Supply Box', '{"type": "text", "content": "After destroying the first Cocoon, go through the door and there will be a supply box at the end of the hallway."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 49 AND display_order = 3), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/3_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 13, 'Legion Supply Box', '{"type": "text", "content": "Jump over to the next roof and go through the door. Go to the right to find another supply box."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 49 AND display_order = 4), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/4_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 4, 'Memorystick - Legionnaire 196''s Report', '{"type": "text", "content": "From the crate, go the other way and there will be a corpse with the memory stick by the hole in the wall."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 196''s Report' AND location_id = 49 AND display_order = 5), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/5_Memorystick_Legionnaire_196''s_Report.jpg', 'Memorystick - Legionnaire 196''s Report', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 15, 'Nano Suit - Planet Diving Suit (6th)', '{"type": "text", "content": "From the second Cocoon, drop down the yellow ledges and you''ll be able to jump over to an island-like area where there will be a Drone Upgrade Module on top of a car. From there, jump across to the building with the pillars. You''ll have to swim through the water for a little bit which will slowly kill you, but you''ll make it there before you die. Once you''re across, climb up to the top from the yellow ledges on the side. Once you''re on the roof, jump up to the top and go through the door. The crate will be to the left once you''re inside. (If you pre-ordered the game, and already got the nano suit out of the pre-order crate, you''ll only get Vitcoins out of this crate instead)."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Planet Diving Suit (6th)' AND location_id = 49 AND display_order = 6), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/6_Nano_Suit_Planet_Diving_Suit_6th_1.jpg', 'Nano Suit - Planet Diving Suit (6th)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Planet Diving Suit (6th)' AND location_id = 49 AND display_order = 6), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/6_Nano_Suit_Planet_Diving_Suit_6th_2.jpg', 'Nano Suit - Planet Diving Suit (6th)', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Planet Diving Suit (6th)' AND location_id = 49 AND display_order = 6), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/6_Nano_Suit_Planet_Diving_Suit_6th_3.jpg', 'Nano Suit - Planet Diving Suit (6th)', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Planet Diving Suit (6th)' AND location_id = 49 AND display_order = 6), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/6_Nano_Suit_Planet_Diving_Suit_6th_4.jpg', 'Nano Suit - Planet Diving Suit (6th)', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Planet Diving Suit (6th)' AND location_id = 49 AND display_order = 6), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/6_Nano_Suit_Planet_Diving_Suit_6th_5.jpg', 'Nano Suit - Planet Diving Suit (6th)', 5);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 13, 'Legion Supply Box', '{"type": "text", "content": "Head to the building to the south and into the southeast corner to find more supplies."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 49 AND display_order = 7), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/7_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 49 AND display_order = 7), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/7_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 13, 'Legion Supply Box', '{"type": "text", "content": "Before you head to the objective, where you have to run up the sign, don''t. Instead go southwest and jump across the containers in the ocean until you reach the end."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 49 AND display_order = 8), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/8_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 49 AND display_order = 8), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/8_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 12, 'Robot - Document - Promotions - Eidos 9, Of You and Mother', '{"type": "text", "content": "There''s also a robot here that drops a document."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Document - Promotions - Eidos 9, Of You and Mother' AND location_id = 49 AND display_order = 9), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/9_Robot_Document_Promotions_Eidos_9_Of_You_and_Mother.jpg', 'Robot - Document - Promotions - Eidos 9, Of You and Mother', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 1, 'Legion Camp', '{"type": "text", "content": "After killing the first 3 Cocoons, and on your way to the objective, just after Adam tells you there''s 6 more, there''s a camp on the left."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 49 AND display_order = 10), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/10_Legion_Camp.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 13, 'Legion Supply Box', '{"type": "text", "content": "After fighting the Dozer on the highway to the north of the Camp, there''s a chest behind the car on the left."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 49 AND display_order = 11), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/11_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 4, 'Memorystick - Legionnaire 192''s Memory', '{"type": "text", "content": "From the previous crate, go across to the other rooftop with the Cocoon and then climb onto the roof to the right. The corpse with the memory stick will be on the right side."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 192''s Memory' AND location_id = 49 AND display_order = 12), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/12_Memorystick_Legionnaire_192''s_Memory_1.jpg', 'Memorystick - Legionnaire 192''s Memory', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 192''s Memory' AND location_id = 49 AND display_order = 12), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/12_Memorystick_Legionnaire_192''s_Memory_2.jpg', 'Memorystick - Legionnaire 192''s Memory', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 2, 'Document - Messages - Ticket to Heaven', '{"type": "text", "content": "On the same rooftop, next to the previous memorystick."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Messages - Ticket to Heaven' AND location_id = 49 AND display_order = 13), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/13_Document_Messages_Ticket_to_Heaven.jpg', 'Document - Messages - Ticket to Heaven', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 13, 'Legion Supply Box', '{"type": "text", "content": "Backtrack to the monorail then jump over to the first building you can to the right. Go into the building through the open door and there will be a supply box inside."}', 14);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 49 AND display_order = 14), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/14_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 49 AND display_order = 14), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/14_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 13, 'Legion Supply Box', '{"type": "text", "content": "Jump over to the parking garage building and there will be a supply box behind the giant AC unit behind the stairs."}', 15);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 49 AND display_order = 15), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/15_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 49 AND display_order = 15), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/15_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 1, 'Legion Camp', '{"type": "text", "content": "From the previous supply box, go downstairs and the camp is at the bottom of the second flight of stairs."}', 16);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 49 AND display_order = 16), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/16_Legion_Camp.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 4, 'Memorystick - Legionnaire 292''s Recollection', '{"type": "text", "content": "From the previous camp, go downstairs again and enter the parking garage. The corpse with the memory stick will be directly ahead, against the pillar."}', 17);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 292''s Recollection' AND location_id = 49 AND display_order = 17), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/17_Memorystick_Legionnaire_292''s_Recollection.jpg', 'Memorystick - Legionnaire 292''s Recollection', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 13, 'Legion Supply Box', '{"type": "text", "content": "To the left behind the yellow car in the southern corner."}', 18);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 49 AND display_order = 18), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/18_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 13, 'Legion Supply Box', '{"type": "text", "content": "Go up a floor in the parking garage and once you reach the fork in the road, go to the left and there will be a crate at the dead end."}', 19);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 49 AND display_order = 19), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/19_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 13, 'Legion Supply Box', '{"type": "text", "content": "Once you have to exit the parking garage by the yellow ledges, following the yellow ledges to the right and you''ll drop down into a lower part on the first floor of the parking garage with the supply box."}', 20);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 49 AND display_order = 20), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/20_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 49 AND display_order = 20), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/20_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 4, 'Memorystick - Legionnaire 230''s Resignation', '{"type": "text", "content": "There''s also a memorystick next to the previous supply box."}', 21);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 230''s Resignation' AND location_id = 49 AND display_order = 21), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/21_Memorystick_Legionnaire_230''s_Resignation.jpg', 'Memorystick - Legionnaire 230''s Resignation', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 13, 'Legion Supply Box', '{"type": "text", "content": "Once you reach the third floor of the parking garage, there will be a crate beside the Hydra enemy."}', 22);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 49 AND display_order = 22), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/22_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 4, 'Memorystick - Legionnaire 207''s Request', '{"type": "text", "content": "Once at the top of the parking garage, this memorystick will be beside the school bus right by the ramp."}', 23);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 207''s Request' AND location_id = 49 AND display_order = 23), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/23_Memorystick_Legionnaire_207''s_Request.jpg', 'Memorystick - Legionnaire 207''s Request', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 13, 'Legion Supply Box', '{"type": "text", "content": "Behind the barricade the legionnaire is leaning against is another supply box."}', 24);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 49 AND display_order = 24), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/24_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 15, 'Nano Suit - Punk Top', '{"type": "text", "content": "To the south are some tracks. Get on them, head west to the end of the parking garge and then look north. Jump onto the platform around the edge and then make your way down to the surface. The Nano Suit crate is down there."}', 25);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Punk Top' AND location_id = 49 AND display_order = 25), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/25_Nano_Suit_Punk_Top_1.jpg', 'Nano Suit - Punk Top', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Punk Top' AND location_id = 49 AND display_order = 25), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/25_Nano_Suit_Punk_Top_2.jpg', 'Nano Suit - Punk Top', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Punk Top' AND location_id = 49 AND display_order = 25), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/25_Nano_Suit_Punk_Top_3.jpg', 'Nano Suit - Punk Top', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 4, 'Memorystick - Legionnaire 282''s Memory', '{"type": "text", "content": "Jump across to the building south of the parking garage where another Cocoon is located. There will be a flight of stairs behind the Cocoon that will lead to a corpse with the memorystick."}', 26);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 282''s Memory' AND location_id = 49 AND display_order = 26), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/26_Memorystick_Legionnaire_282''s_Memory_1.jpg', 'Memorystick - Legionnaire 282''s Memory', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 282''s Memory' AND location_id = 49 AND display_order = 26), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/26_Memorystick_Legionnaire_282''s_Memory_2.jpg', 'Memorystick - Legionnaire 282''s Memory', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 282''s Memory' AND location_id = 49 AND display_order = 26), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/26_Memorystick_Legionnaire_282''s_Memory_3.jpg', 'Memorystick - Legionnaire 282''s Memory', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Memorystick - Legionnaire 282''s Memory' AND location_id = 49 AND display_order = 26), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/26_Memorystick_Legionnaire_282''s_Memory_4.jpg', 'Memorystick - Legionnaire 282''s Memory', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (49, 13, 'Legion Supply Box', '{"type": "text", "content": "Proceed onto the tracks and head southwest. When you see the white rollercoaster track, go up instead of moving toward the Cocoon to reach this supply box."}', 27);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 49 AND display_order = 27), 
        '/assets/images/Eidos_9/1_Fallen_Overpass/27_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

-- Eidos 9 - Submerged City

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (50, 1, 'Legion Camp', '{"type": "text", "content": "Backtrack onto the monorail and follow it until it branches paths. Follow the left path, which should lead you to a giant red slide, then go down it. There will be a camp at the bottom of the slide."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 50 AND display_order = 1), 
        '/assets/images/Eidos_9/2_Submerged_City/1_Legion_Camp_1.jpg', 'Legion Camp', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 50 AND display_order = 1), 
        '/assets/images/Eidos_9/2_Submerged_City/1_Legion_Camp_2.jpg', 'Legion Camp', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 50 AND display_order = 1), 
        '/assets/images/Eidos_9/2_Submerged_City/1_Legion_Camp_3.jpg', 'Legion Camp', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 50 AND display_order = 1), 
        '/assets/images/Eidos_9/2_Submerged_City/1_Legion_Camp_4.jpg', 'Legion Camp', 4);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (50, 13, 'Legion Supply Box', '{"type": "text", "content": "After the ambush is defeated, there will be a crate inside the small building to the right."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 50 AND display_order = 2), 
        '/assets/images/Eidos_9/2_Submerged_City/2_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 50 AND display_order = 2), 
        '/assets/images/Eidos_9/2_Submerged_City/2_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (50, 13, 'Legion Supply Box', '{"type": "text", "content": "From the previous crate, go behind the building and climb on top. Go across the wall running section and then climb up onto the next rooftop. There will be a crate behind the fenced area once you''re up top."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 50 AND display_order = 3), 
        '/assets/images/Eidos_9/2_Submerged_City/3_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 50 AND display_order = 3), 
        '/assets/images/Eidos_9/2_Submerged_City/3_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (50, 13, 'Legion Supply Box', '{"type": "text", "content": "From the previous crate, drop down to the street level and there will be a crate in the corner."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 50 AND display_order = 4), 
        '/assets/images/Eidos_9/2_Submerged_City/4_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 50 AND display_order = 4), 
        '/assets/images/Eidos_9/2_Submerged_City/4_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (50, 2, 'Document - Books - Book of Quotes 2', '{"type": "text", "content": "From the previous crate, climb back up and follow the pathway and you''ll have to climb up some vents. Once you''re done climbing the vents, the document will be on the ground ahead."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Books - Book of Quotes 2' AND location_id = 50 AND display_order = 5), 
        '/assets/images/Eidos_9/2_Submerged_City/5_Document_Books_Book_of_Quotes_2_1.jpg', 'Document - Books - Book of Quotes 2', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Books - Book of Quotes 2' AND location_id = 50 AND display_order = 5), 
        '/assets/images/Eidos_9/2_Submerged_City/5_Document_Books_Book_of_Quotes_2_2.jpg', 'Document - Books - Book of Quotes 2', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (50, 5, 'Locked Supply Chest', '{"type": "text", "content": "From the previous collectible, climb the ladder and the chest will be on the left after walking through the fence. The chest will be another sound puzzle."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 50 AND display_order = 6), 
        '/assets/images/Eidos_9/2_Submerged_City/6_Locked_Supply_Chest_1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 50 AND display_order = 6), 
        '/assets/images/Eidos_9/2_Submerged_City/6_Locked_Supply_Chest_2.jpg', 'Locked Supply Chest', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (50, 13, 'Legion Supply Box', '{"type": "text", "content": "From the previous crate, swing across the ropes and then enter the small building at the end. There will be a crate inside."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 50 AND display_order = 7), 
        '/assets/images/Eidos_9/2_Submerged_City/7_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 50 AND display_order = 7), 
        '/assets/images/Eidos_9/2_Submerged_City/7_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 50 AND display_order = 7), 
        '/assets/images/Eidos_9/2_Submerged_City/7_Legion_Supply_Box_3.jpg', 'Legion Supply Box', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (50, 1, 'Supply Camp - Submerged City', '{"type": "text", "content": "From the previous crate, climb up the building and there will be a camp once you''re at the top, before climbing up the ladder."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Submerged City' AND location_id = 50 AND display_order = 8), 
        '/assets/images/Eidos_9/2_Submerged_City/8_Supply_Camp_Submerged_City_1.jpg', 'Supply Camp - Submerged City', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp - Submerged City' AND location_id = 50 AND display_order = 8), 
        '/assets/images/Eidos_9/2_Submerged_City/8_Supply_Camp_Submerged_City_2.jpg', 'Supply Camp - Submerged City', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (50, 13, 'Legion Supply Box', '{"type": "text", "content": "On the south side of the boss arena, contains Omnibolts and 3 star Combat Continuation Gear."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 50 AND display_order = 9), 
        '/assets/images/Eidos_9/2_Submerged_City/9_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (50, 13, 'Legion Supply Box', '{"type": "text", "content": "After making it back to the original monorail, go down the grey slide to where a Cocoon is. There will be a crate beside the button that lowers the rope to get off the island."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 50 AND display_order = 10), 
        '/assets/images/Eidos_9/2_Submerged_City/10_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 50 AND display_order = 10), 
        '/assets/images/Eidos_9/2_Submerged_City/10_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (50, 13, 'Legion Supply Box', '{"type": "text", "content": "Head back to the parking garage roof and head northeast this time. Defeat the Cocoon and head east down the stairs. Under said stairs is another crate."}', 11);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 50 AND display_order = 11), 
        '/assets/images/Eidos_9/2_Submerged_City/11_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 50 AND display_order = 11), 
        '/assets/images/Eidos_9/2_Submerged_City/11_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (50, 1, 'Legion Camp', '{"type": "text", "content": "Up the ladder from the final Cocoon. Before taking the second ladder to the top, there''s a camp on your left."}', 12);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 50 AND display_order = 12), 
        '/assets/images/Eidos_9/2_Submerged_City/12_Legion_Camp_1.jpg', 'Legion Camp', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 50 AND display_order = 12), 
        '/assets/images/Eidos_9/2_Submerged_City/12_Legion_Camp_2.jpg', 'Legion Camp', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (50, 15, 'Nano Suit - Motivation', '{"type": "text", "content": "After clearing all 6 Cocoons, you''ll need to follow the objective down a red slide. There will be a Dozer and a Hydra at the end. After they''re defeated, climb up the small roof, where the crate is."}', 13);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Motivation' AND location_id = 50 AND display_order = 13), 
        '/assets/images/Eidos_9/2_Submerged_City/13_Nano_Suit_Motivation_1.jpg', 'Nano Suit - Motivation', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Motivation' AND location_id = 50 AND display_order = 13), 
        '/assets/images/Eidos_9/2_Submerged_City/13_Nano_Suit_Motivation_2.jpg', 'Nano Suit - Motivation', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Motivation' AND location_id = 50 AND display_order = 13), 
        '/assets/images/Eidos_9/2_Submerged_City/13_Nano_Suit_Motivation_3.jpg', 'Nano Suit - Motivation', 3);

-- Abyss Levoire - Capsule Cluster Room

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (46, 13, 'Legion Supply Box', '{"type": "text", "content": "Once you enter the Capsule Cluster Room, you''ll see the crate on one of the platforms to the left. You can jump across the floating platforms to get over to it."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 46 AND display_order = 1), 
        '/assets/images/Abyss_Levoire/3_Capsule_Cluster_Room/1_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (46, 1, 'Legion Camp', '{"type": "text", "content": "Directly after you leave the Capsule Cluster Room."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 46 AND display_order = 2), 
        '/assets/images/Abyss_Levoire/3_Capsule_Cluster_Room/2_Legion_Camp.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (46, 1, 'Legion Camp', '{"type": "text", "content": "After unlocking the next gate from the previous camp, there will be another camp at the top of the stairs."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 46 AND display_order = 3), 
        '/assets/images/Abyss_Levoire/3_Capsule_Cluster_Room/3_Legion_Camp.jpg', 'Legion Camp', 1);

-- Abyss Levoire - Closed Lobby

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (45, 15, 'Nano Suit - Planet Diving Suit (3rd)', '{"type": "text", "content": "Instead of heading to the right and going to the yellow box, there''s an offshoot in the right-hand corridor to the right. Head in there, defeat all the enemies, while avoiding all the lasers, and this Nano Suit is all yours."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Planet Diving Suit (3rd)' AND location_id = 45 AND display_order = 1), 
        '/assets/images/Abyss_Levoire/2_Closed_Lobby/1_Nano_Suit_Planet_Diving_Suit_3rd_1.jpg', 'Nano Suit - Planet Diving Suit (3rd)', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Planet Diving Suit (3rd)' AND location_id = 45 AND display_order = 1), 
        '/assets/images/Abyss_Levoire/2_Closed_Lobby/1_Nano_Suit_Planet_Diving_Suit_3rd_2.jpg', 'Nano Suit - Planet Diving Suit (3rd)', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Nano Suit - Planet Diving Suit (3rd)' AND location_id = 45 AND display_order = 1), 
        '/assets/images/Abyss_Levoire/2_Closed_Lobby/1_Nano_Suit_Planet_Diving_Suit_3rd_3.jpg', 'Nano Suit - Planet Diving Suit (3rd)', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (45, 2, 'Document - Log Data - Cultivation Experiment', '{"type": "text", "content": "In the room with both control booths, the one in the right-hand corner has a PC on in the corner. Interact with it for this document."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Log Data - Cultivation Experiment' AND location_id = 45 AND display_order = 2), 
        '/assets/images/Abyss_Levoire/2_Closed_Lobby/2_Document_Log_Data_Cultivation_Experiment.jpg', 'Document - Log Data - Cultivation Experiment', 1);

-- Abyss Levoire - Emergency Exit

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (44, 1, 'Supply Camp', '{"type": "text", "content": "As you enter through the first door, you''ll come across the first supply camp."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp' AND location_id = 44 AND display_order = 1), 
        '/assets/images/Abyss_Levoire/1_Emergency_Exit/1_Supply_Camp.jpg', 'Supply Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (44, 1, 'Legion Camp', '{"type": "text", "content": "At the end of the saw blade section."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 44 AND display_order = 2), 
        '/assets/images/Abyss_Levoire/1_Emergency_Exit/2_Legion_Camp.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (44, 2, 'Document - Journal - Kill Mother Sphere', '{"type": "text", "content": "Once the saw blades have stopped and the fans are off, there is a document near the yellow cube on the left hand side of the room, opposite the legion camp"}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - Kill Mother Sphere' AND location_id = 44 AND display_order = 3), 
        '/assets/images/Abyss_Levoire/1_Emergency_Exit/3_Document_Journal_Kill_Mother_Sphere_1.jpg', 'Document - Journal - Kill Mother Sphere', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Journal - Kill Mother Sphere' AND location_id = 44 AND display_order = 3), 
        '/assets/images/Abyss_Levoire/1_Emergency_Exit/3_Document_Journal_Kill_Mother_Sphere_2.jpg', 'Document - Journal - Kill Mother Sphere', 2);

-- Abyss Levoire - Laboratory Ruins

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (48, 5, 'Locked Supply Chest', '{"type": "text", "content": "Go through the platforming section until you get to the spot where you have to jump to a ladder. There will be a small room to the left of the ladder you can jump into where the chest will be, being guarded by a Barnacle."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 48 AND display_order = 1), 
        '/assets/images/Abyss_Levoire/5_Laboratory_Ruins/1_Locked_Supply_Chest_1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 48 AND display_order = 1), 
        '/assets/images/Abyss_Levoire/5_Laboratory_Ruins/1_Locked_Supply_Chest_2.jpg', 'Locked Supply Chest', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (48, 12, 'Robot - Tumbler Expansion Module', '{"type": "text", "content": "After climbing up the ladder and jumping over to the next platform, there will be a robot that will drop the Tumbler Expansion Module on the next platform directly across from you."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 48 AND display_order = 2), 
        '/assets/images/Abyss_Levoire/5_Laboratory_Ruins/2_Robot_Tumbler_Expansion_Module_1.jpg', 'Robot - Tumbler Expansion Module', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 48 AND display_order = 2), 
        '/assets/images/Abyss_Levoire/5_Laboratory_Ruins/2_Robot_Tumbler_Expansion_Module_2.jpg', 'Robot - Tumbler Expansion Module', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (48, 13, 'Legion Supply Box', '{"type": "text", "content": "After swinging over the gap with the rope and making your way up a sloped walkway, there''s a supply box in there with a couple of enemies."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 48 AND display_order = 3), 
        '/assets/images/Abyss_Levoire/5_Laboratory_Ruins/3_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (48, 2, 'Document - Log Data - Mass Production', '{"type": "text", "content": "On top of the tall box to the right of the previous supply box"}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Log Data - Mass Production' AND location_id = 48 AND display_order = 4), 
        '/assets/images/Abyss_Levoire/5_Laboratory_Ruins/4_Document_Log_Data_Mass_Production.jpg', 'Document - Log Data - Mass Production', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (48, 13, 'Legion Supply Box', '{"type": "text", "content": "From the previous collectibles, go up the rope and then turn around. There will be a crate on a narrow platform you can drop down too."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 48 AND display_order = 5), 
        '/assets/images/Abyss_Levoire/5_Laboratory_Ruins/5_Legion_Supply_Box_1.jpg', 'Legion Supply Box', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 48 AND display_order = 5), 
        '/assets/images/Abyss_Levoire/5_Laboratory_Ruins/5_Legion_Supply_Box_2.jpg', 'Legion Supply Box', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (48, 5, 'Locked Supply Chest', '{"type": "text", "content": "From the previous supply box, go across the wall running section and jump across the swing bars to the rope. You''ll be able to then swing to the left onto another platform with a crate that has a directional puzzle to open."}', 6);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 48 AND display_order = 6), 
        '/assets/images/Abyss_Levoire/5_Laboratory_Ruins/6_Locked_Supply_Chest_1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 48 AND display_order = 6), 
        '/assets/images/Abyss_Levoire/5_Laboratory_Ruins/6_Locked_Supply_Chest_2.jpg', 'Locked Supply Chest', 2);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (48, 13, 'Legion Supply Box', '{"type": "text", "content": "After sliding down the ladder with the blue lights, there will be a crate right beside you once you reach the bottom."}', 7);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 48 AND display_order = 7), 
        '/assets/images/Abyss_Levoire/5_Laboratory_Ruins/7_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (48, 13, 'Legion Supply Box', '{"type": "text", "content": "From the previous collectible, drop down to the walkway below you and instantly turn around. There will a crate at the end of the walkway."}', 8);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 48 AND display_order = 8), 
        '/assets/images/Abyss_Levoire/5_Laboratory_Ruins/8_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (48, 2, 'Document - Log Data - Quarantine Failure', '{"type": "text", "content": "After making your way through the Laboratory Ruins, there will be a document to the left of the door in the red hallway that leads to the room with the camp."}', 9);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Log Data - Quarantine Failure' AND location_id = 48 AND display_order = 9), 
        '/assets/images/Abyss_Levoire/5_Laboratory_Ruins/9_Document_Log_Data_Quarantine_Failure.jpg', 'Document - Log Data - Quarantine Failure', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (48, 1, 'Supply Camp', '{"type": "text", "content": "After crossing the large room, on the right before the boss fight."}', 10);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp' AND location_id = 48 AND display_order = 10), 
        '/assets/images/Abyss_Levoire/5_Laboratory_Ruins/10_Supply_Camp.jpg', 'Supply Camp', 1);

-- Abyss Levoire - Underground Passage

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (47, 2, 'Document - Log Data - Attack Detected', '{"type": "text", "content": "From the previous camp, go into the next room and jump into the control room through the window. The document is on the floor near the blocked stairs."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Log Data - Attack Detected' AND location_id = 47 AND display_order = 1), 
        '/assets/images/Abyss_Levoire/4_Underground_Passage/1_Document_Log_Data_Attack_Detected.jpg', 'Document - Log Data - Attack Detected', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (47, 1, 'Legion Camp', '{"type": "text", "content": "In the room directly after the long hallway where you have to fight waves of enemies"}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 47 AND display_order = 2), 
        '/assets/images/Abyss_Levoire/4_Underground_Passage/2_Legion_Camp.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (47, 5, 'Locked Supply Chest', '{"type": "text", "content": "After turning off the lasers, go across to the other side of the room and before going through the door, climb up the elevator shaft on the right. There will be a crate at the top where you''ll need to do another arrow direction puzzle to open it."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 47 AND display_order = 3), 
        '/assets/images/Abyss_Levoire/4_Underground_Passage/3_Locked_Supply_Chest_1.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 47 AND display_order = 3), 
        '/assets/images/Abyss_Levoire/4_Underground_Passage/3_Locked_Supply_Chest_2.jpg', 'Locked Supply Chest', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 47 AND display_order = 3), 
        '/assets/images/Abyss_Levoire/4_Underground_Passage/3_Locked_Supply_Chest_3.jpg', 'Locked Supply Chest', 3);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (47, 13, 'Legion Supply Box', '{"type": "text", "content": "Once you enter the overgrown hallway, keep going forward and then there will be a crate on the left end of the hallway."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 47 AND display_order = 4), 
        '/assets/images/Abyss_Levoire/4_Underground_Passage/4_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (47, 1, 'Legion Camp', '{"type": "text", "content": "On the opposite side from the supply box, through the door."}', 5);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 47 AND display_order = 5), 
        '/assets/images/Abyss_Levoire/4_Underground_Passage/5_Legion_Camp.jpg', 'Legion Camp', 1);

-- Altess Levoire - Air Vent

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (30, 13, 'Locked Legion Supply Box', '{"type": "text", "content": "On the walkway between fans, after doing the fan set-piece. It needs the Hacking Tool, but don''t worry if you don''t have it, as it''s just a lot of Nano Elements."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Legion Supply Box' AND location_id = 30 AND display_order = 1), 
        '/assets/images/Altess_Levoire/8_Air_Vent/1_Locked_Legion_Supply_Box.jpg', 'Locked Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (30, 5, 'Locked Supply Chest', '{"type": "text", "content": "By the next set of ladders up (d-pad mini-game inbound!)."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Locked Supply Chest' AND location_id = 30 AND display_order = 2), 
        '/assets/images/Altess_Levoire/8_Air_Vent/2_Locked_Legion_Supply_Chest.jpg', 'Locked Supply Chest', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (30, 12, 'Robot - Tumbler Expansion Module', '{"type": "text", "content": "Up the next ladder, and then do a 180 and hop over the barrier. There you''ll find a robot."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Tumbler Expansion Module' AND location_id = 30 AND display_order = 3), 
        '/assets/images/Altess_Levoire/8_Air_Vent/3_Robot_Tumbler_Expansion_Module.jpg', 'Robot - Tumbler Expansion Module', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (30, 1, 'Supply Camp', '{"type": "text", "content": "Next to both sets of ladders."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Supply Camp' AND location_id = 30 AND display_order = 4), 
        '/assets/images/Altess_Levoire/8_Air_Vent/4_Supply_Camp.jpg', 'Supply Camp', 1);

-- Altess Levoire - Deteriorated Lobby

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (29, 1, 'Legion Camp', '{"type": "text", "content": "After you beat the ambush and make it up the lift."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 29 AND display_order = 1), 
        '/assets/images/Altess_Levoire/7_Deteriorated_Lobby/1_Legion_Camp.jpg', 'Legion Camp', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (29, 6, 'Legion Supply Chest', '{"type": "text", "content": "Once you''ve cleared the monster covering the walkway, there''s a cache before you move into the next room."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Chest' AND location_id = 29 AND display_order = 2), 
        '/assets/images/Altess_Levoire/7_Deteriorated_Lobby/2_Legion_Supply_Chest.jpg', 'Legion Supply Chest', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (29, 7, 'Passcode - unyaun', '{"type": "text", "content": "Head past the locked door that needs a keycode, go through the door with the green light next to it, and then there''ll be a body on the right down there with a passcode."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Passcode - unyaun' AND location_id = 29 AND display_order = 3), 
        '/assets/images/Altess_Levoire/7_Deteriorated_Lobby/3_Passcode_unyaun.jpg', 'Passcode - unyaun', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (29, 13, 'Legion Supply Box', '{"type": "text", "content": "Carry on to the end of the corridor until you reach a door. Inside is a dead end, but also a Legion Supply Box."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 29 AND display_order = 4), 
        '/assets/images/Altess_Levoire/7_Deteriorated_Lobby/4_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

-- Altess Levoire - Purification Scanner

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (24, 2, 'Document - Log Data - Booting Sequence', '{"type": "text", "content": "After the wallrunning over the fallen floor section, it''s on the floor in front of you."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Log Data - Booting Sequence' AND location_id = 24 AND display_order = 1), 
        '/assets/images/Altess_Levoire/2_Purification_Scanner/1_Document_Log_Data_Booting_Sequence.jpg', 'Document - Log Data - Booting Sequence', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (24, 1, 'Legion Camp', '{"type": "text", "content": "After fighting your first infector, this will be in the main corridor."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 24 AND display_order = 2), 
        '/assets/images/Altess_Levoire/2_Purification_Scanner/2_Legion_Camp.jpg', 'Legion Camp', 1);

-- Altess Levoire - Research Lab Entrance

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (23, 2, 'Document - Messages - You Are Fake', '{"type": "text", "content": "As you walk down the stairs when Lily says the timelines don''t match up. Can''t miss this one."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Messages - You Are Fake' AND location_id = 23 AND display_order = 1), 
        '/assets/images/Altess_Levoire/1_Research_Lab_Entrance/1_Document_Messages_You_Are_Fake.jpg', 'Documents - Messages - You Are Fake', 1);

-- Altess Levoire - Sector A07

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (26, 2, 'Document - Log Data (Security Procedure Guide)', '{"type": "text", "content": "After the symbol floor puzzle, on the right before you go through the next door."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Log Data (Security Procedure Guide)' AND location_id = 26 AND display_order = 1), 
        '/assets/images/Altess_Levoire/4_Sector_A07/1_Document_Log Data_Security_Procedure_Guide.jpg', 'Document - Log Data (Security Procedure Guide)', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (26, 1, 'Legion Camp', '{"type": "text", "content": "Through the door, on your left"}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 26 AND display_order = 2), 
        '/assets/images/Altess_Levoire/4_Sector_A07/2_Legion_Camp.jpg', 'Legion Camp', 1);

-- Altess Levoire - Security Center

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (25, 2, 'Document - Messages - Humanity Liberation Front', '{"type": "text", "content": "In the control room where you have to open a door (after getting through the timed door), just interact with the computer on the right."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Messages - Humanity Liberation Front' AND location_id = 25 AND display_order = 1), 
        '/assets/images/Altess_Levoire/3_Security_Center/1_Document_Messages_Humanity_Liberation_Front.jpg', 'Document - Messages - Humanity Liberation Front', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (25, 6, 'Legion Supply Chest', '{"type": "text", "content": "By the door you just opened. Can''t miss it."}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Chest' AND location_id = 25 AND display_order = 2), 
        '/assets/images/Altess_Levoire/3_Security_Center/2_Legion_Supply_Chest.jpg', 'Legion Supply Chest', 1);

-- Altess Levoire - Specimen Preservation Lab

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (27, 6, 'Legion Supply Chest', '{"type": "text", "content": "Up the ladder as you enter, and then head to the right and open the door on your right. Watch out for the 2 Infectors inside."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Chest' AND location_id = 27 AND display_order = 1), 
        '/assets/images/Altess_Levoire/5_Specimen_Preservation_Lab/1_Legion_Supply_Chest.jpg', 'Legion Supply Chest', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (27, 2, 'Document - Announcements - Visitor Information', '{"type": "text", "content": "Follow the walkway to the right until you see a door with a broken red panel. The document is inside, on the left. Careful of ambushes!"}', 2);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Document - Announcements - Visitor Information' AND location_id = 27 AND display_order = 2), 
        '/assets/images/Altess_Levoire/5_Specimen_Preservation_Lab/2_Document_Announcements_Visitor_Information.jpg', 'Document - Announcements - Visitor Information', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (27, 13, 'Legion Supply Box', '{"type": "text", "content": "When you head back towards the ladder (clockwise), a door that was previously closed is now open. There''s a box inside."}', 3);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Supply Box' AND location_id = 27 AND display_order = 3), 
        '/assets/images/Altess_Levoire/5_Specimen_Preservation_Lab/3_Legion_Supply_Box.jpg', 'Legion Supply Box', 1);

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (27, 12, 'Robot - Document - Promotions - Eidos Company Promotion', '{"type": "text", "content": "In the far left room (as if you were facing the way you came in), there''s a robot in there now."}', 4);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Robot - Document - Promotions - Eidos Company Promotion' AND location_id = 27 AND display_order = 4), 
        '/assets/images/Altess_Levoire/5_Specimen_Preservation_Lab/4_Robot_Document_Promotions_Eidos_Company_Promotion.jpg', 'Robot - Document - Promotions - Eidos Company Promotion', 1);

-- Altess Levoire - Top Secret Research Complex

INSERT INTO collectibles (location_id, type_id, title, description, display_order)
VALUES (28, 1, 'Legion Camp', '{"type": "text", "content": "As you come down the elevator, there''s a camp just on the right."}', 1);

INSERT INTO collectible_images (collectible_id, cloudinary_url, alt_text, display_order)
VALUES ((SELECT id FROM collectibles WHERE title = 'Legion Camp' AND location_id = 28 AND display_order = 1), 
        '/assets/images/Altess_Levoire/6_Top_Secret_Research_Complex/1_Legion_Camp.jpg', 'Legion Camp', 1);

