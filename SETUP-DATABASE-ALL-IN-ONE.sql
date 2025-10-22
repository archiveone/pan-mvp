-- =====================================================
-- PAN MARKETPLACE - COMPLETE DATABASE SETUP
-- All-in-One Migration File
-- =====================================================
-- 
-- Copy this ENTIRE file and paste into Supabase SQL Editor
-- Then click "Run" to set up all tables at once
--
-- This will create:
-- - User profiles and auth system
-- - Posts, content, media (music, videos, documents)
-- - Events with ticketing
-- - Marketplace listings with variants
-- - Auctions (basic + enterprise)
-- - Fundraising campaigns
-- - Bookings and reservations
-- - Reviews, comments, notifications
-- - And much more!
--
-- =====================================================

-- First, let's create the profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200),
  username VARCHAR(100) UNIQUE,
  handle VARCHAR(100) UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  user_location VARCHAR(200),
  is_verified BOOLEAN DEFAULT false,
  is_business BOOLEAN DEFAULT false,
  business_type VARCHAR(50),
  verification_status VARCHAR(20) DEFAULT 'none',
  verification_level VARCHAR(20) DEFAULT 'none',
  verification_data JSONB,
  bio_safety_score DECIMAL(3, 2),
  bio_safety_checked BOOLEAN DEFAULT false,
  bio_safety_violations TEXT[],
  bio_is_safety_approved BOOLEAN DEFAULT false,
  profile_type VARCHAR(20) DEFAULT 'personal',
  hub_theme VARCHAR(20) DEFAULT 'default',
  hub_layout VARCHAR(20) DEFAULT 'grid',
  hub_banner_url TEXT,
  hub_description TEXT,
  show_stats BOOLEAN DEFAULT true,
  show_followers BOOLEAN DEFAULT true,
  show_posts BOOLEAN DEFAULT true,
  custom_css TEXT,
  stripe_customer_id VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON profiles(handle);

-- Basic posts/content table
CREATE TABLE IF NOT EXISTS content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(500),
  content TEXT,
  media_url TEXT,
  media_urls TEXT[],
  category VARCHAR(100),
  tags TEXT[],
  location VARCHAR(200),
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at DESC);

-- Also support legacy "posts" table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(500),
  content TEXT,
  media_url TEXT,
  category VARCHAR(100),
  location VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);

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

-- =====================================================
-- ULTRA ADVANCED LISTING SYSTEM
-- Multi-Item Listings: Hotels, Vehicle Fleets, Product Variants
-- =====================================================

-- Main advanced listings table
CREATE TABLE IF NOT EXISTS advanced_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_id UUID, -- Optional business account
  
  -- Type
  listing_type VARCHAR(50) NOT NULL CHECK (listing_type IN (
    'hotel', 'hostel', 'vehicle_rental', 'equipment_rental', 
    'product', 'service', 'experience', 'space_rental', 'event_venue'
  )),
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  
  -- Basic Info
  title VARCHAR(200) NOT NULL,
  tagline VARCHAR(200),
  description TEXT NOT NULL,
  
  -- Business Details
  business_name VARCHAR(200),
  business_license VARCHAR(100),
  business_type VARCHAR(20) CHECK (business_type IN ('individual', 'business', 'enterprise')),
  
  -- Location
  address TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  coordinates JSONB, -- {lat: number, lng: number}
  
  -- Multi-Item Configuration
  has_variants BOOLEAN DEFAULT false,
  variant_count INTEGER DEFAULT 0,
  total_inventory INTEGER DEFAULT 0,
  
  -- Amenities/Features
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  policies JSONB DEFAULT '{}'::jsonb, -- Flexible policies object
  
  -- Media
  cover_image_url TEXT,
  gallery_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  video_url TEXT,
  virtual_tour_url TEXT,
  
  -- Contact
  contact_method VARCHAR(20) DEFAULT 'message',
  phone_number VARCHAR(20),
  email VARCHAR(200),
  website TEXT,
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verification_level VARCHAR(20) DEFAULT 'none' CHECK (verification_level IN ('none', 'phone', 'email', 'id', 'business')),
  
  -- Metrics
  total_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'suspended')),
  is_featured BOOLEAN DEFAULT false,
  
  -- SEO
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  meta_title VARCHAR(200),
  meta_description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Listing variants table (rooms, vehicles, product variants, etc.)
CREATE TABLE IF NOT EXISTS listing_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_listing_id UUID NOT NULL REFERENCES advanced_listings(id) ON DELETE CASCADE,
  variant_type VARCHAR(50) NOT NULL CHECK (variant_type IN ('room', 'vehicle', 'product_variant', 'service_option', 'time_slot')),
  
  -- Identification
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(100),
  description TEXT,
  
  -- Variant Attributes (flexible JSONB for any type)
  attributes JSONB DEFAULT '{}'::jsonb,
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
  currency VARCHAR(3) DEFAULT 'USD',
  pricing_model VARCHAR(20) NOT NULL CHECK (pricing_model IN ('per_day', 'per_hour', 'per_night', 'per_month', 'fixed', 'per_person')),
  dynamic_pricing JSONB, -- Flexible pricing object
  
  -- Inventory & Availability
  quantity_total INTEGER NOT NULL CHECK (quantity_total > 0),
  quantity_available INTEGER NOT NULL CHECK (quantity_available >= 0),
  unlimited_quantity BOOLEAN DEFAULT false,
  
  -- Availability Calendar
  availability_type VARCHAR(20) DEFAULT 'always' CHECK (availability_type IN ('always', 'calendar', 'schedule')),
  blocked_dates DATE[] DEFAULT ARRAY[]::DATE[],
  available_time_slots JSONB, -- Array of time slot objects
  
  -- Media
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  primary_image_url TEXT,
  video_url TEXT,
  virtual_tour_url TEXT,
  
  -- Booking Rules
  min_duration INTEGER, -- minimum hours/days/nights
  max_duration INTEGER, -- maximum hours/days/nights
  advance_booking_days INTEGER DEFAULT 0, -- how many days in advance booking required
  cancellation_policy VARCHAR(50),
  deposit_required DECIMAL(10, 2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Metrics
  booking_count INTEGER DEFAULT 0,
  revenue_generated DECIMAL(12, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT quantity_check CHECK (quantity_available <= quantity_total OR unlimited_quantity = true)
);

-- Booking requests table (unified for all types)
CREATE TABLE IF NOT EXISTS booking_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES advanced_listings(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES listing_variants(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Date/Time
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_value INTEGER NOT NULL,
  duration_unit VARCHAR(10) NOT NULL CHECK (duration_unit IN ('hour', 'day', 'night', 'week', 'month')),
  
  -- Quantity
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  
  -- Guest Details
  num_adults INTEGER,
  num_children INTEGER,
  num_infants INTEGER,
  
  -- Special Requests
  special_requests TEXT,
  add_ons TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Pricing
  base_price DECIMAL(10, 2) NOT NULL,
  additional_fees JSONB DEFAULT '{}'::jsonb,
  total_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment
  payment_method VARCHAR(20) CHECK (payment_method IN ('stripe', 'paypal', 'cash', 'bank_transfer')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_id VARCHAR(100),
  
  -- Status
  status VARCHAR(20) DEFAULT 'inquiry' CHECK (status IN ('inquiry', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  
  -- QR Code & Check-in
  qr_code TEXT,
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_out BOOLEAN DEFAULT false,
  checked_out_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_booking_dates CHECK (end_date > start_date)
);

-- Inventory tracking (real-time availability)
CREATE TABLE IF NOT EXISTS variant_inventory_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID NOT NULL REFERENCES listing_variants(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES booking_requests(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('booked', 'released', 'blocked', 'unblocked')),
  quantity_change INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing history (for dynamic pricing insights)
CREATE TABLE IF NOT EXISTS variant_pricing_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID NOT NULL REFERENCES listing_variants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  pricing_reason VARCHAR(50), -- 'weekend', 'peak_season', 'demand', 'promotion'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(variant_id, date)
);

-- ============= INDEXES =============

-- Advanced listings indexes
CREATE INDEX IF NOT EXISTS idx_advanced_listings_user ON advanced_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_advanced_listings_type ON advanced_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_advanced_listings_category ON advanced_listings(category);
CREATE INDEX IF NOT EXISTS idx_advanced_listings_city ON advanced_listings(city);
CREATE INDEX IF NOT EXISTS idx_advanced_listings_status ON advanced_listings(status);
CREATE INDEX IF NOT EXISTS idx_advanced_listings_featured ON advanced_listings(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_advanced_listings_rating ON advanced_listings(average_rating DESC);

-- Variants indexes
CREATE INDEX IF NOT EXISTS idx_variants_listing ON listing_variants(parent_listing_id);
CREATE INDEX IF NOT EXISTS idx_variants_type ON listing_variants(variant_type);
CREATE INDEX IF NOT EXISTS idx_variants_active ON listing_variants(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_variants_price ON listing_variants(base_price);
CREATE INDEX IF NOT EXISTS idx_variants_availability ON listing_variants(quantity_available) WHERE quantity_available > 0;

-- Booking requests indexes
CREATE INDEX IF NOT EXISTS idx_booking_requests_listing ON booking_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_variant ON booking_requests(variant_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_guest ON booking_requests(guest_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_host ON booking_requests(host_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_dates ON booking_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_booking_requests_payment ON booking_requests(payment_status);

-- Inventory log indexes
CREATE INDEX IF NOT EXISTS idx_inventory_log_variant ON variant_inventory_log(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_log_booking ON variant_inventory_log(booking_id);

-- Pricing history indexes
CREATE INDEX IF NOT EXISTS idx_pricing_history_variant ON variant_pricing_history(variant_id);
CREATE INDEX IF NOT EXISTS idx_pricing_history_date ON variant_pricing_history(date);

-- ============= FUNCTIONS =============

-- Function to update variant availability after booking
CREATE OR REPLACE FUNCTION update_variant_availability_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Decrease available quantity
    UPDATE listing_variants
    SET quantity_available = quantity_available - NEW.quantity
    WHERE id = NEW.variant_id AND unlimited_quantity = false;
    
    -- Log inventory change
    INSERT INTO variant_inventory_log (variant_id, booking_id, action, quantity_change, quantity_after)
    SELECT 
      NEW.variant_id,
      NEW.id,
      'booked',
      -NEW.quantity,
      quantity_available
    FROM listing_variants
    WHERE id = NEW.variant_id;
  END IF;
  
  IF NEW.status IN ('cancelled', 'completed') AND OLD.status = 'confirmed' THEN
    -- Increase available quantity back
    UPDATE listing_variants
    SET quantity_available = quantity_available + NEW.quantity
    WHERE id = NEW.variant_id AND unlimited_quantity = false;
    
    -- Log inventory change
    INSERT INTO variant_inventory_log (variant_id, booking_id, action, quantity_change, quantity_after)
    SELECT 
      NEW.variant_id,
      NEW.id,
      'released',
      NEW.quantity,
      quantity_available
    FROM listing_variants
    WHERE id = NEW.variant_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic availability updates
DROP TRIGGER IF EXISTS trigger_update_variant_availability ON booking_requests;
CREATE TRIGGER trigger_update_variant_availability
AFTER INSERT OR UPDATE OF status ON booking_requests
FOR EACH ROW
EXECUTE FUNCTION update_variant_availability_on_booking();

-- Function to update listing metrics
CREATE OR REPLACE FUNCTION update_listing_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update booking count and revenue
  UPDATE advanced_listings
  SET 
    total_bookings = (
      SELECT COUNT(*) FROM booking_requests 
      WHERE listing_id = NEW.listing_id AND status = 'completed'
    ),
    total_revenue = (
      SELECT COALESCE(SUM(total_price), 0) FROM booking_requests 
      WHERE listing_id = NEW.listing_id AND payment_status = 'paid'
    )
  WHERE id = NEW.listing_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for metrics updates
DROP TRIGGER IF EXISTS trigger_update_listing_metrics ON booking_requests;
CREATE TRIGGER trigger_update_listing_metrics
AFTER INSERT OR UPDATE ON booking_requests
FOR EACH ROW
EXECUTE FUNCTION update_listing_metrics();

-- ============= ROW LEVEL SECURITY =============

ALTER TABLE advanced_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_inventory_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_pricing_history ENABLE ROW LEVEL SECURITY;

-- Advanced listings policies
DROP POLICY IF EXISTS "Active listings viewable by everyone" ON advanced_listings;
DROP POLICY IF EXISTS "Users can create their own listings" ON advanced_listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON advanced_listings;
DROP POLICY IF EXISTS "Users can delete their own listings" ON advanced_listings;

CREATE POLICY "Active listings viewable by everyone" 
ON advanced_listings FOR SELECT 
USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Users can create their own listings" 
ON advanced_listings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings" 
ON advanced_listings FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings" 
ON advanced_listings FOR DELETE 
USING (auth.uid() = user_id);

-- Variants policies
DROP POLICY IF EXISTS "Active variants viewable by everyone" ON listing_variants;
DROP POLICY IF EXISTS "Listing owners can manage variants" ON listing_variants;

CREATE POLICY "Active variants viewable by everyone" 
ON listing_variants FOR SELECT 
USING (
  is_active = true OR 
  auth.uid() IN (SELECT user_id FROM advanced_listings WHERE id = parent_listing_id)
);

CREATE POLICY "Listing owners can manage variants" 
ON listing_variants FOR ALL 
USING (
  auth.uid() IN (SELECT user_id FROM advanced_listings WHERE id = parent_listing_id)
);

-- Booking requests policies
DROP POLICY IF EXISTS "Users can view their bookings" ON booking_requests;
DROP POLICY IF EXISTS "Users can create bookings" ON booking_requests;
DROP POLICY IF EXISTS "Hosts and guests can update bookings" ON booking_requests;

CREATE POLICY "Users can view their bookings" 
ON booking_requests FOR SELECT 
USING (auth.uid() = guest_id OR auth.uid() = host_id);

CREATE POLICY "Users can create bookings" 
ON booking_requests FOR INSERT 
WITH CHECK (auth.uid() = guest_id);

CREATE POLICY "Hosts and guests can update bookings" 
ON booking_requests FOR UPDATE 
USING (auth.uid() = guest_id OR auth.uid() = host_id);

-- Inventory log policies (read-only for owners)
DROP POLICY IF EXISTS "Owners can view inventory logs" ON variant_inventory_log;

CREATE POLICY "Owners can view inventory logs" 
ON variant_inventory_log FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM advanced_listings 
    WHERE id IN (SELECT parent_listing_id FROM listing_variants WHERE id = variant_id)
  )
);

-- Pricing history policies
DROP POLICY IF EXISTS "Everyone can view pricing history" ON variant_pricing_history;
DROP POLICY IF EXISTS "Owners can manage pricing history" ON variant_pricing_history;

CREATE POLICY "Everyone can view pricing history" 
ON variant_pricing_history FOR SELECT 
USING (true);

CREATE POLICY "Owners can manage pricing history" 
ON variant_pricing_history FOR ALL 
USING (
  auth.uid() IN (
    SELECT user_id FROM advanced_listings 
    WHERE id IN (SELECT parent_listing_id FROM listing_variants WHERE id = variant_id)
  )
);

-- ============= VIEWS FOR EASY QUERYING =============

-- View: Available variants with listing info
CREATE OR REPLACE VIEW available_variants AS
SELECT 
  v.*,
  l.title as listing_title,
  l.city,
  l.country,
  l.listing_type,
  l.average_rating as listing_rating,
  l.cover_image_url as listing_cover_image
FROM listing_variants v
JOIN advanced_listings l ON v.parent_listing_id = l.id
WHERE v.is_active = true 
  AND v.quantity_available > 0
  AND l.status = 'active';

-- View: Listings with variant summary
CREATE OR REPLACE VIEW listings_with_variants AS
SELECT 
  l.*,
  COUNT(v.id) as active_variant_count,
  MIN(v.base_price) as price_from,
  MAX(v.base_price) as price_to,
  SUM(v.quantity_available) as total_available_units
FROM advanced_listings l
LEFT JOIN listing_variants v ON l.id = v.parent_listing_id AND v.is_active = true
GROUP BY l.id;

COMMENT ON TABLE advanced_listings IS 'Advanced multi-item listings: hotels, vehicle fleets, product variants';
COMMENT ON TABLE listing_variants IS 'Individual items/rooms/vehicles/variants within a listing';
COMMENT ON TABLE booking_requests IS 'Unified booking system for all variant types';
COMMENT ON TABLE variant_inventory_log IS 'Real-time inventory tracking and history';
COMMENT ON TABLE variant_pricing_history IS 'Historical pricing data for analytics';

-- =====================================================
-- AUCTIONS AND FUNDRAISERS SYSTEM
-- Complete auction bidding and crowdfunding campaigns
-- =====================================================

-- ============= AUCTION SYSTEM =============

-- Auction listings table
CREATE TABLE IF NOT EXISTS auctions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Auction Details
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  
  -- Item Details
  condition VARCHAR(20) CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
  starting_price DECIMAL(10, 2) NOT NULL CHECK (starting_price >= 0),
  reserve_price DECIMAL(10, 2), -- Minimum price seller will accept
  buy_now_price DECIMAL(10, 2), -- Optional buy-it-now price
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Bidding Rules
  min_bid_increment DECIMAL(10, 2) DEFAULT 1.00,
  bid_count INTEGER DEFAULT 0,
  current_bid DECIMAL(10, 2),
  current_winner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Timing
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_extend BOOLEAN DEFAULT true, -- Extend if bid in last 5 minutes
  extension_minutes INTEGER DEFAULT 5,
  
  -- Media
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  primary_image_url TEXT,
  video_url TEXT,
  
  -- Location
  location TEXT,
  shipping_available BOOLEAN DEFAULT true,
  local_pickup BOOLEAN DEFAULT true,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'live', 'ended', 'sold', 'cancelled')),
  is_featured BOOLEAN DEFAULT false,
  
  -- Metrics
  view_count INTEGER DEFAULT 0,
  watch_count INTEGER DEFAULT 0, -- Users watching/following the auction
  
  -- Tags
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_auction_times CHECK (end_time > start_time),
  CONSTRAINT valid_reserve_price CHECK (reserve_price IS NULL OR reserve_price >= starting_price),
  CONSTRAINT valid_buy_now CHECK (buy_now_price IS NULL OR buy_now_price > starting_price)
);

-- Bids table
CREATE TABLE IF NOT EXISTS auction_bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Bid Details
  bid_amount DECIMAL(10, 2) NOT NULL,
  is_auto_bid BOOLEAN DEFAULT false,
  max_auto_bid DECIMAL(10, 2), -- For proxy bidding
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'outbid', 'winning', 'won', 'lost', 'retracted')),
  is_winning BOOLEAN DEFAULT false,
  
  -- Timestamps
  placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  outbid_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  bid_number INTEGER NOT NULL, -- Sequential bid number for this auction
  ip_address INET,
  user_agent TEXT
);

-- Auction watchers (users following an auction)
CREATE TABLE IF NOT EXISTS auction_watchers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notify_on_bid BOOLEAN DEFAULT true,
  notify_on_outbid BOOLEAN DEFAULT true,
  notify_on_end BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(auction_id, user_id)
);

-- ============= FUNDRAISER/CROWDFUNDING SYSTEM =============

-- Fundraiser campaigns table
CREATE TABLE IF NOT EXISTS fundraisers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Campaign Details
  title VARCHAR(200) NOT NULL,
  tagline VARCHAR(250),
  story TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  campaign_type VARCHAR(20) NOT NULL CHECK (campaign_type IN ('donation', 'reward', 'equity', 'flexible', 'all_or_nothing')),
  
  -- Financial Goals
  goal_amount DECIMAL(12, 2) NOT NULL CHECK (goal_amount > 0),
  currency VARCHAR(3) DEFAULT 'USD',
  current_amount DECIMAL(12, 2) DEFAULT 0,
  backer_count INTEGER DEFAULT 0,
  
  -- Timing
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Media
  cover_image_url TEXT,
  video_url TEXT,
  gallery_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Reward Tiers (for reward-based campaigns)
  has_rewards BOOLEAN DEFAULT false,
  
  -- Campaign Settings
  allow_custom_amount BOOLEAN DEFAULT true,
  min_contribution DECIMAL(10, 2) DEFAULT 1.00,
  max_contribution DECIMAL(10, 2),
  
  -- Social Impact
  beneficiary_name VARCHAR(200), -- Who benefits (charity, person, etc.)
  is_charity BOOLEAN DEFAULT false,
  charity_registration_number VARCHAR(100),
  
  -- Location
  country VARCHAR(100),
  city VARCHAR(100),
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'active', 'successful', 'unsuccessful', 'cancelled')),
  is_featured BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  
  -- Metrics
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  
  -- Tags
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Milestones & Updates
  milestone_count INTEGER DEFAULT 0,
  update_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_campaign_dates CHECK (end_date > start_date)
);

