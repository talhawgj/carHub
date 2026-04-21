-- Create contact_inquiries table for storing customer messages

CREATE TABLE IF NOT EXISTS contact_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  car_id UUID REFERENCES cars(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS contact_inquiries_email_idx ON contact_inquiries(email);
CREATE INDEX IF NOT EXISTS contact_inquiries_car_id_idx ON contact_inquiries(car_id);
CREATE INDEX IF NOT EXISTS contact_inquiries_created_at_idx ON contact_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS contact_inquiries_read_idx ON contact_inquiries(read);

-- Enable RLS (Row Level Security)
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert
CREATE POLICY "Allow public to insert contact inquiries"
ON contact_inquiries
FOR INSERT
TO anon
WITH CHECK (true);

-- Create policy to allow authenticated admin to view all
CREATE POLICY "Allow authenticated users to view contact inquiries"
ON contact_inquiries
FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow authenticated admin to update (mark as read)
CREATE POLICY "Allow authenticated users to update contact inquiries"
ON contact_inquiries
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
