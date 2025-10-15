-- =====================================================
-- AUCTIONS AND FUNDRAISERS SYSTEM
-- Complete auction bidding and crowdfunding campaigns
-- =====================================================

-- ============= AUCTION SYSTEM =============

-- Auction listings table
CREATE TABLE IF NOT EXISTS auctions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Auction Details
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  
  -- Item Details
  condition VARCHAR(20) CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
  starting_price DECIMAL(10, 2) NOT NULL CHECK (starting_price >= 0),
  reserve_price DECIMAL(10, 2), -- Minimum price seller will accept
  buy_now_price DECIMAL(10, 2), -- Optional buy-it-now price
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Bidding Rules
  min_bid_increment DECIMAL(10, 2) DEFAULT 1.00,
  bid_count INTEGER DEFAULT 0,
  current_bid DECIMAL(10, 2),
  current_winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Timing
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_extend BOOLEAN DEFAULT true, -- Extend if bid in last 5 minutes
  extension_minutes INTEGER DEFAULT 5,
  
  -- Media
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  primary_image_url TEXT,
  video_url TEXT,
  
  -- Location
  location TEXT,
  shipping_available BOOLEAN DEFAULT true,
  local_pickup BOOLEAN DEFAULT true,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'live', 'ended', 'sold', 'cancelled')),
  is_featured BOOLEAN DEFAULT false,
  
  -- Metrics
  view_count INTEGER DEFAULT 0,
  watch_count INTEGER DEFAULT 0, -- Users watching/following the auction
  
  -- Tags
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_auction_times CHECK (end_time > start_time),
  CONSTRAINT valid_reserve_price CHECK (reserve_price IS NULL OR reserve_price >= starting_price),
  CONSTRAINT valid_buy_now CHECK (buy_now_price IS NULL OR buy_now_price > starting_price)
);

-- Bids table
CREATE TABLE IF NOT EXISTS auction_bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Bid Details
  bid_amount DECIMAL(10, 2) NOT NULL,
  is_auto_bid BOOLEAN DEFAULT false,
  max_auto_bid DECIMAL(10, 2), -- For proxy bidding
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'outbid', 'winning', 'won', 'lost', 'retracted')),
  is_winning BOOLEAN DEFAULT false,
  
  -- Timestamps
  placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  outbid_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  bid_number INTEGER NOT NULL, -- Sequential bid number for this auction
  ip_address INET,
  user_agent TEXT
);

-- Auction watchers (users following an auction)
CREATE TABLE IF NOT EXISTS auction_watchers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notify_on_bid BOOLEAN DEFAULT true,
  notify_on_outbid BOOLEAN DEFAULT true,
  notify_on_end BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(auction_id, user_id)
);

-- ============= FUNDRAISER/CROWDFUNDING SYSTEM =============

-- Fundraiser campaigns table
CREATE TABLE IF NOT EXISTS fundraisers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Campaign Details
  title VARCHAR(200) NOT NULL,
  tagline VARCHAR(250),
  story TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  campaign_type VARCHAR(20) NOT NULL CHECK (campaign_type IN ('donation', 'reward', 'equity', 'flexible', 'all_or_nothing')),
  
  -- Financial Goals
  goal_amount DECIMAL(12, 2) NOT NULL CHECK (goal_amount > 0),
  currency VARCHAR(3) DEFAULT 'USD',
  current_amount DECIMAL(12, 2) DEFAULT 0,
  backer_count INTEGER DEFAULT 0,
  
  -- Timing
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Media
  cover_image_url TEXT,
  video_url TEXT,
  gallery_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Reward Tiers (for reward-based campaigns)
  has_rewards BOOLEAN DEFAULT false,
  
  -- Campaign Settings
  allow_custom_amount BOOLEAN DEFAULT true,
  min_contribution DECIMAL(10, 2) DEFAULT 1.00,
  max_contribution DECIMAL(10, 2),
  
  -- Social Impact
  beneficiary_name VARCHAR(200), -- Who benefits (charity, person, etc.)
  is_charity BOOLEAN DEFAULT false,
  charity_registration_number VARCHAR(100),
  
  -- Location
  country VARCHAR(100),
  city VARCHAR(100),
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'active', 'successful', 'unsuccessful', 'cancelled')),
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  -- Metrics
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  
  -- Tags
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Milestones & Updates
  milestone_count INTEGER DEFAULT 0,
  update_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_campaign_dates CHECK (end_date > start_date)
);

