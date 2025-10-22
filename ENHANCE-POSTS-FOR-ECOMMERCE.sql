-- =====================================================
-- ENHANCE POSTS TABLE FOR FULL E-COMMERCE
-- Support: Music, Videos, Products, Services, Events, etc.
-- =====================================================

-- Add e-commerce fields to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS post_type VARCHAR(50) DEFAULT 'post';
  -- Types: 'post', 'music_single', 'music_album', 'video', 'course', 
  --        'product', 'service', 'event', 'booking', 'experience'

ALTER TABLE posts ADD COLUMN IF NOT EXISTS price_amount DECIMAL(10, 2);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_for_sale BOOLEAN DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT false;

-- Inventory management
ALTER TABLE posts ADD COLUMN IF NOT EXISTS inventory_type VARCHAR(20) DEFAULT 'unlimited';
  -- 'unlimited', 'limited', 'one_time' (for events/bookings)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS stock_quantity INTEGER;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS sold_count INTEGER DEFAULT 0;

-- Digital content delivery
ALTER TABLE posts ADD COLUMN IF NOT EXISTS digital_file_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS download_limit INTEGER;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS access_duration_days INTEGER;

-- Enhanced metadata (JSONB for flexibility)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
  /* Type-specific metadata:
  
     MUSIC SINGLE/ALBUM: {
       "duration": "3:45",
       "genre": "Pop",
       "explicit": false,
       "release_date": "2025-10-22",
       "artist": "Artist Name",
       "album": "Album Name" (for singles),
       "track_number": 1,
       "isrc": "US-XXX-XX-XXXXX",
       "audio_preview_url": "https://...",
       "tracks": [...] (for albums)
     }
     
     VIDEO: {
       "duration": "10:30",
       "resolution": "1080p",
       "genre": "Documentary",
       "rating": "PG-13",
       "release_year": 2025,
       "director": "Director Name",
       "trailer_url": "https://...",
       "subtitles": ["en", "es"]
     }
     
     COURSE: {
       "duration_hours": 10,
       "level": "Beginner",
       "instructor": "Instructor Name",
       "lessons_count": 25,
       "certificate": true,
       "language": "English",
       "preview_video_url": "https://..."
     }
     
     PRODUCT: {
       "sku": "PROD-12345",
       "brand": "Brand Name",
       "color": "Blue",
       "size": "M",
       "weight": "1.5kg",
       "dimensions": "10x20x5cm",
       "materials": ["Cotton", "Polyester"],
       "shipping_from": "New York, NY",
       "estimated_shipping_days": 5
     }
     
     EVENT: {
       "event_date": "2025-10-30T19:00:00Z",
       "event_end_date": "2025-10-30T23:00:00Z",
       "venue": "Madison Square Garden",
       "address": "4 Pennsylvania Plaza, New York, NY",
       "capacity": 20000,
       "tickets_remaining": 150,
       "age_restriction": "18+",
       "lineup": ["Artist 1", "Artist 2"],
       "door_time": "18:00"
     }
     
     BOOKING/STAY: {
       "availability_start": "2025-11-01",
       "availability_end": "2025-12-31",
       "check_in_time": "15:00",
       "check_out_time": "11:00",
       "max_guests": 4,
       "bedrooms": 2,
       "bathrooms": 1,
       "amenities": ["WiFi", "Kitchen", "AC"],
       "house_rules": ["No smoking", "No pets"]
     }
     
     SERVICE: {
       "duration_minutes": 60,
       "service_type": "Consultation",
       "availability": ["Mon-Fri 9am-5pm"],
       "location_type": "remote|in-person|hybrid",
       "requirements": ["Zoom", "Google Meet"]
     }
  }
  */

-- Shipping (for physical products)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS requires_shipping BOOLEAN DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS free_shipping_threshold DECIMAL(10, 2);

-- Discounts & Pricing
ALTER TABLE posts ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS discount_percentage INTEGER;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS sale_ends_at TIMESTAMP WITH TIME ZONE;

-- Status
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for e-commerce queries
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_for_sale ON posts(is_for_sale) WHERE is_for_sale = true;
CREATE INDEX IF NOT EXISTS idx_posts_price ON posts(price_amount) WHERE price_amount IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_metadata ON posts USING GIN (metadata);

-- =====================================================
-- ENHANCED TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Who & What
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE RESTRICT,
  
  -- Transaction type
  transaction_type VARCHAR(50) NOT NULL,
    -- 'purchase', 'ticket', 'booking', 'digital_content', 'service', 'rental'
  
  -- Financial
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment details
  payment_method VARCHAR(50),
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
    -- 'pending', 'processing', 'completed', 'cancelled', 'refunded'
  
  -- Transaction metadata (from collection_items.transaction_data structure)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON transactions(seller_id);
