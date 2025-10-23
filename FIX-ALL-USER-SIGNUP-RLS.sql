-- =====================================================
-- FIX ALL USER SIGNUP RLS POLICIES
-- =====================================================
-- Fixes RLS for profiles, user_trust_scores, and user_preferences
-- so that triggers can create records automatically
-- =====================================================

-- ============= PROFILES TABLE =============

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- Create new policies
CREATE POLICY "Public profiles viewable" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users insert own profile" 
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============= USER_TRUST_SCORES TABLE =============

-- Enable RLS
ALTER TABLE user_trust_scores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own trust scores" ON user_trust_scores;
DROP POLICY IF EXISTS "Users can insert own trust scores" ON user_trust_scores;
DROP POLICY IF EXISTS "Users can update own trust scores" ON user_trust_scores;

-- Create policies
CREATE POLICY "Users view own trust scores" 
  ON user_trust_scores FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own trust scores" 
  ON user_trust_scores FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own trust scores" 
  ON user_trust_scores FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============= USER_PREFERENCES TABLE =============

-- Enable RLS if not already
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;

-- Create policies
CREATE POLICY "Users view own preferences" 
  ON user_preferences FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own preferences" 
  ON user_preferences FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own preferences" 
  ON user_preferences FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============= FIX TRIGGERS TO WORK WITH RLS =============

-- Update the handle_new_user function to use SECURITY DEFINER
-- This allows it to bypass RLS when creating initial records
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER  -- This is key - runs with elevated permissions
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, name, bio, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    'Welcome to Pan!',
    now()
  );
  
  -- Insert user_trust_scores if table exists
  BEGIN
    INSERT INTO public.user_trust_scores (user_id, trust_score, created_at)
    VALUES (new.id, 100, now())
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN undefined_table THEN
      NULL; -- Table doesn't exist, skip
    WHEN others THEN
      RAISE WARNING 'Could not create trust score for user %: %', new.id, SQLERRM;
  END;
  
  -- Insert user_preferences if table exists
  BEGIN
    INSERT INTO public.user_preferences (user_id, created_at)
    VALUES (new.id, now())
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN undefined_table THEN
      NULL; -- Table doesn't exist, skip
    WHEN others THEN
      RAISE WARNING 'Could not create preferences for user %: %', new.id, SQLERRM;
  END;
  
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Error in handle_new_user for %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check trigger exists
SELECT 
  tgname as trigger_name,
  proname as function_name,
  provolatile,
  prosecdef as security_definer
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- Check RLS policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('profiles', 'user_trust_scores', 'user_preferences')
ORDER BY tablename, policyname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '✅ ALL RLS POLICIES FIXED!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '✅ Profiles - RLS configured';
  RAISE NOTICE '✅ User Trust Scores - RLS configured';
  RAISE NOTICE '✅ User Preferences - RLS configured';
  RAISE NOTICE '✅ Trigger updated with SECURITY DEFINER';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 User signup should work now!';
  RAISE NOTICE '';
END $$;

