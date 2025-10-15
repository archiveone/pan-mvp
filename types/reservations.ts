// Industry-Standard Reservations System Types

export type BusinessType = 'restaurant' | 'hotel' | 'salon' | 'spa' | 'clinic' | 
  'studio' | 'venue' | 'workspace' | 'mechanic' | 'professional_service' | 'other';

export type ResourceType = 'table' | 'room' | 'chair' | 'station' | 'bay' | 
  'court' | 'field' | 'desk' | 'meeting_room' | 'equipment' | 'vehicle' | 'other';

export type BookingType = 'table' | 'room' | 'appointment' | 'service' | 'equipment' | 'space';

export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'in_progress' | 
  'completed' | 'cancelled' | 'no_show' | 'cancelled_by_business';

export type PaymentStatus = 'unpaid' | 'deposit_paid' | 'paid' | 'refunded' | 'partially_refunded';

export type CancellationPolicy = 'flexible' | 'moderate' | 'strict' | 'super_strict';

export type PricingModel = 'free' | 'per_hour' | 'per_day' | 'per_booking' | 'dynamic';

export type BlockType = 'holiday' | 'maintenance' | 'private_event' | 'staff_break' | 'other';

// ============= BUSINESS =============

export interface ReservationBusiness {
  id: string;
  owner_id: string;
  
  business_type: BusinessType;
  business_name: string;
  slug?: string;
  description?: string;
  
  phone?: string;
  email?: string;
  website?: string;
  
  address: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  coordinates?: { lat: number; lng: number };
  timezone: string;
  
  operating_hours: Record<string, { open: string; close: string; closed: boolean }>;
  
  accepts_reservations: boolean;
  requires_prepayment: boolean;
  prepayment_amount: number;
  cancellation_policy: CancellationPolicy;
  min_advance_booking_minutes: number;
  max_advance_booking_days: number;
  
  min_party_size: number;
  max_party_size: number;
  
  logo_url?: string;
  cover_image_url?: string;
  gallery_images: string[];
  
  is_verified: boolean;
  verification_date?: string;
  
  average_rating: number;
  review_count: number;
  
  total_reservations: number;
  total_revenue: number;
  
  status: 'active' | 'paused' | 'suspended' | 'closed';
  
  tags: string[];
  cuisine_types: string[];
  amenities: string[];
  
  created_at: string;
  updated_at: string;
  
  // Joined data
  owner?: {
    id: string;
    username?: string;
    avatar_url?: string;
  };
  resources?: ReservationResource[];
  staff?: ReservationStaff[];
  services?: ReservationService[];
}

// ============= RESOURCE =============

export interface ReservationResource {
  id: string;
  business_id: string;
  
  resource_type: ResourceType;
  name: string;
  description?: string;
  
  capacity: number;
  min_capacity: number;
  
  floor_level?: string;
  section?: string;
  location_notes?: string;
  
  features: string[];
  is_accessible: boolean;
  is_outdoor: boolean;
  has_view: boolean;
  is_private: boolean;
  
  base_rate: number;
  pricing_model: PricingModel;
  minimum_spend: number;
  
  is_active: boolean;
  requires_approval: boolean;
  
  min_duration_minutes: number;
  max_duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  
  images: string[];
  display_order: number;
  
  created_at: string;
  updated_at: string;
}

// ============= STAFF =============

export interface ReservationStaff {
  id: string;
  business_id: string;
  user_id?: string;
  
  name: string;
  title?: string;
  bio?: string;
  specialties: string[];
  
  email?: string;
  phone?: string;
  photo_url?: string;
  
  is_active: boolean;
  accepts_bookings: boolean;
  
  weekly_schedule: Record<string, Array<{ start: string; end: string }>>;
  
  average_rating: number;
  review_count: number;
  booking_count: number;
  
  display_order: number;
  is_featured: boolean;
  
  created_at: string;
  updated_at: string;
}

// ============= SERVICE =============

export interface ReservationService {
  id: string;
  business_id: string;
  
  name: string;
  description?: string;
  category?: string;
  
  duration_minutes: number;
  buffer_minutes: number;
  
  price: number;
  currency: string;
  deposit_amount: number;
  
  is_active: boolean;
  requires_staff: boolean;
  max_simultaneous: number;
  
  requires_consultation: boolean;
  min_age?: number;
  special_requirements?: string;
  
  image_url?: string;
  display_order: number;
  is_popular: boolean;
  
  created_at: string;
  updated_at: string;
  
  // Available staff for this service
  available_staff?: ReservationStaff[];
}

// ============= RESERVATION =============

export interface Reservation {
  id: string;
  business_id: string;
  customer_id?: string;
  
  resource_id?: string;
  staff_id?: string;
  
  booking_type: BookingType;
  
  reservation_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  timezone: string;
  
  party_size: number;
  
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  
  special_requests?: string;
  dietary_restrictions?: string;
  accessibility_needs?: string;
  occasion?: string;
  
  subtotal: number;
  tax_amount: number;
  tip_amount: number;
  total_amount: number;
  currency: string;
  
  payment_status: PaymentStatus;
  payment_method?: string;
  payment_id?: string;
  deposit_paid: number;
  
