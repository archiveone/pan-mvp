-- =====================================================
-- VERIFIED PROFILES & ENHANCED NOTIFICATIONS SYSTEM
-- =====================================================

-- ============= VERIFIED PROFILES SYSTEM =============

-- Profile verification types and levels
CREATE TABLE IF NOT EXISTS profile_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Verification Status
  verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  verification_level VARCHAR(20) DEFAULT 'none' CHECK (verification_level IN ('none', 'email', 'phone', 'identity', 'business', 'premium')),
  
  -- Verification Type
  verification_type VARCHAR(20) NOT NULL CHECK (verification_type IN ('individual', 'business', 'creator', 'enterprise')),
  
  -- Submitted Documents
  submitted_documents JSONB DEFAULT '[]'::jsonb,
  id_document_url TEXT,
  business_license_url TEXT,
  proof_of_address_url TEXT,
  
  -- Business Information (for business verification)
  business_name VARCHAR(200),
  business_registration_number VARCHAR(100),
  business_type VARCHAR(50),
  business_website TEXT,
  tax_id VARCHAR(100),
  
  -- Personal Information (for identity verification)
  full_name VARCHAR(200),
  date_of_birth DATE,
  government_id_type VARCHAR(50), -- 'passport', 'drivers_license', 'national_id'
  government_id_number VARCHAR(100),
  
  -- Contact Verification
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  phone_number VARCHAR(20),
  
  -- Admin Review
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE, -- Some verifications expire (e.g., yearly renewal)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Verification badges earned by users
CREATE TABLE IF NOT EXISTS verification_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  badge_type VARCHAR(50) NOT NULL CHECK (badge_type IN (
    'verified', 'business_verified', 'top_seller', 'trusted_host', 
    'early_adopter', 'power_user', 'community_leader', 'expert'
  )),
  
  badge_name VARCHAR(100) NOT NULL,
  badge_description TEXT,
  badge_icon VARCHAR(50), -- emoji or icon name
  badge_color VARCHAR(20), -- 'blue', 'gold', 'purple', etc.
  
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, badge_type)
);

-- ============= ENHANCED NOTIFICATIONS SYSTEM =============

-- Notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Channel Preferences
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  in_app_enabled BOOLEAN DEFAULT true,
  
  -- Notification Categories
  messages_enabled BOOLEAN DEFAULT true,
  bookings_enabled BOOLEAN DEFAULT true,
  sales_enabled BOOLEAN DEFAULT true,
  reviews_enabled BOOLEAN DEFAULT true,
  followers_enabled BOOLEAN DEFAULT true,
  price_drops_enabled BOOLEAN DEFAULT true,
  recommendations_enabled BOOLEAN DEFAULT true,
  marketing_enabled BOOLEAN DEFAULT false,
  
  -- Smart Notifications
  smart_digest_enabled BOOLEAN DEFAULT true,
  digest_frequency VARCHAR(20) DEFAULT 'daily' CHECK (digest_frequency IN ('realtime', 'hourly', 'daily', 'weekly')),
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enhanced notifications table
CREATE TABLE IF NOT EXISTS enhanced_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Notification Type & Priority
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
    'message', 'booking', 'sale', 'review', 'follow', 'price_drop', 
    'event_reminder', 'verification_approved', 'payout', 'recommendation',
    'achievement', 'warning', 'system'
  )),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Content
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label VARCHAR(50), -- 'View', 'Reply', 'Accept', etc.
  
  -- Rich Content
  image_url TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  
  -- Related Data
  related_type VARCHAR(50), -- 'listing', 'booking', 'user', 'post', etc.
  related_id UUID,
  related_data JSONB DEFAULT '{}'::jsonb,
  
  -- Grouping (for bundling similar notifications)
  group_key VARCHAR(100), -- e.g., 'price_drops_2024_01_15'
  is_bundled BOOLEAN DEFAULT false,
  bundle_count INTEGER DEFAULT 1,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  channels_sent VARCHAR[] DEFAULT ARRAY[]::VARCHAR[], -- ['push', 'email', 'sms']
  
  -- Smart Features
  expires_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE, -- For scheduled notifications
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price drop alerts
CREATE TABLE IF NOT EXISTS price_drop_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL, -- Could be content, advanced_listings, etc.
  listing_type VARCHAR(50) NOT NULL,
  
  original_price DECIMAL(10, 2) NOT NULL,
  alert_threshold_percentage DECIMAL(5, 2) DEFAULT 10, -- Alert when price drops by X%
  alert_threshold_amount DECIMAL(10, 2), -- Or by specific amount
  
  is_active BOOLEAN DEFAULT true,
  last_checked_price DECIMAL(10, 2),
  last_checked_at TIMESTAMP WITH TIME ZONE,
  
  alert_triggered BOOLEAN DEFAULT false,
  triggered_at TIMESTAMP WITH TIME ZONE,
  new_price DECIMAL(10, 2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, listing_id, listing_type)
);

