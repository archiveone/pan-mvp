-- =====================================================
-- FIX: Foreign Key Constraint Error on Posts
-- =====================================================
-- Error: insert or update on table "posts" violates 
-- foreign key constraint "posts_user_id_fkey"
-- =====================================================

-- This means profiles are missing for some users
-- Let's fix it!

-- ============= STEP 1: Check the Problem =============

-- See which users don't have profiles
SELECT 
  au.id,
  au.email,
  au.created_at,
  CASE WHEN p.id IS NULL THEN '❌ Missing Profile' ELSE '✅ Has Profile' END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 20;

-- ============= STEP 2: Create Missing Profiles =============

-- Create profiles for ALL users who don't have one
INSERT INTO profiles (
  id, 
  name, 
  username,
  bio, 
  created_at
)
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

-- ============= STEP 3: Fix Posts Foreign Key =============

-- Check if posts table references are correct
DO $$
BEGIN
  -- Drop old foreign key if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_user_id_fkey' 
    AND table_name = 'posts'
  ) THEN
    ALTER TABLE posts DROP CONSTRAINT posts_user_id_fkey;
  END IF;
  
  -- Recreate with proper cascade
  ALTER TABLE posts 
    ADD CONSTRAINT posts_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE;
    
  RAISE NOTICE 'Foreign key constraint fixed!';
END $$;

-- ============= STEP 4: Fix Content Table Too =============

-- Same fix for content table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'content'
  ) THEN
    -- Drop old foreign key if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'content_user_id_fkey' 
      AND table_name = 'content'
    ) THEN
      ALTER TABLE content DROP CONSTRAINT content_user_id_fkey;
    END IF;
    
    -- Recreate with proper cascade
    ALTER TABLE content 
      ADD CONSTRAINT content_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES profiles(id) 
      ON DELETE CASCADE;
      
    RAISE NOTICE 'Content table foreign key fixed!';
  END IF;
END $$;

-- ============= STEP 5: Verify Everything =============

-- Check all users now have profiles
SELECT 
  'Total Users' as metric,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Users with Profiles',
  COUNT(p.id)
FROM auth.users au
INNER JOIN profiles p ON au.id = p.id
UNION ALL
SELECT 
  'Users WITHOUT Profiles',
  COUNT(*)
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Check foreign keys are correct
SELECT 
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('posts', 'content')
  AND kcu.column_name = 'user_id';

-- ============= SUCCESS MESSAGE =============

DO $$
DECLARE
  user_count INTEGER;
  profile_count INTEGER;
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM profiles;
  
  SELECT COUNT(*) INTO missing_count
  FROM auth.users au
  LEFT JOIN profiles p ON au.id = p.id
  WHERE p.id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ FOREIGN KEY ERROR FIXED!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total auth users: %', user_count;
  RAISE NOTICE 'Total profiles: %', profile_count;
  RAISE NOTICE 'Missing profiles: %', missing_count;
  RAISE NOTICE '';
  
  IF missing_count = 0 THEN
    RAISE NOTICE '🎉 All users now have profiles!';
    RAISE NOTICE '🎉 You can now create posts!';
  ELSE
    RAISE NOTICE '⚠️  Still % users without profiles', missing_count;
    RAISE NOTICE 'Run this script again or check manually';
  END IF;
  RAISE NOTICE '';
END $$;

-- ============= TEST IT =============

-- Now try to create a post (you can uncomment this to test)
-- SELECT '✅ Ready to test! Try creating a post now.' as message;

