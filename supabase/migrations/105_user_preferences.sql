-- =====================================================
-- USER PREFERENCES & THEME CUSTOMIZATION
-- Allow users to customize their experience
-- =====================================================

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  
  -- Theme customization
  accent_color VARCHAR(7) DEFAULT '#10B981', -- Neon green/teal default
  primary_gradient_start VARCHAR(7) DEFAULT '#3B82F6',
  primary_gradient_end VARCHAR(7) DEFAULT '#9333EA',
  
  -- Interface preferences
  default_view_mode VARCHAR(20) DEFAULT 'grid', -- grid, list, playlist
  default_zoom_level INT DEFAULT 3 CHECK (default_zoom_level BETWEEN 1 AND 6),
  dark_mode_preference VARCHAR(20) DEFAULT 'system', -- light, dark, system
  
  -- Content preferences
  content_type_filters JSONB DEFAULT '[]'::jsonb,
  default_sort VARCHAR(50) DEFAULT 'recent',
  show_nsfw BOOLEAN DEFAULT false,
  
  -- Privacy preferences
  show_online_status BOOLEAN DEFAULT true,
  allow_messages_from VARCHAR(20) DEFAULT 'everyone', -- everyone, followers, none
  show_activity BOOLEAN DEFAULT true,
  
  -- Notification preferences
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  notification_frequency VARCHAR(20) DEFAULT 'instant', -- instant, hourly, daily
  
  -- Dashboard customization
  dashboard_layout JSONB DEFAULT '[]'::jsonb,
  enabled_widgets JSONB DEFAULT '["overview", "performance", "top_content", "activity"]'::jsonb,
  
  -- Other settings
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(100) DEFAULT 'UTC',
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_preferences_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_preferences_user ON user_preferences(user_id);

-- Dashboard Widgets Table (Modular like Hub)
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Widget details
  widget_type VARCHAR(50) NOT NULL CHECK (widget_type IN (
    'overview_stats', 'performance_chart', 'top_content', 'recent_activity',
    'streaming_stats', 'sales_stats', 'view_stats', 'conversion_funnel',
    'audience_map', 'revenue_breakdown', 'engagement_scores', 'quick_actions'
  )),
  title VARCHAR(200),
  
  -- Customization
  custom_color VARCHAR(7),
  icon VARCHAR(50) DEFAULT 'BarChart3',
  
  -- Layout
  position INT DEFAULT 0,
  grid_settings JSONB DEFAULT '{"x": 0, "y": 0, "w": 1, "h": 1}'::jsonb,
  
  -- Widget-specific settings
  settings JSONB DEFAULT '{}'::jsonb,
  time_range VARCHAR(10) DEFAULT '30d', -- 7d, 30d, 90d, 1y, all
  
  -- State
  is_visible BOOLEAN DEFAULT true,
  is_expanded BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_widget_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_widgets_user ON dashboard_widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_widgets_type ON dashboard_widgets(widget_type);
CREATE INDEX IF NOT EXISTS idx_widgets_position ON dashboard_widgets(position);

-- Function to initialize default preferences
CREATE OR REPLACE FUNCTION initialize_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id, accent_color)
  VALUES (NEW.id, '#10B981')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create preferences on profile creation
DROP TRIGGER IF EXISTS trigger_init_preferences ON profiles;
CREATE TRIGGER trigger_init_preferences
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION initialize_user_preferences();

-- Function to initialize default dashboard widgets
CREATE OR REPLACE FUNCTION initialize_dashboard_widgets(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Only initialize if user has no widgets yet
  IF NOT EXISTS (SELECT 1 FROM dashboard_widgets WHERE user_id = p_user_id) THEN
    -- Overview Stats (Top row, full width)
    INSERT INTO dashboard_widgets (user_id, widget_type, title, position, grid_settings)
    VALUES (p_user_id, 'overview_stats', 'Overview', 0, '{"x": 0, "y": 0, "w": 2, "h": 1}'::jsonb);
    
    -- Performance Chart
    INSERT INTO dashboard_widgets (user_id, widget_type, title, position, grid_settings)
    VALUES (p_user_id, 'performance_chart', 'Performance', 1, '{"x": 0, "y": 1, "w": 2, "h": 1}'::jsonb);
    
    -- Top Content
    INSERT INTO dashboard_widgets (user_id, widget_type, title, position, grid_settings)
    VALUES (p_user_id, 'top_content', 'Top Content', 2, '{"x": 0, "y": 2, "w": 1, "h": 1}'::jsonb);
    
    -- Recent Activity
    INSERT INTO dashboard_widgets (user_id, widget_type, title, position, grid_settings)
    VALUES (p_user_id, 'recent_activity', 'Recent Activity', 3, '{"x": 1, "y": 2, "w": 1, "h": 1}'::jsonb);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- User preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
CREATE POLICY "Users can view their own preferences"
ON user_preferences FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
CREATE POLICY "Users can update their own preferences"
ON user_preferences FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
CREATE POLICY "Users can insert their own preferences"
ON user_preferences FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Dashboard widgets
DROP POLICY IF EXISTS "Users can manage their own widgets" ON dashboard_widgets;
CREATE POLICY "Users can manage their own widgets"
ON dashboard_widgets FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON user_preferences TO authenticated;
GRANT ALL ON dashboard_widgets TO authenticated;

-- Comments
COMMENT ON TABLE user_preferences IS 'User-customizable theme and interface preferences';
COMMENT ON TABLE dashboard_widgets IS 'Modular dashboard widgets like Hub boxes';
COMMENT ON COLUMN user_preferences.accent_color IS 'Main accent color (neon green/teal default) - user customizable';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '🎨 User Preferences System Created!';
  RAISE NOTICE '✅ Customizable accent colors';
  RAISE NOTICE '✅ Theme preferences';
  RAISE NOTICE '✅ Modular dashboard widgets';
  RAISE NOTICE '✅ All user-controllable!';
END $$;

