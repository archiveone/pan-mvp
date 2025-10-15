-- =====================================================
-- ADVANCED ANALYTICS SYSTEM
-- Beyond Protocol: Sales, Views, Streams, Engagement
-- Like Spotify, YouTube, Shopify Analytics
-- =====================================================

-- Stream Analytics Table (for music/video)
CREATE TABLE IF NOT EXISTS stream_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  user_id UUID, -- Can be null for anonymous
  session_id UUID NOT NULL,
  
  -- Stream data
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INT DEFAULT 0,
  total_duration_seconds INT, -- Total content length
  completion_percentage DECIMAL(5, 2) DEFAULT 0,
  
  -- Quality & Performance
  quality_level VARCHAR(20), -- 360p, 720p, 1080p, 4K
  buffering_events INT DEFAULT 0,
  buffering_time_seconds INT DEFAULT 0,
  avg_bitrate_kbps INT,
  
  -- Engagement
  pauses INT DEFAULT 0,
  seeks INT DEFAULT 0,
  replays INT DEFAULT 0,
  volume_level INT DEFAULT 50,
  playback_speed DECIMAL(3, 2) DEFAULT 1.00,
  
  -- Device & Network
  device_type VARCHAR(50), -- mobile, desktop, tablet, smart_tv
  browser VARCHAR(100),
  os VARCHAR(100),
  connection_type VARCHAR(50), -- wifi, cellular, ethernet
  location JSONB,
  
  -- Source
  referrer VARCHAR(500),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  
  CONSTRAINT fk_stream_content FOREIGN KEY (content_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_stream_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create indexes for stream analytics
CREATE INDEX IF NOT EXISTS idx_stream_content ON stream_analytics(content_id);
CREATE INDEX IF NOT EXISTS idx_stream_user ON stream_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_started ON stream_analytics(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_stream_session ON stream_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_stream_completion ON stream_analytics(completion_percentage);

-- Sales Analytics Table (detailed transaction tracking)
CREATE TABLE IF NOT EXISTS sales_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL,
  content_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  buyer_id UUID,
  
  -- Sales data
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Financial
  gross_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  shipping_amount DECIMAL(10, 2) DEFAULT 0,
  platform_fee DECIMAL(10, 2) DEFAULT 0,
  net_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Transaction details
  payment_method VARCHAR(50),
  payment_processor VARCHAR(50), -- stripe, paypal, etc
  transaction_status VARCHAR(20) DEFAULT 'completed',
  
  -- Customer info
  is_repeat_customer BOOLEAN DEFAULT false,
  customer_lifetime_value DECIMAL(10, 2) DEFAULT 0,
  
  -- Marketing
  acquisition_channel VARCHAR(100),
  referrer VARCHAR(500),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  
  -- Fulfillment
  fulfillment_status VARCHAR(50), -- pending, shipped, delivered
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Location
  billing_country VARCHAR(100),
  shipping_country VARCHAR(100),
  
  CONSTRAINT fk_sales_content FOREIGN KEY (content_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_sales_seller FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_sales_buyer FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create indexes for sales analytics
CREATE INDEX IF NOT EXISTS idx_sales_content ON sales_analytics(content_id);
CREATE INDEX IF NOT EXISTS idx_sales_seller ON sales_analytics(seller_id);
CREATE INDEX IF NOT EXISTS idx_sales_buyer ON sales_analytics(buyer_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_analytics(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales_analytics(transaction_status);

-- View Analytics Table (detailed view tracking)
CREATE TABLE IF NOT EXISTS view_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  user_id UUID,
  session_id UUID NOT NULL,
  
  -- View data
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  view_duration_seconds INT DEFAULT 0,
  scroll_depth_percentage INT DEFAULT 0,
  
  -- Engagement
  clicked_cta BOOLEAN DEFAULT false,
  shared BOOLEAN DEFAULT false,
  saved BOOLEAN DEFAULT false,
  liked BOOLEAN DEFAULT false,
  commented BOOLEAN DEFAULT false,
  
  -- Navigation
  entry_page VARCHAR(500),
  exit_page VARCHAR(500),
  time_on_page_seconds INT DEFAULT 0,
  bounce BOOLEAN DEFAULT false,
  
  -- Device & Context
  device_type VARCHAR(50),
  screen_resolution VARCHAR(20),
  browser VARCHAR(100),
  os VARCHAR(100),
  
  -- Traffic source
  referrer VARCHAR(500),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  
  -- Location
  country VARCHAR(100),
  city VARCHAR(100),
  region VARCHAR(100),
  
  CONSTRAINT fk_view_content FOREIGN KEY (content_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_view_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create indexes for view analytics
CREATE INDEX IF NOT EXISTS idx_view_content ON view_analytics(content_id);
CREATE INDEX IF NOT EXISTS idx_view_user ON view_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_view_session ON view_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_view_date ON view_analytics(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_view_engagement ON view_analytics(liked, saved, shared);

-- Conversion Analytics Table (funnel tracking)
CREATE TABLE IF NOT EXISTS conversion_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  user_id UUID,
  session_id UUID NOT NULL,
  
  -- Funnel stages
  viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMP WITH TIME ZONE,
  
  engaged BOOLEAN DEFAULT false, -- liked, saved, or commented
  engaged_at TIMESTAMP WITH TIME ZONE,
  
  clicked_cta BOOLEAN DEFAULT false,
  clicked_at TIMESTAMP WITH TIME ZONE,
  
  added_to_cart BOOLEAN DEFAULT false,
  cart_at TIMESTAMP WITH TIME ZONE,
  
  initiated_checkout BOOLEAN DEFAULT false,
  checkout_at TIMESTAMP WITH TIME ZONE,
  
  completed_purchase BOOLEAN DEFAULT false,
  purchase_at TIMESTAMP WITH TIME ZONE,
  purchase_amount DECIMAL(10, 2),
  
  -- Time to convert
  time_to_engage_seconds INT,
  time_to_purchase_seconds INT,
  
  -- Drop-off stage
  dropped_off_at VARCHAR(50),
  
  CONSTRAINT fk_conversion_content FOREIGN KEY (content_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversion_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT unique_session_content UNIQUE (session_id, content_id)
);

-- Create indexes for conversion analytics
CREATE INDEX IF NOT EXISTS idx_conversion_content ON conversion_analytics(content_id);
CREATE INDEX IF NOT EXISTS idx_conversion_user ON conversion_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_purchase ON conversion_analytics(completed_purchase);
CREATE INDEX IF NOT EXISTS idx_conversion_session ON conversion_analytics(session_id);

-- Engagement Score Table (computed engagement metrics)
CREATE TABLE IF NOT EXISTS engagement_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  
  -- Engagement metrics
  total_views INT DEFAULT 0,
  unique_viewers INT DEFAULT 0,
  total_likes INT DEFAULT 0,
  total_saves INT DEFAULT 0,
  total_shares INT DEFAULT 0,
  total_comments INT DEFAULT 0,
  
  -- Advanced metrics
  avg_watch_time_seconds INT DEFAULT 0,
  avg_completion_rate DECIMAL(5, 2) DEFAULT 0,
  engagement_rate DECIMAL(5, 2) DEFAULT 0,
  viral_coefficient DECIMAL(5, 2) DEFAULT 0,
  
  -- Scores (0-100)
  popularity_score INT DEFAULT 0,
  quality_score INT DEFAULT 0,
  trending_score INT DEFAULT 0,
  overall_score INT DEFAULT 0,
  
  -- Timestamps
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_engagement_content FOREIGN KEY (content_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_engagement_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create indexes for engagement scores
CREATE INDEX IF NOT EXISTS idx_engagement_content ON engagement_scores(content_id);
CREATE INDEX IF NOT EXISTS idx_engagement_user ON engagement_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_overall ON engagement_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_engagement_trending ON engagement_scores(trending_score DESC);

-- Function to calculate engagement score
-- Note: This function requires view_analytics table to exist
CREATE OR REPLACE FUNCTION calculate_engagement_score(p_content_id UUID)
RETURNS VOID AS $$
DECLARE
  v_views INT;
  v_unique_viewers INT;
  v_likes INT;
  v_saves INT;
  v_shares INT;
  v_comments INT;
  v_engagement_rate DECIMAL(5, 2);
  v_popularity_score INT;
  v_trending_score INT;
  v_user_id UUID;
BEGIN
  -- Get content owner
  SELECT user_id INTO v_user_id FROM posts WHERE id = p_content_id;
  
  -- Get metrics
  SELECT 
    COUNT(*) INTO v_views
  FROM view_analytics
  WHERE content_id = p_content_id;
  
  SELECT 
    COUNT(DISTINCT user_id) INTO v_unique_viewers
  FROM view_analytics
  WHERE content_id = p_content_id;
  
  SELECT COUNT(*) INTO v_likes FROM view_analytics WHERE content_id = p_content_id AND liked = true;
  SELECT COUNT(*) INTO v_saves FROM view_analytics WHERE content_id = p_content_id AND saved = true;
  SELECT COUNT(*) INTO v_shares FROM view_analytics WHERE content_id = p_content_id AND shared = true;
  SELECT COUNT(*) INTO v_comments FROM view_analytics WHERE content_id = p_content_id AND commented = true;
  
  -- Calculate engagement rate
  IF v_views > 0 THEN
    v_engagement_rate := ((v_likes + v_saves + v_shares + v_comments)::DECIMAL / v_views) * 100;
  ELSE
    v_engagement_rate := 0;
  END IF;
  
  -- Calculate scores (0-100)
  v_popularity_score := LEAST(100, (v_views / 10));
  v_trending_score := LEAST(100, ((v_likes * 5 + v_saves * 10 + v_shares * 15) / 10));
  
  -- Insert or update
  INSERT INTO engagement_scores (
    content_id, user_id, total_views, unique_viewers,
    total_likes, total_saves, total_shares, total_comments,
    engagement_rate, popularity_score, trending_score,
    overall_score, last_calculated_at
  ) VALUES (
    p_content_id, v_user_id, v_views, v_unique_viewers,
    v_likes, v_saves, v_shares, v_comments,
    v_engagement_rate, v_popularity_score, v_trending_score,
    (v_popularity_score + v_trending_score) / 2, NOW()
  )
  ON CONFLICT (content_id) DO UPDATE SET
    total_views = EXCLUDED.total_views,
    unique_viewers = EXCLUDED.unique_viewers,
    total_likes = EXCLUDED.total_likes,
    total_saves = EXCLUDED.total_saves,
    total_shares = EXCLUDED.total_shares,
    total_comments = EXCLUDED.total_comments,
    engagement_rate = EXCLUDED.engagement_rate,
    popularity_score = EXCLUDED.popularity_score,
    trending_score = EXCLUDED.trending_score,
    overall_score = EXCLUDED.overall_score,
    last_calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Advanced Dashboard Views

-- Sales Performance View
CREATE OR REPLACE VIEW sales_performance AS
SELECT 
  s.seller_id,
  DATE(s.sale_date) as sale_date,
  COUNT(*) as total_sales,
  SUM(s.gross_amount) as gross_revenue,
  SUM(s.discount_amount) as total_discounts,
  SUM(s.tax_amount) as total_tax,
  SUM(s.platform_fee) as total_fees,
  SUM(s.net_amount) as net_revenue,
  AVG(s.net_amount) as avg_order_value,
  COUNT(DISTINCT s.buyer_id) as unique_customers,
  COUNT(CASE WHEN s.is_repeat_customer THEN 1 END) as repeat_customers,
  AVG(CASE WHEN s.is_repeat_customer THEN 1 ELSE 0 END) * 100 as repeat_rate
FROM sales_analytics s
GROUP BY s.seller_id, DATE(s.sale_date);

-- Stream Performance View
CREATE OR REPLACE VIEW stream_performance AS
SELECT 
  p.user_id,
  s.content_id,
  COUNT(*) as total_streams,
  COUNT(DISTINCT s.user_id) as unique_listeners,
  SUM(s.duration_seconds) as total_stream_time,
  AVG(s.duration_seconds) as avg_stream_time,
  AVG(s.completion_percentage) as avg_completion_rate,
  COUNT(CASE WHEN s.completion_percentage >= 90 THEN 1 END) as full_streams,
  AVG(s.buffering_events) as avg_buffering_events
FROM stream_analytics s
JOIN posts p ON s.content_id = p.id
GROUP BY p.user_id, s.content_id;

-- Conversion Funnel View
CREATE OR REPLACE VIEW conversion_funnel AS
SELECT 
  p.user_id,
  c.content_id,
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN c.viewed THEN 1 END) as views,
  COUNT(CASE WHEN c.engaged THEN 1 END) as engagements,
  COUNT(CASE WHEN c.clicked_cta THEN 1 END) as cta_clicks,
  COUNT(CASE WHEN c.added_to_cart THEN 1 END) as cart_adds,
  COUNT(CASE WHEN c.initiated_checkout THEN 1 END) as checkouts,
  COUNT(CASE WHEN c.completed_purchase THEN 1 END) as purchases,
  -- Conversion rates
  (COUNT(CASE WHEN c.engaged THEN 1 END)::DECIMAL / NULLIF(COUNT(CASE WHEN c.viewed THEN 1 END), 0)) * 100 as view_to_engage_rate,
  (COUNT(CASE WHEN c.clicked_cta THEN 1 END)::DECIMAL / NULLIF(COUNT(CASE WHEN c.engaged THEN 1 END), 0)) * 100 as engage_to_cta_rate,
  (COUNT(CASE WHEN c.completed_purchase THEN 1 END)::DECIMAL / NULLIF(COUNT(CASE WHEN c.viewed THEN 1 END), 0)) * 100 as overall_conversion_rate,
  AVG(c.time_to_purchase_seconds) as avg_time_to_purchase
FROM conversion_analytics c
JOIN posts p ON c.content_id = p.id
GROUP BY p.user_id, c.content_id;

-- Enable RLS
ALTER TABLE stream_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE view_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Stream analytics
DROP POLICY IF EXISTS "Anyone can insert stream data" ON stream_analytics;
CREATE POLICY "Anyone can insert stream data"
ON stream_analytics FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their content streams" ON stream_analytics;
CREATE POLICY "Users can view their content streams"
ON stream_analytics FOR SELECT
USING (
  content_id IN (SELECT id FROM posts WHERE user_id = auth.uid()) OR
  user_id = auth.uid()
);

-- Sales analytics
DROP POLICY IF EXISTS "Users can view their sales" ON sales_analytics;
CREATE POLICY "Users can view their sales"
ON sales_analytics FOR SELECT
USING (seller_id = auth.uid() OR buyer_id = auth.uid());

-- View analytics
DROP POLICY IF EXISTS "Anyone can insert view data" ON view_analytics;
CREATE POLICY "Anyone can insert view data"
ON view_analytics FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their content views" ON view_analytics;
CREATE POLICY "Users can view their content views"
ON view_analytics FOR SELECT
USING (
  content_id IN (SELECT id FROM posts WHERE user_id = auth.uid())
);

-- Conversion analytics
DROP POLICY IF EXISTS "Anyone can track conversions" ON conversion_analytics;
CREATE POLICY "Anyone can track conversions"
ON conversion_analytics FOR ALL
USING (true)
WITH CHECK (true);

-- Engagement scores
DROP POLICY IF EXISTS "Users can view their engagement scores" ON engagement_scores;
CREATE POLICY "Users can view their engagement scores"
ON engagement_scores FOR SELECT
USING (user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON stream_analytics TO authenticated, anon;
GRANT SELECT ON sales_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON view_analytics TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON conversion_analytics TO authenticated, anon;
GRANT SELECT ON engagement_scores TO authenticated;
GRANT SELECT ON sales_performance TO authenticated;
GRANT SELECT ON stream_performance TO authenticated;
GRANT SELECT ON conversion_funnel TO authenticated;

-- Comments
COMMENT ON TABLE stream_analytics IS 'Detailed streaming analytics for music and video content (Spotify/YouTube style)';
COMMENT ON TABLE sales_analytics IS 'Comprehensive sales analytics (Shopify style)';
COMMENT ON TABLE view_analytics IS 'Detailed view tracking and engagement metrics';
COMMENT ON TABLE conversion_analytics IS 'Conversion funnel tracking from view to purchase';
COMMENT ON TABLE engagement_scores IS 'Computed engagement metrics and scores';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '🚀 Advanced Analytics System Created!';
  RAISE NOTICE '📊 Stream Analytics - Track every play like Spotify';
  RAISE NOTICE '💰 Sales Analytics - Track every sale like Shopify';
  RAISE NOTICE '👁️ View Analytics - Track engagement like YouTube';
  RAISE NOTICE '🎯 Conversion Analytics - Track funnels';
  RAISE NOTICE '⭐ Engagement Scores - Overall performance metrics';
  RAISE NOTICE '✅ All RLS policies enabled for security';
END $$;

