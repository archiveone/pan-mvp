import { supabase } from '@/lib/supabase'

// =====================================================
// ADVANCED MULTI-ITEM LISTING SYSTEM
// Hotels, Rentals, Products with Variants, Services
// =====================================================

export interface ListingVariant {
  id: string
  parent_listing_id: string
  variant_type: 'room' | 'vehicle' | 'product_variant' | 'service_option' | 'time_slot'
  
  // Identification
  name: string
  sku?: string
  description?: string
  
  // Variant Attributes (flexible for any type)
  attributes: {
    // For rooms
    room_number?: string
    room_type?: string // 'single', 'double', 'suite', 'dormitory'
    floor?: number
    view?: string
    bed_type?: string
    max_occupancy?: number
    
    // For vehicles
    make?: string
    model?: string
    year?: number
    license_plate?: string
    color?: string
    transmission?: string // 'automatic', 'manual'
    fuel_type?: string
    seats?: number
    mileage?: number
    
    // For product variants
    size?: string
    color?: string
    material?: string
    weight?: string
    dimensions?: string
    
    // For services
    duration?: number
    skill_level?: string
    capacity?: number
    
    // Common
    condition?: string
    features?: string[]
  }
  
  // Pricing
  base_price: number
  currency: string
  pricing_model: 'per_day' | 'per_hour' | 'per_night' | 'per_month' | 'fixed' | 'per_person'
  dynamic_pricing?: {
    weekday_price?: number
    weekend_price?: number
    peak_season_price?: number
    off_season_price?: number
    hourly_rate?: number
    daily_rate?: number
    weekly_rate?: number
    monthly_rate?: number
  }
  
  // Inventory & Availability
  quantity_total: number
  quantity_available: number
  unlimited_quantity: boolean
  
  // Availability Calendar
  availability_type: 'always' | 'calendar' | 'schedule'
  blocked_dates?: string[]
  available_time_slots?: {
    day_of_week: number // 0-6
    start_time: string
    end_time: string
  }[]
  
  // Media
  images: string[]
  primary_image_url?: string
  video_url?: string
  virtual_tour_url?: string
  
  // Booking Rules
  min_duration?: number // min days/hours
  max_duration?: number
  advance_booking_days?: number
  cancellation_policy?: string
  deposit_required?: number
  
  // Status
  is_active: boolean
  is_featured: boolean
  
  // Metrics
  booking_count: number
  revenue_generated: number
  average_rating: number
  
  created_at: string
  updated_at: string
}

export interface AdvancedListing {
  id: string
  user_id: string
  business_id?: string
  
  // Type
  listing_type: 'hotel' | 'hostel' | 'vehicle_rental' | 'equipment_rental' | 'product' | 'service' | 'experience' | 'space_rental' | 'event_venue'
  category: string
  subcategory?: string
  
  // Basic Info
  title: string
  tagline?: string
  description: string
  
  // Business Details
  business_name?: string
  business_license?: string
  business_type?: 'individual' | 'business' | 'enterprise'
  
  // Location
  address?: string
  city: string
  state?: string
  country: string
  postal_code?: string
  coordinates?: { lat: number; lng: number }
  
  // Multi-Item Configuration
  has_variants: boolean
  variant_count: number
  total_inventory: number
  
  // Amenities/Features (for the entire listing)
  amenities: string[]
  policies: {
    check_in_time?: string
    check_out_time?: string
    house_rules?: string[]
    cancellation_policy: string
    payment_terms?: string
    minimum_stay?: number
    maximum_stay?: number
  }
  
  // Media (main listing)
  cover_image_url?: string
  gallery_images: string[]
  video_url?: string
  virtual_tour_url?: string
  
  // Contact
  contact_method: 'message' | 'phone' | 'email' | 'all'
  phone_number?: string
  email?: string
  website?: string
  
  // Verification
  is_verified: boolean
  verification_level: 'none' | 'phone' | 'email' | 'id' | 'business'
  
  // Metrics
  total_bookings: number
  total_revenue: number
  average_rating: number
  review_count: number
  view_count: number
  
  // Status
  status: 'draft' | 'active' | 'paused' | 'suspended'
  is_featured: boolean
  
  // SEO
  tags: string[]
  meta_title?: string
  meta_description?: string
  
  created_at: string
  updated_at: string
  
  // Relations
  variants?: ListingVariant[]
  profiles?: {
    id: string
    name: string
    username: string
    avatar_url: string
    business_verified: boolean
  }
}

