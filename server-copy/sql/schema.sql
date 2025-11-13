-- -- Drop tables if they exist (for clean slate during development)
-- DROP TABLE IF EXISTS collectible_images CASCADE;
-- DROP TABLE IF EXISTS collectibles CASCADE;
-- DROP TABLE IF EXISTS locations CASCADE;
-- DROP TABLE IF EXISTS levels CASCADE;
-- DROP TABLE IF EXISTS collectible_types CASCADE;

-- -- Levels table
-- CREATE TABLE levels (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(100) UNIQUE NOT NULL,
--     display_order INT NOT NULL
-- );

-- -- Locations table
-- CREATE TABLE locations (
--     id SERIAL PRIMARY KEY,
--     level_id INT NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
--     name VARCHAR(100) NOT NULL,
--     display_order INT NOT NULL,
--     UNIQUE(level_id, name)
-- );

-- -- Collectible types table
-- CREATE TABLE collectible_types (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(50) UNIQUE NOT NULL
-- );

-- -- Collectibles table
-- CREATE TABLE collectibles (
--     id SERIAL PRIMARY KEY,
--     location_id INT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
--     type_id INT NOT NULL REFERENCES collectible_types(id),
--     title VARCHAR(255) NOT NULL,
--     description JSONB NOT NULL,
--     display_order INT NOT NULL
-- );

-- -- Collectible images table
-- CREATE TABLE collectible_images (
--     id SERIAL PRIMARY KEY,
--     collectible_id INT NOT NULL REFERENCES collectibles(id) ON DELETE CASCADE,
--     cloudinary_url VARCHAR(500) NOT NULL,
--     alt_text VARCHAR(255) NOT NULL,
--     display_order INT NOT NULL
-- );

-- -- Create indexes for better query performance
-- CREATE INDEX idx_locations_level ON locations(level_id); 
-- CREATE INDEX idx_collectibles_location ON collectibles(location_id);
-- CREATE INDEX idx_collectibles_type ON collectibles(type_id); 
-- CREATE INDEX idx_images_collectible ON collectible_images(collectible_id); 

-- Drop tables if they exist (for clean slate during development)
DROP TABLE IF EXISTS collectible_type_mappings CASCADE;
DROP TABLE IF EXISTS collectible_images CASCADE;
DROP TABLE IF EXISTS collectibles CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS levels CASCADE;
DROP TABLE IF EXISTS collectible_types CASCADE;

-- Levels table
CREATE TABLE levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_order INT NOT NULL
);

-- Locations table
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    level_id INT NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_order INT NOT NULL,
    UNIQUE(level_id, name)
);

-- Collectible types table
CREATE TABLE collectible_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Collectibles table (removed type_id - now handled by junction table)
CREATE TABLE collectibles (
    id SERIAL PRIMARY KEY,
    location_id INT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description JSONB NOT NULL,
    display_order INT NOT NULL
);

-- Junction table for many-to-many relationship between collectibles and types
CREATE TABLE collectible_type_mappings (
    collectible_id INT NOT NULL REFERENCES collectibles(id) ON DELETE CASCADE,
    type_id INT NOT NULL REFERENCES collectible_types(id) ON DELETE CASCADE,
    PRIMARY KEY (collectible_id, type_id)
);

-- Collectible images table
CREATE TABLE collectible_images (
    id SERIAL PRIMARY KEY,
    collectible_id INT NOT NULL REFERENCES collectibles(id) ON DELETE CASCADE,
    cloudinary_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255) NOT NULL,
    display_order INT NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_locations_level ON locations(level_id); 
CREATE INDEX idx_collectibles_location ON collectibles(location_id);
CREATE INDEX idx_images_collectible ON collectible_images(collectible_id);
CREATE INDEX idx_type_mappings_collectible ON collectible_type_mappings(collectible_id);
CREATE INDEX idx_type_mappings_type ON collectible_type_mappings(type_id);