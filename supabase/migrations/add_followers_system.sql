-- Followers System Migration
-- Creates tables and functions for user following/followers functionality

-- Create followers table
CREATE TABLE IF NOT EXISTS followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can't follow the same person twice
  UNIQUE(follower_id, following_id),
  
  -- Ensure a user can't follow themselves
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);
CREATE INDEX IF NOT EXISTS idx_followers_created_at ON followers(created_at DESC);

-- Add follower/following counts to profiles table (if not exists)
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Create function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for follower
    UPDATE profiles 
    SET following_count = following_count + 1
    WHERE id = NEW.follower_id;
    
    -- Increment followers count for the user being followed
    UPDATE profiles 
    SET followers_count = followers_count + 1
    WHERE id = NEW.following_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following count for follower
    UPDATE profiles 
    SET following_count = GREATEST(0, following_count - 1)
    WHERE id = OLD.follower_id;
    
    -- Decrement followers count for the user being unfollowed
    UPDATE profiles 
    SET followers_count = GREATEST(0, followers_count - 1)
    WHERE id = OLD.following_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update counts
DROP TRIGGER IF EXISTS trigger_update_follower_counts ON followers;
CREATE TRIGGER trigger_update_follower_counts
  AFTER INSERT OR DELETE ON followers
  FOR EACH ROW
  EXECUTE FUNCTION update_follower_counts();

-- RLS Policies for followers table
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- Anyone can view followers/following relationships
CREATE POLICY "Anyone can view followers"
  ON followers FOR SELECT
  USING (true);

-- Users can follow others
CREATE POLICY "Users can follow others"
  ON followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow"
  ON followers FOR DELETE
  USING (auth.uid() = follower_id);

-- Create helpful views
CREATE OR REPLACE VIEW user_follower_stats AS
SELECT 
  p.id as user_id,
  p.name,
  p.username,
  p.avatar_url,
  COALESCE(p.followers_count, 0) as followers_count,
  COALESCE(p.following_count, 0) as following_count
FROM profiles p;

-- Grant access to the view
GRANT SELECT ON user_follower_stats TO authenticated;
GRANT SELECT ON user_follower_stats TO anon;

-- Comments
COMMENT ON TABLE followers IS 'Stores user following relationships';
COMMENT ON COLUMN followers.follower_id IS 'User who is following';
COMMENT ON COLUMN followers.following_id IS 'User being followed';