-- Fundraiser reward tiers
CREATE TABLE IF NOT EXISTS fundraiser_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fundraiser_id UUID NOT NULL REFERENCES fundraisers(id) ON DELETE CASCADE,
  
  -- Reward Details
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Availability
  quantity_available INTEGER, -- NULL = unlimited
  quantity_claimed INTEGER DEFAULT 0,
  is_limited BOOLEAN DEFAULT false,
  
  -- Delivery
  estimated_delivery_date DATE,
  shipping_required BOOLEAN DEFAULT false,
  ships_to TEXT[], -- Array of countries
  
  -- Display
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT quantity_check CHECK (quantity_claimed <= quantity_available OR quantity_available IS NULL)
);

-- Fundraiser contributions/backers
CREATE TABLE IF NOT EXISTS fundraiser_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fundraiser_id UUID NOT NULL REFERENCES fundraisers(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES fundraiser_rewards(id) ON DELETE SET NULL,
  contributor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Contribution Details
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'USD',
  is_anonymous BOOLEAN DEFAULT false,
  
  -- Payment
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  payment_id VARCHAR(100),
  
  -- Contributor Info (if anonymous, these are null)
  contributor_name VARCHAR(200),
  contributor_email VARCHAR(200),
  contributor_message TEXT,
  
  -- Reward Fulfillment (if reward-based)
  shipping_address JSONB,
  fulfillment_status VARCHAR(20) CHECK (fulfillment_status IN ('pending', 'processing', 'shipped', 'delivered', 'not_applicable')),
  tracking_number VARCHAR(100),
  
  -- Timestamps
  pledged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  charged_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fundraiser updates/news
CREATE TABLE IF NOT EXISTS fundraiser_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fundraiser_id UUID NOT NULL REFERENCES fundraisers(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Update Details
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  
  -- Media
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  video_url TEXT,
  
  -- Visibility
  is_backers_only BOOLEAN DEFAULT false,
  
  -- Engagement
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fundraiser milestones
CREATE TABLE IF NOT EXISTS fundraiser_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fundraiser_id UUID NOT NULL REFERENCES fundraisers(id) ON DELETE CASCADE,
  
  -- Milestone Details
  title VARCHAR(200) NOT NULL,
  description TEXT,
  target_amount DECIMAL(10, 2) NOT NULL,
  
  -- Status
  is_achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMP WITH TIME ZONE,
  
  -- Display
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= INDEXES =============

-- Auction indexes
CREATE INDEX IF NOT EXISTS idx_auctions_user ON auctions(user_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_category ON auctions(category);
CREATE INDEX IF NOT EXISTS idx_auctions_end_time ON auctions(end_time);
CREATE INDEX IF NOT EXISTS idx_auctions_featured ON auctions(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_auctions_live ON auctions(status, end_time) WHERE status = 'live';

-- Bid indexes
CREATE INDEX IF NOT EXISTS idx_bids_auction ON auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder ON auction_bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON auction_bids(status);
CREATE INDEX IF NOT EXISTS idx_bids_winning ON auction_bids(is_winning) WHERE is_winning = true;
CREATE INDEX IF NOT EXISTS idx_bids_placed ON auction_bids(placed_at DESC);

-- Watcher indexes
CREATE INDEX IF NOT EXISTS idx_watchers_auction ON auction_watchers(auction_id);
CREATE INDEX IF NOT EXISTS idx_watchers_user ON auction_watchers(user_id);

-- Fundraiser indexes
CREATE INDEX IF NOT EXISTS idx_fundraisers_user ON fundraisers(user_id);
CREATE INDEX IF NOT EXISTS idx_fundraisers_status ON fundraisers(status);
CREATE INDEX IF NOT EXISTS idx_fundraisers_category ON fundraisers(category);
CREATE INDEX IF NOT EXISTS idx_fundraisers_type ON fundraisers(campaign_type);
CREATE INDEX IF NOT EXISTS idx_fundraisers_end_date ON fundraisers(end_date);
CREATE INDEX IF NOT EXISTS idx_fundraisers_featured ON fundraisers(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_fundraisers_active ON fundraisers(status, end_date) WHERE status = 'active';

-- Reward indexes
CREATE INDEX IF NOT EXISTS idx_rewards_fundraiser ON fundraiser_rewards(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_rewards_active ON fundraiser_rewards(is_active) WHERE is_active = true;

-- Contribution indexes
CREATE INDEX IF NOT EXISTS idx_contributions_fundraiser ON fundraiser_contributions(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_contributions_contributor ON fundraiser_contributions(contributor_id);
CREATE INDEX IF NOT EXISTS idx_contributions_reward ON fundraiser_contributions(reward_id);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON fundraiser_contributions(payment_status);
CREATE INDEX IF NOT EXISTS idx_contributions_pledged ON fundraiser_contributions(pledged_at DESC);

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_updates_fundraiser ON fundraiser_updates(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_updates_author ON fundraiser_updates(author_id);
CREATE INDEX IF NOT EXISTS idx_updates_created ON fundraiser_updates(created_at DESC);

-- Milestone indexes
CREATE INDEX IF NOT EXISTS idx_milestones_fundraiser ON fundraiser_milestones(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_milestones_order ON fundraiser_milestones(display_order);

-- ============= FUNCTIONS & TRIGGERS =============

-- Function to update auction on new bid
CREATE OR REPLACE FUNCTION update_auction_on_bid()
RETURNS TRIGGER AS $$
DECLARE
  v_auction_end TIMESTAMP WITH TIME ZONE;
  v_auto_extend BOOLEAN;
  v_extension_minutes INTEGER;
BEGIN
  -- Get auction details
  SELECT end_time, auto_extend, extension_minutes 
  INTO v_auction_end, v_auto_extend, v_extension_minutes
  FROM auctions 
  WHERE id = NEW.auction_id;
  
  -- Update auction
  UPDATE auctions
  SET 
    bid_count = bid_count + 1,
    current_bid = NEW.bid_amount,
    current_winner_id = NEW.bidder_id,
    -- Auto-extend if bid placed in last few minutes
    end_time = CASE 
      WHEN v_auto_extend AND (v_auction_end - NOW()) < (v_extension_minutes || ' minutes')::INTERVAL
      THEN v_auction_end + (v_extension_minutes || ' minutes')::INTERVAL
      ELSE end_time
    END
  WHERE id = NEW.auction_id;
  
  -- Mark previous bids as outbid
  UPDATE auction_bids
  SET 
    status = 'outbid',
    is_winning = false,
    outbid_at = NOW()
  WHERE auction_id = NEW.auction_id 
    AND id != NEW.id 
    AND status = 'active';
  
  -- Mark new bid as winning
  NEW.status := 'active';
  NEW.is_winning := true;
  NEW.bid_number := (SELECT COALESCE(MAX(bid_number), 0) + 1 FROM auction_bids WHERE auction_id = NEW.auction_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for bid updates
DROP TRIGGER IF EXISTS trigger_update_auction_on_bid ON auction_bids;
CREATE TRIGGER trigger_update_auction_on_bid
BEFORE INSERT ON auction_bids
FOR EACH ROW
EXECUTE FUNCTION update_auction_on_bid();

-- Function to update fundraiser on contribution
CREATE OR REPLACE FUNCTION update_fundraiser_on_contribution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND (OLD IS NULL OR OLD.payment_status != 'completed') THEN
    -- Update fundraiser totals
    UPDATE fundraisers
    SET 
      current_amount = current_amount + NEW.amount,
      backer_count = backer_count + 1
    WHERE id = NEW.fundraiser_id;
    
    -- Update reward quantity if applicable
    IF NEW.reward_id IS NOT NULL THEN
      UPDATE fundraiser_rewards
      SET quantity_claimed = quantity_claimed + 1
      WHERE id = NEW.reward_id;
    END IF;
  END IF;
  
  -- Handle refunds
  IF NEW.payment_status = 'refunded' AND OLD.payment_status = 'completed' THEN
    UPDATE fundraisers
    SET 
      current_amount = GREATEST(0, current_amount - NEW.amount),
      backer_count = GREATEST(0, backer_count - 1)
    WHERE id = NEW.fundraiser_id;
    
    IF NEW.reward_id IS NOT NULL THEN
      UPDATE fundraiser_rewards
      SET quantity_claimed = GREATEST(0, quantity_claimed - 1)
      WHERE id = NEW.reward_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for contribution updates
DROP TRIGGER IF EXISTS trigger_update_fundraiser_on_contribution ON fundraiser_contributions;
CREATE TRIGGER trigger_update_fundraiser_on_contribution
AFTER INSERT OR UPDATE ON fundraiser_contributions
FOR EACH ROW
EXECUTE FUNCTION update_fundraiser_on_contribution();

-- Function to check and close ended auctions
CREATE OR REPLACE FUNCTION close_ended_auctions()
RETURNS void AS $$
BEGIN
  UPDATE auctions
  SET status = CASE 
    WHEN current_bid >= COALESCE(reserve_price, 0) THEN 'sold'
    ELSE 'ended'
  END
  WHERE status = 'live' 
    AND end_time < NOW();
  
  -- Update winning bids
  UPDATE auction_bids
  SET status = 'won'
  WHERE is_winning = true
    AND auction_id IN (
      SELECT id FROM auctions WHERE status = 'sold'
    );
  
  -- Update losing bids
  UPDATE auction_bids
  SET status = 'lost'
  WHERE is_winning = false
    AND status = 'active'
    AND auction_id IN (
      SELECT id FROM auctions WHERE status IN ('sold', 'ended')
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check and close ended fundraisers
CREATE OR REPLACE FUNCTION close_ended_fundraisers()
RETURNS void AS $$
BEGIN
  UPDATE fundraisers
  SET status = CASE 
    WHEN current_amount >= goal_amount THEN 'successful'
    WHEN campaign_type = 'flexible' THEN 'successful'
    ELSE 'unsuccessful'
  END
  WHERE status = 'active' 
    AND end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============= ROW LEVEL SECURITY =============

ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraiser_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraiser_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraiser_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraiser_milestones ENABLE ROW LEVEL SECURITY;

-- Auction policies
DROP POLICY IF EXISTS "Active auctions viewable by everyone" ON auctions;
DROP POLICY IF EXISTS "Users can create auctions" ON auctions;
DROP POLICY IF EXISTS "Users can update their own auctions" ON auctions;

CREATE POLICY "Active auctions viewable by everyone" 
ON auctions FOR SELECT 
USING (status IN ('scheduled', 'live', 'ended', 'sold') OR auth.uid() = user_id);

CREATE POLICY "Users can create auctions" 
ON auctions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own auctions" 
ON auctions FOR UPDATE 
USING (auth.uid() = user_id);

-- Bid policies
DROP POLICY IF EXISTS "Users can view bids on auctions they created or bid on" ON auction_bids;
DROP POLICY IF EXISTS "Users can place bids" ON auction_bids;

CREATE POLICY "Users can view bids on auctions they created or bid on" 
ON auction_bids FOR SELECT 
USING (
  auth.uid() = bidder_id OR
  auth.uid() IN (SELECT user_id FROM auctions WHERE id = auction_id)
);

CREATE POLICY "Users can place bids" 
ON auction_bids FOR INSERT 
WITH CHECK (auth.uid() = bidder_id);

-- Watcher policies
DROP POLICY IF EXISTS "Users can view their own watches" ON auction_watchers;
DROP POLICY IF EXISTS "Users can watch auctions" ON auction_watchers;

CREATE POLICY "Users can view their own watches" 
ON auction_watchers FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can watch auctions" 
ON auction_watchers FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fundraiser policies
DROP POLICY IF EXISTS "Active fundraisers viewable by everyone" ON fundraisers;
DROP POLICY IF EXISTS "Users can create fundraisers" ON fundraisers;
DROP POLICY IF EXISTS "Users can update their own fundraisers" ON fundraisers;

CREATE POLICY "Active fundraisers viewable by everyone" 
ON fundraisers FOR SELECT 
USING (status IN ('active', 'successful', 'unsuccessful') OR auth.uid() = user_id);

CREATE POLICY "Users can create fundraisers" 
ON fundraisers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fundraisers" 
ON fundraisers FOR UPDATE 
USING (auth.uid() = user_id);

-- Reward policies
DROP POLICY IF EXISTS "Everyone can view active rewards" ON fundraiser_rewards;
DROP POLICY IF EXISTS "Campaign owners can manage rewards" ON fundraiser_rewards;

CREATE POLICY "Everyone can view active rewards" 
ON fundraiser_rewards FOR SELECT 
USING (is_active = true OR auth.uid() IN (SELECT user_id FROM fundraisers WHERE id = fundraiser_id));

CREATE POLICY "Campaign owners can manage rewards" 
ON fundraiser_rewards FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM fundraisers WHERE id = fundraiser_id));

-- Contribution policies
DROP POLICY IF EXISTS "Contributors and campaign owners can view contributions" ON fundraiser_contributions;
DROP POLICY IF EXISTS "Anyone can contribute" ON fundraiser_contributions;

CREATE POLICY "Contributors and campaign owners can view contributions" 
ON fundraiser_contributions FOR SELECT 
USING (
  auth.uid() = contributor_id OR
  auth.uid() IN (SELECT user_id FROM fundraisers WHERE id = fundraiser_id) OR
  is_anonymous = false -- Public contributions visible to all
);

CREATE POLICY "Anyone can contribute" 
ON fundraiser_contributions FOR INSERT 
WITH CHECK (true); -- Anyone can contribute, even anonymous

-- Update policies
DROP POLICY IF EXISTS "Everyone can view updates" ON fundraiser_updates;
DROP POLICY IF EXISTS "Campaign owners can create updates" ON fundraiser_updates;

CREATE POLICY "Everyone can view updates" 
ON fundraiser_updates FOR SELECT 
USING (
  is_backers_only = false OR
  auth.uid() IN (SELECT user_id FROM fundraisers WHERE id = fundraiser_id) OR
  auth.uid() IN (SELECT contributor_id FROM fundraiser_contributions WHERE fundraiser_id = fundraiser_updates.fundraiser_id)
);

CREATE POLICY "Campaign owners can create updates" 
ON fundraiser_updates FOR ALL 
USING (auth.uid() = author_id);

-- Milestone policies
DROP POLICY IF EXISTS "Everyone can view milestones" ON fundraiser_milestones;
DROP POLICY IF EXISTS "Campaign owners can manage milestones" ON fundraiser_milestones;

CREATE POLICY "Everyone can view milestones" 
ON fundraiser_milestones FOR SELECT 
USING (true);

CREATE POLICY "Campaign owners can manage milestones" 
ON fundraiser_milestones FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM fundraisers WHERE id = fundraiser_id));

-- ============= VIEWS FOR ANALYTICS =============

-- Live auctions with current bid info
CREATE OR REPLACE VIEW live_auctions AS
SELECT 
  a.*,
  p.username as seller_username,
  p.avatar_url as seller_avatar,
  bp.username as current_winner_username,
  COUNT(DISTINCT ab.bidder_id) as unique_bidders
FROM auctions a
LEFT JOIN profiles p ON a.user_id = p.id
LEFT JOIN profiles bp ON a.current_winner_id = bp.id
LEFT JOIN auction_bids ab ON a.id = ab.auction_id
WHERE a.status = 'live'
GROUP BY a.id, p.username, p.avatar_url, bp.username;

-- Active fundraisers with progress
CREATE OR REPLACE VIEW active_fundraisers AS
SELECT 
  f.*,
  p.username as creator_username,
  p.avatar_url as creator_avatar,
  (f.current_amount / NULLIF(f.goal_amount, 0) * 100) as progress_percentage,
  EXTRACT(EPOCH FROM (f.end_date - NOW())) / 86400 as days_left
FROM fundraisers f
LEFT JOIN profiles p ON f.user_id = p.id
WHERE f.status = 'active'
  AND f.end_date > NOW();

-- Comments
COMMENT ON TABLE auctions IS 'Auction listings for bidding on items';
COMMENT ON TABLE auction_bids IS 'Bids placed on auction items';
COMMENT ON TABLE fundraisers IS 'Crowdfunding and fundraising campaigns';
COMMENT ON TABLE fundraiser_rewards IS 'Reward tiers for backers';
COMMENT ON TABLE fundraiser_contributions IS 'Contributions/pledges to campaigns';
COMMENT ON TABLE fundraiser_updates IS 'Campaign updates and news';
COMMENT ON TABLE fundraiser_milestones IS 'Fundraising goal milestones';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '🎉 Auction & Fundraiser System Created!';
  RAISE NOTICE '🔨 Auctions - Full bidding system with auto-extend';
  RAISE NOTICE '💰 Fundraisers - Crowdfunding with rewards and milestones';
  RAISE NOTICE '📊 Analytics views created for live data';
  RAISE NOTICE '✅ All RLS policies enabled for security';
END $$;

