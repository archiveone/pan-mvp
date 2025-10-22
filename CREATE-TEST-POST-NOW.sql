-- Create a test post that will definitely show in feed
-- Replace USER_ID with your actual user ID

-- First, let's get your user ID
SELECT id, name, username FROM profiles LIMIT 5;

-- Then run this (replace the UUID with YOUR user ID from above):
INSERT INTO posts (
  user_id,
  title,
  content,
  category,
  location,
  media_url,
  created_at,
  updated_at
) VALUES (
  '2759c8e6-bd01-4210-956b-17a249dbdc23', -- REPLACE THIS with your user ID!
  'Test Post - Should Show Up!',
  'This is a test post created directly in the database to verify the feed works.',
  'General',
  'New York, NY',
  'https://images.unsplash.com/photo-1516802273409-68526ee1bdd6?w=400',
  NOW(),
  NOW()
);

-- Verify it was created
SELECT id, title, user_id, created_at FROM posts ORDER BY created_at DESC LIMIT 3;

