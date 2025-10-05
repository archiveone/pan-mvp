# 🗄️ Storage Setup Guide for Pan Marketplace

## Step 1: Create the Media Bucket

1. Go to your Supabase dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Set the following:
   - **Name**: `media`
   - **Public bucket**: ✅ **Check this box**
   - **File size limit**: 50MB (or your preference)
   - **Allowed MIME types**: `image/*,video/*,audio/*` (or leave empty for all types)
5. Click **"Create bucket"**

## Step 2: Set Up Storage Policies

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `storage-policies-complete.sql`
3. Click **"Run"** to execute the policies

## Step 3: Test the Setup

1. Try creating a listing with an image
2. The image should upload successfully
3. You should see the image in the Storage → media bucket

## Troubleshooting

### If you get "new row violates row-level security policy":

**Option 1: Use the simpler policies**
```sql
-- Temporarily disable RLS for testing
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**Option 2: Check bucket permissions**
- Make sure the `media` bucket is set to **Public**
- Verify the bucket exists in Storage

**Option 3: Manual file upload test**
- Try uploading a file manually in the Supabase Storage interface
- If that works, the issue is with the RLS policies

## What This Enables

✅ **Image uploads** - Users can upload listing images  
✅ **Profile pictures** - Users can set profile avatars  
✅ **Media management** - Proper file organization  
✅ **Security** - RLS policies protect user data  

## File Structure

Your media bucket will be organized like:
```
media/
├── listings/
│   └── [post-id]_[index]_[timestamp].jpg
├── avatars/
│   └── [user-id]_[timestamp].jpg
└── portfolio/
    └── [user-id]_[filename]
```

After setting this up, your image uploads should work perfectly! 🎉
