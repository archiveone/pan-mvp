// Enterprise Auction System Types (Sotheby's Level)

export type AuctionHouseStatus = 'active' | 'suspended' | 'closed';
export type EventType = 'live' | 'timed_online' | 'sealed_bid' | 'hybrid';
export type EventStatus = 'draft' | 'scheduled' | 'preview' | 'live' | 'closed' | 'settled' | 'cancelled';
export type LotStatus = 'pending' | 'approved' | 'cataloged' | 'active' | 'sold' | 'unsold' | 'withdrawn' | 'passed';
export type BidderRegistrationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type BidType = 'online' | 'phone' | 'in_person' | 'absentee' | 'proxy' | 'house_bid';
export type BidStatus = 'active' | 'outbid' | 'winning' | 'won' | 'lost' | 'withdrawn' | 'invalid';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overdue' | 'disputed' | 'cancelled';
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'held' | 'cancelled';

// ============= AUCTION HOUSE =============

export interface AuctionHouse {
  id: string;
  owner_id: string;
  
  // House Details
  legal_name: string;
  display_name: string;
  tagline?: string;
  description?: string;
  
  // Legal & Registration
  business_registration_number?: string;
  tax_id?: string;
  license_number?: string;
  
  // Contact
  email: string;
  phone?: string;
  website?: string;
  
  // Address
  street_address?: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  
  // Branding
  logo_url?: string;
  banner_url?: string;
  brand_colors?: Record<string, string>;
  
  // Fee Structure
  default_buyers_premium: number;
  default_sellers_commission: number;
  
  // Settings
  requires_bidder_approval: boolean;
  min_deposit_amount: number;
  payment_terms_days: number;
  
  // Verification & Status
  is_verified: boolean;
  verification_date?: string;
  status: AuctionHouseStatus;
  
  // Metrics
  total_auctions: number;
  total_lots_sold: number;
  total_revenue: number;
  average_lot_value: number;
  
  created_at: string;
  updated_at: string;
  
  // Joined data
  owner?: {
    id: string;
    username?: string;
    avatar_url?: string;
  };
}

// ============= AUCTION EVENT =============

export interface AuctionEvent {
  id: string;
  auction_house_id: string;
  
  // Event Details
  title: string;
  subtitle?: string;
  description?: string;
  catalog_description?: string;
  
  // Event Type
  event_type: EventType;
  category?: string; // 'Fine Art', 'Jewelry', 'Wine', etc.
  
  // Timing
  catalog_available_date?: string;
  preview_start_date?: string;
  preview_end_date?: string;
  bidding_start_date: string;
  bidding_end_date?: string;
  live_auction_date?: string;
  
  // Location
  venue_name?: string;
  venue_address?: string;
  venue_city?: string;
  venue_country?: string;
  
  // Online Access
  online_bidding_enabled: boolean;
  live_stream_url?: string;
  catalog_pdf_url?: string;
  
  // Registration
  requires_registration: boolean;
  registration_deadline?: string;
  registration_deposit: number;
  
  // Fee Structure
  buyers_premium?: number;
  sellers_commission?: number;
  
  // Media
  cover_image_url?: string;
  gallery_images: string[];
  
  // Status
  status: EventStatus;
  is_featured: boolean;
  
  // Metrics
  lot_count: number;
  registered_bidders: number;
  lots_sold: number;
  lots_unsold: number;
  total_hammer_price: number;
  sell_through_rate: number;
  
  // Staff
  auctioneer_id?: string;
  
  created_at: string;
  updated_at: string;
  
  // Joined data
  auction_house?: AuctionHouse;
  auctioneer?: {
    id: string;
    name?: string;
    avatar_url?: string;
  };
  lots?: AuctionLot[];
}

// ============= AUCTION LOT =============

export interface AuctionLot {
  id: string;
  auction_event_id: string;
  consignor_id: string;
  
  // Lot Identification
  lot_number: number;
  lot_letter?: string;
  title: string;
  subtitle?: string;
  
  // Cataloging
  description: string;
  catalog_note?: string;
  provenance?: string;
  literature?: string;
  exhibition_history?: string;
  condition_report?: string;
  
  // Item Details
  category: string;
  subcategory?: string;
  artist_maker?: string;
  date_period?: string;
  medium?: string;
  dimensions?: string;
  edition_size?: string;
  signature?: string;
  inscription?: string;
  
  // Authenticity
  certificate_of_authenticity: boolean;
  certificate_url?: string;
  authentication_notes?: string;
  
  // Estimates & Pricing
  currency: string;
  estimate_low?: number;
  estimate_high?: number;
  reserve_price?: number; // Confidential
  starting_bid?: number;
  bid_increment: number;
  
  // Current Bidding State
  current_bid?: number;
  hammer_price?: number;
  bid_count: number;
  winning_bidder_id?: string;
  
  // Fees
  buyers_premium_amount?: number;
  buyers_premium_percentage?: number;
  sellers_commission_amount?: number;
  sellers_commission_percentage?: number;
  total_buyer_price?: number;
  total_seller_payout?: number;
  
