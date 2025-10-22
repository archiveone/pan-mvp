import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DemoDataService } from './demoDataService';

// Simple in-memory cache with TTL
interface CacheEntry {
  data: UnifiedFeedItem[];
  timestamp: number;
  key: string;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 1000; // 10 seconds (shorter for better freshness)

export interface UnifiedFeedItem {
  id: string;
  type: 'post' | 'music' | 'video' | 'document' | 'event' | 'listing' | 'rental' | 'booking' | 'auction' | 'fundraiser' | 'auction_lot' | 'reservation_business';
  title: string;
  description?: string;
  content?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  price?: number;
  currency?: string;
  location?: string;
  category?: string;
  tags?: string[];
  userId: string;
  userProfile?: {
    name?: string;
    username?: string;
    avatarUrl?: string;
  };
  createdAt: string;
  viewCount?: number;
  likeCount?: number;
  // Type-specific fields
  extraData?: any;
}

export class UnifiedFeedService {
  /**
   * Get unified feed from all content tables
   * With caching and optimized loading
   */
  static async getUnifiedFeed(filters?: {
    query?: string;
    location?: string;
    priceMin?: number;
    priceMax?: number;
    tags?: string[];
    type?: string[];
    limit?: number;
  }): Promise<UnifiedFeedItem[]> {
    const limit = filters?.limit || 50;
    
    // If Supabase is not configured, return empty
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured. Please set up environment variables.');
      return [];
    }
    
    // Generate cache key
    const cacheKey = JSON.stringify(filters || {});
    
    // Check cache first - but only use if still fresh
    const cached = cache.get(cacheKey);
    const now = Date.now();
    const isCacheFresh = cached && (now - cached.timestamp) < CACHE_TTL;
    
    if (isCacheFresh) {
      console.log('📦 Using cached feed data (fresh)', Math.floor((CACHE_TTL - (now - cached.timestamp)) / 1000), 'seconds left');
      return cached.data;
    } else if (cached) {
      console.log('🔄 Cache expired, fetching fresh data...');
    }
    
    const allContent: UnifiedFeedItem[] = [];

    try {
      // Fetch from all tables in parallel - use Promise.allSettled to handle failures gracefully
      const fetchPromises = [
        this.fetchPosts(limit),
        this.fetchMusicPosts(limit),
        this.fetchVideoPosts(limit),
        this.fetchDocumentPosts(limit),
        this.fetchEvents(limit),
        this.fetchListings(limit),
        this.fetchBookableListings(limit),
        this.fetchAuctions(limit),
        this.fetchFundraisers(limit),
        this.fetchAuctionLots(limit),
        this.fetchReservationBusinesses(limit)
      ];
      
      // Use allSettled to continue even if some fetches fail
      const results = await Promise.allSettled(fetchPromises);
      
      // Extract successful results
      const [
        posts,
        musicPosts,
        videoPosts,
        documentPosts,
        events,
        listings,
        rentals,
        auctions,
        fundraisers,
        auctionLots,
        reservationBusinesses
      ] = results.map(result => 
        result.status === 'fulfilled' ? result.value : []
      );

      // Combine all content
      allContent.push(...posts, ...musicPosts, ...videoPosts, ...documentPosts, ...events, ...listings, ...rentals, ...auctions, ...fundraisers, ...auctionLots, ...reservationBusinesses);

      // Apply filters
      let filtered = allContent;

      if (filters?.query) {
        const query = filters.query.toLowerCase();
        filtered = filtered.filter(item =>
          item.title?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.content?.toLowerCase().includes(query)
        );
      }

      if (filters?.location) {
        filtered = filtered.filter(item =>
          item.location?.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }

      if (filters?.priceMin !== undefined) {
        filtered = filtered.filter(item =>
          item.price !== undefined && item.price >= filters.priceMin!
        );
      }

      if (filters?.priceMax !== undefined) {
        filtered = filtered.filter(item =>
          item.price !== undefined && item.price <= filters.priceMax!
        );
      }

      if (filters?.tags && filters.tags.length > 0) {
        filtered = filtered.filter(item =>
          item.tags?.some(tag => filters.tags!.includes(tag))
        );
      }

      if (filters?.type && filters.type.length > 0) {
        filtered = filtered.filter(item =>
          filters.type!.includes(item.type)
        );
      }

      // Sort by creation date (newest first)
      filtered.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const result = filtered.slice(0, limit);
      
      // Cache the result
      cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        key: cacheKey
      });
      