-- Event reminders
CREATE TABLE IF NOT EXISTS event_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL,
  
  reminder_type VARCHAR(20) DEFAULT 'before' CHECK (reminder_type IN ('before', 'at_start', 'custom')),
  remind_before_minutes INTEGER DEFAULT 60, -- Minutes before event
  custom_reminder_time TIMESTAMP WITH TIME ZONE,
  
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, event_id, reminder_type)
);

-- ============= GAMIFIED ANALYTICS =============

-- User achievements and milestones
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  achievement_type VARCHAR(50) NOT NULL CHECK (achievement_type IN (
    'first_post', 'first_sale', 'first_booking', '10_sales', '50_sales', '100_sales',
    'top_rated', 'fast_responder', 'super_host', 'verified', 'popular_post',
    'trending_creator', 'monthly_streak', 'yearly_member'
  )),
  
  achievement_name VARCHAR(100) NOT NULL,
  achievement_description TEXT,
  achievement_icon VARCHAR(50),
  achievement_color VARCHAR(20),
  
  -- Reward
  points_earned INTEGER DEFAULT 0,
  unlocks_feature VARCHAR(100), -- Feature unlocked by this achievement
  
  -- Progress (for multi-level achievements)
  progress_current INTEGER DEFAULT 0,
  progress_target INTEGER,
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_type)
);

