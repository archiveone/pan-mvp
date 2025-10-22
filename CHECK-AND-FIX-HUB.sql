-- =====================================================
-- CHECK WHAT'S IN HUB_BOXES AND FIX RLS
-- =====================================================

-- 1. See what hub_boxes exist (bypasses RLS)
SELECT 'Your hub_boxes:' as info;
SELECT id, user_id, title, box_type, is_public, position 
FROM hub_boxes 
ORDER BY position;

-- 2. Check current RLS policies
SELECT 'Current RLS policies on hub_boxes:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'hub_boxes';

-- 3. Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "users_view_public_or_own_boxes" ON hub_boxes;
DROP POLICY IF EXISTS "users_manage_own_boxes" ON hub_boxes;
DROP POLICY IF EXISTS "hub_boxes_select" ON hub_boxes;
DROP POLICY IF EXISTS "hub_boxes_insert" ON hub_boxes;
DROP POLICY IF EXISTS "hub_boxes_update" ON hub_boxes;
DROP POLICY IF EXISTS "hub_boxes_delete" ON hub_boxes;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON hub_boxes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON hub_boxes;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON hub_boxes;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON hub_boxes;

-- 4. Create SIMPLE working policies
CREATE POLICY "hub_boxes_read_own_or_public"
ON hub_boxes FOR SELECT
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "hub_boxes_insert_own"
ON hub_boxes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "hub_boxes_update_own"
ON hub_boxes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "hub_boxes_delete_own"
ON hub_boxes FOR DELETE
USING (auth.uid() = user_id);

-- 5. Verify policies are correct now
SELECT 'New policies:' as info;
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'hub_boxes';

SELECT '✅ Hub boxes should work now!' as result;

