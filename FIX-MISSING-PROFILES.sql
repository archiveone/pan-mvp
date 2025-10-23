-- =====================================================
-- Fix Missing Profiles for Existing Users
-- =====================================================
-- Run this AFTER installing the trigger to fix users
-- who signed up before the trigger was installed
-- =====================================================

-- Show how many users are missing profiles
SELECT 
  COUNT(*) as users_without_profiles
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Create profiles for all users who don't have one
INSERT INTO profiles (id, name, username, bio, created_at)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email,
    'User'
  ) as name,
  COALESCE(
    au.raw_user_meta_data->>'username',
    'user_' || substring(au.id::text, 1, 8)
  ) as username,
  'Welcome to Pan!' as bio,
  au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Show results
SELECT 
  'Created profiles for ' || COUNT(*) || ' users!' as result
FROM auth.users au
INNER JOIN profiles p ON au.id = p.id;

-- Verify all users now have profiles
SELECT 
  COUNT(DISTINCT au.id) as total_users,
  COUNT(DISTINCT p.id) as users_with_profiles,
  COUNT(DISTINCT au.id) - COUNT(DISTINCT p.id) as users_without_profiles
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
DECLARE
  user_count INTEGER;
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM profiles;
  
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '✅ Profile Fix Complete!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Total auth users: %', user_count;
  RAISE NOTICE 'Total profiles: %', profile_count;
  RAISE NOTICE '';
  
  IF user_count = profile_count THEN
    RAISE NOTICE '🎉 All users now have profiles!';
  ELSE
    RAISE NOTICE '⚠️  Some users still missing profiles';
    RAISE NOTICE 'This might be OK if they signed up recently';
  END IF;
  RAISE NOTICE '';
END $$;