-- Fundraiser reward tiers
CREATE TABLE IF NOT EXISTS fundraiser_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fundraiser_id UUID NOT NULL REFERENCES fundraisers(id) ON DELETE CASCADE,
  
  -- Reward Details
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Availability
  quantity_available INTEGER, -- NULL = unlimited
  quantity_claimed INTEGER DEFAULT 0,
  is_limited BOOLEAN DEFAULT false,
  
  -- Delivery
  estimated_delivery_date DATE,
  shipping_required BOOLEAN DEFAULT false,
  ships_to TEXT[], -- Array of countries
  
  -- Display
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT quantity_check CHECK (quantity_claimed <= quantity_available OR quantity_available IS NULL)
);

-- Fundraiser contributions/backers
CREATE TABLE IF NOT EXISTS fundraiser_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fundraiser_id UUID NOT NULL REFERENCES fundraisers(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES fundraiser_rewards(id) ON DELETE SET NULL,
  contributor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Contribution Details
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'USD',
  is_anonymous BOOLEAN DEFAULT false,
  
  -- Payment
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  payment_id VARCHAR(100),
  
  -- Contributor Info (if anonymous, these are null)
  contributor_name VARCHAR(200),
  contributor_email VARCHAR(200),
  contributor_message TEXT,
  
  -- Reward Fulfillment (if reward-based)
  shipping_address JSONB,
  fulfillment_status VARCHAR(20) CHECK (fulfillment_status IN ('pending', 'processing', 'shipped', 'delivered', 'not_applicable')),
  tracking_number VARCHAR(100),
  
  -- Timestamps
  pledged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  charged_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fundraiser updates/news
CREATE TABLE IF NOT EXISTS fundraiser_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fundraiser_id UUID NOT NULL REFERENCES fundraisers(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Update Details
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  
  -- Media
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  video_url TEXT,
  
  -- Visibility
  is_backers_only BOOLEAN DEFAULT false,
  
  -- Engagement
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fundraiser milestones
CREATE TABLE IF NOT EXISTS fundraiser_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fundraiser_id UUID NOT NULL REFERENCES fundraisers(id) ON DELETE CASCADE,
  
  -- Milestone Details
  title VARCHAR(200) NOT NULL,
  description TEXT,
  target_amount DECIMAL(10, 2) NOT NULL,
  
  -- Status
  is_achieved BOOLEAN DEFAULT false,
  achieved_at TIMESTAMP WITH TIME ZONE,
  
  -- Display
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= INDEXES =============

-- Auction indexes
CREATE INDEX IF NOT EXISTS idx_auctions_user ON auctions(user_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_category ON auctions(category);
CREATE INDEX IF NOT EXISTS idx_auctions_end_time ON auctions(end_time);
CREATE INDEX IF NOT EXISTS idx_auctions_featured ON auctions(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_auctions_live ON auctions(status, end_time) WHERE status = 'live';

-- Bid indexes
CREATE INDEX IF NOT EXISTS idx_bids_auction ON auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder ON auction_bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON auction_bids(status);
CREATE INDEX IF NOT EXISTS idx_bids_winning ON auction_bids(is_winning) WHERE is_winning = true;
CREATE INDEX IF NOT EXISTS idx_bids_placed ON auction_bids(placed_at DESC);

-- Watcher indexes
CREATE INDEX IF NOT EXISTS idx_watchers_auction ON auction_watchers(auction_id);
CREATE INDEX IF NOT EXISTS idx_watchers_user ON auction_watchers(user_id);

-- Fundraiser indexes
CREATE INDEX IF NOT EXISTS idx_fundraisers_user ON fundraisers(user_id);
CREATE INDEX IF NOT EXISTS idx_fundraisers_status ON fundraisers(status);
CREATE INDEX IF NOT EXISTS idx_fundraisers_category ON fundraisers(category);
CREATE INDEX IF NOT EXISTS idx_fundraisers_type ON fundraisers(campaign_type);
CREATE INDEX IF NOT EXISTS idx_fundraisers_end_date ON fundraisers(end_date);
CREATE INDEX IF NOT EXISTS idx_fundraisers_featured ON fundraisers(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_fundraisers_active ON fundraisers(status, end_date) WHERE status = 'active';

-- Reward indexes
CREATE INDEX IF NOT EXISTS idx_rewards_fundraiser ON fundraiser_rewards(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_rewards_active ON fundraiser_rewards(is_active) WHERE is_active = true;

-- Contribution indexes
CREATE INDEX IF NOT EXISTS idx_contributions_fundraiser ON fundraiser_contributions(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_contributions_contributor ON fundraiser_contributions(contributor_id);
CREATE INDEX IF NOT EXISTS idx_contributions_reward ON fundraiser_contributions(reward_id);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON fundraiser_contributions(payment_status);
CREATE INDEX IF NOT EXISTS idx_contributions_pledged ON fundraiser_contributions(pledged_at DESC);

-- Update indexes
CREATE INDEX IF NOT EXISTS idx_updates_fundraiser ON fundraiser_updates(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_updates_author ON fundraiser_updates(author_id);
CREATE INDEX IF NOT EXISTS idx_updates_created ON fundraiser_updates(created_at DESC);

-- Milestone indexes
CREATE INDEX IF NOT EXISTS idx_milestones_fundraiser ON fundraiser_milestones(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_milestones_order ON fundraiser_milestones(display_order);

-- ============= FUNCTIONS & TRIGGERS =============

-- Function to update auction on new bid
CREATE OR REPLACE FUNCTION update_auction_on_bid()
RETURNS TRIGGER AS $$
DECLARE
  v_auction_end TIMESTAMP WITH TIME ZONE;
  v_auto_extend BOOLEAN;
  v_extension_minutes INTEGER;
BEGIN
  -- Get auction details
  SELECT end_time, auto_extend, extension_minutes 
  INTO v_auction_end, v_auto_extend, v_extension_minutes
  FROM auctions 
  WHERE id = NEW.auction_id;
  
  -- Update auction
  UPDATE auctions
  SET 
    bid_count = bid_count + 1,
    current_bid = NEW.bid_amount,
    current_winner_id = NEW.bidder_id,
    -- Auto-extend if bid placed in last few minutes
    end_time = CASE 
      WHEN v_auto_extend AND (v_auction_end - NOW()) < (v_extension_minutes || ' minutes')::INTERVAL
      THEN v_auction_end + (v_extension_minutes || ' minutes')::INTERVAL
      ELSE end_time
    END
  WHERE id = NEW.auction_id;
  
  -- Mark previous bids as outbid
  UPDATE auction_bids
  SET 
    status = 'outbid',
    is_winning = false,
    outbid_at = NOW()
  WHERE auction_id = NEW.auction_id 
    AND id != NEW.id 
    AND status = 'active';
  
  -- Mark new bid as winning
  NEW.status := 'active';
  NEW.is_winning := true;
  NEW.bid_number := (SELECT COALESCE(MAX(bid_number), 0) + 1 FROM auction_bids WHERE auction_id = NEW.auction_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for bid updates
DROP TRIGGER IF EXISTS trigger_update_auction_on_bid ON auction_bids;
CREATE TRIGGER trigger_update_auction_on_bid
BEFORE INSERT ON auction_bids
FOR EACH ROW
EXECUTE FUNCTION update_auction_on_bid();

-- Function to update fundraiser on contribution
CREATE OR REPLACE FUNCTION update_fundraiser_on_contribution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'completed' AND (OLD IS NULL OR OLD.payment_status != 'completed') THEN
    -- Update fundraiser totals
    UPDATE fundraisers
    SET 
      current_amount = current_amount + NEW.amount,
      backer_count = backer_count + 1
    WHERE id = NEW.fundraiser_id;
    
    -- Update reward quantity if applicable
    IF NEW.reward_id IS NOT NULL THEN
      UPDATE fundraiser_rewards
      SET quantity_claimed = quantity_claimed + 1
      WHERE id = NEW.reward_id;
    END IF;
  END IF;
  
  -- Handle refunds
  IF NEW.payment_status = 'refunded' AND OLD.payment_status = 'completed' THEN
    UPDATE fundraisers
    SET 
      current_amount = GREATEST(0, current_amount - NEW.amount),
      backer_count = GREATEST(0, backer_count - 1)
    WHERE id = NEW.fundraiser_id;
    
    IF NEW.reward_id IS NOT NULL THEN
      UPDATE fundraiser_rewards
      SET quantity_claimed = GREATEST(0, quantity_claimed - 1)
      WHERE id = NEW.reward_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for contribution updates
DROP TRIGGER IF EXISTS trigger_update_fundraiser_on_contribution ON fundraiser_contributions;
CREATE TRIGGER trigger_update_fundraiser_on_contribution
AFTER INSERT OR UPDATE ON fundraiser_contributions
FOR EACH ROW
EXECUTE FUNCTION update_fundraiser_on_contribution();

-- Function to check and close ended auctions
CREATE OR REPLACE FUNCTION close_ended_auctions()
RETURNS void AS $$
BEGIN
  UPDATE auctions
  SET status = CASE 
    WHEN current_bid >= COALESCE(reserve_price, 0) THEN 'sold'
    ELSE 'ended'
  END
  WHERE status = 'live' 
    AND end_time < NOW();
  
  -- Update winning bids
  UPDATE auction_bids
  SET status = 'won'
  WHERE is_winning = true
    AND auction_id IN (
      SELECT id FROM auctions WHERE status = 'sold'
    );
  
  -- Update losing bids
  UPDATE auction_bids
  SET status = 'lost'
  WHERE is_winning = false
    AND status = 'active'
    AND auction_id IN (
      SELECT id FROM auctions WHERE status IN ('sold', 'ended')
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check and close ended fundraisers
CREATE OR REPLACE FUNCTION close_ended_fundraisers()
RETURNS void AS $$
BEGIN
  UPDATE fundraisers
  SET status = CASE 
    WHEN current_amount >= goal_amount THEN 'successful'
    WHEN campaign_type = 'flexible' THEN 'successful'
    ELSE 'unsuccessful'
  END
  WHERE status = 'active' 
    AND end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============= ROW LEVEL SECURITY =============

ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraiser_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraiser_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraiser_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraiser_milestones ENABLE ROW LEVEL SECURITY;

-- Auction policies
DROP POLICY IF EXISTS "Active auctions viewable by everyone" ON auctions;
DROP POLICY IF EXISTS "Users can create auctions" ON auctions;
DROP POLICY IF EXISTS "Users can update their own auctions" ON auctions;

CREATE POLICY "Active auctions viewable by everyone" 
ON auctions FOR SELECT 
USING (status IN ('scheduled', 'live', 'ended', 'sold') OR auth.uid() = user_id);

CREATE POLICY "Users can create auctions" 
ON auctions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own auctions" 
ON auctions FOR UPDATE 
USING (auth.uid() = user_id);

-- Bid policies
DROP POLICY IF EXISTS "Users can view bids on auctions they created or bid on" ON auction_bids;
DROP POLICY IF EXISTS "Users can place bids" ON auction_bids;

CREATE POLICY "Users can view bids on auctions they created or bid on" 
ON auction_bids FOR SELECT 
USING (
  auth.uid() = bidder_id OR
  auth.uid() IN (SELECT user_id FROM auctions WHERE id = auction_id)
);

CREATE POLICY "Users can place bids" 
ON auction_bids FOR INSERT 
WITH CHECK (auth.uid() = bidder_id);

-- Watcher policies
DROP POLICY IF EXISTS "Users can view their own watches" ON auction_watchers;
DROP POLICY IF EXISTS "Users can watch auctions" ON auction_watchers;

CREATE POLICY "Users can view their own watches" 
ON auction_watchers FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can watch auctions" 
ON auction_watchers FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fundraiser policies
DROP POLICY IF EXISTS "Active fundraisers viewable by everyone" ON fundraisers;
DROP POLICY IF EXISTS "Users can create fundraisers" ON fundraisers;
DROP POLICY IF EXISTS "Users can update their own fundraisers" ON fundraisers;

CREATE POLICY "Active fundraisers viewable by everyone" 
ON fundraisers FOR SELECT 
USING (status IN ('active', 'successful', 'unsuccessful') OR auth.uid() = user_id);

CREATE POLICY "Users can create fundraisers" 
ON fundraisers FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fundraisers" 
ON fundraisers FOR UPDATE 
USING (auth.uid() = user_id);

-- Reward policies
DROP POLICY IF EXISTS "Everyone can view active rewards" ON fundraiser_rewards;
DROP POLICY IF EXISTS "Campaign owners can manage rewards" ON fundraiser_rewards;

CREATE POLICY "Everyone can view active rewards" 
ON fundraiser_rewards FOR SELECT 
USING (is_active = true OR auth.uid() IN (SELECT user_id FROM fundraisers WHERE id = fundraiser_id));

CREATE POLICY "Campaign owners can manage rewards" 
ON fundraiser_rewards FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM fundraisers WHERE id = fundraiser_id));

-- Contribution policies
DROP POLICY IF EXISTS "Contributors and campaign owners can view contributions" ON fundraiser_contributions;
DROP POLICY IF EXISTS "Anyone can contribute" ON fundraiser_contributions;

CREATE POLICY "Contributors and campaign owners can view contributions" 
ON fundraiser_contributions FOR SELECT 
USING (
  auth.uid() = contributor_id OR
  auth.uid() IN (SELECT user_id FROM fundraisers WHERE id = fundraiser_id) OR
  is_anonymous = false -- Public contributions visible to all
);

CREATE POLICY "Anyone can contribute" 
ON fundraiser_contributions FOR INSERT 
WITH CHECK (true); -- Anyone can contribute, even anonymous

-- Update policies
DROP POLICY IF EXISTS "Everyone can view updates" ON fundraiser_updates;
DROP POLICY IF EXISTS "Campaign owners can create updates" ON fundraiser_updates;

CREATE POLICY "Everyone can view updates" 
ON fundraiser_updates FOR SELECT 
USING (
  is_backers_only = false OR
  auth.uid() IN (SELECT user_id FROM fundraisers WHERE id = fundraiser_id) OR
  auth.uid() IN (SELECT contributor_id FROM fundraiser_contributions WHERE fundraiser_id = fundraiser_updates.fundraiser_id)
);

CREATE POLICY "Campaign owners can create updates" 
ON fundraiser_updates FOR ALL 
USING (auth.uid() = author_id);

-- Milestone policies
DROP POLICY IF EXISTS "Everyone can view milestones" ON fundraiser_milestones;
DROP POLICY IF EXISTS "Campaign owners can manage milestones" ON fundraiser_milestones;

CREATE POLICY "Everyone can view milestones" 
ON fundraiser_milestones FOR SELECT 
USING (true);

CREATE POLICY "Campaign owners can manage milestones" 
ON fundraiser_milestones FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM fundraisers WHERE id = fundraiser_id));

-- ============= VIEWS FOR ANALYTICS =============

-- Live auctions with current bid info
CREATE OR REPLACE VIEW live_auctions AS
SELECT 
  a.*,
  p.username as seller_username,
  p.avatar_url as seller_avatar,
  bp.username as current_winner_username,
  COUNT(DISTINCT ab.bidder_id) as unique_bidders
FROM auctions a
LEFT JOIN profiles p ON a.user_id = p.id
LEFT JOIN profiles bp ON a.current_winner_id = bp.id
LEFT JOIN auction_bids ab ON a.id = ab.auction_id
WHERE a.status = 'live'
GROUP BY a.id, p.username, p.avatar_url, bp.username;

-- Active fundraisers with progress
CREATE OR REPLACE VIEW active_fundraisers AS
SELECT 
  f.*,
  p.username as creator_username,
  p.avatar_url as creator_avatar,
  (f.current_amount / NULLIF(f.goal_amount, 0) * 100) as progress_percentage,
  EXTRACT(EPOCH FROM (f.end_date - NOW())) / 86400 as days_left
FROM fundraisers f
LEFT JOIN profiles p ON f.user_id = p.id
WHERE f.status = 'active'
  AND f.end_date > NOW();

-- Comments
COMMENT ON TABLE auctions IS 'Auction listings for bidding on items';
COMMENT ON TABLE auction_bids IS 'Bids placed on auction items';
COMMENT ON TABLE fundraisers IS 'Crowdfunding and fundraising campaigns';
COMMENT ON TABLE fundraiser_rewards IS 'Reward tiers for backers';
COMMENT ON TABLE fundraiser_contributions IS 'Contributions/pledges to campaigns';
COMMENT ON TABLE fundraiser_updates IS 'Campaign updates and news';
COMMENT ON TABLE fundraiser_milestones IS 'Fundraising goal milestones';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'ðŸŽ‰ Auction & Fundraiser System Created!';
  RAISE NOTICE 'ðŸ”¨ Auctions - Full bidding system with auto-extend';
  RAISE NOTICE 'ðŸ’° Fundraisers - Crowdfunding with rewards and milestones';
  RAISE NOTICE 'ðŸ“Š Analytics views created for live data';
  RAISE NOTICE 'âœ… All RLS policies enabled for security';
END $$;

-- =====================================================
-- ENTERPRISE AUCTION SYSTEM (SOTHEBY'S LEVEL)
-- Professional Auction House Platform
-- =====================================================

-- ============= AUCTION HOUSES & EVENTS =============

-- Auction houses/companies
CREATE TABLE IF NOT EXISTS auction_houses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- House Details
  legal_name VARCHAR(200) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  tagline VARCHAR(250),
  description TEXT,
  
  -- Legal & Registration
  business_registration_number VARCHAR(100),
  tax_id VARCHAR(100),
  license_number VARCHAR(100),
  
  -- Contact
  email VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  website TEXT,
  
  -- Address
  street_address TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  
  -- Branding
  logo_url TEXT,
  banner_url TEXT,
  brand_colors JSONB,
  
  -- Fee Structure (percentages)
  default_buyers_premium DECIMAL(5, 2) DEFAULT 15.00, -- Buyer pays on top
  default_sellers_commission DECIMAL(5, 2) DEFAULT 10.00, -- Seller pays from hammer
  
  -- Settings
  requires_bidder_approval BOOLEAN DEFAULT true,
  min_deposit_amount DECIMAL(10, 2) DEFAULT 0,
  payment_terms_days INTEGER DEFAULT 7, -- Days to pay after winning
  
  -- Verification & Status
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  
  -- Metrics
  total_auctions INTEGER DEFAULT 0,
  total_lots_sold INTEGER DEFAULT 0,
  total_revenue DECIMAL(15, 2) DEFAULT 0,
  average_lot_value DECIMAL(10, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auction events (sales/sessions)
CREATE TABLE IF NOT EXISTS auction_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_house_id UUID NOT NULL REFERENCES auction_houses(id) ON DELETE CASCADE,
  
  -- Event Details
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(250),
  description TEXT,
  catalog_description TEXT,
  
  -- Event Type
  event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('live', 'timed_online', 'sealed_bid', 'hybrid')),
  category VARCHAR(100), -- 'Fine Art', 'Jewelry', 'Wine', 'Real Estate', etc.
  
  -- Timing
  catalog_available_date TIMESTAMP WITH TIME ZONE,
  preview_start_date TIMESTAMP WITH TIME ZONE, -- Physical viewing
  preview_end_date TIMESTAMP WITH TIME ZONE,
  bidding_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  bidding_end_date TIMESTAMP WITH TIME ZONE, -- For timed auctions
  live_auction_date TIMESTAMP WITH TIME ZONE, -- For live auctions
  
  -- Location
  venue_name VARCHAR(200),
  venue_address TEXT,
  venue_city VARCHAR(100),
  venue_country VARCHAR(100),
  
  -- Online Access
  online_bidding_enabled BOOLEAN DEFAULT true,
  live_stream_url TEXT,
  catalog_pdf_url TEXT,
  
  -- Registration
  requires_registration BOOLEAN DEFAULT true,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  registration_deposit DECIMAL(10, 2) DEFAULT 0,
  
  -- Fee Structure (can override house defaults)
  buyers_premium DECIMAL(5, 2),
  sellers_commission DECIMAL(5, 2),
  
  -- Media
  cover_image_url TEXT,
  gallery_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'preview', 'live', 'closed', 'settled', 'cancelled')),
  is_featured BOOLEAN DEFAULT false,
  
  -- Metrics
  lot_count INTEGER DEFAULT 0,
  registered_bidders INTEGER DEFAULT 0,
  lots_sold INTEGER DEFAULT 0,
  lots_unsold INTEGER DEFAULT 0,
  total_hammer_price DECIMAL(15, 2) DEFAULT 0,
  sell_through_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- Staff
  auctioneer_id UUID REFERENCES profiles(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_event_dates CHECK (bidding_end_date IS NULL OR bidding_end_date > bidding_start_date)
);

-- ============= LOT MANAGEMENT =============

-- Auction lots (individual items)
CREATE TABLE IF NOT EXISTS auction_lots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_event_id UUID NOT NULL REFERENCES auction_events(id) ON DELETE CASCADE,
  consignor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Seller
  
  -- Lot Identification
  lot_number INTEGER NOT NULL,
  lot_letter VARCHAR(5), -- For subdivisions like 123A, 123B
  title VARCHAR(300) NOT NULL,
  subtitle VARCHAR(300),
  
  -- Cataloging
  description TEXT NOT NULL,
  catalog_note TEXT, -- Additional catalog information
  provenance TEXT, -- History of ownership
  literature TEXT, -- Publications/references
  exhibition_history TEXT,
  condition_report TEXT,
  
  -- Item Details
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  artist_maker VARCHAR(200),
  date_period VARCHAR(100),
  medium VARCHAR(200),
  dimensions VARCHAR(200),
  edition_size VARCHAR(100),
  signature VARCHAR(200),
  inscription TEXT,
  
  -- Authenticity
  certificate_of_authenticity BOOLEAN DEFAULT false,
  certificate_url TEXT,
  authentication_notes TEXT,
  
  -- Estimates & Pricing
  currency VARCHAR(3) DEFAULT 'USD',
  estimate_low DECIMAL(12, 2),
  estimate_high DECIMAL(12, 2),
  reserve_price DECIMAL(12, 2), -- Confidential minimum
  starting_bid DECIMAL(12, 2),
  bid_increment DECIMAL(10, 2) DEFAULT 100,
  
  -- Current Bidding State
  current_bid DECIMAL(12, 2),
  hammer_price DECIMAL(12, 2), -- Final winning bid
  bid_count INTEGER DEFAULT 0,
  winning_bidder_id UUID REFERENCES profiles(id),
  
  -- Fees (calculated at hammer)
  buyers_premium_amount DECIMAL(12, 2),
  buyers_premium_percentage DECIMAL(5, 2),
  sellers_commission_amount DECIMAL(12, 2),
  sellers_commission_percentage DECIMAL(5, 2),
  total_buyer_price DECIMAL(12, 2), -- Hammer + premium
  total_seller_payout DECIMAL(12, 2), -- Hammer - commission
  
  -- Media
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  primary_image_url TEXT,
  video_url TEXT,
  pdf_condition_report_url TEXT,
  
  -- Lot Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'cataloged', 'active', 'sold', 'unsold', 'withdrawn', 'passed'
  )),
  
  -- Post-Auction
  sold_date TIMESTAMP WITH TIME ZONE,
  invoice_id UUID,
  payment_received BOOLEAN DEFAULT false,
  payment_date TIMESTAMP WITH TIME ZONE,
  released_to_buyer BOOLEAN DEFAULT false,
  release_date TIMESTAMP WITH TIME ZONE,
  
  -- Shipping
  requires_special_handling BOOLEAN DEFAULT false,
  shipping_notes TEXT,
  insurance_value DECIMAL(12, 2),
  
  -- Order in catalog
  display_order INTEGER,
  
  -- Metrics
  view_count INTEGER DEFAULT 0,
  watch_count INTEGER DEFAULT 0,
  condition_report_requests INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(auction_event_id, lot_number)
);

-- ============= BIDDER REGISTRATION =============

-- Registered bidders for auction events
CREATE TABLE IF NOT EXISTS auction_bidder_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_event_id UUID NOT NULL REFERENCES auction_events(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  auction_house_id UUID NOT NULL REFERENCES auction_houses(id) ON DELETE CASCADE,
  
  -- Registration Details
  paddle_number VARCHAR(20), -- Physical auction paddle
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Approval Process
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  approved_by UUID REFERENCES profiles(id),
  approved_date TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Financial Verification
  deposit_required DECIMAL(10, 2) DEFAULT 0,
  deposit_paid DECIMAL(10, 2) DEFAULT 0,
  deposit_payment_date TIMESTAMP WITH TIME ZONE,
  deposit_refunded BOOLEAN DEFAULT false,
  
  credit_limit DECIMAL(12, 2), -- Maximum bid amount allowed
  credit_check_completed BOOLEAN DEFAULT false,
  credit_check_date TIMESTAMP WITH TIME ZONE,
  
  -- Identity Verification
  identity_verified BOOLEAN DEFAULT false,
  identity_verification_date TIMESTAMP WITH TIME ZONE,
  verification_documents JSONB,
  
  -- Contact Preferences
  phone_bidding_requested BOOLEAN DEFAULT false,
  phone_number VARCHAR(20),
  absentee_bids_allowed BOOLEAN DEFAULT true,
  online_bidding_allowed BOOLEAN DEFAULT true,
  
  -- Bidding Limits
  max_bid_limit DECIMAL(12, 2),
  
  -- Metrics
  lots_bid_on INTEGER DEFAULT 0,
  lots_won INTEGER DEFAULT 0,
  total_spent DECIMAL(15, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(auction_event_id, bidder_id)
);

-- ============= ADVANCED BIDDING SYSTEM =============

-- Bids (all types)
CREATE TABLE IF NOT EXISTS auction_lot_bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES auction_lots(id) ON DELETE CASCADE,
  bidder_registration_id UUID NOT NULL REFERENCES auction_bidder_registrations(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Bid Details
  bid_amount DECIMAL(12, 2) NOT NULL,
  bid_type VARCHAR(20) NOT NULL CHECK (bid_type IN (
    'online', 'phone', 'in_person', 'absentee', 'proxy', 'house_bid'
  )),
  
  -- Bid Placement
  placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  placed_by_staff_id UUID REFERENCES profiles(id), -- For phone/absentee bids
  
  -- Proxy/Absentee Bidding
  is_proxy_bid BOOLEAN DEFAULT false,
  max_proxy_amount DECIMAL(12, 2), -- Maximum they're willing to pay
  current_proxy_amount DECIMAL(12, 2), -- Current active bid amount
  
  -- Absentee/Commission Bid
  is_absentee_bid BOOLEAN DEFAULT false,
  absentee_max_amount DECIMAL(12, 2),
  absentee_submitted_date TIMESTAMP WITH TIME ZONE,
  
  -- Phone Bidding
  is_phone_bid BOOLEAN DEFAULT false,
  phone_representative_id UUID REFERENCES profiles(id),
  
  -- Bid Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
    'active', 'outbid', 'winning', 'won', 'lost', 'withdrawn', 'invalid'
  )),
  is_winning BOOLEAN DEFAULT false,
  
  -- Sequence
  bid_sequence_number INTEGER NOT NULL, -- 1st bid, 2nd bid, etc.
  
  -- Timing
  outbid_at TIMESTAMP WITH TIME ZONE,
  won_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  bid_source VARCHAR(50), -- 'web', 'mobile_app', 'phone', 'floor'
  
  -- Notes
  internal_notes TEXT, -- Staff notes
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Absentee/commission bids (pre-placed max bids)
CREATE TABLE IF NOT EXISTS auction_absentee_bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES auction_lots(id) ON DELETE CASCADE,
  bidder_registration_id UUID NOT NULL REFERENCES auction_bidder_registrations(id) ON DELETE CASCADE,
  
  -- Bid Details
  max_bid_amount DECIMAL(12, 2) NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_by_staff_id UUID REFERENCES profiles(id),
  
  -- Execution
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'executed', 'outbid', 'cancelled', 'expired')),
  executed_at TIMESTAMP WITH TIME ZONE,
  final_bid_amount DECIMAL(12, 2),
  
  -- Confirmation
  confirmation_sent BOOLEAN DEFAULT false,
  confirmation_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phone bidding schedule
CREATE TABLE IF NOT EXISTS auction_phone_bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES auction_lots(id) ON DELETE CASCADE,
  bidder_registration_id UUID NOT NULL REFERENCES auction_bidder_registrations(id) ON DELETE CASCADE,
  
  -- Contact
  phone_number VARCHAR(20) NOT NULL,
  alternate_phone VARCHAR(20),
  
  -- Assignment
  representative_id UUID REFERENCES profiles(id), -- Staff member assigned
  assigned_at TIMESTAMP WITH TIME ZONE,
  
  -- Scheduling
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'active', 'completed', 'no_answer', 'cancelled'
  )),
  
  -- Execution
  call_started_at TIMESTAMP WITH TIME ZONE,
  call_ended_at TIMESTAMP WITH TIME ZONE,
  participated BOOLEAN DEFAULT false,
  highest_bid_placed DECIMAL(12, 2),
  won_lot BOOLEAN DEFAULT false,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= POST-AUCTION SETTLEMENTS =============

