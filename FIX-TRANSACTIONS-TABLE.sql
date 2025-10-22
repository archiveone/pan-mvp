-- =====================================================
-- FIX/CREATE TRANSACTIONS TABLE PROPERLY
-- =====================================================

-- Drop existing if has wrong structure
DROP TABLE IF EXISTS transactions CASCADE;

-- Create fresh transactions table
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Who & What
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE RESTRICT,
  
  -- Transaction type
  transaction_type VARCHAR(50) NOT NULL,
  
  -- Financial
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment details
  payment_method VARCHAR(50),
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  
  -- Transaction metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON transactions(seller_id);
CREATE INDEX idx_transactions_post ON transactions(post_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);

-- RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_view_own" ON transactions;
DROP POLICY IF EXISTS "transactions_create" ON transactions;

CREATE POLICY "transactions_view_own"
ON transactions FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "transactions_create"
ON transactions FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Trigger for stock
DROP TRIGGER IF EXISTS trigger_decrement_stock ON transactions;

CREATE OR REPLACE FUNCTION decrement_post_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE posts 
    SET 
      stock_quantity = CASE 
        WHEN inventory_type = 'limited' THEN GREATEST(0, COALESCE(stock_quantity, 0) - 1)
        ELSE stock_quantity
      END,
      sold_count = COALESCE(sold_count, 0) + 1
    WHERE id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrement_stock
AFTER INSERT OR UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION decrement_post_stock();

-- Purchase function
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
  IF v_post_record.inventory_type = 'limited' AND COALESCE(v_post_record.stock_quantity, 0) <= 0 THEN
    RAISE EXCEPTION 'Out of stock';
  END IF;
  
  -- Determine collection type
  v_collection_type := CASE COALESCE(v_post_record.post_type, 'post')
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
  
  -- Add to collection (if function exists)
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not add to collection: %', SQLERRM;
  END;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

SELECT '✅ Transactions table fixed and ready!' as status;

