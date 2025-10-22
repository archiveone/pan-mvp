-- =====================================================
-- FINAL RLS FIX - Secure but Allows Public Viewing
-- =====================================================

-- Enable RLS on posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies
CREATE POLICY "allow_public_read_posts"
ON posts FOR SELECT
TO public
USING (true);

CREATE POLICY "allow_authenticated_insert_own_posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_authenticated_update_own_posts"
ON posts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "allow_authenticated_delete_own_posts"
ON posts FOR DELETE
TO authenticated  
USING (auth.uid() = user_id);

-- Verify
SELECT 'Posts RLS is now properly configured!' as message;
SELECT COUNT(*) as total_posts FROM posts;

