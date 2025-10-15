-- =====================================================
-- ADVANCED FEATURES MIGRATION
-- Stories, Live Streaming, Rich Media, Events, Bookings
-- =====================================================

-- ============= STORIES & LIVE STREAMING =============

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('image', 'video', 'live')),
  media_url TEXT,
  text_overlay TEXT,
  background_color VARCHAR(7),
  duration INTEGER DEFAULT 5,
  views_count INTEGER DEFAULT 0,
  is_live BOOLEAN DEFAULT false,
  live_stream_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT valid_duration CHECK (duration > 0 AND duration <= 60)
);

-- Add missing columns if table already exists from older migration
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stories' AND column_name = 'is_live') THEN
    ALTER TABLE stories ADD COLUMN is_live BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stories' AND column_name = 'live_stream_url') THEN
    ALTER TABLE stories ADD COLUMN live_stream_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stories' AND column_name = 'content_type') THEN
    ALTER TABLE stories ADD COLUMN content_type VARCHAR(20);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stories' AND column_name = 'text_overlay') THEN
    ALTER TABLE stories ADD COLUMN text_overlay TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'stories' AND column_name = 'background_color') THEN
    ALTER TABLE stories ADD COLUMN background_color VARCHAR(7);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_is_live ON stories(is_live) WHERE is_live = true;

-- Live streams table
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  stream_key VARCHAR(100) UNIQUE NOT NULL,
  stream_url TEXT NOT NULL,
  playback_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  viewer_count INTEGER DEFAULT 0,
  total_donations DECIMAL(10, 2) DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_streams_user_id ON live_streams(user_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_is_active ON live_streams(is_active) WHERE is_active = true;

-- Live donations table
CREATE TABLE IF NOT EXISTS live_donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'USD',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_donations_stream ON live_donations(live_stream_id);
CREATE INDEX IF NOT EXISTS idx_live_donations_user ON live_donations(from_user_id);

-- ============= RICH MEDIA POSTS =============

-- Music posts table
CREATE TABLE IF NOT EXISTS music_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  artist VARCHAR(200) NOT NULL,
  album VARCHAR(200),
  audio_url TEXT NOT NULL,
  cover_image_url TEXT,
  duration INTEGER NOT NULL,
  genre VARCHAR(50),
  is_saveable BOOLEAN DEFAULT true,
  play_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_music_posts_user_id ON music_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_music_posts_genre ON music_posts(genre);

-- Saved music table
CREATE TABLE IF NOT EXISTS saved_music (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  music_post_id UUID NOT NULL REFERENCES music_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, music_post_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_music_user ON saved_music(user_id);

-- Video posts table
CREATE TABLE IF NOT EXISTS video_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER NOT NULL,
  resolution VARCHAR(20),
  is_downloadable BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_posts_user_id ON video_posts(user_id);

-- Document posts table
CREATE TABLE IF NOT EXISTS document_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  document_url TEXT NOT NULL,
  file_type VARCHAR(10) NOT NULL,
  file_size BIGINT NOT NULL,
  page_count INTEGER,
  is_downloadable BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_posts_user_id ON document_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_document_posts_file_type ON document_posts(file_type);

-- ============= ADVANCED EVENTS =============

-- Advanced events table
CREATE TABLE IF NOT EXISTS advanced_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('in-person', 'virtual', 'hybrid')),
  
  -- Date & Time
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  timezone VARCHAR(50) NOT NULL,
  
  -- Location
  venue_name VARCHAR(200),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  coordinates JSONB,
  virtual_link TEXT,
  
  -- Ticketing
  is_free BOOLEAN DEFAULT false,
  ticket_tiers JSONB DEFAULT '[]'::jsonb,
  total_capacity INTEGER,
  remaining_capacity INTEGER,
  
  -- Images
  cover_image_url TEXT,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  
  -- Additional Info
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  age_restriction INTEGER,
  dress_code TEXT,
  accessibility_info TEXT,
  refund_policy VARCHAR(50),
  
  -- Social
  attendee_count INTEGER DEFAULT 0,
  interested_count INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'ongoing', 'completed', 'cancelled')),
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_advanced_events_user_id ON advanced_events(user_id);
CREATE INDEX IF NOT EXISTS idx_advanced_events_status ON advanced_events(status);
CREATE INDEX IF NOT EXISTS idx_advanced_events_category ON advanced_events(category);
CREATE INDEX IF NOT EXISTS idx_advanced_events_start_date ON advanced_events(start_date);
CREATE INDEX IF NOT EXISTS idx_advanced_events_city ON advanced_events(city);

