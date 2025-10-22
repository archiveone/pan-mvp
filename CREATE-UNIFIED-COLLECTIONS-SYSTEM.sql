-- =====================================================
-- UNIFIED COLLECTIONS SYSTEM
-- Everything (tickets, bookings, purchases, saves) = Collections
-- =====================================================

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS collection_items CASCADE;
DROP TABLE IF EXISTS collections CASCADE;

-- =====================================================
-- COLLECTIONS TABLE (System + User Collections)
-- =====================================================
CREATE TABLE collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Collection metadata
  name VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT '📁',
  color VARCHAR(7) DEFAULT '#3B82F6',
  
  -- Collection type
  collection_type VARCHAR(50) NOT NULL,
    -- System types: 'tickets', 'bookings', 'purchases', 'library'
    -- User types: 'favorites', 'wishlist', 'custom'
  
  is_system BOOLEAN DEFAULT false,  -- System-managed collections
  is_public BOOLEAN DEFAULT false,  -- Share with others
  
  -- Display order
  position INTEGER DEFAULT 0,
  
  -- Stats (updated by triggers)
  item_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one system collection per type per user
  UNIQUE(user_id, collection_type, is_system)
);

CREATE INDEX idx_collections_user ON collections(user_id);
CREATE INDEX idx_collections_type ON collections(user_id, collection_type);
CREATE INDEX idx_collections_position ON collections(user_id, position);

-- =====================================================
-- COLLECTION ITEMS (The actual saved/purchased posts)
-- =====================================================
CREATE TABLE collection_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Transaction data (if purchased/booked)
  transaction_data JSONB DEFAULT '{}'::jsonb,
    /* Structure:
       {
         "purchased": true,
         "amount": 50.00,
         "currency": "USD",
         "payment_intent_id": "pi_xxx",
         "stripe_charge_id": "ch_xxx",
         "status": "active|completed|cancelled|refunded",
         "purchased_at": "2025-10-22T...",
         
         // Type-specific metadata
         "ticket": {
           "event_date": "2025-10-30T19:00:00Z",
           "venue": "Madison Square Garden",
           "seat": "Section 120, Row F, Seat 12",
           "qr_code": "BASE64_OR_URL",
           "ticket_holder": "John Doe",
           "ticket_number": "TKT-123456"
         },
         "booking": {
           "confirmation_code": "ABC123DEF",
           "check_in": "2025-11-01",
           "check_out": "2025-11-05",
           "guests": 2,
           "room_type": "Deluxe Suite",
           "special_requests": "Late check-out"
         },
         "product": {
           "tracking_number": "1Z999AA10123456784",
           "carrier": "UPS",
           "shipping_address": {...},
           "estimated_delivery": "2025-10-25",
           "delivered_at": "2025-10-24T14:30:00Z"
         },
         "digital": {
           "access_url": "https://...",
           "license_key": "XXXX-XXXX-XXXX",
           "expiry_date": "2026-10-22",
           "download_count": 3
         }
       }
    */
  
  -- User notes (for any item)
  notes TEXT,
  
  -- Display order within collection
  position INTEGER DEFAULT 0,
  
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate posts in same collection
  UNIQUE(collection_id, post_id)
);

CREATE INDEX idx_collection_items_collection ON collection_items(collection_id);
CREATE INDEX idx_collection_items_post ON collection_items(post_id);
CREATE INDEX idx_collection_items_user ON collection_items(added_by);
CREATE INDEX idx_collection_items_position ON collection_items(collection_id, position);

-- GIN index for fast JSON queries
CREATE INDEX idx_collection_items_transaction_data ON collection_items USING GIN (transaction_data);

