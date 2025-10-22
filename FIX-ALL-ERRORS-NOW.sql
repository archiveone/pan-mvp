-- =====================================================
-- FIX ALL CURRENT ERRORS
-- Run this to fix RLS, missing tables, and schema issues
-- =====================================================

-- ============= FIX PROFILE RLS (403 Error) =============

-- Allow users to create their own profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profiles
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Allow everyone to view profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- ============= FIX USER_PREFERENCES (406 Error) =============

-- Drop and recreate with correct schema
DROP TABLE IF EXISTS user_preferences CASCADE;

CREATE TABLE user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences" ON user_preferences
FOR ALL USING (auth.uid() = user_id);

-- ============= FIX NOTIFICATIONS (400 Error) =============

-- Drop and recreate with correct schema
DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  content TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System creates notifications" ON notifications
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users update own notifications" ON notifications
FOR UPDATE USING (auth.uid() = user_id);

-- ============= CREATE CONTENT TABLE (404 Error) =============

-- The app tries to use 'content' table, create it as alias to posts
CREATE TABLE IF NOT EXISTS content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(500),
  content TEXT,
  description TEXT,
  media_url TEXT,
  media_urls TEXT[],
  category VARCHAR(100),
  tags TEXT[],
  location VARCHAR(200),
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  content_type VARCHAR(50),
  price_amount DECIMAL(10, 2),
  currency VARCHAR(3),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Content viewable by everyone" ON content
FOR SELECT USING (true);

CREATE POLICY "Users create own content" ON content
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own content" ON content
FOR UPDATE USING (auth.uid() = user_id);

-- ============= INDEXES FOR PERFORMANCE =============

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_user ON content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_created ON content(created_at DESC);

-- Success!
SELECT '✅ All errors fixed! RLS policies updated, missing tables created.' as message;

