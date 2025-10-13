import { supabase } from '@/lib/supabase';
import { 
  UnifiedContent, 
  Listing, 
  Post, 
  Group, 
  Event, 
  Comment, 
  Review, 
  Purchase,
  SearchFilters,
  SearchResults,
  ContentType,
  ListingStatus,
  PostStatus,
  GroupStatus
} from '@/types/content';

export class ContentService {
  
  // ==================== UNIFIED CONTENT METHODS ====================
  
  /**
   * Get unified content with proper typing based on content_type
   */
  static async getContentById(id: string): Promise<{
    success: boolean;
    content?: UnifiedContent;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return { success: true, content: data as UnifiedContent };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Search across all content types with advanced filtering
   */
  static async searchContent(filters: SearchFilters = {}): Promise<{
    success: boolean;
    results?: SearchResults;
    error?: string;
  }> {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `);

      // Apply filters
      if (filters.content_type && filters.content_type.length > 0) {
        query = query.in('content_type', filters.content_type);
      }

      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category);
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters.price_min !== undefined) {
        query = query.gte('price_amount', filters.price_min);
      }

      if (filters.price_max !== undefined) {
        query = query.lte('price_amount', filters.price_max);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.is_featured !== undefined) {
        query = query.eq('is_featured', filters.is_featured);
      }

      // Only show published and approved content
      // TODO: Uncomment after running: supabase/migrations/add_moderation_columns.sql
      // query = query
      //   .eq('is_published', true)
      //   .eq('is_safety_approved', true)
      //   .eq('moderation_status', 'approved');

      // Fetch data first for client-side sorting on trending
      let needsClientSort = filters.sort_by === 'trending';
      
      // Apply sorting for database-supported sorts
      switch (filters.sort_by) {
        case 'trending':
          // For trending, we'll fetch all and sort client-side
          query = query.order('created_at', { ascending: false });
          break;
        case 'popular':
          // Popular: All-time highest engagement
          query = query
            .order('view_count', { ascending: false })
            .order('like_count', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'price_low':
          query = query.order('price_amount', { ascending: true, nullsFirst: false });
          break;
        case 'price_high':
          query = query.order('price_amount', { ascending: false, nullsFirst: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      const limit = filters.limit || 20;
      const offset = filters.offset || 0;
      
      const { data, error, count } = await query
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Supabase query error:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      // Apply text search if provided (post-processing for better relevance)
      let filteredData = data || [];
      if (filters.query) {
        const searchLower = filters.query.toLowerCase();
        filteredData = filteredData.filter(item => 
          item.title?.toLowerCase().includes(searchLower) ||
          item.content?.toLowerCase().includes(searchLower) ||
          item.category?.toLowerCase().includes(searchLower) ||
          item.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      // Apply trending sort if needed (client-side calculation)
      if (needsClientSort && filters.sort_by === 'trending') {
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        filteredData = filteredData.sort((a, b) => {
          // Calculate trending score
          const scoreA = this.calculateTrendingScore(a, now, oneDayMs);
          const scoreB = this.calculateTrendingScore(b, now, oneDayMs);
          return scoreB - scoreA;
        });
      }

      const results: SearchResults = {
        results: filteredData as UnifiedContent[],
        total: count || 0,
        has_more: (offset + limit) < (count || 0),
        filters_applied: filters
      };

      return { success: true, results };
    } catch (error) {
      console.error('❌ Content search failed:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'object' && error !== null
          ? JSON.stringify(error)
          : 'Unknown error'
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * Calculate trending score for a post
   * Combines recency with engagement (views, likes, comments)
   */
  private static calculateTrendingScore(item: any, now: number, oneDayMs: number): number {
    const createdAt = new Date(item.created_at).getTime();
    const ageInDays = (now - createdAt) / oneDayMs;
    
    // Recency multiplier: newer posts get higher multiplier
    // Posts lose 10% of score per day (exponential decay)
    const recencyMultiplier = Math.pow(0.9, ageInDays);
    
    // Engagement score
    const views = item.view_count || 0;
    const likes = item.like_count || 0;
    const comments = item.comment_count || 0;
    
    // Weighted engagement: likes worth more than views
    const engagementScore = (views * 1) + (likes * 10) + (comments * 15);
    
    // Trending score = engagement × recency
    const trendingScore = engagementScore * recencyMultiplier;
    
    // Boost for very recent posts (less than 24 hours old)
    const recentBoost = ageInDays < 1 ? 1.5 : 1;
    
    return trendingScore * recentBoost;
  }

  // ==================== LISTING METHODS ====================

  static async getListings(filters: {
    category?: string;
    location?: string;
    price_min?: number;
    price_max?: number;
    sort_by?: 'newest' | 'price_low' | 'price_high' | 'popular';
    limit?: number;
  } = {}): Promise<{
    success: boolean;
    listings?: Listing[];
    error?: string;
  }> {
    const searchFilters: SearchFilters = {
      ...filters,
      content_type: ['listing'],
      sort_by: filters.sort_by || 'newest'
    };

    const result = await this.searchContent(searchFilters);
    
    if (result.success && result.results) {
      return {
        success: true,
        listings: result.results as Listing[]
      };
    }

    return {
      success: false,
      error: result.error || 'Failed to fetch listings'
    };
  }

  static async getFeaturedListings(limit: number = 6): Promise<{
    success: boolean;
    listings?: Listing[];
    error?: string;
  }> {
    return this.getListings({ 
      sort_by: 'popular',
      limit 
    });
  }

  // ==================== POST METHODS ====================

  static async getPosts(filters: {
    category?: string;
    user_id?: string;
    sort_by?: 'newest' | 'popular';
    limit?: number;
  } = {}): Promise<{
    success: boolean;
    posts?: Post[];
    error?: string;
  }> {
    const searchFilters: SearchFilters = {
      ...filters,
      content_type: ['post'],
      sort_by: filters.sort_by || 'newest'
    };

    const result = await this.searchContent(searchFilters);
    
    if (result.success && result.results) {
      return {
        success: true,
        posts: result.results as Post[]
      };
    }

    return {
      success: false,
      error: result.error || 'Failed to fetch posts'
    };
  }

  // ==================== GROUP METHODS ====================

  static async getGroups(filters: {
    category?: string;
    is_private?: boolean;
    sort_by?: 'newest' | 'popular';
    limit?: number;
  } = {}): Promise<{
    success: boolean;
    groups?: Group[];
    error?: string;
  }> {
    const searchFilters: SearchFilters = {
      ...filters,
      content_type: ['group'],
      sort_by: filters.sort_by || 'newest'
    };

    const result = await this.searchContent(searchFilters);
    
    if (result.success && result.results) {
      return {
        success: true,
        groups: result.results as Group[]
      };
    }

    return {
      success: false,
      error: result.error || 'Failed to fetch groups'
    };
  }

  // ==================== EVENT METHODS ====================

  static async getEvents(filters: {
    category?: string;
    location?: string;
    date_from?: string;
    date_to?: string;
    sort_by?: 'newest' | 'date';
    limit?: number;
  } = {}): Promise<{
    success: boolean;
    events?: Event[];
    error?: string;
  }> {
    const searchFilters: SearchFilters = {
      ...filters,
      content_type: ['event'],
      sort_by: filters.sort_by || 'date'
    };

    const result = await this.searchContent(searchFilters);
    
    if (result.success && result.results) {
      return {
        success: true,
        events: result.results as Event[]
      };
    }

    return {
      success: false,
      error: result.error || 'Failed to fetch events'
    };
  }

  // ==================== COMMENT METHODS ====================

  static async getComments(contentId: string): Promise<{
    success: boolean;
    comments?: Comment[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('content_id', contentId)
        .eq('parent_id', null) // Only top-level comments
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, comments: data as Comment[] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async addComment(contentId: string, userId: string, content: string, parentId?: string): Promise<{
    success: boolean;
    comment?: Comment;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content_id: contentId,
          user_id: userId,
          content,
          parent_id: parentId
        })
        .select(`
          *,
          profiles!comments_user_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return { success: true, comment: data as Comment };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ==================== REVIEW METHODS ====================

  static async getReviews(listingId: string): Promise<{
    success: boolean;
    reviews?: Review[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!reviews_reviewer_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, reviews: data as Review[] };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async addReview(listingId: string, reviewerId: string, rating: number, title: string, content: string): Promise<{
    success: boolean;
    review?: Review;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          listing_id: listingId,
          reviewer_id: reviewerId,
          rating,
          title,
          content
        })
        .select(`
          *,
          profiles!reviews_reviewer_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return { success: true, review: data as Review };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ==================== PURCHASE METHODS ====================

  static async createPurchase(listingId: string, buyerId: string, sellerId: string, amount: number, currency: string): Promise<{
    success: boolean;
    purchase?: Purchase;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .insert({
          listing_id: listingId,
          buyer_id: buyerId,
          seller_id: sellerId,
          amount,
          currency,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, purchase: data as Purchase };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  static async updatePurchaseStatus(purchaseId: string, status: Purchase['status']): Promise<{
    success: boolean;
    purchase?: Purchase;
    error?: string;
  }> {
    try {
      const updateData: any = { status };
      
      // Add timestamp based on status
      switch (status) {
        case 'completed':
          updateData.paid_at = new Date().toISOString();
          break;
        case 'cancelled':
          updateData.cancelled_at = new Date().toISOString();
          break;
      }

      const { data, error } = await supabase
        .from('purchases')
        .update(updateData)
        .eq('id', purchaseId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, purchase: data as Purchase };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // ==================== CONTENT CREATION ====================

  static async createContent(contentData: any): Promise<{
    success: boolean;
    contentId?: string;
    error?: string;
  }> {
    try {
      console.log('📝 ContentService.createContent called with:', contentData)
      
      // Build insert object with only defined values
      const insertData: any = {
        user_id: contentData.user_id,
        title: contentData.title,
        content: contentData.content || contentData.description || 'No description provided', // Ensure not null or empty
        content_type: contentData.content_type || 'post',
        category: contentData.category || 'general',
        is_published: contentData.is_published !== false,
        is_safety_approved: contentData.is_safety_approved !== false,
        moderation_status: contentData.moderation_status || 'approved'
      }
      
      console.log('✏️ Content field value:', insertData.content)
      console.log('✏️ Content length:', insertData.content?.length)
      
      // Add optional fields only if they have values
      if (contentData.media_url) insertData.media_url = contentData.media_url
      if (contentData.media_urls && contentData.media_urls.length > 0) insertData.media_urls = contentData.media_urls
      if (contentData.audio_url) insertData.audio_url = contentData.audio_url
      if (contentData.audio_urls && contentData.audio_urls.length > 0) insertData.audio_urls = contentData.audio_urls
      if (contentData.video_url) insertData.video_url = contentData.video_url
      if (contentData.video_urls && contentData.video_urls.length > 0) insertData.video_urls = contentData.video_urls
      if (contentData.document_urls && contentData.document_urls.length > 0) insertData.document_urls = contentData.document_urls
      if (contentData.location) insertData.location = contentData.location
      if (contentData.tags && contentData.tags.length > 0) insertData.tags = contentData.tags
      if (contentData.price_amount) insertData.price_amount = contentData.price_amount
      if (contentData.price) insertData.price_amount = contentData.price
      if (contentData.membershipFee) insertData.price_amount = contentData.membershipFee
      if (contentData.currency) insertData.currency = contentData.currency
      
      // Event fields
      if (contentData.event_date) insertData.event_date = contentData.event_date
      if (contentData.event_time) insertData.event_time = contentData.event_time
      if (contentData.venue) insertData.venue = contentData.venue
      if (contentData.capacity) insertData.capacity = contentData.capacity
      
      // Group fields
      if (contentData.groupType) insertData.group_type = contentData.groupType
      if (contentData.privacy) insertData.privacy = contentData.privacy
      if (contentData.billingPeriod) insertData.billing_period = contentData.billingPeriod
      if (contentData.maxMembers) insertData.max_members = contentData.maxMembers
      if (contentData.allowDiscussions !== undefined) insertData.allow_discussions = contentData.allowDiscussions
      
      console.log('📤 Inserting data:', insertData)
      
      const { data, error } = await supabase
        .from('posts')
        .insert(insertData)
        .select('id')
        .single();

      if (error) {
        console.error('❌ Supabase insert error:', error)
        throw error;
      }

      console.log('✅ Content inserted successfully:', data)
      return { success: true, contentId: data.id };
    } catch (error) {
      console.error('❌ ContentService.createContent error:', error)
      
      // Extract detailed error message
      let errorMessage = 'Unknown error'
      if (error && typeof error === 'object') {
        if ('message' in error) errorMessage = (error as any).message
        if ('hint' in error) errorMessage += ` (Hint: ${(error as any).hint})`
        if ('details' in error) errorMessage += ` (Details: ${(error as any).details})`
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  static async incrementViewCount(contentId: string): Promise<void> {
    try {
      await supabase.rpc('increment_view_count', { content_id: contentId });
    } catch (error) {
      console.error('Failed to increment view count:', error);
    }
  }

  static async incrementLikeCount(contentId: string): Promise<void> {
    try {
      await supabase.rpc('increment_like_count', { content_id: contentId });
    } catch (error) {
      console.error('Failed to increment like count:', error);
    }
  }
}
