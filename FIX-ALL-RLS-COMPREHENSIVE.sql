-- =====================================================
-- COMPREHENSIVE RLS FIX - ALL TABLES
-- This fixes RLS policies across the entire database
-- =====================================================

-- =====================================================
-- POSTS - Public read, authenticated write own
-- =====================================================
DROP POLICY IF EXISTS "allow_public_read_posts" ON posts;
DROP POLICY IF EXISTS "allow_authenticated_insert_own_posts" ON posts;
DROP POLICY IF EXISTS "allow_authenticated_update_own_posts" ON posts;
DROP POLICY IF EXISTS "allow_authenticated_delete_own_posts" ON posts;
DROP POLICY IF EXISTS "posts_read_all" ON posts;
DROP POLICY IF EXISTS "posts_insert_own" ON posts;
DROP POLICY IF EXISTS "posts_update_own" ON posts;
DROP POLICY IF EXISTS "posts_delete_own" ON posts;

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_read_all" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_own" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update_own" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete_own" ON posts FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- PROFILES - Public read, authenticated update own
-- =====================================================
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON profiles';
    END LOOP;
END $$;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_read_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- HUB BOXES - Own or public
-- =====================================================
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'hub_boxes') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON hub_boxes';
    END LOOP;
END $$;

ALTER TABLE hub_boxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hub_boxes_read_own_or_public" ON hub_boxes FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "hub_boxes_insert_own" ON hub_boxes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "hub_boxes_update_own" ON hub_boxes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "hub_boxes_delete_own" ON hub_boxes FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- COLLECTIONS - Own or public (if exists)
-- =====================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'collections') THEN
        DROP POLICY IF EXISTS "collections_read_own_or_public" ON collections;
        DROP POLICY IF EXISTS "collections_manage_own" ON collections;
        
        ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "collections_read_own_or_public" ON collections FOR SELECT USING (auth.uid() = user_id OR is_public = true);
        CREATE POLICY "collections_manage_own" ON collections FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- =====================================================
-- SAVED POSTS - Own only (if exists)
-- =====================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'saved_posts') THEN
        DROP POLICY IF EXISTS "saved_posts_read_own" ON saved_posts;
        DROP POLICY IF EXISTS "saved_posts_manage_own" ON saved_posts;
        
        ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "saved_posts_read_own" ON saved_posts FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "saved_posts_manage_own" ON saved_posts FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- =====================================================
-- COLLECTION ITEMS - Based on collection access (if exists)
-- =====================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'collection_items') THEN
        DROP POLICY IF EXISTS "collection_items_read" ON collection_items;
        DROP POLICY IF EXISTS "collection_items_manage" ON collection_items;
        
        ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "collection_items_read" ON collection_items FOR SELECT 
        USING (
          collection_id IN (
            SELECT id FROM collections WHERE user_id = auth.uid() OR is_public = true
          )
        );
        
        CREATE POLICY "collection_items_manage" ON collection_items FOR ALL 
        USING (
          collection_id IN (SELECT id FROM collections WHERE user_id = auth.uid())
        );
    END IF;
END $$;

-- =====================================================
-- MESSAGES/CONVERSATIONS - Participants only (if exists)
-- =====================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'conversations') THEN
        DROP POLICY IF EXISTS "conversations_participant_access" ON conversations;
        ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "conversations_participant_access" ON conversations FOR ALL
        USING (auth.uid() = user1_id OR auth.uid() = user2_id);
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'messages') THEN
        DROP POLICY IF EXISTS "messages_participant_access" ON messages;
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "messages_participant_access" ON messages FOR ALL
        USING (
          conversation_id IN (
            SELECT id FROM conversations 
            WHERE user1_id = auth.uid() OR user2_id = auth.uid()
          )
        );
    END IF;
END $$;

-- =====================================================
-- NOTIFICATIONS - Own only (if exists)
-- =====================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'notifications') THEN
        DROP POLICY IF EXISTS "notifications_read_own" ON notifications;
        DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
        
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "notifications_read_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- =====================================================
-- USER PREFERENCES - Own only (if exists)
-- =====================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_preferences') THEN
        DROP POLICY IF EXISTS "user_preferences_manage_own" ON user_preferences;
        
        ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "user_preferences_manage_own" ON user_preferences FOR ALL 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- =====================================================
-- MARKETPLACE - Public read, own write (if exists)
-- =====================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'marketplace_listings') THEN
        DROP POLICY IF EXISTS "marketplace_listings_read_all" ON marketplace_listings;
        DROP POLICY IF EXISTS "marketplace_listings_manage_own" ON marketplace_listings;
        
        ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "marketplace_listings_read_all" ON marketplace_listings FOR SELECT USING (true);
        CREATE POLICY "marketplace_listings_manage_own" ON marketplace_listings FOR ALL USING (auth.uid() = seller_id);
    END IF;
END $$;

-- =====================================================
-- MARKETPLACE ORDERS - Buyer or seller only (if exists)
-- =====================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'marketplace_orders') THEN
        DROP POLICY IF EXISTS "marketplace_orders_access" ON marketplace_orders;
        
        ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "marketplace_orders_access" ON marketplace_orders FOR ALL
        USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
    END IF;
END $$;

-- =====================================================
-- EVENT TICKETS - Public read, owner write (if exists)
-- =====================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'event_tickets') THEN
        DROP POLICY IF EXISTS "event_tickets_read_all" ON event_tickets;
        DROP POLICY IF EXISTS "event_tickets_manage_own" ON event_tickets;
        
        ALTER TABLE event_tickets ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "event_tickets_read_all" ON event_tickets FOR SELECT USING (status = 'active');
        CREATE POLICY "event_tickets_manage_own" ON event_tickets FOR ALL USING (auth.uid() = organizer_id);
    END IF;
END $$;

-- =====================================================
-- TICKET PURCHASES - Own only (if exists)
-- =====================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'ticket_purchases') THEN
        DROP POLICY IF EXISTS "ticket_purchases_access" ON ticket_purchases;
        
        ALTER TABLE ticket_purchases ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "ticket_purchases_access" ON ticket_purchases FOR ALL
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- =====================================================
-- USER BOOKINGS - Own only (if exists)
-- =====================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_bookings') THEN
        DROP POLICY IF EXISTS "user_bookings_access" ON user_bookings;
        
        ALTER TABLE user_bookings ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "user_bookings_access" ON user_bookings FOR ALL
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- =====================================================
-- USER LIBRARY - Own only (if exists)
-- =====================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'user_library') THEN
        DROP POLICY IF EXISTS "user_library_access" ON user_library;
        
        ALTER TABLE user_library ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "user_library_access" ON user_library FOR ALL
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- =====================================================
-- TRANSACTIONS - Own only (buyer or seller) (if exists)
-- =====================================================
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'transactions') THEN
        DROP POLICY IF EXISTS "transactions_access" ON transactions;
        
        ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "transactions_access" ON transactions FOR SELECT
        USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
    END IF;
END $$;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT '✅ ALL RLS POLICIES FIXED!' as status;
SELECT 'All tables now have proper security policies.' as message;
SELECT 'Users can read public content and manage their own data.' as details;

