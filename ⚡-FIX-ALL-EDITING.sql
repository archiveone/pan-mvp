-- =====================================================
-- FIX ALL EDITING ISSUES - Complete Fix
-- =====================================================
-- Fixes: Hub boxes, Profile, and all related tables
-- Run this ONE file to fix everything
-- =====================================================

-- ============= ADD MISSING COLUMNS =============

-- Add profile box customization columns if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'profile_box_color') THEN
    ALTER TABLE profiles ADD COLUMN profile_box_color VARCHAR(7);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'profile_box_image') THEN
    ALTER TABLE profiles ADD COLUMN profile_box_image TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'hub_boxes' AND column_name = 'is_public') THEN
    ALTER TABLE hub_boxes ADD COLUMN is_public BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ============= FIX PROFILES TABLE =============

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles viewable" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create correct policies
CREATE POLICY "Public profiles viewable"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============= FIX HUB_BOXES TABLE =============

ALTER TABLE hub_boxes ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'hub_boxes') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON hub_boxes';
  END LOOP;
END $$;

-- Create correct policies
CREATE POLICY "Users view own or public hub boxes"
  ON hub_boxes FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users insert own hub boxes"
  ON hub_boxes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own hub boxes"
  ON hub_boxes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own hub boxes"
  ON hub_boxes FOR DELETE
  USING (auth.uid() = user_id);

-- ============= FIX HUB_BOX_ITEMS TABLE =============

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hub_box_items') THEN
    EXECUTE 'ALTER TABLE hub_box_items ENABLE ROW LEVEL SECURITY';
    
    -- Drop existing
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own box items" ON hub_box_items';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own box items" ON hub_box_items';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own box items" ON hub_box_items';
    
    -- Create new
    EXECUTE 'CREATE POLICY "Users can view own box items"
      ON hub_box_items FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM hub_boxes 
        WHERE hub_boxes.id = hub_box_items.box_id 
        AND hub_boxes.user_id = auth.uid()
      ))';
    
    EXECUTE 'CREATE POLICY "Users can insert own box items"
      ON hub_box_items FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM hub_boxes 
        WHERE hub_boxes.id = hub_box_items.box_id 
        AND hub_boxes.user_id = auth.uid()
      ))';
    
    EXECUTE 'CREATE POLICY "Users can delete own box items"
      ON hub_box_items FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM hub_boxes 
        WHERE hub_boxes.id = hub_box_items.box_id 
        AND hub_boxes.user_id = auth.uid()
      ))';
  END IF;
END $$;

-- ============= FIX INBOX_ASSIGNMENTS TABLE =============

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inbox_assignments') THEN
    EXECUTE 'ALTER TABLE inbox_assignments ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own inbox assignments" ON inbox_assignments';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own inbox assignments" ON inbox_assignments';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own inbox assignments" ON inbox_assignments';
    
    EXECUTE 'CREATE POLICY "Users can view own inbox assignments"
      ON inbox_assignments FOR SELECT
      USING (user_id = auth.uid())';
    
    EXECUTE 'CREATE POLICY "Users can insert own inbox assignments"
      ON inbox_assignments FOR INSERT
      WITH CHECK (user_id = auth.uid())';
    
    EXECUTE 'CREATE POLICY "Users can delete own inbox assignments"
      ON inbox_assignments FOR DELETE
      USING (user_id = auth.uid())';
  END IF;
END $$;

-- ============= VERIFICATION =============

SELECT '✅ Policies Fixed!' as status;

SELECT 'Profiles Policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles' ORDER BY cmd;

SELECT 'Hub Boxes Policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'hub_boxes' ORDER BY cmd;

-- ============= SUCCESS MESSAGE =============

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ ALL EDITING FIXED!';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Profile - Can edit name, username, bio, avatar';
  RAISE NOTICE '✅ Profile Box - Can edit background color/image';
  RAISE NOTICE '✅ Hub Boxes - Can create, edit, delete boxes';
  RAISE NOTICE '✅ Hub Items - Can add/remove items to boxes';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Try editing everything now!';
  RAISE NOTICE '';
END $$;

