// Fundraiser/Crowdfunding System Types

export type FundraiserStatus = 'draft' | 'pending_review' | 'active' | 'successful' | 'unsuccessful' | 'cancelled';
export type CampaignType = 'donation' | 'reward' | 'equity' | 'flexible' | 'all_or_nothing';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type FulfillmentStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'not_applicable';

// Fundraiser Campaign
export interface Fundraiser {
  id: string;
  user_id: string;
  
  // Campaign Details
  title: string;
  tagline?: string;
  story: string;
  category: string;
  campaign_type: CampaignType;
  
  // Financial Goals
  goal_amount: number;
  currency: string;
  current_amount: number;
  backer_count: number;
  
  // Timing
  start_date: string;
  end_date: string;
  
  // Media
  cover_image_url?: string;
  video_url?: string;
  gallery_images: string[];
  
  // Reward Tiers
  has_rewards: boolean;
  
  // Campaign Settings
  allow_custom_amount: boolean;
  min_contribution: number;
  max_contribution?: number;
  
  // Social Impact
  beneficiary_name?: string;
  is_charity: boolean;
  charity_registration_number?: string;
  
  // Location
  country?: string;
  city?: string;
  
  // Status
  status: FundraiserStatus;
  is_featured: boolean;
  is_verified: boolean;
  
  // Metrics
  view_count: number;
  share_count: number;
  comment_count: number;
  
  // Tags
  tags: string[];
  
  // Milestones & Updates
  milestone_count: number;
  update_count: number;
  
  created_at: string;
  updated_at: string;
  
  // Joined data (optional)
  creator?: {
    id: string;
    username?: string;
    avatar_url?: string;
  };
  rewards?: FundraiserReward[];
  recent_contributions?: FundraiserContribution[];
  progress_percentage?: number;
  days_left?: number;
}

// Fundraiser Reward Tier
export interface FundraiserReward {
  id: string;
  fundraiser_id: string;
  
  // Reward Details
  title: string;
  description: string;
  amount: number;
  currency: string;
  
  // Availability
  quantity_available?: number; // null = unlimited
  quantity_claimed: number;
  is_limited: boolean;
  
  // Delivery
  estimated_delivery_date?: string;
  shipping_required: boolean;
  ships_to?: string[];
  
  // Display
  image_url?: string;
  display_order: number;
  
  // Status
  is_active: boolean;
  
  created_at: string;
  
  // Computed
  is_sold_out?: boolean;
  backers_count?: number;
}

// Fundraiser Contribution
export interface FundraiserContribution {
  id: string;
  fundraiser_id: string;
  reward_id?: string;
  contributor_id?: string;
  
  // Contribution Details
  amount: number;
  currency: string;
  is_anonymous: boolean;
  
  // Payment
  payment_status: PaymentStatus;
  payment_method?: string;
  payment_id?: string;
  
  // Contributor Info
  contributor_name?: string;
  contributor_email?: string;
  contributor_message?: string;
  
  // Reward Fulfillment
  shipping_address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  fulfillment_status?: FulfillmentStatus;
  tracking_number?: string;
  
  // Timestamps
  pledged_at: string;
  charged_at?: string;
  refunded_at?: string;
  
  created_at: string;
  
  // Joined data (optional)
  fundraiser?: Fundraiser;
  reward?: FundraiserReward;
  contributor?: {
    id: string;
    username?: string;
    avatar_url?: string;
  };
}

// Fundraiser Update
export interface FundraiserUpdate {
  id: string;
  fundraiser_id: string;
  author_id: string;
  
  // Update Details
  title: string;
  content: string;
  
  // Media
  images: string[];
  video_url?: string;
  
  // Visibility
  is_backers_only: boolean;
  
  // Engagement
  like_count: number;
  comment_count: number;
  
  created_at: string;
  updated_at: string;
  
  // Joined data (optional)
  author?: {
    id: string;
    username?: string;
    avatar_url?: string;
  };
}

// Fundraiser Milestone
export interface FundraiserMilestone {
  id: string;
  fundraiser_id: string;
  
  // Milestone Details
  title: string;
  description?: string;
  target_amount: number;
  
  // Status
  is_achieved: boolean;
  achieved_at?: string;
  
  // Display
  display_order: number;
  
  created_at: string;
}

// Create Fundraiser Request
export interface CreateFundraiserRequest {
  title: string;
  tagline?: string;
  story: string;
  category: string;
  campaign_type: CampaignType;
  goal_amount: number;
  currency?: string;
  start_date: string;
  end_date: string;
  cover_image_url?: string;
  video_url?: string;
  gallery_images?: string[];
  has_rewards?: boolean;
  allow_custom_amount?: boolean;
  min_contribution?: number;
  max_contribution?: number;
  beneficiary_name?: string;
  is_charity?: boolean;
  charity_registration_number?: string;
  country?: string;
  city?: string;
  tags?: string[];
}

// Update Fundraiser Request
export interface UpdateFundraiserRequest {
  title?: string;
  tagline?: string;
  story?: string;
  category?: string;
  goal_amount?: number;
  end_date?: string;
  cover_image_url?: string;
  video_url?: string;
  gallery_images?: string[];
  allow_custom_amount?: boolean;
  min_contribution?: number;
  max_contribution?: number;
  beneficiary_name?: string;
  tags?: string[];
  status?: FundraiserStatus;
}

// Create Reward Request
export interface CreateRewardRequest {
  fundraiser_id: string;
  title: string;
  description: string;
  amount: number;
  currency?: string;
  quantity_available?: number;
  is_limited?: boolean;
  estimated_delivery_date?: string;
  shipping_required?: boolean;
  ships_to?: string[];
  image_url?: string;
  display_order?: number;
}

// Create Contribution Request
export interface CreateContributionRequest {
  fundraiser_id: string;
  reward_id?: string;
  amount: number;
  currency?: string;
  is_anonymous?: boolean;
  contributor_name?: string;
  contributor_email?: string;
  contributor_message?: string;
  shipping_address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  payment_method: string;
}

// Create Update Request
export interface CreateUpdateRequest {
  fundraiser_id: string;
  title: string;
  content: string;
  images?: string[];
  video_url?: string;
  is_backers_only?: boolean;
}

// Create Milestone Request
export interface CreateMilestoneRequest {
  fundraiser_id: string;
  title: string;
  description?: string;
  target_amount: number;
  display_order?: number;
}

// Fundraiser Filters
export interface FundraiserFilters {
  category?: string;
  campaign_type?: CampaignType[];
  status?: FundraiserStatus[];
  goal_min?: number;
  goal_max?: number;
  is_charity?: boolean;
  is_verified?: boolean;
  is_featured?: boolean;
  country?: string;
  city?: string;
  tags?: string[];
  search_query?: string;
  ending_soon?: boolean; // Within 7 days
  nearly_funded?: boolean; // 75%+ funded
  sort_by?: 'trending' | 'newest' | 'ending_soon' | 'most_funded' | 'most_backers';
  limit?: number;
  offset?: number;
}

// Fundraiser Analytics
export interface FundraiserAnalytics {
  total_campaigns: number;
  active_campaigns: number;
  successful_campaigns: number;
  total_raised: number;
  total_backers: number;
  average_contribution: number;
  success_rate: number; // Percentage of campaigns that reached their goal
  average_campaign_duration: number; // In days
  period: {
    start_date: string;
    end_date: string;
  };
}

// Active Fundraiser View (from database view)
export interface ActiveFundraiserView extends Fundraiser {
  creator_username?: string;
  creator_avatar?: string;
  progress_percentage: number;
  days_left: number;
}

