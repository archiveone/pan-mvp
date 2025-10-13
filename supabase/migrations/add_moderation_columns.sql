-- Add moderation and publishing columns to posts table
-- Run this in your Supabase SQL Editor

-- Add columns if they don't exist
ALTER TABLE posts 
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_safety_approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(is_published);
CREATE INDEX IF NOT EXISTS idx_posts_approved ON posts(is_safety_approved);
CREATE INDEX IF NOT EXISTS idx_posts_moderation_status ON posts(moderation_status);
CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts(is_featured);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(content_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET view_count = view_count + 1
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment like count
CREATE OR REPLACE FUNCTION increment_like_count(content_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET like_count = like_count + 1
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql;

-- Update existing posts to be published and approved by default (temporary for development)
UPDATE posts
SET 
  is_published = true,
  is_safety_approved = true,
  moderation_status = 'approved'
WHERE is_published IS NULL OR is_safety_approved IS NULL;

COMMENT ON COLUMN posts.is_published IS 'Whether the post is published and visible';
COMMENT ON COLUMN posts.is_safety_approved IS 'Whether the post has been approved by safety moderation';
COMMENT ON COLUMN posts.moderation_status IS 'Current moderation status: pending, approved, or rejected';
COMMENT ON COLUMN posts.is_featured IS 'Whether the post should be featured prominently';
COMMENT ON COLUMN posts.view_count IS 'Number of times the post has been viewed';
COMMENT ON COLUMN posts.like_count IS 'Number of likes the post has received';

