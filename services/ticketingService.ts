import { supabase } from '../lib/supabase';

export interface Ticket {
  id: string;
  event_id: string;
  ticket_type: 'general' | 'vip' | 'early_bird' | 'group' | 'student' | 'senior';
  title: string;
  description: string;
  price: number;
  currency: string;
  quantity_available: number;
  quantity_sold: number;
  max_per_person: number;
  sale_start_date: string;
  sale_end_date: string;
  event_start_date: string;
  event_end_date: string;
  venue_name: string;
  venue_address: string;
  venue_capacity: number;
  age_restriction?: number;
  refund_policy: 'no_refund' | 'full_refund_48h' | 'partial_refund_7d' | 'full_refund_30d';
  transfer_allowed: boolean;
  resale_allowed: boolean;
  includes: string[];
  terms_conditions: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  status: 'draft' | 'active' | 'paused' | 'sold_out' | 'cancelled' | 'completed';
}

export interface Booking {
  id: string;
  ticket_id: string;
  event_id: string;
  buyer_id: string;
  quantity: number;
  total_amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded' | 'attended' | 'no_show';
  booking_reference: string;
  attendee_details: AttendeeDetail[];
  payment_intent_id?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  booking_date: string;
  event_date: string;
  check_in_time?: string;
  qr_code: string;
  created_at: string;
  updated_at: string;
}

export interface AttendeeDetail {
  id: string;
  booking_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  age?: number;
  dietary_requirements?: string;
  accessibility_needs?: string;
  emergency_contact?: string;
  custom_fields?: Record<string, any>;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: 'concert' | 'conference' | 'workshop' | 'sports' | 'theater' | 'festival' | 'exhibition' | 'other';
  event_type: 'single' | 'recurring' | 'series';
  venue_name: string;
  venue_address: string;
  venue_capacity: number;
  start_date: string;
  end_date: string;
  timezone: string;
  organizer_id: string;
  organizer_name: string;
  organizer_email: string;
  organizer_phone?: string;
  image_url?: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Seat {
  id: string;
  venue_id: string;
  section: string;
  row: string;
  seat_number: string;
  seat_type: 'standard' | 'premium' | 'vip' | 'accessible';
  price_multiplier: number;
  is_available: boolean;
  is_reserved: boolean;
  booking_id?: string;
}

export class TicketingService {
  /**
   * Create a new event
   */
  static async createEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; event?: Event; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single();

      if (error) throw error;