-- =====================================================
-- FUNCTION: Auto-create system collections for new users
-- =====================================================
CREATE OR REPLACE FUNCTION create_system_collections_for_user(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Create system collections
  INSERT INTO collections (user_id, name, icon, color, collection_type, is_system, position)
  VALUES 
    (p_user_id, 'My Tickets', '🎫', '#8B5CF6', 'tickets', true, 0),
    (p_user_id, 'My Bookings', '🏠', '#10B981', 'bookings', true, 1),
    (p_user_id, 'My Purchases', '📦', '#F59E0B', 'purchases', true, 2),
    (p_user_id, 'My Library', '📚', '#3B82F6', 'library', true, 3),
    (p_user_id, 'Favorites', '❤️', '#EF4444', 'favorites', false, 4)
  ON CONFLICT (user_id, collection_type, is_system) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Update item count when items added/removed
-- =====================================================
CREATE OR REPLACE FUNCTION update_collection_item_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE collections 
    SET item_count = item_count + 1, updated_at = NOW()
    WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE collections 
    SET item_count = GREATEST(0, item_count - 1), updated_at = NOW()
    WHERE id = OLD.collection_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_collection_count
AFTER INSERT OR DELETE ON collection_items
FOR EACH ROW EXECUTE FUNCTION update_collection_item_count();

-- =====================================================
-- HELPER FUNCTION: Add item to collection
-- =====================================================
CREATE OR REPLACE FUNCTION add_to_collection(
  p_user_id UUID,
  p_collection_type VARCHAR,
  p_post_id UUID,
  p_transaction_data JSONB DEFAULT '{}'::jsonb,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_collection_id UUID;
  v_item_id UUID;
BEGIN
  -- Find or create the collection
  SELECT id INTO v_collection_id
  FROM collections
  WHERE user_id = p_user_id 
    AND collection_type = p_collection_type
    AND is_system = (p_collection_type IN ('tickets', 'bookings', 'purchases', 'library'));
  
  -- If collection doesn't exist, create it
  IF v_collection_id IS NULL THEN
    INSERT INTO collections (user_id, collection_type, name, is_system)
    VALUES (p_user_id, p_collection_type, 'My ' || initcap(p_collection_type), true)
    RETURNING id INTO v_collection_id;
  END IF;
  
  -- Add item to collection (or update if exists)
  INSERT INTO collection_items (collection_id, post_id, added_by, transaction_data, notes)
  VALUES (v_collection_id, p_post_id, p_user_id, p_transaction_data, p_notes)
  ON CONFLICT (collection_id, post_id) 
  DO UPDATE SET 
    transaction_data = EXCLUDED.transaction_data,
    notes = COALESCE(EXCLUDED.notes, collection_items.notes)
  RETURNING id INTO v_item_id;
  
  RETURN v_item_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

-- Collections: view own or public
CREATE POLICY "collections_view_own_or_public"
ON collections FOR SELECT
USING (auth.uid() = user_id OR is_public = true);

-- Collections: manage own
CREATE POLICY "collections_manage_own"
ON collections FOR ALL
USING (auth.uid() = user_id);

-- Collection items: view if you can see the collection
CREATE POLICY "collection_items_view"
ON collection_items FOR SELECT
USING (
  collection_id IN (
    SELECT id FROM collections 
    WHERE user_id = auth.uid() OR is_public = true
  )
);

-- Collection items: manage own
CREATE POLICY "collection_items_manage_own"
ON collection_items FOR ALL
USING (auth.uid() = added_by);

-- =====================================================
-- VIEWS: Convenient queries
-- =====================================================

-- View: User's tickets
CREATE OR REPLACE VIEW user_tickets AS
SELECT 
  ci.id,
  ci.collection_id,
  ci.post_id,
  ci.added_by as user_id,
  p.title,
  p.description,
  p.media_url,
  p.location,
  ci.transaction_data,
  ci.transaction_data->'ticket'->>'event_date' as event_date,
  ci.transaction_data->'ticket'->>'venue' as venue,
  ci.transaction_data->'ticket'->>'qr_code' as qr_code,
  ci.transaction_data->>'status' as status,
  ci.added_at
FROM collection_items ci
JOIN collections c ON ci.collection_id = c.id
JOIN posts p ON ci.post_id = p.id
WHERE c.collection_type = 'tickets';

-- View: User's bookings
CREATE OR REPLACE VIEW user_bookings AS
SELECT 
  ci.id,
  ci.collection_id,
  ci.post_id,
  ci.added_by as user_id,
  p.title,
  p.description,
  p.media_url,
  ci.transaction_data,
  ci.transaction_data->'booking'->>'confirmation_code' as confirmation_code,
  ci.transaction_data->'booking'->>'check_in' as check_in,
  ci.transaction_data->'booking'->>'check_out' as check_out,
  ci.transaction_data->>'status' as status,
  ci.added_at
FROM collection_items ci
JOIN collections c ON ci.collection_id = c.id
JOIN posts p ON ci.post_id = p.id
WHERE c.collection_type = 'bookings';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT '✅ Unified Collections System Created!' as status;
SELECT 'System collections will auto-create for each user.' as message;
SELECT 'Use add_to_collection() function to add items.' as tip;

