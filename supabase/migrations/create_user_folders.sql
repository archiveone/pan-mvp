-- Create user_folders table for customizable hub folders
CREATE TABLE IF NOT EXISTS user_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(50) NOT NULL DEFAULT 'blue', -- Gradient color name or hex
  icon VARCHAR(50), -- Icon name from lucide-react
  category VARCHAR(50) NOT NULL, -- 'people', 'art', 'listings', 'work', 'custom', etc.
  folder_type VARCHAR(50) NOT NULL DEFAULT 'custom', -- 'saved', 'posts', 'custom', etc.
  position INTEGER NOT NULL DEFAULT 0, -- Display order
  is_public BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}', -- Additional customizable settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create folder_items table to store items in custom folders
CREATE TABLE IF NOT EXISTS folder_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id UUID NOT NULL REFERENCES user_folders(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL, -- 'post', 'user', 'listing', 'file', etc.
  item_id UUID NOT NULL, -- ID of the referenced item
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  notes TEXT,
  UNIQUE(folder_id, item_type, item_id) -- Prevent duplicates
);

-- Create indexes for performance
CREATE INDEX idx_user_folders_user_id ON user_folders(user_id);
CREATE INDEX idx_user_folders_category ON user_folders(category);
CREATE INDEX idx_folder_items_folder_id ON folder_items(folder_id);
CREATE INDEX idx_folder_items_item ON folder_items(item_type, item_id);

-- Enable Row Level Security
ALTER TABLE user_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_folders
CREATE POLICY "Users can view their own folders"
  ON user_folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public folders"
  ON user_folders FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can create their own folders"
  ON user_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON user_folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON user_folders FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for folder_items
CREATE POLICY "Users can view items in their folders"
  ON folder_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_folders
      WHERE user_folders.id = folder_items.folder_id
      AND user_folders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view items in public folders"
  ON folder_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_folders
      WHERE user_folders.id = folder_items.folder_id
      AND user_folders.is_public = true
    )
  );

CREATE POLICY "Users can add items to their folders"
  ON folder_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_folders
      WHERE user_folders.id = folder_items.folder_id
      AND user_folders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their folders"
  ON folder_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_folders
      WHERE user_folders.id = folder_items.folder_id
      AND user_folders.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER user_folders_updated_at
  BEFORE UPDATE ON user_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_user_folders_updated_at();

-- Insert some default folder templates (optional)
COMMENT ON TABLE user_folders IS 'Customizable folders for organizing user content in the hub';
COMMENT ON TABLE folder_items IS 'Items saved to custom folders';