-- User activity points and levels
CREATE TABLE IF NOT EXISTS user_gamification (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Points & Level
  total_points INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  level_name VARCHAR(50) DEFAULT 'Beginner',
  points_to_next_level INTEGER DEFAULT 100,
  
  -- Streaks
  daily_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  
  -- Rankings
  global_rank INTEGER,
  local_rank INTEGER, -- Rank in user's city/region
  category_ranks JSONB DEFAULT '{}'::jsonb, -- Ranks in different categories
  
  -- Stats (for dashboard)
  total_posts INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  total_reviews_received INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  
  -- Engagement metrics
  response_rate DECIMAL(5, 2) DEFAULT 0, -- Percentage of messages responded to
  average_response_time_minutes INTEGER, -- Average time to respond
  completion_rate DECIMAL(5, 2) DEFAULT 0, -- % of bookings/sales completed
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Point transactions log
CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  points_change INTEGER NOT NULL, -- Positive or negative
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  
  related_type VARCHAR(50), -- 'post', 'sale', 'review', etc.
  related_id UUID,
  
  balance_after INTEGER NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= INDEXES =============

-- Verification indexes
CREATE INDEX IF NOT EXISTS idx_profile_verifications_user ON profile_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_verifications_status ON profile_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_verification_badges_user ON verification_badges(user_id);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_enhanced_notifications_user ON enhanced_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_notifications_type ON enhanced_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_notifications_read ON enhanced_notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_enhanced_notifications_scheduled ON enhanced_notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_price_drop_alerts_user ON price_drop_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_drop_alerts_active ON price_drop_alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_event_reminders_user ON event_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_unsent ON event_reminders(is_sent) WHERE is_sent = false;

-- Gamification indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_user ON user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_level ON user_gamification(current_level DESC);
CREATE INDEX IF NOT EXISTS idx_user_gamification_points ON user_gamification(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user ON points_transactions(user_id);

-- ============= FUNCTIONS =============

-- Function to award points
CREATE OR REPLACE FUNCTION award_points(
  p_user_id UUID,
  p_points INTEGER,
  p_reason VARCHAR(100),
  p_description TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_new_balance INTEGER;
  v_new_level INTEGER;
  v_level_name VARCHAR(50);
BEGIN
  -- Initialize gamification record if doesn't exist
  INSERT INTO user_gamification (user_id, total_points)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Update points
  UPDATE user_gamification
  SET 
    total_points = total_points + p_points,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING total_points INTO v_new_balance;
  
  -- Calculate new level (every 500 points = 1 level)
  v_new_level := FLOOR(v_new_balance / 500) + 1;
  
  -- Determine level name
  v_level_name := CASE
    WHEN v_new_level >= 20 THEN 'Legend'
    WHEN v_new_level >= 15 THEN 'Master'
    WHEN v_new_level >= 10 THEN 'Expert'
    WHEN v_new_level >= 7 THEN 'Pro'
    WHEN v_new_level >= 5 THEN 'Advanced'
    WHEN v_new_level >= 3 THEN 'Intermediate'
    ELSE 'Beginner'
  END;
  
  -- Update level
  UPDATE user_gamification
  SET 
    current_level = v_new_level,
    level_name = v_level_name,
    points_to_next_level = (v_new_level * 500) - v_new_balance
  WHERE user_id = p_user_id;
  
  -- Log transaction
  INSERT INTO points_transactions (user_id, points_change, reason, description, balance_after)
  VALUES (p_user_id, p_points, p_reason, p_description, v_new_balance);
END;
$$ LANGUAGE plpgsql;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(200),
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_priority VARCHAR(20) DEFAULT 'normal',
  p_related_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO enhanced_notifications (
    user_id, notification_type, title, message, 
    action_url, priority, related_id
  )
  VALUES (
    p_user_id, p_type, p_title, p_message,
    p_action_url, p_priority, p_related_id
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update activity streak
CREATE OR REPLACE FUNCTION update_activity_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
BEGIN
  -- Get last activity date
  SELECT last_activity_date, daily_streak 
  INTO v_last_activity, v_current_streak
  FROM user_gamification 
  WHERE user_id = p_user_id;
  
  -- Check if streak continues
  IF v_last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Streak continues
    UPDATE user_gamification
    SET 
      daily_streak = daily_streak + 1,
      longest_streak = GREATEST(longest_streak, daily_streak + 1),
      last_activity_date = CURRENT_DATE
    WHERE user_id = p_user_id;
    
    -- Award streak bonus (10 points per day)
    PERFORM award_points(p_user_id, 10, 'daily_streak', 'Daily activity streak bonus');
  ELSIF v_last_activity < CURRENT_DATE THEN
    -- Streak broken, reset
    UPDATE user_gamification
    SET 
      daily_streak = 1,
      last_activity_date = CURRENT_DATE
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============= TRIGGERS =============

-- Auto-award points on first post
CREATE OR REPLACE FUNCTION award_first_post_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is user's first post
  IF (SELECT COUNT(*) FROM posts WHERE user_id = NEW.user_id) = 1 THEN
    PERFORM award_points(NEW.user_id, 50, 'first_post', 'Created your first post!');
    
    -- Create achievement
    INSERT INTO user_achievements (user_id, achievement_type, achievement_name, achievement_description, points_earned)
    VALUES (NEW.user_id, 'first_post', 'First Post', 'Created your first post', 50)
    ON CONFLICT (user_id, achievement_type) DO NOTHING;
  END IF;
  
  -- Update activity streak
  PERFORM update_activity_streak(NEW.user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_award_first_post ON posts;
CREATE TRIGGER trigger_award_first_post
AFTER INSERT ON posts
FOR EACH ROW
EXECUTE FUNCTION award_first_post_points();

-- ============= ROW LEVEL SECURITY =============

ALTER TABLE profile_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_drop_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- Verification policies
DROP POLICY IF EXISTS "Users can view their own verification" ON profile_verifications;
DROP POLICY IF EXISTS "Users can create verification requests" ON profile_verifications;
DROP POLICY IF EXISTS "Users can view verification badges" ON verification_badges;

CREATE POLICY "Users can view their own verification" ON profile_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create verification requests" ON profile_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view verification badges" ON verification_badges FOR SELECT USING (true);

-- Notification policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON enhanced_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON enhanced_notifications;
DROP POLICY IF EXISTS "Users can manage notification preferences" ON notification_preferences;

CREATE POLICY "Users can view their own notifications" ON enhanced_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON enhanced_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can manage notification preferences" ON notification_preferences FOR ALL USING (auth.uid() = user_id);

-- Alert policies
DROP POLICY IF EXISTS "Users can manage their own alerts" ON price_drop_alerts;
DROP POLICY IF EXISTS "Users can manage event reminders" ON event_reminders;

CREATE POLICY "Users can manage their own alerts" ON price_drop_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage event reminders" ON event_reminders FOR ALL USING (auth.uid() = user_id);

-- Gamification policies
DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can view their own gamification" ON user_gamification;
DROP POLICY IF EXISTS "Users can view leaderboards" ON user_gamification;
DROP POLICY IF EXISTS "Users can view their transactions" ON points_transactions;

CREATE POLICY "Users can view their own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own gamification" ON user_gamification FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view leaderboards" ON user_gamification FOR SELECT USING (true);
CREATE POLICY "Users can view their transactions" ON points_transactions FOR SELECT USING (auth.uid() = user_id);

COMMENT ON TABLE profile_verifications IS 'Profile verification requests and status';
COMMENT ON TABLE verification_badges IS 'Badges earned by verified users';
COMMENT ON TABLE enhanced_notifications IS 'Smart notification system with priority and grouping';
COMMENT ON TABLE user_gamification IS 'Gamified user stats, levels, and rankings';
COMMENT ON TABLE user_achievements IS 'User achievements and milestones';

