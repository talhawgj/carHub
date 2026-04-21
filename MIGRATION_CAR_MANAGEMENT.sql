-- -- Create users table
-- CREATE TABLE users (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   email TEXT UNIQUE NOT NULL,
--   name TEXT,
--   phone TEXT,
--   avatar_url TEXT,
--   user_type TEXT DEFAULT 'admin',
--   created_at TIMESTAMP DEFAULT NOW()
-- );

-- -- Create cars table
-- CREATE TABLE cars (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   title TEXT NOT NULL,
--   description TEXT,
--   price DECIMAL(10, 2) NOT NULL,
--   mileage INTEGER,
--   year INTEGER,
--   make TEXT,
--   model TEXT,
--   condition TEXT DEFAULT 'used',
--   fuel_type TEXT DEFAULT 'gasoline',
--   transmission TEXT DEFAULT 'automatic',
--   color TEXT,
--   images TEXT[] DEFAULT ARRAY[]::TEXT[],
--   seller_id UUID,
--   is_available BOOLEAN DEFAULT TRUE,
--   created_at TIMESTAMP DEFAULT NOW(),
--   updated_at TIMESTAMP DEFAULT NOW()
-- );

-- -- Create listings table
-- CREATE TABLE listings (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
--   seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
--   price DECIMAL(10, 2) NOT NULL,
--   status TEXT DEFAULT 'active',
--   created_at TIMESTAMP DEFAULT NOW(),
--   updated_at TIMESTAMP DEFAULT NOW()
-- );

-- -- Create search index
-- CREATE INDEX cars_search_idx ON cars USING GIN(to_tsvector('english', title || ' ' || description));



-- Add new columns to cars table for enhanced car management

-- Add category column
ALTER TABLE cars ADD COLUMN category TEXT DEFAULT 'sedan';

-- Add tags array column
ALTER TABLE cars ADD COLUMN tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add specs JSONB column for flexible specifications
ALTER TABLE cars ADD COLUMN specs JSONB DEFAULT '{}';

-- Add primary_image_index column
ALTER TABLE cars ADD COLUMN primary_image_index INTEGER DEFAULT 0;

-- Create index for category and tags for faster queries
CREATE INDEX cars_category_idx ON cars(category);
CREATE INDEX cars_tags_idx ON cars USING GIN(tags);

-- Optional: Create materialized view for car statistics
CREATE MATERIALIZED VIEW car_stats AS
SELECT 
  category,
  COUNT(*) as total_cars,
  COUNT(CASE WHEN is_available THEN 1 END) as available,
  COUNT(CASE WHEN NOT is_available THEN 1 END) as sold,
  AVG(price) as avg_price,
  MIN(price) as min_price,
  MAX(price) as max_price
FROM cars
GROUP BY category;
