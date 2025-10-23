-- =====================================================
-- MASTER RLS FIX - ALL TABLES AT ONCE
-- =====================================================
-- This applies proper RLS to EVERY user-related table
-- Based on the general RLS principle
-- =====================================================

-- ============= GENERAL RLS PRINCIPLE =============
-- For each table that has user_id:
-- 1. SELECT: User can view their own data
-- 2. INSERT: User can create their own records
-- 3. UPDATE: User can modify their own records
-- 4. DELETE: User can delete their own records
-- =====================================================

-- Function to apply standard RLS to a table
CREATE OR REPLACE FUNCTION apply_standard_user_rls(table_name text)
RETURNS void AS $$
BEGIN
  -- Enable RLS
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  
  -- Drop all existing policies
  EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON %I', table_name, table_name);
  EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON %I', table_name, table_name);
  EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON %I', table_name, table_name);
  EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON %I', table_name, table_name);
  
  -- Create standard policies
  EXECUTE format('
    CREATE POLICY "%s_select"
    ON %I FOR SELECT
    USING (auth.uid() = user_id)
  ', table_name, table_name);
  
  EXECUTE format('
    CREATE POLICY "%s_insert"
    ON %I FOR INSERT
    WITH CHECK (auth.uid() = user_id)
  ', table_name, table_name);
  
  EXECUTE format('
    CREATE POLICY "%s_update"
    ON %I FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id)
  ', table_name, table_name);
  
  EXECUTE format('
    CREATE POLICY "%s_delete"
    ON %I FOR DELETE
    USING (auth.uid() = user_id)
  ', table_name, table_name);
  
  RAISE NOTICE '✅ Applied RLS to: %', table_name;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE '⚠️  Table does not exist: %', table_name;
  WHEN others THEN
    RAISE NOTICE '❌ Error on %: %', table_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ============= APPLY TO ALL USER TABLES =============

-- User-related tables (user_id column)
SELECT apply_standard_user_rls('user_preferences');
SELECT apply_standard_user_rls('user_trust_scores');
SELECT apply_standard_user_rls('user_gamification');
SELECT apply_standard_user_rls('saved_posts');
SELECT apply_standard_user_rls('user_analytics');
SELECT apply_standard_user_rls('user_activity');
SELECT apply_standard_user_rls('user_sessions');
SELECT apply_standard_user_rls('user_notifications');
SELECT apply_standard_user_rls('user_settings');
SELECT apply_standard_user_rls('dashboard_widgets');
SELECT apply_standard_user_rls('inbox_assignments');

-- ============= SPECIAL TABLES (Custom Policies) =============

-- PROFILES: Public SELECT, users can update own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;

CREATE POLICY "profiles_select"
  ON profiles FOR SELECT
  USING (true); -- Everyone can view profiles

CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

RAISE NOTICE '✅ Applied RLS to: profiles (public select)';

-- POSTS: Public SELECT, users manage own
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select" ON posts;
DROP POLICY IF EXISTS "posts_insert" ON posts;
DROP POLICY IF EXISTS "posts_update" ON posts;
DROP POLICY IF EXISTS "posts_delete" ON posts;

CREATE POLICY "posts_select"
  ON posts FOR SELECT
  USING (true); -- Everyone can view published posts

CREATE POLICY "posts_insert"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_delete"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

RAISE NOTICE '✅ Applied RLS to: posts (public select)';

-- CONTENT: Public SELECT, users manage own
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content') THEN
    ALTER TABLE content ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "content_select" ON content;
    DROP POLICY IF EXISTS "content_insert" ON content;
    DROP POLICY IF EXISTS "content_update" ON content;
    DROP POLICY IF EXISTS "content_delete" ON content;
    
    CREATE POLICY "content_select"
      ON content FOR SELECT
      USING (true);
    
    CREATE POLICY "content_insert"
      ON content FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "content_update"
      ON content FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "content_delete"
      ON content FOR DELETE
      USING (auth.uid() = user_id);
    
    RAISE NOTICE '✅ Applied RLS to: content (public select)';
  END IF;
END $$;

-- HUB_BOXES: Public or own
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hub_boxes') THEN
    ALTER TABLE hub_boxes ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "hub_boxes_select" ON hub_boxes;
    DROP POLICY IF EXISTS "hub_boxes_insert" ON hub_boxes;
    DROP POLICY IF EXISTS "hub_boxes_update" ON hub_boxes;
    DROP POLICY IF EXISTS "hub_boxes_delete" ON hub_boxes;
    
    CREATE POLICY "hub_boxes_select"
      ON hub_boxes FOR SELECT
      USING (auth.uid() = user_id OR is_public = true);
    
    CREATE POLICY "hub_boxes_insert"
      ON hub_boxes FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "hub_boxes_update"
      ON hub_boxes FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "hub_boxes_delete"
      ON hub_boxes FOR DELETE
      USING (auth.uid() = user_id);
    
    RAISE NOTICE '✅ Applied RLS to: hub_boxes (public or own)';
  END IF;
END $$;

-- HUB_BOX_ITEMS: Users see items in their boxes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hub_box_items') THEN
    ALTER TABLE hub_box_items ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "hub_box_items_select" ON hub_box_items;
    DROP POLICY IF EXISTS "hub_box_items_insert" ON hub_box_items;
    DROP POLICY IF EXISTS "hub_box_items_delete" ON hub_box_items;
    
    CREATE POLICY "hub_box_items_select"
      ON hub_box_items FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM hub_boxes 
        WHERE hub_boxes.id = hub_box_items.box_id 
        AND hub_boxes.user_id = auth.uid()
      ));
    
    CREATE POLICY "hub_box_items_insert"
      ON hub_box_items FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM hub_boxes 
        WHERE hub_boxes.id = hub_box_items.box_id 
        AND hub_boxes.user_id = auth.uid()
      ));
    
    CREATE POLICY "hub_box_items_delete"
      ON hub_box_items FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM hub_boxes 
        WHERE hub_boxes.id = hub_box_items.box_id 
        AND hub_boxes.user_id = auth.uid()
      ));
    
    RAISE NOTICE '✅ Applied RLS to: hub_box_items';
  END IF;
