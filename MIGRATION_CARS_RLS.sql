-- Enable Row Level Security on cars table
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to insert their own cars
CREATE POLICY "Allow authenticated users to insert cars"
  ON cars FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Policy: Allow anyone to view available cars
CREATE POLICY "Allow public to view available cars"
  ON cars FOR SELECT
  USING (is_available = true);

-- Policy: Allow authenticated users to view all cars (for admin)
CREATE POLICY "Allow authenticated users to view all cars"
  ON cars FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Allow users to update their own cars
CREATE POLICY "Allow users to update their own cars"
  ON cars FOR UPDATE
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Policy: Allow users to delete their own cars
CREATE POLICY "Allow users to delete their own cars"
  ON cars FOR DELETE
  USING (auth.uid() = seller_id);
