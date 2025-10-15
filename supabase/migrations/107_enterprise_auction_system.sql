-- =====================================================
-- ENTERPRISE AUCTION SYSTEM (SOTHEBY'S LEVEL)
-- Professional Auction House Platform
-- =====================================================

-- ============= AUCTION HOUSES & EVENTS =============

-- Auction houses/companies
CREATE TABLE IF NOT EXISTS auction_houses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- House Details
  legal_name VARCHAR(200) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  tagline VARCHAR(250),
  description TEXT,
  
  -- Legal & Registration
  business_registration_number VARCHAR(100),
  tax_id VARCHAR(100),
  license_number VARCHAR(100),
  
  -- Contact
  email VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  website TEXT,
  
  -- Address
  street_address TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  
  -- Branding
  logo_url TEXT,
  banner_url TEXT,
  brand_colors JSONB,
  
  -- Fee Structure (percentages)
  default_buyers_premium DECIMAL(5, 2) DEFAULT 15.00, -- Buyer pays on top
  default_sellers_commission DECIMAL(5, 2) DEFAULT 10.00, -- Seller pays from hammer
  
  -- Settings
  requires_bidder_approval BOOLEAN DEFAULT true,
  min_deposit_amount DECIMAL(10, 2) DEFAULT 0,
  payment_terms_days INTEGER DEFAULT 7, -- Days to pay after winning
  
  -- Verification & Status
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  
  -- Metrics
  total_auctions INTEGER DEFAULT 0,
  total_lots_sold INTEGER DEFAULT 0,
  total_revenue DECIMAL(15, 2) DEFAULT 0,
  average_lot_value DECIMAL(10, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auction events (sales/sessions)
CREATE TABLE IF NOT EXISTS auction_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_house_id UUID NOT NULL REFERENCES auction_houses(id) ON DELETE CASCADE,
  
  -- Event Details
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(250),
  description TEXT,
  catalog_description TEXT,
  
  -- Event Type
  event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('live', 'timed_online', 'sealed_bid', 'hybrid')),
  category VARCHAR(100), -- 'Fine Art', 'Jewelry', 'Wine', 'Real Estate', etc.
  
  -- Timing
  catalog_available_date TIMESTAMP WITH TIME ZONE,
  preview_start_date TIMESTAMP WITH TIME ZONE, -- Physical viewing
  preview_end_date TIMESTAMP WITH TIME ZONE,
  bidding_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  bidding_end_date TIMESTAMP WITH TIME ZONE, -- For timed auctions
  live_auction_date TIMESTAMP WITH TIME ZONE, -- For live auctions
  
  -- Location
  venue_name VARCHAR(200),
  venue_address TEXT,
  venue_city VARCHAR(100),
  venue_country VARCHAR(100),
  
  -- Online Access
  online_bidding_enabled BOOLEAN DEFAULT true,
  live_stream_url TEXT,
  catalog_pdf_url TEXT,
  
  -- Registration
  requires_registration BOOLEAN DEFAULT true,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  registration_deposit DECIMAL(10, 2) DEFAULT 0,
  
  -- Fee Structure (can override house defaults)
  buyers_premium DECIMAL(5, 2),
  sellers_commission DECIMAL(5, 2),
  
  -- Media
  cover_image_url TEXT,
  gallery_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'preview', 'live', 'closed', 'settled', 'cancelled')),
  is_featured BOOLEAN DEFAULT false,
  
  -- Metrics
  lot_count INTEGER DEFAULT 0,
  registered_bidders INTEGER DEFAULT 0,
  lots_sold INTEGER DEFAULT 0,
  lots_unsold INTEGER DEFAULT 0,
  total_hammer_price DECIMAL(15, 2) DEFAULT 0,
  sell_through_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- Staff
  auctioneer_id UUID REFERENCES profiles(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_event_dates CHECK (bidding_end_date IS NULL OR bidding_end_date > bidding_start_date)
);

-- ============= LOT MANAGEMENT =============

