-- Fix stories table view_count column issue
-- Add view_count column if it doesn't exist (some code might be looking for this)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Sync view_count with views_count if views_count exists
UPDATE stories SET view_count = views_count WHERE views_count IS NOT NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all stories" ON stories
FOR SELECT USING (true);

CREATE POLICY "Users can create their own stories" ON stories
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories" ON stories
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" ON stories
FOR DELETE USING (auth.uid() = user_id);
