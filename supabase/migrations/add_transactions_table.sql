-- Drop table if exists (for clean migration)
DROP TABLE IF EXISTS transactions CASCADE;

-- Create transactions table for payment tracking
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  listing_id UUID NOT NULL,
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50) NOT NULL,
  payment_provider VARCHAR(50),
  provider_transaction_id VARCHAR(255),
  
  -- Transaction status
  status VARCHAR(50) DEFAULT 'pending',
  
  -- Booking details (optional, for services/events)
  booking_date DATE,
  booking_time TIME,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add indexes for better query performance
CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON transactions(seller_id);
CREATE INDEX idx_transactions_listing ON transactions(listing_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Add foreign key constraints (only if referenced tables exist)
DO $$ 
BEGIN
  -- Add buyer_id foreign key if profiles table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    BEGIN
      ALTER TABLE transactions 
      ADD CONSTRAINT fk_transactions_buyer 
      FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not add buyer_id foreign key: %', SQLERRM;
    END;
  END IF;

  -- Add seller_id foreign key if profiles table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    BEGIN
      ALTER TABLE transactions 
      ADD CONSTRAINT fk_transactions_seller 
      FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not add seller_id foreign key: %', SQLERRM;
    END;
  END IF;

  -- Add listing_id foreign key if posts table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'posts'
  ) THEN
    BEGIN
      ALTER TABLE transactions 
      ADD CONSTRAINT fk_transactions_listing 
      FOREIGN KEY (listing_id) REFERENCES posts(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not add listing_id foreign key: %', SQLERRM;
    END;
  END IF;
END $$;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_transactions_updated_at();

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own transactions (as buyer or seller)
CREATE POLICY "Users can view their own transactions"
  ON transactions
  FOR SELECT
  USING (
    auth.uid() = buyer_id OR 
    auth.uid() = seller_id
  );

-- Users can create transactions as buyers
CREATE POLICY "Users can create transactions as buyers"
  ON transactions
  FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Sellers can update transaction status
CREATE POLICY "Sellers can update transactions"
  ON transactions
  FOR UPDATE
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Admin view for all transactions (optional - comment out if no admin role)
-- CREATE POLICY "Admins can view all transactions"
--   ON transactions
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE id = auth.uid()
--       AND role = 'admin'
--     )
--   );

-- Comments
COMMENT ON TABLE transactions IS 'Payment transactions and bookings';
COMMENT ON COLUMN transactions.amount IS 'Transaction amount in specified currency';
COMMENT ON COLUMN transactions.status IS 'Transaction status: pending, completed, failed, refunded';
COMMENT ON COLUMN transactions.payment_method IS 'Payment method used: card, paypal, crypto';
COMMENT ON COLUMN transactions.booking_date IS 'Scheduled date for services/events';
COMMENT ON COLUMN transactions.metadata IS 'Additional transaction metadata as JSON';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Transactions table created successfully!';
  RAISE NOTICE 'Foreign keys will be added if profiles/posts tables exist.';
END $$;
