import { supabase } from '@/lib/supabase';

export interface HomepageListing {
  id: string;
  user_id: string;
  type?: string;
  title: string;
  content?: string;
  media_url?: string;
  price_amount?: number;
  price_unit?: string;
  price_numeric?: number;
  currency?: string;
  location?: string;
  datetime?: string;
  event_date?: string;
  event_time?: string;
  event_end_time?: string;
  capacity?: number;
  is_flagged?: boolean;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  content_type?: string;
  tags?: string[];
  is_published?: boolean;
  is_featured?: boolean;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  safety_score?: number;
  safety_checked?: boolean;
  safety_violations?: string[];
  is_safety_approved?: boolean;
  custom_content_type?: string;
  business_type?: string;
  event_type?: string;
  age_restriction?: string;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  beds?: number;
  guest_capacity?: number;
  min_stay?: string;
  amenities?: string[];
  house_rules?: string[];
  safety_features?: string[];
  check_in_time?: string;
  check_out_time?: string;
  streaming_price?: number;
  download_price?: number;
  is_streamable?: boolean;
  is_downloadable?: boolean;
  category?: string;
  price?: string;
  moderation_status?: string;
  moderation_notes?: string;
  moderated_by?: string;
  moderated_at?: string;
  profiles?: {
    id: string;
    name?: string;
    username?: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
}

export interface HomepageFilters {
  searchTerm?: string;
  category?: string;
  location?: string;
  priceRange?: { min: number; max: number };
  date?: string;
  availability?: 'all' | 'available' | 'scheduled';
  sortBy?: 'relevance' | 'price-low' | 'price-high' | 'newest' | 'oldest';
}

export class HomepageService {
  /**
   * Fetch listings for homepage with proper joins and filtering
   */
  static async getHomepageListings(filters: HomepageFilters = {}): Promise<{
    success: boolean;
    listings?: HomepageListing[];
    error?: string;
  }> {
    try {
      // console.log('🔍 HomepageService: Starting query with filters:', filters)
      
      let query = supabase
        .from('posts')
        .select(`
          id,
          user_id,
          title,
          content,
          media_url,
          price_amount,
          currency,
          location,
          category,
          created_at,
          updated_at,
          is_published,
          is_safety_approved,
          profiles!posts_user_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `)
        // .eq('is_published', true) // Commented out until migration is run
        // .eq('is_safety_approved', true)

      // Apply filters
      if (filters.category && filters.category !== 'All') {
        query = query.eq('category', filters.category);
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      // Price range filtering - temporarily disabled to show all posts
      // if (filters.priceRange) {
      //   if (filters.priceRange.min > 0) {
      //     query = query.or(`price_amount.gte.${filters.priceRange.min},price_amount.is.null`);
      //   }
      //   if (filters.priceRange.max < 10000) {
      //     query = query.or(`price_amount.lte.${filters.priceRange.max},price_amount.is.null`);
      //   }
      // }

      if (filters.availability === 'scheduled') {
        query = query.not('event_date', 'is', null);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'price-low':
          query = query.order('price_amount', { ascending: true, nullsLast: true });
          break;
        case 'price-high':
          query = query.order('price_amount', { ascending: false, nullsLast: true });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(50);

      // console.log('🔍 HomepageService: Query executed, data length:', data?.length || 0)
      // console.log('🔍 HomepageService: Query error:', error)

      if (error) {
        console.error('❌ Error fetching homepage listings:', error);
        return { success: false, error: error.message };
      }

      // Transform the data to match our interface
      const transformedListings: HomepageListing[] = (data || []).map(post => ({
        id: post.id,
        user_id: post.user_id,
        title: post.title,
        content: post.content,
        media_url: post.media_url,
        price_amount: post.price_amount,
        currency: post.currency,
        location: post.location,
        category: post.category || 'General',
        created_at: post.created_at,
        updated_at: post.updated_at,
        is_published: post.is_published,
        is_safety_approved: post.is_safety_approved,
        profiles: post.profiles ? {
          id: post.profiles.id,
          name: post.profiles.name,
          username: post.profiles.username || post.profiles.name,
          avatar_url: post.profiles.avatar_url,
          is_verified: false
        } : undefined
      }));

      // Apply search filter after fetching (since we want to search across title and content)
      let filteredListings = transformedListings;
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredListings = transformedListings.filter(listing =>
          listing.title?.toLowerCase().includes(searchLower) ||
          listing.content?.toLowerCase().includes(searchLower) ||
          listing.category?.toLowerCase().includes(searchLower)
        );
      }

      // console.log('🔍 HomepageService: Returning', filteredListings.length, 'listings')
      return { success: true, listings: filteredListings };
    } catch (error) {
      console.error('Error in getHomepageListings:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get featured listings for homepage banner
   */
  static async getFeaturedListings(): Promise<{
    success: boolean;
    listings?: HomepageListing[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          type,
          title,
          content,
          media_url,
          price_amount,
          price_unit,
          price_numeric,
          currency,
          location,
          datetime,
          event_date,
          event_time,
          event_end_time,
          capacity,
          is_flagged,
          parent_id,
          created_at,
          updated_at,
          content_type,
          tags,
          is_published,
          is_featured,
          view_count,
          like_count,
          comment_count,
          safety_score,
          safety_checked,
          safety_violations,
          is_safety_approved,
          custom_content_type,
          business_type,
          event_type,
          age_restriction,
          property_type,
          bedrooms,
          bathrooms,
          beds,
          guest_capacity,
          min_stay,
          amenities,
          house_rules,
          safety_features,
          check_in_time,
          check_out_time,
          streaming_price,
          download_price,
          is_streamable,
          is_downloadable,
          category,
          price,
          moderation_status,
          moderation_notes,
          moderated_by,
          moderated_at,
          profiles!posts_user_id_fkey (
            id,
            name,
            username,
            avatar_url,
            is_verified
          )
        `)
        // .eq('is_published', true) // Commented out until migration is run
        // .eq('is_safety_approved', true)
        // .eq('moderation_status', 'approved') // Commented out until migration is run
        .not('media_url', 'is', null)
        .order('is_featured', { ascending: false, nullsLast: true })
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching featured listings:', error);
        return { success: false, error: error.message };
      }

      const featuredListings: HomepageListing[] = (data || []).map(post => ({
        id: post.id,
        user_id: post.user_id,
        type: post.type,
        title: post.title,
        content: post.content,
        media_url: post.media_url,
        price_amount: post.price_amount,
        price_unit: post.price_unit,
        price_numeric: post.price_numeric,
        currency: post.currency,
        location: post.location,
        datetime: post.datetime,
        event_date: post.event_date,
        event_time: post.event_time,
        event_end_time: post.event_end_time,
        capacity: post.capacity,
        is_flagged: post.is_flagged,
        parent_id: post.parent_id,
        created_at: post.created_at,
        updated_at: post.updated_at,
        content_type: post.content_type,
        tags: post.tags,
        is_published: post.is_published,
        is_featured: post.is_featured,
        view_count: post.view_count,
        like_count: post.like_count,
        comment_count: post.comment_count,
        safety_score: post.safety_score,
        safety_checked: post.safety_checked,
        safety_violations: post.safety_violations,
        is_safety_approved: post.is_safety_approved,
        custom_content_type: post.custom_content_type,
        business_type: post.business_type,
        event_type: post.event_type,
        age_restriction: post.age_restriction,
        property_type: post.property_type,
        bedrooms: post.bedrooms,
        bathrooms: post.bathrooms,
        beds: post.beds,
        guest_capacity: post.guest_capacity,
        min_stay: post.min_stay,
        amenities: post.amenities,
        house_rules: post.house_rules,
        safety_features: post.safety_features,
        check_in_time: post.check_in_time,
        check_out_time: post.check_out_time,
        streaming_price: post.streaming_price,
        download_price: post.download_price,
        is_streamable: post.is_streamable,
        is_downloadable: post.is_downloadable,
        category: post.category || 'General',
        price: post.price,
        moderation_status: post.moderation_status,
        moderation_notes: post.moderation_notes,
        moderated_by: post.moderated_by,
        moderated_at: post.moderated_at,
        profiles: post.profiles ? {
          id: post.profiles.id,
          name: post.profiles.name,
          username: post.profiles.username || post.profiles.name,
          avatar_url: post.profiles.avatar_url,
          is_verified: post.profiles.is_verified
        } : undefined
      }));

      return { success: true, listings: featuredListings };
    } catch (error) {
      console.error('Error in getFeaturedListings:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get categories with counts for homepage
   */
  static async getCategoriesWithCounts(): Promise<{
    success: boolean;
    categories?: Array<{ name: string; count: number }>;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('category')
        // .eq('is_published', true) // Commented out until migration is run
        // .eq('is_safety_approved', true)
        .eq('is_sold', false);

      if (error) {
        console.error('Error fetching categories:', error);
        return { success: false, error: error.message };
      }

      // Count categories
      const categoryCounts: Record<string, number> = {};
      (data || []).forEach(post => {
        const category = post.category || 'General';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });

      const categories = Object.entries(categoryCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return { success: true, categories };
    } catch (error) {
      console.error('Error in getCategoriesWithCounts:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Get trending listings based on recent activity
   */
  static async getTrendingListings(): Promise<{
    success: boolean;
    listings?: HomepageListing[];
    error?: string;
  }> {
    try {
      // For now, just get recent listings with good engagement
      // In the future, this could be based on views, likes, comments, etc.
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          price,
          currency,
          price_amount,
          category,
          location,
          media_url,
          user_id,
          created_at,
          profiles!posts_user_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `)
        // .eq('is_published', true) // Commented out until migration is run
        // .eq('is_safety_approved', true)
        .not('media_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) {
        console.error('Error fetching trending listings:', error);
        return { success: false, error: error.message };
      }

      const trendingListings: HomepageListing[] = (data || []).map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        price: post.price || (post.price_amount ? `${post.price_amount} ${post.currency || 'USD'}` : undefined),
        currency: post.currency,
        price_amount: post.price_amount,
        category: post.category || 'General',
        location: post.location,
        user_id: post.user_id,
        created_at: post.created_at,
        updated_at: post.created_at,
        is_published: true,
        media_url: post.media_url,
        image_url: post.media_url,
        is_safety_approved: true,
        is_sold: false,
        profiles: post.profiles ? {
          id: post.profiles.id,
          name: post.profiles.name,
          username: post.profiles.username || post.profiles.name,
          avatar_url: post.profiles.avatar_url,
          is_verified: false
        } : undefined
      }));

      return { success: true, listings: trendingListings };
    } catch (error) {
      console.error('Error in getTrendingListings:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}
