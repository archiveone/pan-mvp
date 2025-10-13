// Comprehensive Transaction System Types
// Based on 10 master categories of transactions

export type TransactionCategory = 
  | 'ticketing_attendance'
  | 'bookings_reservations' 
  | 'purchases_ecommerce'
  | 'digital_access_media'
  | 'video_series'
  | 'music_album'
  | 'documents_software'
  | 'donations_crowdfunding'
  | 'memberships_subscriptions'
  | 'rentals_leases'
  | 'free_trial_rsvp'
  | 'hybrid_mixed'
  | 'internal_system'

export type TransactionSubtype = 
  // 1. Ticketing & Attendance
  | 'event_ticket'
  | 'guestlist_rsvp'
  | 'early_bird_tiered'
  | 'vip_access_pass'
  | 'season_pass'
  | 'qr_code_checkin'
  | 'group_bundle_ticket'
  | 'livestream_ticket'
  
  // 2. Bookings & Reservations
  | 'appointment_booking'
  | 'table_reservation'
  | 'stay_accommodation'
  | 'studio_venue_booking'
  | 'equipment_gear_booking'
  | 'session_class_booking'
  | 'deposit_based_booking'
  | 'recurring_booking'
  | 'waitlist_standby'
  
  // 3. Purchases (E-commerce)
  | 'physical_product'
  | 'digital_product_download'
  | 'pre_order'
  | 'custom_made_order'
  | 'bundle_pack'
  | 'limited_edition_drop'
  | 'subscription_box'
  | 'gift_card_voucher'
  
  // 4. Digital Access & Media
  | 'streaming_access'
  | 'video_course_tutorial'
  | 'music_audio_stream'
  | 'download_access'
  | 'nft_digital_collectible'
  | 'private_community_access'
  | 'time_limited_access'
  
  // 4.1. Video Series/Content
  | 'video_series_episode'
  | 'documentary_series'
  | 'tutorial_series'
  | 'webinar_series'
  | 'live_stream_series'
  | 'premium_video_content'
  | 'video_course_access'
  | 'exclusive_video_content'
  
  // 4.2. Music/Song Albums
  | 'single_track'
  | 'album_collection'
  | 'ep_mini_album'
  | 'live_performance_recording'
  | 'instrumental_tracks'
  | 'remix_edits'
  | 'exclusive_release'
  | 'music_production_pack'
  
  // 4.3. Documents & Software
  | 'ebook_document'
  | 'software_application'
  | 'mobile_app'
  | 'plugin_extension'
  | 'template_collection'
  | 'design_assets'
  | 'code_library'
  | 'technical_manual'
  
  // 5. Donations, Tips, & Crowdfunding
  | 'one_time_donation'
  | 'recurring_donation'
  | 'pay_what_you_want'
  | 'crowdfunding_goal_based'
  | 'tip_appreciation'
  | 'revenue_share_patronage'
  
  // 6. Memberships & Subscriptions
  | 'basic_premium_membership'
  | 'tiered_subscription'
  | 'creator_subscription'
  | 'organization_membership'
  | 'trial_intro_period'
  | 'offline_hybrid_membership'
  
  // 7. Rentals & Leases
  | 'equipment_rental'
  | 'vehicle_transport_rental'
  | 'venue_studio_hire'
  | 'art_furniture_rental'
  | 'short_term_sublet'
  | 'deposit_based_rental'
  
  // 8. Free, Trial, or RSVP Actions
  | 'free_event_rsvp'
  | 'free_download'
  | 'trial_booking_demo'
  | 'contest_entry_giveaway'
  | 'volunteer_signup'
  | 'waitlist_notify_me'
  
  // 9. Hybrid or Mixed Transactions
  | 'event_merch_bundle'
  | 'workshop_membership'
  | 'rental_deposit_insurance'
  | 'donation_ticket_combo'
  | 'digital_physical_combo'
  
  // 10. Internal / System-Level
  | 'refund_reversal'
  | 'transfer_payout'
  | 'credit_wallet_topup'
  | 'tax_fee_commission'

