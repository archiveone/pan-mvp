-- =====================================================
-- PAN MARKETPLACE - ESSENTIAL SETUP ONLY
-- Safe, Fast, No Deadlocks
-- =====================================================
--
-- This creates ONLY the essential tables needed to get started
-- Run this first, then test your app
--
-- =====================================================

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200),
  username VARCHAR(100) UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create basic posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(500),
  content TEXT,
  media_url TEXT,
  category VARCHAR(100),
  location VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content table (unified)
CREATE TABLE IF NOT EXISTS content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(500),
  content TEXT,
  media_url TEXT,
  media_urls TEXT[],
  category VARCHAR(100),
  tags TEXT[],
  location VARCHAR(200),
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at DESC);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (one at a time, safely)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Drop existing policies for posts
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

-- Create policies for posts
CREATE POLICY "Posts are viewable by everyone" 
  ON posts FOR SELECT USING (true);

CREATE POLICY "Users can create their own posts" 
  ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
  ON posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
  ON posts FOR DELETE USING (auth.uid() = user_id);

-- Drop existing policies for content
DROP POLICY IF EXISTS "Content is viewable by everyone" ON content;
DROP POLICY IF EXISTS "Users can create their own content" ON content;
DROP POLICY IF EXISTS "Users can update their own content" ON content;
DROP POLICY IF EXISTS "Users can delete their own content" ON content;

-- Create policies for content
CREATE POLICY "Content is viewable by everyone" 
  ON content FOR SELECT USING (true);

CREATE POLICY "Users can create their own content" 
  ON content FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content" 
  ON content FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content" 
  ON content FOR DELETE USING (auth.uid() = user_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Essential tables created!';
  RAISE NOTICE '✅ profiles, posts, content tables ready';
  RAISE NOTICE '✅ RLS policies configured';
  RAISE NOTICE '🎉 You can now sign up and create content!';
END $$;

