# User Hub Setup Guide

## 🚨 Database Setup Required

The user hub requires several database tables and a storage bucket. Follow these steps:

### 1. Database Tables Setup

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database-complete-setup.sql`
4. Click **"Run"** to execute the script

This will create:
- ✅ `profiles` table (for user profiles)
- ✅ `posts` table (for marketplace posts)
- ✅ `saved_posts` table (for saved items)
- ✅ `groups` table (for communities)
- ✅ `user_groups` table (for group memberships)
- ✅ `portfolio_files` table (for user files)
- ✅ `user_analytics` table (for engagement tracking)
- ✅ All necessary RLS policies and indexes

### 2. Storage Bucket Setup

1. Go to **Storage** in your Supabase Dashboard
2. Click **"New bucket"**
3. Create bucket with these settings:
   - **Name**: `media`
   - **Public**: ✅ **YES** (uncheck "Private")
   - **File size limit**: `50MB`
   - **Allowed MIME types**: `*/*`

### 3. Storage Policies

After creating the bucket, go to **Storage** > **Policies** and add these policies:

```sql
-- Allow public read access
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'media' 
    AND auth.role() = 'authenticated'
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
    bucket_id = 'media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. Test the Setup

After completing the setup:

1. **Restart your development server**:
   ```bash
   npx next dev
   ```

2. **Test profile editing**:
   - Go to `/hub`
   - Try editing your profile
   - Upload a profile picture

3. **Test portfolio uploads**:
   - Go to `/portfolio`
   - Try uploading a file

4. **Test saved posts**:
   - Go to `/saved`
   - Should show empty state (no saved posts yet)

## 🔧 Troubleshooting

### "Bucket not found" Error
- Make sure you created the `media` bucket in Storage
- Check that the bucket is **public**

### "Table doesn't exist" Error
- Run the `database-complete-setup.sql` script
- Check that all tables were created successfully

### "RLS Policy" Errors
- Make sure you added the storage policies
- Check that RLS is enabled on all tables

### Profile Update Errors
- The `profiles` table should be created automatically
- Check that the user has a profile record

## ✅ Success Indicators

When everything is working:
- ✅ Profile editing works without errors
- ✅ Image uploads succeed
- ✅ Portfolio file uploads work
- ✅ No console errors in browser
- ✅ Data persists after page refresh

## 🎯 Next Steps

Once the setup is complete:
1. Test all user hub functionality
2. Create some sample posts
3. Test the save/unsave functionality
4. Upload portfolio files
5. Join some groups (when implemented)
