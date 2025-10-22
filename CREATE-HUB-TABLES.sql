-- =====================================================
-- HUB SYSTEM - Collections and Hub Boxes
-- =====================================================

-- Hub Boxes (user's custom dashboard widgets)
CREATE TABLE IF NOT EXISTS hub_boxes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  box_type VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#3B82F6',
  icon VARCHAR(50),
  position INTEGER DEFAULT 0,
  width INTEGER DEFAULT 1,
  height INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hub_boxes_user ON hub_boxes(user_id);
CREATE INDEX IF NOT EXISTS idx_hub_boxes_position ON hub_boxes(user_id, position);

-- Collections/Folders
CREATE TABLE IF NOT EXISTS collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  icon VARCHAR(50),
  is_public BOOLEAN DEFAULT false,
  item_count INTEGER DEFAULT 0,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);

-- Collection items (saved posts/content)
CREATE TABLE IF NOT EXISTS collection_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_item ON collection_items(item_id);

-- Saved posts (quick save without collection)
CREATE TABLE IF NOT EXISTS saved_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_posts_user ON saved_posts(user_id);

-- Enable RLS
ALTER TABLE hub_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY "users_view_public_or_own_boxes" ON hub_boxes
FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "users_manage_own_boxes" ON hub_boxes
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_view_public_or_own_collections" ON collections
FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "users_manage_own_collections" ON collections
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_view_items_in_accessible_collections" ON collection_items
FOR SELECT USING (
  collection_id IN (SELECT id FROM collections WHERE is_public = true OR user_id = auth.uid())
);

CREATE POLICY "users_manage_items_in_own_collections" ON collection_items
FOR ALL USING (
  collection_id IN (SELECT id FROM collections WHERE user_id = auth.uid())
);

CREATE POLICY "users_view_own_saved" ON saved_posts
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_manage_own_saved" ON saved_posts
FOR ALL USING (auth.uid() = user_id);

-- Create default hub boxes for better UX
CREATE OR REPLACE FUNCTION create_default_hub_boxes(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO hub_boxes (user_id, title, description, box_type, color, icon, position, width, height)
  VALUES 
    (p_user_id, 'My Posts', 'Your recent posts and content', 'posts', '#3B82F6', '📝', 0, 2, 2),
    (p_user_id, 'My Collections', 'Saved items organized by topic', 'collections', '#8B5CF6', '📁', 1, 1, 1),
    (p_user_id, 'Analytics', 'Views, likes, and engagement stats', 'analytics', '#10B981', '📊', 2, 1, 1),
    (p_user_id, 'Quick Actions', 'Create, upload, and manage', 'actions', '#F59E0B', '⚡', 3, 1, 1)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create default collection
CREATE OR REPLACE FUNCTION create_default_collection(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO collections (user_id, name, description, color, icon)
  VALUES 
    (p_user_id, 'Favorites', 'My favorite posts and content', '#EF4444', '❤️')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Success
SELECT 'Hub tables created! Run create_default_hub_boxes(your_user_id) to add starter boxes.' as message;

