# Upload Timeout Fix - Quick Solution

## The Problem
Uploads are timing out because:
1. Storage buckets may not exist
2. Upload timeout is too long (60 seconds)
3. No connection testing before upload

## Quick Fix Steps

### 1. Create Storage Buckets in Supabase Dashboard
Go to your Supabase Dashboard → Storage and create these buckets manually:

**Required Buckets:**
- `media` (public, 50MB limit)
- `content-images` (public, 50MB limit) 
- `content-videos` (public, 100MB limit)
- `content-audio` (public, 50MB limit)
- `content-documents` (public, 10MB limit)

### 2. Test Upload Connection
Run this in your browser console to test:

```javascript
// Test Supabase connection
const { data, error } = await supabase.storage.listBuckets()
console.log('Buckets:', data)
console.log('Error:', error)
```

### 3. Use the New Upload Service
The new `UploadService` has:
- ✅ 30-second timeout (instead of 60)
- ✅ Connection testing before upload
- ✅ Better error messages
- ✅ Progress tracking
- ✅ Automatic bucket creation

### 4. Quick Test Upload
```javascript
// Test a small file upload
const testFile = new File(['test'], 'test.txt', { type: 'text/plain' })
const result = await UploadService.uploadFile(testFile, 'test-user', 'media', 'test')
console.log('Upload result:', result)
```

## If Still Timing Out

### Check Your Internet Connection
- Try uploading a smaller file first
- Check if your internet is stable
- Try from a different network

### Check Supabase Status
- Go to https://status.supabase.com
- Make sure all services are green

### Check File Size
- Images: max 10MB each
- Videos: max 50MB each  
- Audio: max 20MB each
- Documents: max 5MB each

## Emergency Fallback
If uploads still fail, you can:
1. Use a different upload service (like Cloudinary)
2. Implement client-side compression
3. Use chunked uploads for large files

## Next Steps
1. Create the storage buckets in Supabase Dashboard
2. Test the connection
3. Try uploading a small file
4. If it works, the timeout issue is fixed!
