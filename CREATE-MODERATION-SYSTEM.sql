-- =====================================================
-- COMPLETE MODERATION SYSTEM
-- Report posts, track violations, manage user trust
-- =====================================================

-- =====================================================
-- 1. MODERATION REPORTS
-- =====================================================
CREATE TABLE IF NOT EXISTS moderation_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Who reported
  reported_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- What was reported
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Report details
  report_type VARCHAR(50) NOT NULL,
    -- 'spam', 'harassment', 'hate_speech', 'violence', 'sexual_content', 
    -- 'misinformation', 'copyright', 'other'
  
  description TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',
    -- 'pending', 'reviewing', 'resolved', 'dismissed'
  
  -- Resolution
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  action_taken VARCHAR(50),
    -- 'none', 'warning', 'content_removed', 'user_suspended', 'user_banned'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_reports_status ON moderation_reports(status);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_reported_by ON moderation_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_post ON moderation_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_user ON moderation_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_created ON moderation_reports(created_at DESC);

-- =====================================================
-- 2. USER TRUST SCORES & VIOLATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS user_trust_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Trust score (0-100, starts at 100)
  trust_score INTEGER DEFAULT 100 CHECK (trust_score >= 0 AND trust_score <= 100),
  
  -- Violation counts
  total_violations INTEGER DEFAULT 0,
  spam_violations INTEGER DEFAULT 0,
  harassment_violations INTEGER DEFAULT 0,
  content_violations INTEGER DEFAULT 0,
  
  -- Positive actions
  helpful_reports INTEGER DEFAULT 0,
  verified_contributor BOOLEAN DEFAULT false,
  
  -- Last update
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_trust_scores_user ON user_trust_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trust_scores_score ON user_trust_scores(trust_score);

-- =====================================================
-- 3. USER ACTIONS (Warnings, Suspensions, Bans)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Action type
  action_type VARCHAR(50) NOT NULL,
    -- 'warning', 'suspension', 'ban', 'content_removal'
  
  -- Reason
  reason TEXT NOT NULL,
  violation_type VARCHAR(50),
  related_report_id UUID REFERENCES moderation_reports(id) ON DELETE SET NULL,
  
  -- Action details
  duration_days INTEGER, -- For suspensions
  is_active BOOLEAN DEFAULT true,
  
  -- Who took action
  actioned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  lifted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_user_actions_user ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_type ON user_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_user_actions_active ON user_actions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_actions_expires ON user_actions(expires_at);

-- =====================================================
-- 4. AUTO-MODERATION QUEUE
-- =====================================================

-- Drop view if it exists, create as table
DROP VIEW IF EXISTS moderation_queue CASCADE;

CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  
  -- AI/Auto-moderation flags
  flags TEXT[],
  confidence_score DECIMAL(5, 2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  
  -- Review
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_decision VARCHAR(20),
    -- 'approve', 'reject', 'age_restrict', 'needs_human_review'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created ON moderation_queue(created_at DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Create report
CREATE OR REPLACE FUNCTION create_report(
  p_reported_by UUID,
  p_post_id UUID,
  p_report_type VARCHAR,
  p_description TEXT
)
RETURNS UUID AS $$
DECLARE
  v_report_id UUID;
  v_post_owner UUID;
BEGIN
  -- Get post owner
  SELECT user_id INTO v_post_owner FROM posts WHERE id = p_post_id;
  
  -- Create report
  INSERT INTO moderation_reports (
    reported_by,
    post_id,
    reported_user_id,
    report_type,
    description,
    status
  ) VALUES (
    p_reported_by,
    p_post_id,
    v_post_owner,
    p_report_type,
    p_description,
    'pending'
  ) RETURNING id INTO v_report_id;
  
  RETURN v_report_id;
END;
$$ LANGUAGE plpgsql;

-- Initialize user trust score
CREATE OR REPLACE FUNCTION initialize_user_trust_score(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_trust_scores (user_id, trust_score)
  VALUES (p_user_id, 100)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Decrease trust score on violation
CREATE OR REPLACE FUNCTION decrease_trust_score(
  p_user_id UUID,
  p_violation_type VARCHAR,
  p_decrease_amount INTEGER DEFAULT 10
)
RETURNS INTEGER AS $$
DECLARE
  v_new_score INTEGER;
BEGIN
  -- Update trust score
  UPDATE user_trust_scores
  SET 
    trust_score = GREATEST(0, trust_score - p_decrease_amount),
    total_violations = total_violations + 1,
    spam_violations = CASE WHEN p_violation_type = 'spam' THEN spam_violations + 1 ELSE spam_violations END,
    harassment_violations = CASE WHEN p_violation_type = 'harassment' THEN harassment_violations + 1 ELSE harassment_violations END,
    content_violations = CASE WHEN p_violation_type IN ('hate_speech', 'violence', 'sexual_content') THEN content_violations + 1 ELSE content_violations END,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING trust_score INTO v_new_score;
  
  -- Auto-suspend if trust score too low
  IF v_new_score <= 20 THEN
    INSERT INTO user_actions (user_id, action_type, reason, duration_days, is_active, expires_at)
    VALUES (p_user_id, 'suspension', 'Low trust score', 7, true, NOW() + INTERVAL '7 days');
  END IF;
  
  RETURN v_new_score;
END;
$$ LANGUAGE plpgsql;

-- Check if user is suspended or banned
CREATE OR REPLACE FUNCTION is_user_suspended(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_active_action BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_actions
    WHERE user_id = p_user_id
      AND is_active = true
      AND action_type IN ('suspension', 'ban')
      AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO v_has_active_action;
  
  RETURN v_has_active_action;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Moderation Reports
ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_create_authenticated" ON moderation_reports;
DROP POLICY IF EXISTS "reports_view_own_or_admin" ON moderation_reports;

CREATE POLICY "reports_create_authenticated" ON moderation_reports
FOR INSERT WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "reports_view_own_or_admin" ON moderation_reports
FOR SELECT USING (
  auth.uid() = reported_by OR 
  auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
);

-- User Trust Scores
ALTER TABLE user_trust_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trust_scores_view_own" ON user_trust_scores;

CREATE POLICY "trust_scores_view_own" ON user_trust_scores
FOR SELECT USING (auth.uid() = user_id);

-- User Actions
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_actions_view_own" ON user_actions;

CREATE POLICY "user_actions_view_own" ON user_actions
FOR SELECT USING (auth.uid() = user_id);

-- Moderation Queue (admin only)
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "moderation_queue_admin_only" ON moderation_queue;

CREATE POLICY "moderation_queue_admin_only" ON moderation_queue
FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
);

-- =====================================================
-- ADD MODERATION FIELDS TO POSTS
-- =====================================================
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS safety_checked BOOLEAN DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_safety_approved BOOLEAN DEFAULT true;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS moderation_notes TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_posts_flagged ON posts(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_posts_moderation_status ON posts(moderation_status);

-- Add admin flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_moderator BOOLEAN DEFAULT false;

-- =====================================================
-- TRIGGER: Auto-create trust score for new users
-- =====================================================
CREATE OR REPLACE FUNCTION auto_create_trust_score()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_trust_scores (user_id, trust_score)
  VALUES (NEW.id, 100)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_trust_score ON profiles;

CREATE TRIGGER trigger_auto_create_trust_score
AFTER INSERT ON profiles
FOR EACH ROW EXECUTE FUNCTION auto_create_trust_score();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT '✅ Complete moderation system created!' as status;
SELECT 'Features: Reports, Trust Scores, Suspensions, Auto-moderation Queue' as features;
SELECT 'Users can report content, admins can review and take action' as usage;

