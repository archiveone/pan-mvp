-- Add profile box customization fields to profiles table
-- Allows users to customize their profile box background (like hub boxes)

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_box_color VARCHAR(7) DEFAULT '#3B82F6';

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_box_image TEXT;

COMMENT ON COLUMN profiles.profile_box_color IS 'Hex color for profile box background';
COMMENT ON COLUMN profiles.profile_box_image IS 'Background image URL for profile box (like hub boxes)';

