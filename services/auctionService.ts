import { supabase } from './supabaseClient';
import type {
  Auction,
  AuctionBid,
  AuctionWatcher,
  CreateAuctionRequest,
  UpdateAuctionRequest,
  PlaceBidRequest,
  AuctionFilters,
  LiveAuctionView
} from '../types/auctions';

export class AuctionService {
  // ============= AUCTION LISTINGS =============
  
  /**
   * Get all auctions with optional filters
   */
  static async getAuctions(filters?: AuctionFilters): Promise<Auction[]> {
    let query = supabase
      .from('auctions')
      .select(`
        *,
        seller:profiles!user_id(id, username, avatar_url),
        current_winner:profiles!current_winner_id(id, username)
      `);
    
    // Apply filters
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    
    if (filters?.min_price) {
      query = query.gte('starting_price', filters.min_price);
    }
    
    if (filters?.max_price) {
      query = query.lte('starting_price', filters.max_price);
    }
    
    if (filters?.condition && filters.condition.length > 0) {
      query = query.in('condition', filters.condition);
    }
    
    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    
    if (filters?.shipping_available !== undefined) {
      query = query.eq('shipping_available', filters.shipping_available);
    }
    
    if (filters?.ending_soon) {
      const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      query = query
        .eq('status', 'live')
        .lte('end_time', in24Hours);
    }
    
    if (filters?.no_reserve) {
      query = query.is('reserve_price', null);
    }
    
    if (filters?.has_bids) {
      query = query.gt('bid_count', 0);
    }
    
    if (filters?.is_featured) {
      query = query.eq('is_featured', true);
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }
    
    if (filters?.search_query) {
      query = query.or(`title.ilike.%${filters.search_query}%,description.ilike.%${filters.search_query}%`);
    }
    
    // Sorting
    switch (filters?.sort_by) {
      case 'ending_soon':
        query = query.order('end_time', { ascending: true });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'price_low':
        query = query.order('starting_price', { ascending: true });
        break;
      case 'price_high':
        query = query.order('starting_price', { ascending: false });
        break;
      case 'most_bids':
        query = query.order('bid_count', { ascending: false });
        break;
      case 'most_watched':
        query = query.order('watch_count', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }
    
    // Pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Get a single auction by ID
   */
  static async getAuction(id: string): Promise<Auction | null> {
    const { data, error } = await supabase
      .from('auctions')
      .select(`
        *,
        seller:profiles!user_id(id, username, avatar_url),
        current_winner:profiles!current_winner_id(id, username)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get live auctions (using database view)
   */
  static async getLiveAuctions(): Promise<LiveAuctionView[]> {
    const { data, error } = await supabase
      .from('live_auctions')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Create a new auction
   */
  static async createAuction(userId: string, auction: CreateAuctionRequest): Promise<Auction> {
    const { data, error } = await supabase
      .from('auctions')
      .insert({
        user_id: userId,
        ...auction,
        status: 'draft'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Update an auction
   */
  static async updateAuction(id: string, updates: UpdateAuctionRequest): Promise<Auction> {
    const { data, error } = await supabase
      .from('auctions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Delete an auction
   */
  static async deleteAuction(id: string): Promise<void> {
    const { error } = await supabase
      .from('auctions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
  
  /**
   * Publish an auction (change status from draft to scheduled/live)
   */
  static async publishAuction(id: string): Promise<Auction> {
    const auction = await this.getAuction(id);
    if (!auction) throw new Error('Auction not found');
    
    const now = new Date();
    const startTime = new Date(auction.start_time);
    const status = startTime <= now ? 'live' : 'scheduled';
    
    return this.updateAuction(id, { status });
  }
  
  /**
   * Get user's auctions
   */
  static async getUserAuctions(userId: string): Promise<Auction[]> {
    const { data, error } = await supabase
      .from('auctions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  // ============= BIDDING =============
  
  /**
   * Get bids for an auction
   */
  static async getAuctionBids(auctionId: string): Promise<AuctionBid[]> {
    const { data, error } = await supabase
      .from('auction_bids')
      .select(`
        *,
        bidder:profiles!bidder_id(id, username, avatar_url)
      `)
      .eq('auction_id', auctionId)
      .order('placed_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Place a bid on an auction
   */
  static async placeBid(userId: string, bid: PlaceBidRequest): Promise<AuctionBid> {
    // Get current auction to validate bid
    const auction = await this.getAuction(bid.auction_id);
    if (!auction) throw new Error('Auction not found');
    
    // Validate auction is live
    if (auction.status !== 'live') {
      throw new Error('Auction is not currently live');
    }
    
    // Validate bid amount
    const minimumBid = (auction.current_bid || auction.starting_price) + auction.min_bid_increment;
    if (bid.bid_amount < minimumBid) {
      throw new Error(`Bid must be at least ${minimumBid}`);
    }
    
    // Place the bid (trigger will handle auction updates)
    const { data, error } = await supabase
      .from('auction_bids')
      .insert({
        auction_id: bid.auction_id,
        bidder_id: userId,
        bid_amount: bid.bid_amount,
        is_auto_bid: bid.is_auto_bid || false,
        max_auto_bid: bid.max_auto_bid
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Get user's bids
   */
  static async getUserBids(userId: string): Promise<AuctionBid[]> {
    const { data, error } = await supabase
      .from('auction_bids')
      .select(`
        *,
        auction:auctions(*)
      `)
      .eq('bidder_id', userId)
      .order('placed_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Get user's winning bids
   */
  static async getUserWinningBids(userId: string): Promise<AuctionBid[]> {
    const { data, error } = await supabase
      .from('auction_bids')
      .select(`
        *,
        auction:auctions(*)
      `)
      .eq('bidder_id', userId)
      .eq('is_winning', true)
      .order('placed_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  // ============= WATCHING =============
  
  /**
   * Watch an auction
   */
  static async watchAuction(userId: string, auctionId: string): Promise<AuctionWatcher> {
    const { data, error } = await supabase
      .from('auction_watchers')
      .insert({
        user_id: userId,
        auction_id: auctionId
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Increment watch count
    await supabase
      .from('auctions')
      .update({ watch_count: supabase.sql`watch_count + 1` })
      .eq('id', auctionId);
    
    return data;
  }
  
  /**
   * Unwatch an auction
   */
  static async unwatchAuction(userId: string, auctionId: string): Promise<void> {
    const { error } = await supabase
      .from('auction_watchers')
      .delete()
      .eq('user_id', userId)
      .eq('auction_id', auctionId);
    
    if (error) throw error;
    
    // Decrement watch count
    await supabase
      .from('auctions')
      .update({ watch_count: supabase.sql`GREATEST(0, watch_count - 1)` })
      .eq('id', auctionId);
  }
  
  /**
   * Check if user is watching an auction
   */
  static async isWatching(userId: string, auctionId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('auction_watchers')
      .select('id')
      .eq('user_id', userId)
      .eq('auction_id', auctionId)
      .single();
    
    return !error && !!data;
  }
  
  /**
   * Get user's watched auctions
   */
  static async getUserWatchedAuctions(userId: string): Promise<Auction[]> {
    const { data, error } = await supabase
      .from('auction_watchers')
      .select(`
        auction:auctions(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data?.map(item => item.auction).filter(Boolean) || [];
  }
  
  // ============= ADMIN FUNCTIONS =============
  
  /**
   * Close ended auctions (should be run periodically)
   */
  static async closeEndedAuctions(): Promise<void> {
    const { error } = await supabase.rpc('close_ended_auctions');
    if (error) throw error;
  }
  
  /**
   * Increment view count
   */
  static async incrementViewCount(auctionId: string): Promise<void> {
    const { error } = await supabase
      .from('auctions')
      .update({ view_count: supabase.sql`view_count + 1` })
      .eq('id', auctionId);
    
    if (error) throw error;
  }
}

