-- Safe Fix for Existing Tables with Dependencies
-- This migration handles views and other dependencies

-- First, drop ALL dependent views and objects
DROP VIEW IF EXISTS stream_performance CASCADE;
DROP VIEW IF EXISTS view_performance CASCADE;
DROP VIEW IF EXISTS sales_performance CASCADE;
DROP VIEW IF EXISTS conversion_performance CASCADE;
DROP VIEW IF EXISTS conversion_funnel CASCADE;
DROP VIEW IF EXISTS analytics_summary CASCADE;
DROP VIEW IF EXISTS user_engagement CASCADE;
DROP VIEW IF EXISTS content_performance CASCADE;
DROP VIEW IF EXISTS revenue_analytics CASCADE;
DROP VIEW IF EXISTS engagement_metrics CASCADE;

-- Now safely alter the tables (outside DO blocks to avoid dependency issues)

-- Add post_id columns if they don't exist
ALTER TABLE view_analytics ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES posts(id) ON DELETE CASCADE;
ALTER TABLE stream_analytics ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES posts(id) ON DELETE CASCADE;
ALTER TABLE sales_analytics ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES posts(id) ON DELETE CASCADE;
ALTER TABLE conversion_analytics ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES posts(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES posts(id) ON DELETE CASCADE;

-- Copy data from content_id to post_id if content_id exists
UPDATE view_analytics SET post_id = content_id WHERE content_id IS NOT NULL AND post_id IS NULL;
UPDATE stream_analytics SET post_id = content_id WHERE content_id IS NOT NULL AND post_id IS NULL;
UPDATE sales_analytics SET post_id = content_id WHERE content_id IS NOT NULL AND post_id IS NULL;
UPDATE conversion_analytics SET post_id = content_id WHERE content_id IS NOT NULL AND post_id IS NULL;
-- Comments table doesn't have content_id column, skip this update

-- Now drop content_id columns (safe since views are already dropped)
ALTER TABLE view_analytics DROP COLUMN IF EXISTS content_id;
ALTER TABLE stream_analytics DROP COLUMN IF EXISTS content_id;
ALTER TABLE sales_analytics DROP COLUMN IF EXISTS content_id;
ALTER TABLE conversion_analytics DROP COLUMN IF EXISTS content_id;
-- Comments table doesn't have content_id column, skip this drop

-- Comments table already handled above

-- Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

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

-- Enable RLS on all tables
ALTER TABLE view_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own analytics" ON view_analytics;
DROP POLICY IF EXISTS "Users can insert their own analytics" ON view_analytics;
DROP POLICY IF EXISTS "Content owners can view analytics for their content" ON view_analytics;

-- Create RLS policies for view_analytics
CREATE POLICY "Users can view their own analytics" ON view_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" ON view_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Content owners can view analytics for their content" ON view_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = view_analytics.post_id 
      AND posts.user_id = auth.uid()
    )
  );

-- Create RLS policies for other tables
DROP POLICY IF EXISTS "Users can view all comments" ON comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

CREATE POLICY "Users can view all comments" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for followers
DROP POLICY IF EXISTS "Users can view followers" ON followers;
DROP POLICY IF EXISTS "Users can insert their own follows" ON followers;
DROP POLICY IF EXISTS "Users can delete their own follows" ON followers;

CREATE POLICY "Users can view followers" ON followers
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own follows" ON followers
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON followers
  FOR DELETE USING (auth.uid() = follower_id);

-- Create RLS policies for user_preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;

CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_view_analytics_post_id ON view_analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_view_analytics_user_id ON view_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);

-- Recreate the views with correct column names
CREATE VIEW stream_performance AS
SELECT 
  sa.post_id,
  p.title as post_title,
  COUNT(*) as total_streams,
  AVG(p.duration) as avg_duration,
  AVG(sa.completion_percentage) as avg_completion
FROM stream_analytics sa
JOIN posts p ON p.id = sa.post_id
GROUP BY sa.post_id, p.title;

CREATE VIEW view_performance AS
SELECT 
  va.post_id,
  p.title as post_title,
  COUNT(*) as total_views,
  COUNT(CASE WHEN va.saved THEN 1 END) as total_saves,
  COUNT(CASE WHEN va.liked THEN 1 END) as total_likes
FROM view_analytics va
JOIN posts p ON p.id = va.post_id
GROUP BY va.post_id, p.title;

-- Create a basic conversion_funnel view (only if conversion_analytics table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversion_analytics') THEN
        EXECUTE '
        CREATE VIEW conversion_funnel AS
        SELECT 
          ca.post_id,
          p.title as post_title,
          COUNT(*) as total_conversions
        FROM conversion_analytics ca
        JOIN posts p ON p.id = ca.post_id
        GROUP BY ca.post_id, p.title';
    END IF;
END $$;
