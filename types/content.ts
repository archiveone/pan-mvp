// Unified content types for the marketplace
export type ContentType = 'listing' | 'post' | 'group' | 'event';

export type ListingStatus = 'draft' | 'published' | 'sold' | 'archived';
export type PostStatus = 'draft' | 'published' | 'archived';
export type GroupStatus = 'active' | 'archived';

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged';

// Base content interface
export interface BaseContent {
  id: string;
  user_id: string;
  title: string;
  content: string;
  media_url?: string;
  media_urls?: string[];
  content_type: ContentType;
  status: ListingStatus | PostStatus | GroupStatus;
  moderation_status: ModerationStatus;
  is_featured: boolean;
  tags: string[];
  location?: string;
  created_at: string;
  updated_at: string;
  
  // Engagement metrics
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  
  // User profile data (joined)
  profiles?: {
    id: string;
    name?: string;
    username?: string;
    avatar_url?: string;
  };
}

// Listing-specific interface
export interface Listing extends BaseContent {
  content_type: 'listing';
  status: ListingStatus;
  
  // Pricing
  price_amount?: number;
  currency: string;
  price_unit?: string;
  
  // Category and details
  category: string;
  condition?: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  
  // Availability
  is_available: boolean;
  quantity?: number;
  
  // Safety and verification
  is_safety_approved: boolean;
  safety_score?: number;
  
  // Purchase-related
  purchase_count: number;
  last_purchased_at?: string;
}

// Regular post interface
export interface Post extends BaseContent {
  content_type: 'post';
  status: PostStatus;
  
  // Post-specific
  is_pinned: boolean;
  allows_comments: boolean;
  comment_count: number;
}

// Group listing interface
export interface Group extends BaseContent {
  content_type: 'group';
  status: GroupStatus;
  
  // Group-specific
  member_count: number;
  max_members?: number;
  is_private: boolean;
  join_approval_required: boolean;
  
  // Group settings
  allows_posts: boolean;
  allows_events: boolean;
  allows_discussions: boolean;
}

// Event interface
export interface Event extends BaseContent {
  content_type: 'event';
  status: ListingStatus;
  
  // Event-specific
  event_date: string;
  event_time?: string;
  event_end_time?: string;
  location: string;
  capacity?: number;
  ticket_price?: number;
  currency: string;
  
  // Event details
  event_type: 'meetup' | 'workshop' | 'conference' | 'social' | 'other';
  age_restriction?: number;
  
  // Registration
  registration_count: number;
  registration_required: boolean;
}

// Unified content type
export type UnifiedContent = Listing | Post | Group | Event;

// Comment interface
export interface Comment {
  id: string;
  content_id: string;
  user_id: string;
  parent_id?: string; // For threaded comments
  content: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  is_deleted: boolean;
  
  // Engagement
  like_count: number;
  reply_count: number;
  
  // User profile data (joined)
  profiles?: {
    id: string;
    name?: string;
    username?: string;
    avatar_url?: string;
  };
}

// Review interface
export interface Review {
  id: string;
  listing_id: string;
  reviewer_id: string;
  rating: number; // 1-5 stars
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  
  // Review details
  purchase_id?: string;
  is_verified_purchase: boolean;
  
  // User profile data (joined)
  profiles?: {
    id: string;
    name?: string;
    username?: string;
    avatar_url?: string;
  };
}

// Purchase interface
export interface Purchase {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  created_at: string;
  updated_at: string;
  
  // Payment details
  payment_method: string;
  transaction_id?: string;
  
  // Delivery/meetup
  delivery_method: 'pickup' | 'shipping' | 'meetup';
  delivery_address?: string;
  delivery_notes?: string;
  
  // Status tracking
  paid_at?: string;
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
}

// Search and filter interfaces
export interface SearchFilters {
  query?: string;
  content_type?: ContentType[];
  category?: string[];
  location?: string;
  price_min?: number;
  price_max?: number;
  date_from?: string;
  date_to?: string;
  tags?: string[];
  user_id?: string;
  is_featured?: boolean;
  sort_by?: 'relevance' | 'newest' | 'oldest' | 'price_low' | 'price_high' | 'popular';
  limit?: number;
  offset?: number;
}

export interface SearchResults {
  results: UnifiedContent[];
  total: number;
  has_more: boolean;
  filters_applied: SearchFilters;
}
