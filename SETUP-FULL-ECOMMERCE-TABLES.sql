-- =====================================================
-- COMPLETE E-COMMERCE & MARKETPLACE SYSTEM
-- Tables for purchases, orders, tickets, bookings, digital content
-- =====================================================

-- ============= MARKETPLACE LISTINGS =============

-- Dedicated marketplace listings table (separate from posts)
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  
  -- Product Details
  title VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  condition VARCHAR(20) CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
  brand VARCHAR(100),
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  original_price DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Inventory
  quantity_total INTEGER NOT NULL DEFAULT 1,
  quantity_available INTEGER NOT NULL DEFAULT 1,
  quantity_sold INTEGER DEFAULT 0,
  unlimited_quantity BOOLEAN DEFAULT false,
  minimum_order INTEGER DEFAULT 1,
  maximum_order INTEGER DEFAULT 99,
  
  -- Media
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  video_url TEXT,
  
  -- Delivery
  delivery_methods TEXT[] DEFAULT ARRAY['pickup']::TEXT[],
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  ships_from VARCHAR(200),
  ships_to TEXT[] DEFAULT ARRAY[]::TEXT[],
  processing_time_days INTEGER DEFAULT 3,
  
  -- Tax
  tax_included BOOLEAN DEFAULT false,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- Features
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  specifications JSONB,
  
  -- Insurance
  insurance_required BOOLEAN DEFAULT false,
  insurance_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- Ratings
  rating_average DECIMAL(3, 2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'sold', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  
  -- Location
  location VARCHAR(200),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_user ON marketplace_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_category ON marketplace_listings(category);

-- ============= ORDERS & PURCHASES =============

-- Marketplace orders
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  
  -- Order Details
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  insurance_fee DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Delivery
  delivery_method VARCHAR(50),
  delivery_address JSONB,
  pickup_address JSONB,
  tracking_number VARCHAR(100),
  
  -- Payment
  payment_method VARCHAR(50),
  payment_intent_id VARCHAR(200),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  order_status VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN (
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'
  )),
  
  -- Fulfillment
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Customer notes
  customer_notes TEXT,
  seller_notes TEXT,
  
  -- Cancellation
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  refund_amount DECIMAL(10, 2),
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON marketplace_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON marketplace_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing ON marketplace_orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON marketplace_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON marketplace_orders(payment_status);

-- ============= DIGITAL CONTENT LIBRARY =============

-- Purchased digital content (songs, videos, movies, documents)
CREATE TABLE IF NOT EXISTS purchased_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  order_id UUID REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  
  -- Content Info
  content_type VARCHAR(20) CHECK (content_type IN ('music', 'video', 'movie', 'document', 'ebook', 'course')),
  title VARCHAR(300) NOT NULL,
  
  -- Access URLs
  download_url TEXT,
  streaming_url TEXT,
  
  -- Permissions
  can_download BOOLEAN DEFAULT true,
  can_stream BOOLEAN DEFAULT true,
  download_limit INTEGER, -- NULL = unlimited
  downloads_used INTEGER DEFAULT 0,
  
  -- Expiry
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = never expires
  
  -- Purchase Info
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  price_paid DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Access tracking
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchased_content_user ON purchased_content(user_id);
CREATE INDEX IF NOT EXISTS idx_purchased_content_type ON purchased_content(content_type);
CREATE INDEX IF NOT EXISTS idx_purchased_content_order ON purchased_content(order_id);

-- ============= TICKETING SYSTEM =============

-- Event tickets
CREATE TABLE IF NOT EXISTS event_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES advanced_events(id) ON DELETE CASCADE,
  
  -- Ticket Details
  tier_name VARCHAR(100) NOT NULL, -- 'Early Bird', 'General Admission', 'VIP'
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Availability
  quantity_total INTEGER NOT NULL CHECK (quantity_total > 0),
  quantity_available INTEGER NOT NULL,
  quantity_sold INTEGER DEFAULT 0,
  
  -- Sales Period
  sale_start_date TIMESTAMP WITH TIME ZONE,
  sale_end_date TIMESTAMP WITH TIME ZONE,
  
  -- Restrictions
  max_per_person INTEGER DEFAULT 10,
  min_per_order INTEGER DEFAULT 1,
  
  -- Features
  benefits TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['Early entry', 'Meet & greet', 'Swag bag']
  
  -- Settings
  is_transferable BOOLEAN DEFAULT true,
  is_refundable BOOLEAN DEFAULT false,
  refund_deadline TIMESTAMP WITH TIME ZONE,
  
  -- Display
  display_order INTEGER DEFAULT 0,
  is_popular BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_tickets_event ON event_tickets(event_id);

