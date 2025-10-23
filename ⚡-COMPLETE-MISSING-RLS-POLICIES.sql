-- =====================================================
-- COMPLETE MISSING RLS POLICIES
-- =====================================================
-- Adds missing policies to tables that already have some
-- but are incomplete (missing INSERT, UPDATE, or DELETE)
-- =====================================================

-- Helper function to add missing policies
CREATE OR REPLACE FUNCTION add_missing_rls_policies(
  table_name text,
  user_column text DEFAULT 'user_id'
)
RETURNS void AS $$
DECLARE
  has_select BOOLEAN;
  has_insert BOOLEAN;
  has_update BOOLEAN;
  has_delete BOOLEAN;
BEGIN
  -- Check which policies exist
  SELECT EXISTS(
    SELECT 1 FROM pg_policies 
    WHERE tablename = table_name AND cmd = 'SELECT'
  ) INTO has_select;
  
  SELECT EXISTS(
    SELECT 1 FROM pg_policies 
    WHERE tablename = table_name AND cmd = 'INSERT'
  ) INTO has_insert;
  
  SELECT EXISTS(
    SELECT 1 FROM pg_policies 
    WHERE tablename = table_name AND cmd = 'UPDATE'
  ) INTO has_update;
  
  SELECT EXISTS(
    SELECT 1 FROM pg_policies 
    WHERE tablename = table_name AND cmd = 'DELETE'
  ) INTO has_delete;
  
  -- Add missing SELECT
  IF NOT has_select THEN
    EXECUTE format('
      CREATE POLICY "%s_select"
      ON %I FOR SELECT
      USING (auth.uid() = %I)
    ', table_name, table_name, user_column);
    RAISE NOTICE '✅ Added SELECT policy to: %', table_name;
  END IF;
  
  -- Add missing INSERT
  IF NOT has_insert THEN
    EXECUTE format('
      CREATE POLICY "%s_insert"
      ON %I FOR INSERT
      WITH CHECK (auth.uid() = %I)
    ', table_name, table_name, user_column);
    RAISE NOTICE '✅ Added INSERT policy to: %', table_name;
  END IF;
  
  -- Add missing UPDATE
  IF NOT has_update THEN
    EXECUTE format('
      CREATE POLICY "%s_update"
      ON %I FOR UPDATE
      USING (auth.uid() = %I)
      WITH CHECK (auth.uid() = %I)
    ', table_name, table_name, user_column, user_column);
    RAISE NOTICE '✅ Added UPDATE policy to: %', table_name;
  END IF;
  
  -- Add missing DELETE
  IF NOT has_delete THEN
    EXECUTE format('
      CREATE POLICY "%s_delete"
      ON %I FOR DELETE
      USING (auth.uid() = %I)
    ', table_name, table_name, user_column);
    RAISE NOTICE '✅ Added DELETE policy to: %', table_name;
  END IF;
  
  RAISE NOTICE '✓ Completed: % now has all 4 policies', table_name;
  
EXCEPTION
  WHEN others THEN
    RAISE NOTICE '❌ Error on %: %', table_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============= ADD MISSING POLICIES TO YOUR 22 TABLES =============

-- Tables with 3 policies (missing 1)
SELECT add_missing_rls_policies('advanced_events');
SELECT add_missing_rls_policies('bookable_listings');
SELECT add_missing_rls_policies('bookings');
SELECT add_missing_rls_policies('content');
SELECT add_missing_rls_policies('hub_box_items');
SELECT add_missing_rls_policies('inbox_assignments');
SELECT add_missing_rls_policies('live_streams');
SELECT add_missing_rls_policies('user_preferences');
SELECT add_missing_rls_policies('user_trust_scores');

-- Tables with 2 policies (missing 2)
SELECT add_missing_rls_policies('music_posts');
SELECT add_missing_rls_policies('notifications');
SELECT add_missing_rls_policies('reviews');
SELECT add_missing_rls_policies('saved_posts');
SELECT add_missing_rls_policies('story_views');
SELECT add_missing_rls_policies('transactions');

-- Tables with 1 policy (missing 3!)
SELECT add_missing_rls_policies('moderation_queue');
SELECT add_missing_rls_policies('user_actions');

-- Tables already complete (4+ policies) - skip
-- hub_boxes (4), posts (5), profiles (5), stories (7)

-- ============= SPECIAL: USER_GAMIFICATION =============

-- Add user_gamification if it exists (wasn't in your list)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_gamification') THEN
    PERFORM add_missing_rls_policies('user_gamification');
  END IF;
END $$;

-- ============= VERIFY ALL TABLES NOW HAVE 4 POLICIES =============

SELECT 
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Complete'
    WHEN COUNT(*) = 3 THEN '⚠️ Missing 1'
    WHEN COUNT(*) = 2 THEN '❌ Missing 2'
    WHEN COUNT(*) = 1 THEN '❌ Missing 3'
    ELSE '❌ No policies'
  END as status
FROM pg_policies
WHERE tablename IN (
  'advanced_events', 'bookable_listings', 'bookings', 'content',
  'hub_box_items', 'hub_boxes', 'inbox_assignments', 'live_streams',
  'moderation_queue', 'moderation_reports', 'music_posts',
  'notifications', 'posts', 'profiles', 'reviews', 'saved_posts',
  'stories', 'story_views', 'transactions', 'user_actions',
  'user_preferences', 'user_trust_scores', 'user_gamification'
)
GROUP BY tablename
ORDER BY 
  CASE 
    WHEN COUNT(*) >= 4 THEN 1
    WHEN COUNT(*) = 3 THEN 2
    WHEN COUNT(*) = 2 THEN 3
    ELSE 4
  END,
  tablename;

-- ============= SUMMARY =============

DO $$
DECLARE
  total_tables INTEGER;
  complete_tables INTEGER;
  incomplete_tables INTEGER;
BEGIN
  SELECT COUNT(DISTINCT tablename) INTO total_tables
  FROM pg_policies
  WHERE schemaname = 'public';
  
  SELECT COUNT(DISTINCT tablename) INTO complete_tables
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
  HAVING COUNT(*) >= 4;
  
  incomplete_tables := total_tables - complete_tables;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ MISSING POLICIES COMPLETED!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total tables with RLS: %', total_tables;
  RAISE NOTICE 'Tables with all 4 policies: %', complete_tables;
  RAISE NOTICE 'Tables still incomplete: %', incomplete_tables;
  RAISE NOTICE '';
  IF incomplete_tables = 0 THEN
    RAISE NOTICE '🎉 All tables now have complete RLS policies!';
  ELSE
    RAISE NOTICE '⚠️  Some tables still need attention';
  END IF;
  RAISE NOTICE '';
END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS add_missing_rls_policies(text, text);

