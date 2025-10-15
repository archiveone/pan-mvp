-- =====================================================
-- ULTRA ADVANCED LISTING SYSTEM
-- Multi-Item Listings: Hotels, Vehicle Fleets, Product Variants
-- =====================================================

-- Main advanced listings table
CREATE TABLE IF NOT EXISTS advanced_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_id UUID, -- Optional business account
  
  -- Type
  listing_type VARCHAR(50) NOT NULL CHECK (listing_type IN (
    'hotel', 'hostel', 'vehicle_rental', 'equipment_rental', 
    'product', 'service', 'experience', 'space_rental', 'event_venue'
  )),
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  
  -- Basic Info
  title VARCHAR(200) NOT NULL,
  tagline VARCHAR(200),
  description TEXT NOT NULL,
  
  -- Business Details
  business_name VARCHAR(200),
  business_license VARCHAR(100),
  business_type VARCHAR(20) CHECK (business_type IN ('individual', 'business', 'enterprise')),
  
  -- Location
  address TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  coordinates JSONB, -- {lat: number, lng: number}
  
  -- Multi-Item Configuration
  has_variants BOOLEAN DEFAULT false,
  variant_count INTEGER DEFAULT 0,
  total_inventory INTEGER DEFAULT 0,
  
  -- Amenities/Features
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  policies JSONB DEFAULT '{}'::jsonb, -- Flexible policies object
  
  -- Media
  cover_image_url TEXT,
  gallery_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  video_url TEXT,
  virtual_tour_url TEXT,
  
  -- Contact
  contact_method VARCHAR(20) DEFAULT 'message',
  phone_number VARCHAR(20),
  email VARCHAR(200),
  website TEXT,
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verification_level VARCHAR(20) DEFAULT 'none' CHECK (verification_level IN ('none', 'phone', 'email', 'id', 'business')),
  
  -- Metrics
  total_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'suspended')),
  is_featured BOOLEAN DEFAULT false,
  
  -- SEO
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  meta_title VARCHAR(200),
  meta_description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Listing variants table (rooms, vehicles, product variants, etc.)
