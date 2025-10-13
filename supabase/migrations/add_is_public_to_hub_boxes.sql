-- Add is_public field to hub_boxes table
-- Allows users to show/hide folders on their public profile

ALTER TABLE hub_boxes
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Add index for faster queries filtering by public boxes
CREATE INDEX IF NOT EXISTS idx_hub_boxes_public ON hub_boxes(user_id, is_public);

-- Update existing boxes based on box_type
UPDATE hub_boxes
SET is_public = true
WHERE box_type = 'posts' AND is_public IS NULL;

UPDATE hub_boxes
SET is_public = false
WHERE box_type IN ('inbox', 'saved', 'groups', 'portfolio', 'custom') AND is_public IS NULL;

COMMENT ON COLUMN hub_boxes.is_public IS 'If true, box appears on user public profile. If false, only visible to user.';

