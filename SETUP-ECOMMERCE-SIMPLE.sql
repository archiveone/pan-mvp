-- =====================================================
-- E-COMMERCE TABLES - Simple & Safe (No Deadlocks)
-- Just creates new tables, doesn't modify existing ones
-- =====================================================

-- Marketplace listings (products for sale)
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  title VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  currency VARCHAR(3) DEFAULT 'USD',
  quantity_total INTEGER NOT NULL DEFAULT 1,
  quantity_available INTEGER NOT NULL DEFAULT 1,
  quantity_sold INTEGER DEFAULT 0,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  status VARCHAR(20) DEFAULT 'active',
  location VARCHAR(200),
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
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_intent_id VARCHAR(200),
  payment_status VARCHAR(20) DEFAULT 'pending',
  order_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event tickets
CREATE TABLE IF NOT EXISTS event_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES advanced_events(id) ON DELETE CASCADE,
  tier_name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  currency VARCHAR(3) DEFAULT 'USD',
  quantity_total INTEGER NOT NULL CHECK (quantity_total > 0),
  quantity_available INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket purchases
CREATE TABLE IF NOT EXISTS ticket_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES event_tickets(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES advanced_events(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  attendee_name VARCHAR(200) NOT NULL,
  attendee_email VARCHAR(200) NOT NULL,
  qr_code TEXT UNIQUE,
  checked_in BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'confirmed',
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
  total_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_status VARCHAR(20) DEFAULT 'pending',
  status VARCHAR(20) DEFAULT 'pending',
  confirmation_code VARCHAR(20) UNIQUE,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User library (purchased digital content)
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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

-- Indexes (lightweight)
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_user ON marketplace_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer ON marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_buyer ON ticket_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_user_bookings_user ON user_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_user ON user_library(user_id);

-- Enable RLS
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

-- Simple policies (create only if they don't exist)
DO $$
BEGIN
  -- Marketplace listings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_listings' AND policyname = 'Users view active listings') THEN
    CREATE POLICY "Users view active listings" ON marketplace_listings FOR SELECT USING (status = 'active' OR auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_listings' AND policyname = 'Users create listings') THEN
    CREATE POLICY "Users create listings" ON marketplace_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  -- Orders
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_orders' AND policyname = 'Users view own orders') THEN
    CREATE POLICY "Users view own orders" ON marketplace_orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_orders' AND policyname = 'Users create orders') THEN
    CREATE POLICY "Users create orders" ON marketplace_orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
  END IF;
  
  -- Tickets
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_tickets' AND policyname = 'Anyone view tickets') THEN
    CREATE POLICY "Anyone view tickets" ON event_tickets FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ticket_purchases' AND policyname = 'Users view own tickets') THEN
    CREATE POLICY "Users view own tickets" ON ticket_purchases FOR SELECT USING (auth.uid() = buyer_id);
  END IF;
  
  -- Bookings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_bookings' AND policyname = 'Users view own bookings') THEN
    CREATE POLICY "Users view own bookings" ON user_bookings FOR SELECT USING (auth.uid() = user_id OR auth.uid() = host_id);
  END IF;
  
  -- Library
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_library' AND policyname = 'Users view own library') THEN
    CREATE POLICY "Users view own library" ON user_library FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Success message
SELECT 'E-commerce tables created successfully!' as message;