  // Media
  images: string[];
  primary_image_url?: string;
  video_url?: string;
  pdf_condition_report_url?: string;
  
  // Lot Status
  status: LotStatus;
  
  // Post-Auction
  sold_date?: string;
  invoice_id?: string;
  payment_received: boolean;
  payment_date?: string;
  released_to_buyer: boolean;
  release_date?: string;
  
  // Shipping
  requires_special_handling: boolean;
  shipping_notes?: string;
  insurance_value?: number;
  
  // Order
  display_order?: number;
  
  // Metrics
  view_count: number;
  watch_count: number;
  condition_report_requests: number;
  
  created_at: string;
  updated_at: string;
  
  // Joined data
  auction_event?: AuctionEvent;
  consignor?: {
    id: string;
    username?: string;
    email?: string;
  };
  winning_bidder?: {
    id: string;
    username?: string;
  };
  bids?: AuctionLotBid[];
}

// ============= BIDDER REGISTRATION =============

export interface AuctionBidderRegistration {
  id: string;
  auction_event_id: string;
  bidder_id: string;
  auction_house_id: string;
  
  // Registration
  paddle_number?: string;
  registration_date: string;
  
  // Approval
  status: BidderRegistrationStatus;
  approved_by?: string;
  approved_date?: string;
  rejection_reason?: string;
  
  // Financial Verification
  deposit_required: number;
  deposit_paid: number;
  deposit_payment_date?: string;
  deposit_refunded: boolean;
  
  credit_limit?: number;
  credit_check_completed: boolean;
  credit_check_date?: string;
  
  // Identity
  identity_verified: boolean;
  identity_verification_date?: string;
  verification_documents?: Record<string, any>;
  
  // Contact Preferences
  phone_bidding_requested: boolean;
  phone_number?: string;
  absentee_bids_allowed: boolean;
  online_bidding_allowed: boolean;
  
  // Limits
  max_bid_limit?: number;
  
  // Metrics
  lots_bid_on: number;
  lots_won: number;
  total_spent: number;
  
  created_at: string;
  updated_at: string;
  
  // Joined data
  bidder?: {
    id: string;
    username?: string;
    email?: string;
    phone?: string;
  };
  auction_event?: AuctionEvent;
}

// ============= BIDS =============

export interface AuctionLotBid {
  id: string;
  lot_id: string;
  bidder_registration_id: string;
  bidder_id: string;
  
  // Bid Details
  bid_amount: number;
  bid_type: BidType;
  
  // Placement
  placed_at: string;
  placed_by_staff_id?: string;
  
  // Proxy Bidding
  is_proxy_bid: boolean;
  max_proxy_amount?: number;
  current_proxy_amount?: number;
  
  // Absentee
  is_absentee_bid: boolean;
  absentee_max_amount?: number;
  absentee_submitted_date?: string;
  
  // Phone
  is_phone_bid: boolean;
  phone_representative_id?: string;
  
  // Status
  status: BidStatus;
  is_winning: boolean;
  
  // Sequence
  bid_sequence_number: number;
  
  // Timing
  outbid_at?: string;
  won_at?: string;
  
  // Metadata
  ip_address?: string;
  user_agent?: string;
  bid_source?: string;
  
  // Notes
  internal_notes?: string;
  
  created_at: string;
  
  // Joined data
  bidder?: {
    id: string;
    username?: string;
    paddle_number?: string;
  };
  lot?: AuctionLot;
  representative?: {
    id: string;
    name?: string;
  };
}

export interface AuctionAbsenteeBid {
  id: string;
  lot_id: string;
  bidder_registration_id: string;
  
  max_bid_amount: number;
  submitted_at: string;
  submitted_by_staff_id?: string;
  
  status: 'pending' | 'active' | 'executed' | 'outbid' | 'cancelled' | 'expired';
  executed_at?: string;
  final_bid_amount?: number;
  
  confirmation_sent: boolean;
  confirmation_sent_at?: string;
  
  created_at: string;
}

export interface AuctionPhoneBid {
  id: string;
  lot_id: string;
  bidder_registration_id: string;
  
  phone_number: string;
  alternate_phone?: string;
  
  representative_id?: string;
  assigned_at?: string;
  
  requested_at: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'no_answer' | 'cancelled';
  
  call_started_at?: string;
  call_ended_at?: string;
  participated: boolean;
  highest_bid_placed?: number;
  won_lot: boolean;
  
  notes?: string;
  created_at: string;
}

// ============= INVOICING & SETTLEMENTS =============

export interface AuctionInvoice {
  id: string;
  auction_event_id: string;
  buyer_id: string;
  
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  
  // Amounts
  subtotal: number;
  buyers_premium: number;
  tax_amount: number;
  shipping_handling: number;
  insurance: number;
  total_amount: number;
  currency: string;
  
  // Payment
  payment_status: PaymentStatus;
  amount_paid: number;
  amount_outstanding: number;
  
  payment_method?: string;
  payment_reference?: string;
  paid_date?: string;
  
  // Terms
  payment_terms?: string;
  late_fee_percentage: number;
  late_fees_applied: number;
  
