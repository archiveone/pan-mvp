import { supabase } from '../lib/supabase';

export interface RentalItem {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  category: 'vehicle' | 'equipment' | 'property' | 'clothing' | 'electronics' | 'tools' | 'other';
  subcategory: string;
  daily_rate: number;
  hourly_rate?: number;
  weekly_rate?: number;
  monthly_rate?: number;
  currency: string;
  location: string;
  latitude?: number;
  longitude?: number;
  availability_start: string;
  availability_end: string;
  minimum_rental_period: number; // in hours
  maximum_rental_period: number; // in hours
  security_deposit: number;
  insurance_required: boolean;
  insurance_amount?: number;
  age_restriction?: number;
  license_required?: string;
  delivery_available: boolean;
  delivery_fee?: number;
  delivery_radius?: number;
  pickup_required: boolean;
  images: string[];
  features: string[];
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  maintenance_schedule?: string;
  last_maintenance?: string;
  next_maintenance?: string;
  status: 'available' | 'rented' | 'maintenance' | 'unavailable';
  created_at: string;
  updated_at: string;
}

export interface RentalBooking {
  id: string;
  rental_item_id: string;
  renter_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  pickup_time?: string;
  return_time?: string;
  total_days: number;
  total_hours: number;
  daily_rate: number;
  hourly_rate?: number;
  subtotal: number;
  delivery_fee?: number;
  insurance_fee?: number;
  security_deposit: number;
  total_amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'disputed';
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded';
  payment_intent_id?: string;
  booking_reference: string;
  renter_notes?: string;
  owner_notes?: string;
  delivery_address?: string;
  pickup_address?: string;
  contact_phone: string;
  contact_email: string;
  emergency_contact?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  driver_license_number?: string;
  driver_license_expiry?: string;
  actual_pickup_time?: string;
  actual_return_time?: string;
  condition_at_pickup?: 'excellent' | 'good' | 'fair' | 'poor';
  condition_at_return?: 'excellent' | 'good' | 'fair' | 'poor';
  damage_report?: string;
  damage_photos?: string[];
  refund_amount?: number;
  refund_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface RentalReview {
  id: string;
  rental_booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  reviewer_type: 'renter' | 'owner';
  rating: number; // 1-5
  title: string;
  comment: string;
  categories: {
    communication: number;
    item_condition: number;
    value_for_money: number;
    cleanliness?: number;
    reliability?: number;
  };
  is_public: boolean;
  created_at: string;
}

export class RentalService {
  /**
   * Create a rental item
   */
  static async createRentalItem(itemData: Omit<RentalItem, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; item?: RentalItem; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('rental_items')
        .insert(itemData)
        .select()
        .single();

      if (error) throw error;

      return { success: true, item: data as RentalItem };
    } catch (error: any) {
      console.error('Error creating rental item:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search rental items
   */
  static async searchRentalItems(searchParams: {
    query?: string;
    category?: string;
    location?: string;
    date_from?: string;
    date_to?: string;
    price_min?: number;
    price_max?: number;
    features?: string[];
    availability?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; items?: RentalItem[]; error?: string }> {
    try {
      let query = supabase
        .from('rental_items')
        .select('*')
        .eq('status', 'available');

      if (searchParams.query) {
        query = query.or(`title.ilike.%${searchParams.query}%,description.ilike.%${searchParams.query}%`);
      }

      if (searchParams.category) {
        query = query.eq('category', searchParams.category);
      }

      if (searchParams.location) {
        query = query.ilike('location', `%${searchParams.location}%`);
      }

      if (searchParams.price_min) {
        query = query.gte('daily_rate', searchParams.price_min);
      }

      if (searchParams.price_max) {
        query = query.lte('daily_rate', searchParams.price_max);
      }

      if (searchParams.availability && searchParams.date_from && searchParams.date_to) {
        // Check availability
        query = query
          .lte('availability_start', searchParams.date_from)
          .gte('availability_end', searchParams.date_to);
      }

      query = query
        .order('daily_rate', { ascending: true })
        .range(searchParams.offset || 0, (searchParams.offset || 0) + (searchParams.limit || 20) - 1);

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, items: data as RentalItem[] };
    } catch (error: any) {
      console.error('Error searching rental items:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check availability
   */
  static async checkAvailability(
    itemId: string,
    startDate: string,
    endDate: string
  ): Promise<{ success: boolean; available?: boolean; conflicting_bookings?: any[]; error?: string }> {
    try {
      // Check if item is available for the date range
      const { data: item, error: itemError } = await supabase
        .from('rental_items')
        .select('availability_start, availability_end, status')
        .eq('id', itemId)
        .single();

      if (itemError) throw itemError;

      if (item.status !== 'available') {
        return { success: true, available: false };
      }

      // Check if requested dates are within availability window
      if (startDate < item.availability_start || endDate > item.availability_end) {
        return { success: true, available: false };
      }

      // Check for conflicting bookings
      const { data: conflicts, error: conflictsError } = await supabase
        .from('rental_bookings')
        .select('*')
        .eq('rental_item_id', itemId)
        .in('status', ['confirmed', 'active'])
        .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

      if (conflictsError) throw conflictsError;

      return { 
        success: true, 
        available: conflicts.length === 0,
        conflicting_bookings: conflicts 
      };
    } catch (error: any) {
      console.error('Error checking availability:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create rental booking
   */
  static async createRentalBooking(bookingData: {
    rental_item_id: string;
    renter_id: string;
    start_date: string;
    end_date: string;
    pickup_time?: string;
    return_time?: string;
    delivery_address?: string;
    pickup_address?: string;
    contact_phone: string;
    contact_email: string;
    emergency_contact?: string;
    insurance_provider?: string;
    insurance_policy_number?: string;
    driver_license_number?: string;
    driver_license_expiry?: string;
    renter_notes?: string;
    payment_intent_id?: string;
  }): Promise<{ success: boolean; booking?: RentalBooking; error?: string }> {
    try {
      // First, check availability
      const availabilityCheck = await this.checkAvailability(
        bookingData.rental_item_id,
        bookingData.start_date,
        bookingData.end_date
      );

      if (!availabilityCheck.success) {
        return { success: false, error: availabilityCheck.error };
      }

      if (!availabilityCheck.available) {
        return { success: false, error: 'Item is not available for the selected dates' };
      }

      // Get rental item details
      const { data: item, error: itemError } = await supabase
        .from('rental_items')
        .select('*')
        .eq('id', bookingData.rental_item_id)
        .single();

      if (itemError) throw itemError;

      // Calculate rental duration and costs
      const startDate = new Date(bookingData.start_date);
      const endDate = new Date(bookingData.end_date);
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalHours = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));

      let subtotal = 0;
      if (totalDays >= 30 && item.monthly_rate) {
        subtotal = item.monthly_rate * Math.floor(totalDays / 30);
        const remainingDays = totalDays % 30;
        if (remainingDays > 0) {
          subtotal += item.daily_rate * remainingDays;
        }
      } else if (totalDays >= 7 && item.weekly_rate) {
        subtotal = item.weekly_rate * Math.floor(totalDays / 7);
        const remainingDays = totalDays % 7;
        if (remainingDays > 0) {
          subtotal += item.daily_rate * remainingDays;
        }
      } else {
        subtotal = item.daily_rate * totalDays;
      }

      const deliveryFee = bookingData.delivery_address && item.delivery_available ? item.delivery_fee || 0 : 0;
      const insuranceFee = item.insurance_required ? item.insurance_amount || 0 : 0;
      const totalAmount = subtotal + deliveryFee + insuranceFee;

      // Generate booking reference
      const bookingReference = `RB${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      const booking: Omit<RentalBooking, 'id' | 'created_at' | 'updated_at'> = {
        rental_item_id: bookingData.rental_item_id,
        renter_id: bookingData.renter_id,
        owner_id: item.owner_id,
        start_date: bookingData.start_date,
        end_date: bookingData.end_date,
        pickup_time: bookingData.pickup_time,
        return_time: bookingData.return_time,
        total_days: totalDays,
        total_hours: totalHours,
        daily_rate: item.daily_rate,
        hourly_rate: item.hourly_rate,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        insurance_fee: insuranceFee,
        security_deposit: item.security_deposit,
        total_amount: totalAmount,
        currency: item.currency,
        status: 'pending',
        payment_status: 'pending',
        payment_intent_id: bookingData.payment_intent_id,
        booking_reference: bookingReference,
        renter_notes: bookingData.renter_notes,
        delivery_address: bookingData.delivery_address,
        pickup_address: bookingData.pickup_address,
        contact_phone: bookingData.contact_phone,
        contact_email: bookingData.contact_email,
        emergency_contact: bookingData.emergency_contact,
        insurance_provider: bookingData.insurance_provider,
        insurance_policy_number: bookingData.insurance_policy_number,
        driver_license_number: bookingData.driver_license_number,
        driver_license_expiry: bookingData.driver_license_expiry,
      };

      const { data, error } = await supabase
        .from('rental_bookings')
        .insert(booking)
        .select()
        .single();

      if (error) throw error;

      return { success: true, booking: data as RentalBooking };
    } catch (error: any) {
      console.error('Error creating rental booking:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's rental bookings
   */
  static async getUserRentalBookings(userId: string, type: 'renter' | 'owner' | 'all' = 'all'): Promise<{ success: boolean; bookings?: RentalBooking[]; error?: string }> {
    try {
      let query = supabase
        .from('rental_bookings')
        .select(`
          *,
          rental_items (
            title,
            description,
            images,
            category,
            location
          )
        `);

      if (type === 'renter') {
        query = query.eq('renter_id', userId);
      } else if (type === 'owner') {
        query = query.eq('owner_id', userId);
      } else {
        query = query.or(`renter_id.eq.${userId},owner_id.eq.${userId}`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, bookings: data as RentalBooking[] };
    } catch (error: any) {
      console.error('Error fetching rental bookings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update rental booking status
   */
  static async updateRentalBookingStatus(
    bookingId: string,
    status: RentalBooking['status'],
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (notes) {
        if (status === 'active') {
          updateData.owner_notes = notes;
        } else {
          updateData.renter_notes = notes;
        }
      }

      const { error } = await supabase
        .from('rental_bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error updating rental booking status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete rental (return item)
   */
  static async completeRental(
    bookingId: string,
    returnData: {
      actual_return_time?: string;
      condition_at_return?: 'excellent' | 'good' | 'fair' | 'poor';
      damage_report?: string;
      damage_photos?: string[];
      owner_notes?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData = {
        status: 'completed' as const,
        actual_return_time: returnData.actual_return_time || new Date().toISOString(),
        condition_at_return: returnData.condition_at_return,
        damage_report: returnData.damage_report,
        damage_photos: returnData.damage_photos,
        owner_notes: returnData.owner_notes,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('rental_bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      // Update rental item status back to available
      const { data: booking, error: bookingError } = await supabase
        .from('rental_bookings')
        .select('rental_item_id')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      const { error: itemError } = await supabase
        .from('rental_items')
        .update({ status: 'available' })
        .eq('id', booking.rental_item_id);

      if (itemError) throw itemError;

      return { success: true };
    } catch (error: any) {
      console.error('Error completing rental:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel rental booking
   */
  static async cancelRentalBooking(
    bookingId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('rental_bookings')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Update rental item status back to available
      const { data: booking, error: bookingError } = await supabase
        .from('rental_bookings')
        .select('rental_item_id')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      const { error: itemError } = await supabase
        .from('rental_items')
        .update({ status: 'available' })
        .eq('id', booking.rental_item_id);

      if (itemError) throw itemError;

      return { success: true };
    } catch (error: any) {
      console.error('Error cancelling rental booking:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create rental review
   */
  static async createRentalReview(
    reviewData: Omit<RentalReview, 'id' | 'created_at'>
  ): Promise<{ success: boolean; review?: RentalReview; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('rental_reviews')
        .insert(reviewData)
        .select()
        .single();

      if (error) throw error;

      return { success: true, review: data as RentalReview };
    } catch (error: any) {
      console.error('Error creating rental review:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get rental item reviews
   */
  static async getRentalItemReviews(itemId: string): Promise<{ success: boolean; reviews?: RentalReview[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('rental_reviews')
        .select(`
          *,
          reviewer:profiles!rental_reviews_reviewer_id_fkey(name, avatar_url)
        `)
        .eq('rental_item_id', itemId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, reviews: data as RentalReview[] };
    } catch (error: any) {
      console.error('Error fetching rental reviews:', error);
      return { success: false, error: error.message };
    }
  }
}
