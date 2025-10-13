-- Add group chat support to messaging system
-- Allows multiple users in a conversation with group name, image, etc.

-- First, alter conversations table to support group chats
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS is_group_chat BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS group_name TEXT,
ADD COLUMN IF NOT EXISTS group_image_url TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add index for group chats
CREATE INDEX IF NOT EXISTS idx_conversations_is_group ON conversations(is_group_chat);

-- Add comment
COMMENT ON COLUMN conversations.is_group_chat IS 'Whether this is a group chat (3+ users) or 1-on-1';
COMMENT ON COLUMN conversations.group_name IS 'Name of the group chat';
COMMENT ON COLUMN conversations.group_image_url IS 'Group chat image/avatar';
COMMENT ON COLUMN conversations.created_by IS 'User who created the group';

-- Update the conversation participants to allow unlimited members
-- (Already supports this via many-to-many relationship)

-- Add group admin/permissions table
CREATE TABLE IF NOT EXISTS group_chat_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_add_members BOOLEAN DEFAULT TRUE,
  can_remove_members BOOLEAN DEFAULT TRUE,
  can_edit_group BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- RLS for group admins
ALTER TABLE group_chat_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view group admins of their groups"
  ON group_chat_admins FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group admins can manage other admins"
  ON group_chat_admins FOR ALL
  USING (
    conversation_id IN (
      SELECT conversation_id FROM group_chat_admins
      WHERE user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_group_admins_conversation ON group_chat_admins(conversation_id);
CREATE INDEX IF NOT EXISTS idx_group_admins_user ON group_chat_admins(user_id);

-- Function to create a group chat
CREATE OR REPLACE FUNCTION create_group_chat(
  p_creator_id UUID,
  p_group_name TEXT,
  p_member_ids UUID[],
  p_group_image_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
  v_member_id UUID;
BEGIN
  -- Create the conversation
  INSERT INTO conversations (is_group_chat, group_name, group_image_url, created_by)
  VALUES (TRUE, p_group_name, p_group_image_url, p_creator_id)
  RETURNING id INTO v_conversation_id;
  
  -- Add creator as participant
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (v_conversation_id, p_creator_id);
  
  -- Add creator as admin
  INSERT INTO group_chat_admins (conversation_id, user_id)
  VALUES (v_conversation_id, p_creator_id);
  
  -- Add other members
  FOREACH v_member_id IN ARRAY p_member_ids
  LOOP
    IF v_member_id != p_creator_id THEN
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES (v_conversation_id, v_member_id)
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END IF;
  END LOOP;
  
  RETURN v_conversation_id;
END;
$$;

-- Function to add member to group chat
CREATE OR REPLACE FUNCTION add_group_member(
  p_conversation_id UUID,
  p_user_id UUID,
  p_added_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if added_by is admin
  IF NOT EXISTS (
    SELECT 1 FROM group_chat_admins
    WHERE conversation_id = p_conversation_id
    AND user_id = p_added_by
    AND can_add_members = TRUE
  ) THEN
    RAISE EXCEPTION 'User does not have permission to add members';
  END IF;
  
  -- Add member
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (p_conversation_id, p_user_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- Function to remove member from group chat
CREATE OR REPLACE FUNCTION remove_group_member(
  p_conversation_id UUID,
  p_user_id UUID,
  p_removed_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if removed_by is admin
  IF NOT EXISTS (
    SELECT 1 FROM group_chat_admins
    WHERE conversation_id = p_conversation_id
    AND user_id = p_removed_by
    AND can_remove_members = TRUE
  ) THEN
    RAISE EXCEPTION 'User does not have permission to remove members';
  END IF;
  
  -- Can't remove the creator
  IF p_user_id = (SELECT created_by FROM conversations WHERE id = p_conversation_id) THEN
    RAISE EXCEPTION 'Cannot remove the group creator';
  END IF;
  
  -- Remove member
  DELETE FROM conversation_participants
  WHERE conversation_id = p_conversation_id
  AND user_id = p_user_id;
  
  -- Remove from admins if they were one
  DELETE FROM group_chat_admins
  WHERE conversation_id = p_conversation_id
  AND user_id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- Function to leave group chat
CREATE OR REPLACE FUNCTION leave_group_chat(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Can't leave if you're the creator (must delete group instead)
  IF p_user_id = (SELECT created_by FROM conversations WHERE id = p_conversation_id) THEN
    RAISE EXCEPTION 'Creator cannot leave group. Delete the group instead.';
  END IF;
  
  -- Remove member
  DELETE FROM conversation_participants
  WHERE conversation_id = p_conversation_id
  AND user_id = p_user_id;
  
  -- Remove from admins if they were one
  DELETE FROM group_chat_admins
  WHERE conversation_id = p_conversation_id
  AND user_id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_group_chat TO authenticated;
GRANT EXECUTE ON FUNCTION add_group_member TO authenticated;
GRANT EXECUTE ON FUNCTION remove_group_member TO authenticated;
GRANT EXECUTE ON FUNCTION leave_group_chat TO authenticated;

-- Function to auto-add group chat to participant's default inbox
CREATE OR REPLACE FUNCTION auto_assign_group_to_inbox()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_default_inbox_id UUID;
  v_conversation_is_group BOOLEAN;
BEGIN
  -- Check if this is a group chat
  SELECT is_group_chat INTO v_conversation_is_group
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  -- Only auto-assign if it's a group chat
  IF v_conversation_is_group = TRUE THEN
    -- Find user's default "Messages" inbox (the one without instance_name)
    SELECT id INTO v_default_inbox_id
    FROM hub_boxes
    WHERE user_id = NEW.user_id
    AND box_type = 'inbox'
    AND instance_name IS NULL
    LIMIT 1;
    
    -- If default inbox exists, assign the group chat to it
    IF v_default_inbox_id IS NOT NULL THEN
      INSERT INTO inbox_assignments (hub_box_id, conversation_id, user_id)
      VALUES (v_default_inbox_id, NEW.conversation_id, NEW.user_id)
      ON CONFLICT (hub_box_id, conversation_id) DO NOTHING;
      
      RAISE NOTICE 'Auto-assigned group chat % to user % default inbox', NEW.conversation_id, NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign groups when participant is added
DROP TRIGGER IF EXISTS trigger_auto_assign_group_to_inbox ON conversation_participants;

CREATE TRIGGER trigger_auto_assign_group_to_inbox
  AFTER INSERT ON conversation_participants
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_group_to_inbox();

COMMENT ON FUNCTION auto_assign_group_to_inbox IS 'Automatically assigns group chats to participants default inbox when they are added';

SELECT 'Group chat support added! You can now create and manage group chats.' as status;

