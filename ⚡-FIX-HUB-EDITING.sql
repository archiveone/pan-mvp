-- =====================================================
-- FIX: Hub Box Editing Not Working
-- =====================================================
-- Fixes RLS policies for hub_boxes and hub_box_items
-- =====================================================

-- First, ensure the tables have the is_public column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'hub_boxes' AND column_name = 'is_public') THEN
    ALTER TABLE hub_boxes ADD COLUMN is_public BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE hub_boxes ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for clean slate
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'hub_boxes') LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON hub_boxes';
  END LOOP;
END $$;

-- Create proper RLS policies for hub_boxes
CREATE POLICY "Users can view own or public hub boxes"
  ON hub_boxes FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert own hub boxes"
  ON hub_boxes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hub boxes"
  ON hub_boxes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own hub boxes"
  ON hub_boxes FOR DELETE
  USING (auth.uid() = user_id);

-- Fix hub_box_items RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hub_box_items') THEN
    ALTER TABLE hub_box_items ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own box items" ON hub_box_items';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own box items" ON hub_box_items';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own box items" ON hub_box_items';
    
    -- Create new policies
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

-- Fix inbox_assignments RLS (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inbox_assignments') THEN
    ALTER TABLE inbox_assignments ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own inbox assignments" ON inbox_assignments';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own inbox assignments" ON inbox_assignments';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete own inbox assignments" ON inbox_assignments';
    
    -- Create new policies
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

-- Verify policies exist
SELECT 'Hub Boxes Policies:' as info;
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'hub_boxes'
ORDER BY cmd;

SELECT 'Hub Box Items Policies:' as info;
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'hub_box_items'
ORDER BY cmd;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '✅ HUB EDITING RLS FIXED!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '✅ hub_boxes - All CRUD operations allowed';
  RAISE NOTICE '✅ hub_box_items - Can add/remove items';
  RAISE NOTICE '✅ inbox_assignments - Can assign conversations';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Try editing your hub boxes now!';
  RAISE NOTICE '';
END $$;

