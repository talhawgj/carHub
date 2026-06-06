-- CarMandi Core Entities Schema (Phase 1)
-- Run this in your Supabase SQL Editor.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =================================================================================
-- ENUMS
-- =================================================================================
CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'inspector', 'admin');
CREATE TYPE listing_status AS ENUM ('draft', 'pending_inspection', 'active', 'sold', 'unsold', 'relisted');
CREATE TYPE auction_status AS ENUM ('scheduled', 'active', 'closing', 'closed');
CREATE TYPE inspection_status AS ENUM ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE inspection_result AS ENUM ('pass', 'fail', 'na');
CREATE TYPE photo_type AS ENUM ('exterior', 'interior', 'engine', 'inspection');
CREATE TYPE payment_type AS ENUM ('onboarding', 'success_fee', 'inspection_fee');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE payment_gateway AS ENUM ('jazzcash', 'easypaisa', 'stripe');
CREATE TYPE notification_channel AS ENUM ('whatsapp', 'push', 'email');

-- =================================================================================
-- TABLES
-- =================================================================================

-- 1. USERS
-- If using Supabase Auth, you might link this to auth.users via the id field
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT UNIQUE NOT NULL,
    cnic_hash TEXT,
    name TEXT NOT NULL,
    city TEXT,
    role user_role DEFAULT 'buyer',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. MAKES (Car Brands)
CREATE TABLE makes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    slug TEXT NOT NULL UNIQUE
);

-- 3. MODELS
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    make_id UUID NOT NULL REFERENCES makes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    UNIQUE(make_id, slug)
);

-- 4. LISTINGS
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    make_id UUID NOT NULL REFERENCES makes(id),
    model_id UUID NOT NULL REFERENCES models(id),
    year INT NOT NULL,
    variant TEXT,
    city TEXT NOT NULL,
    description TEXT,
    demand_price NUMERIC(15, 2),
    reserve_price NUMERIC(15, 2), -- Handled securely via RLS (hidden from buyers)
    status listing_status DEFAULT 'draft',
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. AUCTIONS
CREATE TABLE auctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status auction_status DEFAULT 'scheduled',
    current_highest_bid NUMERIC(15, 2) DEFAULT 0,
    bid_count INT DEFAULT 0,
    winner_bid_id UUID, -- Will be set when auction closes
    reserve_met BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. BIDS
-- Immutable append-only log of bids
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    bidder_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC(15, 2) NOT NULL,
    placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_winner BOOLEAN DEFAULT FALSE,
    ip_hash TEXT,
    device_fingerprint TEXT
);

-- Add foreign key constraint back to bids now that it exists
ALTER TABLE auctions 
ADD CONSTRAINT fk_winner_bid 
FOREIGN KEY (winner_bid_id) REFERENCES bids(id) ON DELETE SET NULL;

-- 7. INSPECTIONS
CREATE TABLE inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    inspector_id UUID REFERENCES users(id),
    booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status inspection_status DEFAULT 'pending',
    total_checkpoints INT DEFAULT 200,
    report_url TEXT,
    photo_urls TEXT[]
);

-- 8. INSPECTION CHECKPOINTS
CREATE TABLE inspection_checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    result inspection_result DEFAULT 'na',
    notes TEXT,
    photo_url TEXT
);

-- 9. PHOTOS
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    s3_key TEXT,
    order_index INT DEFAULT 0,
    type photo_type DEFAULT 'exterior',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. WISHLIST
CREATE TABLE wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

-- 11. PAYMENTS
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    listing_id UUID REFERENCES listings(id),
    type payment_type NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    status payment_status DEFAULT 'pending',
    gateway payment_gateway NOT NULL,
    gateway_ref TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. INSPECTORS (CRM Extended Data)
CREATE TABLE inspectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    city TEXT NOT NULL,
    zones TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    availability_calendar JSONB,
    completed_inspections_count INT DEFAULT 0
);

-- 13. NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    channel notification_channel NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================================
-- INDEXES FOR PERFORMANCE
-- =================================================================================
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_make ON listings(make_id);
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_ends_at ON auctions(ends_at);
CREATE INDEX idx_bids_auction_id ON bids(auction_id);
CREATE INDEX idx_inspections_status ON inspections(status);