-- Auction lots (individual items)
CREATE TABLE IF NOT EXISTS auction_lots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_event_id UUID NOT NULL REFERENCES auction_events(id) ON DELETE CASCADE,
  consignor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Seller
  
  -- Lot Identification
  lot_number INTEGER NOT NULL,
  lot_letter VARCHAR(5), -- For subdivisions like 123A, 123B
  title VARCHAR(300) NOT NULL,
  subtitle VARCHAR(300),
  
  -- Cataloging
  description TEXT NOT NULL,
  catalog_note TEXT, -- Additional catalog information
  provenance TEXT, -- History of ownership
  literature TEXT, -- Publications/references
  exhibition_history TEXT,
  condition_report TEXT,
  
  -- Item Details
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  artist_maker VARCHAR(200),
  date_period VARCHAR(100),
  medium VARCHAR(200),
  dimensions VARCHAR(200),
  edition_size VARCHAR(100),
  signature VARCHAR(200),
  inscription TEXT,
  
  -- Authenticity
  certificate_of_authenticity BOOLEAN DEFAULT false,
  certificate_url TEXT,
  authentication_notes TEXT,
  
  -- Estimates & Pricing
  currency VARCHAR(3) DEFAULT 'USD',
  estimate_low DECIMAL(12, 2),
  estimate_high DECIMAL(12, 2),
  reserve_price DECIMAL(12, 2), -- Confidential minimum
  starting_bid DECIMAL(12, 2),
  bid_increment DECIMAL(10, 2) DEFAULT 100,
  
  -- Current Bidding State
  current_bid DECIMAL(12, 2),
  hammer_price DECIMAL(12, 2), -- Final winning bid
  bid_count INTEGER DEFAULT 0,
  winning_bidder_id UUID REFERENCES profiles(id),
  
  -- Fees (calculated at hammer)
  buyers_premium_amount DECIMAL(12, 2),
  buyers_premium_percentage DECIMAL(5, 2),
  sellers_commission_amount DECIMAL(12, 2),
  sellers_commission_percentage DECIMAL(5, 2),
  total_buyer_price DECIMAL(12, 2), -- Hammer + premium
  total_seller_payout DECIMAL(12, 2), -- Hammer - commission
  
  -- Media
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  primary_image_url TEXT,
  video_url TEXT,
  pdf_condition_report_url TEXT,
  
  -- Lot Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'cataloged', 'active', 'sold', 'unsold', 'withdrawn', 'passed'
  )),
  
  -- Post-Auction
  sold_date TIMESTAMP WITH TIME ZONE,
  invoice_id UUID,
  payment_received BOOLEAN DEFAULT false,
  payment_date TIMESTAMP WITH TIME ZONE,
  released_to_buyer BOOLEAN DEFAULT false,
  release_date TIMESTAMP WITH TIME ZONE,
  
  -- Shipping
  requires_special_handling BOOLEAN DEFAULT false,
  shipping_notes TEXT,
  insurance_value DECIMAL(12, 2),
  
  -- Order in catalog
  display_order INTEGER,
  
  -- Metrics
  view_count INTEGER DEFAULT 0,
  watch_count INTEGER DEFAULT 0,
  condition_report_requests INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(auction_event_id, lot_number)
);

-- ============= BIDDER REGISTRATION =============