CREATE TABLE IF NOT EXISTS listing_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_listing_id UUID NOT NULL REFERENCES advanced_listings(id) ON DELETE CASCADE,
  variant_type VARCHAR(50) NOT NULL CHECK (variant_type IN ('room', 'vehicle', 'product_variant', 'service_option', 'time_slot')),
  
  -- Identification
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(100),
  description TEXT,
  
  -- Variant Attributes (flexible JSONB for any type)
  attributes JSONB DEFAULT '{}'::jsonb,
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
  currency VARCHAR(3) DEFAULT 'USD',
  pricing_model VARCHAR(20) NOT NULL CHECK (pricing_model IN ('per_day', 'per_hour', 'per_night', 'per_month', 'fixed', 'per_person')),
  dynamic_pricing JSONB, -- Flexible pricing object
  
  -- Inventory & Availability
  quantity_total INTEGER NOT NULL CHECK (quantity_total > 0),
  quantity_available INTEGER NOT NULL CHECK (quantity_available >= 0),
  unlimited_quantity BOOLEAN DEFAULT false,
  
  -- Availability Calendar
  availability_type VARCHAR(20) DEFAULT 'always' CHECK (availability_type IN ('always', 'calendar', 'schedule')),
  blocked_dates DATE[] DEFAULT ARRAY[]::DATE[],
  available_time_slots JSONB, -- Array of time slot objects
  
  -- Media
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  primary_image_url TEXT,
  video_url TEXT,
  virtual_tour_url TEXT,
  
  -- Booking Rules
  min_duration INTEGER, -- minimum hours/days/nights
  max_duration INTEGER, -- maximum hours/days/nights
  advance_booking_days INTEGER DEFAULT 0, -- how many days in advance booking required
  cancellation_policy VARCHAR(50),
  deposit_required DECIMAL(10, 2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Metrics
  booking_count INTEGER DEFAULT 0,
  revenue_generated DECIMAL(12, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT quantity_check CHECK (quantity_available <= quantity_total OR unlimited_quantity = true)
);

-- Booking requests table (unified for all types)
CREATE TABLE IF NOT EXISTS booking_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES advanced_listings(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES listing_variants(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Date/Time
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_value INTEGER NOT NULL,
  duration_unit VARCHAR(10) NOT NULL CHECK (duration_unit IN ('hour', 'day', 'night', 'week', 'month')),
  
  -- Quantity
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  
  -- Guest Details
  num_adults INTEGER,
  num_children INTEGER,
  num_infants INTEGER,
  
  -- Special Requests
  special_requests TEXT,
  add_ons TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL,
  additional_fees JSONB DEFAULT '{}'::jsonb,
  total_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment
  payment_method VARCHAR(20) CHECK (payment_method IN ('stripe', 'paypal', 'cash', 'bank_transfer')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_id VARCHAR(100),
  
  -- Status
  status VARCHAR(20) DEFAULT 'inquiry' CHECK (status IN ('inquiry', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  
  -- QR Code & Check-in
  qr_code TEXT,
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_out BOOLEAN DEFAULT false,
  checked_out_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_booking_dates CHECK (end_date > start_date)
);

-- Inventory tracking (real-time availability)
CREATE TABLE IF NOT EXISTS variant_inventory_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID NOT NULL REFERENCES listing_variants(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES booking_requests(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('booked', 'released', 'blocked', 'unblocked')),
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing history (for dynamic pricing insights)
CREATE TABLE IF NOT EXISTS variant_pricing_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID NOT NULL REFERENCES listing_variants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  pricing_reason VARCHAR(50), -- 'weekend', 'peak_season', 'demand', 'promotion'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(variant_id, date)
);

-- ============= INDEXES =============

-- Advanced listings indexes
CREATE INDEX IF NOT EXISTS idx_advanced_listings_user ON advanced_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_advanced_listings_type ON advanced_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_advanced_listings_category ON advanced_listings(category);
CREATE INDEX IF NOT EXISTS idx_advanced_listings_city ON advanced_listings(city);
CREATE INDEX IF NOT EXISTS idx_advanced_listings_status ON advanced_listings(status);
CREATE INDEX IF NOT EXISTS idx_advanced_listings_featured ON advanced_listings(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_advanced_listings_rating ON advanced_listings(average_rating DESC);

-- Variants indexes
CREATE INDEX IF NOT EXISTS idx_variants_listing ON listing_variants(parent_listing_id);
CREATE INDEX IF NOT EXISTS idx_variants_type ON listing_variants(variant_type);
CREATE INDEX IF NOT EXISTS idx_variants_active ON listing_variants(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_variants_price ON listing_variants(base_price);
CREATE INDEX IF NOT EXISTS idx_variants_availability ON listing_variants(quantity_available) WHERE quantity_available > 0;

-- Booking requests indexes
CREATE INDEX IF NOT EXISTS idx_booking_requests_listing ON booking_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_variant ON booking_requests(variant_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_guest ON booking_requests(guest_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_host ON booking_requests(host_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_dates ON booking_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_booking_requests_payment ON booking_requests(payment_status);

-- Inventory log indexes
CREATE INDEX IF NOT EXISTS idx_inventory_log_variant ON variant_inventory_log(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_log_booking ON variant_inventory_log(booking_id);

-- Pricing history indexes
CREATE INDEX IF NOT EXISTS idx_pricing_history_variant ON variant_pricing_history(variant_id);
CREATE INDEX IF NOT EXISTS idx_pricing_history_date ON variant_pricing_history(date);

-- ============= FUNCTIONS =============

-- Function to update variant availability after booking
CREATE OR REPLACE FUNCTION update_variant_availability_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Decrease available quantity
    UPDATE listing_variants
    SET quantity_available = quantity_available - NEW.quantity
    WHERE id = NEW.variant_id AND unlimited_quantity = false;
    
    -- Log inventory change
    INSERT INTO variant_inventory_log (variant_id, booking_id, action, quantity_change, quantity_after)
    SELECT 
      NEW.variant_id,
      NEW.id,
      'booked',
      -NEW.quantity,
      quantity_available
    FROM listing_variants
    WHERE id = NEW.variant_id;
  END IF;
  
  IF NEW.status IN ('cancelled', 'completed') AND OLD.status = 'confirmed' THEN
    -- Increase available quantity back
    UPDATE listing_variants
    SET quantity_available = quantity_available + NEW.quantity
    WHERE id = NEW.variant_id AND unlimited_quantity = false;
    
    -- Log inventory change
    INSERT INTO variant_inventory_log (variant_id, booking_id, action, quantity_change, quantity_after)
    SELECT 
      NEW.variant_id,
      NEW.id,
      'released',
      NEW.quantity,
      quantity_available
    FROM listing_variants
    WHERE id = NEW.variant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic availability updates
DROP TRIGGER IF EXISTS trigger_update_variant_availability ON booking_requests;
CREATE TRIGGER trigger_update_variant_availability
AFTER INSERT OR UPDATE OF status ON booking_requests
FOR EACH ROW
EXECUTE FUNCTION update_variant_availability_on_booking();

-- Function to update listing metrics
CREATE OR REPLACE FUNCTION update_listing_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update booking count and revenue
  UPDATE advanced_listings
  SET 
    total_bookings = (
      SELECT COUNT(*) FROM booking_requests 
      WHERE listing_id = NEW.listing_id AND status = 'completed'
    ),
    total_revenue = (
      SELECT COALESCE(SUM(total_price), 0) FROM booking_requests 
      WHERE listing_id = NEW.listing_id AND payment_status = 'paid'
    )
  WHERE id = NEW.listing_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for metrics updates
DROP TRIGGER IF EXISTS trigger_update_listing_metrics ON booking_requests;
CREATE TRIGGER trigger_update_listing_metrics
AFTER INSERT OR UPDATE ON booking_requests
FOR EACH ROW
EXECUTE FUNCTION update_listing_metrics();

-- ============= ROW LEVEL SECURITY =============

ALTER TABLE advanced_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_inventory_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_pricing_history ENABLE ROW LEVEL SECURITY;

-- Advanced listings policies
DROP POLICY IF EXISTS "Active listings viewable by everyone" ON advanced_listings;
DROP POLICY IF EXISTS "Users can create their own listings" ON advanced_listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON advanced_listings;
DROP POLICY IF EXISTS "Users can delete their own listings" ON advanced_listings;

CREATE POLICY "Active listings viewable by everyone" 
ON advanced_listings FOR SELECT 
USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Users can create their own listings" 
ON advanced_listings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings" 
ON advanced_listings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings" 
ON advanced_listings FOR DELETE 
USING (auth.uid() = user_id);

-- Variants policies
DROP POLICY IF EXISTS "Active variants viewable by everyone" ON listing_variants;
DROP POLICY IF EXISTS "Listing owners can manage variants" ON listing_variants;

CREATE POLICY "Active variants viewable by everyone" 
ON listing_variants FOR SELECT 
USING (
  is_active = true OR 
  auth.uid() IN (SELECT user_id FROM advanced_listings WHERE id = parent_listing_id)
);

CREATE POLICY "Listing owners can manage variants" 
ON listing_variants FOR ALL 
USING (
  auth.uid() IN (SELECT user_id FROM advanced_listings WHERE id = parent_listing_id)
);

-- Booking requests policies
DROP POLICY IF EXISTS "Users can view their bookings" ON booking_requests;
DROP POLICY IF EXISTS "Users can create bookings" ON booking_requests;
DROP POLICY IF EXISTS "Hosts and guests can update bookings" ON booking_requests;

CREATE POLICY "Users can view their bookings" 
ON booking_requests FOR SELECT 
USING (auth.uid() = guest_id OR auth.uid() = host_id);

CREATE POLICY "Users can create bookings" 
ON booking_requests FOR INSERT 
WITH CHECK (auth.uid() = guest_id);

CREATE POLICY "Hosts and guests can update bookings" 
ON booking_requests FOR UPDATE 
USING (auth.uid() = guest_id OR auth.uid() = host_id);

-- Inventory log policies (read-only for owners)
DROP POLICY IF EXISTS "Owners can view inventory logs" ON variant_inventory_log;

CREATE POLICY "Owners can view inventory logs" 
ON variant_inventory_log FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM advanced_listings 
    WHERE id IN (SELECT parent_listing_id FROM listing_variants WHERE id = variant_id)
  )
);

-- Pricing history policies
DROP POLICY IF EXISTS "Everyone can view pricing history" ON variant_pricing_history;
DROP POLICY IF EXISTS "Owners can manage pricing history" ON variant_pricing_history;

CREATE POLICY "Everyone can view pricing history" 
ON variant_pricing_history FOR SELECT 
USING (true);

CREATE POLICY "Owners can manage pricing history" 
ON variant_pricing_history FOR ALL 
USING (
  auth.uid() IN (
    SELECT user_id FROM advanced_listings 
    WHERE id IN (SELECT parent_listing_id FROM listing_variants WHERE id = variant_id)
  )
);

-- ============= VIEWS FOR EASY QUERYING =============

-- View: Available variants with listing info
CREATE OR REPLACE VIEW available_variants AS
SELECT 
  v.*,
  l.title as listing_title,
  l.city,
  l.country,
  l.listing_type,
  l.average_rating as listing_rating,
  l.cover_image_url as listing_cover_image
FROM listing_variants v
JOIN advanced_listings l ON v.parent_listing_id = l.id
WHERE v.is_active = true 
  AND v.quantity_available > 0
  AND l.status = 'active';

-- View: Listings with variant summary
CREATE OR REPLACE VIEW listings_with_variants AS
SELECT 
  l.*,
  COUNT(v.id) as active_variant_count,
  MIN(v.base_price) as price_from,
  MAX(v.base_price) as price_to,
  SUM(v.quantity_available) as total_available_units
FROM advanced_listings l
LEFT JOIN listing_variants v ON l.id = v.parent_listing_id AND v.is_active = true
GROUP BY l.id;

COMMENT ON TABLE advanced_listings IS 'Advanced multi-item listings: hotels, vehicle fleets, product variants';
COMMENT ON TABLE listing_variants IS 'Individual items/rooms/vehicles/variants within a listing';
COMMENT ON TABLE booking_requests IS 'Unified booking system for all variant types';
COMMENT ON TABLE variant_inventory_log IS 'Real-time inventory tracking and history';
COMMENT ON TABLE variant_pricing_history IS 'Historical pricing data for analytics';

