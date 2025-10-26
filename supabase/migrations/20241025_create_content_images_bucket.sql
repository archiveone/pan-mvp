-- Create content-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-images',
  'content-images', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for content-images bucket
CREATE POLICY "Public read access for content-images" ON storage.objects
FOR SELECT USING (bucket_id = 'content-images');

CREATE POLICY "Authenticated users can upload content-images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'content-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own content-images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'content-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own content-images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'content-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
