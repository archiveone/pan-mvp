-- TEMPORARY: Disable RLS entirely on posts table to test
-- This will show if RLS is the problem

-- Disable RLS completely (temporarily for testing)
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- Check posts now
SELECT 'Total posts:' as info, COUNT(*) as count FROM posts;
SELECT 'Recent posts:' as info, id, title, user_id FROM posts ORDER BY created_at DESC LIMIT 5;

-- After testing, you can re-enable with:
-- ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

