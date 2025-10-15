import { supabase } from './supabaseClient';
import type {
  ReservationBusiness,
  ReservationResource,
  ReservationStaff,
  ReservationService,
  Reservation,
  ReservationBlock,
  ReservationWaitlist,
  ReservationReview,
  CreateBusinessRequest,
  CreateResourceRequest,
  CreateStaffRequest,
  CreateServiceRequest,
  CreateReservationRequest,
  AvailabilityQuery,
  AvailabilitySlot,
  ReservationFilters
} from '../types/reservations';

export class ReservationService {
  // ============= BUSINESSES =============
  
  /**
   * Create a reservation business (restaurant, salon, etc.)
   * Automatically initializes with default operating hours!
   */
  static async createBusiness(
    ownerId: string,
    data: CreateBusinessRequest
  ): Promise<ReservationBusiness> {
    const slug = data.business_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    const { data: business, error } = await supabase
      .from('reservation_businesses')
      .insert({
        owner_id: ownerId,
        slug,
        ...data
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Note: Operating hours are auto-initialized by database trigger!
    return business;
  }
  
  /**
   * Quick setup: Create business + default resources + service templates
   * Perfect for getting started fast!
   */
  static async quickSetupBusiness(
    ownerId: string,
    data: CreateBusinessRequest,
    options?: {
      createResources?: boolean;
      resourceCount?: number;
      addServiceTemplates?: boolean;
    }
  ): Promise<ReservationBusiness> {
    // Create business (auto-initializes operating hours)
    const business = await this.createBusiness(ownerId, data);
    
    // Optionally create default resources
    if (options?.createResources !== false) {
      await supabase.rpc('create_default_resources', {
        p_business_id: business.id,
        p_business_type: data.business_type,
        p_count: options?.resourceCount || 5
      });
    }
    
    // Optionally add service templates
    if (options?.addServiceTemplates !== false) {
      if (data.business_type === 'salon') {
        await supabase.rpc('add_salon_service_templates', {
          p_business_id: business.id
        });
      } else if (data.business_type === 'spa') {
        await supabase.rpc('add_spa_service_templates', {
          p_business_id: business.id
        });
      } else if (data.business_type === 'clinic') {
        await supabase.rpc('add_clinic_service_templates', {
          p_business_id: business.id
        });
      }
    }
    
    return business;
  }
  
  /**
   * Get all businesses
   */
  static async getBusinesses(filters?: {
    city?: string;
    business_type?: string;
    search?: string;
  }): Promise<ReservationBusiness[]> {
    let query = supabase
      .from('reservation_businesses')
      .select(`
        *,
        owner:profiles!owner_id(id, username, avatar_url)
      `)
      .eq('status', 'active');
    
    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    
    if (filters?.business_type) {
      query = query.eq('business_type', filters.business_type);
    }
    
    if (filters?.search) {
      query = query.or(`business_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    query = query.order('average_rating', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Get single business with full details
   */
  static async getBusiness(id: string): Promise<ReservationBusiness | null> {
    const { data, error } = await supabase
      .from('reservation_businesses')
      .select(`
        *,
        owner:profiles!owner_id(id, username, avatar_url),
        resources:reservation_resources(*),
        staff:reservation_staff(*),
        services:reservation_services(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Update business
   */
  static async updateBusiness(
    id: string,
    updates: Partial<ReservationBusiness>
  ): Promise<ReservationBusiness> {
    const { data, error } = await supabase
      .from('reservation_businesses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // ============= RESOURCES =============
  
  /**
   * Create a resource (table, room, etc.)
   */
  static async createResource(data: CreateResourceRequest): Promise<ReservationResource> {
    const { data: resource, error } = await supabase
      .from('reservation_resources')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return resource;
  }
  
  /**
   * Get resources for a business
   */
  static async getResources(businessId: string): Promise<ReservationResource[]> {
    const { data, error } = await supabase
      .from('reservation_resources')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Update resource
   */
  static async updateResource(
    id: string,
    updates: Partial<ReservationResource>
  ): Promise<ReservationResource> {
    const { data, error } = await supabase
      .from('reservation_resources')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // ============= STAFF =============
  
  /**
   * Create staff member
   */
  static async createStaff(data: CreateStaffRequest): Promise<ReservationStaff> {
    const { data: staff, error } = await supabase
      .from('reservation_staff')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return staff;
  }
  
  /**
   * Get staff for a business
   */
  static async getStaff(businessId: string): Promise<ReservationStaff[]> {
    const { data, error } = await supabase
      .from('reservation_staff')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Update staff member
   */
  static async updateStaff(
    id: string,
    updates: Partial<ReservationStaff>
  ): Promise<ReservationStaff> {
    const { data, error } = await supabase
      .from('reservation_staff')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // ============= SERVICES =============
  
  /**
   * Create a service
   */
  static async createService(data: CreateServiceRequest): Promise<ReservationService> {
    const { data: service, error } = await supabase
      .from('reservation_services')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return service;
  }
  
  /**
   * Get services for a business
   */
  static async getServices(businessId: string): Promise<ReservationService[]> {
    const { data, error } = await supabase
      .from('reservation_services')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
  
  // ============= AVAILABILITY =============
  
  /**
   * Check availability for a specific time slot
   */
  static async checkAvailability(query: AvailabilityQuery): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('check_reservation_availability', {
        p_business_id: query.business_id,
        p_resource_id: query.resource_id || null,
        p_staff_id: query.staff_id || null,
        p_date: query.date,
        p_start_time: query.duration_minutes ? 
          this.calculateEndTime(query.date, query.duration_minutes) : 
          null,
        p_end_time: null
      });
    
    if (error) throw error;
    return data || false;
  }
  
  /**
   * Get next available slots (uses database function for performance)
   */
  static async getNextAvailableSlots(
    businessId: string,
    partySize: number = 2,
    preferredDate?: string
  ): Promise<AvailabilitySlot[]> {
    const { data, error } = await supabase
      .rpc('get_next_available_slot', {
        p_business_id: businessId,
        p_party_size: partySize,
        p_preferred_date: preferredDate || new Date().toISOString().split('T')[0]
      });
    
    if (error) throw error;
    return (data || []).map((slot: any) => ({
      start_time: slot.available_time,
      end_time: '', // Will be calculated based on duration
      available: true,
      resource_id: slot.resource_id,
      staff_id: undefined
    }));
  }
  
  /**
   * Get available time slots for a date
   */
  static async getAvailableSlots(query: AvailabilityQuery): Promise<AvailabilitySlot[]> {
    // Get business operating hours
    const business = await this.getBusiness(query.business_id);
    if (!business) throw new Error('Business not found');
    
    const date = new Date(query.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const hours = business.operating_hours[dayName];
    
    if (!hours || hours.closed) {
      return [];
    }
    
    // Generate time slots (every 30 minutes by default)
    const slots: AvailabilitySlot[] = [];
    const duration = query.duration_minutes || 60;
    const [openHour, openMin] = hours.open.split(':').map(Number);
    const [closeHour, closeMin] = hours.close.split(':').map(Number);
    
    let currentMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    
    while (currentMinutes + duration <= closeMinutes) {
      const startHour = Math.floor(currentMinutes / 60);
      const startMin = currentMinutes % 60;
      const endMinutes = currentMinutes + duration;
      const endHour = Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;
      
      const startTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
      const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
      
      // Check if this slot is available
      const available = await this.checkAvailability({
        ...query,
        date: query.date,
        duration_minutes: duration
      });
      
      slots.push({
        start_time: startTime,
        end_time: endTime,
        available,
        resource_id: query.resource_id,
        staff_id: query.staff_id
      });
      
      currentMinutes += 30; // Move to next slot (30-minute intervals)
    }
    
    return slots;
  }
  
  // ============= RESERVATIONS =============
  
  /**
   * Create a reservation (auto-confirms if instant booking enabled)
   */
  static async createReservation(
    customerId: string | null,
    data: CreateReservationRequest
  ): Promise<Reservation> {
    // Calculate duration
    const start = new Date(`${data.reservation_date}T${data.start_time}`);
    const end = new Date(`${data.reservation_date}T${data.end_time}`);
    const duration_minutes = Math.floor((end.getTime() - start.getTime()) / 60000);
    
    const { data: reservation, error } = await supabase
      .from('reservations')
      .insert({
        customer_id: customerId,
        ...data,
        duration_minutes,
        status: 'pending' // Trigger may auto-confirm
      })
      .select()
      .single();
    
    if (error) throw error;
    return reservation;
  }
  
  /**
   * Quick booking (simplified - uses database function)
   * Perfect for simple reservations without resource selection
   */
  static async quickBook(
    businessId: string,
    customerName: string,
    customerPhone: string,
    customerEmail: string,
    date: string,
    time: string,
    partySize: number,
    durationMinutes: number = 120
  ): Promise<string> {
    const { data, error } = await supabase
      .rpc('quick_book_reservation', {
        p_business_id: businessId,
        p_customer_name: customerName,
        p_customer_phone: customerPhone,
        p_customer_email: customerEmail,
        p_date: date,
        p_time: time,
        p_party_size: partySize,
        p_duration_minutes: durationMinutes
      });
    
    if (error) throw error;
    return data; // Returns reservation ID
  }
  
  /**
   * Walk-in booking (instant seating)
   */
  static async createWalkIn(
    businessId: string,
    customerName: string,
    partySize: number,
    durationMinutes: number = 90
  ): Promise<string> {
    const { data, error } = await supabase
      .rpc('create_walk_in_booking', {
        p_business_id: businessId,
        p_customer_name: customerName,
        p_party_size: partySize,
        p_duration_minutes: durationMinutes
      });
    
    if (error) throw error;
    return data; // Returns reservation ID
  }
  
  /**
   * Get reservations with filters
   */
  static async getReservations(filters: ReservationFilters): Promise<Reservation[]> {
    let query = supabase
      .from('reservations')
      .select(`
        *,
        business:reservation_businesses(*),
        customer:profiles!customer_id(id, username, email),
        resource:reservation_resources(*),
        staff:reservation_staff(*),
        service_items:reservation_service_items(*)
      `);
    
    if (filters.business_id) {
      query = query.eq('business_id', filters.business_id);
    }
    
    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    
    if (filters.date_from) {
      query = query.gte('reservation_date', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.lte('reservation_date', filters.date_to);
    }
    
    if (filters.booking_type && filters.booking_type.length > 0) {
      query = query.in('booking_type', filters.booking_type);
    }
    
    query = query.order('reservation_date', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Get single reservation
   */
  static async getReservation(id: string): Promise<Reservation | null> {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        business:reservation_businesses(*),
        customer:profiles!customer_id(id, username, email),
        resource:reservation_resources(*),
        staff:reservation_staff(*),
        service_items:reservation_service_items(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Update reservation
   */
  static async updateReservation(
    id: string,
    updates: Partial<Reservation>
  ): Promise<Reservation> {
    const { data, error } = await supabase
      .from('reservations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Confirm reservation
   */
  static async confirmReservation(id: string): Promise<Reservation> {
    return this.updateReservation(id, { 
      status: 'confirmed',
      confirmation_sent: true
    });
  }
  
  /**
   * Cancel reservation
   */
  static async cancelReservation(
    id: string,
    cancelledBy: string,
    reason?: string
  ): Promise<Reservation> {
    return this.updateReservation(id, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy,
      cancellation_reason: reason
    });
  }
  
  /**
   * Mark as no-show
   */
  static async markNoShow(id: string, noShowFee: number = 0): Promise<Reservation> {
    return this.updateReservation(id, {
      status: 'no_show',
      no_show_fee: noShowFee
    });
  }
  
  /**
   * Check in customer
   */
  static async checkIn(id: string): Promise<Reservation> {
    return this.updateReservation(id, {
      status: 'seated',
      checked_in_at: new Date().toISOString(),
      actual_start_time: new Date().toISOString()
    });
  }
  
  /**
   * Complete reservation
   */
  static async completeReservation(id: string): Promise<Reservation> {
    return this.updateReservation(id, {
      status: 'completed',
      checked_out_at: new Date().toISOString(),
      actual_end_time: new Date().toISOString()
    });
  }
  
  // ============= BLOCKS =============
  
  /**
   * Create a time block
   */
  static async createBlock(data: Partial<ReservationBlock>): Promise<ReservationBlock> {
    const { data: block, error } = await supabase
      .from('reservation_blocks')
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    return block;
  }
  
  /**
   * Get blocks for a business/resource/staff
   */
  static async getBlocks(filters: {
    business_id?: string;
    resource_id?: string;
    staff_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<ReservationBlock[]> {
    let query = supabase
      .from('reservation_blocks')
      .select('*');
    
    if (filters.business_id) {
      query = query.eq('business_id', filters.business_id);
    }
    
    if (filters.resource_id) {
      query = query.eq('resource_id', filters.resource_id);
    }
    
    if (filters.staff_id) {
      query = query.eq('staff_id', filters.staff_id);
    }
    
    if (filters.start_date) {
      query = query.gte('start_datetime', filters.start_date);
    }
    
    if (filters.end_date) {
      query = query.lte('end_datetime', filters.end_date);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  
  // ============= WAITLIST =============
  
  /**
   * Add to waitlist
   */
  static async addToWaitlist(
    customerId: string | null,
    data: Partial<ReservationWaitlist>
  ): Promise<ReservationWaitlist> {
    const { data: waitlistEntry, error } = await supabase
      .from('reservation_waitlist')
      .insert({
        customer_id: customerId,
        ...data,
        status: 'waiting'
      })
      .select()
      .single();
    
    if (error) throw error;
    return waitlistEntry;
  }
  
  /**
   * Get waitlist for a business
   */
  static async getWaitlist(businessId: string): Promise<ReservationWaitlist[]> {
    const { data, error } = await supabase
      .from('reservation_waitlist')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', 'waiting')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
  
  // ============= REVIEWS =============
  
  /**
   * Create a review
   */
  static async createReview(
    customerId: string,
    data: Partial<ReservationReview>
  ): Promise<ReservationReview> {
    const { data: review, error } = await supabase
      .from('reservation_reviews')
      .insert({
        customer_id: customerId,
        ...data,
        is_published: true
      })
      .select()
      .single();
    
    if (error) throw error;
    return review;
  }
  
  /**
   * Get reviews for a business
   */
  static async getReviews(businessId: string): Promise<ReservationReview[]> {
    const { data, error } = await supabase
      .from('reservation_reviews')
      .select(`
        *,
        customer:profiles!customer_id(id, username, avatar_url)
      `)
      .eq('business_id', businessId)
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  // ============= ANALYTICS & DASHBOARDS =============
  
  /**
   * Get today's reservations for a business
   */
  static async getTodaysReservations(businessId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('todays_reservations')
      .select('*')
      .eq('business_id', businessId);
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Get business performance metrics
   */
  static async getBusinessPerformance(businessId: string, days: number = 30): Promise<any[]> {
    const { data, error } = await supabase
      .from('business_performance')
      .select('*')
      .eq('business_id', businessId)
      .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Get staff performance metrics
   */
  static async getStaffPerformance(businessId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('staff_performance')
      .select('*')
      .eq('business_id', businessId)
      .order('total_bookings', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  // ============= HELPER FUNCTIONS =============
  
  private static calculateEndTime(startTime: string, durationMinutes: number): string {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    return end.toTimeString().slice(0, 5);
  }
}