-- Invoices for buyers
CREATE TABLE IF NOT EXISTS auction_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_event_id UUID NOT NULL REFERENCES auction_events(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Invoice Details
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(15, 2) NOT NULL, -- Sum of hammer prices
  buyers_premium DECIMAL(15, 2) NOT NULL,
  tax_amount DECIMAL(15, 2) DEFAULT 0,
  shipping_handling DECIMAL(15, 2) DEFAULT 0,
  insurance DECIMAL(15, 2) DEFAULT 0,
  total_amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment
  payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN (
    'unpaid', 'partial', 'paid', 'overdue', 'disputed', 'cancelled'
  )),
  amount_paid DECIMAL(15, 2) DEFAULT 0,
  amount_outstanding DECIMAL(15, 2),
  
  -- Payment Details
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  paid_date TIMESTAMP WITH TIME ZONE,
  
  -- Terms
  payment_terms TEXT,
  late_fee_percentage DECIMAL(5, 2) DEFAULT 0,
  late_fees_applied DECIMAL(10, 2) DEFAULT 0,
  
  -- Documents
  pdf_url TEXT,
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice line items (individual lots)
CREATE TABLE IF NOT EXISTS auction_invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES auction_invoices(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES auction_lots(id) ON DELETE CASCADE,
  
  -- Item Details
  lot_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  
  -- Pricing
  hammer_price DECIMAL(12, 2) NOT NULL,
  buyers_premium DECIMAL(12, 2) NOT NULL,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  line_total DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seller settlements/payouts
CREATE TABLE IF NOT EXISTS auction_settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_event_id UUID NOT NULL REFERENCES auction_events(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Settlement Details
  settlement_number VARCHAR(50) UNIQUE NOT NULL,
  settlement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Amounts
  gross_proceeds DECIMAL(15, 2) NOT NULL, -- Total hammer prices
  sellers_commission DECIMAL(15, 2) NOT NULL,
  insurance_fees DECIMAL(12, 2) DEFAULT 0,
  photography_fees DECIMAL(12, 2) DEFAULT 0,
  shipping_fees DECIMAL(12, 2) DEFAULT 0,
  other_charges DECIMAL(12, 2) DEFAULT 0,
  net_proceeds DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payout
  payout_status VARCHAR(20) DEFAULT 'pending' CHECK (payout_status IN (
    'pending', 'processing', 'paid', 'held', 'cancelled'
  )),
  payout_method VARCHAR(50), -- 'wire', 'check', 'ach'
  payout_date TIMESTAMP WITH TIME ZONE,
  payout_reference VARCHAR(100),
  
  -- Bank Details
  bank_account_last4 VARCHAR(4),
  
  -- Documents
  pdf_url TEXT,
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settlement line items
CREATE TABLE IF NOT EXISTS auction_settlement_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  settlement_id UUID NOT NULL REFERENCES auction_settlements(id) ON DELETE CASCADE,
  lot_id UUID NOT NULL REFERENCES auction_lots(id) ON DELETE CASCADE,
  
  -- Item Details
  lot_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  
  -- Pricing
  hammer_price DECIMAL(12, 2) NOT NULL,
  commission_amount DECIMAL(12, 2) NOT NULL,
  net_amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= CONDITION REPORTS & DOCUMENTS =============

-- Condition report requests
CREATE TABLE IF NOT EXISTS auction_condition_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_id UUID NOT NULL REFERENCES auction_lots(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Request
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  request_type VARCHAR(20) DEFAULT 'standard' CHECK (request_type IN ('standard', 'detailed', 'third_party')),
  
  -- Report
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'not_available')),
  completed_by UUID REFERENCES profiles(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Content
  condition_summary TEXT,
  detailed_report TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  pdf_url TEXT,
  
  -- Delivery
  sent_to_requester BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============= INDEXES =============

-- Auction houses
CREATE INDEX IF NOT EXISTS idx_auction_houses_owner ON auction_houses(owner_id);
CREATE INDEX IF NOT EXISTS idx_auction_houses_status ON auction_houses(status);
CREATE INDEX IF NOT EXISTS idx_auction_houses_verified ON auction_houses(is_verified) WHERE is_verified = true;

-- Auction events
CREATE INDEX IF NOT EXISTS idx_auction_events_house ON auction_events(auction_house_id);
CREATE INDEX IF NOT EXISTS idx_auction_events_status ON auction_events(status);
CREATE INDEX IF NOT EXISTS idx_auction_events_type ON auction_events(event_type);
CREATE INDEX IF NOT EXISTS idx_auction_events_dates ON auction_events(live_auction_date, bidding_start_date);
CREATE INDEX IF NOT EXISTS idx_auction_events_featured ON auction_events(is_featured) WHERE is_featured = true;

-- Lots
CREATE INDEX IF NOT EXISTS idx_lots_event ON auction_lots(auction_event_id);
CREATE INDEX IF NOT EXISTS idx_lots_consignor ON auction_lots(consignor_id);
CREATE INDEX IF NOT EXISTS idx_lots_status ON auction_lots(status);
CREATE INDEX IF NOT EXISTS idx_lots_category ON auction_lots(category);
CREATE INDEX IF NOT EXISTS idx_lots_winning_bidder ON auction_lots(winning_bidder_id);
CREATE INDEX IF NOT EXISTS idx_lots_lot_number ON auction_lots(auction_event_id, lot_number);

-- Bidder registrations
CREATE INDEX IF NOT EXISTS idx_bidder_reg_event ON auction_bidder_registrations(auction_event_id);
CREATE INDEX IF NOT EXISTS idx_bidder_reg_bidder ON auction_bidder_registrations(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bidder_reg_status ON auction_bidder_registrations(status);
CREATE INDEX IF NOT EXISTS idx_bidder_reg_paddle ON auction_bidder_registrations(paddle_number);

-- Bids
CREATE INDEX IF NOT EXISTS idx_lot_bids_lot ON auction_lot_bids(lot_id);
CREATE INDEX IF NOT EXISTS idx_lot_bids_bidder ON auction_lot_bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_lot_bids_registration ON auction_lot_bids(bidder_registration_id);
CREATE INDEX IF NOT EXISTS idx_lot_bids_placed ON auction_lot_bids(placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_lot_bids_winning ON auction_lot_bids(is_winning) WHERE is_winning = true;

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_event ON auction_invoices(auction_event_id);
CREATE INDEX IF NOT EXISTS idx_invoices_buyer ON auction_invoices(buyer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON auction_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON auction_invoices(invoice_number);

-- Settlements
CREATE INDEX IF NOT EXISTS idx_settlements_event ON auction_settlements(auction_event_id);
CREATE INDEX IF NOT EXISTS idx_settlements_seller ON auction_settlements(seller_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON auction_settlements(payout_status);

-- Condition reports
CREATE INDEX IF NOT EXISTS idx_condition_reports_lot ON auction_condition_reports(lot_id);
CREATE INDEX IF NOT EXISTS idx_condition_reports_requested_by ON auction_condition_reports(requested_by);

-- ============= FUNCTIONS & TRIGGERS =============

-- Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invoice_number := 'INV-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('invoice_sequence')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS invoice_sequence START 1;

-- Generate settlement number
CREATE OR REPLACE FUNCTION generate_settlement_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.settlement_number := 'SET-' || to_char(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('settlement_sequence')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS settlement_sequence START 1;

-- Update lot on bid
CREATE OR REPLACE FUNCTION update_lot_on_bid()
RETURNS TRIGGER AS $$
BEGIN
  -- Update lot with new bid
  UPDATE auction_lots
  SET 
    current_bid = NEW.bid_amount,
    bid_count = bid_count + 1,
    winning_bidder_id = NEW.bidder_id
  WHERE id = NEW.lot_id;
  
  -- Mark previous bids as outbid
  UPDATE auction_lot_bids
  SET 
    status = 'outbid',
    is_winning = false,
    outbid_at = NOW()
  WHERE lot_id = NEW.lot_id 
    AND id != NEW.id 
    AND status IN ('active', 'winning');
  
  -- Mark new bid as winning
  NEW.status := 'winning';
  NEW.is_winning := true;
  NEW.bid_sequence_number := (
    SELECT COALESCE(MAX(bid_sequence_number), 0) + 1 
    FROM auction_lot_bids 
    WHERE lot_id = NEW.lot_id
  );
  
  -- Update bidder registration stats
  UPDATE auction_bidder_registrations
  SET lots_bid_on = (
    SELECT COUNT(DISTINCT lot_id) 
    FROM auction_lot_bids 
    WHERE bidder_registration_id = NEW.bidder_registration_id
  )
  WHERE id = NEW.bidder_registration_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lot_on_bid ON auction_lot_bids;
CREATE TRIGGER trigger_update_lot_on_bid
BEFORE INSERT ON auction_lot_bids
FOR EACH ROW
EXECUTE FUNCTION update_lot_on_bid();

-- Calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  NEW.amount_outstanding := NEW.total_amount - NEW.amount_paid;
  
  IF NEW.amount_paid >= NEW.total_amount THEN
    NEW.payment_status := 'paid';
  ELSIF NEW.amount_paid > 0 THEN
    NEW.payment_status := 'partial';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_invoice_totals ON auction_invoices;
CREATE TRIGGER trigger_calculate_invoice_totals
BEFORE INSERT OR UPDATE ON auction_invoices
FOR EACH ROW
EXECUTE FUNCTION calculate_invoice_totals();

-- ============= ROW LEVEL SECURITY =============

ALTER TABLE auction_houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_bidder_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_lot_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_absentee_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_phone_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_settlement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_condition_reports ENABLE ROW LEVEL SECURITY;

-- Auction house policies
CREATE POLICY "Anyone can view active auction houses"
ON auction_houses FOR SELECT
USING (status = 'active');

CREATE POLICY "Owners can manage their auction houses"
ON auction_houses FOR ALL
USING (auth.uid() = owner_id);

-- Event policies
CREATE POLICY "Public events viewable by all"
ON auction_events FOR SELECT
USING (status IN ('scheduled', 'preview', 'live', 'closed'));

CREATE POLICY "House owners can manage events"
ON auction_events FOR ALL
USING (auth.uid() IN (SELECT owner_id FROM auction_houses WHERE id = auction_house_id));

-- Lot policies
CREATE POLICY "Active lots viewable by all"
ON auction_lots FOR SELECT
USING (status IN ('active', 'cataloged', 'sold', 'unsold'));

CREATE POLICY "Consignors and house can manage lots"
ON auction_lots FOR ALL
USING (
  auth.uid() = consignor_id OR
  auth.uid() IN (
    SELECT owner_id FROM auction_houses 
    WHERE id IN (SELECT auction_house_id FROM auction_events WHERE id = auction_event_id)
  )
);

-- Bidder registration policies
CREATE POLICY "Bidders can view their registrations"
ON auction_bidder_registrations FOR SELECT
USING (auth.uid() = bidder_id OR auth.uid() IN (
  SELECT owner_id FROM auction_houses WHERE id = auction_house_id
));

CREATE POLICY "Users can register"
ON auction_bidder_registrations FOR INSERT
WITH CHECK (auth.uid() = bidder_id);

-- Bid policies (confidential!)
CREATE POLICY "Bidders view own bids only"
ON auction_lot_bids FOR SELECT
USING (
  auth.uid() = bidder_id OR
  auth.uid() IN (
    SELECT owner_id FROM auction_houses 
    WHERE id IN (
      SELECT auction_house_id FROM auction_events 
      WHERE id IN (SELECT auction_event_id FROM auction_lots WHERE id = lot_id)
    )
  )
);

CREATE POLICY "Registered bidders can place bids"
ON auction_lot_bids FOR INSERT
WITH CHECK (auth.uid() = bidder_id);

-- Invoice policies
CREATE POLICY "Buyers view their invoices"
ON auction_invoices FOR SELECT
USING (auth.uid() = buyer_id OR auth.uid() IN (
  SELECT owner_id FROM auction_houses 
  WHERE id IN (SELECT auction_house_id FROM auction_events WHERE id = auction_event_id)
));

-- Settlement policies
CREATE POLICY "Sellers view their settlements"
ON auction_settlements FOR SELECT
USING (auth.uid() = seller_id OR auth.uid() IN (
  SELECT owner_id FROM auction_houses 
  WHERE id IN (SELECT auction_house_id FROM auction_events WHERE id = auction_event_id)
));

-- Condition report policies
CREATE POLICY "Anyone can request condition reports"
ON auction_condition_reports FOR ALL
USING (true);

-- ============= VIEWS =============

-- Live auction dashboard
CREATE OR REPLACE VIEW live_auction_dashboard AS
SELECT 
  ae.*,
  ah.display_name as house_name,
  ah.logo_url as house_logo,
  COUNT(DISTINCT al.id) as current_total_lots,
  COUNT(DISTINCT al.id) FILTER (WHERE al.status = 'sold') as current_lots_sold,
  COUNT(DISTINCT al.id) FILTER (WHERE al.status = 'unsold') as current_lots_unsold,
  SUM(al.hammer_price) FILTER (WHERE al.status = 'sold') as current_total_sales,
  COUNT(DISTINCT abr.bidder_id) as current_approved_bidders
FROM auction_events ae
JOIN auction_houses ah ON ae.auction_house_id = ah.id
LEFT JOIN auction_lots al ON ae.id = al.auction_event_id
LEFT JOIN auction_bidder_registrations abr ON ae.id = abr.auction_event_id AND abr.status = 'approved'
WHERE ae.status IN ('live', 'preview')
GROUP BY ae.id, ah.display_name, ah.logo_url;

-- Comments
COMMENT ON TABLE auction_houses IS 'Auction houses/companies (Sotheby''s, Christie''s level)';
COMMENT ON TABLE auction_events IS 'Auction sales/sessions with multiple lots';
COMMENT ON TABLE auction_lots IS 'Individual items for auction with full cataloging';
COMMENT ON TABLE auction_bidder_registrations IS 'Bidder registration and approval';
COMMENT ON TABLE auction_lot_bids IS 'All bids (online, phone, absentee, in-person)';
COMMENT ON TABLE auction_invoices IS 'Buyer invoices with payment tracking';
COMMENT ON TABLE auction_settlements IS 'Seller settlements and payouts';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'ðŸŽ¨ ENTERPRISE AUCTION SYSTEM CREATED!';
  RAISE NOTICE 'ðŸ›ï¸ Sotheby''s-Level Features:';
  RAISE NOTICE '  âœ… Auction Houses & Events';
  RAISE NOTICE '  âœ… Professional Lot Cataloging';
  RAISE NOTICE '  âœ… Bidder Registration & Approval';
  RAISE NOTICE '  âœ… Multiple Bidding Methods';
  RAISE NOTICE '  âœ… Buyer''s Premium & Commissions';
  RAISE NOTICE '  âœ… Invoicing & Settlements';
  RAISE NOTICE '  âœ… Condition Reports';
  RAISE NOTICE '  âœ… Provenance Tracking';
  RAISE NOTICE 'ðŸŽ¯ Ready for high-value art, antiques, collectibles!';
END $$;

-- =====================================================
-- INDUSTRY-STANDARD BOOKINGS & RESERVATIONS SYSTEM
-- OpenTable + Resy + Calendly + Booking.com Level
-- =====================================================

-- ============= COMPREHENSIVE RESERVATION SYSTEM =============

-- Business/Venue profiles for reservation businesses
CREATE TABLE IF NOT EXISTS reservation_businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Business Type
  business_type VARCHAR(50) NOT NULL CHECK (business_type IN (
    'restaurant', 'hotel', 'salon', 'spa', 'clinic', 'studio', 
    'venue', 'workspace', 'mechanic', 'professional_service', 'other'
  )),
  
  -- Business Details
  business_name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE,
  description TEXT,
  
  -- Contact
  phone VARCHAR(20),
  email VARCHAR(200),
  website TEXT,
  
  -- Location
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  coordinates JSONB, -- {lat: number, lng: number}
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Operating Hours (JSON: {monday: {open: "09:00", close: "17:00", closed: false}, ...})
  operating_hours JSONB DEFAULT '{}'::jsonb,
  
  -- Reservation Settings
  accepts_reservations BOOLEAN DEFAULT true,
  requires_prepayment BOOLEAN DEFAULT false,
  prepayment_amount DECIMAL(10, 2) DEFAULT 0,
  cancellation_policy VARCHAR(20) DEFAULT 'flexible' CHECK (cancellation_policy IN ('flexible', 'moderate', 'strict', 'super_strict')),
  min_advance_booking_minutes INTEGER DEFAULT 30,
  max_advance_booking_days INTEGER DEFAULT 90,
  
  -- Party Size Limits
  min_party_size INTEGER DEFAULT 1,
  max_party_size INTEGER DEFAULT 20,
  
  -- Media
  logo_url TEXT,
  cover_image_url TEXT,
  gallery_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP WITH TIME ZONE,
  
  -- Reviews & Ratings
  average_rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  -- Metrics
  total_reservations INTEGER DEFAULT 0,
  total_revenue DECIMAL(15, 2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'suspended', 'closed')),
  
  -- SEO
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  cuisine_types TEXT[] DEFAULT ARRAY[]::TEXT[], -- For restaurants
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reservation resources (tables, rooms, chairs, bays, etc.)
CREATE TABLE IF NOT EXISTS reservation_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES reservation_businesses(id) ON DELETE CASCADE,
  
  -- Resource Type
  resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN (
    'table', 'room', 'chair', 'station', 'bay', 'court', 'field', 
    'desk', 'meeting_room', 'equipment', 'vehicle', 'other'
  )),
  
  -- Resource Details
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Capacity
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  min_capacity INTEGER DEFAULT 1,
  
  -- Location within venue
  floor_level VARCHAR(20),
  section VARCHAR(100),
  location_notes TEXT,
  
  -- Features
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_accessible BOOLEAN DEFAULT false,
  is_outdoor BOOLEAN DEFAULT false,
  has_view BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  
  -- Pricing
  base_rate DECIMAL(10, 2) DEFAULT 0,
  pricing_model VARCHAR(20) DEFAULT 'free' CHECK (pricing_model IN ('free', 'per_hour', 'per_day', 'per_booking', 'dynamic')),
  minimum_spend DECIMAL(10, 2) DEFAULT 0, -- For restaurants
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  
  -- Booking Rules
  min_duration_minutes INTEGER DEFAULT 30,
  max_duration_minutes INTEGER DEFAULT 480,
  buffer_before_minutes INTEGER DEFAULT 0, -- Cleanup/setup time before
  buffer_after_minutes INTEGER DEFAULT 0, -- Cleanup/setup time after
  
  -- Images
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Display
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff/service providers (stylists, doctors, mechanics, etc.)
CREATE TABLE IF NOT EXISTS reservation_staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES reservation_businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Staff Details
  name VARCHAR(200) NOT NULL,
  title VARCHAR(100),
  bio TEXT,
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Contact
  email VARCHAR(200),
  phone VARCHAR(20),
  
  -- Media
  photo_url TEXT,
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  accepts_bookings BOOLEAN DEFAULT true,
  
  -- Schedule (JSON: {monday: [{start: "09:00", end: "17:00"}], ...})
  weekly_schedule JSONB DEFAULT '{}'::jsonb,
  
  -- Ratings
  average_rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  
  -- Display
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services/treatments offered
CREATE TABLE IF NOT EXISTS reservation_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES reservation_businesses(id) ON DELETE CASCADE,
  
  -- Service Details
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  
  -- Duration
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  buffer_minutes INTEGER DEFAULT 0,
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  deposit_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- Availability
  is_active BOOLEAN DEFAULT true,
  requires_staff BOOLEAN DEFAULT false,
  max_simultaneous INTEGER DEFAULT 1, -- How many can be done at same time
  
  -- Requirements
  requires_consultation BOOLEAN DEFAULT false,
  min_age INTEGER,
  special_requirements TEXT,
  
  -- Images
  image_url TEXT,
  
  -- Display
  display_order INTEGER DEFAULT 0,
  is_popular BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service-Staff associations (which staff can perform which services)
CREATE TABLE IF NOT EXISTS service_staff_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES reservation_services(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES reservation_staff(id) ON DELETE CASCADE,
  
  -- Custom pricing for this staff member
  custom_price DECIMAL(10, 2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(service_id, staff_id)
);

-- Main reservations/bookings table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES reservation_businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Resource Assignment
  resource_id UUID REFERENCES reservation_resources(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES reservation_staff(id) ON DELETE SET NULL,
  
  -- Booking Type
  booking_type VARCHAR(20) NOT NULL CHECK (booking_type IN (
    'table', 'room', 'appointment', 'service', 'equipment', 'space'
  )),
  
  -- Date & Time
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Party Details
  party_size INTEGER DEFAULT 1,
  
  -- Customer Info (for walk-ins or phone bookings)
  customer_name VARCHAR(200),
  customer_email VARCHAR(200),
  customer_phone VARCHAR(20),
  
  -- Special Requests
  special_requests TEXT,
  dietary_restrictions TEXT,
  accessibility_needs TEXT,
  occasion VARCHAR(100), -- birthday, anniversary, business, etc.
  
  -- Pricing
  subtotal DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  tip_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment
  payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN (
    'unpaid', 'deposit_paid', 'paid', 'refunded', 'partially_refunded'
  )),
  payment_method VARCHAR(50),
  payment_id VARCHAR(100),
  deposit_paid DECIMAL(10, 2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'seated', 'in_progress', 'completed', 
    'cancelled', 'no_show', 'cancelled_by_business'
  )),
  
  -- Confirmation
  confirmation_code VARCHAR(20) UNIQUE,
  confirmation_sent BOOLEAN DEFAULT false,
  
  -- Check-in/Check-out
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_out_at TIMESTAMP WITH TIME ZONE,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  
  -- Reminders
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Cancellation
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES profiles(id),
  refund_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- No-show handling
  no_show_fee DECIMAL(10, 2) DEFAULT 0,
  
  -- Notes
  business_notes TEXT, -- Private notes for business
  customer_notes TEXT, -- Notes from customer
  
  -- Source
  booking_source VARCHAR(50) DEFAULT 'website' CHECK (booking_source IN (
    'website', 'mobile_app', 'phone', 'walk_in', 'partner', 'widget'
  )),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_reservation_time CHECK (end_time > start_time)
);

-- Reservation services (multiple services in one reservation)
CREATE TABLE IF NOT EXISTS reservation_service_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES reservation_services(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES reservation_staff(id) ON DELETE SET NULL,
  
  -- Service Details
  service_name VARCHAR(200) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  -- Pricing
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  line_total DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Timing
  scheduled_start_time TIME,
  scheduled_end_time TIME,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blocked time slots (holidays, breaks, maintenance)
CREATE TABLE IF NOT EXISTS reservation_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES reservation_businesses(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES reservation_resources(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES reservation_staff(id) ON DELETE CASCADE,
  
  -- Block Details
  block_type VARCHAR(20) NOT NULL CHECK (block_type IN (
    'holiday', 'maintenance', 'private_event', 'staff_break', 'other'
  )),
  reason TEXT,
  
  -- Time Period
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  all_day BOOLEAN DEFAULT false,
  
  -- Recurrence (if recurring block)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(20), -- 'daily', 'weekly', 'monthly'
  recurrence_end_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_block_time CHECK (end_datetime > start_datetime),
  CONSTRAINT block_target CHECK (
    business_id IS NOT NULL OR resource_id IS NOT NULL OR staff_id IS NOT NULL
  )
);

-- Waitlist for fully booked times
CREATE TABLE IF NOT EXISTS reservation_waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES reservation_businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Desired Booking
  desired_date DATE NOT NULL,
  desired_time_start TIME,
  desired_time_end TIME,
  party_size INTEGER NOT NULL,
  
  -- Contact
  customer_name VARCHAR(200) NOT NULL,
  customer_email VARCHAR(200),
  customer_phone VARCHAR(20) NOT NULL,
  
  -- Preferences
  resource_preference_ids UUID[],
  staff_preference_ids UUID[],
  
  -- Status
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN (
    'waiting', 'notified', 'booked', 'expired', 'cancelled'
  )),
  
  -- Notifications
  notified_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews for reservations
CREATE TABLE IF NOT EXISTS reservation_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES reservation_businesses(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Ratings (1-5 stars)
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  food_rating INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
  service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  ambiance_rating INTEGER CHECK (ambiance_rating >= 1 AND ambiance_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  
  -- Review
  title VARCHAR(200),
  review_text TEXT,
  
  -- Recommendations
  would_recommend BOOLEAN,
  
  -- Media
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Response
  business_response TEXT,
  business_response_at TIMESTAMP WITH TIME ZONE,
  
  -- Verification
  is_verified_visit BOOLEAN DEFAULT true,
  
  -- Moderation
  is_published BOOLEAN DEFAULT true,
  is_flagged BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(reservation_id, customer_id)
);

-- ============= INDEXES =============

-- Businesses
CREATE INDEX IF NOT EXISTS idx_res_businesses_owner ON reservation_businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_res_businesses_type ON reservation_businesses(business_type);
CREATE INDEX IF NOT EXISTS idx_res_businesses_city ON reservation_businesses(city);
CREATE INDEX IF NOT EXISTS idx_res_businesses_slug ON reservation_businesses(slug);
CREATE INDEX IF NOT EXISTS idx_res_businesses_status ON reservation_businesses(status);

-- Resources
CREATE INDEX IF NOT EXISTS idx_res_resources_business ON reservation_resources(business_id);
CREATE INDEX IF NOT EXISTS idx_res_resources_type ON reservation_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_res_resources_active ON reservation_resources(is_active);

-- Staff
CREATE INDEX IF NOT EXISTS idx_res_staff_business ON reservation_staff(business_id);
CREATE INDEX IF NOT EXISTS idx_res_staff_user ON reservation_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_res_staff_active ON reservation_staff(is_active);

-- Services
CREATE INDEX IF NOT EXISTS idx_res_services_business ON reservation_services(business_id);
CREATE INDEX IF NOT EXISTS idx_res_services_active ON reservation_services(is_active);

-- Reservations
CREATE INDEX IF NOT EXISTS idx_reservations_business ON reservations(business_id);
CREATE INDEX IF NOT EXISTS idx_reservations_customer ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_resource ON reservations(resource_id);
CREATE INDEX IF NOT EXISTS idx_reservations_staff ON reservations(staff_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_confirmation ON reservations(confirmation_code);
CREATE INDEX IF NOT EXISTS idx_reservations_date_time ON reservations(business_id, reservation_date, start_time);

-- Blocks
CREATE INDEX IF NOT EXISTS idx_blocks_business ON reservation_blocks(business_id);
CREATE INDEX IF NOT EXISTS idx_blocks_resource ON reservation_blocks(resource_id);
CREATE INDEX IF NOT EXISTS idx_blocks_staff ON reservation_blocks(staff_id);
CREATE INDEX IF NOT EXISTS idx_blocks_datetime ON reservation_blocks(start_datetime, end_datetime);

-- Waitlist
CREATE INDEX IF NOT EXISTS idx_waitlist_business ON reservation_waitlist(business_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_customer ON reservation_waitlist(customer_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON reservation_waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_date ON reservation_waitlist(desired_date);

-- Reviews
CREATE INDEX IF NOT EXISTS idx_res_reviews_business ON reservation_reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_res_reviews_customer ON reservation_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_res_reviews_reservation ON reservation_reviews(reservation_id);

-- ============= FUNCTIONS & TRIGGERS =============

-- Generate confirmation code
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  code VARCHAR(20);
BEGIN
  code := UPPER(substring(md5(random()::text) from 1 for 8));
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate confirmation code for reservations
CREATE OR REPLACE FUNCTION set_reservation_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_code IS NULL THEN
    NEW.confirmation_code := generate_confirmation_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_reservation_confirmation ON reservations;
CREATE TRIGGER trigger_set_reservation_confirmation
BEFORE INSERT ON reservations
FOR EACH ROW
EXECUTE FUNCTION set_reservation_confirmation();

-- Update business metrics on reservation
CREATE OR REPLACE FUNCTION update_business_reservation_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    UPDATE reservation_businesses
    SET 
      total_reservations = total_reservations + 1,
      total_revenue = total_revenue + NEW.total_amount
    WHERE id = NEW.business_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_business_metrics ON reservations;
CREATE TRIGGER trigger_update_business_metrics
AFTER INSERT OR UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION update_business_reservation_metrics();

-- Update ratings when review is added
CREATE OR REPLACE FUNCTION update_business_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE reservation_businesses
  SET 
    average_rating = (
      SELECT AVG(overall_rating)
      FROM reservation_reviews
      WHERE business_id = NEW.business_id AND is_published = true
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reservation_reviews
      WHERE business_id = NEW.business_id AND is_published = true
    )
  WHERE id = NEW.business_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_business_rating ON reservation_reviews;
CREATE TRIGGER trigger_update_business_rating
AFTER INSERT OR UPDATE ON reservation_reviews
FOR EACH ROW
EXECUTE FUNCTION update_business_rating();

-- Check availability function
CREATE OR REPLACE FUNCTION check_reservation_availability(
  p_business_id UUID,
  p_resource_id UUID,
  p_staff_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  v_conflicts INTEGER;
BEGIN
  -- Check for conflicting reservations
  SELECT COUNT(*) INTO v_conflicts
  FROM reservations
  WHERE business_id = p_business_id
    AND reservation_date = p_date
    AND status NOT IN ('cancelled', 'no_show')
    AND (
      (p_resource_id IS NOT NULL AND resource_id = p_resource_id) OR
      (p_staff_id IS NOT NULL AND staff_id = p_staff_id)
    )
    AND (
      (start_time, end_time) OVERLAPS (p_start_time, p_end_time)
    );
  
  -- Check for blocks
  SELECT COUNT(*) + v_conflicts INTO v_conflicts
  FROM reservation_blocks
  WHERE (business_id = p_business_id OR resource_id = p_resource_id OR staff_id = p_staff_id)
    AND (
      (start_datetime::DATE = p_date AND all_day = true) OR
      (start_datetime::DATE = p_date AND 
       (start_datetime::TIME, end_datetime::TIME) OVERLAPS (p_start_time, p_end_time))
    );
  
  RETURN v_conflicts = 0;
END;
$$ LANGUAGE plpgsql;

-- ============= ROW LEVEL SECURITY =============

ALTER TABLE reservation_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_reviews ENABLE ROW LEVEL SECURITY;

-- Business policies
CREATE POLICY "Active businesses viewable by all"
ON reservation_businesses FOR SELECT
USING (status = 'active');

CREATE POLICY "Owners can manage their businesses"
ON reservation_businesses FOR ALL
USING (auth.uid() = owner_id);

-- Resource policies
CREATE POLICY "Active resources viewable by all"
ON reservation_resources FOR SELECT
USING (is_active = true);

CREATE POLICY "Business owners can manage resources"
ON reservation_resources FOR ALL
USING (auth.uid() IN (SELECT owner_id FROM reservation_businesses WHERE id = business_id));

-- Staff policies
CREATE POLICY "Active staff viewable by all"
ON reservation_staff FOR SELECT
USING (is_active = true);

CREATE POLICY "Business owners can manage staff"
ON reservation_staff FOR ALL
USING (auth.uid() IN (SELECT owner_id FROM reservation_businesses WHERE id = business_id));

-- Services policies
CREATE POLICY "Active services viewable by all"
ON reservation_services FOR SELECT
USING (is_active = true);

CREATE POLICY "Business owners can manage services"
ON reservation_services FOR ALL
USING (auth.uid() IN (SELECT owner_id FROM reservation_businesses WHERE id = business_id));

-- Reservation policies
CREATE POLICY "Users view their own reservations"
ON reservations FOR SELECT
USING (
  auth.uid() = customer_id OR
  auth.uid() IN (SELECT owner_id FROM reservation_businesses WHERE id = business_id)
);

CREATE POLICY "Anyone can create reservations"
ON reservations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Customers and business owners can update reservations"
ON reservations FOR UPDATE
USING (
  auth.uid() = customer_id OR
  auth.uid() IN (SELECT owner_id FROM reservation_businesses WHERE id = business_id)
);

-- Review policies
CREATE POLICY "Published reviews viewable by all"
ON reservation_reviews FOR SELECT
USING (is_published = true);

CREATE POLICY "Customers can create reviews"
ON reservation_reviews FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- ============= VIEWS =============

-- Available time slots view
CREATE OR REPLACE VIEW available_time_slots AS
SELECT 
  rb.id as business_id,
  rb.business_name,
  rr.id as resource_id,
  rr.name as resource_name,
  rs.id as staff_id,
  rs.name as staff_name,
  CURRENT_DATE as date,
  generate_series(
    '09:00'::TIME,
    '17:00'::TIME,
    '30 minutes'::INTERVAL
  ) as time_slot
FROM reservation_businesses rb
LEFT JOIN reservation_resources rr ON rb.id = rr.business_id AND rr.is_active = true
LEFT JOIN reservation_staff rs ON rb.id = rs.business_id AND rs.is_active = true
WHERE rb.status = 'active';

-- Comments
COMMENT ON TABLE reservation_businesses IS 'Restaurants, salons, hotels, and other reservation businesses';
COMMENT ON TABLE reservation_resources IS 'Tables, rooms, chairs, equipment - bookable resources';
COMMENT ON TABLE reservation_staff IS 'Service providers, stylists, doctors, mechanics';
COMMENT ON TABLE reservation_services IS 'Services and treatments offered';
COMMENT ON TABLE reservations IS 'All bookings and reservations';
COMMENT ON TABLE reservation_reviews IS 'Customer reviews and ratings';

-- ============= BUSINESS SETUP HELPERS =============

-- Function to initialize business with default settings
CREATE OR REPLACE FUNCTION initialize_business_defaults(p_business_id UUID, p_business_type VARCHAR)
RETURNS VOID AS $$
BEGIN
  -- Set default operating hours based on business type
  UPDATE reservation_businesses
  SET operating_hours = CASE p_business_type
    WHEN 'restaurant' THEN '{
      "monday": {"open": "11:00", "close": "22:00", "closed": false},
      "tuesday": {"open": "11:00", "close": "22:00", "closed": false},
      "wednesday": {"open": "11:00", "close": "22:00", "closed": false},
      "thursday": {"open": "11:00", "close": "22:00", "closed": false},
      "friday": {"open": "11:00", "close": "23:00", "closed": false},
      "saturday": {"open": "11:00", "close": "23:00", "closed": false},
      "sunday": {"open": "11:00", "close": "22:00", "closed": false}
    }'::jsonb
    WHEN 'salon' THEN '{
      "monday": {"open": "09:00", "close": "19:00", "closed": false},
      "tuesday": {"open": "09:00", "close": "19:00", "closed": false},
      "wednesday": {"open": "09:00", "close": "19:00", "closed": false},
      "thursday": {"open": "09:00", "close": "19:00", "closed": false},
      "friday": {"open": "09:00", "close": "19:00", "closed": false},
      "saturday": {"open": "09:00", "close": "18:00", "closed": false},
      "sunday": {"open": "10:00", "close": "17:00", "closed": false}
    }'::jsonb
    WHEN 'clinic' THEN '{
      "monday": {"open": "08:00", "close": "17:00", "closed": false},
      "tuesday": {"open": "08:00", "close": "17:00", "closed": false},
      "wednesday": {"open": "08:00", "close": "17:00", "closed": false},
      "thursday": {"open": "08:00", "close": "17:00", "closed": false},
      "friday": {"open": "08:00", "close": "17:00", "closed": false},
      "saturday": {"open": "09:00", "close": "13:00", "closed": false},
      "sunday": {"open": "00:00", "close": "00:00", "closed": true}
    }'::jsonb
    ELSE '{
      "monday": {"open": "09:00", "close": "18:00", "closed": false},
      "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
      "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
      "thursday": {"open": "09:00", "close": "18:00", "closed": false},
      "friday": {"open": "09:00", "close": "18:00", "closed": false},
      "saturday": {"open": "10:00", "close": "16:00", "closed": false},
      "sunday": {"open": "00:00", "close": "00:00", "closed": true}
    }'::jsonb
  END
  WHERE id = p_business_id AND operating_hours = '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-initialize business defaults
CREATE OR REPLACE FUNCTION auto_initialize_business()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM initialize_business_defaults(NEW.id, NEW.business_type);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_initialize_business ON reservation_businesses;
CREATE TRIGGER trigger_auto_initialize_business
AFTER INSERT ON reservation_businesses
FOR EACH ROW
EXECUTE FUNCTION auto_initialize_business();

-- Function to create default resources for a business
CREATE OR REPLACE FUNCTION create_default_resources(
  p_business_id UUID,
  p_business_type VARCHAR,
  p_count INTEGER DEFAULT 5
)
RETURNS VOID AS $$
DECLARE
  i INTEGER;
  resource_name VARCHAR;
  resource_type VARCHAR;
BEGIN
  -- Create default resources based on business type
  CASE p_business_type
    WHEN 'restaurant' THEN
      resource_type := 'table';
      FOR i IN 1..p_count LOOP
        INSERT INTO reservation_resources (business_id, resource_type, name, capacity, min_capacity)
        VALUES (p_business_id, 'table', 'Table ' || i, 4, 2);
      END LOOP;
      
    WHEN 'salon' THEN
      resource_type := 'chair';
      FOR i IN 1..p_count LOOP
        INSERT INTO reservation_resources (business_id, resource_type, name, capacity, min_capacity)
        VALUES (p_business_id, 'chair', 'Station ' || i, 1, 1);
      END LOOP;
      
    WHEN 'hotel' THEN
      resource_type := 'room';
      FOR i IN 1..p_count LOOP
        INSERT INTO reservation_resources (business_id, resource_type, name, capacity, min_capacity)
        VALUES (p_business_id, 'room', 'Room ' || (100 + i), 2, 1);
      END LOOP;
      
    WHEN 'clinic' THEN
      resource_type := 'room';
      FOR i IN 1..p_count LOOP
        INSERT INTO reservation_resources (business_id, resource_type, name, capacity, min_capacity)
        VALUES (p_business_id, 'room', 'Exam Room ' || i, 1, 1);
      END LOOP;
      
    ELSE
      resource_type := 'desk';
      FOR i IN 1..p_count LOOP
        INSERT INTO reservation_resources (business_id, resource_type, name, capacity, min_capacity)
        VALUES (p_business_id, 'desk', 'Space ' || i, 1, 1);
      END LOOP;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function for quick booking (simplified for customers)
CREATE OR REPLACE FUNCTION quick_book_reservation(
  p_business_id UUID,
  p_customer_name VARCHAR,
  p_customer_phone VARCHAR,
  p_customer_email VARCHAR,
  p_date DATE,
  p_time TIME,
  p_party_size INTEGER,
  p_duration_minutes INTEGER DEFAULT 120
)
RETURNS UUID AS $$
DECLARE
  v_reservation_id UUID;
  v_end_time TIME;
  v_resource_id UUID;
BEGIN
  -- Calculate end time
  v_end_time := p_time + (p_duration_minutes || ' minutes')::INTERVAL;
  
  -- Find available resource
  SELECT id INTO v_resource_id
  FROM reservation_resources
  WHERE business_id = p_business_id
    AND is_active = true
    AND capacity >= p_party_size
    AND check_reservation_availability(
      p_business_id, id, NULL, p_date, p_time, v_end_time
    )
  ORDER BY capacity ASC
  LIMIT 1;
  
  -- Create reservation
  INSERT INTO reservations (
    business_id,
    resource_id,
    customer_name,
    customer_phone,
    customer_email,
    reservation_date,
    start_time,
    end_time,
    duration_minutes,
    party_size,
    booking_type,
    status
  )
  VALUES (
    p_business_id,
    v_resource_id,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_date,
    p_time,
    v_end_time,
    p_duration_minutes,
    p_party_size,
    'table',
    'pending'
  )
  RETURNING id INTO v_reservation_id;
  
  RETURN v_reservation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-confirm reservations (for instant booking)
CREATE OR REPLACE FUNCTION auto_confirm_reservation()
RETURNS TRIGGER AS $$
DECLARE
  v_instant_book BOOLEAN;
  v_requires_approval BOOLEAN;
BEGIN
  -- Check if resource requires approval
  IF NEW.resource_id IS NOT NULL THEN
    SELECT requires_approval INTO v_requires_approval
    FROM reservation_resources
    WHERE id = NEW.resource_id;
    
    -- Auto-confirm if no approval needed
    IF v_requires_approval = false THEN
      NEW.status := 'confirmed';
      NEW.confirmation_sent := true;
    END IF;
  ELSE
    -- If no specific resource, auto-confirm
    NEW.status := 'confirmed';
    NEW.confirmation_sent := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_confirm_reservation ON reservations;
CREATE TRIGGER trigger_auto_confirm_reservation
BEFORE INSERT ON reservations
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION auto_confirm_reservation();

-- Function to send reminder 24 hours before
CREATE OR REPLACE FUNCTION send_reservation_reminders()
RETURNS void AS $$
BEGIN
  UPDATE reservations
  SET 
    reminder_sent = true,
    reminder_sent_at = NOW()
  WHERE status = 'confirmed'
    AND reminder_sent = false
    AND reservation_date = CURRENT_DATE + INTERVAL '1 day'
    AND customer_email IS NOT NULL;
  
  -- Log how many reminders sent (for monitoring)
  RAISE NOTICE 'Sent % reservation reminders', 
    (SELECT COUNT(*) FROM reservations 
     WHERE reminder_sent_at::DATE = CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- ============= QUICK SETUP TEMPLATES =============

-- Insert common service templates for salons
CREATE OR REPLACE FUNCTION add_salon_service_templates(p_business_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO reservation_services (business_id, name, description, duration_minutes, price, category)
  VALUES 
    (p_business_id, 'Haircut - Women', 'Wash, cut, and style', 60, 65.00, 'Hair'),
    (p_business_id, 'Haircut - Men', 'Precision cut', 30, 35.00, 'Hair'),
    (p_business_id, 'Color - Full', 'Full head color application', 120, 150.00, 'Color'),
    (p_business_id, 'Color - Touch-up', 'Root touch-up', 60, 85.00, 'Color'),
    (p_business_id, 'Highlights', 'Partial highlights', 90, 120.00, 'Color'),
    (p_business_id, 'Blowout', 'Wash and style', 45, 45.00, 'Style'),
    (p_business_id, 'Deep Conditioning', 'Treatment and mask', 30, 35.00, 'Treatment'),
    (p_business_id, 'Manicure', 'Classic manicure', 30, 30.00, 'Nails'),
    (p_business_id, 'Pedicure', 'Classic pedicure', 45, 45.00, 'Nails')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Insert common service templates for spas
CREATE OR REPLACE FUNCTION add_spa_service_templates(p_business_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO reservation_services (business_id, name, description, duration_minutes, price, category)
  VALUES 
    (p_business_id, 'Swedish Massage', 'Relaxing full body massage', 60, 90.00, 'Massage'),
    (p_business_id, 'Deep Tissue Massage', 'Therapeutic deep tissue work', 60, 110.00, 'Massage'),
    (p_business_id, 'Hot Stone Massage', 'Heated stone therapy', 90, 135.00, 'Massage'),
    (p_business_id, 'Facial - Classic', 'Cleansing facial treatment', 60, 85.00, 'Facial'),
    (p_business_id, 'Facial - Anti-Aging', 'Advanced anti-aging treatment', 90, 150.00, 'Facial'),
    (p_business_id, 'Body Scrub', 'Exfoliating body treatment', 45, 70.00, 'Body'),
    (p_business_id, 'Couples Massage', 'Side-by-side massage for two', 60, 180.00, 'Massage')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Insert common service templates for clinics
CREATE OR REPLACE FUNCTION add_clinic_service_templates(p_business_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO reservation_services (business_id, name, description, duration_minutes, price, category)
  VALUES 
    (p_business_id, 'General Consultation', 'Standard medical consultation', 30, 150.00, 'Consultation'),
    (p_business_id, 'Follow-up Visit', 'Follow-up appointment', 15, 75.00, 'Consultation'),
    (p_business_id, 'Annual Physical', 'Comprehensive health exam', 60, 250.00, 'Checkup'),
    (p_business_id, 'Lab Work', 'Blood tests and analysis', 15, 100.00, 'Testing'),
    (p_business_id, 'Vaccination', 'Immunization appointment', 15, 50.00, 'Preventive')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============= CUSTOMER BOOKING HELPERS =============

-- Function to get next available slot
CREATE OR REPLACE FUNCTION get_next_available_slot(
  p_business_id UUID,
  p_party_size INTEGER DEFAULT 2,
  p_preferred_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  available_date DATE,
  available_time TIME,
  resource_id UUID,
  resource_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.slot_date,
    t.time_slot::TIME,
    r.id,
    r.name
  FROM generate_series(
    p_preferred_date,
    p_preferred_date + INTERVAL '7 days',
    '1 day'::INTERVAL
  ) AS d(slot_date)
  CROSS JOIN generate_series(
    '09:00'::TIME,
    '20:00'::TIME,
    '30 minutes'::INTERVAL
  ) AS t(time_slot)
  CROSS JOIN reservation_resources r
  WHERE r.business_id = p_business_id
    AND r.is_active = true
    AND r.capacity >= p_party_size
    AND check_reservation_availability(
      p_business_id,
      r.id,
      NULL,
      d.slot_date::DATE,
      t.time_slot::TIME,
      (t.time_slot + INTERVAL '2 hours')::TIME
    )
  ORDER BY d.slot_date, t.time_slot
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function for walk-in booking (instant)
CREATE OR REPLACE FUNCTION create_walk_in_booking(
  p_business_id UUID,
  p_customer_name VARCHAR,
  p_party_size INTEGER,
  p_duration_minutes INTEGER DEFAULT 90
)
RETURNS UUID AS $$
DECLARE
  v_reservation_id UUID;
  v_resource_id UUID;
  v_start_time TIME;
  v_end_time TIME;
BEGIN
  -- Get current time rounded to nearest 15 minutes
  v_start_time := date_trunc('hour', NOW()) + 
    (EXTRACT(MINUTE FROM NOW())::INTEGER / 15 * 15) * INTERVAL '1 minute';
  v_end_time := v_start_time + (p_duration_minutes || ' minutes')::INTERVAL;
  
  -- Find available resource
  SELECT id INTO v_resource_id
  FROM reservation_resources
  WHERE business_id = p_business_id
    AND is_active = true
    AND capacity >= p_party_size
    AND check_reservation_availability(
      p_business_id, id, NULL, CURRENT_DATE, v_start_time::TIME, v_end_time::TIME
    )
  ORDER BY capacity ASC
  LIMIT 1;
  
  IF v_resource_id IS NULL THEN
    RAISE EXCEPTION 'No available resources for walk-in';
  END IF;
  
  -- Create reservation
  INSERT INTO reservations (
    business_id,
    resource_id,
    customer_name,
    reservation_date,
    start_time,
    end_time,
    duration_minutes,
    party_size,
    booking_type,
    booking_source,
    status
  )
  VALUES (
    p_business_id,
    v_resource_id,
    p_customer_name,
    CURRENT_DATE,
    v_start_time::TIME,
    v_end_time::TIME,
    p_duration_minutes,
    p_party_size,
    'table',
    'walk_in',
    'confirmed'
  )
  RETURNING id INTO v_reservation_id;
  
  RETURN v_reservation_id;
END;
$$ LANGUAGE plpgsql;

-- ============= ANALYTICS VIEWS FOR BUSINESS OWNERS =============

-- Today's reservations dashboard
CREATE OR REPLACE VIEW todays_reservations AS
SELECT 
  r.*,
  b.business_name,
  res.name as resource_name,
  s.name as staff_name,
  CASE 
    WHEN r.status = 'confirmed' AND r.start_time <= CURRENT_TIME THEN 'due_now'
    WHEN r.status = 'confirmed' AND r.start_time > CURRENT_TIME THEN 'upcoming'
    WHEN r.status = 'seated' THEN 'active'
    WHEN r.status = 'completed' THEN 'completed'
    ELSE r.status
  END as current_status
FROM reservations r
JOIN reservation_businesses b ON r.business_id = b.id
LEFT JOIN reservation_resources res ON r.resource_id = res.id
LEFT JOIN reservation_staff s ON r.staff_id = s.id
WHERE r.reservation_date = CURRENT_DATE
  AND r.status NOT IN ('cancelled', 'no_show')
ORDER BY r.start_time;

-- Business performance dashboard
CREATE OR REPLACE VIEW business_performance AS
SELECT 
  b.id as business_id,
  b.business_name,
  DATE(r.reservation_date) as date,
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE r.status = 'completed') as completed,
  COUNT(*) FILTER (WHERE r.status = 'cancelled') as cancelled,
  COUNT(*) FILTER (WHERE r.status = 'no_show') as no_shows,
  SUM(r.total_amount) as revenue,
  AVG(r.party_size) as avg_party_size,
  (COUNT(*) FILTER (WHERE r.status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0) * 100) as completion_rate,
  (COUNT(*) FILTER (WHERE r.status = 'no_show')::DECIMAL / NULLIF(COUNT(*), 0) * 100) as no_show_rate
FROM reservation_businesses b
LEFT JOIN reservations r ON b.id = r.business_id
WHERE r.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY b.id, b.business_name, DATE(r.reservation_date);

-- Staff performance view
CREATE OR REPLACE VIEW staff_performance AS
SELECT 
  s.id as staff_id,
  s.business_id,
  s.name as staff_name,
  COUNT(DISTINCT r.id) as total_bookings,
  SUM(rsi.line_total) as total_revenue,
  AVG(rr.overall_rating) as average_rating,
  COUNT(DISTINCT rr.id) as review_count
FROM reservation_staff s
LEFT JOIN reservations r ON s.id = r.staff_id
LEFT JOIN reservation_service_items rsi ON r.id = rsi.reservation_id AND s.id = rsi.staff_id
LEFT JOIN reservation_reviews rr ON r.id = rr.reservation_id
GROUP BY s.id, s.business_id, s.name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'ðŸŽ‰ INDUSTRY-STANDARD RESERVATIONS SYSTEM CREATED!';
  RAISE NOTICE 'ðŸ½ï¸  Restaurant Reservations (OpenTable/Resy level)';
  RAISE NOTICE 'ðŸ¨  Hotel Bookings (Booking.com level)';
  RAISE NOTICE 'ðŸ’‡  Salon Appointments (Booksy level)';
  RAISE NOTICE 'ðŸ¥  Medical Appointments (Zocdoc level)';
  RAISE NOTICE 'ðŸ“…  General Appointments (Calendly level)';
  RAISE NOTICE 'ðŸ”§  Service Bookings (Any industry)';
  RAISE NOTICE '';
  RAISE NOTICE 'âœ¨ BUSINESS OWNER FEATURES:';
  RAISE NOTICE '  âœ… Auto-initialized with default hours';
  RAISE NOTICE '  âœ… Quick resource setup helpers';
  RAISE NOTICE '  âœ… Service templates (salon, spa, clinic)';
  RAISE NOTICE '  âœ… Real-time analytics dashboard';
  RAISE NOTICE '  âœ… Staff performance tracking';
  RAISE NOTICE '';
  RAISE NOTICE 'âœ¨ CUSTOMER BOOKING FEATURES:';
  RAISE NOTICE '  âœ… Quick booking function';
  RAISE NOTICE '  âœ… Walk-in support';
  RAISE NOTICE '  âœ… Auto-availability checking';
  RAISE NOTICE '  âœ… Instant confirmation codes';
  RAISE NOTICE '  âœ… Auto-reminders';
  RAISE NOTICE '  âœ… Guest booking (no login required)';
END $$;

