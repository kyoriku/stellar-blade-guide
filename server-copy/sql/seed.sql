-- Insert Levels
INSERT INTO levels (name, display_order) VALUES
('Eidos 7', 1),
('Xion', 2),
('Wasteland', 3),
('Altess Levoire', 4),
('Matrix 11', 5),
('Great Desert', 6),
('Abyss Levoire', 7),
('Eidos 9', 8),
('Spire 4', 9),
('Nest', 10);

-- Insert Collectible Types
INSERT INTO collectible_types (name) VALUES
('Camp'),
('Document'),
('Can'),
('Memorystick'),
('Locked Chest'),
('Supply Chest'),
('Passcode'),
('Robot'),
('Supply Box'),
('Beta Core'),
('Nano Suit'),
('Body Core'),
('Earrings'),
('Supply Camp'),
('Exospine'),
('Outfit'),
('Glasses');

-- Eidos 7 Locations
INSERT INTO locations (level_id, name, display_order) VALUES
((SELECT id FROM levels WHERE name = 'Eidos 7'), 'Silent Street', 1),
((SELECT id FROM levels WHERE name = 'Eidos 7'), 'Parking Tower', 2),
((SELECT id FROM levels WHERE name = 'Eidos 7'), 'Abandoned Station', 3),
((SELECT id FROM levels WHERE name = 'Eidos 7'), 'Flooded Commercial Sector', 4),
((SELECT id FROM levels WHERE name = 'Eidos 7'), 'Memory Tower', 5),
((SELECT id FROM levels WHERE name = 'Eidos 7'), 'Construction Zone', 6),
((SELECT id FROM levels WHERE name = 'Eidos 7'), 'City Underground', 7),
((SELECT id FROM levels WHERE name = 'Eidos 7'), 'Crater', 8),
((SELECT id FROM levels WHERE name = 'Eidos 7'), 'Eidos 7 (Continued)', 9);

-- Xion Locations
INSERT INTO locations (level_id, name, display_order) VALUES
((SELECT id FROM levels WHERE name = 'Xion'), 'Xion', 1),
((SELECT id FROM levels WHERE name = 'Xion'), 'Xion (Continued)', 2);

-- Wasteland Locations
INSERT INTO locations (level_id, name, display_order) VALUES
((SELECT id FROM levels WHERE name = 'Wasteland'), 'Barren Lands', 1),
((SELECT id FROM levels WHERE name = 'Wasteland'), 'Great Canyon', 2),
((SELECT id FROM levels WHERE name = 'Wasteland'), 'Scrap Plains', 3),
((SELECT id FROM levels WHERE name = 'Wasteland'), 'Oil Storage Facility', 4),
((SELECT id FROM levels WHERE name = 'Wasteland'), 'Scrap Yard', 5),
((SELECT id FROM levels WHERE name = 'Wasteland'), 'Wasteland Basin', 6),
((SELECT id FROM levels WHERE name = 'Wasteland'), 'Scrap Plains (Continued)', 7),
((SELECT id FROM levels WHERE name = 'Wasteland'), 'Plant', 8),
((SELECT id FROM levels WHERE name = 'Wasteland'), 'Great Canyon (Continued)', 9),
((SELECT id FROM levels WHERE name = 'Wasteland'), 'Forbidden Area', 10),
((SELECT id FROM levels WHERE name = 'Wasteland'), 'Wasteland (Continued)', 11);

-- Altess Levoire Locations
INSERT INTO locations (level_id, name, display_order) VALUES
((SELECT id FROM levels WHERE name = 'Altess Levoire'), 'Research Lab Entrance', 1),
((SELECT id FROM levels WHERE name = 'Altess Levoire'), 'Purification Scanner', 2),
((SELECT id FROM levels WHERE name = 'Altess Levoire'), 'Security Center', 3),
((SELECT id FROM levels WHERE name = 'Altess Levoire'), 'Sector A07', 4),
((SELECT id FROM levels WHERE name = 'Altess Levoire'), 'Specimen Preservation Lab', 5),
((SELECT id FROM levels WHERE name = 'Altess Levoire'), 'Top Secret Research Complex', 6),
((SELECT id FROM levels WHERE name = 'Altess Levoire'), 'Deteriorated Lobby', 7),
((SELECT id FROM levels WHERE name = 'Altess Levoire'), 'Air Vent', 8);