export interface BookingRequest {
  listing_id: string
  variant_id?: string
  guest_id: string
  
  // Date/Time
  start_date: string
  end_date: string
  duration_value: number
  duration_unit: 'hour' | 'day' | 'night' | 'week' | 'month'
  
  // Quantity (for rentable items)
  quantity: number
  
  // Guest Details
  num_adults?: number
  num_children?: number
  num_infants?: number
  
  // Special Requests
  special_requests?: string
  add_ons?: string[]
  
  // Pricing
  base_price: number
  additional_fees: {
    cleaning_fee?: number
    service_fee?: number
    insurance_fee?: number
    deposit?: number
    taxes?: number
  }
  total_price: number
  currency: string
  
  // Payment
  payment_method: 'stripe' | 'paypal' | 'cash' | 'bank_transfer'
  payment_status: 'pending' | 'paid' | 'refunded'
  
  // Status
  status: 'inquiry' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  
  created_at: string
}

export class AdvancedListingService {
  // ===== CREATE ADVANCED LISTING =====
  
  static async createAdvancedListing(data: {
    userId: string
    listingType: AdvancedListing['listing_type']
    basicInfo: {
      title: string
      tagline?: string
      description: string
      category: string
      businessName?: string
    }
    location: {
      city: string
      state?: string
      country: string
      address?: string
      coordinates?: { lat: number; lng: number }
    }
    media: {
      coverImage?: string
      gallery?: string[]
      video?: string
      virtualTour?: string
    }
    hasVariants: boolean
  }): Promise<{ success: boolean; listing?: AdvancedListing; error?: string }> {
    try {
      const { data: listing, error } = await supabase
        .from('advanced_listings')
        .insert({
          user_id: data.userId,
          listing_type: data.listingType,
          title: data.basicInfo.title,
          tagline: data.basicInfo.tagline,
          description: data.basicInfo.description,
          category: data.basicInfo.category,
          business_name: data.basicInfo.businessName,
          city: data.location.city,
          state: data.location.state,
          country: data.location.country,
          address: data.location.address,
          coordinates: data.location.coordinates,
          cover_image_url: data.media.coverImage,
          gallery_images: data.media.gallery || [],
          video_url: data.media.video,
          virtual_tour_url: data.media.virtualTour,
          has_variants: data.hasVariants,
          variant_count: 0,
          total_inventory: 0,
          amenities: [],
          policies: {
            cancellation_policy: 'flexible'
          },
          tags: [],
          status: 'draft',
          is_featured: false,
          is_verified: false,
          verification_level: 'none',
          total_bookings: 0,
          total_revenue: 0,
          average_rating: 0,
          review_count: 0,
          view_count: 0,
          contact_method: 'message'
        })
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            username,
            avatar_url,
            business_verified
          )
        `)
        .single()

      if (error) throw error

      return { success: true, listing: listing as AdvancedListing }
    } catch (error: any) {
      console.error('Create advanced listing error:', error)
      return { success: false, error: error.message }
    }
  }

  // ===== ADD VARIANT (Room, Vehicle, Product Option, etc.) =====
  
  static async addVariant(data: {
    listingId: string
    variantType: ListingVariant['variant_type']
    name: string
    description?: string
    attributes: ListingVariant['attributes']
    pricing: {
      basePrice: number
      currency: string
      pricingModel: ListingVariant['pricing_model']
      dynamicPricing?: ListingVariant['dynamic_pricing']
    }
    inventory: {
      quantityTotal: number
      unlimited?: boolean
    }
    media: {
      images: string[]
      primaryImage?: string
      video?: string
    }
    availability?: {
      type: ListingVariant['availability_type']
      blockedDates?: string[]
      timeSlots?: ListingVariant['available_time_slots']
    }
    bookingRules?: {
      minDuration?: number
      maxDuration?: number
      advanceBookingDays?: number
      cancellationPolicy?: string
      depositRequired?: number
    }
  }): Promise<{ success: boolean; variant?: ListingVariant; error?: string }> {
    try {
      const { data: variant, error } = await supabase
        .from('listing_variants')
        .insert({
          parent_listing_id: data.listingId,
          variant_type: data.variantType,
          name: data.name,
          description: data.description,
          attributes: data.attributes,
          base_price: data.pricing.basePrice,
          currency: data.pricing.currency,
          pricing_model: data.pricing.pricingModel,
          dynamic_pricing: data.pricing.dynamicPricing,
          quantity_total: data.inventory.quantityTotal,
          quantity_available: data.inventory.quantityTotal,
          unlimited_quantity: data.inventory.unlimited || false,
          availability_type: data.availability?.type || 'always',
          blocked_dates: data.availability?.blockedDates || [],
          available_time_slots: data.availability?.timeSlots || [],
          images: data.media.images,
          primary_image_url: data.media.primaryImage || data.media.images[0],
          video_url: data.media.video,
          min_duration: data.bookingRules?.minDuration,
          max_duration: data.bookingRules?.maxDuration,
          advance_booking_days: data.bookingRules?.advanceBookingDays,
          cancellation_policy: data.bookingRules?.cancellationPolicy,
          deposit_required: data.bookingRules?.depositRequired,
          is_active: true,
          is_featured: false,
          booking_count: 0,
          revenue_generated: 0,
          average_rating: 0
        })
        .select()
        .single()

      if (error) throw error

      // Update parent listing variant count
      await this.updateListingVariantCount(data.listingId)

      return { success: true, variant: variant as ListingVariant }
    } catch (error: any) {
      console.error('Add variant error:', error)
      return { success: false, error: error.message }
    }
  }

  // ===== BULK ADD VARIANTS (for fleets, multiple rooms, etc.) =====
  
  static async bulkAddVariants(
    listingId: string,
    variants: Array<Omit<Parameters<typeof AdvancedListingService.addVariant>[0], 'listingId'>>
  ): Promise<{ success: boolean; variants?: ListingVariant[]; error?: string }> {
    try {
      const results = await Promise.all(
        variants.map(variant => this.addVariant({ ...variant, listingId }))
      )

      const allSuccessful = results.every(r => r.success)
      if (!allSuccessful) {
        const errors = results.filter(r => !r.success).map(r => r.error).join(', ')
        throw new Error(`Some variants failed: ${errors}`)
      }

      const createdVariants = results.map(r => r.variant).filter(Boolean) as ListingVariant[]

      return { success: true, variants: createdVariants }
    } catch (error: any) {
      console.error('Bulk add variants error:', error)
      return { success: false, error: error.message }
    }
  }

  // ===== GET LISTING WITH ALL VARIANTS =====
  
  static async getListingWithVariants(listingId: string): Promise<{ success: boolean; listing?: AdvancedListing; error?: string }> {
    try {
      const { data: listing, error } = await supabase
        .from('advanced_listings')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            username,
            avatar_url,
            business_verified
          ),
          variants:listing_variants (*)
        `)
        .eq('id', listingId)
        .single()

