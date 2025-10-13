-- Drop existing comments table to start fresh
DROP TABLE IF EXISTS comments CASCADE;

-- Create comments table (simple version)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add self-referencing foreign key for replies
ALTER TABLE comments 
ADD CONSTRAINT comments_parent_id_fkey 
FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE;

-- Add indexes
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- DISABLE RLS for now to test
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- Add columns to posts table if they don't exist
ALTER TABLE posts ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(content_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET view_count = COALESCE(view_count, 0) + 1 WHERE id = content_id;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE 'Comments table created successfully! RLS is DISABLED for testing.';
  RAISE NOTICE 'You can now post comments freely.';
  RAISE NOTICE 'Enable RLS later for production security.';
END $$;