  status: ReservationStatus;
  
  confirmation_code: string;
  confirmation_sent: boolean;
  
  checked_in_at?: string;
  checked_out_at?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  
  reminder_sent: boolean;
  reminder_sent_at?: string;
  
  cancelled_at?: string;
  cancellation_reason?: string;
  cancelled_by?: string;
  refund_amount: number;
  
  no_show_fee: number;
  
  business_notes?: string;
  customer_notes?: string;
  
  booking_source: 'website' | 'mobile_app' | 'phone' | 'walk_in' | 'partner' | 'widget';
  
  metadata: Record<string, any>;
  
  created_at: string;
  updated_at: string;
  
  // Joined data
  business?: ReservationBusiness;
  customer?: {
    id: string;
    username?: string;
    email?: string;
  };
  resource?: ReservationResource;
  staff?: ReservationStaff;
  service_items?: ReservationServiceItem[];
}

// ============= RESERVATION SERVICE ITEM =============

export interface ReservationServiceItem {
  id: string;
  reservation_id: string;
  service_id: string;
  staff_id?: string;
  
  service_name: string;
  duration_minutes: number;
  
  price: number;
  quantity: number;
  line_total: number;
  currency: string;
  
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  
  created_at: string;
}

// ============= RESERVATION BLOCK =============

export interface ReservationBlock {
  id: string;
  business_id?: string;
  resource_id?: string;
  staff_id?: string;
  
  block_type: BlockType;
  reason?: string;
  
  start_datetime: string;
  end_datetime: string;
  all_day: boolean;
  
  is_recurring: boolean;
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly';
  recurrence_end_date?: string;
  
  created_at: string;
}

// ============= WAITLIST =============

export interface ReservationWaitlist {
  id: string;
  business_id: string;
  customer_id?: string;
  
  desired_date: string;
  desired_time_start?: string;
  desired_time_end?: string;
  party_size: number;
  
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  
  resource_preference_ids?: string[];
  staff_preference_ids?: string[];
  
  status: 'waiting' | 'notified' | 'booked' | 'expired' | 'cancelled';
  
  notified_at?: string;
  expires_at?: string;
  
  created_at: string;
}

// ============= REVIEW =============

export interface ReservationReview {
  id: string;
  reservation_id: string;
  business_id: string;
  customer_id?: string;
  
  overall_rating: number;
  food_rating?: number;
  service_rating?: number;
  ambiance_rating?: number;
  value_rating?: number;
  
  title?: string;
  review_text?: string;
  
  would_recommend?: boolean;
  photos: string[];
  
  business_response?: string;
  business_response_at?: string;
  
  is_verified_visit: boolean;
  is_published: boolean;
  is_flagged: boolean;
  
  created_at: string;
  updated_at: string;
  
  // Joined data
  customer?: {
    id: string;
    username?: string;
    avatar_url?: string;
  };
}

// ============= REQUEST/RESPONSE TYPES =============

export interface CreateBusinessRequest {
  business_type: BusinessType;
  business_name: string;
  description?: string;
  phone?: string;
  email?: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  timezone?: string;
  operating_hours?: Record<string, any>;
  cancellation_policy?: CancellationPolicy;
  cuisine_types?: string[];
  amenities?: string[];
}

export interface CreateResourceRequest {
  business_id: string;
  resource_type: ResourceType;
  name: string;
  description?: string;
  capacity: number;
  features?: string[];
  pricing_model?: PricingModel;
  base_rate?: number;
}

export interface CreateStaffRequest {
  business_id: string;
  name: string;
  title?: string;
  bio?: string;
  email?: string;
  phone?: string;
  specialties?: string[];
  weekly_schedule?: Record<string, any>;
}

export interface CreateServiceRequest {
  business_id: string;
  name: string;
  description?: string;
  category?: string;
  duration_minutes: number;
  price: number;
  deposit_amount?: number;
  requires_staff?: boolean;
}

export interface CreateReservationRequest {
  business_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  party_size: number;
  booking_type: BookingType;
  resource_id?: string;
  staff_id?: string;
  special_requests?: string;
  occasion?: string;
  service_ids?: string[];
}

export interface AvailabilityQuery {
  business_id: string;
  date: string;
  party_size?: number;
  resource_id?: string;
  staff_id?: string;
  service_id?: string;
  duration_minutes?: number;
}

export interface AvailabilitySlot {
  start_time: string;
  end_time: string;
  available: boolean;
  resource_id?: string;
  staff_id?: string;
}

export interface ReservationFilters {
  business_id?: string;
  customer_id?: string;
  status?: ReservationStatus[];
  date_from?: string;
  date_to?: string;
  booking_type?: BookingType[];
  limit?: number;
  offset?: number;
}

// ============= ANALYTICS =============

export interface ReservationAnalytics {
  total_reservations: number;
  completed_reservations: number;
  cancelled_reservations: number;
  no_shows: number;
  total_revenue: number;
  average_party_size: number;
  average_booking_value: number;
  cancellation_rate: number;
  no_show_rate: number;
  completion_rate: number;
  period: {
    start_date: string;
    end_date: string;
  };
}

