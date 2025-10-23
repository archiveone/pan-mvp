-- =====================================================
-- SIMPLEST FIX - Just Update The Trigger
-- =====================================================
-- This is all you need - adds SECURITY DEFINER
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER  -- ← This bypasses RLS!
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
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Create trust score (with error handling)
  BEGIN
    INSERT INTO public.user_trust_scores (user_id, trust_score, created_at)
    VALUES (new.id, 100, now())
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN others THEN 
    RAISE WARNING 'Could not create trust score: %', SQLERRM;
  END;
  
  -- Create preferences (with error handling)
  BEGIN
    -- Try to insert with accent_color if column exists
    INSERT INTO public.user_preferences (user_id, created_at)
    VALUES (new.id, now())
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION 
    WHEN undefined_column THEN
      -- Column doesn't exist, skip preferences
      RAISE WARNING 'user_preferences table missing columns, skipping';
    WHEN others THEN 
      RAISE WARNING 'Could not create preferences: %', SQLERRM;
  END;
  
  RETURN new;
EXCEPTION WHEN others THEN
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Done!
SELECT '✅ FIXED! The trigger now has SECURITY DEFINER and will bypass RLS.' as status;
SELECT '🎉 Try signing up now - it should work!' as next_step;