-- Ticket purchases/bookings
CREATE TABLE IF NOT EXISTS ticket_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES event_tickets(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES advanced_events(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES marketplace_orders(id) ON DELETE SET NULL,
  
  -- Purchase Details
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment
  payment_method VARCHAR(50),
  payment_reference VARCHAR(200),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Attendee Info
  attendee_name VARCHAR(200) NOT NULL,
  attendee_email VARCHAR(200) NOT NULL,
  attendee_phone VARCHAR(20),
  
  -- QR Code for check-in
  qr_code TEXT UNIQUE,
  
  -- Check-in
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_in_by UUID REFERENCES profiles(id),
  
  -- Status
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded', 'transferred')),
  
  -- Transfer
  transferred_from UUID REFERENCES ticket_purchases(id),
  transferred_to_email VARCHAR(200),
  transferred_at TIMESTAMP WITH TIME ZONE,
  
  -- Cancellation/Refund
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  refund_amount DECIMAL(10, 2),
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_purchases_ticket ON ticket_purchases(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_event ON ticket_purchases(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_buyer ON ticket_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_qr ON ticket_purchases(qr_code);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_status ON ticket_purchases(status);

-- ============= BOOKING SYSTEM (Stays, Appointments, Services) =============

-- User bookings (for stays, appointments, services)
CREATE TABLE IF NOT EXISTS user_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES bookable_listings(id) ON DELETE CASCADE,
  business_id UUID REFERENCES reservation_businesses(id) ON DELETE CASCADE,
  
  -- Booking Type
  booking_type VARCHAR(50) NOT NULL CHECK (booking_type IN (
    'stay', 'appointment', 'service', 'table_reservation', 'equipment_rental'
  )),
  
  -- Dates
  check_in_date DATE NOT NULL,
  check_out_date DATE,
  booking_date DATE NOT NULL,
  booking_time TIME,
  duration_hours DECIMAL(5, 2),
  
  -- Guests/Party
  num_guests INTEGER DEFAULT 1,
  num_adults INTEGER,
  num_children INTEGER,
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL,
  service_fee DECIMAL(10, 2) DEFAULT 0,
  cleaning_fee DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment
  payment_intent_id VARCHAR(200),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'
  )),
  
  -- Check-in/out
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_out_at TIMESTAMP WITH TIME ZONE,
  
  -- Special requests
  special_requests TEXT,
  host_notes TEXT,
  
  -- Cancellation
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  refund_amount DECIMAL(10, 2),
  
  -- Confirmation
  confirmation_code VARCHAR(20) UNIQUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_bookings_user ON user_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookings_host ON user_bookings(host_id);
CREATE INDEX IF NOT EXISTS idx_user_bookings_listing ON user_bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_user_bookings_status ON user_bookings(status);
CREATE INDEX IF NOT EXISTS idx_user_bookings_dates ON user_bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_user_bookings_confirmation ON user_bookings(confirmation_code);

-- ============= TRANSACTIONS & PAYMENTS =============

-- Universal transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Parties
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Related Records
  listing_id UUID,
  order_id UUID REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES user_bookings(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES ticket_purchases(id) ON DELETE CASCADE,
  
  -- Transaction Type
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'purchase', 'booking', 'ticket', 'subscription', 'donation', 'service_payment'
  )),
  
  -- Amount
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment
  payment_method VARCHAR(50) CHECK (payment_method IN ('stripe', 'paypal', 'cash', 'bank_transfer', 'crypto')),
  payment_intent_id VARCHAR(200),
  payment_reference VARCHAR(200),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'
  )),
  
  -- Timestamps
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  -- Fees
  platform_fee DECIMAL(10, 2) DEFAULT 0,
  seller_payout DECIMAL(10, 2),
  
  -- Metadata
  metadata JSONB,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_number ON transactions(transaction_number);

