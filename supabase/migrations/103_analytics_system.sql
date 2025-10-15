-- =====================================================
-- ANALYTICS & TRACKING SYSTEM
-- Comprehensive analytics for all content types
-- Similar to Shopify, YouTube, Spotify Analytics
-- =====================================================

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  user_id UUID NOT NULL,
  metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('view', 'like', 'save', 'share', 'purchase', 'booking', 'click', 'impression')),
  value DECIMAL(10, 2) DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for fast queries
  CONSTRAINT fk_analytics_content FOREIGN KEY (content_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_analytics_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_content ON analytics_events(content_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metric ON analytics_events(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_content_metric ON analytics_events(content_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_user_metric ON analytics_events(user_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_metadata ON analytics_events USING GIN (metadata);

-- Aggregated Analytics Table (for faster dashboard queries)
CREATE TABLE IF NOT EXISTS analytics_aggregated (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  
  -- Metrics
  views INT DEFAULT 0,
  likes INT DEFAULT 0,
  saves INT DEFAULT 0,
  shares INT DEFAULT 0,
  purchases INT DEFAULT 0,
  revenue DECIMAL(10, 2) DEFAULT 0,
  
  -- Engagement
  avg_watch_time INT DEFAULT 0, -- in seconds
  completion_rate DECIMAL(5, 2) DEFAULT 0, -- percentage
  click_through_rate DECIMAL(5, 2) DEFAULT 0, -- percentage
  
  -- Demographics (JSONB for flexibility)
  demographics JSONB DEFAULT '{}'::jsonb,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_aggregated_content FOREIGN KEY (content_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_aggregated_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT unique_content_date UNIQUE (content_id, date)
);

-- Create indexes for aggregated data
CREATE INDEX IF NOT EXISTS idx_aggregated_content ON analytics_aggregated(content_id);
CREATE INDEX IF NOT EXISTS idx_aggregated_user ON analytics_aggregated(user_id);
CREATE INDEX IF NOT EXISTS idx_aggregated_date ON analytics_aggregated(date DESC);
CREATE INDEX IF NOT EXISTS idx_aggregated_user_date ON analytics_aggregated(user_id, date DESC);

-- Revenue Tracking Table
CREATE TABLE IF NOT EXISTS revenue_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content_id UUID,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('sale', 'booking', 'subscription', 'tip', 'refund')),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  platform_fee DECIMAL(10, 2) DEFAULT 0,
  net_amount DECIMAL(10, 2),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT fk_revenue_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_revenue_content FOREIGN KEY (content_id) REFERENCES posts(id) ON DELETE SET NULL
);

-- Create indexes for revenue queries
CREATE INDEX IF NOT EXISTS idx_revenue_user ON revenue_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_content ON revenue_transactions(content_id);
CREATE INDEX IF NOT EXISTS idx_revenue_created ON revenue_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_status ON revenue_transactions(status);
CREATE INDEX IF NOT EXISTS idx_revenue_type ON revenue_transactions(transaction_type);

-- Function to aggregate daily analytics
CREATE OR REPLACE FUNCTION aggregate_daily_analytics()
RETURNS VOID AS $$
BEGIN
  INSERT INTO analytics_aggregated (content_id, user_id, date, views, likes, saves, shares, purchases, revenue)
  SELECT 
    ae.content_id,
    ae.user_id,
    DATE(ae.created_at) as date,
    COUNT(CASE WHEN ae.metric_type = 'view' THEN 1 END) as views,
    COUNT(CASE WHEN ae.metric_type = 'like' THEN 1 END) as likes,
    COUNT(CASE WHEN ae.metric_type = 'save' THEN 1 END) as saves,
    COUNT(CASE WHEN ae.metric_type = 'share' THEN 1 END) as shares,
    COUNT(CASE WHEN ae.metric_type IN ('purchase', 'booking') THEN 1 END) as purchases,
    SUM(CASE WHEN ae.metric_type IN ('purchase', 'booking') THEN ae.value ELSE 0 END) as revenue
  FROM analytics_events ae
  WHERE DATE(ae.created_at) = CURRENT_DATE - INTERVAL '1 day'
  GROUP BY ae.content_id, ae.user_id, DATE(ae.created_at)
  ON CONFLICT (content_id, date) 
  DO UPDATE SET
    views = EXCLUDED.views,
    likes = EXCLUDED.likes,
    saves = EXCLUDED.saves,
    shares = EXCLUDED.shares,
    purchases = EXCLUDED.purchases,
    revenue = EXCLUDED.revenue,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- View for quick user dashboard stats
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
  p.user_id,
  COUNT(DISTINCT p.id) as total_posts,
  COALESCE(SUM(aa.views), 0) as total_views,
  COALESCE(SUM(aa.likes), 0) as total_likes,
  COALESCE(SUM(aa.saves), 0) as total_saves,
  COALESCE(SUM(aa.shares), 0) as total_shares,
  COALESCE(SUM(aa.revenue), 0) as total_revenue,
  COALESCE(AVG(aa.views), 0) as avg_views_per_post,
  MAX(aa.date) as last_activity_date
FROM posts p
LEFT JOIN analytics_aggregated aa ON p.id = aa.content_id
GROUP BY p.user_id;

-- View for trending content (last 7 days)
CREATE OR REPLACE VIEW trending_content AS
SELECT 
  p.id,
  p.title,
  p.user_id,
  p.created_at,
  COALESCE(SUM(aa.views), 0) as views_7d,
  COALESCE(SUM(aa.likes), 0) as likes_7d,
  COALESCE(SUM(aa.saves), 0) as saves_7d,
  COALESCE(SUM(aa.shares), 0) as shares_7d,
  COALESCE(SUM(aa.views), 0) + 
  COALESCE(SUM(aa.likes), 0) * 5 + 
  COALESCE(SUM(aa.saves), 0) * 10 + 
  COALESCE(SUM(aa.shares), 0) * 15 as trending_score
FROM posts p
LEFT JOIN analytics_aggregated aa ON p.id = aa.content_id
WHERE aa.date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY p.id, p.title, p.user_id, p.created_at
ORDER BY trending_score DESC;

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_aggregated ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics_events
DROP POLICY IF EXISTS "Users can insert their own analytics events" ON analytics_events;
CREATE POLICY "Users can insert their own analytics events"
ON analytics_events FOR INSERT
WITH CHECK (true); -- Allow anyone to track events (including anonymous)

DROP POLICY IF EXISTS "Users can view analytics for their content" ON analytics_events;
CREATE POLICY "Users can view analytics for their content"
ON analytics_events FOR SELECT
USING (
  user_id = auth.uid() OR
  content_id IN (SELECT id FROM posts WHERE user_id = auth.uid())
);

-- RLS Policies for analytics_aggregated
DROP POLICY IF EXISTS "Users can view their aggregated analytics" ON analytics_aggregated;
CREATE POLICY "Users can view their aggregated analytics"
ON analytics_aggregated FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can update aggregated analytics" ON analytics_aggregated;
CREATE POLICY "System can update aggregated analytics"
ON analytics_aggregated FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for revenue_transactions
DROP POLICY IF EXISTS "Users can view their own revenue" ON revenue_transactions;
CREATE POLICY "Users can view their own revenue"
ON revenue_transactions FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can manage revenue transactions" ON revenue_transactions;
CREATE POLICY "System can manage revenue transactions"
ON revenue_transactions FOR ALL
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT ON analytics_events TO authenticated, anon;
GRANT SELECT ON analytics_aggregated TO authenticated;
GRANT SELECT ON revenue_transactions TO authenticated;
GRANT SELECT ON user_dashboard_stats TO authenticated;
GRANT SELECT ON trending_content TO authenticated, anon;

-- Comments
COMMENT ON TABLE analytics_events IS 'Raw analytics events for all content interactions';
COMMENT ON TABLE analytics_aggregated IS 'Daily aggregated analytics for fast dashboard queries';
COMMENT ON TABLE revenue_transactions IS 'Revenue tracking for all monetized content';
COMMENT ON VIEW user_dashboard_stats IS 'Quick dashboard statistics per user';
COMMENT ON VIEW trending_content IS 'Trending content based on engagement in last 7 days';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Analytics system created successfully!';
  RAISE NOTICE '📊 Tables: analytics_events, analytics_aggregated, revenue_transactions';
  RAISE NOTICE '📈 Views: user_dashboard_stats, trending_content';
  RAISE NOTICE '🔒 RLS policies enabled for data security';
END $$;

