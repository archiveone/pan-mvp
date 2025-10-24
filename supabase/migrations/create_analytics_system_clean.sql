-- Create analytics system - Clean step-by-step version
-- Run this in your Supabase SQL Editor

-- ============= STEP 1: CREATE ANALYTICS EVENTS TABLE =============

-- Drop table if exists to ensure clean start
DROP TABLE IF EXISTS analytics_events CASCADE;

-- Create analytics events table
CREATE TABLE analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('view', 'like', 'comment', 'share', 'download', 'play', 'save', 'click')),
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT
);

-- Create indexes for analytics events
CREATE INDEX idx_analytics_events_content_id ON analytics_events(content_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);

-- ============= STEP 2: ADD CLICK COUNT TO POSTS =============

-- Add click_count to posts table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'click_count') THEN
        ALTER TABLE posts ADD COLUMN click_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create index for click_count
CREATE INDEX IF NOT EXISTS idx_posts_click_count ON posts(click_count) WHERE click_count > 0;

-- ============= STEP 3: CREATE SIMPLE ANALYTICS FUNCTIONS =============

-- Function to increment analytics counters
CREATE OR REPLACE FUNCTION increment_analytics_counter(
  content_id UUID,
  field_name TEXT
)
RETURNS VOID AS $$
BEGIN
  CASE field_name
    WHEN 'view_count' THEN
      UPDATE posts SET view_count = COALESCE(view_count, 0) + 1 WHERE id = content_id;
    WHEN 'like_count' THEN
      UPDATE posts SET like_count = COALESCE(like_count, 0) + 1 WHERE id = content_id;
    WHEN 'comment_count' THEN
      UPDATE posts SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = content_id;
    WHEN 'share_count' THEN
      UPDATE posts SET share_count = COALESCE(share_count, 0) + 1 WHERE id = content_id;
    WHEN 'download_count' THEN
      UPDATE posts SET download_count = COALESCE(download_count, 0) + 1 WHERE id = content_id;
    WHEN 'play_count' THEN
      UPDATE posts SET play_count = COALESCE(play_count, 0) + 1 WHERE id = content_id;
    WHEN 'save_count' THEN
      UPDATE posts SET save_count = COALESCE(save_count, 0) + 1 WHERE id = content_id;
    WHEN 'click_count' THEN
      UPDATE posts SET click_count = COALESCE(click_count, 0) + 1 WHERE id = content_id;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to get basic content analytics
CREATE OR REPLACE FUNCTION get_content_analytics(content_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'content_id', p.id,
    'title', p.title,
    'content_type', COALESCE(p.content_type, 'post'),
    'media_type', p.media_type,
    'view_count', COALESCE(p.view_count, 0),
    'like_count', COALESCE(p.like_count, 0),
    'comment_count', COALESCE(p.comment_count, 0),
    'share_count', COALESCE(p.share_count, 0),
    'download_count', COALESCE(p.download_count, 0),
    'play_count', COALESCE(p.play_count, 0),
    'save_count', COALESCE(p.save_count, 0),
    'click_count', COALESCE(p.click_count, 0),
    'created_at', p.created_at,
    'updated_at', p.updated_at
  ) INTO result
  FROM posts p
  WHERE p.id = content_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get user analytics summary
CREATE OR REPLACE FUNCTION get_user_analytics(
  user_id UUID,
  days_back INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  start_date TIMESTAMP WITH TIME ZONE;
BEGIN
  start_date := NOW() - INTERVAL '1 day' * days_back;
  
  SELECT json_build_object(
    'user_id', user_id,
    'total_content', COUNT(*),
    'total_views', COALESCE(SUM(view_count), 0),
    'total_likes', COALESCE(SUM(like_count), 0),
    'total_comments', COALESCE(SUM(comment_count), 0),
    'total_shares', COALESCE(SUM(share_count), 0),
    'total_downloads', COALESCE(SUM(download_count), 0),
    'total_plays', COALESCE(SUM(play_count), 0),
    'total_saves', COALESCE(SUM(save_count), 0),
    'total_clicks', COALESCE(SUM(click_count), 0)
  ) INTO result
  FROM posts
  WHERE posts.user_id = get_user_analytics.user_id 
    AND posts.created_at >= start_date;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============= STEP 4: CREATE RLS POLICIES =============

-- Enable RLS on analytics_events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view analytics for their own content" ON analytics_events;
DROP POLICY IF EXISTS "Users can insert analytics events" ON analytics_events;

-- Create RLS policies for analytics_events
CREATE POLICY "Users can view analytics for their own content" ON analytics_events
  FOR SELECT USING (
    content_id IN (
      SELECT id FROM posts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- ============= STEP 5: CREATE ANALYTICS VIEW =============

-- Drop view if exists
DROP VIEW IF EXISTS content_performance;

-- Create view for content performance
CREATE VIEW content_performance AS
SELECT 
  p.id,
  p.title,
  p.content_type,
  p.media_type,
  p.user_id,
  pr.username,
  pr.avatar_url,
  COALESCE(p.view_count, 0) as view_count,
  COALESCE(p.like_count, 0) as like_count,
  COALESCE(p.comment_count, 0) as comment_count,
  COALESCE(p.share_count, 0) as share_count,
  COALESCE(p.download_count, 0) as download_count,
  COALESCE(p.play_count, 0) as play_count,
  COALESCE(p.save_count, 0) as save_count,
  COALESCE(p.click_count, 0) as click_count,
  (
    COALESCE(p.view_count, 0) + 
    COALESCE(p.like_count, 0) + 
    COALESCE(p.comment_count, 0) + 
    COALESCE(p.share_count, 0) + 
    COALESCE(p.download_count, 0) + 
    COALESCE(p.play_count, 0) + 
    COALESCE(p.save_count, 0) + 
    COALESCE(p.click_count, 0)
  ) as total_engagement,
  p.created_at,
  p.updated_at
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE p.is_published = true;

-- ============= STEP 6: TEST THE SYSTEM =============

-- Insert a test analytics event
INSERT INTO analytics_events (content_id, event_type, metadata)
SELECT id, 'view', '{"test": true}'::jsonb
FROM posts 
LIMIT 1;

-- Test the increment function
DO $$
DECLARE
  test_post_id UUID;
BEGIN
  SELECT id INTO test_post_id FROM posts LIMIT 1;
  IF test_post_id IS NOT NULL THEN
    PERFORM increment_analytics_counter(test_post_id, 'view_count');
  END IF;
END $$;

-- ============= SUCCESS MESSAGE =============

SELECT 'Analytics system created successfully! All content interactions are now tracked.' as message;