CREATE INDEX idx_transactions_post ON transactions(post_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);

-- =====================================================
-- TRIGGER: Decrement stock on purchase
-- =====================================================
CREATE OR REPLACE FUNCTION decrement_post_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE posts 
    SET 
      stock_quantity = CASE 
        WHEN inventory_type = 'limited' THEN GREATEST(0, stock_quantity - 1)
        ELSE stock_quantity
      END,
      sold_count = sold_count + 1
    WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrement_stock
AFTER UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION decrement_post_stock();

-- =====================================================
-- FUNCTION: Purchase Post (Creates transaction + adds to collection)
-- =====================================================
CREATE OR REPLACE FUNCTION purchase_post(
  p_buyer_id UUID,
  p_post_id UUID,
  p_amount DECIMAL,
  p_stripe_payment_intent_id TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_post_record RECORD;
  v_collection_type VARCHAR(50);
BEGIN
  -- Get post details
  SELECT * INTO v_post_record FROM posts WHERE id = p_post_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
  
  -- Check stock
  IF v_post_record.inventory_type = 'limited' AND v_post_record.stock_quantity <= 0 THEN
    RAISE EXCEPTION 'Out of stock';
  END IF;
  
  -- Determine collection type based on post type
  v_collection_type := CASE v_post_record.post_type
    WHEN 'event' THEN 'tickets'
    WHEN 'booking' THEN 'bookings'
    WHEN 'music_single' THEN 'library'
    WHEN 'music_album' THEN 'library'
    WHEN 'video' THEN 'library'
    WHEN 'course' THEN 'library'
    ELSE 'purchases'
  END;
  
  -- Create transaction
  INSERT INTO transactions (
    buyer_id,
    seller_id,
    post_id,
    transaction_type,
    amount,
    stripe_payment_intent_id,
    status,
    metadata
  ) VALUES (
    p_buyer_id,
    v_post_record.user_id,
    p_post_id,
    v_collection_type,
    p_amount,
    p_stripe_payment_intent_id,
    'completed',
    p_metadata
  ) RETURNING id INTO v_transaction_id;
  
  -- Add to appropriate collection
  PERFORM add_to_collection(
    p_buyer_id,
    v_collection_type,
    p_post_id,
    jsonb_build_object(
      'purchased', true,
      'amount', p_amount,
      'payment_intent_id', p_stripe_payment_intent_id,
      'status', 'active',
      'transaction_id', v_transaction_id,
      'metadata', p_metadata
    )
  );
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS POLICIES FOR TRANSACTIONS
-- =====================================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_view_own"
ON transactions FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "transactions_create"
ON transactions FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- =====================================================
-- VIEWS: Marketplace queries
-- =====================================================

-- View: Available music
CREATE OR REPLACE VIEW marketplace_music AS
SELECT 
  p.*,
  pr.name as seller_name,
  pr.username as seller_username,
  p.metadata->>'artist' as artist,
  p.metadata->>'genre' as genre,
  p.metadata->>'duration' as duration
FROM posts p
JOIN profiles pr ON p.user_id = pr.id
WHERE p.is_for_sale = true 
  AND p.post_type IN ('music_single', 'music_album')
  AND p.is_published = true;

-- View: Available videos
CREATE OR REPLACE VIEW marketplace_videos AS
SELECT 
  p.*,
  pr.name as seller_name,
  p.metadata->>'director' as director,
  p.metadata->>'genre' as genre,
  p.metadata->>'duration' as duration
FROM posts p
JOIN profiles pr ON p.user_id = pr.id
WHERE p.is_for_sale = true 
  AND p.post_type = 'video'
  AND p.is_published = true;

-- View: Available events
CREATE OR REPLACE VIEW marketplace_events AS
SELECT 
  p.*,
  pr.name as organizer_name,
  p.metadata->>'event_date' as event_date,
  p.metadata->>'venue' as venue,
  p.metadata->'tickets_remaining' as tickets_remaining
FROM posts p
JOIN profiles pr ON p.user_id = pr.id
WHERE p.is_for_sale = true 
  AND p.post_type = 'event'
  AND p.is_published = true
  AND (p.metadata->>'event_date')::timestamptz > NOW();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT '✅ Posts enhanced for full e-commerce!' as status;
SELECT 'Supports: Music, Videos, Products, Events, Bookings, Services, Courses' as types;
SELECT 'Use purchase_post() function to handle purchases' as tip;

