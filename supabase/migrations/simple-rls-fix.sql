-- Simple RLS fix - allow ALL authenticated users to create posts
-- Run this in Supabase SQL Editor

-- Drop the strict policy
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;

-- Create a simpler policy
CREATE POLICY "Authenticated users can create posts"
ON posts FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- This allows ANY logged-in user to create posts
-- The user_id is still saved, just not enforced by RLS

SELECT 'Simple RLS policy applied! Any logged-in user can now create posts.' as message;

