-- Fix points transactions and ensure full media support
-- Run this in your Supabase SQL Editor

-- ============= FIX POINTS TRANSACTIONS =============

-- Ensure points_transactions table exists with proper constraints
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  points_change INTEGER NOT NULL,
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  
  related_type VARCHAR(50),
  related_id UUID,
  
  balance_after INTEGER NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at);

-- ============= ENSURE POSTS TABLE HAS ALL MEDIA SUPPORT =============

-- Add all media URL columns to posts table
ALTER TABLE posts 
  ADD COLUMN IF NOT EXISTS media_urls TEXT[],
  ADD COLUMN IF NOT EXISTS audio_urls TEXT[],
  ADD COLUMN IF NOT EXISTS video_urls TEXT[],
  ADD COLUMN IF NOT EXISTS document_urls TEXT[],
  ADD COLUMN IF NOT EXISTS audio_url TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS document_url TEXT,
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS duration INTEGER,
  ADD COLUMN IF NOT EXISTS resolution VARCHAR(20),
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Add marketplace and e-commerce support
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_negotiable BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS condition VARCHAR(20),
  ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS return_policy TEXT,
  ADD COLUMN IF NOT EXISTS warranty_info TEXT;

-- Add content type and media type support
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) DEFAULT 'post',
  ADD COLUMN IF NOT EXISTS media_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS is_downloadable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_streamable BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS premium_price DECIMAL(10,2);

-- Add engagement metrics
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS play_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS save_count INTEGER DEFAULT 0;

-- ============= CREATE INDEXES FOR PERFORMANCE =============

-- Media type indexes
CREATE INDEX IF NOT EXISTS idx_posts_media_type ON posts(media_type);
CREATE INDEX IF NOT EXISTS idx_posts_content_type ON posts(content_type);
CREATE INDEX IF NOT EXISTS idx_posts_file_type ON posts(file_type);

-- Marketplace indexes
CREATE INDEX IF NOT EXISTS idx_posts_price ON posts(price);
CREATE INDEX IF NOT EXISTS idx_posts_currency ON posts(currency);
CREATE INDEX IF NOT EXISTS idx_posts_is_sold ON posts(is_sold);
CREATE INDEX IF NOT EXISTS idx_posts_is_premium ON posts(is_premium);

-- Engagement indexes
CREATE INDEX IF NOT EXISTS idx_posts_view_count ON posts(view_count);
CREATE INDEX IF NOT EXISTS idx_posts_like_count ON posts(like_count);
CREATE INDEX IF NOT EXISTS idx_posts_play_count ON posts(play_count);

-- ============= CREATE HELPER FUNCTIONS =============

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(content_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET view_count = view_count + 1
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment play count
CREATE OR REPLACE FUNCTION increment_play_count(content_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET play_count = play_count + 1
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_download_count(content_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET download_count = download_count + 1
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark item as sold
CREATE OR REPLACE FUNCTION mark_item_sold(content_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET is_sold = true
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql;

-- ============= ADD COMMENTS FOR DOCUMENTATION =============

COMMENT ON COLUMN posts.media_urls IS 'Array of general media file URLs';
COMMENT ON COLUMN posts.audio_urls IS 'Array of audio file URLs (songs, podcasts, albums)';
COMMENT ON COLUMN posts.video_urls IS 'Array of video file URLs';
COMMENT ON COLUMN posts.document_urls IS 'Array of document file URLs (PDFs, docs, etc)';
COMMENT ON COLUMN posts.audio_url IS 'Single audio file URL';
COMMENT ON COLUMN posts.video_url IS 'Single video file URL';
COMMENT ON COLUMN posts.document_url IS 'Single document file URL';
COMMENT ON COLUMN posts.file_url IS 'General file URL';
COMMENT ON COLUMN posts.file_type IS 'Type of file (mp3, mp4, pdf, etc)';
COMMENT ON COLUMN posts.file_size IS 'File size in bytes';
COMMENT ON COLUMN posts.duration IS 'Duration in seconds (for audio/video)';
COMMENT ON COLUMN posts.resolution IS 'Video resolution (1080p, 4K, etc)';
COMMENT ON COLUMN posts.thumbnail_url IS 'Thumbnail image URL';
COMMENT ON COLUMN posts.cover_image_url IS 'Cover image URL (for music)';

COMMENT ON COLUMN posts.price IS 'Price for marketplace items';
COMMENT ON COLUMN posts.currency IS 'Currency code (USD, EUR, etc)';
COMMENT ON COLUMN posts.is_sold IS 'Whether marketplace item is sold';
COMMENT ON COLUMN posts.is_negotiable IS 'Whether price is negotiable';
COMMENT ON COLUMN posts.condition IS 'Item condition (new, used, etc)';
COMMENT ON COLUMN posts.shipping_cost IS 'Shipping cost';
COMMENT ON COLUMN posts.shipping_method IS 'Shipping method';
COMMENT ON COLUMN posts.return_policy IS 'Return policy text';
COMMENT ON COLUMN posts.warranty_info IS 'Warranty information';

COMMENT ON COLUMN posts.content_type IS 'Type of content (post, listing, event, music, video, document)';
COMMENT ON COLUMN posts.media_type IS 'Media type (image, video, audio, document)';
COMMENT ON COLUMN posts.is_downloadable IS 'Whether file can be downloaded';
COMMENT ON COLUMN posts.is_streamable IS 'Whether content can be streamed';
COMMENT ON COLUMN posts.is_premium IS 'Whether content requires payment';
COMMENT ON COLUMN posts.premium_price IS 'Price for premium content';

COMMENT ON COLUMN posts.view_count IS 'Number of views';
COMMENT ON COLUMN posts.like_count IS 'Number of likes';
COMMENT ON COLUMN posts.comment_count IS 'Number of comments';
COMMENT ON COLUMN posts.share_count IS 'Number of shares';
COMMENT ON COLUMN posts.download_count IS 'Number of downloads';
COMMENT ON COLUMN posts.play_count IS 'Number of plays';
COMMENT ON COLUMN posts.save_count IS 'Number of saves';

-- ============= UPDATE EXISTING DATA =============

-- Set default values for existing posts
UPDATE posts
SET 
  content_type = COALESCE(content_type, 'post'),
  media_type = COALESCE(media_type, 'image'),
  is_downloadable = COALESCE(is_downloadable, false),
  is_streamable = COALESCE(is_streamable, true),
  is_premium = COALESCE(is_premium, false),
  view_count = COALESCE(view_count, 0),
  like_count = COALESCE(like_count, 0),
  comment_count = COALESCE(comment_count, 0),
  share_count = COALESCE(share_count, 0),
  download_count = COALESCE(download_count, 0),
  play_count = COALESCE(play_count, 0),
  save_count = COALESCE(save_count, 0)
WHERE content_type IS NULL OR media_type IS NULL;

-- ============= SUCCESS MESSAGE =============

SELECT 'Database updated successfully! Posts table now supports all media types and marketplace features.' as message;