-- Matrix 11 Locations
INSERT INTO locations (level_id, name, display_order) VALUES
((SELECT id FROM levels WHERE name = 'Matrix 11'), 'Closed Off Platform', 1),
((SELECT id FROM levels WHERE name = 'Matrix 11'), 'Landfill', 2),
((SELECT id FROM levels WHERE name = 'Matrix 11'), 'Collapsed Rail Bridge', 3),
((SELECT id FROM levels WHERE name = 'Matrix 11'), 'Underground Sewer', 4),
((SELECT id FROM levels WHERE name = 'Matrix 11'), 'Rotten Labyrinth', 5),
((SELECT id FROM levels WHERE name = 'Matrix 11'), 'Temporary Armoury', 6),
((SELECT id FROM levels WHERE name = 'Matrix 11'), 'Train Graveyard', 7);

-- Great Desert Locations
INSERT INTO locations (level_id, name, display_order) VALUES
((SELECT id FROM levels WHERE name = 'Great Desert'), 'Solar Tower', 1),
((SELECT id FROM levels WHERE name = 'Great Desert'), 'Collapsed Overpass', 2),
((SELECT id FROM levels WHERE name = 'Great Desert'), 'Buried Ruins', 3),
((SELECT id FROM levels WHERE name = 'Great Desert'), 'Central Great Desert', 4),
((SELECT id FROM levels WHERE name = 'Great Desert'), 'Northern Great Desert', 5),
((SELECT id FROM levels WHERE name = 'Great Desert'), 'Oasis', 6);

-- Abyss Levoire Locations
INSERT INTO locations (level_id, name, display_order) VALUES
((SELECT id FROM levels WHERE name = 'Abyss Levoire'), 'Emergency Exit', 1),
((SELECT id FROM levels WHERE name = 'Abyss Levoire'), 'Closed Lobby', 2),
((SELECT id FROM levels WHERE name = 'Abyss Levoire'), 'Capsule Cluster Room', 3),
((SELECT id FROM levels WHERE name = 'Abyss Levoire'), 'Underground Passage', 4),
((SELECT id FROM levels WHERE name = 'Abyss Levoire'), 'Laboratory Ruins', 5);

-- Eidos 9 Locations
INSERT INTO locations (level_id, name, display_order) VALUES
((SELECT id FROM levels WHERE name = 'Eidos 9'), 'Fallen Overpass', 1),
((SELECT id FROM levels WHERE name = 'Eidos 9'), 'Submerged City', 2),
((SELECT id FROM levels WHERE name = 'Eidos 9'), 'Atelier', 3);

-- Spire 4 Locations
INSERT INTO locations (level_id, name, display_order) VALUES
((SELECT id FROM levels WHERE name = 'Spire 4'), 'Orca Space Complex', 1),
((SELECT id FROM levels WHERE name = 'Spire 4'), 'Hypertube', 2),
((SELECT id FROM levels WHERE name = 'Spire 4'), 'Space Logistics Complex', 3),
((SELECT id FROM levels WHERE name = 'Spire 4'), 'Raphael Space Centre', 4),
((SELECT id FROM levels WHERE name = 'Spire 4'), 'Cargo Lift 121', 5),
((SELECT id FROM levels WHERE name = 'Spire 4'), 'Maintenance Sector', 6),
((SELECT id FROM levels WHERE name = 'Spire 4'), 'Tower Outer Wall', 7),
((SELECT id FROM levels WHERE name = 'Spire 4'), 'Passenger Lift 161', 8),
((SELECT id FROM levels WHERE name = 'Spire 4'), 'Prestige Lounge', 9),
((SELECT id FROM levels WHERE name = 'Spire 4'), 'Vermillion Garden', 10),
((SELECT id FROM levels WHERE name = 'Spire 4'), 'High Orbit Station', 11);

-- Nest Locations
INSERT INTO locations (level_id, name, display_order) VALUES
((SELECT id FROM levels WHERE name = 'Nest'), 'Nest', 1);