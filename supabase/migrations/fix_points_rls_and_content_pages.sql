-- Fix RLS policies and ensure proper content type handling
-- Run this in your Supabase SQL Editor

-- ============= FIX POINTS TRANSACTIONS RLS =============

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Users can view their own points transactions" ON points_transactions;
DROP POLICY IF EXISTS "Users can insert their own points transactions" ON points_transactions;
DROP POLICY IF EXISTS "Users can update their own points transactions" ON points_transactions;

-- Enable RLS on points_transactions table
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for points_transactions
CREATE POLICY "Users can view their own points transactions" ON points_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points transactions" ON points_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own points transactions" ON points_transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- ============= ENSURE USER_GAMIFICATION RLS =============

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Users can view their own gamification data" ON user_gamification;
DROP POLICY IF EXISTS "Users can insert their own gamification data" ON user_gamification;
DROP POLICY IF EXISTS "Users can update their own gamification data" ON user_gamification;

-- Enable RLS on user_gamification table
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_gamification
CREATE POLICY "Users can view their own gamification data" ON user_gamification
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gamification data" ON user_gamification
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gamification data" ON user_gamification
  FOR UPDATE USING (auth.uid() = user_id);

-- ============= ENSURE POSTS TABLE RLS =============

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Users can view published posts" ON posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

-- Enable RLS on posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for posts
CREATE POLICY "Users can view published posts" ON posts
  FOR SELECT USING (is_published = true AND is_safety_approved = true);

CREATE POLICY "Users can insert their own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- ============= CREATE CONTENT TYPE FUNCTIONS =============

-- Function to get content type from post
CREATE OR REPLACE FUNCTION get_content_type(post_id UUID)
RETURNS TEXT AS $$
DECLARE
  content_type_value TEXT;
BEGIN
  SELECT COALESCE(content_type, 'post') INTO content_type_value
  FROM posts
  WHERE id = post_id;
  
  RETURN content_type_value;
END;
$$ LANGUAGE plpgsql;

-- Function to get media type from post
CREATE OR REPLACE FUNCTION get_media_type(post_id UUID)
RETURNS TEXT AS $$
DECLARE
  media_type_value TEXT;
BEGIN
  SELECT COALESCE(media_type, 'image') INTO media_type_value
  FROM posts
  WHERE id = post_id;
  
  RETURN media_type_value;
END;
$$ LANGUAGE plpgsql;

-- Function to check if post has audio
CREATE OR REPLACE FUNCTION has_audio(post_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM posts 
    WHERE id = post_id 
    AND (audio_url IS NOT NULL OR audio_urls IS NOT NULL)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if post has video
CREATE OR REPLACE FUNCTION has_video(post_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM posts 
    WHERE id = post_id 
    AND (video_url IS NOT NULL OR video_urls IS NOT NULL)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if post has document
CREATE OR REPLACE FUNCTION has_document(post_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM posts 
    WHERE id = post_id 
    AND (document_url IS NOT NULL OR document_urls IS NOT NULL)
  );
END;
$$ LANGUAGE plpgsql;

-- ============= CREATE CONTENT TYPE VIEWS =============

-- View for audio content (SoundCloud-like)
CREATE OR REPLACE VIEW audio_posts AS
SELECT 
  p.*,
  p.audio_url as primary_audio_url,
  p.duration,
  p.cover_image_url,
  p.play_count,
  p.save_count,
  pr.username,
  pr.avatar_url
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE p.content_type = 'music' 
   OR p.media_type = 'audio'
   OR p.audio_url IS NOT NULL
   OR p.audio_urls IS NOT NULL;

-- View for video content (YouTube-like)
CREATE OR REPLACE VIEW video_posts AS
SELECT 
  p.*,
  p.video_url as primary_video_url,
  p.duration,
  p.resolution,
  p.thumbnail_url,
  p.view_count,
  pr.username,
  pr.avatar_url
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE p.content_type = 'video' 
   OR p.media_type = 'video'
   OR p.video_url IS NOT NULL
   OR p.video_urls IS NOT NULL;

-- View for document content (Google Drive-like)
CREATE OR REPLACE VIEW document_posts AS
SELECT 
  p.*,
  p.document_url as primary_document_url,
  p.file_type,
  p.file_size,
  p.download_count,
  pr.username,
  pr.avatar_url
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE p.content_type = 'document' 
   OR p.media_type = 'document'
   OR p.document_url IS NOT NULL
   OR p.document_urls IS NOT NULL;

-- View for marketplace listings (eBay-like)
CREATE OR REPLACE VIEW marketplace_posts AS
SELECT 
  p.*,
  p.price,
  p.currency,
  p.is_sold,
  p.condition,
  p.shipping_cost,
  p.return_policy,
  pr.username,
  pr.avatar_url
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE p.content_type = 'listing' 
   OR p.price IS NOT NULL;

-- ============= CREATE HELPER FUNCTIONS FOR CONTENT PAGES =============

-- Function to get content page data
CREATE OR REPLACE FUNCTION get_content_page_data(content_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', p.id,
    'title', p.title,
    'content', p.content,
    'content_type', COALESCE(p.content_type, 'post'),
    'media_type', COALESCE(p.media_type, 'image'),
    'media_url', p.media_url,
    'audio_url', p.audio_url,
    'video_url', p.video_url,
    'document_url', p.document_url,
    'duration', p.duration,
    'resolution', p.resolution,
    'file_type', p.file_type,
    'file_size', p.file_size,
    'thumbnail_url', p.thumbnail_url,
    'cover_image_url', p.cover_image_url,
    'price', p.price,
    'currency', p.currency,
    'is_sold', p.is_sold,
    'is_premium', p.is_premium,
    'premium_price', p.premium_price,
    'view_count', p.view_count,
    'play_count', p.play_count,
    'download_count', p.download_count,
    'like_count', p.like_count,
    'comment_count', p.comment_count,
    'user', json_build_object(
      'id', pr.id,
      'username', pr.username,
      'avatar_url', pr.avatar_url,
      'full_name', pr.full_name
    ),
    'created_at', p.created_at,
    'updated_at', p.updated_at
  ) INTO result
  FROM posts p
  LEFT JOIN profiles pr ON p.user_id = pr.id
  WHERE p.id = content_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============= CREATE INDEXES FOR PERFORMANCE =============

-- Content type indexes
CREATE INDEX IF NOT EXISTS idx_posts_content_type_media ON posts(content_type, media_type);
CREATE INDEX IF NOT EXISTS idx_posts_audio_url ON posts(audio_url) WHERE audio_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_video_url ON posts(video_url) WHERE video_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_document_url ON posts(document_url) WHERE document_url IS NOT NULL;

-- Engagement indexes
CREATE INDEX IF NOT EXISTS idx_posts_play_count ON posts(play_count) WHERE play_count > 0;
CREATE INDEX IF NOT EXISTS idx_posts_view_count ON posts(view_count) WHERE view_count > 0;
CREATE INDEX IF NOT EXISTS idx_posts_download_count ON posts(download_count) WHERE download_count > 0;

-- ============= SUCCESS MESSAGE =============

SELECT 'RLS policies fixed and content type system ready!' as message;
