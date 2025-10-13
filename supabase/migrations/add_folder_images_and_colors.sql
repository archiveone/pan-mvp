-- Add image_url and custom_color fields to user_folders
ALTER TABLE user_folders 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS custom_color VARCHAR(7), -- Hex color like #FF5733
ADD COLUMN IF NOT EXISTS color_type VARCHAR(20) DEFAULT 'preset'; -- 'preset' or 'custom'

-- Update existing folders to use preset color type
UPDATE user_folders SET color_type = 'preset' WHERE color_type IS NULL;

COMMENT ON COLUMN user_folders.image_url IS 'Custom cover image for the folder';
COMMENT ON COLUMN user_folders.custom_color IS 'Custom hex color (e.g., #FF5733)';
COMMENT ON COLUMN user_folders.color_type IS 'Either "preset" (uses predefined gradients) or "custom" (uses custom_color)';