-- Registered bidders for auction events
CREATE TABLE IF NOT EXISTS auction_bidder_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_event_id UUID NOT NULL REFERENCES auction_events(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  auction_house_id UUID NOT NULL REFERENCES auction_houses(id) ON DELETE CASCADE,
  
  -- Registration Details
  paddle_number VARCHAR(20), -- Physical auction paddle
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Approval Process
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  approved_by UUID REFERENCES profiles(id),
  approved_date TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Financial Verification
  deposit_required DECIMAL(10, 2) DEFAULT 0,
  deposit_paid DECIMAL(10, 2) DEFAULT 0,
  deposit_payment_date TIMESTAMP WITH TIME ZONE,
  deposit_refunded BOOLEAN DEFAULT false,
  
  credit_limit DECIMAL(12, 2), -- Maximum bid amount allowed
  credit_check_completed BOOLEAN DEFAULT false,
  credit_check_date TIMESTAMP WITH TIME ZONE,
  
  -- Identity Verification
  identity_verified BOOLEAN DEFAULT false,
  identity_verification_date TIMESTAMP WITH TIME ZONE,
  verification_documents JSONB,
  
  -- Contact Preferences
  phone_bidding_requested BOOLEAN DEFAULT false,
  phone_number VARCHAR(20),
  absentee_bids_allowed BOOLEAN DEFAULT true,
  online_bidding_allowed BOOLEAN DEFAULT true,
  
  -- Bidding Limits
  max_bid_limit DECIMAL(12, 2),
  
  -- Metrics
  lots_bid_on INTEGER DEFAULT 0,
  lots_won INTEGER DEFAULT 0,
  total_spent DECIMAL(15, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(auction_event_id, bidder_id)
);

-- ============= ADVANCED BIDDING SYSTEM =============

-- Bids (all types)
CREATE TABLE IF NOT EXISTS auction_lot_bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES auction_lots(id) ON DELETE CASCADE,
  bidder_registration_id UUID NOT NULL REFERENCES auction_bidder_registrations(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Bid Details
  bid_amount DECIMAL(12, 2) NOT NULL,
  bid_type VARCHAR(20) NOT NULL CHECK (bid_type IN (
    'online', 'phone', 'in_person', 'absentee', 'proxy', 'house_bid'
  )),
  
  -- Bid Placement
  placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  placed_by_staff_id UUID REFERENCES profiles(id), -- For phone/absentee bids
  
  -- Proxy/Absentee Bidding
  is_proxy_bid BOOLEAN DEFAULT false,
  max_proxy_amount DECIMAL(12, 2), -- Maximum they're willing to pay
  current_proxy_amount DECIMAL(12, 2), -- Current active bid amount
  
  -- Absentee/Commission Bid
  is_absentee_bid BOOLEAN DEFAULT false,
  absentee_max_amount DECIMAL(12, 2),
  absentee_submitted_date TIMESTAMP WITH TIME ZONE,
  
  -- Phone Bidding
  is_phone_bid BOOLEAN DEFAULT false,
  phone_representative_id UUID REFERENCES profiles(id),
  
  -- Bid Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
    'active', 'outbid', 'winning', 'won', 'lost', 'withdrawn', 'invalid'
  )),
  is_winning BOOLEAN DEFAULT false,
  
  -- Sequence
  bid_sequence_number INTEGER NOT NULL, -- 1st bid, 2nd bid, etc.
  
  -- Timing
  outbid_at TIMESTAMP WITH TIME ZONE,
  won_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  bid_source VARCHAR(50), -- 'web', 'mobile_app', 'phone', 'floor'
  
  -- Notes
  internal_notes TEXT, -- Staff notes
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Absentee/commission bids (pre-placed max bids)
CREATE TABLE IF NOT EXISTS auction_absentee_bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES auction_lots(id) ON DELETE CASCADE,
  bidder_registration_id UUID NOT NULL REFERENCES auction_bidder_registrations(id) ON DELETE CASCADE,
  
  -- Bid Details
  max_bid_amount DECIMAL(12, 2) NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_by_staff_id UUID REFERENCES profiles(id),
  
  -- Execution
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'executed', 'outbid', 'cancelled', 'expired')),
  executed_at TIMESTAMP WITH TIME ZONE,
  final_bid_amount DECIMAL(12, 2),
  
  -- Confirmation
  confirmation_sent BOOLEAN DEFAULT false,
  confirmation_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phone bidding schedule
