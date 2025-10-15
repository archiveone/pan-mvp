import { supabase } from '@/lib/supabase'

export interface BookableListing {
  id: string
  user_id: string
  title: string
  description: string
  property_type: 'apartment' | 'house' | 'room' | 'studio' | 'villa' | 'cabin' | 'other'
  listing_type: 'entire_place' | 'private_room' | 'shared_room'
  
  // Location
  address: string
  city: string
  state: string
  country: string
  postal_code: string
  coordinates: { lat: number; lng: number }
  
  // Capacity
  max_guests: number
  bedrooms: number
  beds: number
  bathrooms: number
  
  // Pricing
  base_price: number
  currency: string
  cleaning_fee?: number
  service_fee_percentage: number
  weekend_price?: number
  monthly_discount_percentage?: number
  
  // Amenities
  amenities: string[]
  
  // Rules
  house_rules: string[]
  check_in_time: string
  check_out_time: string
  min_nights: number
  max_nights?: number
  cancellation_policy: 'flexible' | 'moderate' | 'strict'
  
  // Images
  images: string[]
  virtual_tour_url?: string
  
  // Availability
  calendar_type: 'manual' | 'synced'
  instant_book: boolean
  blocked_dates: string[]
  
  // Status
  is_active: boolean
  is_verified: boolean
  
  // Reviews
  average_rating: number
  review_count: number
  
  created_at: string
  updated_at: string
  
  profiles?: {
    id: string
    name: string
    username: string
    avatar_url: string
    host_since: string
    superhost: boolean
  }
}

export interface Booking {
  id: string
  listing_id: string
  guest_id: string
  host_id: string
  
  // Dates
  check_in: string
  check_out: string
  nights: number
  
  // Guests
  num_guests: number
  num_adults: number
  num_children: number
  num_infants: number
  num_pets: number
  
  // Pricing
  base_price: number
  cleaning_fee: number
  service_fee: number
  total_price: number
  currency: string
  
  // Status
  status: 'inquiry' | 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed'
  payment_status: 'unpaid' | 'paid' | 'refunded'
  payment_id?: string
  
  // Communication
  guest_message?: string
  host_response?: string
  special_requests?: string
  
  // Check-in
  self_check_in: boolean
  check_in_instructions?: string
  
  created_at: string
  updated_at: string
}

export interface BookingAvailability {
  date: string
  available: boolean
  price: number
  min_nights: number
}

export interface Review {
  id: string
  booking_id: string
  listing_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  cleanliness_rating: number
  communication_rating: number
  check_in_rating: number
  accuracy_rating: number
  location_rating: number
  value_rating: number
  comment: string
  host_response?: string
  created_at: string
}

export class BookingService {
  // === LISTING MANAGEMENT ===

  static async createListing(data: Partial<BookableListing>): Promise<{ success: boolean; listing?: BookableListing; error?: string }> {
    try {
      const { data: listing, error } = await supabase
        .from('bookable_listings')
        .insert({
          ...data,
          is_active: true,
          is_verified: false,
          average_rating: 0,
          review_count: 0,
          service_fee_percentage: 10 // Default 10% service fee
        })
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            username,
            avatar_url,
            host_since,
            superhost
          )
        `)
        .single()

      if (error) throw error

      return { success: true, listing: listing as BookableListing }
    } catch (error: any) {
      console.error('Create listing error:', error)
      return { success: false, error: error.message }
    }
  }

  static async updateListing(listingId: string, data: Partial<BookableListing>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('bookable_listings')
        .update(data)
        .eq('id', listingId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Update listing error:', error)
      return { success: false, error: error.message }
    }
  }

  // === SEARCH & DISCOVERY ===

  static async searchListings(filters: {
    location?: string
    checkIn?: string
    checkOut?: string
    guests?: number
    minPrice?: number
    maxPrice?: number
    propertyType?: string
    amenities?: string[]
    instantBook?: boolean
    limit?: number
  }): Promise<{ success: boolean; listings?: BookableListing[]; error?: string }> {
    try {
      let query = supabase
        .from('bookable_listings')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            username,
            avatar_url,
            host_since,
            superhost
          )
        `)
        .eq('is_active', true)

      if (filters.location) {
        query = query.or(`city.ilike.%${filters.location}%,state.ilike.%${filters.location}%,country.ilike.%${filters.location}%`)
      }

      if (filters.guests) {
        query = query.gte('max_guests', filters.guests)
      }

      if (filters.minPrice) {
        query = query.gte('base_price', filters.minPrice)
      }

      if (filters.maxPrice) {
        query = query.lte('base_price', filters.maxPrice)
      }

      if (filters.propertyType) {
        query = query.eq('property_type', filters.propertyType)
      }

      if (filters.instantBook) {
        query = query.eq('instant_book', true)
      }

      query = query
        .order('average_rating', { ascending: false })
        .limit(filters.limit || 50)

      const { data: listings, error } = await query

      if (error) throw error

