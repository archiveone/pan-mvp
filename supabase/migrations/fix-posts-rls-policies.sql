-- Fix RLS policies on posts table to allow inserts
-- Run this in Supabase SQL Editor

-- Drop all existing policies on posts table
DROP POLICY IF EXISTS "Users can view public posts" ON posts;
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can insert posts" ON posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

-- Create new, working policies

-- 1. Allow everyone to VIEW published posts
CREATE POLICY "Anyone can view published posts"
ON posts FOR SELECT
USING (is_published = true);

-- 2. Allow authenticated users to INSERT posts
CREATE POLICY "Authenticated users can create posts"
ON posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Allow users to UPDATE their own posts
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Allow users to DELETE their own posts
CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE
USING (auth.uid() = user_id);

-- Verify RLS is enabled
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Show confirmation
SELECT 'RLS policies fixed! Authenticated users can now create posts.' as message;