export type TransactionStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'
  | 'disputed'

export type PaymentStatus = 
  | 'pending'
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'succeeded'
  | 'canceled'
  | 'failed'

export type FulfillmentStatus = 
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'returned'

// Base Transaction Interface
export interface BaseTransaction {
  id: string
  user_id: string
  content_id: string // Reference to the listing/post/event
  category: TransactionCategory
  subtype: TransactionSubtype
  status: TransactionStatus
  payment_status: PaymentStatus
  fulfillment_status?: FulfillmentStatus
  
  // Amounts
  amount: number
  currency: string
  tax_amount?: number
  fee_amount?: number
  total_amount: number
  
  // Stripe Integration
  stripe_payment_intent_id?: string
  stripe_subscription_id?: string
  stripe_checkout_session_id?: string
  stripe_transfer_id?: string
  
  // Metadata
  metadata: Record<string, any>
  description: string
  
  // Timestamps
  created_at: string
  updated_at: string
  completed_at?: string
  expires_at?: string
}

// 1. Ticketing & Attendance Transactions
export interface TicketingTransaction extends BaseTransaction {
  category: 'ticketing_attendance'
  subtype: 'event_ticket' | 'guestlist_rsvp' | 'early_bird_tiered' | 'vip_access_pass' | 'season_pass' | 'qr_code_checkin' | 'group_bundle_ticket' | 'livestream_ticket'
  
  // Event-specific
  event_date: string
  event_time: string
  venue: string
  capacity?: number
  
  // Ticketing-specific
  ticket_quantity: number
  ticket_type?: string
  seat_number?: string
  qr_code?: string
  
  // Access control
  access_level?: 'general' | 'vip' | 'backstage' | 'premium'
  valid_from?: string
  valid_until?: string
  
  // Group/season pass logic
  remaining_uses?: number
  is_transferable?: boolean
}

// 2. Booking & Reservation Transactions
export interface BookingTransaction extends BaseTransaction {
  category: 'bookings_reservations'
  subtype: 'appointment_booking' | 'table_reservation' | 'stay_accommodation' | 'studio_venue_booking' | 'equipment_gear_booking' | 'session_class_booking' | 'deposit_based_booking' | 'recurring_booking' | 'waitlist_standby'
  
  // Booking-specific
  booking_date: string
  start_time: string
  end_time: string
  duration_hours?: number
  
  // Reservation details
  party_size?: number
  special_requests?: string
  
  // Accommodation-specific
  check_in_date?: string
  check_out_date?: string
  nights?: number
  room_type?: string
  
  // Equipment/studio-specific
  equipment_items?: string[]
  deposit_amount?: number
  insurance_required?: boolean
  
  // Recurring bookings
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly'
  recurrence_end_date?: string
  
  // Waitlist
  waitlist_position?: number
  auto_notify?: boolean
}

// 3. Purchase (E-commerce) Transactions
export interface PurchaseTransaction extends BaseTransaction {
  category: 'purchases_ecommerce'
  subtype: 'physical_product' | 'digital_product_download' | 'pre_order' | 'custom_made_order' | 'bundle_pack' | 'limited_edition_drop' | 'subscription_box' | 'gift_card_voucher'
  
  // Product details
  product_variant?: string
  quantity: number
  
  // Shipping
  shipping_address?: {
    street: string
    city: string
    state: string
    postal_code: string
    country: string
  }
  shipping_method?: string
  shipping_cost?: number
  tracking_number?: string
  
  // Digital products
  download_links?: string[]
  download_expires_at?: string
  download_limit?: number
  
  // Pre-orders
  estimated_ship_date?: string
  pre_order_deposit?: number
  
  // Custom orders
  custom_requirements?: string
  estimated_completion_date?: string
  
  // Gift cards
  gift_card_code?: string
  gift_card_recipient?: {
    name: string
    email: string
    message?: string
  }
}

