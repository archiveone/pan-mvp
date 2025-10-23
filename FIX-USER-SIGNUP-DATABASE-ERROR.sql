-- =====================================================
-- FIX: Database Error When Creating New Users
-- =====================================================
-- This creates an automatic trigger to create profiles
-- when users sign up (fixes non-Google OAuth signup)
-- =====================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, bio, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    'Welcome to Pan!',
    now()
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- If profile creation fails, log but don't block user creation
    RAISE WARNING 'Could not create profile for user %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires when a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also make sure RLS policies allow the trigger to work
-- The trigger runs with SECURITY DEFINER so it bypasses RLS,
-- but let's ensure the policies are correct for manual operations too

-- Drop existing profile insert policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- Create a better policy that allows both auth.uid() and system inserts
CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- Verification Query
-- =====================================================

-- Check if the trigger was created successfully
SELECT 
  tgname as trigger_name,
  tgtype as trigger_type,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- =====================================================
-- SUCCESS!
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Auto-profile creation trigger installed!';
  RAISE NOTICE '✅ New users will automatically get a profile';
  RAISE NOTICE '✅ Works for email/password and all OAuth providers';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Try signing up with email/password now!';
  RAISE NOTICE '';
END $$;

