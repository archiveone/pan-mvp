-- Create storage buckets for file uploads
-- Run this in your Supabase SQL Editor

-- ============= CREATE STORAGE BUCKETS =============

-- Create media bucket (general uploads)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800, -- 50MB
  null
) ON CONFLICT (id) DO NOTHING;

-- Create content-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-images',
  'content-images',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Create content-videos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-videos',
  'content-videos',
  true,
  104857600, -- 100MB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
) ON CONFLICT (id) DO NOTHING;

-- Create content-audio bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-audio',
  'content-audio',
  true,
  52428800, -- 50MB
  ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a']
) ON CONFLICT (id) DO NOTHING;

-- Create content-documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-documents',
  'content-documents',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- ============= CREATE STORAGE POLICIES =============

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for media bucket - allow authenticated users to upload
CREATE POLICY "Authenticated users can upload to media bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media' AND 
    auth.role() = 'authenticated'
  );

-- Policy for media bucket - allow public read access
CREATE POLICY "Public can view media bucket files" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

-- Policy for content-images bucket - allow authenticated users to upload
CREATE POLICY "Authenticated users can upload to content-images bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'content-images' AND 
    auth.role() = 'authenticated'
  );

-- Policy for content-images bucket - allow public read access
CREATE POLICY "Public can view content-images bucket files" ON storage.objects
  FOR SELECT USING (bucket_id = 'content-images');

-- Policy for content-videos bucket - allow authenticated users to upload
CREATE POLICY "Authenticated users can upload to content-videos bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'content-videos' AND 
    auth.role() = 'authenticated'
  );

-- Policy for content-videos bucket - allow public read access
CREATE POLICY "Public can view content-videos bucket files" ON storage.objects
  FOR SELECT USING (bucket_id = 'content-videos');

-- Policy for content-audio bucket - allow authenticated users to upload
CREATE POLICY "Authenticated users can upload to content-audio bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'content-audio' AND 
    auth.role() = 'authenticated'
  );

-- Policy for content-audio bucket - allow public read access
CREATE POLICY "Public can view content-audio bucket files" ON storage.objects
  FOR SELECT USING (bucket_id = 'content-audio');

-- Policy for content-documents bucket - allow authenticated users to upload
CREATE POLICY "Authenticated users can upload to content-documents bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'content-documents' AND 
    auth.role() = 'authenticated'
  );

-- Policy for content-documents bucket - allow public read access
CREATE POLICY "Public can view content-documents bucket files" ON storage.objects
  FOR SELECT USING (bucket_id = 'content-documents');

-- ============= CREATE HELPER FUNCTIONS =============

-- Function to get public URL for a file
CREATE OR REPLACE FUNCTION get_storage_url(bucket_name TEXT, file_path TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CONCAT('https://', current_setting('app.settings.supabase_url', true), '/storage/v1/object/public/', bucket_name, '/', file_path);
END;
$$ LANGUAGE plpgsql;

-- Function to check if bucket exists
CREATE OR REPLACE FUNCTION bucket_exists(bucket_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = bucket_name
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get bucket info
CREATE OR REPLACE FUNCTION get_bucket_info(bucket_name TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', id,
    'name', name,
    'public', public,
    'file_size_limit', file_size_limit,
    'allowed_mime_types', allowed_mime_types,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO result
  FROM storage.buckets
  WHERE name = bucket_name;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============= SUCCESS MESSAGE =============

SELECT 'Storage buckets created successfully! File uploads should now work.' as message;
