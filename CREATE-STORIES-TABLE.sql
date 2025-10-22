-- =====================================================
-- CREATE STORIES TABLE
-- Instagram/TikTok style 24-hour expiring stories
-- =====================================================

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Content
  content_type VARCHAR(20) NOT NULL, -- 'image', 'video', 'live'
  media_url TEXT,
  thumbnail_url TEXT,
  text_overlay TEXT,
  background_color VARCHAR(7) DEFAULT '#000000',
  
  -- Story duration (seconds)
  duration INTEGER DEFAULT 5,
  
  -- Live stream specific
  is_live BOOLEAN DEFAULT false,
  live_stream_url TEXT,
  live_viewer_count INTEGER DEFAULT 0,
  
  -- Editor data (drawings, stickers, music, etc.)
  editor_data JSONB DEFAULT '{}'::jsonb,
  
  -- Engagement
  views_count INTEGER DEFAULT 0,
  
  -- Expiration (24 hours from creation)
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Story views tracking
CREATE TABLE IF NOT EXISTS story_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate views
  UNIQUE(story_id, viewer_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_created ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_active ON stories(user_id, expires_at) WHERE expires_at > NOW();

CREATE INDEX IF NOT EXISTS idx_story_views_story ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer ON story_views(viewer_id);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stories
DROP POLICY IF EXISTS "stories_view_all" ON stories;
DROP POLICY IF EXISTS "stories_insert_own" ON stories;
DROP POLICY IF EXISTS "stories_update_own" ON stories;
DROP POLICY IF EXISTS "stories_delete_own" ON stories;

-- Anyone can view non-expired stories
CREATE POLICY "stories_view_all" ON stories
FOR SELECT USING (expires_at > NOW());

-- Users can insert their own stories
CREATE POLICY "stories_insert_own" ON stories
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own stories
CREATE POLICY "stories_update_own" ON stories
FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own stories
CREATE POLICY "stories_delete_own" ON stories
FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for story views
DROP POLICY IF EXISTS "story_views_view_own" ON story_views;
DROP POLICY IF EXISTS "story_views_insert" ON story_views;

-- Users can view their own story views
CREATE POLICY "story_views_view_own" ON story_views
FOR SELECT USING (auth.uid() = viewer_id OR story_id IN (SELECT id FROM stories WHERE user_id = auth.uid()));

-- Anyone can record a view
CREATE POLICY "story_views_insert" ON story_views
FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Function to increment story views
CREATE OR REPLACE FUNCTION increment_story_views(story_id_param UUID, viewer_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Insert view record (unique constraint prevents duplicates)
  INSERT INTO story_views (story_id, viewer_id)
  VALUES (story_id_param, viewer_id_param)
  ON CONFLICT (story_id, viewer_id) DO NOTHING;
  
  -- Update views count
  UPDATE stories
  SET views_count = (
    SELECT COUNT(*) FROM story_views WHERE story_id = story_id_param
  )
  WHERE id = story_id_param;
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired stories (run daily via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void AS $$
BEGIN
  DELETE FROM stories WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT '✅ Stories system created!' as status;
SELECT 'Users can now create 24-hour expiring stories!' as message;

