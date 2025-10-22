-- =====================================================
-- SAFE RLS FIX - ONE TABLE AT A TIME (NO DEADLOCKS)
-- Run this ENTIRE script - it's designed to avoid deadlocks
-- =====================================================

-- 1. POSTS (most important - your 40 posts need to show!)
BEGIN;
  DROP POLICY IF EXISTS "posts_read_all" ON posts;
  DROP POLICY IF EXISTS "posts_insert_own" ON posts;
  DROP POLICY IF EXISTS "posts_update_own" ON posts;
  DROP POLICY IF EXISTS "posts_delete_own" ON posts;
  DROP POLICY IF EXISTS "allow_public_read_posts" ON posts;
  DROP POLICY IF EXISTS "allow_authenticated_insert_own_posts" ON posts;
  DROP POLICY IF EXISTS "allow_authenticated_update_own_posts" ON posts;
  DROP POLICY IF EXISTS "allow_authenticated_delete_own_posts" ON posts;
  
  ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY "posts_read_all" ON posts FOR SELECT USING (true);
  CREATE POLICY "posts_insert_own" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "posts_update_own" ON posts FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "posts_delete_own" ON posts FOR DELETE USING (auth.uid() = user_id);
COMMIT;

SELECT '✅ Posts fixed!' as status;

-- 2. PROFILES
BEGIN;
  -- Drop all existing policies dynamically
  DO $$ 
  DECLARE 
      r RECORD;
  BEGIN
      FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
          EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON profiles';
      END LOOP;
  END $$;
  
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY "profiles_read_all" ON profiles FOR SELECT USING (true);
  CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
  CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
COMMIT;

SELECT '✅ Profiles fixed!' as status;

-- 3. HUB BOXES
BEGIN;
  DO $$ 
  DECLARE 
      r RECORD;
  BEGIN
      FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'hub_boxes') LOOP
          EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON hub_boxes';
      END LOOP;
  END $$;
  
  ALTER TABLE hub_boxes ENABLE ROW LEVEL SECURITY;
  
  CREATE POLICY "hub_boxes_read_own_or_public" ON hub_boxes FOR SELECT USING (auth.uid() = user_id OR is_public = true);
  CREATE POLICY "hub_boxes_insert_own" ON hub_boxes FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "hub_boxes_update_own" ON hub_boxes FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "hub_boxes_delete_own" ON hub_boxes FOR DELETE USING (auth.uid() = user_id);
COMMIT;

SELECT '✅ Hub boxes fixed!' as status;

-- 4. SAVED POSTS (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'saved_posts') THEN
    BEGIN
      EXECUTE 'BEGIN';
      -- Drop policies
      FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'saved_posts') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON saved_posts';
      END LOOP;
      
      EXECUTE 'ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY';
      EXECUTE 'CREATE POLICY "saved_posts_read_own" ON saved_posts FOR SELECT USING (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "saved_posts_manage_own" ON saved_posts FOR ALL USING (auth.uid() = user_id)';
      EXECUTE 'COMMIT';
      
      RAISE NOTICE '✅ Saved posts fixed!';
    EXCEPTION WHEN OTHERS THEN
      EXECUTE 'ROLLBACK';
      RAISE NOTICE '⚠️ Skipped saved_posts: %', SQLERRM;
    END;
  END IF;
END $$;

-- 5. NOTIFICATIONS (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'notifications') THEN
    BEGIN
      FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'notifications') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON notifications';
      END LOOP;
      
      EXECUTE 'ALTER TABLE notifications ENABLE ROW LEVEL SECURITY';
      EXECUTE 'CREATE POLICY "notifications_read_own" ON notifications FOR SELECT USING (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id)';
      
      RAISE NOTICE '✅ Notifications fixed!';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Skipped notifications: %', SQLERRM;
    END;
  END IF;
END $$;

-- 6. USER PREFERENCES (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_preferences') THEN
    BEGIN
      FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_preferences') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON user_preferences';
      END LOOP;
      
      EXECUTE 'ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY';
      EXECUTE 'CREATE POLICY "user_preferences_manage_own" ON user_preferences FOR ALL USING (auth.uid() = user_id)';
      
      RAISE NOTICE '✅ User preferences fixed!';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Skipped user_preferences: %', SQLERRM;
    END;
  END IF;
END $$;

-- SUCCESS!
SELECT '🎉 ALL CRITICAL TABLES FIXED!' as final_status;
SELECT 'Your posts, profiles, and hub should now work!' as message;

