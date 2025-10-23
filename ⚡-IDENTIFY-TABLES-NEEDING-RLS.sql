-- =====================================================
-- Identify Which Tables Need RLS
-- =====================================================
-- This shows you which tables have user_id columns
-- (these are the ones that typically need RLS)
-- =====================================================

-- Find all tables with user_id column
SELECT 
  t.table_name,
  CASE 
    WHEN t.table_name LIKE 'auth.%' THEN '🔐 Auth (Skip)'
    WHEN c.column_name = 'user_id' THEN '✅ Needs RLS (has user_id)'
    WHEN c.column_name = 'id' AND t.table_name = 'profiles' THEN '✅ Needs RLS (is profiles)'
    ELSE '⚠️ Check manually'
  END as recommendation,
  CASE 
    WHEN pg.relrowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as current_status,
  (
    SELECT COUNT(*) 
    FROM pg_policies 
    WHERE pg_policies.tablename = t.table_name
  ) as policy_count
FROM information_schema.tables t
LEFT JOIN information_schema.columns c 
  ON t.table_name = c.table_name 
  AND c.column_name IN ('user_id', 'id')
LEFT JOIN pg_class pg ON pg.relname = t.table_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE 'pg_%'
  AND t.table_name NOT LIKE 'sql_%'
ORDER BY 
  CASE WHEN c.column_name = 'user_id' THEN 1 ELSE 2 END,
  t.table_name;

-- ============= SUMMARY =============

DO $$
DECLARE
  total_tables INTEGER;
  tables_with_user_id INTEGER;
  tables_with_rls INTEGER;
BEGIN
  -- Count total tables
  SELECT COUNT(*) INTO total_tables
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  -- Count tables with user_id
  SELECT COUNT(DISTINCT table_name) INTO tables_with_user_id
  FROM information_schema.columns
  WHERE table_schema = 'public' AND column_name = 'user_id';
  
  -- Count tables with RLS enabled
  SELECT COUNT(*) INTO tables_with_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' 
    AND c.relkind = 'r'
    AND c.relrowsecurity = true;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '📊 RLS ANALYSIS';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total tables in database: %', total_tables;
  RAISE NOTICE 'Tables with user_id column: %', tables_with_user_id;
  RAISE NOTICE 'Tables with RLS enabled: %', tables_with_rls;
  RAISE NOTICE '';
  RAISE NOTICE 'Recommendation:';
  RAISE NOTICE 'Only tables with user_id need RLS!';
  RAISE NOTICE 'That''s only % out of % tables!', tables_with_user_id, total_tables;
  RAISE NOTICE '';
END $$;

-- ============= DETAILED BREAKDOWN =============

-- Tables that definitely need RLS (have user_id)
SELECT '✅ NEEDS RLS (has user_id):' as category;
SELECT table_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND column_name = 'user_id'
  AND table_name NOT IN (
    SELECT tablename 
    FROM pg_policies 
    GROUP BY tablename 
    HAVING COUNT(*) >= 4
  )
ORDER BY table_name;

-- Tables that already have RLS
SELECT '' as spacer, '✓ Already has RLS policies:' as category;
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============= RECOMMENDATION =============

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '💡 RECOMMENDATION:';
  RAISE NOTICE '';
  RAISE NOTICE 'Run the Master RLS Fix on tables with user_id column';
  RAISE NOTICE 'Ignore:';
  RAISE NOTICE '  - Lookup tables (categories, tags, etc.)';
  RAISE NOTICE '  - System tables (migrations, logs, etc.)';
  RAISE NOTICE '  - Junction tables (post_tags, etc.)';
  RAISE NOTICE '';
  RAISE NOTICE 'You probably only need RLS on 15-25 tables,';
  RAISE NOTICE 'not all 140!';
  RAISE NOTICE '';
END $$;