-- ============= PAYMENT INTENTS (Stripe Integration) =============

CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_payment_intent_id VARCHAR(200) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID,
  order_id UUID REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  
  -- Amount
  amount INTEGER NOT NULL, -- In cents
  currency VARCHAR(3) DEFAULT 'usd',
  
  -- Status
  status VARCHAR(20),
  
  -- Client secret (for frontend)
  client_secret TEXT,
  
  -- Metadata
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_intents_user ON payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_stripe ON payment_intents(stripe_payment_intent_id);

-- ============= USER LIBRARY (Purchased Content) =============

-- User's library of purchased digital content
CREATE TABLE IF NOT EXISTS user_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  -- Content Type
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN (
    'music', 'video', 'movie', 'album', 'ebook', 'course', 'document', 'podcast'
  )),
  
  -- Purchase Info
  purchase_id UUID REFERENCES marketplace_orders(id),
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  price_paid DECIMAL(10, 2),
  
  -- Access Rights
  can_download BOOLEAN DEFAULT true,
  can_stream BOOLEAN DEFAULT true,
  can_offline BOOLEAN DEFAULT false,
  download_limit INTEGER, -- NULL = unlimited
  
  -- Usage Tracking
  downloads_used INTEGER DEFAULT 0,
  streams_count INTEGER DEFAULT 0,
  last_played_at TIMESTAMP WITH TIME ZONE,
  
  -- Library Organization
  is_favorite BOOLEAN DEFAULT false,
  playlist_ids UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Offline Availability
  is_downloaded BOOLEAN DEFAULT false,
  downloaded_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_user_library_user ON user_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_content ON user_library(content_id);
CREATE INDEX IF NOT EXISTS idx_user_library_type ON user_library(content_type);
CREATE INDEX IF NOT EXISTS idx_user_library_favorite ON user_library(is_favorite) WHERE is_favorite = true;

-- ============= PLAYLISTS =============

CREATE TABLE IF NOT EXISTS playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Playlist Details
  name VARCHAR(200) NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  
  -- Type
  playlist_type VARCHAR(20) DEFAULT 'music' CHECK (playlist_type IN ('music', 'video', 'mixed')),
  
  -- Privacy
  is_public BOOLEAN DEFAULT true,
  is_collaborative BOOLEAN DEFAULT false,
  
  -- Stats
  item_count INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0, -- In seconds
  followers_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_public ON playlists(is_public) WHERE is_public = true;

