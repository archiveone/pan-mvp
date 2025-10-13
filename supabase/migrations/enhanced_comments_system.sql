-- Enhanced Comments System with Threading, Reactions, Pinning, and GIF Support
-- Run this migration to enable full comment features

-- Create comments table with all features
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  gif_url TEXT,
  like_count INTEGER DEFAULT 0,
  dislike_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  edited_at TIMESTAMP WITH TIME ZONE
);

-- Add all columns safely if table already exists
DO $$ 
BEGIN
  ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;
  ALTER TABLE comments ADD COLUMN IF NOT EXISTS gif_url TEXT;
  ALTER TABLE comments ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
  ALTER TABLE comments ADD COLUMN IF NOT EXISTS dislike_count INTEGER DEFAULT 0;
  ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
  ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
  ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;
  ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;
  ALTER TABLE comments ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved';
  ALTER TABLE comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  ALTER TABLE comments ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;
END $$;

-- Create comment_reactions table for likes/dislikes
CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(comment_id, user_id) -- One reaction per user per comment
);

-- Indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_is_pinned ON comments(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_comments_is_deleted ON comments(is_deleted) WHERE is_deleted = false;

-- Indexes for reactions
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id ON comment_reactions(user_id);

-- Function to update comment reaction counts
CREATE OR REPLACE FUNCTION update_comment_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction_type = 'like' THEN
      UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    ELSIF NEW.reaction_type = 'dislike' THEN
      UPDATE comments SET dislike_count = dislike_count + 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction_type = 'like' THEN
      UPDATE comments SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.comment_id;
    ELSIF OLD.reaction_type = 'dislike' THEN
      UPDATE comments SET dislike_count = GREATEST(0, dislike_count - 1) WHERE id = OLD.comment_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Remove old reaction
    IF OLD.reaction_type = 'like' THEN
      UPDATE comments SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.comment_id;
    ELSIF OLD.reaction_type = 'dislike' THEN
      UPDATE comments SET dislike_count = GREATEST(0, dislike_count - 1) WHERE id = OLD.comment_id;
    END IF;
    -- Add new reaction
    IF NEW.reaction_type = 'like' THEN
      UPDATE comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    ELSIF NEW.reaction_type = 'dislike' THEN
      UPDATE comments SET dislike_count = dislike_count + 1 WHERE id = NEW.comment_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for reaction counts
DROP TRIGGER IF EXISTS trigger_update_comment_reaction_counts ON comment_reactions;
CREATE TRIGGER trigger_update_comment_reaction_counts
  AFTER INSERT OR UPDATE OR DELETE ON comment_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_reaction_counts();

-- Function to update comment_count on posts
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = COALESCE(comment_count, 0) + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = GREATEST(0, COALESCE(comment_count, 0) - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for post comment count
DROP TRIGGER IF EXISTS trigger_update_post_comment_count ON comments;
CREATE TRIGGER trigger_update_post_comment_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

-- RLS Policies for comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view non-deleted comments" ON comments;
CREATE POLICY "Anyone can view non-deleted comments"
  ON comments FOR SELECT
  USING (is_deleted = false OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for comment_reactions
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reactions" ON comment_reactions;
CREATE POLICY "Anyone can view reactions"
  ON comment_reactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can react" ON comment_reactions;
CREATE POLICY "Authenticated users can react"
  ON comment_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reactions" ON comment_reactions;
CREATE POLICY "Users can update own reactions"
  ON comment_reactions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reactions" ON comment_reactions;
CREATE POLICY "Users can delete own reactions"
  ON comment_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment_count to posts if not exists
ALTER TABLE posts ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- Update existing posts with correct comment counts
UPDATE posts p
SET comment_count = (
  SELECT COUNT(*) 
  FROM comments c 
  WHERE c.post_id = p.id AND c.is_deleted = false
)
WHERE comment_count IS NULL OR comment_count = 0;

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '✅ Enhanced comments system created successfully!';
  RAISE NOTICE '✅ Features enabled:';
  RAISE NOTICE '   - Threaded replies (parent_id)';
  RAISE NOTICE '   - Like/Dislike reactions';
  RAISE NOTICE '   - Pinning comments';
  RAISE NOTICE '   - GIF support';
  RAISE NOTICE '   - Soft deletes';
  RAISE NOTICE '   - Edit tracking';
  RAISE NOTICE '   - Automatic counts';
  RAISE NOTICE '🎉 Comments are ready to use!';
END $$;

