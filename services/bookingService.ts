import { supabase } from '@/lib/supabase'
import { TransactionService } from './transactionService'

export interface BookingSlot {
  id: string
  content_id: string
  date: string
  start_time: string
  end_time: string
  max_capacity: number
  current_bookings: number
  price: number
  currency: string
  is_available: boolean
  metadata?: Record<string, any>
}

export interface BookingRequest {
  id: string
  user_id: string
  content_id: string
  booking_slot_id: string
  date: string
  start_time: string
  end_time: string
  party_size: number
  total_price: number
  currency: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  special_requests?: string
  contact_info: {
    name: string
    email: string
    phone?: string
  }
  created_at: string
  updated_at: string
}

export interface AvailabilityRule {
  content_id: string
  day_of_week: number // 0 = Sunday, 1 = Monday, etc.
  start_time: string
  end_time: string
  max_capacity: number
  price: number
  is_active: boolean
  exceptions?: Array<{
    date: string
    is_available: boolean
    custom_price?: number
    custom_capacity?: number
  }>
}

export interface RecurringBooking {
  id: string
  user_id: string
  content_id: string
  pattern: 'daily' | 'weekly' | 'monthly'
  start_date: string
  end_date: string
  time_slot: {
    start_time: string
    end_time: string
  }
  frequency: number // Every X days/weeks/months
  max_occurrences?: number
  is_active: boolean
  created_at: string
}

export class BookingService {
  
  // ==================== AVAILABILITY MANAGEMENT ====================
  