      if (error) throw error

      return { success: true, listing: listing as AdvancedListing }
    } catch (error: any) {
      console.error('Get listing error:', error)
      return { success: false, error: error.message }
    }
  }

  // ===== CHECK VARIANT AVAILABILITY =====
  
  static async checkVariantAvailability(
    variantId: string,
    startDate: string,
    endDate: string,
    quantity: number = 1
  ): Promise<{ success: boolean; available?: boolean; availableQuantity?: number; error?: string }> {
    try {
      const { data: variant, error: variantError } = await supabase
        .from('listing_variants')
        .select('*')
        .eq('id', variantId)
        .single()

      if (variantError) throw variantError

      // Check blocked dates
      const requestedDates = this.getDateRange(startDate, endDate)
      const hasBlockedDate = requestedDates.some(date => 
        variant.blocked_dates?.includes(date)
      )

      if (hasBlockedDate) {
        return { success: true, available: false, availableQuantity: 0 }
      }

      // Check existing bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('booking_requests')
        .select('quantity, start_date, end_date')
        .eq('variant_id', variantId)
        .in('status', ['confirmed', 'in_progress'])
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)

      if (bookingsError) throw bookingsError

      // Calculate available quantity
      const bookedQuantity = bookings?.reduce((sum, b) => sum + b.quantity, 0) || 0
      const availableQuantity = variant.unlimited_quantity 
        ? 999 
        : Math.max(0, variant.quantity_available - bookedQuantity)

      const isAvailable = availableQuantity >= quantity

      return { success: true, available: isAvailable, availableQuantity }
    } catch (error: any) {
      console.error('Check availability error:', error)
      return { success: false, error: error.message }
    }
  }

  // ===== SEARCH WITH VARIANTS =====
  
  static async searchListingsWithVariants(filters: {
    listingType?: string
    location?: string
    checkIn?: string
    checkOut?: string
    guests?: number
    minPrice?: number
    maxPrice?: number
    amenities?: string[]
    category?: string
    hasAvailability?: boolean
  }): Promise<{ success: boolean; listings?: AdvancedListing[]; error?: string }> {
    try {
      let query = supabase
        .from('advanced_listings')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            username,
            avatar_url,
            business_verified
          ),
          variants:listing_variants (
            id,
            name,
            base_price,
            primary_image_url,
            quantity_available,
            is_active
          )
        `)
        .eq('status', 'active')

      if (filters.listingType) {
        query = query.eq('listing_type', filters.listingType)
      }

      if (filters.location) {
        query = query.or(`city.ilike.%${filters.location}%,state.ilike.%${filters.location}%`)
      }

      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      const { data: listings, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      // Filter by availability if dates provided
      let filteredListings = listings as AdvancedListing[]

      if (filters.checkIn && filters.checkOut && filters.hasAvailability) {
        filteredListings = await this.filterByAvailability(
          filteredListings,
          filters.checkIn,
          filters.checkOut,
          filters.guests || 1
        )
      }

      // Filter by price range
      if (filters.minPrice || filters.maxPrice) {
        filteredListings = filteredListings.filter(listing => {
          const lowestPrice = Math.min(...(listing.variants?.map(v => v.base_price) || [Infinity]))
          return (
            (!filters.minPrice || lowestPrice >= filters.minPrice) &&
            (!filters.maxPrice || lowestPrice <= filters.maxPrice)
          )
        })
      }

      return { success: true, listings: filteredListings }
    } catch (error: any) {
      console.error('Search listings error:', error)
      return { success: false, error: error.message }
    }
  }

  // ===== HELPER FUNCTIONS =====

  private static getDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = []
    const current = new Date(startDate)
    const end = new Date(endDate)

    while (current <= end) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }

    return dates
  }

  private static async filterByAvailability(
    listings: AdvancedListing[],
    checkIn: string,
    checkOut: string,
    guests: number
  ): Promise<AdvancedListing[]> {
    const availableListings: AdvancedListing[] = []

    for (const listing of listings) {
      if (!listing.variants || listing.variants.length === 0) continue

      // Check if any variant is available
      for (const variant of listing.variants) {
        const availability = await this.checkVariantAvailability(
          variant.id,
          checkIn,
          checkOut,
          1
        )

        if (availability.available) {
          availableListings.push(listing)
          break
        }
      }
    }

    return availableListings
  }

  private static async updateListingVariantCount(listingId: string): Promise<void> {
    const { data: variants } = await supabase
      .from('listing_variants')
      .select('quantity_total')
      .eq('parent_listing_id', listingId)
      .eq('is_active', true)

    if (variants) {
      const totalInventory = variants.reduce((sum, v) => sum + v.quantity_total, 0)

      await supabase
        .from('advanced_listings')
        .update({
          variant_count: variants.length,
          total_inventory: totalInventory
        })
        .eq('id', listingId)
    }
  }

  // ===== UPDATE VARIANT AVAILABILITY =====
  
  static async updateVariantAvailability(
    variantId: string,
    updates: {
      quantityAvailable?: number
      blockedDates?: string[]
      timeSlots?: ListingVariant['available_time_slots']
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('listing_variants')
        .update({
          quantity_available: updates.quantityAvailable,
          blocked_dates: updates.blockedDates,
          available_time_slots: updates.timeSlots
        })
        .eq('id', variantId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Update availability error:', error)
      return { success: false, error: error.message }
    }
  }

  // ===== CLONE VARIANT (for quick duplication) =====
  
  static async cloneVariant(
    variantId: string,
    customizations?: Partial<ListingVariant>
  ): Promise<{ success: boolean; variant?: ListingVariant; error?: string }> {
    try {
      const { data: original, error: fetchError } = await supabase
        .from('listing_variants')
        .select('*')
        .eq('id', variantId)
        .single()

      if (fetchError) throw fetchError

      const { data: newVariant, error: createError } = await supabase
        .from('listing_variants')
        .insert({
          ...original,
          id: undefined, // Let database generate new ID
          name: customizations?.name || `${original.name} (Copy)`,
          ...customizations,
          booking_count: 0,
          revenue_generated: 0,
          created_at: undefined,
          updated_at: undefined
        })
        .select()
        .single()

      if (createError) throw createError

      await this.updateListingVariantCount(original.parent_listing_id)

      return { success: true, variant: newVariant as ListingVariant }
    } catch (error: any) {
      console.error('Clone variant error:', error)
      return { success: false, error: error.message }
    }
  }
}

export default AdvancedListingService