// 4. Digital Access & Media Transactions
export interface DigitalAccessTransaction extends BaseTransaction {
  category: 'digital_access_media'
  subtype: 'streaming_access' | 'video_course_tutorial' | 'music_audio_stream' | 'download_access' | 'nft_digital_collectible' | 'private_community_access' | 'time_limited_access'
  
  // Access control
  access_token?: string
  access_level?: string
  permissions?: string[]
  
  // Time-based access
  access_starts_at?: string
  access_expires_at?: string
  duration_hours?: number
  
  // Content details
  content_url?: string
  content_type?: string
  
  // NFT-specific
  nft_token_id?: string
  nft_contract_address?: string
  
  // Community access
  community_roles?: string[]
  invite_code?: string
}

// 5. Donations & Crowdfunding Transactions
export interface DonationTransaction extends BaseTransaction {
  category: 'donations_crowdfunding'
  subtype: 'one_time_donation' | 'recurring_donation' | 'pay_what_you_want' | 'crowdfunding_goal_based' | 'tip_appreciation' | 'revenue_share_patronage'
  
  // Donation details
  donation_type: 'one_time' | 'recurring'
  is_anonymous?: boolean
  
  // Crowdfunding
  campaign_id?: string
  goal_amount?: number
  current_amount?: number
  
  // Pay what you want
  suggested_amount?: number
  min_amount?: number
  max_amount?: number
  
  // Recurring donations
  recurrence_interval?: 'weekly' | 'monthly' | 'yearly'
  recurrence_end_date?: string
  
  // Tips
  tip_percentage?: number
  tip_amount?: number
  
  // Revenue share
  creator_percentage?: number
  platform_percentage?: number
}

// 6. Membership & Subscription Transactions
export interface MembershipTransaction extends BaseTransaction {
  category: 'memberships_subscriptions'
  subtype: 'basic_premium_membership' | 'tiered_subscription' | 'creator_subscription' | 'organization_membership' | 'trial_intro_period' | 'offline_hybrid_membership'
  
  // Subscription details
  membership_tier?: string
  billing_interval: 'monthly' | 'yearly' | 'lifetime'
  
  // Trial period
  trial_period_days?: number
  trial_starts_at?: string
  trial_ends_at?: string
  
  // Membership benefits
  benefits?: string[]
  access_level?: string
  
  // Organization membership
  organization_id?: string
  membership_number?: string
  
  // Hybrid membership
  physical_card_number?: string
  digital_access?: boolean
  physical_access?: boolean
}

// 7. Rental & Lease Transactions
export interface RentalTransaction extends BaseTransaction {
  category: 'rentals_leases'
  subtype: 'equipment_rental' | 'vehicle_transport_rental' | 'venue_studio_hire' | 'art_furniture_rental' | 'short_term_sublet' | 'deposit_based_rental'
  
  // Rental period
  rental_start_date: string
  rental_end_date: string
  rental_duration_hours?: number
  
  // Equipment/vehicle details
  item_condition_before?: string
  item_condition_after?: string
  
  // Deposit and insurance
  security_deposit?: number
  insurance_amount?: number
  damage_fee?: number
  
  // Pickup/delivery
  pickup_location?: string
  return_location?: string
  delivery_address?: string
  
  // Usage tracking
  mileage_start?: number
  mileage_end?: number
  usage_hours?: number
}

// 8. Free/Trial/RSVP Transactions
export interface FreeTransaction extends BaseTransaction {
  category: 'free_trial_rsvp'
  subtype: 'free_event_rsvp' | 'free_download' | 'trial_booking_demo' | 'contest_entry_giveaway' | 'volunteer_signup' | 'waitlist_notify_me'
  
  // Free event details
  event_date?: string
  rsvp_deadline?: string
  
  // Trial details
  trial_duration_days?: number
  trial_usage_limit?: number
  
  // Contest/giveaway
  contest_id?: string
  entry_method?: string
  prize_description?: string
  