-- =================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =================================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- LISTINGS
CREATE POLICY "Anyone can view active listings" ON listings FOR SELECT USING (status = 'active');
CREATE POLICY "Sellers can view own listings" ON listings FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Sellers can insert own listings" ON listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own draft listings" ON listings FOR UPDATE USING (auth.uid() = seller_id AND status IN ('draft', 'pending_inspection'));

-- AUCTIONS
CREATE POLICY "Anyone can view active auctions" ON auctions FOR SELECT USING (status = 'active');
CREATE POLICY "Sellers can view own auctions" ON auctions FOR SELECT USING (listing_id IN (SELECT id FROM listings WHERE seller_id = auth.uid()));

-- BIDS
CREATE POLICY "Anyone can view bids" ON bids FOR SELECT USING (auction_id IN (SELECT id FROM auctions WHERE status = 'active'));
CREATE POLICY "Verified users can insert bids" ON bids FOR INSERT WITH CHECK (
    auth.uid() = bidder_id 
    AND (SELECT is_verified FROM users WHERE id = auth.uid()) = TRUE
);

-- INSPECTIONS
CREATE POLICY "Anyone can read completed inspections" ON inspections FOR SELECT USING (status = 'completed');
CREATE POLICY "Sellers can view own inspections" ON inspections FOR SELECT USING (listing_id IN (SELECT id FROM listings WHERE seller_id = auth.uid()));

-- ==========================================
-- PHASE 5: FULL PRODUCTION BACKEND EXTENSIONS
-- ==========================================

-- 1. STORAGE: Vehicle Images Bucket
insert into storage.buckets (id, name, public) values ('vehicle-images', 'vehicle-images', true) ON CONFLICT DO NOTHING;

create policy "Anyone can read vehicle images"
  on storage.objects for select
  using ( bucket_id = 'vehicle-images' );

create policy "Authenticated users can upload vehicle images"
  on storage.objects for insert
  with check ( bucket_id = 'vehicle-images' AND auth.role() = 'authenticated' );


-- 2. PAYMENTS (Mock Table for MVP)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
    type VARCHAR(50) NOT NULL, -- 'inspection_fee', 'success_fee'
    reference_id UUID, -- could link to listings or auctions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (user_id = auth.uid());


-- 3. NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());


-- 4. AUTOMATED AUCTION CLOSING (Trigger/Function)
-- In a real Supabase env, we would use pg_cron. For this schema, we define the function 
-- that a cron job or edge function would call every minute.
CREATE OR REPLACE FUNCTION close_expired_auctions()
RETURNS void AS $$
BEGIN
    -- Update auctions that have expired but are still active
    UPDATE auctions a
    SET 
        status = 'completed',
        winner_id = (
            SELECT bidder_id 
            FROM bids 
            WHERE auction_id = a.id 
            ORDER BY amount DESC 
            LIMIT 1
        )
    WHERE a.status = 'active' AND a.ends_at <= timezone('utc'::text, now());
    
    -- In a real scenario, we might also insert notifications for the winners here.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. OUTBID NOTIFICATION TRIGGER
CREATE OR REPLACE FUNCTION notify_outbid()
RETURNS TRIGGER AS $$
DECLARE
    previous_highest_bidder UUID;
BEGIN
    -- Find the previous highest bidder before this new bid
    SELECT bidder_id INTO previous_highest_bidder
    FROM bids
    WHERE auction_id = NEW.auction_id AND id != NEW.id
    ORDER BY amount DESC
    LIMIT 1;

    IF previous_highest_bidder IS NOT NULL AND previous_highest_bidder != NEW.bidder_id THEN
        INSERT INTO notifications (user_id, title, message)
        VALUES (
            previous_highest_bidder, 
            'You have been outbid!', 
            'Someone just placed a higher bid on an auction you are participating in. Bid again to reclaim the top spot!'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_new_bid_notify
AFTER INSERT ON bids
FOR EACH ROW
EXECUTE FUNCTION notify_outbid();