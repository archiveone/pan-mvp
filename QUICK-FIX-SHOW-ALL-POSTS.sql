-- Make sure posts table has proper RLS policies so content shows in feed

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;
DROP POLICY IF EXISTS "Enable read access for all users" ON posts;
DROP POLICY IF EXISTS "Public posts are viewable" ON posts;

-- Create simple policies
CREATE POLICY "Everyone can view posts"
ON posts FOR SELECT
USING (true);

CREATE POLICY "Users can create posts"
ON posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE
USING (auth.uid() = user_id);

-- Check how many posts exist
SELECT COUNT(*) as total_posts FROM posts;
SELECT id, title, user_id, created_at FROM posts ORDER BY created_at DESC LIMIT 10;

