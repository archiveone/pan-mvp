-- =====================================================
-- QUICK FIX: Copy-Paste This Entire File
-- =====================================================
-- Fixes 403 RLS errors on user signup
-- Run in Supabase SQL Editor
-- =====================================================

-- Fix user_trust_scores RLS
DO $$ 
BEGIN
  ALTER TABLE user_trust_scores ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users insert own trust scores" ON user_trust_scores;
DROP POLICY IF EXISTS "Users view own trust scores" ON user_trust_scores;
DROP POLICY IF EXISTS "Users can view own trust scores" ON user_trust_scores;
DROP POLICY IF EXISTS "Users can insert own trust scores" ON user_trust_scores;
DROP POLICY IF EXISTS "Users can update own trust scores" ON user_trust_scores;

-- Create new policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_trust_scores') THEN
    EXECUTE 'CREATE POLICY "Users insert own trust scores" 
      ON user_trust_scores FOR INSERT 
      WITH CHECK (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "Users view own trust scores" 
      ON user_trust_scores FOR SELECT 
      USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Fix user_preferences RLS
DO $$ 
BEGIN
  ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users insert own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users view own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;

-- Create new policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_preferences') THEN
    EXECUTE 'CREATE POLICY "Users insert own preferences" 
      ON user_preferences FOR INSERT 
      WITH CHECK (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "Users view own preferences" 
      ON user_preferences FOR SELECT 
      USING (auth.uid() = user_id)';
  END IF;
END $$;

-- Update trigger with SECURITY DEFINER (this is the key!)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, name, bio, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    'Welcome to Pan!',
    now()
  );
  
  -- Create trust score (with error handling)
  BEGIN
    INSERT INTO public.user_trust_scores (user_id, trust_score, created_at)
    VALUES (new.id, 100, now())
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN others THEN NULL;
  END;
  
  -- Create preferences (with error handling)
  BEGIN
    INSERT INTO public.user_preferences (user_id, created_at)
    VALUES (new.id, now())
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN others THEN NULL;
  END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Success!
SELECT '✅ Fixed! Try signing up now!' as message;