      // Clean old cache entries (prevent memory leak)
      if (cache.size > 50) {
        const sortedEntries = Array.from(cache.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp);
        // Remove oldest 10 entries
        for (let i = 0; i < 10; i++) {
          cache.delete(sortedEntries[i][0]);
        }
      }
      
      console.log('✅ Fresh feed data fetched and cached');
      return result;
    } catch (error: any) {
      console.error('Error fetching unified feed:', error);
      
      // If timeout or database not set up, show helpful message
      if (error.message?.includes('timeout') || error.message?.includes('database')) {
        console.warn('⚠️ Database tables may not be set up yet.');
        console.warn('💡 Run database migrations to enable content: See supabase/migrations/');
      }
      
      // Return cached data if available, even if expired
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log('⚠️ Error occurred, using stale cache');
        return cached.data;
      }
      
      // Return empty array - no demo data fallback
      return [];
    }
  }
  
  /**
   * Clear cache (call after creating new content)
   */
  static clearCache(): void {
    cache.clear();
    console.log('🗑️ Cache cleared');
  }
  
  /**
   * Prefetch feed data (for better performance)
   */
  static async prefetchFeed(filters?: any): Promise<void> {
    // Don't await - fire and forget
    this.getUnifiedFeed(filters).catch(console.error);
  }

  // Fetch regular posts from content/posts table
  private static async fetchPosts(limit: number): Promise<UnifiedFeedItem[]> {
    try {
      let data: any[] | null = null;
      
      // Try 'content' table first
      const { data: contentData, error: contentError } = await supabase
        .from('content')
        .select(`
          *,
          profiles!content_user_id_fkey (
            name,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (contentError) {
        console.log('Content table query error (may not exist yet):', contentError.message);
        
        // Try 'posts' table as fallback
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_user_id_fkey (
              name,
              username,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (postsError) {
          console.log('Posts fallback error:', postsError.message);
          return [];
        }

        data = postsData;
      } else {
        data = contentData;
      }

      if (!data) return [];

      return data.map(post => ({
        id: post.id,
        type: 'post' as const,
        title: post.title || 'Untitled Post',
        description: post.content,
        content: post.content,
        mediaUrl: post.media_url || post.media_urls?.[0],
        thumbnailUrl: post.media_url || post.media_urls?.[0],
        location: post.location,
        category: post.category,
        tags: post.tags || [],
        userId: post.user_id,
        userProfile: post.profiles ? {
          name: post.profiles.name,
          username: post.profiles.username,
          avatarUrl: post.profiles.avatar_url
        } : undefined,
        createdAt: post.created_at,
        viewCount: post.view_count || 0,
        likeCount: post.like_count || 0
      }));
    } catch (error) {
      console.log('Error fetching posts:', error);
      return [];
    }
  }

  // Fetch music posts
  private static async fetchMusicPosts(limit: number): Promise<UnifiedFeedItem[]> {
    try {
      const { data, error } = await supabase
        .from('music_posts')
        .select(`
          *,
          profiles!music_posts_user_id_fkey (
            name,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.log('Music posts not available:', error.message);
        return [];
      }

      if (!data) return [];

      return data.map(music => ({
        id: music.id,
        type: 'music' as const,
        title: music.title,
        description: `${music.artist}${music.album ? ` - ${music.album}` : ''}`,
        mediaUrl: music.audio_url,
        thumbnailUrl: music.cover_image_url,
        category: music.genre,
        userId: music.user_id,
        userProfile: music.profiles ? {
          name: music.profiles.name,
          username: music.profiles.username,
          avatarUrl: music.profiles.avatar_url
        } : undefined,
        createdAt: music.created_at,
        viewCount: music.play_count || 0,
        extraData: {
          artist: music.artist,
          album: music.album,
          duration: music.duration
        }
      }));
    } catch (error) {
      console.log('Error fetching music posts:', error);
      return [];
    }
  }

  // Fetch video posts
  private static async fetchVideoPosts(limit: number): Promise<UnifiedFeedItem[]> {
    try {
      const { data, error } = await supabase
        .from('video_posts')
        .select(`
          *,
          profiles!video_posts_user_id_fkey (
            name,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.log('Video posts not available:', error.message);
        return [];
      }

      if (!data) return [];

      return data.map(video => ({
        id: video.id,
        type: 'video' as const,
        title: video.title,
        description: video.description,
        mediaUrl: video.video_url,
        thumbnailUrl: video.thumbnail_url,
        userId: video.user_id,
        userProfile: video.profiles ? {
          name: video.profiles.name,
          username: video.profiles.username,
          avatarUrl: video.profiles.avatar_url
        } : undefined,
        createdAt: video.created_at,
        viewCount: video.view_count || 0,
        extraData: {
          duration: video.duration,
          resolution: video.resolution
        }
      }));
    } catch (error) {
      console.log('Error fetching video posts:', error);
      return [];
    }
  }

  // Fetch document posts
  private static async fetchDocumentPosts(limit: number): Promise<UnifiedFeedItem[]> {
    try {
      const { data, error } = await supabase
        .from('document_posts')
        .select(`
          *,
          profiles!document_posts_user_id_fkey (
            name,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.log('Document posts not available:', error.message);
        return [];
      }

      if (!data) return [];

      return data.map(doc => ({
        id: doc.id,
        type: 'document' as const,
        title: doc.title,
        description: doc.description,
        mediaUrl: doc.document_url,
        userId: doc.user_id,
        userProfile: doc.profiles ? {
          name: doc.profiles.name,
          username: doc.profiles.username,
          avatarUrl: doc.profiles.avatar_url
        } : undefined,
        createdAt: doc.created_at,
        extraData: {
          fileType: doc.file_type,
          fileSize: doc.file_size,
          pageCount: doc.page_count,
          downloadCount: doc.download_count
        }
      }));
    } catch (error) {
      console.log('Error fetching document posts:', error);
      return [];
    }
  }

  // Fetch events
  private static async fetchEvents(limit: number): Promise<UnifiedFeedItem[]> {
    try {
      const { data, error } = await supabase
        .from('advanced_events')
        .select(`
          *,
          profiles!advanced_events_user_id_fkey (
            name,
            username,
            avatar_url
          )
        `)
        .eq('status', 'published')
        .order('start_date', { ascending: true })
        .limit(limit);

      if (error) {
        console.log('Events not available:', error.message);
        return [];
      }

      if (!data) return [];

      return data.map(event => ({
        id: event.id,
        type: 'event' as const,
        title: event.title,
        description: event.description,
        mediaUrl: event.cover_image_url,
        thumbnailUrl: event.cover_image_url,
        price: event.is_free ? 0 : (event.ticket_tiers?.[0]?.price || 0),
        currency: 'USD',
        location: `${event.city}, ${event.country}`,
        category: event.category,
        tags: event.tags || [],
        userId: event.user_id,
        userProfile: event.profiles ? {
          name: event.profiles.name,
          username: event.profiles.username,
          avatarUrl: event.profiles.avatar_url
        } : undefined,
        createdAt: event.created_at,
        extraData: {
          startDate: event.start_date,
          endDate: event.end_date,
          venueName: event.venue_name,
          eventType: event.event_type,
          capacity: event.total_capacity,
          attendeeCount: event.attendee_count
        }
      }));
    } catch (error) {
      console.log('Error fetching events:', error);
      return [];
    }
  }

  // Fetch advanced listings (products with variants)
  private static async fetchListings(limit: number): Promise<UnifiedFeedItem[]> {
    try {
      const { data, error } = await supabase
        .from('advanced_listings')
        .select(`
          *,
          profiles!advanced_listings_user_id_fkey (
            name,
            username,
            avatar_url
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.log('Advanced listings not available:', error.message);
        return [];
      }

      if (!data) return [];

      return data.map(listing => ({
        id: listing.id,
        type: 'listing' as const,
        title: listing.title,
        description: listing.description,
        mediaUrl: listing.cover_image_url || listing.gallery_images?.[0],
        thumbnailUrl: listing.cover_image_url || listing.gallery_images?.[0],
        location: `${listing.city}, ${listing.country}`,
        category: listing.category,
        tags: listing.tags || [],
        userId: listing.user_id,
        userProfile: listing.profiles ? {
          name: listing.profiles.name,
          username: listing.profiles.username,
          avatarUrl: listing.profiles.avatar_url
        } : undefined,
        createdAt: listing.created_at,
        viewCount: listing.view_count || 0,
        extraData: {
          listingType: listing.listing_type,
          variantCount: listing.variant_count,
          isVerified: listing.is_verified
        }
      }));
    } catch (error) {
      console.log('Error fetching listings:', error);
      return [];
    }
  }

  // Fetch bookable listings (rentals, hotels)
  private static async fetchBookableListings(limit: number): Promise<UnifiedFeedItem[]> {
    try {
      const { data, error } = await supabase
        .from('bookable_listings')
        .select(`
          *,
          profiles!bookable_listings_user_id_fkey (
            name,
            username,
            avatar_url
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.log('Bookable listings not available:', error.message);
        return [];
      }

      if (!data) return [];

      return data.map(booking => ({
        id: booking.id,
        type: 'booking' as const,
        title: booking.title,
        description: booking.description,
        mediaUrl: booking.images?.[0],
        thumbnailUrl: booking.images?.[0],
        price: booking.base_price,
        currency: booking.currency || 'USD',
        location: `${booking.city}, ${booking.country}`,
        category: booking.property_type,
        userId: booking.user_id,
        userProfile: booking.profiles ? {
          name: booking.profiles.name,
          username: booking.profiles.username,
          avatarUrl: booking.profiles.avatar_url
        } : undefined,
        createdAt: booking.created_at,
        extraData: {
          listingType: booking.listing_type,
          bedrooms: booking.bedrooms,
          bathrooms: booking.bathrooms,
          maxGuests: booking.max_guests,
          averageRating: booking.average_rating,
          reviewCount: booking.review_count
        }
      }));
    } catch (error) {
      console.log('Error fetching bookable listings:', error);
      return [];
    }
  }

  // Fetch auctions (basic consumer auctions)
  private static async fetchAuctions(limit: number): Promise<UnifiedFeedItem[]> {
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select(`
          *,
          seller:profiles!user_id(
            name,
            username,
            avatar_url
          )
        `)
        .in('status', ['scheduled', 'live'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.log('Auctions not available:', error.message);
        return [];
      }

      if (!data) return [];

      return data.map(auction => ({
        id: auction.id,
        type: 'auction' as const,
        title: auction.title,
        description: auction.description,
        mediaUrl: auction.primary_image_url || auction.images?.[0],
        thumbnailUrl: auction.primary_image_url || auction.images?.[0],
        price: auction.current_bid || auction.starting_price,
        currency: auction.currency || 'USD',
        location: auction.location,
        category: auction.category,
        tags: auction.tags || [],
        userId: auction.user_id,
        userProfile: auction.seller ? {
          name: auction.seller.name,
          username: auction.seller.username,
          avatarUrl: auction.seller.avatar_url
        } : undefined,
        createdAt: auction.created_at,
        viewCount: auction.view_count || 0,
        extraData: {
          endTime: auction.end_time,
          bidCount: auction.bid_count,
          reservePrice: auction.reserve_price,
          buyNowPrice: auction.buy_now_price,
          status: auction.status,
          shippingAvailable: auction.shipping_available
        }
      }));
    } catch (error) {
      console.log('Error fetching auctions:', error);
      return [];
    }
  }

  // Fetch fundraisers (crowdfunding campaigns)
  private static async fetchFundraisers(limit: number): Promise<UnifiedFeedItem[]> {
    try {
      const { data, error } = await supabase
        .from('fundraisers')
        .select(`
          *,
          creator:profiles!user_id(
            name,
            username,
            avatar_url
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.log('Fundraisers not available:', error.message);
        return [];
      }

      if (!data) return [];

      return data.map(fundraiser => ({
        id: fundraiser.id,
        type: 'fundraiser' as const,
        title: fundraiser.title,
        description: fundraiser.story,
        mediaUrl: fundraiser.cover_image_url,
        thumbnailUrl: fundraiser.cover_image_url,
        price: fundraiser.min_contribution,
        currency: fundraiser.currency || 'USD',
        location: fundraiser.city && fundraiser.country ? `${fundraiser.city}, ${fundraiser.country}` : undefined,
        category: fundraiser.category,
        tags: fundraiser.tags || [],
        userId: fundraiser.user_id,
        userProfile: fundraiser.creator ? {
          name: fundraiser.creator.name,
          username: fundraiser.creator.username,
          avatarUrl: fundraiser.creator.avatar_url
        } : undefined,
        createdAt: fundraiser.created_at,
        viewCount: fundraiser.view_count || 0,
        extraData: {
          goalAmount: fundraiser.goal_amount,
          currentAmount: fundraiser.current_amount,
          backerCount: fundraiser.backer_count,
          endDate: fundraiser.end_date,
          campaignType: fundraiser.campaign_type,
          hasRewards: fundraiser.has_rewards,
          progressPercentage: (fundraiser.current_amount / fundraiser.goal_amount) * 100
        }
      }));
    } catch (error) {
      console.log('Error fetching fundraisers:', error);
      return [];
    }
  }

  // Fetch enterprise auction lots (Sotheby's-level)
  private static async fetchAuctionLots(limit: number): Promise<UnifiedFeedItem[]> {
    try {
      const { data, error } = await supabase
        .from('auction_lots')
        .select(`
          *,
          auction_event:auction_events(
            id,
            title,
            status,
            bidding_start_date,
            live_auction_date
          ),
          consignor:profiles!consignor_id(
            name,
            username,
            avatar_url
          )
        `)
        .in('status', ['cataloged', 'active'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.log('Auction lots not available:', error.message);
        return [];
      }

      if (!data) return [];

      return data.map(lot => ({
        id: lot.id,
        type: 'auction_lot' as const,
        title: lot.title,
        description: lot.description,
        mediaUrl: lot.primary_image_url || lot.images?.[0],
        thumbnailUrl: lot.primary_image_url || lot.images?.[0],
        price: lot.current_bid || lot.starting_bid || lot.estimate_low,
        currency: lot.currency || 'USD',
        category: lot.category,
        tags: [],
        userId: lot.consignor_id,
        userProfile: lot.consignor ? {
          name: lot.consignor.name,
          username: lot.consignor.username,
          avatarUrl: lot.consignor.avatar_url
        } : undefined,
        createdAt: lot.created_at,
        viewCount: lot.view_count || 0,
        extraData: {
          lotNumber: lot.lot_number,
          estimateLow: lot.estimate_low,
          estimateHigh: lot.estimate_high,
          artistMaker: lot.artist_maker,
          provenance: lot.provenance,
          auctionEvent: lot.auction_event,
          bidCount: lot.bid_count,
          status: lot.status,
          certificateOfAuthenticity: lot.certificate_of_authenticity
        }
      }));
    } catch (error) {
      console.log('Error fetching auction lots:', error);
      return [];
    }
  }

  // Fetch reservation businesses (restaurants, salons, etc.)
  private static async fetchReservationBusinesses(limit: number): Promise<UnifiedFeedItem[]> {
    try {
      const { data, error } = await supabase
        .from('reservation_businesses')
        .select(`
          *,
          owner:profiles!owner_id(
            name,
            username,
            avatar_url
          )
        `)
        .eq('status', 'active')
        .order('average_rating', { ascending: false })
        .limit(limit);

      if (error) {
        console.log('Reservation businesses not available:', error.message);
        return [];
      }

      if (!data) return [];

      return data.map(business => ({
        id: business.id,
        type: 'reservation_business' as const,
        title: business.business_name,
        description: business.description,
        mediaUrl: business.cover_image_url || business.gallery_images?.[0],
        thumbnailUrl: business.logo_url || business.cover_image_url,
        location: `${business.city}, ${business.country}`,
        category: business.business_type,
        tags: business.tags || [],
        userId: business.owner_id,
        userProfile: business.owner ? {
          name: business.owner.name,
          username: business.owner.username,
          avatarUrl: business.owner.avatar_url
        } : undefined,
        createdAt: business.created_at,
        viewCount: 0,
        extraData: {
          businessType: business.business_type,
          averageRating: business.average_rating,
          reviewCount: business.review_count,
          cuisineTypes: business.cuisine_types,
          amenities: business.amenities,
          acceptsReservations: business.accepts_reservations,
          operatingHours: business.operating_hours
        }
      }));
    } catch (error) {
      console.log('Error fetching reservation businesses:', error);
      return [];
    }
  }
}