      return { success: true, event: data as Event };
    } catch (error: any) {
      console.error('Error creating event:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create ticket types for an event
   */
  static async createTicket(ticketData: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; ticket?: Ticket; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select()
        .single();

      if (error) throw error;

      return { success: true, ticket: data as Ticket };
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get available tickets for an event
   */
  static async getEventTickets(eventId: string): Promise<{ success: boolean; tickets?: Ticket[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'active')
        .gte('quantity_available', 1)
        .order('price', { ascending: true });

      if (error) throw error;

      return { success: true, tickets: data as Ticket[] };
    } catch (error: any) {
      console.error('Error fetching event tickets:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a booking
   */
  static async createBooking(bookingData: {
    ticket_id: string;
    buyer_id: string;
    quantity: number;
    attendee_details: Omit<AttendeeDetail, 'id' | 'booking_id'>[];
    payment_intent_id?: string;
  }): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    try {
      // First, check ticket availability
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', bookingData.ticket_id)
        .single();

      if (ticketError) throw ticketError;

      if (ticket.quantity_available < bookingData.quantity) {
        return { success: false, error: 'Not enough tickets available' };
      }

      // Generate booking reference
      const bookingReference = `BK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      // Generate QR code (simplified - in production, use a proper QR library)
      const qrCode = `QR${bookingReference}`;

      const booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'> = {
        ticket_id: bookingData.ticket_id,
        event_id: ticket.event_id,
        buyer_id: bookingData.buyer_id,
        quantity: bookingData.quantity,
        total_amount: ticket.price * bookingData.quantity,
        currency: ticket.currency,
        status: 'pending',
        booking_reference: bookingReference,
        attendee_details: [],
        payment_intent_id: bookingData.payment_intent_id,
        payment_status: 'pending',
        booking_date: new Date().toISOString(),
        event_date: ticket.event_start_date,
        qr_code: qrCode,
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert(booking)
        .select()
        .single();

      if (error) throw error;

      // Add attendee details
      const attendeeDetails = bookingData.attendee_details.map(detail => ({
        ...detail,
        booking_id: data.id,
      }));

      const { error: attendeesError } = await supabase
        .from('attendee_details')
        .insert(attendeeDetails);

      if (attendeesError) throw attendeesError;

      // Update ticket availability
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          quantity_available: ticket.quantity_available - bookingData.quantity,
          quantity_sold: ticket.quantity_sold + bookingData.quantity,
        })
        .eq('id', bookingData.ticket_id);

      if (updateError) throw updateError;

      return { success: true, booking: data as Booking };
    } catch (error: any) {
      console.error('Error creating booking:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's bookings
   */
  static async getUserBookings(userId: string): Promise<{ success: boolean; bookings?: Booking[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          attendee_details (*),
          tickets (
            title,
            description,
            event_start_date,
            event_end_date,
            venue_name,
            venue_address
          )
        `)
        .eq('buyer_id', userId)
        .order('booking_date', { ascending: false });

      if (error) throw error;

      return { success: true, bookings: data as Booking[] };
    } catch (error: any) {
      console.error('Error fetching user bookings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get booking by reference
   */
  static async getBookingByReference(reference: string): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          attendee_details (*),
          tickets (
            title,
            description,
            event_start_date,
            event_end_date,
            venue_name,
            venue_address
          )
        `)
        .eq('booking_reference', reference)
        .single();

      if (error) throw error;

      return { success: true, booking: data as Booking };
    } catch (error: any) {
      console.error('Error fetching booking:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check in attendee
   */
  static async checkInAttendee(bookingId: string, attendeeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('attendee_details')
        .update({ 
          check_in_time: new Date().toISOString(),
          checked_in: true 
        })
        .eq('booking_id', bookingId)
        .eq('id', attendeeId);

      if (error) throw error;

      // Check if all attendees are checked in
      const { data: attendees, error: attendeesError } = await supabase
        .from('attendee_details')
        .select('checked_in')
        .eq('booking_id', bookingId);

      if (attendeesError) throw attendeesError;

      const allCheckedIn = attendees.every(attendee => attendee.checked_in);

      if (allCheckedIn) {
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ 
            status: 'attended',
            check_in_time: new Date().toISOString()
          })
          .eq('id', bookingId);

        if (bookingError) throw bookingError;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error checking in attendee:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel booking
   */
  static async cancelBooking(bookingId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancellation_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      // Return tickets to availability
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({
          quantity_available: supabase.raw('quantity_available + ?', [booking.quantity]),
          quantity_sold: supabase.raw('quantity_sold - ?', [booking.quantity]),
        })
        .eq('id', booking.ticket_id);

      if (ticketError) throw ticketError;

      return { success: true };
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process refund
   */
  static async processRefund(bookingId: string, refundAmount?: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          status: 'refunded',
          payment_status: 'refunded',
          refund_amount: refundAmount || booking.total_amount,
          refund_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error: any) {
      console.error('Error processing refund:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get event analytics
   */
  static async getEventAnalytics(eventId: string): Promise<{ success: boolean; analytics?: any; error?: string }> {
    try {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('event_id', eventId);

      if (bookingsError) throw bookingsError;

      const analytics = {
        total_bookings: bookings.length,
        total_revenue: bookings.reduce((sum, booking) => sum + booking.total_amount, 0),
        attendance_rate: bookings.filter(b => b.status === 'attended').length / bookings.length,
        cancellation_rate: bookings.filter(b => b.status === 'cancelled').length / bookings.length,
        check_in_rate: bookings.filter(b => b.check_in_time).length / bookings.length,
      };

      return { success: true, analytics };
    } catch (error: any) {
      console.error('Error fetching event analytics:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search events
   */
  static async searchEvents(searchParams: {
    query?: string;
    category?: string;
    location?: string;
    date_from?: string;
    date_to?: string;
    price_min?: number;
    price_max?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; events?: Event[]; error?: string }> {
    try {
      let query = supabase
        .from('events')
        .select('*')
        .eq('status', 'published');

      if (searchParams.query) {
        query = query.or(`title.ilike.%${searchParams.query}%,description.ilike.%${searchParams.query}%`);
      }

      if (searchParams.category) {
        query = query.eq('category', searchParams.category);
      }

      if (searchParams.location) {
        query = query.ilike('venue_address', `%${searchParams.location}%`);
      }

      if (searchParams.date_from) {
        query = query.gte('start_date', searchParams.date_from);
      }

      if (searchParams.date_to) {
        query = query.lte('start_date', searchParams.date_to);
      }

      query = query
        .order('start_date', { ascending: true })
        .range(searchParams.offset || 0, (searchParams.offset || 0) + (searchParams.limit || 20) - 1);

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, events: data as Event[] };
    } catch (error: any) {
      console.error('Error searching events:', error);
      return { success: false, error: error.message };
    }
  }
}
