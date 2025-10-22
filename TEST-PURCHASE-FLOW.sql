-- =====================================================
-- CREATE TEST CONTENT FOR PURCHASE TESTING
-- =====================================================

-- 1. Free Music Single
INSERT INTO posts (
  user_id,
  title,
  content,
  post_type,
  is_for_sale,
  price_amount,
  is_digital,
  media_url,
  metadata,
  tags,
  category
) VALUES (
  (SELECT id FROM profiles LIMIT 1), -- Your user ID
  'Summer Vibes (Free)',
  'Free download! Chill summer beats to relax to.',
  'music_single',
  false, -- FREE!
  0,
  true,
  'https://via.placeholder.com/500x500/667eea/ffffff?text=Summer+Vibes',
  jsonb_build_object(
    'artist', 'Test Artist',
    'genre', 'Electronic',
    'duration', '3:45',
    'release_date', '2025-10-22',
    'audio_preview_url', 'https://example.com/preview.mp3'
  ),
  ARRAY['electronic', 'chill', 'free'],
  'Music'
);

-- 2. Paid Music Single
INSERT INTO posts (
  user_id,
  title,
  content,
  post_type,
  is_for_sale,
  price_amount,
  is_digital,
  media_url,
  digital_file_url,
  metadata,
  tags,
  category
) VALUES (
  (SELECT id FROM profiles LIMIT 1),
  'Midnight Drive',
  'Premium single with high-quality audio. Instant download after purchase.',
  'music_single',
  true, -- FOR SALE!
  0.99, -- $0.99
  true,
  'https://via.placeholder.com/500x500/f093fb/ffffff?text=Midnight+Drive',
  'https://example.com/midnight-drive.mp3',
  jsonb_build_object(
    'artist', 'Test Artist',
    'genre', 'Lo-Fi',
    'duration', '4:20',
    'release_date', '2025-10-22',
    'explicit', false
  ),
  ARRAY['lofi', 'nighttime', 'premium'],
  'Music'
);

-- 3. Paid Video
INSERT INTO posts (
  user_id,
  title,
  content,
  post_type,
  is_for_sale,
  price_amount,
  is_digital,
  media_url,
  digital_file_url,
  metadata,
  tags,
  category
) VALUES (
  (SELECT id FROM profiles LIMIT 1),
  'Documentary: The Journey',
  'Award-winning documentary. Stream instantly after purchase.',
  'video',
  true,
  4.99, -- $4.99
  true,
  'https://via.placeholder.com/800x450/4facfe/ffffff?text=The+Journey',
  'https://example.com/documentary.mp4',
  jsonb_build_object(
    'director', 'Jane Doe',
    'genre', 'Documentary',
    'duration', '1:45:00',
    'resolution', '1080p',
    'release_year', 2025,
    'rating', 'PG-13'
  ),
  ARRAY['documentary', 'nature', 'award-winning'],
  'Video'
);

-- 4. Event Ticket
INSERT INTO posts (
  user_id,
  title,
  content,
  post_type,
  is_for_sale,
  price_amount,
  inventory_type,
  stock_quantity,
  location,
  media_url,
  metadata,
  tags,
  category
) VALUES (
  (SELECT id FROM profiles LIMIT 1),
  'Summer Music Festival 2025',
  '3 days of amazing music! Early bird tickets available.',
  'event',
  true,
  89.00, -- $89
  'limited',
  100, -- 100 tickets available
  'Central Park, New York',
  'https://via.placeholder.com/800x400/667eea/ffffff?text=Music+Festival',
  jsonb_build_object(
    'event_date', '2025-08-15T19:00:00Z',
    'event_end_date', '2025-08-17T23:00:00Z',
    'venue', 'Central Park',
    'address', 'New York, NY',
    'capacity', 5000,
    'tickets_remaining', 100,
    'lineup', jsonb_build_array('Artist 1', 'Artist 2', 'Artist 3'),
    'age_restriction', '18+'
  ),
  ARRAY['music', 'festival', 'outdoor'],
  'Events'
);

-- 5. Music Album
INSERT INTO posts (
  user_id,
  title,
  content,
  post_type,
  is_for_sale,
  price_amount,
  is_digital,
  media_url,
  digital_file_url,
  metadata,
  tags,
  category
) VALUES (
  (SELECT id FROM profiles LIMIT 1),
  'Summer Nights - The Album',
  'Full album with 12 amazing tracks. Download all songs instantly.',
  'music_album',
  true,
  9.99, -- $9.99
  true,
  'https://via.placeholder.com/500x500/fa709a/ffffff?text=Summer+Nights',
  'https://example.com/album.zip',
  jsonb_build_object(
    'artist', 'Test Artist',
    'genre', 'Pop',
    'duration', '45:30',
    'track_count', 12,
    'release_date', '2025-10-22',
    'tracks', jsonb_build_array(
      jsonb_build_object('number', 1, 'title', 'Summer Nights', 'duration', '3:45'),
      jsonb_build_object('number', 2, 'title', 'Ocean Waves', 'duration', '4:20'),
      jsonb_build_object('number', 3, 'title', 'Sunset Dreams', 'duration', '3:55')
    )
  ),
  ARRAY['pop', 'album', 'summer'],
  'Music'
);

SELECT '✅ Test content created!' as status;
SELECT 'You now have: 1 free song, 2 paid songs, 1 video, 1 event ticket, 1 album' as content;
SELECT 'Refresh your homepage to see them!' as next_step;

