# 🔧 Storage Buckets Fix Guide

## 🚨 Issue: "Storage buckets missing!"

If you're seeing this error when trying to upload files:
```
⚠️ Storage buckets missing! Go to Supabase Dashboard → Storage → Create buckets "content-images" and "media" (make them PUBLIC).
```

## 🔍 Quick Diagnosis

Run this command to check your current buckets:
```bash
npm run check:buckets
```

This will show you:
- ✅ Which buckets exist
- ❌ Which buckets are missing
- 🔒 Access permissions for each bucket

## 🛠️ Quick Fix Options

### Option 1: Automatic Fix (Recommended)
```bash
npm run fix:buckets
```

This script will automatically create any missing buckets with proper settings.

### Option 2: Manual Fix via Supabase Dashboard

1. **Go to your Supabase Dashboard**
2. **Navigate to Storage**
3. **Create these buckets (make them PUBLIC):**
   - `content-images` (for images)
   - `media` (for general uploads)
   - `content-videos` (for videos)
   - `content-audio` (for audio files)
   - `content-documents` (for documents)

### Option 3: SQL Fix
Run this SQL in your Supabase SQL Editor:

```sql
-- Create required storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('content-images', 'content-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']),
  ('media', 'media', true, 52428800, null),
  ('content-videos', 'content-videos', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']),
  ('content-audio', 'content-audio', true, 52428800, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a']),
  ('content-documents', 'content-documents', true, 10485760, ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Public can view all files" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Authenticated users can upload files" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## ✅ Verification

After fixing, test your uploads:

1. **Run the check again:**
   ```bash
   npm run check:buckets
   ```

2. **Try uploading a file** in your app

3. **Check the console** for any remaining errors

## 🔧 Troubleshooting

### If buckets exist but uploads still fail:

1. **Check bucket permissions:**
   - Go to Supabase Dashboard → Storage
   - Click on each bucket
   - Ensure "Public" is enabled

2. **Check RLS policies:**
   - Go to Supabase Dashboard → Authentication → Policies
   - Look for storage.objects policies
   - Ensure there are policies for SELECT and INSERT

3. **Check environment variables:**
   - Verify `.env.local` has correct Supabase URL and keys
   - Restart your development server

### Common Issues:

- **"Bucket not found"** → Bucket doesn't exist or wrong name
- **"Permission denied"** → Bucket not public or missing RLS policies
- **"File too large"** → Check file size limits in bucket settings
- **"Invalid file type"** → Check allowed MIME types in bucket settings

## 📋 Required Buckets Summary

| Bucket Name | Purpose | File Size Limit | Allowed Types |
|-------------|---------|-----------------|----------------|
| `content-images` | Images | 50MB | JPEG, PNG, GIF, WebP, SVG |
| `media` | General uploads | 50MB | All types |
| `content-videos` | Videos | 100MB | MP4, WebM, QuickTime, AVI |
| `content-audio` | Audio files | 50MB | MP3, WAV, OGG, M4A |
| `content-documents` | Documents | 10MB | PDF, DOC, DOCX, TXT |

## 🎉 Success!

Once all buckets are created and properly configured, your uploads should work perfectly! The error message will disappear and you'll be able to upload images, videos, audio, and documents to your PAN app.
