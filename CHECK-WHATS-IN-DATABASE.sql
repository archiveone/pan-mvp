-- Check what content exists in your database

-- Check posts table
SELECT 'POSTS TABLE:' as table_name, COUNT(*) as count FROM posts;

-- Check content table  
SELECT 'CONTENT TABLE:' as table_name, COUNT(*) as count FROM content;

-- Check advanced_listings table
SELECT 'ADVANCED_LISTINGS TABLE:' as table_name, COUNT(*) as count FROM advanced_listings;

-- Check marketplace_listings table
SELECT 'MARKETPLACE_LISTINGS TABLE:' as table_name, COUNT(*) as count FROM marketplace_listings;

-- Show actual posts if any exist
SELECT 'RECENT POSTS:' as info;
SELECT id, title, user_id, created_at FROM posts ORDER BY created_at DESC LIMIT 5;

-- Show content if any exists
SELECT 'RECENT CONTENT:' as info;
SELECT id, title, user_id, created_at FROM content ORDER BY created_at DESC LIMIT 5;

