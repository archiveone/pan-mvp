# 🗄️ Simple Storage Setup for Pan Marketplace

## Method 1: Dashboard Setup (Recommended)

### Step 1: Create the Media Bucket
1. Go to your Supabase dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Set the following:
   - **Name**: `media`
   - **Public bucket**: ✅ **Check this box**
   - **File size limit**: 50MB
5. Click **"Create bucket"**

### Step 2: Set Storage Policies via Dashboard
1. Go to **Storage** → **Policies**
2. Click **"New Policy"** for the `media` bucket
3. Create these policies:

**Policy 1: Public Read Access**
- **Policy name**: `Public read access`
- **Target roles**: `public`
- **Operation**: `SELECT`
- **Policy definition**: `true`

**Policy 2: Authenticated Upload**
- **Policy name**: `Authenticated upload`
- **Target roles**: `authenticated`
- **Operation**: `INSERT`
- **Policy definition**: `true`

**Policy 3: User Update/Delete**
- **Policy name**: `User can update/delete own files`
- **Target roles**: `authenticated`
- **Operation**: `UPDATE, DELETE`
- **Policy definition**: `auth.uid()::text = (storage.foldername(name))[1]`

## Method 2: Disable RLS (Quick Fix)

If the above doesn't work, you can temporarily disable RLS:

1. Go to **Storage** → **Settings**
2. Find **"Row Level Security"**
3. **Disable RLS** for the `media` bucket
4. This allows all operations (less secure but works for testing)

## Method 3: Alternative Bucket Name

If you're still having issues, try creating a bucket with a different name:

1. Create bucket named `uploads` instead of `media`
2. Update the code to use `uploads` bucket
3. Set it to public

## Test the Setup

After setting up storage:
1. Try creating a listing with an image
2. Check if the image appears in the Storage bucket
3. Verify the image displays on the homepage

## Troubleshooting

**If you still get RLS errors:**
- Make sure the bucket is set to **Public**
- Try the "Disable RLS" method above
- Check that you're logged in when testing

**If images don't display:**
- Check the bucket permissions
- Verify the file URLs are correct
- Make sure the bucket is public

This should resolve your storage upload issues! 🎉