-- Event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES advanced_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ticket_tier_id VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  payment_id VARCHAR(100),
  qr_code TEXT,
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(status);

-- ============= BOOKINGS & PROPERTY RENTALS =============

-- Bookable listings table
CREATE TABLE IF NOT EXISTS bookable_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  property_type VARCHAR(50) NOT NULL,
  listing_type VARCHAR(50) NOT NULL CHECK (listing_type IN ('entire_place', 'private_room', 'shared_room')),
  
  -- Location
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  coordinates JSONB,
  
  -- Capacity
  max_guests INTEGER NOT NULL CHECK (max_guests > 0),
  bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
  beds INTEGER NOT NULL CHECK (beds > 0),
  bathrooms DECIMAL(2, 1) NOT NULL CHECK (bathrooms > 0),
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL CHECK (base_price > 0),
  currency VARCHAR(3) DEFAULT 'USD',
  cleaning_fee DECIMAL(10, 2) DEFAULT 0,
  service_fee_percentage DECIMAL(5, 2) DEFAULT 10,
  weekend_price DECIMAL(10, 2),
  monthly_discount_percentage DECIMAL(5, 2),
  
  -- Amenities & Rules
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  house_rules TEXT[] DEFAULT ARRAY[]::TEXT[],
  check_in_time VARCHAR(10) NOT NULL,
  check_out_time VARCHAR(10) NOT NULL,
  min_nights INTEGER DEFAULT 1 CHECK (min_nights > 0),
  max_nights INTEGER,
  cancellation_policy VARCHAR(20) DEFAULT 'flexible',
  
  -- Images
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  virtual_tour_url TEXT,
  
  -- Availability
  calendar_type VARCHAR(20) DEFAULT 'manual',
  instant_book BOOLEAN DEFAULT false,
  blocked_dates DATE[] DEFAULT ARRAY[]::DATE[],
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- Reviews
  average_rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookable_listings_user_id ON bookable_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookable_listings_city ON bookable_listings(city);
