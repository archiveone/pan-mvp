-- Complete storage policies for the media bucket
-- Run this in Supabase SQL Editor after creating the media bucket

-- First, make sure the media bucket exists
-- If it doesn't exist, create it in the Supabase dashboard:
-- Go to Storage → Create Bucket → Name: "media" → Public: true

-- Set up RLS for the media bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view media files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;

-- Create new policies for the media bucket
CREATE POLICY "Anyone can view media files" ON storage.objects
    FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'media' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update their own media" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'media' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own media" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'media' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Alternative simpler policies if the above don't work
-- Uncomment these if you get RLS errors:

-- DROP POLICY IF EXISTS "Public media access" ON storage.objects;
-- CREATE POLICY "Public media access" ON storage.objects
--     FOR ALL USING (bucket_id = 'media');

-- If you still get errors, you can temporarily disable RLS for testing:
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
