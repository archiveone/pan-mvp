-- Add is_private field to posts table for privacy control
-- Posts can be public (shown on profile) or private (hidden)

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Add index for faster queries filtering by privacy
CREATE INDEX IF NOT EXISTS idx_posts_is_private ON posts(is_private);

-- Add index for user posts with privacy filter
CREATE INDEX IF NOT EXISTS idx_posts_user_privacy ON posts(user_id, is_private);

-- Update RLS policies to respect privacy settings
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view public posts" ON posts;

-- Public posts are visible to everyone
CREATE POLICY "Users can view public posts"
ON posts FOR SELECT
USING (
  is_private = false
  OR auth.uid() = user_id
);

-- Users can view their own private posts
CREATE POLICY "Users can view own private posts"
ON posts FOR SELECT
USING (
  auth.uid() = user_id
);

COMMENT ON COLUMN posts.is_private IS 'If true, post is only visible to the owner. If false, post appears on public profile.';