-- Playlist items
CREATE TABLE IF NOT EXISTS playlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  
  -- Position
  position INTEGER NOT NULL,
  
  -- Added by
  added_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(playlist_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist ON playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_position ON playlist_items(playlist_id, position);

-- ============= MY TICKETS PAGE DATA =============

-- View for user's tickets
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

-- View for user's bookings
CREATE OR REPLACE VIEW my_bookings AS
SELECT 
  ub.*,
  bl.title as listing_title,
  bl.images as listing_images,
  rb.business_name,
  rb.address,
  p.name as host_name,
  p.avatar_url as host_avatar
FROM user_bookings ub
LEFT JOIN bookable_listings bl ON ub.listing_id = bl.id
LEFT JOIN reservation_businesses rb ON ub.business_id = rb.id
JOIN profiles p ON ub.host_id = p.id
WHERE ub.status NOT IN ('cancelled')
ORDER BY ub.check_in_date DESC;

-- View for user's library
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

-- ============= AUTO-GENERATE FUNCTIONS =============

-- Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

DROP TRIGGER IF EXISTS trigger_generate_order_number ON marketplace_orders;
CREATE TRIGGER trigger_generate_order_number
BEFORE INSERT ON marketplace_orders
FOR EACH ROW
WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
EXECUTE FUNCTION generate_order_number();

-- Generate booking number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_number := 'BK-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('booking_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS booking_number_seq START 1;

DROP TRIGGER IF EXISTS trigger_generate_booking_number ON user_bookings;
CREATE TRIGGER trigger_generate_booking_number
BEFORE INSERT ON user_bookings
FOR EACH ROW
WHEN (NEW.booking_number IS NULL OR NEW.booking_number = '')
EXECUTE FUNCTION generate_booking_number();

-- Generate confirmation code for bookings
CREATE OR REPLACE FUNCTION generate_booking_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_code IS NULL THEN
    NEW.confirmation_code := UPPER(substring(md5(random()::text) from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_booking_confirmation ON user_bookings;
CREATE TRIGGER trigger_generate_booking_confirmation
BEFORE INSERT ON user_bookings
FOR EACH ROW
EXECUTE FUNCTION generate_booking_confirmation();

-- Generate QR code for tickets
CREATE OR REPLACE FUNCTION generate_ticket_qr()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code := 'TKT-' || NEW.id || '-' || UPPER(substring(md5(random()::text) from 1 for 12));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_ticket_qr ON ticket_purchases;
CREATE TRIGGER trigger_generate_ticket_qr
BEFORE INSERT ON ticket_purchases
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_qr();

-- Update inventory on order
CREATE OR REPLACE FUNCTION update_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD IS NULL OR OLD.payment_status != 'paid') THEN
    -- Reduce available quantity
    UPDATE marketplace_listings
    SET 
      quantity_available = quantity_available - NEW.quantity,
      quantity_sold = quantity_sold + NEW.quantity
    WHERE id = NEW.listing_id;
  END IF;
  
  -- Restore inventory on refund
  IF NEW.payment_status = 'refunded' AND OLD.payment_status = 'paid' THEN
    UPDATE marketplace_listings
    SET 
      quantity_available = quantity_available + NEW.quantity,
      quantity_sold = quantity_sold - NEW.quantity
    WHERE id = NEW.listing_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_inventory ON marketplace_orders;
CREATE TRIGGER trigger_update_inventory
AFTER INSERT OR UPDATE ON marketplace_orders
FOR EACH ROW
EXECUTE FUNCTION update_inventory_on_order();

-- Add to library on digital content purchase
CREATE OR REPLACE FUNCTION add_to_library_on_purchase()
RETURNS TRIGGER AS $$
DECLARE
  v_post RECORD;
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD IS NULL OR OLD.payment_status != 'paid') THEN
    -- Check if listing is digital content
    SELECT p.id, p.title, p.content_type
    INTO v_post
    FROM marketplace_listings ml
    JOIN posts p ON ml.post_id = p.id
    WHERE ml.id = NEW.listing_id
      AND p.content_type IN ('music', 'video', 'document');
    
    IF FOUND THEN
      -- Add to user's library
      INSERT INTO user_library (
        user_id,
        content_id,
        content_type,
        purchase_id,
        price_paid,
        currency
      )
      VALUES (
        NEW.buyer_id,
        v_post.id,
        v_post.content_type,
        NEW.id,
        NEW.total_amount,
        NEW.currency
      )
      ON CONFLICT (user_id, content_id) DO NOTHING;
      
      -- Also add to purchased_content
      INSERT INTO purchased_content (
        user_id,
        content_id,
        order_id,
        content_type,
        title,
        price_paid,
        currency
      )
      VALUES (
        NEW.buyer_id,
        v_post.id,
        NEW.id,
        v_post.content_type,
        v_post.title,
        NEW.total_amount,
        NEW.currency
      )
      ON CONFLICT (user_id, content_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_add_to_library ON marketplace_orders;
CREATE TRIGGER trigger_add_to_library
AFTER INSERT OR UPDATE ON marketplace_orders
FOR EACH ROW
EXECUTE FUNCTION add_to_library_on_purchase();

-- ============= ROW LEVEL SECURITY =============

ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchased_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;

-- Marketplace listings policies
DROP POLICY IF EXISTS "Active listings viewable by all" ON marketplace_listings;
DROP POLICY IF EXISTS "Users can create listings" ON marketplace_listings;
DROP POLICY IF EXISTS "Users can update own listings" ON marketplace_listings;

CREATE POLICY "Active listings viewable by all" ON marketplace_listings FOR SELECT USING (status = 'active' OR auth.uid() = user_id);
CREATE POLICY "Users can create listings" ON marketplace_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own listings" ON marketplace_listings FOR UPDATE USING (auth.uid() = user_id);

-- Orders policies
DROP POLICY IF EXISTS "Users view their orders" ON marketplace_orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON marketplace_orders;
DROP POLICY IF EXISTS "Buyers and sellers update orders" ON marketplace_orders;

CREATE POLICY "Users view their orders" ON marketplace_orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Anyone can create orders" ON marketplace_orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyers and sellers update orders" ON marketplace_orders FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Purchased content policies
DROP POLICY IF EXISTS "Users view own purchased content" ON purchased_content;

CREATE POLICY "Users view own purchased content" ON purchased_content FOR SELECT USING (auth.uid() = user_id);

-- Ticket policies
DROP POLICY IF EXISTS "Anyone can view available tickets" ON event_tickets;
DROP POLICY IF EXISTS "Event owners manage tickets" ON event_tickets;

CREATE POLICY "Anyone can view available tickets" ON event_tickets FOR SELECT USING (true);
CREATE POLICY "Event owners manage tickets" ON event_tickets FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM advanced_events WHERE id = event_id)
);