  // Documents
  pdf_url?: string;
  
  // Notes
  notes?: string;
  internal_notes?: string;
  
  created_at: string;
  updated_at: string;
  
  // Joined data
  buyer?: {
    id: string;
    username?: string;
    email?: string;
  };
  items?: AuctionInvoiceItem[];
}

export interface AuctionInvoiceItem {
  id: string;
  invoice_id: string;
  lot_id: string;
  
  lot_number: number;
  description: string;
  
  hammer_price: number;
  buyers_premium: number;
  tax_amount: number;
  line_total: number;
  currency: string;
  
  created_at: string;
}

export interface AuctionSettlement {
  id: string;
  auction_event_id: string;
  seller_id: string;
  
  settlement_number: string;
  settlement_date: string;
  
  // Amounts
  gross_proceeds: number;
  sellers_commission: number;
  insurance_fees: number;
  photography_fees: number;
  shipping_fees: number;
  other_charges: number;
  net_proceeds: number;
  currency: string;
  
  // Payout
  payout_status: PayoutStatus;
  payout_method?: string;
  payout_date?: string;
  payout_reference?: string;
  
  // Bank
  bank_account_last4?: string;
  
  // Documents
  pdf_url?: string;
  
  // Notes
  notes?: string;
  internal_notes?: string;
  
  created_at: string;
  updated_at: string;
  
  // Joined data
  seller?: {
    id: string;
    username?: string;
    email?: string;
  };
  items?: AuctionSettlementItem[];
}

export interface AuctionSettlementItem {
  id: string;
  settlement_id: string;
  lot_id: string;
  
  lot_number: number;
  description: string;
  
  hammer_price: number;
  commission_amount: number;
  net_amount: number;
  currency: string;
  
  created_at: string;
}

// ============= CONDITION REPORTS =============

export interface AuctionConditionReport {
  id: string;
  lot_id: string;
  requested_by?: string;
  
  requested_at: string;
  request_type: 'standard' | 'detailed' | 'third_party';
  
  status: 'pending' | 'in_progress' | 'completed' | 'not_available';
  completed_by?: string;
  completed_at?: string;
  
  condition_summary?: string;
  detailed_report?: string;
  images: string[];
  pdf_url?: string;
  
  sent_to_requester: boolean;
  sent_at?: string;
  
  created_at: string;
}

// ============= REQUEST/RESPONSE TYPES =============

export interface CreateAuctionHouseRequest {
  legal_name: string;
  display_name: string;
  tagline?: string;
  description?: string;
  email: string;
  phone?: string;
  city: string;
  country: string;
  default_buyers_premium?: number;
  default_sellers_commission?: number;
}

export interface CreateAuctionEventRequest {
  auction_house_id: string;
  title: string;
  subtitle?: string;
  description?: string;
  event_type: EventType;
  category?: string;
  bidding_start_date: string;
  bidding_end_date?: string;
  live_auction_date?: string;
  venue_name?: string;
  city?: string;
  country?: string;
  requires_registration?: boolean;
  registration_deposit?: number;
}

export interface CreateAuctionLotRequest {
  auction_event_id: string;
  lot_number: number;
  title: string;
  description: string;
  category: string;
  artist_maker?: string;
  estimate_low?: number;
  estimate_high?: number;
  reserve_price?: number;
  starting_bid?: number;
  images?: string[];
  provenance?: string;
  condition_report?: string;
}

export interface RegisterBidderRequest {
  auction_event_id: string;
  phone_number?: string;
  phone_bidding_requested?: boolean;
  credit_limit?: number;
}

export interface PlaceLotBidRequest {
  lot_id: string;
  bid_amount: number;
  bid_type?: BidType;
  is_proxy_bid?: boolean;
  max_proxy_amount?: number;
}

export interface SubmitAbsenteeBidRequest {
  lot_id: string;
  max_bid_amount: number;
  bidder_registration_id: string;
}

export interface RequestPhoneBidRequest {
  lot_id: string;
  phone_number: string;
  alternate_phone?: string;
}

// ============= FILTERS =============

export interface AuctionEventFilters {
  auction_house_id?: string;
  event_type?: EventType[];
  status?: EventStatus[];
  category?: string;
  upcoming?: boolean;
  live_now?: boolean;
  search_query?: string;
  sort_by?: 'date' | 'lots' | 'featured';
  limit?: number;
  offset?: number;
}

export interface AuctionLotFilters {
  auction_event_id?: string;
  category?: string;
  artist_maker?: string;
  estimate_min?: number;
  estimate_max?: number;
  status?: LotStatus[];
  has_reserve?: boolean;
  search_query?: string;
  sort_by?: 'lot_number' | 'estimate' | 'ending_soon';
  limit?: number;
  offset?: number;
}

// ============= ANALYTICS =============

export interface AuctionHouseAnalytics {
  total_events: number;
  total_lots: number;
  total_revenue: number;
  average_lot_value: number;
  sell_through_rate: number;
  top_categories: Array<{category: string; count: number; revenue: number}>;
  period: {
    start_date: string;
    end_date: string;
  };
}