  /**
   * Create availability rules for a service/rental
   */
  static async createAvailabilityRule(rule: AvailabilityRule): Promise<{
    success: boolean;
    rule?: AvailabilityRule;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('availability_rules')
        .insert(rule)
        .select()
        .single()

      if (error) throw error

      return { success: true, rule: data as AvailabilityRule }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get availability for a specific date range
   */
  static async getAvailability(
    contentId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    success: boolean;
    slots?: BookingSlot[];
    error?: string;
  }> {
    try {
      // Get availability rules
      const { data: rules, error: rulesError } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('content_id', contentId)
        .eq('is_active', true)

      if (rulesError) throw rulesError

      // Get existing bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('booking_requests')
        .select('booking_slot_id, party_size, status')
        .eq('content_id', contentId)
        .in('status', ['confirmed', 'pending'])

      if (bookingsError) throw bookingsError

      // Generate available slots
      const slots: BookingSlot[] = []
      const currentDate = new Date(startDate)
      const endDateObj = new Date(endDate)

      while (currentDate <= endDateObj) {
        const dayOfWeek = currentDate.getDay()
        const dateStr = currentDate.toISOString().split('T')[0]

        // Find rules for this day of week
        const dayRules = rules?.filter(rule => rule.day_of_week === dayOfWeek) || []

        for (const rule of dayRules) {
          // Check for exceptions
          const exception = rule.exceptions?.find(ex => ex.date === dateStr)
          
          if (exception && !exception.is_available) {
            continue // Skip this slot due to exception
          }

          const slot: BookingSlot = {
            id: `${contentId}-${dateStr}-${rule.start_time}`,
            content_id: contentId,
            date: dateStr,
            start_time: rule.start_time,
            end_time: rule.end_time,
            max_capacity: exception?.custom_capacity || rule.max_capacity,
            current_bookings: 0,
            price: exception?.custom_price || rule.price,
            currency: 'EUR', // Default currency
            is_available: true,
            metadata: {
              rule_id: rule.id,
              is_exception: !!exception
            }
          }

          // Calculate current bookings for this slot
          const slotBookings = bookings?.filter(booking => 
            booking.booking_slot_id === slot.id
          ) || []

          slot.current_bookings = slotBookings.reduce((sum, booking) => 
            sum + booking.party_size, 0
          )

          slot.is_available = slot.current_bookings < slot.max_capacity

          slots.push(slot)
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }

      return { success: true, slots }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Check if a specific time slot is available
   */
  static async checkSlotAvailability(
    contentId: string,
    date: string,
    startTime: string,
    partySize: number
  ): Promise<{
    success: boolean;
    available: boolean;
    slot?: BookingSlot;
    error?: string;
  }> {
    try {
      const result = await this.getAvailability(contentId, date, date)
      
      if (!result.success) {
        return { success: false, available: false, error: result.error }
      }

      const slot = result.slots?.find(s => 
        s.date === date && s.start_time === startTime
      )

      if (!slot) {
        return { success: true, available: false }
      }

      const available = slot.is_available && (slot.current_bookings + partySize) <= slot.max_capacity

      return { 
        success: true, 
        available, 
        slot: available ? slot : undefined 
      }
    } catch (error) {
      return { 
        success: false, 
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // ==================== BOOKING MANAGEMENT ====================
  
  /**
   * Create a new booking request
   */
  static async createBookingRequest(
    userId: string,
    contentId: string,
    bookingData: {
      date: string
      start_time: string
      end_time: string
      party_size: number
      special_requests?: string
      contact_info: {
        name: string
        email: string
        phone?: string
      }
    }
  ): Promise<{
    success: boolean;
    booking?: BookingRequest;
    transaction?: any;
    error?: string;
  }> {
    try {
      // Check availability
      const availabilityCheck = await this.checkSlotAvailability(
        contentId,
        bookingData.date,
        bookingData.start_time,
        bookingData.party_size
      )

      if (!availabilityCheck.success) {
        return { success: false, error: availabilityCheck.error }
      }

      if (!availabilityCheck.available || !availabilityCheck.slot) {
        return { success: false, error: 'This time slot is no longer available' }
      }

      // Calculate total price
      const totalPrice = availabilityCheck.slot.price * bookingData.party_size

      // Create booking request
      const bookingRequest: Omit<BookingRequest, 'id' | 'created_at' | 'updated_at'> = {
        user_id: userId,
        content_id: contentId,
        booking_slot_id: availabilityCheck.slot.id,
        date: bookingData.date,
        start_time: bookingData.start_time,
        end_time: bookingData.end_time,
        party_size: bookingData.party_size,
        total_price: totalPrice,
        currency: availabilityCheck.slot.currency,
        status: 'pending',
        special_requests: bookingData.special_requests,
        contact_info: bookingData.contact_info
      }

      const { data: booking, error: bookingError } = await supabase
        .from('booking_requests')
        .insert(bookingRequest)
        .select()
        .single()

      if (bookingError) throw bookingError

      // Create transaction
      const transactionResult = await TransactionService.createBookingTransaction(
        userId,
        contentId,
        {
          booking_date: bookingData.date,
          start_time: bookingData.start_time,
          end_time: bookingData.end_time,
          party_size: bookingData.party_size,
          special_requests: bookingData.special_requests
        }
      )

      if (!transactionResult.success) {
        return { success: false, error: transactionResult.error }
      }

      return { 
        success: true, 
        booking: booking as BookingRequest,
        transaction: transactionResult.transaction
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Confirm a booking
   */
  static async confirmBooking(
    bookingId: string,
    paymentIntentId?: string
  ): Promise<{
    success: boolean;
    booking?: BookingRequest;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('booking_requests')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single()

      if (error) throw error

      // Update related transaction if payment intent provided
      if (paymentIntentId) {
        // Find the related transaction and update it
        const { data: transactions } = await supabase
          .from('transactions')
          .select('id')
          .eq('content_id', data.content_id)
          .eq('user_id', data.user_id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)

        if (transactions && transactions.length > 0) {
          await TransactionService.updateWithStripePayment(
            transactions[0].id,
            {
              payment_intent_id: paymentIntentId,
              status: 'succeeded'
            }
          )
        }
      }

      return { success: true, booking: data as BookingRequest }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Cancel a booking
   */
  static async cancelBooking(
    bookingId: string,
    reason?: string
  ): Promise<{
    success: boolean;
    booking?: BookingRequest;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('booking_requests')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString(),
          metadata: { cancellation_reason: reason }
        })
        .eq('id', bookingId)
        .select()
        .single()

      if (error) throw error

      return { success: true, booking: data as BookingRequest }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get user's bookings
   */
  static async getUserBookings(
    userId: string,
    status?: BookingRequest['status']
  ): Promise<{
    success: boolean;
    bookings?: BookingRequest[];
    error?: string;
  }> {
    try {
      let query = supabase
        .from('booking_requests')
        .select('*')
        .eq('user_id', userId)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) throw error

      return { success: true, bookings: data as BookingRequest[] }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get bookings for a content item (for providers)
   */
  static async getContentBookings(
    contentId: string,
    status?: BookingRequest['status']
  ): Promise<{
    success: boolean;
    bookings?: BookingRequest[];
    error?: string;
  }> {
    try {
      let query = supabase
        .from('booking_requests')
        .select(`
          *,
          profiles!booking_requests_user_id_fkey (
            name,
            username,
            avatar_url
          )
        `)
        .eq('content_id', contentId)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) throw error

      return { success: true, bookings: data as BookingRequest[] }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // ==================== RECURRING BOOKINGS ====================
  
  /**
   * Create recurring booking
   */
  static async createRecurringBooking(
    userId: string,
    contentId: string,
    recurringData: {
      pattern: 'daily' | 'weekly' | 'monthly'
      start_date: string
      end_date: string
      time_slot: {
        start_time: string
        end_time: string
      }
      frequency: number
      max_occurrences?: number
      party_size: number
      special_requests?: string
    }
  ): Promise<{
    success: boolean;
    recurring_booking?: RecurringBooking;
    individual_bookings?: BookingRequest[];
    error?: string;
  }> {
    try {
      // Create recurring booking record
      const recurringBooking: Omit<RecurringBooking, 'id' | 'created_at'> = {
        user_id: userId,
        content_id: contentId,
        pattern: recurringData.pattern,
        start_date: recurringData.start_date,
        end_date: recurringData.end_date,
        time_slot: recurringData.time_slot,
        frequency: recurringData.frequency,
        max_occurrences: recurringData.max_occurrences,
        is_active: true
      }

      const { data: recurring, error: recurringError } = await supabase
        .from('recurring_bookings')
        .insert(recurringBooking)
        .select()
        .single()

      if (recurringError) throw recurringError

      // Generate individual booking requests
      const individualBookings: BookingRequest[] = []
      const startDate = new Date(recurringData.start_date)
      const endDate = new Date(recurringData.end_date)
      let occurrenceCount = 0

      while (startDate <= endDate && (!recurringData.max_occurrences || occurrenceCount < recurringData.max_occurrences)) {
        // Check availability for this date
        const availabilityCheck = await this.checkSlotAvailability(
          contentId,
          startDate.toISOString().split('T')[0],
          recurringData.time_slot.start_time,
          recurringData.party_size
        )

        if (availabilityCheck.success && availabilityCheck.available && availabilityCheck.slot) {
          // Create individual booking
          const bookingResult = await this.createBookingRequest(
            userId,
            contentId,
            {
              date: startDate.toISOString().split('T')[0],
              start_time: recurringData.time_slot.start_time,
              end_time: recurringData.time_slot.end_time,
              party_size: recurringData.party_size,
              special_requests: recurringData.special_requests,
              contact_info: {
                name: '', // Will be filled from user profile
                email: ''
              }
            }
          )

          if (bookingResult.success && bookingResult.booking) {
            individualBookings.push(bookingResult.booking)
          }
        }

        // Move to next occurrence
        switch (recurringData.pattern) {
          case 'daily':
            startDate.setDate(startDate.getDate() + recurringData.frequency)
            break
          case 'weekly':
            startDate.setDate(startDate.getDate() + (7 * recurringData.frequency))
            break
          case 'monthly':
            startDate.setMonth(startDate.getMonth() + recurringData.frequency)
            break
        }

        occurrenceCount++
      }

      return { 
        success: true, 
        recurring_booking: recurring as RecurringBooking,
        individual_bookings: individualBookings
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // ==================== WAITLIST MANAGEMENT ====================
  
  /**
   * Add user to waitlist
   */
  static async addToWaitlist(
    userId: string,
    contentId: string,
    preferredDate: string,
    preferredTime: string,
    partySize: number
  ): Promise<{
    success: boolean;
    waitlist_position?: number;
    error?: string;
  }> {
    try {
      // Check if user is already on waitlist
      const { data: existingWaitlist } = await supabase
        .from('waitlist')
        .select('position')
        .eq('user_id', userId)
        .eq('content_id', contentId)
        .eq('preferred_date', preferredDate)
        .eq('preferred_time', preferredTime)

      if (existingWaitlist && existingWaitlist.length > 0) {
        return { 
          success: false, 
          error: 'You are already on the waitlist for this time slot' 
        }
      }

      // Get next position
      const { data: lastPosition } = await supabase
        .from('waitlist')
        .select('position')
        .eq('content_id', contentId)
        .eq('preferred_date', preferredDate)
        .eq('preferred_time', preferredTime)
        .order('position', { ascending: false })
        .limit(1)

      const nextPosition = (lastPosition?.[0]?.position || 0) + 1

      // Add to waitlist
      const { error } = await supabase
        .from('waitlist')
        .insert({
          user_id: userId,
          content_id: contentId,
          preferred_date: preferredDate,
          preferred_time: preferredTime,
          party_size: partySize,
          position: nextPosition,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      return { success: true, waitlist_position: nextPosition }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Notify waitlist when slot becomes available
   */
  static async notifyWaitlist(
    contentId: string,
    date: string,
    time: string,
    availableCapacity: number
  ): Promise<{
    success: boolean;
    notified_count?: number;
    error?: string;
  }> {
    try {
      // Get waitlist for this slot
      const { data: waitlist, error } = await supabase
        .from('waitlist')
        .select(`
          *,
          profiles!waitlist_user_id_fkey (
            name,
            username,
            email
          )
        `)
        .eq('content_id', contentId)
        .eq('preferred_date', date)
        .eq('preferred_time', time)
        .order('position', { ascending: true })

      if (error) throw error

      let remainingCapacity = availableCapacity
      let notifiedCount = 0

      // Notify users in order until capacity is filled
      for (const waitlistEntry of waitlist || []) {
        if (remainingCapacity >= waitlistEntry.party_size) {
          // TODO: Send notification email/SMS
          // For now, just log
          console.log(`Notifying ${waitlistEntry.profiles?.email} about available slot`)
          
          notifiedCount++
          remainingCapacity -= waitlistEntry.party_size
          
          // Remove from waitlist
          await supabase
            .from('waitlist')
            .delete()
            .eq('id', waitlistEntry.id)
        }
      }

      return { success: true, notified_count: notifiedCount }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}






