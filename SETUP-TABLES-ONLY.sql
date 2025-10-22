-- =====================================================
-- E-COMMERCE TABLES - TABLES ONLY (No RLS/Policies)
-- Super safe, zero deadlock risk
-- Run policies separately later if needed
-- =====================================================

-- Marketplace listings
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  quantity_total INTEGER DEFAULT 1,
  quantity_available INTEGER DEFAULT 1,
  quantity_sold INTEGER DEFAULT 0,
  images TEXT[],
  status VARCHAR(20) DEFAULT 'active',
  location VARCHAR(200),
  delivery_methods TEXT[] DEFAULT ARRAY['pickup']::TEXT[],
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  minimum_order INTEGER DEFAULT 1,
  maximum_order INTEGER DEFAULT 99,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketplace orders
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_intent_id VARCHAR(200),
  payment_status VARCHAR(20) DEFAULT 'pending',
  order_status VARCHAR(20) DEFAULT 'pending',
  delivery_address JSONB,
  tracking_number VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event tickets
CREATE TABLE IF NOT EXISTS event_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES advanced_events(id) ON DELETE CASCADE,
  tier_name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  quantity_total INTEGER NOT NULL,
  quantity_available INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  benefits TEXT[],
  is_refundable BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket purchases
CREATE TABLE IF NOT EXISTS ticket_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES event_tickets(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES advanced_events(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  attendee_name VARCHAR(200) NOT NULL,
  attendee_email VARCHAR(200) NOT NULL,
  qr_code TEXT UNIQUE,
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'confirmed',
  payment_status VARCHAR(20) DEFAULT 'paid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User bookings
CREATE TABLE IF NOT EXISTS user_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_number VARCHAR(50) UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES bookable_listings(id) ON DELETE CASCADE,
  booking_type VARCHAR(50) NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE,
  num_guests INTEGER DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_status VARCHAR(20) DEFAULT 'pending',
  status VARCHAR(20) DEFAULT 'pending',
  confirmation_code VARCHAR(20) UNIQUE,
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_number VARCHAR(50) UNIQUE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50),
  payment_intent_id VARCHAR(200),
  status VARCHAR(20) DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User library
CREATE TABLE IF NOT EXISTS user_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content_type VARCHAR(20) NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  price_paid DECIMAL(10, 2),
  can_download BOOLEAN DEFAULT true,
  can_stream BOOLEAN DEFAULT true,
  is_favorite BOOLEAN DEFAULT false,
  UNIQUE(user_id, content_id)
);

-- Payment intents
CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_payment_intent_id VARCHAR(200) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(20),
  client_secret TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_user ON marketplace_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer ON marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller ON marketplace_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_event_tickets_event ON event_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_buyer ON ticket_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_event ON ticket_purchases(event_id);
CREATE INDEX IF NOT EXISTS idx_user_bookings_user ON user_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookings_host ON user_bookings(host_id);
CREATE INDEX IF NOT EXISTS idx_user_library_user ON user_library(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);

-- Views for easy access
CREATE OR REPLACE VIEW my_tickets AS
SELECT 
  tp.*,
  ae.title as event_title,
  ae.start_date as event_date,
  ae.venue_name,
  ae.city,
  ae.cover_image_url as event_image,
  et.tier_name,
  et.benefits
FROM ticket_purchases tp
JOIN event_tickets et ON tp.ticket_id = et.id
JOIN advanced_events ae ON tp.event_id = ae.id
WHERE tp.status IN ('confirmed', 'pending')
ORDER BY ae.start_date ASC;

CREATE OR REPLACE VIEW my_bookings AS
SELECT 
  ub.*,
  bl.title as listing_title,
  bl.images as listing_images,
  p.name as host_name,
  p.avatar_url as host_avatar
FROM user_bookings ub
LEFT JOIN bookable_listings bl ON ub.listing_id = bl.id
JOIN profiles p ON ub.host_id = p.id
WHERE ub.status NOT IN ('cancelled')
ORDER BY ub.check_in_date DESC;

CREATE OR REPLACE VIEW my_library AS
SELECT 
  ul.*,
  p.title as content_title,
  p.media_url as cover_image,
  p.category,
  prof.name as creator_name,
  prof.username as creator_username
FROM user_library ul
JOIN posts p ON ul.content_id = p.id
JOIN profiles prof ON p.user_id = prof.id
ORDER BY ul.purchased_at DESC;

-- Success!
SELECT '✅ E-commerce tables created! Now enable RLS in Supabase dashboard.' as message;

