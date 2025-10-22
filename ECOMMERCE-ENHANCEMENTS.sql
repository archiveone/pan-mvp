-- =====================================================
-- E-COMMERCE ENHANCEMENTS
-- Auto-generation, triggers, and helper functions
-- Run this AFTER basic tables are created
-- =====================================================

-- ============= AUTO-GENERATE ORDER NUMBERS =============

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Function to auto-generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'ORD-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS auto_generate_order_number ON marketplace_orders;
CREATE TRIGGER auto_generate_order_number
BEFORE INSERT ON marketplace_orders
FOR EACH ROW
EXECUTE FUNCTION generate_order_number();

-- ============= AUTO-GENERATE BOOKING NUMBERS =============

CREATE SEQUENCE IF NOT EXISTS booking_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL OR NEW.booking_number = '' THEN
    NEW.booking_number := 'BK-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('booking_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_generate_booking_number ON user_bookings;
CREATE TRIGGER auto_generate_booking_number
BEFORE INSERT ON user_bookings
FOR EACH ROW
EXECUTE FUNCTION generate_booking_number();

-- ============= AUTO-GENERATE CONFIRMATION CODES =============

CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_code IS NULL OR NEW.confirmation_code = '' THEN
    NEW.confirmation_code := UPPER(substring(md5(random()::text) from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_generate_confirmation ON user_bookings;
CREATE TRIGGER auto_generate_confirmation
BEFORE INSERT ON user_bookings
FOR EACH ROW
EXECUTE FUNCTION generate_confirmation_code();

-- ============= AUTO-GENERATE QR CODES FOR TICKETS =============

CREATE OR REPLACE FUNCTION generate_ticket_qr()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    NEW.qr_code := 'TKT-' || NEW.id::TEXT || '-' || UPPER(substring(md5(random()::text) from 1 for 12));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_generate_ticket_qr ON ticket_purchases;
CREATE TRIGGER auto_generate_ticket_qr
BEFORE INSERT ON ticket_purchases
FOR EACH ROW
EXECUTE FUNCTION generate_ticket_qr();

-- ============= AUTO-UPDATE INVENTORY =============

-- Update listing inventory when order is paid
CREATE OR REPLACE FUNCTION update_listing_inventory()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD IS NULL OR OLD.payment_status != 'paid') THEN
    -- Reduce available quantity
    UPDATE marketplace_listings
    SET 
      quantity_available = GREATEST(0, quantity_available - NEW.quantity),
      quantity_sold = quantity_sold + NEW.quantity
    WHERE id = NEW.listing_id;
  END IF;
  
  -- Restore inventory on refund
  IF NEW.payment_status = 'refunded' AND OLD.payment_status = 'paid' THEN
    UPDATE marketplace_listings
    SET 
      quantity_available = quantity_available + NEW.quantity,
      quantity_sold = GREATEST(0, quantity_sold - NEW.quantity)
    WHERE id = NEW.listing_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_update_inventory ON marketplace_orders;
CREATE TRIGGER auto_update_inventory
AFTER INSERT OR UPDATE ON marketplace_orders
FOR EACH ROW
EXECUTE FUNCTION update_listing_inventory();

-- ============= AUTO-UPDATE TICKET INVENTORY =============

CREATE OR REPLACE FUNCTION update_ticket_inventory()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD IS NULL OR OLD.payment_status != 'paid') THEN
    UPDATE event_tickets
    SET 
      quantity_available = GREATEST(0, quantity_available - NEW.quantity),
      quantity_sold = quantity_sold + NEW.quantity
    WHERE id = NEW.ticket_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_update_ticket_inventory ON ticket_purchases;
CREATE TRIGGER auto_update_ticket_inventory
AFTER INSERT OR UPDATE ON ticket_purchases
FOR EACH ROW
EXECUTE FUNCTION update_ticket_inventory();

-- ============= AUTO-ADD TO LIBRARY =============

