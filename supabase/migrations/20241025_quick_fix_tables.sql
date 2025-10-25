-- Quick Fix for Existing Tables
-- This migration adds the missing post_id column to existing tables

-- Check if view_analytics exists and add post_id column if missing
DO $$
BEGIN
    -- Add post_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'view_analytics' AND column_name = 'post_id') THEN
        ALTER TABLE view_analytics ADD COLUMN post_id UUID REFERENCES posts(id) ON DELETE CASCADE;
    END IF;
    
    -- Drop content_id column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'view_analytics' AND column_name = 'content_id') THEN
        ALTER TABLE view_analytics DROP COLUMN content_id;
    END IF;
END $$;

-- Do the same for other analytics tables
DO $$
BEGIN
    -- stream_analytics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stream_analytics' AND column_name = 'post_id') THEN
        ALTER TABLE stream_analytics ADD COLUMN post_id UUID REFERENCES posts(id) ON DELETE CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stream_analytics' AND column_name = 'content_id') THEN
        ALTER TABLE stream_analytics DROP COLUMN content_id;
    END IF;
END $$;

DO $$
BEGIN
    -- sales_analytics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_analytics' AND column_name = 'post_id') THEN
        ALTER TABLE sales_analytics ADD COLUMN post_id UUID REFERENCES posts(id) ON DELETE CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales_analytics' AND column_name = 'content_id') THEN
        ALTER TABLE sales_analytics DROP COLUMN content_id;
    END IF;
END $$;

DO $$
BEGIN
    -- conversion_analytics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversion_analytics' AND column_name = 'post_id') THEN
        ALTER TABLE conversion_analytics ADD COLUMN post_id UUID REFERENCES posts(id) ON DELETE CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversion_analytics' AND column_name = 'content_id') THEN
        ALTER TABLE conversion_analytics DROP COLUMN content_id;
    END IF;
END $$;

DO $$
BEGIN
    -- comments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'post_id') THEN
        ALTER TABLE comments ADD COLUMN post_id UUID REFERENCES posts(id) ON DELETE CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'content_id') THEN
        ALTER TABLE comments DROP COLUMN content_id;
    END IF;
END $$;

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
