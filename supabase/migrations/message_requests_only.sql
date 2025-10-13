-- Message Request System
-- Run this migration to add message request functionality

-- Step 1: Add request_status column to conversations
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'request_status'
    ) THEN
        ALTER TABLE conversations 
        ADD COLUMN request_status TEXT DEFAULT 'accepted' 
        CHECK (request_status IN ('pending', 'accepted', 'declined'));
    END IF;
END $$;

-- Step 2: Add index for filtering requests
CREATE INDEX IF NOT EXISTS idx_conversations_request_status ON conversations(request_status);

-- Step 3: Function to check if users follow each other
CREATE OR REPLACE FUNCTION users_follow_each_other(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  follows BOOLEAN;
BEGIN
  -- Check if either user follows the other
  SELECT EXISTS (
    SELECT 1 FROM followers 
    WHERE (follower_id = user1_id AND following_id = user2_id)
       OR (follower_id = user2_id AND following_id = user1_id)
  ) INTO follows;
  
  RETURN follows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Function to determine conversation request status
CREATE OR REPLACE FUNCTION determine_conversation_status(
  creator_id UUID,
  participant_ids UUID[]
)
RETURNS TEXT AS $$
DECLARE
  other_user_id UUID;
  do_follow BOOLEAN;
BEGIN
  -- For group chats, always accepted
  IF array_length(participant_ids, 1) > 2 THEN
    RETURN 'accepted';
  END IF;
  
  -- Get the other participant (not the creator)
  SELECT id INTO other_user_id
  FROM unnest(participant_ids) AS id
  WHERE id != creator_id
  LIMIT 1;
  
  -- Check if they follow each other
  SELECT users_follow_each_other(creator_id, other_user_id) INTO do_follow;
  
  -- If they follow each other, conversation is auto-accepted
  IF do_follow THEN
    RETURN 'accepted';
  ELSE
    -- Otherwise, it's a pending request
    RETURN 'pending';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Update existing conversations (grandfathered as accepted)
UPDATE conversations
SET request_status = 'accepted'
WHERE request_status IS NULL;

-- Step 6: Create or replace view for message requests
DROP VIEW IF EXISTS message_requests;
CREATE VIEW message_requests AS
SELECT 
  c.*,
  (
    SELECT json_agg(
      json_build_object(
        'user_id', cp.user_id,
        'joined_at', cp.joined_at,
        'profile', (
          SELECT json_build_object(
            'id', p.id,
            'name', p.name,
            'username', p.username,
            'avatar_url', p.avatar_url
          )
          FROM profiles p
          WHERE p.id = cp.user_id
        )
      )
    )
    FROM conversation_participants cp
    WHERE cp.conversation_id = c.id
  ) as participants
FROM conversations c
WHERE c.request_status = 'pending'
  AND (c.is_group_chat = false OR c.is_group_chat IS NULL);

-- Step 7: Grant permissions
GRANT SELECT ON message_requests TO authenticated;

