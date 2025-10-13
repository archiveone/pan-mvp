-- Essential columns needed for uploads to work
-- Run this FIRST before the full migration

-- Add media URL array columns
ALTER TABLE posts 
  ADD COLUMN IF NOT EXISTS media_urls TEXT[];

-- Add other media columns  
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS audio_urls TEXT[],
  ADD COLUMN IF NOT EXISTS video_urls TEXT[],
  ADD COLUMN IF NOT EXISTS document_urls TEXT[];

-- Add moderation columns (if not already added)
ALTER TABLE posts 
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_safety_approved BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved';

-- Update existing rows to be approved
UPDATE posts
SET 
  is_published = COALESCE(is_published, true),
  is_safety_approved = COALESCE(is_safety_approved, true),
  moderation_status = COALESCE(moderation_status, 'approved')
WHERE is_published IS NULL OR is_safety_approved IS NULL;

-- Simple, no complex triggers or policies - just the columns we need
SELECT 'Essential columns added successfully!' as message;