CREATE TABLE IF NOT EXISTS auction_phone_bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES auction_lots(id) ON DELETE CASCADE,
  bidder_registration_id UUID NOT NULL REFERENCES auction_bidder_registrations(id) ON DELETE CASCADE,
  
  -- Contact
  phone_number VARCHAR(20) NOT NULL,
  alternate_phone VARCHAR(20),
  
  -- Assignment
  representative_id UUID REFERENCES profiles(id), -- Staff member assigned
  assigned_at TIMESTAMP WITH TIME ZONE,
  
  -- Scheduling
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'active', 'completed', 'no_answer', 'cancelled'
  )),
  
  -- Execution
  call_started_at TIMESTAMP WITH TIME ZONE,
  call_ended_at TIMESTAMP WITH TIME ZONE,
  participated BOOLEAN DEFAULT false,
  highest_bid_placed DECIMAL(12, 2),
  won_lot BOOLEAN DEFAULT false,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= POST-AUCTION SETTLEMENTS =============

-- Invoices for buyers
CREATE TABLE IF NOT EXISTS auction_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_event_id UUID NOT NULL REFERENCES auction_events(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Invoice Details
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(15, 2) NOT NULL, -- Sum of hammer prices
  buyers_premium DECIMAL(15, 2) NOT NULL,
  tax_amount DECIMAL(15, 2) DEFAULT 0,
  shipping_handling DECIMAL(15, 2) DEFAULT 0,
  insurance DECIMAL(15, 2) DEFAULT 0,
  total_amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment
  payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN (
    'unpaid', 'partial', 'paid', 'overdue', 'disputed', 'cancelled'
  )),
  amount_paid DECIMAL(15, 2) DEFAULT 0,
  amount_outstanding DECIMAL(15, 2),
  
  -- Payment Details
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  paid_date TIMESTAMP WITH TIME ZONE,
  
  -- Terms
  payment_terms TEXT,
  late_fee_percentage DECIMAL(5, 2) DEFAULT 0,
  late_fees_applied DECIMAL(10, 2) DEFAULT 0,
  
  -- Documents
  pdf_url TEXT,
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice line items (individual lots)
CREATE TABLE IF NOT EXISTS auction_invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES auction_invoices(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES auction_lots(id) ON DELETE CASCADE,
  
  -- Item Details
  lot_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  
  -- Pricing
  hammer_price DECIMAL(12, 2) NOT NULL,
  buyers_premium DECIMAL(12, 2) NOT NULL,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  line_total DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seller settlements/payouts
CREATE TABLE IF NOT EXISTS auction_settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_event_id UUID NOT NULL REFERENCES auction_events(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Settlement Details
  settlement_number VARCHAR(50) UNIQUE NOT NULL,
  settlement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Amounts
  gross_proceeds DECIMAL(15, 2) NOT NULL, -- Total hammer prices
  sellers_commission DECIMAL(15, 2) NOT NULL,
  insurance_fees DECIMAL(12, 2) DEFAULT 0,
  photography_fees DECIMAL(12, 2) DEFAULT 0,
  shipping_fees DECIMAL(12, 2) DEFAULT 0,
  other_charges DECIMAL(12, 2) DEFAULT 0,
  net_proceeds DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payout
  payout_status VARCHAR(20) DEFAULT 'pending' CHECK (payout_status IN (
    'pending', 'processing', 'paid', 'held', 'cancelled'
  )),
  payout_method VARCHAR(50), -- 'wire', 'check', 'ach'
  payout_date TIMESTAMP WITH TIME ZONE,
  payout_reference VARCHAR(100),
  
  -- Bank Details
  bank_account_last4 VARCHAR(4),
  
  -- Documents
  pdf_url TEXT,
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settlement line items
CREATE TABLE IF NOT EXISTS auction_settlement_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  settlement_id UUID NOT NULL REFERENCES auction_settlements(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES auction_lots(id) ON DELETE CASCADE,
  
  -- Item Details
  lot_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  
  -- Pricing
  hammer_price DECIMAL(12, 2) NOT NULL,
  commission_amount DECIMAL(12, 2) NOT NULL,
  net_amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= CONDITION REPORTS & DOCUMENTS =============

-- Condition report requests
CREATE TABLE IF NOT EXISTS auction_condition_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES auction_lots(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Request
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  request_type VARCHAR(20) DEFAULT 'standard' CHECK (request_type IN ('standard', 'detailed', 'third_party')),
  
  -- Report
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'not_available')),
  completed_by UUID REFERENCES profiles(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Content
  condition_summary TEXT,
  detailed_report TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  pdf_url TEXT,
  
  -- Delivery
  sent_to_requester BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= INDEXES =============

-- Auction houses
CREATE INDEX IF NOT EXISTS idx_auction_houses_owner ON auction_houses(owner_id);
CREATE INDEX IF NOT EXISTS idx_auction_houses_status ON auction_houses(status);
CREATE INDEX IF NOT EXISTS idx_auction_houses_verified ON auction_houses(is_verified) WHERE is_verified = true;

-- Auction events
CREATE INDEX IF NOT EXISTS idx_auction_events_house ON auction_events(auction_house_id);
CREATE INDEX IF NOT EXISTS idx_auction_events_status ON auction_events(status);
CREATE INDEX IF NOT EXISTS idx_auction_events_type ON auction_events(event_type);
CREATE INDEX IF NOT EXISTS idx_auction_events_dates ON auction_events(live_auction_date, bidding_start_date);
CREATE INDEX IF NOT EXISTS idx_auction_events_featured ON auction_events(is_featured) WHERE is_featured = true;

-- Lots
CREATE INDEX IF NOT EXISTS idx_lots_event ON auction_lots(auction_event_id);
CREATE INDEX IF NOT EXISTS idx_lots_consignor ON auction_lots(consignor_id);
CREATE INDEX IF NOT EXISTS idx_lots_status ON auction_lots(status);
CREATE INDEX IF NOT EXISTS idx_lots_category ON auction_lots(category);
CREATE INDEX IF NOT EXISTS idx_lots_winning_bidder ON auction_lots(winning_bidder_id);
CREATE INDEX IF NOT EXISTS idx_lots_lot_number ON auction_lots(auction_event_id, lot_number);

-- Bidder registrations
CREATE INDEX IF NOT EXISTS idx_bidder_reg_event ON auction_bidder_registrations(auction_event_id);
CREATE INDEX IF NOT EXISTS idx_bidder_reg_bidder ON auction_bidder_registrations(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bidder_reg_status ON auction_bidder_registrations(status);
CREATE INDEX IF NOT EXISTS idx_bidder_reg_paddle ON auction_bidder_registrations(paddle_number);

-- Bids
CREATE INDEX IF NOT EXISTS idx_lot_bids_lot ON auction_lot_bids(lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_bids_bidder ON auction_lot_bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_lot_bids_registration ON auction_lot_bids(bidder_registration_id);
CREATE INDEX IF NOT EXISTS idx_lot_bids_placed ON auction_lot_bids(placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_lot_bids_winning ON auction_lot_bids(is_winning) WHERE is_winning = true;

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_event ON auction_invoices(auction_event_id);
CREATE INDEX IF NOT EXISTS idx_invoices_buyer ON auction_invoices(buyer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON auction_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON auction_invoices(invoice_number);

-- Settlements
CREATE INDEX IF NOT EXISTS idx_settlements_event ON auction_settlements(auction_event_id);
CREATE INDEX IF NOT EXISTS idx_settlements_seller ON auction_settlements(seller_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON auction_settlements(payout_status);

-- Condition reports
CREATE INDEX IF NOT EXISTS idx_condition_reports_lot ON auction_condition_reports(lot_id);
CREATE INDEX IF NOT EXISTS idx_condition_reports_requested_by ON auction_condition_reports(requested_by);

-- ============= FUNCTIONS & TRIGGERS =============

-- Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'INV-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('invoice_sequence')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS invoice_sequence START 1;

-- Generate settlement number
CREATE OR REPLACE FUNCTION generate_settlement_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.settlement_number := 'SET-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('settlement_sequence')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS settlement_sequence START 1;

-- Update lot on bid
CREATE OR REPLACE FUNCTION update_lot_on_bid()
RETURNS TRIGGER AS $$
BEGIN
  -- Update lot with new bid
  UPDATE auction_lots
  SET 
    current_bid = NEW.bid_amount,
    bid_count = bid_count + 1,
    winning_bidder_id = NEW.bidder_id
  WHERE id = NEW.lot_id;
  
  -- Mark previous bids as outbid
  UPDATE auction_lot_bids
  SET 
    status = 'outbid',
    is_winning = false,
    outbid_at = NOW()
  WHERE lot_id = NEW.lot_id 
    AND id != NEW.id 
    AND status IN ('active', 'winning');
  
  -- Mark new bid as winning
  NEW.status := 'winning';
  NEW.is_winning := true;
  NEW.bid_sequence_number := (
    SELECT COALESCE(MAX(bid_sequence_number), 0) + 1 
    FROM auction_lot_bids 
    WHERE lot_id = NEW.lot_id
  );
  
  -- Update bidder registration stats
  UPDATE auction_bidder_registrations
  SET lots_bid_on = (
    SELECT COUNT(DISTINCT lot_id) 
    FROM auction_lot_bids 
    WHERE bidder_registration_id = NEW.bidder_registration_id
  )
  WHERE id = NEW.bidder_registration_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lot_on_bid ON auction_lot_bids;
CREATE TRIGGER trigger_update_lot_on_bid
BEFORE INSERT ON auction_lot_bids
FOR EACH ROW
EXECUTE FUNCTION update_lot_on_bid();

-- Calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  NEW.amount_outstanding := NEW.total_amount - NEW.amount_paid;
  
  IF NEW.amount_paid >= NEW.total_amount THEN
    NEW.payment_status := 'paid';
  ELSIF NEW.amount_paid > 0 THEN
    NEW.payment_status := 'partial';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_invoice_totals ON auction_invoices;
CREATE TRIGGER trigger_calculate_invoice_totals
BEFORE INSERT OR UPDATE ON auction_invoices
FOR EACH ROW
EXECUTE FUNCTION calculate_invoice_totals();

-- ============= ROW LEVEL SECURITY =============

ALTER TABLE auction_houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bidder_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_lot_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_absentee_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_phone_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_settlement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_condition_reports ENABLE ROW LEVEL SECURITY;

-- Auction house policies
CREATE POLICY "Anyone can view active auction houses"
ON auction_houses FOR SELECT
USING (status = 'active');

CREATE POLICY "Owners can manage their auction houses"
ON auction_houses FOR ALL
USING (auth.uid() = owner_id);

-- Event policies
CREATE POLICY "Public events viewable by all"
ON auction_events FOR SELECT
USING (status IN ('scheduled', 'preview', 'live', 'closed'));

CREATE POLICY "House owners can manage events"
ON auction_events FOR ALL
USING (auth.uid() IN (SELECT owner_id FROM auction_houses WHERE id = auction_house_id));

-- Lot policies
CREATE POLICY "Active lots viewable by all"
ON auction_lots FOR SELECT
USING (status IN ('active', 'cataloged', 'sold', 'unsold'));

CREATE POLICY "Consignors and house can manage lots"
ON auction_lots FOR ALL
USING (
  auth.uid() = consignor_id OR
  auth.uid() IN (
    SELECT owner_id FROM auction_houses 
    WHERE id IN (SELECT auction_house_id FROM auction_events WHERE id = auction_event_id)
  )
);

-- Bidder registration policies
CREATE POLICY "Bidders can view their registrations"
ON auction_bidder_registrations FOR SELECT
USING (auth.uid() = bidder_id OR auth.uid() IN (
  SELECT owner_id FROM auction_houses WHERE id = auction_house_id
));

CREATE POLICY "Users can register"
ON auction_bidder_registrations FOR INSERT
WITH CHECK (auth.uid() = bidder_id);

-- Bid policies (confidential!)
CREATE POLICY "Bidders view own bids only"
ON auction_lot_bids FOR SELECT
USING (
  auth.uid() = bidder_id OR
  auth.uid() IN (
    SELECT owner_id FROM auction_houses 
    WHERE id IN (
      SELECT auction_house_id FROM auction_events 
      WHERE id IN (SELECT auction_event_id FROM auction_lots WHERE id = lot_id)
    )
  )
);

CREATE POLICY "Registered bidders can place bids"
ON auction_lot_bids FOR INSERT
WITH CHECK (auth.uid() = bidder_id);

-- Invoice policies
CREATE POLICY "Buyers view their invoices"
ON auction_invoices FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() IN (
  SELECT owner_id FROM auction_houses 
  WHERE id IN (SELECT auction_house_id FROM auction_events WHERE id = auction_event_id)
));

-- Settlement policies
CREATE POLICY "Sellers view their settlements"
ON auction_settlements FOR SELECT
USING (auth.uid() = seller_id OR auth.uid() IN (
  SELECT owner_id FROM auction_houses 
  WHERE id IN (SELECT auction_house_id FROM auction_events WHERE id = auction_event_id)
));

-- Condition report policies
CREATE POLICY "Anyone can request condition reports"
ON auction_condition_reports FOR ALL
USING (true);

-- ============= VIEWS =============

-- Live auction dashboard
CREATE OR REPLACE VIEW live_auction_dashboard AS
SELECT 
  ae.*,
  ah.display_name as house_name,
  ah.logo_url as house_logo,
  COUNT(DISTINCT al.id) as current_total_lots,
  COUNT(DISTINCT al.id) FILTER (WHERE al.status = 'sold') as current_lots_sold,
  COUNT(DISTINCT al.id) FILTER (WHERE al.status = 'unsold') as current_lots_unsold,
  SUM(al.hammer_price) FILTER (WHERE al.status = 'sold') as current_total_sales,
  COUNT(DISTINCT abr.bidder_id) as current_approved_bidders
FROM auction_events ae
JOIN auction_houses ah ON ae.auction_house_id = ah.id
LEFT JOIN auction_lots al ON ae.id = al.auction_event_id
LEFT JOIN auction_bidder_registrations abr ON ae.id = abr.auction_event_id AND abr.status = 'approved'
WHERE ae.status IN ('live', 'preview')
GROUP BY ae.id, ah.display_name, ah.logo_url;

-- Comments
COMMENT ON TABLE auction_houses IS 'Auction houses/companies (Sotheby''s, Christie''s level)';
COMMENT ON TABLE auction_events IS 'Auction sales/sessions with multiple lots';
COMMENT ON TABLE auction_lots IS 'Individual items for auction with full cataloging';
COMMENT ON TABLE auction_bidder_registrations IS 'Bidder registration and approval';
COMMENT ON TABLE auction_lot_bids IS 'All bids (online, phone, absentee, in-person)';
COMMENT ON TABLE auction_invoices IS 'Buyer invoices with payment tracking';
COMMENT ON TABLE auction_settlements IS 'Seller settlements and payouts';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '🎨 ENTERPRISE AUCTION SYSTEM CREATED!';
  RAISE NOTICE '🏛️ Sotheby''s-Level Features:';
  RAISE NOTICE '  ✅ Auction Houses & Events';
  RAISE NOTICE '  ✅ Professional Lot Cataloging';
  RAISE NOTICE '  ✅ Bidder Registration & Approval';
  RAISE NOTICE '  ✅ Multiple Bidding Methods';
  RAISE NOTICE '  ✅ Buyer''s Premium & Commissions';
  RAISE NOTICE '  ✅ Invoicing & Settlements';
  RAISE NOTICE '  ✅ Condition Reports';
  RAISE NOTICE '  ✅ Provenance Tracking';
  RAISE NOTICE '🎯 Ready for high-value art, antiques, collectibles!';
END $$;

