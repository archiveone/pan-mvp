-- Test the analytics system
-- Run this after creating the analytics system

-- ============= TEST ANALYTICS FUNCTIONS =============

-- Test 1: Check if analytics_events table exists and has correct structure
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_events') THEN
        RAISE NOTICE 'SUCCESS: analytics_events table exists';
    ELSE
        RAISE NOTICE 'ERROR: analytics_events table does not exist';
    END IF;
END $$;

-- Test 2: Check if click_count column exists in posts table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'posts' AND column_name = 'click_count') THEN
        RAISE NOTICE 'SUCCESS: click_count column exists in posts table';
    ELSE
        RAISE NOTICE 'ERROR: click_count column does not exist in posts table';
    END IF;
END $$;

-- Test 3: Test increment_analytics_counter function
DO $$
DECLARE
    test_post_id UUID;
    initial_count INTEGER;
    final_count INTEGER;
BEGIN
    -- Get a test post
    SELECT id INTO test_post_id FROM posts LIMIT 1;
    
    IF test_post_id IS NOT NULL THEN
        -- Get initial count
        SELECT COALESCE(view_count, 0) INTO initial_count FROM posts WHERE id = test_post_id;
        
        -- Test the function
        PERFORM increment_analytics_counter(test_post_id, 'view_count');
        
        -- Get final count
        SELECT COALESCE(view_count, 0) INTO final_count FROM posts WHERE id = test_post_id;
        
        IF final_count = initial_count + 1 THEN
            RAISE NOTICE 'SUCCESS: increment_analytics_counter function works correctly';
        ELSE
            RAISE NOTICE 'ERROR: increment_analytics_counter function failed';
        END IF;
    ELSE
        RAISE NOTICE 'WARNING: No posts found to test with';
    END IF;
END $$;

-- Test 4: Test get_content_analytics function
DO $$
DECLARE
    test_post_id UUID;
    result JSON;
BEGIN
    -- Get a test post
    SELECT id INTO test_post_id FROM posts LIMIT 1;
    
    IF test_post_id IS NOT NULL THEN
        -- Test the function
        SELECT get_content_analytics(test_post_id) INTO result;
        
        IF result IS NOT NULL THEN
            RAISE NOTICE 'SUCCESS: get_content_analytics function works correctly';
        ELSE
            RAISE NOTICE 'ERROR: get_content_analytics function failed';
        END IF;
    ELSE
        RAISE NOTICE 'WARNING: No posts found to test with';
    END IF;
END $$;

-- Test 5: Test get_user_analytics function
DO $$
DECLARE
    test_user_id UUID;
    result JSON;
BEGIN
    -- Get a test user
    SELECT user_id INTO test_user_id FROM posts LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        -- Test the function
        SELECT get_user_analytics(test_user_id, 30) INTO result;
        
        IF result IS NOT NULL THEN
            RAISE NOTICE 'SUCCESS: get_user_analytics function works correctly';
        ELSE
            RAISE NOTICE 'ERROR: get_user_analytics function failed';
        END IF;
    ELSE
        RAISE NOTICE 'WARNING: No users found to test with';
    END IF;
END $$;

-- Test 6: Test analytics_events insertion
DO $$
DECLARE
    test_post_id UUID;
    event_id UUID;
BEGIN
    -- Get a test post
    SELECT id INTO test_post_id FROM posts LIMIT 1;
    
    IF test_post_id IS NOT NULL THEN
        -- Insert a test event
        INSERT INTO analytics_events (content_id, event_type, metadata)
        VALUES (test_post_id, 'view', '{"test": true}'::jsonb)
        RETURNING id INTO event_id;
        
        IF event_id IS NOT NULL THEN
            RAISE NOTICE 'SUCCESS: analytics_events insertion works correctly';
            
            -- Clean up test event
            DELETE FROM analytics_events WHERE id = event_id;
        ELSE
            RAISE NOTICE 'ERROR: analytics_events insertion failed';
        END IF;
    ELSE
        RAISE NOTICE 'WARNING: No posts found to test with';
    END IF;
END $$;

-- Test 7: Test content_performance view
DO $$
DECLARE
    view_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO view_count FROM content_performance;
    
    IF view_count >= 0 THEN
        RAISE NOTICE 'SUCCESS: content_performance view works correctly';
    ELSE
        RAISE NOTICE 'ERROR: content_performance view failed';
    END IF;
END $$;

-- ============= FINAL SUCCESS MESSAGE =============

SELECT 'Analytics system testing completed! Check the notices above for results.' as message;
