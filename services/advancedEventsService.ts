import { supabase } from '@/lib/supabase'

export interface AdvancedEvent {
  id: string
  user_id: string
  title: string
  description: string
  category: 'conference' | 'concert' | 'workshop' | 'meetup' | 'sports' | 'exhibition' | 'party' | 'other'
  event_type: 'in-person' | 'virtual' | 'hybrid'
  
  // Date & Time
  start_date: string
  end_date: string
  timezone: string
  
  // Location
  venue_name?: string
  address?: string
  city?: string
  state?: string
  country?: string
  coordinates?: { lat: number; lng: number }
  virtual_link?: string
  
  // Ticketing
  is_free: boolean
  ticket_tiers: TicketTier[]
  total_capacity?: number
  remaining_capacity?: number
  
  // Images
  cover_image_url?: string
  gallery_images?: string[]
  
  // Additional Info
  tags: string[]
  age_restriction?: number
  dress_code?: string
  accessibility_info?: string
  refund_policy?: string
  
  // Social
  attendee_count: number
  interested_count: number
  
  // Status
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'
  is_featured: boolean
  
  created_at: string
  updated_at: string
  
  // Profile relation
  profiles?: {
    id: string
    name: string
    username: string
    avatar_url: string
  }
}

export interface TicketTier {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  quantity_available: number
  quantity_sold: number
  sale_start_date?: string
  sale_end_date?: string
  perks?: string[]
}

export interface EventRegistration {
  id: string
  event_id: string
  user_id: string
  ticket_tier_id: string
  quantity: number
  total_amount: number
  currency: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded'
  payment_id?: string
  qr_code?: string
  checked_in: boolean
  checked_in_at?: string
  created_at: string
}

export interface EventAnalytics {
  total_views: number
  total_tickets_sold: number
  total_revenue: number
  attendee_demographics: any
  ticket_sales_timeline: any[]
}

export class AdvancedEventsService {
  // === EVENT MANAGEMENT ===

  static async createEvent(data: Partial<AdvancedEvent>): Promise<{ success: boolean; event?: AdvancedEvent; error?: string }> {
    try {
      const { data: event, error } = await supabase
        .from('advanced_events')
        .insert({
          ...data,
          status: 'draft',
          attendee_count: 0,
          interested_count: 0,
          is_featured: false
        })
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      return { success: true, event: event as AdvancedEvent }
    } catch (error: any) {
      console.error('Create event error:', error)
      return { success: false, error: error.message }
    }
  }

  static async updateEvent(eventId: string, data: Partial<AdvancedEvent>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('advanced_events')
        .update(data)
        .eq('id', eventId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Update event error:', error)
      return { success: false, error: error.message }
    }
  }

  static async publishEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('advanced_events')
        .update({ status: 'published' })
        .eq('id', eventId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Publish event error:', error)
      return { success: false, error: error.message }
    }
  }

  // === EVENT DISCOVERY ===

  static async searchEvents(filters: {
    query?: string
    category?: string
    eventType?: string
    location?: string
    dateFrom?: string
    dateTo?: string
    isFree?: boolean
    limit?: number
  }): Promise<{ success: boolean; events?: AdvancedEvent[]; error?: string }> {
    try {
      let query = supabase
        .from('advanced_events')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('status', 'published')

      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
      }

      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.eventType) {
        query = query.eq('event_type', filters.eventType)
      }

      if (filters.location) {
        query = query.or(`city.ilike.%${filters.location}%,state.ilike.%${filters.location}%`)
      }

      if (filters.dateFrom) {
        query = query.gte('start_date', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('end_date', filters.dateTo)
      }

      if (filters.isFree !== undefined) {
        query = query.eq('is_free', filters.isFree)
      }

      query = query
        .order('start_date', { ascending: true })
        .limit(filters.limit || 50)

      const { data: events, error } = await query

      if (error) throw error

      return { success: true, events: events as AdvancedEvent[] }
    } catch (error: any) {
      console.error('Search events error:', error)
      return { success: false, error: error.message }
    }
  }

  // === TICKET MANAGEMENT ===

  static async registerForEvent(data: {
    eventId: string
    userId: string
    ticketTierId: string
    quantity: number
  }): Promise<{ success: boolean; registration?: EventRegistration; error?: string }> {
    try {
      // Get ticket tier details
      const { data: event, error: eventError } = await supabase
        .from('advanced_events')
        .select('*')
        .eq('id', data.eventId)
        .single()

      if (eventError) throw eventError

      const ticketTier = event.ticket_tiers.find((t: TicketTier) => t.id === data.ticketTierId)
      if (!ticketTier) throw new Error('Ticket tier not found')

      // Check availability
      if (ticketTier.quantity_sold + data.quantity > ticketTier.quantity_available) {
        throw new Error('Not enough tickets available')
      }

      // Calculate total
      const totalAmount = ticketTier.price * data.quantity

      // Create registration
      const { data: registration, error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: data.eventId,
          user_id: data.userId,
          ticket_tier_id: data.ticketTierId,
          quantity: data.quantity,
          total_amount: totalAmount,
          currency: ticketTier.currency,
          status: 'pending',
          checked_in: false
        })
        .select()
        .single()

      if (error) throw error

      // Update ticket tier sold count
      await this.updateTicketTierSold(data.eventId, data.ticketTierId, data.quantity)

      // Increment attendee count
      await supabase.rpc('increment_event_attendees', { event_id: data.eventId, count: data.quantity })

      return { success: true, registration: registration as EventRegistration }
    } catch (error: any) {
      console.error('Register for event error:', error)
      return { success: false, error: error.message }
    }
  }

  private static async updateTicketTierSold(eventId: string, tierId: string, quantity: number): Promise<void> {
    // This would require a more complex update - simplified for now
    const { data: event } = await supabase
      .from('advanced_events')
      .select('ticket_tiers')
      .eq('id', eventId)
      .single()

    if (event) {
      const updatedTiers = event.ticket_tiers.map((tier: TicketTier) => {
        if (tier.id === tierId) {
          return { ...tier, quantity_sold: tier.quantity_sold + quantity }
        }
        return tier
      })

      await supabase
        .from('advanced_events')
        .update({ ticket_tiers: updatedTiers })
        .eq('id', eventId)
    }
  }

  static async cancelRegistration(registrationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({ status: 'cancelled' })
        .eq('id', registrationId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Cancel registration error:', error)
      return { success: false, error: error.message }
    }
  }

  // === CHECK-IN ===

  static async checkInAttendee(registrationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString()
        })
        .eq('id', registrationId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Check-in error:', error)
      return { success: false, error: error.message }
    }
  }

  // === ANALYTICS ===

  static async getEventAnalytics(eventId: string): Promise<{ success: boolean; analytics?: EventAnalytics; error?: string }> {
    try {
      // This would aggregate data from various sources
      const analytics: EventAnalytics = {
        total_views: 0,
        total_tickets_sold: 0,
        total_revenue: 0,
        attendee_demographics: {},
        ticket_sales_timeline: []
      }

      return { success: true, analytics }
    } catch (error: any) {
      console.error('Get analytics error:', error)
      return { success: false, error: error.message }
    }
  }
}

export default AdvancedEventsService