CREATE INDEX IF NOT EXISTS idx_bookable_listings_is_active ON bookable_listings(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bookable_listings_instant_book ON bookable_listings(instant_book) WHERE instant_book = true;
CREATE INDEX IF NOT EXISTS idx_bookable_listings_rating ON bookable_listings(average_rating DESC);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES bookable_listings(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Dates
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER NOT NULL CHECK (nights > 0),
  
  -- Guests
  num_guests INTEGER NOT NULL CHECK (num_guests > 0),
  num_adults INTEGER NOT NULL CHECK (num_adults > 0),
  num_children INTEGER DEFAULT 0 CHECK (num_children >= 0),
  num_infants INTEGER DEFAULT 0 CHECK (num_infants >= 0),
  num_pets INTEGER DEFAULT 0 CHECK (num_pets >= 0),
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL,
  cleaning_fee DECIMAL(10, 2) DEFAULT 0,
  service_fee DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('inquiry', 'pending', 'accepted', 'declined', 'cancelled', 'completed')),
  payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  payment_id VARCHAR(100),
  
  -- Communication
  guest_message TEXT,
  host_response TEXT,
  special_requests TEXT,
  
  -- Check-in
  self_check_in BOOLEAN DEFAULT false,
  check_in_instructions TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_booking_dates CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS idx_bookings_listing ON bookings(listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest ON bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_host ON bookings(host_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES bookable_listings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  check_in_rating INTEGER CHECK (check_in_rating >= 1 AND check_in_rating <= 5),
  accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  location_rating INTEGER CHECK (location_rating >= 1 AND location_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  comment TEXT NOT NULL,
  host_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(booking_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_listing ON reviews(listing_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);

-- ============= HELPER FUNCTIONS =============

-- Increment story views
CREATE OR REPLACE FUNCTION increment_story_views(story_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE stories SET views_count = views_count + 1 WHERE id = story_id;
END;
$$ LANGUAGE plpgsql;

-- Increment stream donations
CREATE OR REPLACE FUNCTION increment_stream_donations(stream_id UUID, donation_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE live_streams 
  SET total_donations = total_donations + donation_amount 
  WHERE id = stream_id;
END;
$$ LANGUAGE plpgsql;

-- Increment music saves
CREATE OR REPLACE FUNCTION increment_music_saves(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE music_posts SET save_count = save_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Increment music plays
CREATE OR REPLACE FUNCTION increment_music_plays(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE music_posts SET play_count = play_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Increment video views
CREATE OR REPLACE FUNCTION increment_video_views(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE video_posts SET view_count = view_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Increment document downloads
CREATE OR REPLACE FUNCTION increment_document_downloads(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE document_posts SET download_count = download_count + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Increment event attendees
CREATE OR REPLACE FUNCTION increment_event_attendees(event_id UUID, count INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE advanced_events SET attendee_count = attendee_count + count WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;

-- ============= ROW LEVEL SECURITY =============

-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_music ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE advanced_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookable_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Stories policies
DROP POLICY IF EXISTS "Stories are viewable by everyone" ON stories;
DROP POLICY IF EXISTS "Users can create their own stories" ON stories;
DROP POLICY IF EXISTS "Users can delete their own stories" ON stories;
CREATE POLICY "Stories are viewable by everyone" ON stories FOR SELECT USING (true);
CREATE POLICY "Users can create their own stories" ON stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stories" ON stories FOR DELETE USING (auth.uid() = user_id);

-- Live streams policies
DROP POLICY IF EXISTS "Live streams are viewable by everyone" ON live_streams;
DROP POLICY IF EXISTS "Users can create their own streams" ON live_streams;
DROP POLICY IF EXISTS "Users can update their own streams" ON live_streams;
CREATE POLICY "Live streams are viewable by everyone" ON live_streams FOR SELECT USING (true);
CREATE POLICY "Users can create their own streams" ON live_streams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own streams" ON live_streams FOR UPDATE USING (auth.uid() = user_id);

-- Music posts policies
DROP POLICY IF EXISTS "Music posts are viewable by everyone" ON music_posts;
DROP POLICY IF EXISTS "Users can create music posts" ON music_posts;
CREATE POLICY "Music posts are viewable by everyone" ON music_posts FOR SELECT USING (true);
CREATE POLICY "Users can create music posts" ON music_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Advanced events policies
DROP POLICY IF EXISTS "Published events are viewable by everyone" ON advanced_events;
DROP POLICY IF EXISTS "Users can create events" ON advanced_events;
DROP POLICY IF EXISTS "Users can update their own events" ON advanced_events;
CREATE POLICY "Published events are viewable by everyone" ON advanced_events FOR SELECT USING (status = 'published' OR auth.uid() = user_id);
CREATE POLICY "Users can create events" ON advanced_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own events" ON advanced_events FOR UPDATE USING (auth.uid() = user_id);

-- Bookable listings policies
DROP POLICY IF EXISTS "Active listings are viewable by everyone" ON bookable_listings;
DROP POLICY IF EXISTS "Users can create listings" ON bookable_listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON bookable_listings;
CREATE POLICY "Active listings are viewable by everyone" ON bookable_listings FOR SELECT USING (is_active = true OR auth.uid() = user_id);
CREATE POLICY "Users can create listings" ON bookable_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own listings" ON bookable_listings FOR UPDATE USING (auth.uid() = user_id);

-- Bookings policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Hosts can update bookings for their listings" ON bookings;
CREATE POLICY "Users can view their own bookings" ON bookings FOR SELECT USING (auth.uid() = guest_id OR auth.uid() = host_id);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = guest_id);
CREATE POLICY "Hosts can update bookings for their listings" ON bookings FOR UPDATE USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- Reviews policies
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews for their bookings" ON reviews;
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews for their bookings" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

COMMENT ON TABLE stories IS 'Stories and live streaming content';
COMMENT ON TABLE advanced_events IS 'Advanced event ticketing and management system';
COMMENT ON TABLE bookable_listings IS 'Property and space rental listings';
COMMENT ON TABLE bookings IS 'Booking reservations';

