-- Notification System Migration - Final Version
-- Handles existing tables and missing columns

-- Step 1: Drop existing table if it's incomplete (start fresh)
DROP TABLE IF EXISTS notifications CASCADE;

-- Step 2: Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'follow',
    'like',
    'comment',
    'mention',
    'message',
    'group_invite',
    'follower_post'
  )),
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID,
  comment_id UUID,
  conversation_id UUID,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Step 4: Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Step 6: Create function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_post_id UUID DEFAULT NULL,
  p_comment_id UUID DEFAULT NULL,
  p_conversation_id UUID DEFAULT NULL,
  p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Don't create notification if actor is the same as recipient
  IF p_actor_id = p_user_id THEN
    RETURN NULL;
  END IF;

  INSERT INTO notifications (
    user_id,
    type,
    actor_id,
    post_id,
    comment_id,
    conversation_id,
    message
  ) VALUES (
    p_user_id,
    p_type,
    p_actor_id,
    p_post_id,
    p_comment_id,
    p_conversation_id,
    p_message
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success!
SELECT 'Notification system created successfully!' as message;

