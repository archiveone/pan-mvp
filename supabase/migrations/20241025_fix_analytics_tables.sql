-- Fix Analytics Tables and RLS Policies
-- This migration creates missing analytics tables and fixes RLS policies

-- Create view_analytics table if it doesn't exist
CREATE TABLE IF NOT EXISTS view_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  saved BOOLEAN DEFAULT FALSE,
  liked BOOLEAN DEFAULT FALSE,
  shared BOOLEAN DEFAULT FALSE,
  view_duration INTEGER DEFAULT 0, -- in seconds
  country_code TEXT,
  device_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stream_analytics table if it doesn't exist
CREATE TABLE IF NOT EXISTS stream_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER DEFAULT 0, -- in seconds
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  country_code TEXT,
  device_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales_analytics table if it doesn't exist
CREATE TABLE IF NOT EXISTS sales_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  gross_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  transaction_id TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversion_analytics table if it doesn't exist
CREATE TABLE IF NOT EXISTS conversion_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  funnel_step TEXT NOT NULL,
  step_data JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  accent_color TEXT DEFAULT '#10B981',
  primary_gradient_start TEXT DEFAULT '#3B82F6',
  primary_gradient_end TEXT DEFAULT '#9333EA',
  dark_mode_preference TEXT DEFAULT 'system',
  default_view_mode TEXT DEFAULT 'grid',
  default_zoom_level INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE view_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for view_analytics
CREATE POLICY "Users can view their own analytics" ON view_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" ON view_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Content owners can view analytics for their content" ON view_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = view_analytics.content_id 
      AND posts.user_id = auth.uid()
    )
  );

-- RLS Policies for stream_analytics
CREATE POLICY "Users can view their own stream analytics" ON stream_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stream analytics" ON stream_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Content owners can view stream analytics for their content" ON stream_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = stream_analytics.content_id 
      AND posts.user_id = auth.uid()
    )
  );

-- RLS Policies for sales_analytics
CREATE POLICY "Users can view their own sales analytics" ON sales_analytics
  FOR SELECT USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE POLICY "Users can insert sales analytics" ON sales_analytics
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- RLS Policies for conversion_analytics
CREATE POLICY "Users can view their own conversion analytics" ON conversion_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversion analytics" ON conversion_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Content owners can view conversion analytics for their content" ON conversion_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = conversion_analytics.content_id 
      AND posts.user_id = auth.uid()
    )
  );

-- RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for comments
CREATE POLICY "Users can view all comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_view_analytics_content_id ON view_analytics(content_id);
CREATE INDEX IF NOT EXISTS idx_view_analytics_user_id ON view_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_view_analytics_viewed_at ON view_analytics(viewed_at);

CREATE INDEX IF NOT EXISTS idx_stream_analytics_content_id ON stream_analytics(content_id);
CREATE INDEX IF NOT EXISTS idx_stream_analytics_user_id ON stream_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_analytics_started_at ON stream_analytics(started_at);

CREATE INDEX IF NOT EXISTS idx_sales_analytics_seller_id ON sales_analytics(seller_id);
CREATE INDEX IF NOT EXISTS idx_sales_analytics_buyer_id ON sales_analytics(buyer_id);
CREATE INDEX IF NOT EXISTS idx_sales_analytics_sale_date ON sales_analytics(sale_date);

CREATE INDEX IF NOT EXISTS idx_conversion_analytics_content_id ON conversion_analytics(content_id);
CREATE INDEX IF NOT EXISTS idx_conversion_analytics_user_id ON conversion_analytics(user_id);

CREATE INDEX IF NOT EXISTS idx_comments_content_id ON comments(content_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
