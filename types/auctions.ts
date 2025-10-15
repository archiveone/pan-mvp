// Auction System Types

export type AuctionStatus = 'draft' | 'scheduled' | 'live' | 'ended' | 'sold' | 'cancelled';
export type BidStatus = 'active' | 'outbid' | 'winning' | 'won' | 'lost' | 'retracted';
export type ItemCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

// Auction Listing
export interface Auction {
  id: string;
  user_id: string;
  
  // Auction Details
  title: string;
  description: string;
  category: string;
  
  // Item Details
  condition?: ItemCondition;
  starting_price: number;
  reserve_price?: number;
  buy_now_price?: number;
  currency: string;
  
  // Bidding Rules
  min_bid_increment: number;
  bid_count: number;
  current_bid?: number;
  current_winner_id?: string;
  
  // Timing
  start_time: string;
  end_time: string;
  auto_extend: boolean;
  extension_minutes: number;
  
  // Media
  images: string[];
  primary_image_url?: string;
  video_url?: string;
  
  // Location
  location?: string;
  shipping_available: boolean;
  local_pickup: boolean;
  shipping_cost: number;
  
  // Status
  status: AuctionStatus;
  is_featured: boolean;
  
  // Metrics
  view_count: number;
  watch_count: number;
  
  // Tags
  tags: string[];
  
  created_at: string;
  updated_at: string;
  
  // Joined data (optional)
  seller?: {
    id: string;
    username?: string;
    avatar_url?: string;
  };
  current_winner?: {
    id: string;
    username?: string;
  };
}

// Auction Bid
export interface AuctionBid {
  id: string;
  auction_id: string;
  bidder_id: string;
  
  // Bid Details
  bid_amount: number;
  is_auto_bid: boolean;
  max_auto_bid?: number;
  
  // Status
  status: BidStatus;
  is_winning: boolean;
  
  // Timestamps
  placed_at: string;
  outbid_at?: string;
  
  // Metadata
  bid_number: number;
  ip_address?: string;
  user_agent?: string;
  
  // Joined data (optional)
  bidder?: {
    id: string;
    username?: string;
    avatar_url?: string;
  };
  auction?: Auction;
}

// Auction Watcher
export interface AuctionWatcher {
  id: string;
  auction_id: string;
  user_id: string;
  notify_on_bid: boolean;
  notify_on_outbid: boolean;
  notify_on_end: boolean;
  created_at: string;
}

// Create Auction Request
export interface CreateAuctionRequest {
  title: string;
  description: string;
  category: string;
  condition?: ItemCondition;
  starting_price: number;
  reserve_price?: number;
  buy_now_price?: number;
  currency?: string;
  min_bid_increment?: number;
  start_time: string;
  end_time: string;
  auto_extend?: boolean;
  extension_minutes?: number;
  images?: string[];
  primary_image_url?: string;
  video_url?: string;
  location?: string;
  shipping_available?: boolean;
  local_pickup?: boolean;
  shipping_cost?: number;
  tags?: string[];
}

// Update Auction Request
export interface UpdateAuctionRequest {
  title?: string;
  description?: string;
  category?: string;
  condition?: ItemCondition;
  reserve_price?: number;
  buy_now_price?: number;
  start_time?: string;
  end_time?: string;
  images?: string[];
  video_url?: string;
  location?: string;
  shipping_available?: boolean;
  local_pickup?: boolean;
  shipping_cost?: number;
  tags?: string[];
  status?: AuctionStatus;
}

// Place Bid Request
export interface PlaceBidRequest {
  auction_id: string;
  bid_amount: number;
  is_auto_bid?: boolean;
  max_auto_bid?: number;
}

// Auction Filters
export interface AuctionFilters {
  category?: string;
  status?: AuctionStatus[];
  min_price?: number;
  max_price?: number;
  condition?: ItemCondition[];
  location?: string;
  shipping_available?: boolean;
  ending_soon?: boolean; // Within 24 hours
  no_reserve?: boolean; // No reserve price
  has_bids?: boolean;
  is_featured?: boolean;
  tags?: string[];
  search_query?: string;
  sort_by?: 'ending_soon' | 'newest' | 'price_low' | 'price_high' | 'most_bids' | 'most_watched';
  limit?: number;
  offset?: number;
}

// Auction Analytics
export interface AuctionAnalytics {
  total_auctions: number;
  active_auctions: number;
  total_bids: number;
  total_revenue: number;
  average_final_price: number;
  average_bids_per_auction: number;
  sell_through_rate: number; // Percentage of auctions that sold
  period: {
    start_date: string;
    end_date: string;
  };
}

// Live Auction View (from database view)
export interface LiveAuctionView extends Auction {
  seller_username?: string;
  seller_avatar?: string;
  current_winner_username?: string;
  unique_bidders: number;
  time_remaining?: number; // In seconds
}