-- Add digital content to user's library when purchased
CREATE OR REPLACE FUNCTION add_to_library_on_purchase()
RETURNS TRIGGER AS $$
DECLARE
  v_post RECORD;
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD IS NULL OR OLD.payment_status != 'paid') THEN
    -- Get post details
    SELECT p.id, p.title, p.content_type, p.user_id
    INTO v_post
    FROM marketplace_listings ml
    JOIN posts p ON ml.post_id = p.id
    WHERE ml.id = NEW.listing_id
      AND p.content_type IN ('music', 'video', 'document', 'post');
    
    IF FOUND AND v_post.content_type IN ('music', 'video', 'document') THEN
      -- Add to user's library
      INSERT INTO user_library (
        user_id,
        content_id,
        content_type,
        purchased_at,
        price_paid
      )
      VALUES (
        NEW.buyer_id,
        v_post.id,
        v_post.content_type,
        NOW(),
        NEW.total_amount
      )
      ON CONFLICT (user_id, content_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_add_to_library ON marketplace_orders;
CREATE TRIGGER auto_add_to_library
AFTER INSERT OR UPDATE ON marketplace_orders
FOR EACH ROW
EXECUTE FUNCTION add_to_library_on_purchase();

-- ============= TRANSACTION TRACKING =============

-- Auto-create transaction record
CREATE OR REPLACE FUNCTION create_transaction_record()
RETURNS TRIGGER AS $$
DECLARE
  v_seller_id UUID;
BEGIN
  -- Get seller from listing
  SELECT user_id INTO v_seller_id
  FROM marketplace_listings
  WHERE id = NEW.listing_id;
  
  -- Create transaction
  INSERT INTO transactions (
    transaction_number,
    buyer_id,
    seller_id,
    type,
    amount,
    currency,
    payment_intent_id,
    status
  )
  VALUES (
    'TXN-' || NEW.order_number,
    NEW.buyer_id,
    v_seller_id,
    'purchase',
    NEW.total_amount,
    NEW.currency,
    NEW.payment_intent_id,
    NEW.payment_status
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_create_transaction ON marketplace_orders;
CREATE TRIGGER auto_create_transaction
AFTER INSERT ON marketplace_orders
FOR EACH ROW
EXECUTE FUNCTION create_transaction_record();

-- ============= HELPER VIEWS =============

-- My active orders (buyer perspective)
CREATE OR REPLACE VIEW my_purchases AS
SELECT 
  mo.*,
  ml.title as item_title,
  ml.images as item_images,
  seller.name as seller_name,
  seller.username as seller_username,
  seller.avatar_url as seller_avatar
FROM marketplace_orders mo
JOIN marketplace_listings ml ON mo.listing_id = ml.id
JOIN profiles seller ON mo.seller_id = seller.id
ORDER BY mo.created_at DESC;

-- My sales (seller perspective)
CREATE OR REPLACE VIEW my_sales AS
SELECT 
  mo.*,
  ml.title as item_title,
  ml.images as item_images,
  buyer.name as buyer_name,
  buyer.username as buyer_username,
  buyer.avatar_url as buyer_avatar
FROM marketplace_orders mo
JOIN marketplace_listings ml ON mo.listing_id = ml.id
JOIN profiles buyer ON mo.buyer_id = buyer.id
ORDER BY mo.created_at DESC;

-- ============= USEFUL FUNCTIONS =============

-- Get user's total spending
CREATE OR REPLACE FUNCTION get_user_total_spending(p_user_id UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  total DECIMAL(10, 2);
BEGIN
  SELECT COALESCE(SUM(total_amount), 0)
  INTO total
  FROM marketplace_orders
  WHERE buyer_id = p_user_id AND payment_status = 'paid';
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Get user's total earnings
CREATE OR REPLACE FUNCTION get_user_total_earnings(p_user_id UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  total DECIMAL(10, 2);
BEGIN
  SELECT COALESCE(SUM(total_amount), 0)
  INTO total
  FROM marketplace_orders
  WHERE seller_id = p_user_id AND payment_status = 'paid';
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Check if user owns content
CREATE OR REPLACE FUNCTION user_owns_content(p_user_id UUID, p_content_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  owns BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_library
    WHERE user_id = p_user_id AND content_id = p_content_id
  ) INTO owns;
  
  RETURN owns;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '🎉 E-COMMERCE ENHANCEMENTS ADDED!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Auto-generate order numbers';
  RAISE NOTICE '✅ Auto-generate booking numbers';
  RAISE NOTICE '✅ Auto-generate confirmation codes';
  RAISE NOTICE '✅ Auto-generate QR codes for tickets';
  RAISE NOTICE '✅ Auto-update inventory on purchases';
  RAISE NOTICE '✅ Auto-add digital content to library';
  RAISE NOTICE '✅ Auto-create transaction records';
  RAISE NOTICE '✅ Helper views (my_purchases, my_sales)';
  RAISE NOTICE '✅ Utility functions for stats';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your marketplace is now FULLY AUTOMATED!';
END $$;

