-- Add ability to assign conversations to specific inbox boxes
-- This allows filtering: "Work Messages" shows work contacts, "Friends" shows friend contacts

-- Create table to map conversations to inbox boxes
CREATE TABLE IF NOT EXISTS inbox_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_box_id UUID NOT NULL REFERENCES hub_boxes(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hub_box_id, conversation_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inbox_assignments_hub_box ON inbox_assignments(hub_box_id);
CREATE INDEX IF NOT EXISTS idx_inbox_assignments_conversation ON inbox_assignments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_inbox_assignments_user ON inbox_assignments(user_id);

-- RLS Policies
ALTER TABLE inbox_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own inbox assignments" ON inbox_assignments;

CREATE POLICY "Users manage own inbox assignments" ON inbox_assignments
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE inbox_assignments IS 'Maps conversations to specific inbox boxes for organization';

SELECT 'Inbox assignments table created! You can now organize conversations into different inboxes.' as status;

