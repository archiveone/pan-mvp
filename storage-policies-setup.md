# Supabase Storage Policies Setup

## Policy 1: Public Read Access (for viewing images)

**Policy Name:** `Public read access`

**Allowed Operation:** `SELECT`

**Target Roles:** `anon` (uncheck authenticated if you want public access)

**Policy Definition:**
```sql
bucket_id = 'media'
```

## Policy 2: Authenticated Upload (for authenticated users)

**Policy Name:** `Authenticated users can upload`

**Allowed Operation:** `INSERT`

**Target Roles:** `authenticated`

**Policy Definition:**
```sql
bucket_id = 'media' AND auth.role() = 'authenticated'
```

## Policy 3: Users can update their own files

**Policy Name:** `Users can update their own files`

**Allowed Operation:** `UPDATE`

**Target Roles:** `authenticated`

**Policy Definition:**
```sql
bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]
```

## Policy 4: Users can delete their own files

**Policy Name:** `Users can delete their own files`

**Allowed Operation:** `DELETE`

**Target Roles:** `authenticated`

**Policy Definition:**
```sql
bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]
```

## Alternative: More Restrictive Public Access

If you want to restrict public access to only images, use this for Policy 1:

**Policy Name:** `Public read access for images only`

**Policy Definition:**
```sql
bucket_id = 'media' AND (name LIKE '%.jpg' OR name LIKE '%.jpeg' OR name LIKE '%.png' OR name LIKE '%.gif' OR name LIKE '%.webp')
```

## Folder Structure

Your storage will be organized as:
- `avatars/{user_id}/` - Profile pictures
- `listings/{post_id}/` - Post images  
- `portfolio/{user_id}/` - Portfolio files

## Testing

After setting up policies:
1. Try uploading a profile picture in your app
2. Check if the image appears in Storage dashboard
3. Verify the image loads when you view the profile
