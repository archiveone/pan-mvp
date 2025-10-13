-- Add support for multiple media types and group/community features
-- Run this in your Supabase SQL Editor

-- Add multiple media URL columns
ALTER TABLE posts 
  ADD COLUMN IF NOT EXISTS audio_urls TEXT[],
  ADD COLUMN IF NOT EXISTS video_urls TEXT[],
  ADD COLUMN IF NOT EXISTS document_urls TEXT[];

-- Add group/community specific columns
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS group_type TEXT CHECK (group_type IN ('free', 'paid')),
  ADD COLUMN IF NOT EXISTS privacy TEXT CHECK (privacy IN ('public', 'private')),
  ADD COLUMN IF NOT EXISTS billing_period TEXT CHECK (billing_period IN ('weekly', 'monthly', 'yearly', 'lifetime')),
  ADD COLUMN IF NOT EXISTS max_members INTEGER,
  ADD COLUMN IF NOT EXISTS allow_discussions BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_content_type ON posts(content_type);
CREATE INDEX IF NOT EXISTS idx_posts_group_type ON posts(group_type);
CREATE INDEX IF NOT EXISTS idx_posts_privacy ON posts(privacy);

-- Comments on new columns
COMMENT ON COLUMN posts.audio_urls IS 'Array of uploaded audio file URLs (songs, podcasts, albums)';
COMMENT ON COLUMN posts.video_urls IS 'Array of uploaded video file URLs';
COMMENT ON COLUMN posts.document_urls IS 'Array of uploaded document file URLs (PDFs, docs, etc)';
COMMENT ON COLUMN posts.group_type IS 'Whether group is free or paid membership';
COMMENT ON COLUMN posts.privacy IS 'Whether group is public or private';
COMMENT ON COLUMN posts.billing_period IS 'How often members are billed for paid groups';
COMMENT ON COLUMN posts.max_members IS 'Maximum number of members allowed in the group';
COMMENT ON COLUMN posts.allow_discussions IS 'Whether group members can post discussions';
COMMENT ON COLUMN posts.member_count IS 'Current number of members in the group';

-- Create a table for group memberships
CREATE TABLE IF NOT EXISTS group_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_status TEXT CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'trial')),
  subscription_start TIMESTAMP WITH TIME ZONE,
  subscription_end TIMESTAMP WITH TIME ZONE,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  next_payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create indexes for group memberships
CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id ON group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id ON group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_status ON group_memberships(status);

-- Enable RLS on group memberships
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own memberships" ON group_memberships;
DROP POLICY IF EXISTS "Users can join groups" ON group_memberships;
DROP POLICY IF EXISTS "Users can update their own memberships" ON group_memberships;

-- Group memberships policies
CREATE POLICY "Users can view their own memberships"
ON group_memberships FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can join groups"
ON group_memberships FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memberships"
ON group_memberships FOR UPDATE
USING (auth.uid() = user_id);

-- Function to increment member count when someone joins
CREATE OR REPLACE FUNCTION increment_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    UPDATE posts
    SET member_count = member_count + 1
    WHERE id = NEW.group_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement member count when someone leaves
CREATE OR REPLACE FUNCTION decrement_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'active' AND (NEW IS NULL OR NEW.status != 'active') THEN
    UPDATE posts
    SET member_count = member_count - 1
    WHERE id = OLD.group_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers for member count
DROP TRIGGER IF EXISTS update_member_count_on_join ON group_memberships;
CREATE TRIGGER update_member_count_on_join
  AFTER INSERT OR UPDATE ON group_memberships
  FOR EACH ROW
  EXECUTE FUNCTION increment_member_count();

DROP TRIGGER IF EXISTS update_member_count_on_leave ON group_memberships;
CREATE TRIGGER update_member_count_on_leave
  AFTER UPDATE OR DELETE ON group_memberships
  FOR EACH ROW
  EXECUTE FUNCTION decrement_member_count();

-- Create a table for group posts/discussions
CREATE TABLE IF NOT EXISTS group_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  media_url TEXT,
  media_urls TEXT[],
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for group posts
CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON group_posts(group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_user_id ON group_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_created_at ON group_posts(created_at DESC);

-- Enable RLS on group posts
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public group posts are viewable by all" ON group_posts;
DROP POLICY IF EXISTS "Private group posts viewable by members only" ON group_posts;
DROP POLICY IF EXISTS "Group members can create posts" ON group_posts;

-- Group posts policies
CREATE POLICY "Public group posts are viewable by all"
ON group_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM posts 
    WHERE posts.id = group_posts.group_id 
    AND posts.privacy = 'public'
  )
);

CREATE POLICY "Private group posts viewable by members only"
ON group_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_memberships 
    WHERE group_memberships.group_id = group_posts.group_id 
    AND group_memberships.user_id = auth.uid()
    AND group_memberships.status = 'active'
  )
);

CREATE POLICY "Group members can create posts"
ON group_posts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_memberships 
    WHERE group_memberships.group_id = group_posts.group_id 
    AND group_memberships.user_id = auth.uid()
    AND group_memberships.status = 'active'
  )
  AND auth.uid() = user_id
);

COMMENT ON TABLE group_memberships IS 'Tracks user memberships in groups/communities';
COMMENT ON TABLE group_posts IS 'Posts and discussions within groups';

