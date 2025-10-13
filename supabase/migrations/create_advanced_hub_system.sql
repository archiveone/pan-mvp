-- ============================================
-- ADVANCED HUB SYSTEM
-- ============================================
-- Allows users to:
-- - Create multiple instances of any box type
-- - Customize, delete, reorder ANY box
-- - Add filters and views to each box
-- - Full customization control
-- ============================================

-- Create hub_boxes table (replaces user_folders concept)
CREATE TABLE IF NOT EXISTS hub_boxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Box Configuration
  title VARCHAR(100) NOT NULL,
  description TEXT,
  box_type VARCHAR(50) NOT NULL, -- 'posts', 'saved', 'inbox', 'groups', 'portfolio', 'custom'
  instance_name VARCHAR(100), -- For multiple instances: 'Work Posts', 'Personal Posts'
  
  -- Visual Customization
  color VARCHAR(50),
  custom_color VARCHAR(7), -- Hex color
  color_type VARCHAR(20) DEFAULT 'preset',
  image_url TEXT,
  icon VARCHAR(50),
  
  -- Layout
  position INTEGER NOT NULL DEFAULT 0,
  size VARCHAR(20) DEFAULT 'normal', -- 'small', 'normal', 'large', 'wide'
  
  -- Functionality
  is_active BOOLEAN DEFAULT true, -- Can hide boxes
  is_deletable BOOLEAN DEFAULT true, -- Some boxes might be protected
  view_mode VARCHAR(50) DEFAULT 'grid', -- 'grid', 'list', 'compact'
  
  -- Filters (JSON for flexibility)
  filters JSONB DEFAULT '{}', -- e.g., {"date_range": "last_week", "category": "art"}
  settings JSONB DEFAULT '{}', -- Additional settings
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  UNIQUE(user_id, box_type, instance_name) -- Allow multiple instances with different names
);

-- Create hub_box_items table (for custom collections)
CREATE TABLE IF NOT EXISTS hub_box_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  box_id UUID NOT NULL REFERENCES hub_boxes(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL, -- 'post', 'user', 'listing', 'file', etc.
  item_id UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  metadata JSONB DEFAULT '{}', -- Custom metadata per item
  UNIQUE(box_id, item_type, item_id)
);

-- Create indexes for performance
CREATE INDEX idx_hub_boxes_user_id ON hub_boxes(user_id);
CREATE INDEX idx_hub_boxes_type ON hub_boxes(box_type);
CREATE INDEX idx_hub_boxes_position ON hub_boxes(position);
CREATE INDEX idx_hub_boxes_active ON hub_boxes(is_active);
CREATE INDEX idx_hub_box_items_box_id ON hub_box_items(box_id);
CREATE INDEX idx_hub_box_items_item ON hub_box_items(item_type, item_id);

-- Enable RLS
ALTER TABLE hub_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hub_box_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hub_boxes
CREATE POLICY "Users can view their own hub boxes"
  ON hub_boxes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own hub boxes"
  ON hub_boxes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hub boxes"
  ON hub_boxes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deletable boxes"
  ON hub_boxes FOR DELETE
  USING (auth.uid() = user_id AND is_deletable = true);

-- RLS Policies for hub_box_items
CREATE POLICY "Users can view items in their boxes"
  ON hub_box_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM hub_boxes
      WHERE hub_boxes.id = hub_box_items.box_id
      AND hub_boxes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add items to their boxes"
  ON hub_box_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM hub_boxes
      WHERE hub_boxes.id = hub_box_items.box_id
      AND hub_boxes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their boxes"
  ON hub_box_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM hub_boxes
      WHERE hub_boxes.id = hub_box_items.box_id
      AND hub_boxes.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_hub_boxes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER hub_boxes_updated_at
  BEFORE UPDATE ON hub_boxes
  FOR EACH ROW
  EXECUTE FUNCTION update_hub_boxes_updated_at();

-- Function to initialize default hub boxes for new users
CREATE OR REPLACE FUNCTION initialize_default_hub_boxes(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Only initialize if user has no boxes
  IF NOT EXISTS (SELECT 1 FROM hub_boxes WHERE user_id = p_user_id) THEN
    -- Insert default boxes
    INSERT INTO hub_boxes (user_id, title, box_type, icon, color, position, is_deletable) VALUES
      (p_user_id, 'My Posts', 'posts', 'Upload', 'blue', 0, true),
      (p_user_id, 'Inbox', 'inbox', 'Mail', 'indigo', 1, true),
      (p_user_id, 'Saved', 'saved', 'Heart', 'pink', 2, true),
      (p_user_id, 'Groups', 'groups', 'Users', 'purple', 3, true),
      (p_user_id, 'Portfolio', 'portfolio', 'FileText', 'green', 4, true);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE hub_boxes IS 'Advanced customizable hub boxes - supports multiple instances, full customization, and drag-drop';
COMMENT ON TABLE hub_box_items IS 'Items within custom hub boxes';
COMMENT ON COLUMN hub_boxes.instance_name IS 'Allows multiple instances: "Work Posts", "Personal Posts", etc.';
COMMENT ON COLUMN hub_boxes.filters IS 'JSON filters for smart collections: {"category": "art", "date": "this_week"}';

