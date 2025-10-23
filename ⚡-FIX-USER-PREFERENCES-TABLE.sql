-- =====================================================
-- FIX: Missing Columns in user_preferences Table
-- =====================================================
-- Error: column "accent_color" does not exist
-- =====================================================

-- ============= ADD MISSING COLUMNS =============

-- Add accent_color if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_preferences' 
    AND column_name = 'accent_color'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN accent_color VARCHAR(7) DEFAULT '#10B981';
    RAISE NOTICE '✅ Added accent_color column';
  ELSE
    RAISE NOTICE '✓ accent_color already exists';
  END IF;
END $$;

-- Add other common preference columns if missing
DO $$
BEGIN
  -- Theme preference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_preferences' 
    AND column_name = 'theme'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN theme VARCHAR(20) DEFAULT 'system';
    RAISE NOTICE '✅ Added theme column';
  END IF;
  
  -- Notifications
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_preferences' 
    AND column_name = 'notifications_enabled'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN notifications_enabled BOOLEAN DEFAULT true;
    RAISE NOTICE '✅ Added notifications_enabled column';
  END IF;
  
  -- Email notifications
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_preferences' 
    AND column_name = 'email_notifications'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN email_notifications BOOLEAN DEFAULT true;
    RAISE NOTICE '✅ Added email_notifications column';
  END IF;
  
  -- Language
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_preferences' 
    AND column_name = 'language'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN language VARCHAR(10) DEFAULT 'en';
    RAISE NOTICE '✅ Added language column';
  END IF;
END $$;

-- ============= UPDATE OR CREATE TRIGGER FUNCTION =============

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS initialize_user_preferences() CASCADE;

-- Create the correct function
CREATE OR REPLACE FUNCTION initialize_user_preferences()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert default preferences for new user
  INSERT INTO user_preferences (
    user_id, 
    accent_color,
    theme,
    notifications_enabled,
    email_notifications,
    language,
    created_at
  )
  VALUES (
    NEW.id, 
    '#10B981',
    'system',
    true,
    true,
    'en',
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Don't block user creation if preferences fail
    RAISE WARNING 'Could not initialize preferences for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trigger_init_preferences ON profiles;

-- Create the trigger
CREATE TRIGGER trigger_init_preferences
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_preferences();

-- ============= VERIFY =============

-- Check table structure
SELECT 
  column_name, 
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_preferences'
ORDER BY ordinal_position;

-- Check trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_init_preferences';

-- ============= SUCCESS MESSAGE =============

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ USER PREFERENCES TABLE FIXED!';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ accent_color column added';
  RAISE NOTICE '✅ All preference columns added';
  RAISE NOTICE '✅ Trigger function updated';
  RAISE NOTICE '✅ Trigger recreated';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 User signup should work now!';
  RAISE NOTICE '';
END $$;