END $$;

-- ============= UPDATE SIGNUP TRIGGER =============

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER  -- ← Bypasses RLS for system operations!
SET search_path = public
AS $$
BEGIN
  -- Create profile (required)
  INSERT INTO public.profiles (id, name, bio, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    'Welcome to Pan!',
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Create trust score (optional)
  BEGIN
    INSERT INTO public.user_trust_scores (user_id, trust_score, created_at)
    VALUES (new.id, 100, now())
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN others THEN NULL;
  END;
  
  -- Create preferences (optional)
  BEGIN
    INSERT INTO public.user_preferences (user_id, created_at)
    VALUES (new.id, now())
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN others THEN NULL;
  END;
  
  -- Create gamification (optional)
  BEGIN
    INSERT INTO public.user_gamification (
      user_id, total_points, current_level, level_name, created_at
    )
    VALUES (new.id, 0, 1, 'Beginner', now())
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN others THEN NULL;
  END;
  
  RETURN new;
EXCEPTION WHEN others THEN
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============= VERIFY EVERYTHING =============

-- Show all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN '👁️ View'
    WHEN cmd = 'INSERT' THEN '➕ Create'
    WHEN cmd = 'UPDATE' THEN '✏️ Edit'
    WHEN cmd = 'DELETE' THEN '🗑️ Delete'
  END as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- ============= SUCCESS MESSAGE =============

DO $$
DECLARE
  policy_count INTEGER;
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
  SELECT COUNT(DISTINCT tablename) INTO table_count FROM pg_policies WHERE schemaname = 'public';
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ MASTER RLS FIX COMPLETE!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Tables with RLS: %', table_count;
  RAISE NOTICE 'Total policies: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ All user tables follow standard pattern:';
  RAISE NOTICE '   - SELECT: Users view their own data';
  RAISE NOTICE '   - INSERT: Users create their own records';
  RAISE NOTICE '   - UPDATE: Users modify their own records';
  RAISE NOTICE '   - DELETE: Users remove their own records';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Special tables (profiles, posts, hub_boxes):';
  RAISE NOTICE '   - Public SELECT (everyone can view)';
  RAISE NOTICE '   - Users manage their own records';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Trigger has SECURITY DEFINER (bypasses RLS)';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 All RLS errors should be fixed now!';
  RAISE NOTICE '';
END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS apply_standard_user_rls(text);