-- Ticket purchases policies
DROP POLICY IF EXISTS "Users view own tickets" ON ticket_purchases;
DROP POLICY IF EXISTS "Anyone can purchase tickets" ON ticket_purchases;

CREATE POLICY "Users view own tickets" ON ticket_purchases FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Anyone can purchase tickets" ON ticket_purchases FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Bookings policies
DROP POLICY IF EXISTS "Users view own bookings" ON user_bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON user_bookings;
DROP POLICY IF EXISTS "Users and hosts update bookings" ON user_bookings;

CREATE POLICY "Users view own bookings" ON user_bookings FOR SELECT USING (auth.uid() = user_id OR auth.uid() = host_id);
CREATE POLICY "Anyone can create bookings" ON user_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users and hosts update bookings" ON user_bookings FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = host_id);

-- Transactions policies
DROP POLICY IF EXISTS "Users view own transactions" ON transactions;

CREATE POLICY "Users view own transactions" ON transactions FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Library policies
DROP POLICY IF EXISTS "Users view own library" ON user_library;
DROP POLICY IF EXISTS "Users manage own library" ON user_library;

CREATE POLICY "Users view own library" ON user_library FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own library" ON user_library FOR ALL USING (auth.uid() = user_id);

-- Playlist policies
DROP POLICY IF EXISTS "Public playlists viewable by all" ON playlists;
DROP POLICY IF EXISTS "Users manage own playlists" ON playlists;

CREATE POLICY "Public playlists viewable by all" ON playlists FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users manage own playlists" ON playlists FOR ALL USING (auth.uid() = user_id);

-- Playlist items policies
DROP POLICY IF EXISTS "Users view items in accessible playlists" ON playlist_items;
DROP POLICY IF EXISTS "Playlist owners manage items" ON playlist_items;

CREATE POLICY "Users view items in accessible playlists" ON playlist_items FOR SELECT USING (
  playlist_id IN (SELECT id FROM playlists WHERE is_public = true OR user_id = auth.uid())
);
CREATE POLICY "Playlist owners manage items" ON playlist_items FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM playlists WHERE id = playlist_id)
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '🎉 FULL E-COMMERCE SYSTEM CREATED!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Marketplace Listings - Products for sale';
  RAISE NOTICE '✅ Orders & Purchases - Complete order management';
  RAISE NOTICE '✅ Digital Library - Purchased content access';
  RAISE NOTICE '✅ Ticketing - Event tickets with QR codes';
  RAISE NOTICE '✅ Bookings - Stays, appointments, reservations';
  RAISE NOTICE '✅ Transactions - Universal payment tracking';
  RAISE NOTICE '✅ Playlists - Organize purchased music/videos';
  RAISE NOTICE '';
  RAISE NOTICE '💳 Payment Integration - Stripe ready';
  RAISE NOTICE '📱 Mobile Ready - QR codes for check-in';
  RAISE NOTICE '📊 Analytics - Purchase tracking built-in';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your marketplace is ready for:';
  RAISE NOTICE '  - Physical products';
  RAISE NOTICE '  - Digital downloads (music, videos, movies)';
  RAISE NOTICE '  - Event tickets with holder tracking';
  RAISE NOTICE '  - Accommodation bookings';
  RAISE NOTICE '  - Service appointments';
  RAISE NOTICE '  - Everything!';
END $$;

