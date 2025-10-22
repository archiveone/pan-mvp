-- =====================================================
-- ENABLE POSTS TO SHOW IN FEED
-- This runs INDIVIDUALLY to avoid deadlocks
-- =====================================================

-- Step 1: Enable RLS on posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on posts (run each separately if needed)
DO $$
BEGIN
  -- Only drop policies on posts table, nothing else
  DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
  DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
  DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
  DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
  DROP POLICY IF EXISTS "Enable read access for all users" ON posts;
  DROP POLICY IF EXISTS "Public posts are viewable" ON posts;
  DROP POLICY IF EXISTS "Everyone can view posts" ON posts;
  DROP POLICY IF EXISTS "Users can create posts" ON posts;
  DROP POLICY IF EXISTS "Users can update own posts" ON posts;
  DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
END $$;

-- Step 3: Create fresh policies (these names are unique)
CREATE POLICY "posts_select_all"
ON posts FOR SELECT
USING (true);

CREATE POLICY "posts_insert_own"
ON posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update_own"
ON posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "posts_delete_own"
ON posts FOR DELETE
USING (auth.uid() = user_id);

-- Step 4: Verify
SELECT 
  'RLS Enabled on posts table' as status,
  COUNT(*) as total_posts 
FROM posts;

