-- Stories System Migration
-- Instagram/Snapchat-style stories that expire after 24 hours

-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
  thumbnail_url TEXT,
  
  -- Story content
  caption TEXT,
  duration INTEGER DEFAULT 5, -- seconds to display
  
  -- Editor data (JSON for drawings, stickers, text overlays)
  editor_data JSONB DEFAULT '{}'::jsonb,
  
  -- Music/audio
  audio_url TEXT,
  audio_name TEXT,
  
  -- Metadata
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  
  -- Views and interactions
  view_count INTEGER DEFAULT 0,
  
  -- Privacy
  is_public BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- Indexes
  CONSTRAINT valid_duration CHECK (duration > 0 AND duration <= 30)
);

-- Create story views table (track who viewed each story)
CREATE TABLE IF NOT EXISTS story_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate views
  UNIQUE(story_id, viewer_id)
);

-- Create story reactions table (quick reactions like ❤️ 😂 😮)
CREATE TABLE IF NOT EXISTS story_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type VARCHAR(50) NOT NULL, -- 'heart', 'laugh', 'wow', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One reaction per user per story
  UNIQUE(story_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX idx_stories_expires_at ON stories(expires_at);
CREATE INDEX idx_story_views_story_id ON story_views(story_id);
CREATE INDEX idx_story_views_viewer_id ON story_views(viewer_id);
CREATE INDEX idx_story_reactions_story_id ON story_reactions(story_id);

-- RLS Policies
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reactions ENABLE ROW LEVEL SECURITY;

-- Stories policies
CREATE POLICY "Users can view public stories" ON stories
  FOR SELECT USING (is_public = true AND expires_at > NOW());

CREATE POLICY "Users can view their own stories" ON stories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stories" ON stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories" ON stories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" ON stories
  FOR DELETE USING (auth.uid() = user_id);

-- Story views policies
CREATE POLICY "Users can view story views" ON story_views
  FOR SELECT USING (true);

CREATE POLICY "Users can create story views" ON story_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Story reactions policies
CREATE POLICY "Users can view all reactions" ON story_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can create reactions" ON story_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON story_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically delete expired stories
CREATE OR REPLACE FUNCTION delete_expired_stories()
RETURNS void AS $$
BEGIN
  DELETE FROM stories WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired stories (if pg_cron is available)
-- Otherwise, run this function periodically via a cron job or Supabase Edge Function
-- SELECT cron.schedule('delete-expired-stories', '0 * * * *', 'SELECT delete_expired_stories()');

COMMENT ON TABLE stories IS 'User stories that expire after 24 hours';
COMMENT ON TABLE story_views IS 'Tracks who viewed each story';
COMMENT ON TABLE story_reactions IS 'Quick reactions to stories';

