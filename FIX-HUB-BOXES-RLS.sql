-- Fix hub_boxes RLS (403 error)

-- Drop existing policies
DROP POLICY IF EXISTS "users_view_public_or_own_boxes" ON hub_boxes;
DROP POLICY IF EXISTS "users_manage_own_boxes" ON hub_boxes;

-- Create simple working policies
CREATE POLICY "hub_boxes_select"
ON hub_boxes FOR SELECT
TO authenticated
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "hub_boxes_insert"
ON hub_boxes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "hub_boxes_update"
ON hub_boxes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "hub_boxes_delete"
ON hub_boxes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Also fix collections RLS
DROP POLICY IF EXISTS "users_view_public_or_own_collections" ON collections;
DROP POLICY IF EXISTS "users_manage_own_collections" ON collections;

CREATE POLICY "collections_select"
ON collections FOR SELECT
TO authenticated
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "collections_all"
ON collections FOR ALL
TO authenticated
USING (auth.uid() = user_id);

SELECT '✅ Hub RLS fixed!' as message;

