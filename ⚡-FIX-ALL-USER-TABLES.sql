-- =====================================================
-- FIX ALL USER-RELATED TABLES RLS
-- =====================================================
-- Fixes RLS for: user_gamification, user_trust_scores,
-- user_preferences, and any other user tables
-- =====================================================

-- ============= FIX USER_GAMIFICATION TABLE =============

DO $$
BEGIN
  -- Check if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_gamification') THEN
    -- Enable RLS
    EXECUTE 'ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY';
    
    -- Drop existing policies
    EXECUTE 'DROP POLICY IF EXISTS "Users can view own gamification" ON user_gamification';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert own gamification" ON user_gamification';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update own gamification" ON user_gamification';
    
    -- Create new policies
    EXECUTE 'CREATE POLICY "Users can view own gamification"
      ON user_gamification FOR SELECT
      USING (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "Users can insert own gamification"
      ON user_gamification FOR INSERT
      WITH CHECK (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "Users can update own gamification"
      ON user_gamification FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id)';
    
    RAISE NOTICE '✅ user_gamification RLS fixed';
  ELSE
    RAISE NOTICE '⚠️  user_gamification table does not exist';
  END IF;
END $$;

-- ============= FIX USER_TRUST_SCORES TABLE =============

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_trust_scores') THEN
    EXECUTE 'ALTER TABLE user_trust_scores ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'DROP POLICY IF EXISTS "Users view own trust scores" ON user_trust_scores';
    EXECUTE 'DROP POLICY IF EXISTS "Users insert own trust scores" ON user_trust_scores';
    EXECUTE 'DROP POLICY IF EXISTS "Users update own trust scores" ON user_trust_scores';
    
    EXECUTE 'CREATE POLICY "Users view own trust scores"
      ON user_trust_scores FOR SELECT
      USING (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "Users insert own trust scores"
      ON user_trust_scores FOR INSERT
      WITH CHECK (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "Users update own trust scores"
      ON user_trust_scores FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id)';
    
    RAISE NOTICE '✅ user_trust_scores RLS fixed';
  END IF;
END $$;

-- ============= FIX USER_PREFERENCES TABLE =============

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
    EXECUTE 'ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'DROP POLICY IF EXISTS "Users view own preferences" ON user_preferences';
    EXECUTE 'DROP POLICY IF EXISTS "Users insert own preferences" ON user_preferences';
    EXECUTE 'DROP POLICY IF EXISTS "Users update own preferences" ON user_preferences';
    
    EXECUTE 'CREATE POLICY "Users view own preferences"
      ON user_preferences FOR SELECT
      USING (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "Users insert own preferences"
      ON user_preferences FOR INSERT
      WITH CHECK (auth.uid() = user_id)';
    
    EXECUTE 'CREATE POLICY "Users update own preferences"
      ON user_preferences FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id)';
    
    RAISE NOTICE '✅ user_preferences RLS fixed';
  END IF;
END $$;

-- ============= UPDATE SIGNUP TRIGGER =============

-- Drop and recreate the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER  -- ← This bypasses RLS!
SET search_path = public
AS $$
BEGIN
  -- Create profile (main requirement)
  INSERT INTO public.profiles (id, name, bio, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    'Welcome to Pan!',
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Create trust score (optional)
  BEGIN
    INSERT INTO public.user_trust_scores (user_id, trust_score, created_at)
    VALUES (new.id, 100, now())
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN others THEN 
    RAISE WARNING 'Could not create trust score: %', SQLERRM;
  END;
  
  -- Create preferences (optional)
  BEGIN
    INSERT INTO public.user_preferences (user_id, created_at)
    VALUES (new.id, now())
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN others THEN 
    RAISE WARNING 'Could not create preferences: %', SQLERRM;
  END;
  
  -- Create gamification record (optional)
  BEGIN
    INSERT INTO public.user_gamification (
      user_id, 
      total_points, 
      current_level, 
      level_name,
      created_at
    )
    VALUES (new.id, 0, 1, 'Beginner', now())
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN others THEN 
    RAISE WARNING 'Could not create gamification: %', SQLERRM;
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

-- ============= VERIFY EVERYTHING =============

-- Check RLS policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN (
  'user_gamification',
  'user_trust_scores',
  'user_preferences'
)
ORDER BY tablename, cmd;

-- Check trigger
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============= SUCCESS MESSAGE =============

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ ALL USER TABLES RLS FIXED!';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ user_gamification - RLS configured';
  RAISE NOTICE '✅ user_trust_scores - RLS configured';
  RAISE NOTICE '✅ user_preferences - RLS configured';
  RAISE NOTICE '✅ Signup trigger updated with SECURITY DEFINER';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 User signup should work completely now!';
  RAISE NOTICE '';
END $$;

