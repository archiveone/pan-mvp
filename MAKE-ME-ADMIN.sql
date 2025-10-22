-- =====================================================
-- MAKE YOURSELF ADMIN
-- =====================================================

-- Option 1: Find your user ID by name/username
SELECT 'Your profiles:' as info;
SELECT id, name, username, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- After you see your ID above, uncomment and run this with your actual ID:
-- UPDATE profiles 
-- SET is_admin = true, is_moderator = true
-- WHERE id = 'YOUR-USER-ID-HERE';

-- Option 2: Make the most recent user admin (if that's you)
-- UPDATE profiles 
-- SET is_admin = true, is_moderator = true
-- WHERE id = (SELECT id FROM profiles ORDER BY created_at DESC LIMIT 1);

-- Option 3: Find by auth email (if you know your Supabase auth email)
-- UPDATE profiles 
-- SET is_admin = true, is_moderator = true
-- WHERE id IN (
--   SELECT id FROM auth.users WHERE email = 'archiveonecontact@gmail.com'
-- );

-- Verify admin status
SELECT 'Admin users:' as info;
SELECT id, name, username, is_admin, is_moderator 
FROM profiles 
WHERE is_admin = true OR is_moderator = true;

