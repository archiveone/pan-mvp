-- Saved Folders System Migration
-- Allows users to organize saved listings into folders

-- Create saved_folders table
CREATE TABLE IF NOT EXISTS saved_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#84cc16', -- lime-500 default
  icon TEXT DEFAULT '📁',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_items table (replaces localStorage approach)
CREATE TABLE IF NOT EXISTS saved_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES saved_folders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can't save the same post twice
  UNIQUE(user_id, post_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_folders_user_id ON saved_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_folders_position ON saved_folders(position);
CREATE INDEX IF NOT EXISTS idx_saved_items_user_id ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_post_id ON saved_items(post_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_folder_id ON saved_items(folder_id);

-- RLS Policies for saved_folders
ALTER TABLE saved_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folders"
  ON saved_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
  ON saved_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON saved_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON saved_folders FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for saved_items
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved items"
  ON saved_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save items"
  ON saved_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved items"
  ON saved_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved items"
  ON saved_items FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating updated_at
CREATE TRIGGER update_saved_folders_updated_at
  BEFORE UPDATE ON saved_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a default "All Saved" folder for existing users (optional)
-- This can be run manually or as part of app initialization

COMMENT ON TABLE saved_folders IS 'User-created folders for organizing saved listings';
COMMENT ON TABLE saved_items IS 'Items saved by users, organized into folders';