      return { success: true, listings: listings as BookableListing[] }
    } catch (error: any) {
      console.error('Search listings error:', error)
      return { success: false, error: error.message }
    }
  }

  // === AVAILABILITY ===

  static async checkAvailability(
    listingId: string,
    checkIn: string,
    checkOut: string
  ): Promise<{ success: boolean; available?: boolean; price?: number; error?: string }> {
    try {
      // Check if dates are blocked
      const { data: listing, error: listingError } = await supabase
        .from('bookable_listings')
        .select('blocked_dates, base_price, min_nights')
        .eq('id', listingId)
        .single()

      if (listingError) throw listingError

      // Check for existing bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('check_in, check_out')
        .eq('listing_id', listingId)
        .in('status', ['pending', 'accepted'])
        .or(`check_in.lte.${checkOut},check_out.gte.${checkIn}`)

      if (bookingsError) throw bookingsError

      const available = bookings.length === 0
      const price = listing.base_price

      return { success: true, available, price }
    } catch (error: any) {
      console.error('Check availability error:', error)
      return { success: false, error: error.message }
    }
  }

  static async getCalendarAvailability(
    listingId: string,
    startDate: string,
    endDate: string
  ): Promise<{ success: boolean; calendar?: BookingAvailability[]; error?: string }> {
    try {
      const { data: listing, error: listingError } = await supabase
        .from('bookable_listings')
        .select('blocked_dates, base_price, weekend_price, min_nights')
        .eq('id', listingId)
        .single()

      if (listingError) throw listingError

      // Get all bookings in date range
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('check_in, check_out')
        .eq('listing_id', listingId)
        .in('status', ['pending', 'accepted'])
        .gte('check_in', startDate)
        .lte('check_out', endDate)

      if (bookingsError) throw bookingsError

      // Generate calendar
      const calendar: BookingAvailability[] = []
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0]
        const isWeekend = date.getDay() === 0 || date.getDay() === 6
        
        const isBooked = bookings.some(booking => {
          const checkIn = new Date(booking.check_in)
          const checkOut = new Date(booking.check_out)
          return date >= checkIn && date < checkOut
        })
        
        const isBlocked = listing.blocked_dates?.includes(dateStr)
        
        calendar.push({
          date: dateStr,
          available: !isBooked && !isBlocked,
          price: isWeekend && listing.weekend_price ? listing.weekend_price : listing.base_price,
          min_nights: listing.min_nights
        })
      }

      return { success: true, calendar }
    } catch (error: any) {
      console.error('Get calendar error:', error)
      return { success: false, error: error.message }
    }
  }

  // === BOOKING MANAGEMENT ===

  static async createBooking(data: {
    listingId: string
    guestId: string
    checkIn: string
    checkOut: string
    numGuests: number
    numAdults?: number
    numChildren?: number
    guestMessage?: string
  }): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    try {
      // Get listing details
      const { data: listing, error: listingError } = await supabase
        .from('bookable_listings')
        .select('user_id, base_price, cleaning_fee, service_fee_percentage, currency, instant_book')
        .eq('id', data.listingId)
        .single()

      if (listingError) throw listingError

      // Calculate nights
      const checkIn = new Date(data.checkIn)
      const checkOut = new Date(data.checkOut)
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

      // Calculate pricing
      const basePrice = listing.base_price * nights
      const cleaningFee = listing.cleaning_fee || 0
      const serviceFee = basePrice * (listing.service_fee_percentage / 100)
      const totalPrice = basePrice + cleaningFee + serviceFee

      // Create booking
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          listing_id: data.listingId,
          guest_id: data.guestId,
          host_id: listing.user_id,
          check_in: data.checkIn,
          check_out: data.checkOut,
          nights,
          num_guests: data.numGuests,
          num_adults: data.numAdults || data.numGuests,
          num_children: data.numChildren || 0,
          base_price: basePrice,
          cleaning_fee: cleaningFee,
          service_fee: serviceFee,
          total_price: totalPrice,
          currency: listing.currency,
          status: listing.instant_book ? 'accepted' : 'pending',
          payment_status: 'unpaid',
          guest_message: data.guestMessage,
          self_check_in: false
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, booking: booking as Booking }
    } catch (error: any) {
      console.error('Create booking error:', error)
      return { success: false, error: error.message }
    }
  }

  static async updateBookingStatus(
    bookingId: string,
    status: Booking['status'],
    hostResponse?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status,
          host_response: hostResponse
        })
        .eq('id', bookingId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Update booking status error:', error)
      return { success: false, error: error.message }
    }
  }

  // === REVIEWS ===

  static async createReview(data: {
    bookingId: string
    listingId: string
    reviewerId: string
    revieweeId: string
    rating: number
    ratings: {
      cleanliness: number
      communication: number
      checkIn: number
      accuracy: number
      location: number
      value: number
    }
    comment: string
  }): Promise<{ success: boolean; review?: Review; error?: string }> {
    try {
      const { data: review, error } = await supabase
        .from('reviews')
        .insert({
          booking_id: data.bookingId,
          listing_id: data.listingId,
          reviewer_id: data.reviewerId,
          reviewee_id: data.revieweeId,
          rating: data.rating,
          cleanliness_rating: data.ratings.cleanliness,
          communication_rating: data.ratings.communication,
          check_in_rating: data.ratings.checkIn,
          accuracy_rating: data.ratings.accuracy,
          location_rating: data.ratings.location,
          value_rating: data.ratings.value,
          comment: data.comment
        })
        .select()
        .single()

      if (error) throw error

      // Update listing average rating
      await this.updateListingRating(data.listingId)

      return { success: true, review: review as Review }
    } catch (error: any) {
      console.error('Create review error:', error)
      return { success: false, error: error.message }
    }
  }

  private static async updateListingRating(listingId: string): Promise<void> {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('listing_id', listingId)

    if (reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

      await supabase
        .from('bookable_listings')
        .update({
          average_rating: avgRating,
          review_count: reviews.length
        })
        .eq('id', listingId)
    }
  }
}

export default BookingService