  // Volunteer signup
  volunteer_role?: string
  shift_date?: string
  shift_time?: string
  
  // Waitlist
  notify_when_available?: boolean
  estimated_availability?: string
}

// 9. Hybrid/Mixed Transactions
export interface HybridTransaction extends BaseTransaction {
  category: 'hybrid_mixed'
  subtype: 'event_merch_bundle' | 'workshop_membership' | 'rental_deposit_insurance' | 'donation_ticket_combo' | 'digital_physical_combo'
  
  // Component transactions
  component_transactions: string[] // IDs of related transactions
  
  // Bundle details
  bundle_items?: Array<{
    type: string
    item_id: string
    quantity: number
  }>
  
  // Mixed fulfillment
  fulfillment_plan?: Array<{
    step: number
    type: 'digital' | 'physical' | 'service'
    description: string
    estimated_completion: string
  }>
}

// 10. Internal/System Transactions
export interface InternalTransaction extends BaseTransaction {
  category: 'internal_system'
  subtype: 'refund_reversal' | 'transfer_payout' | 'credit_wallet_topup' | 'tax_fee_commission'
  
  // Related transaction
  related_transaction_id?: string
  
  // Transfer details
  recipient_user_id?: string
  transfer_type?: 'payout' | 'refund' | 'credit'
  
  // System fees
  platform_fee?: number
  processing_fee?: number
  tax_amount?: number
  
  // Wallet/topup
  wallet_balance_before?: number
  wallet_balance_after?: number
  topup_method?: string
}

// Union type for all transactions
export type Transaction = 
  | TicketingTransaction
  | BookingTransaction
  | PurchaseTransaction
  | DigitalAccessTransaction
  | DonationTransaction
  | MembershipTransaction
  | RentalTransaction
  | FreeTransaction
  | HybridTransaction
  | InternalTransaction

// Transaction Creation Request
export interface CreateTransactionRequest {
  user_id: string
  content_id: string
  category: TransactionCategory
  subtype: TransactionSubtype
  amount: number
  currency: string
  description: string
  metadata?: Record<string, any>
  
  // Category-specific data
  ticketing_data?: Partial<TicketingTransaction>
  booking_data?: Partial<BookingTransaction>
  purchase_data?: Partial<PurchaseTransaction>
  digital_access_data?: Partial<DigitalAccessTransaction>
  donation_data?: Partial<DonationTransaction>
  membership_data?: Partial<MembershipTransaction>
  rental_data?: Partial<RentalTransaction>
  free_data?: Partial<FreeTransaction>
  hybrid_data?: Partial<HybridTransaction>
  internal_data?: Partial<InternalTransaction>
}

// Transaction Update Request
export interface UpdateTransactionRequest {
  status?: TransactionStatus
  payment_status?: PaymentStatus
  fulfillment_status?: FulfillmentStatus
  metadata?: Record<string, any>
  
  // Stripe integration
  stripe_payment_intent_id?: string
  stripe_subscription_id?: string
  stripe_checkout_session_id?: string
  stripe_transfer_id?: string
}

// Transaction Query Filters
export interface TransactionFilters {
  user_id?: string
  content_id?: string
  category?: TransactionCategory
  subtype?: TransactionSubtype
  status?: TransactionStatus
  payment_status?: PaymentStatus
  fulfillment_status?: FulfillmentStatus
  date_from?: string
  date_to?: string
  amount_min?: number
  amount_max?: number
  currency?: string
  limit?: number
  offset?: number
}

// Transaction Analytics
export interface TransactionAnalytics {
  total_transactions: number
  total_revenue: number
  average_transaction_value: number
  transactions_by_category: Record<TransactionCategory, number>
  transactions_by_status: Record<TransactionStatus, number>
  revenue_by_category: Record<TransactionCategory, number>
  conversion_rate: number
  refund_rate: number
  period: {
    start_date: string
    end_date: string
  }
}
