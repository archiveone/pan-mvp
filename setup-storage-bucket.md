# Supabase Storage Bucket Setup

## Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Create a bucket named `media` with the following settings:
   - **Name**: `media`
   - **Public**: ✅ **YES** (uncheck "Private")
   - **File size limit**: `50MB`
   - **Allowed MIME types**: `*/*` (all file types)

## Storage Policies

After creating the bucket, add these RLS policies in the **Storage** > **Policies** section:

### Policy 1: Allow public read access
```sql
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'media');
```

### Policy 2: Allow authenticated users to upload
```sql
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'media' 
    AND auth.role() = 'authenticated'
);
```

### Policy 3: Allow users to update their own files
```sql
CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Policy 4: Allow users to delete their own files
```sql
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
    bucket_id = 'media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Folder Structure

The storage will be organized as:
- `avatars/{user_id}/` - Profile pictures
- `listings/{post_id}/` - Post images
- `portfolio/{user_id}/` - Portfolio files

## Test Upload

After setup, test that uploads work by:
1. Going to your app
2. Trying to upload a profile picture
3. Checking the Storage section in Supabase Dashboard
