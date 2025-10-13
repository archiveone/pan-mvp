import { supabase } from '../lib/supabase';

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category: 'event_ticket' | 'rental_item' | 'product' | 'service' | 'experience';
  subcategory: string;
  listing_type: 'instant_buy' | 'auction' | 'reservation' | 'subscription';
  price: number;
  currency: string;
  original_price?: number;
  discount_percentage?: number;
  quantity_available: number;
  quantity_sold: number;
  minimum_order: number;
  maximum_order: number;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  images: string[];
  videos?: string[];
  features: string[];
  specifications?: Record<string, any>;
  tags: string[];
  location: string;
  latitude?: number;
  longitude?: number;
  delivery_available: boolean;
  delivery_fee?: number;
  delivery_methods: ('pickup' | 'shipping' | 'local_delivery' | 'digital')[];
  shipping_info?: {
    weight?: number;
    dimensions?: { length: number; width: number; height: number };
    shipping_zones?: string[];
    estimated_delivery?: string;
  };
  availability_start?: string;
  availability_end?: string;
  booking_required: boolean;
  advance_booking_days?: number;
  cancellation_policy: 'no_refund' | 'full_refund_24h' | 'full_refund_7d' | 'partial_refund_14d' | 'custom';
  custom_cancellation_policy?: string;
  return_policy: 'no_returns' | '30_day_return' | '14_day_return' | 'custom';
  custom_return_policy?: string;
  warranty_info?: string;
  age_restriction?: number;
  license_required?: string;
  insurance_required?: boolean;
  insurance_amount?: number;
  tax_included: boolean;
  tax_rate?: number;
  status: 'draft' | 'active' | 'paused' | 'sold_out' | 'expired' | 'cancelled';
  featured: boolean;
  promoted: boolean;
  promotion_end?: string;
  views_count: number;
  favorites_count: number;
  rating_average?: number;
  rating_count?: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface MarketplaceOrder {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  order_number: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  delivery_fee?: number;
  insurance_fee?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'disputed';
  payment_status: 'pending' | 'paid' | 'partial' | 'failed' | 'refunded';
  payment_method: 'card' | 'bank_transfer' | 'digital_wallet' | 'cash_on_delivery' | 'crypto';
  payment_intent_id?: string;
  delivery_method: 'pickup' | 'shipping' | 'local_delivery' | 'digital';
  delivery_address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    instructions?: string;
  };
  pickup_address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    instructions?: string;
  };
  tracking_number?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  customer_notes?: string;
  seller_notes?: string;
  order_date: string;
  confirmed_date?: string;
  shipped_date?: string;
  delivered_date?: string;
  cancelled_date?: string;
  cancellation_reason?: string;
  refund_amount?: number;
  refund_reason?: string;
  refund_date?: string;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceReview {
  id: string;
  order_id: string;
  reviewer_id: string;
  reviewee_id: string;
  reviewer_type: 'buyer' | 'seller';
  listing_id: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  categories: {
    quality: number;
    value: number;
    communication: number;
    delivery?: number;
    service?: number;
  };
  images?: string[];
  is_public: boolean;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
}

export interface MarketplaceMessage {
  id: string;
  order_id?: string;
  listing_id?: string;
  sender_id: string;
  recipient_id: string;
  message_type: 'inquiry' | 'negotiation' | 'support' | 'update';
  subject: string;
  content: string;
  attachments?: string[];
  is_read: boolean;
  read_at?: string;
  is_system_message: boolean;
  created_at: string;
}

export interface MarketplaceAnalytics {
  total_listings: number;
  total_sales: number;
  total_revenue: number;
  average_order_value: number;
  conversion_rate: number;
  top_categories: { category: string; count: number; revenue: number }[];
  monthly_sales: { month: string; sales: number; revenue: number }[];
  customer_satisfaction: number;
  return_rate: number;
}

export class MarketplaceService {
  /**
   * Create marketplace listing
   */
  static async createListing(listingData: Omit<MarketplaceListing, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; listing?: MarketplaceListing; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .insert(listingData)
        .select()
        .single();

      if (error) throw error;

      return { success: true, listing: data as MarketplaceListing };
    } catch (error: any) {
      console.error('Error creating marketplace listing:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search marketplace listings
   */
  static async searchListings(searchParams: {
    query?: string;
    category?: string;
    subcategory?: string;
    listing_type?: string;
    location?: string;
    price_min?: number;
    price_max?: number;
    condition?: string;
    delivery_method?: string;
    availability_start?: string;
    availability_end?: string;
    tags?: string[];
    featured?: boolean;
    rating_min?: number;
    sort_by?: 'price_asc' | 'price_desc' | 'newest' | 'oldest' | 'rating' | 'popularity';
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; listings?: MarketplaceListing[]; error?: string }> {
    try {
      let query = supabase
        .from('marketplace_listings')
        .select('*')
        .eq('status', 'active')
        .gt('quantity_available', 0);

      if (searchParams.query) {
        query = query.or(`title.ilike.%${searchParams.query}%,description.ilike.%${searchParams.query}%,tags.cs.{${searchParams.query}}`);
      }

      if (searchParams.category) {
        query = query.eq('category', searchParams.category);
      }

      if (searchParams.subcategory) {
        query = query.eq('subcategory', searchParams.subcategory);
      }

      if (searchParams.listing_type) {
        query = query.eq('listing_type', searchParams.listing_type);
      }

      if (searchParams.location) {
        query = query.ilike('location', `%${searchParams.location}%`);
      }

      if (searchParams.price_min) {
        query = query.gte('price', searchParams.price_min);
      }

      if (searchParams.price_max) {
        query = query.lte('price', searchParams.price_max);
      }

      if (searchParams.condition) {
        query = query.eq('condition', searchParams.condition);
      }

      if (searchParams.delivery_method) {
        query = query.contains('delivery_methods', [searchParams.delivery_method]);
      }

      if (searchParams.featured) {
        query = query.eq('featured', true);
      }

      if (searchParams.rating_min) {
        query = query.gte('rating_average', searchParams.rating_min);
      }

      if (searchParams.availability_start && searchParams.availability_end) {
        query = query
          .lte('availability_start', searchParams.availability_end)
          .gte('availability_end', searchParams.availability_start);
      }

      // Sorting
      switch (searchParams.sort_by) {
        case 'price_asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'rating':
          query = query.order('rating_average', { ascending: false });
          break;
        case 'popularity':
          query = query.order('views_count', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      query = query.range(
        searchParams.offset || 0,
        (searchParams.offset || 0) + (searchParams.limit || 20) - 1
      );

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, listings: data as MarketplaceListing[] };
    } catch (error: any) {
      console.error('Error searching marketplace listings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get listing details
   */
  static async getListing(listingId: string): Promise<{ success: boolean; listing?: MarketplaceListing; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select(`
          *,
          seller:profiles!marketplace_listings_seller_id_fkey(
            id,
            name,
            avatar_url,
            rating_average,
            rating_count
          )
        `)
        .eq('id', listingId)
        .single();

      if (error) throw error;

      // Increment view count
      await supabase
        .from('marketplace_listings')
        .update({ views_count: supabase.raw('views_count + 1') })
        .eq('id', listingId);

      return { success: true, listing: data as MarketplaceListing };
    } catch (error: any) {
      console.error('Error fetching listing:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create marketplace order
   */
  static async createOrder(orderData: {
    buyer_id: string;
    listing_id: string;
    quantity: number;
    delivery_method: 'pickup' | 'shipping' | 'local_delivery' | 'digital';
    delivery_address?: any;
    pickup_address?: any;
    customer_notes?: string;
    payment_intent_id?: string;
  }): Promise<{ success: boolean; order?: MarketplaceOrder; error?: string }> {
    try {
      // Get listing details
      const { data: listing, error: listingError } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('id', orderData.listing_id)
        .single();

      if (listingError) throw listingError;

      // Check availability
      if (listing.quantity_available < orderData.quantity) {
        return { success: false, error: 'Not enough quantity available' };
      }

      // Check minimum/maximum order requirements
      if (orderData.quantity < listing.minimum_order) {
        return { success: false, error: `Minimum order quantity is ${listing.minimum_order}` };
      }

      if (orderData.quantity > listing.maximum_order) {
        return { success: false, error: `Maximum order quantity is ${listing.maximum_order}` };
      }

      // Calculate pricing
      const unitPrice = listing.price;
      const subtotal = unitPrice * orderData.quantity;
      const deliveryFee = orderData.delivery_method !== 'pickup' && listing.delivery_fee ? listing.delivery_fee : 0;
      const insuranceFee = listing.insurance_required && listing.insurance_amount ? listing.insurance_amount : 0;
      const taxAmount = listing.tax_included ? 0 : (subtotal + deliveryFee + insuranceFee) * (listing.tax_rate || 0);
      const totalAmount = subtotal + deliveryFee + insuranceFee + taxAmount;

      // Generate order number
      const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const order: Omit<MarketplaceOrder, 'id' | 'created_at' | 'updated_at'> = {
        buyer_id: orderData.buyer_id,
        seller_id: listing.seller_id,
        listing_id: orderData.listing_id,
        order_number: orderNumber,
        quantity: orderData.quantity,
        unit_price: unitPrice,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        insurance_fee: insuranceFee,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        currency: listing.currency,
        status: 'pending',
        payment_status: 'pending',
        payment_method: 'card', // Default, can be updated
        payment_intent_id: orderData.payment_intent_id,
        delivery_method: orderData.delivery_method,
        delivery_address: orderData.delivery_address,
        pickup_address: orderData.pickup_address,
        customer_notes: orderData.customer_notes,
        order_date: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('marketplace_orders')
        .insert(order)
        .select()
        .single();

      if (error) throw error;

      // Update listing quantity
      const { error: updateError } = await supabase
        .from('marketplace_listings')
        .update({
          quantity_available: listing.quantity_available - orderData.quantity,
          quantity_sold: listing.quantity_sold + orderData.quantity,
        })
        .eq('id', orderData.listing_id);

      if (updateError) throw updateError;

      return { success: true, order: data as MarketplaceOrder };
    } catch (error: any) {
      console.error('Error creating marketplace order:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user orders
   */
  static async getUserOrders(userId: string, type: 'buyer' | 'seller' | 'all' = 'all'): Promise<{ success: boolean; orders?: MarketplaceOrder[]; error?: string }> {
    try {
      let query = supabase
        .from('marketplace_orders')
        .select(`
          *,
          listing:marketplace_listings(
            title,
            images,
            category,
            condition
          ),
          buyer:profiles!marketplace_orders_buyer_id_fkey(name, avatar_url),
          seller:profiles!marketplace_orders_seller_id_fkey(name, avatar_url)
        `);

      if (type === 'buyer') {
        query = query.eq('buyer_id', userId);
      } else if (type === 'seller') {
        query = query.eq('seller_id', userId);
      } else {
        query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, orders: data as MarketplaceOrder[] };
    } catch (error: any) {
      console.error('Error fetching user orders:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    orderId: string,
    status: MarketplaceOrder['status'],
    notes?: string,
    trackingNumber?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (notes) {
        updateData.seller_notes = notes;
      }

      if (trackingNumber) {
        updateData.tracking_number = trackingNumber;
      }

      // Set specific dates based on status
      switch (status) {
        case 'confirmed':
          updateData.confirmed_date = new Date().toISOString();
          break;
        case 'shipped':
          updateData.shipped_date = new Date().toISOString();
          break;
        case 'delivered':
          updateData.delivered_date = new Date().toISOString();
          break;
        case 'cancelled':
          updateData.cancelled_date = new Date().toISOString();
          break;
      }

      const { error } = await supabase
        .from('marketplace_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error updating order status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(
    orderId: string,
    reason: string,
    refundAmount?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: order, error: orderError } = await supabase
        .from('marketplace_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Update order
      const { error: updateError } = await supabase
        .from('marketplace_orders')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          cancelled_date: new Date().toISOString(),
          refund_amount: refundAmount || order.total_amount,
          refund_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Return quantity to listing
      const { error: listingError } = await supabase
        .from('marketplace_listings')
        .update({
          quantity_available: supabase.raw('quantity_available + ?', [order.quantity]),
          quantity_sold: supabase.raw('quantity_sold - ?', [order.quantity]),
        })
        .eq('id', order.listing_id);

      if (listingError) throw listingError;

      return { success: true };
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create marketplace review
   */
  static async createReview(
    reviewData: Omit<MarketplaceReview, 'id' | 'created_at'>
  ): Promise<{ success: boolean; review?: MarketplaceReview; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('marketplace_reviews')
        .insert(reviewData)
        .select()
        .single();

      if (error) throw error;

      // Update listing rating
      const { data: listing, error: listingError } = await supabase
        .from('marketplace_listings')
        .select('rating_average, rating_count')
        .eq('id', reviewData.listing_id)
        .single();

      if (!listingError && listing) {
        const newRatingCount = listing.rating_count + 1;
        const newRatingAverage = ((listing.rating_average * listing.rating_count) + reviewData.rating) / newRatingCount;

        await supabase
          .from('marketplace_listings')
          .update({
            rating_average: newRatingAverage,
            rating_count: newRatingCount,
          })
          .eq('id', reviewData.listing_id);
      }

      return { success: true, review: data as MarketplaceReview };
    } catch (error: any) {
      console.error('Error creating marketplace review:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send marketplace message
   */
  static async sendMessage(
    messageData: Omit<MarketplaceMessage, 'id' | 'created_at'>
  ): Promise<{ success: boolean; message?: MarketplaceMessage; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('marketplace_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      return { success: true, message: data as MarketplaceMessage };
    } catch (error: any) {
      console.error('Error sending marketplace message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get marketplace analytics
   */
  static async getMarketplaceAnalytics(sellerId: string): Promise<{ success: boolean; analytics?: MarketplaceAnalytics; error?: string }> {
    try {
      const { data: orders, error: ordersError } = await supabase
        .from('marketplace_orders')
        .select('*')
        .eq('seller_id', sellerId);

      if (ordersError) throw ordersError;

      const { data: listings, error: listingsError } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('seller_id', sellerId);

      if (listingsError) throw listingsError;

      const analytics: MarketplaceAnalytics = {
        total_listings: listings.length,
        total_sales: orders.filter(o => o.status === 'delivered').length,
        total_revenue: orders
          .filter(o => o.status === 'delivered')
          .reduce((sum, order) => sum + order.total_amount, 0),
        average_order_value: orders.length > 0 
          ? orders.reduce((sum, order) => sum + order.total_amount, 0) / orders.length 
          : 0,
        conversion_rate: orders.length > 0 ? (orders.length / listings.reduce((sum, l) => sum + l.views_count, 0)) * 100 : 0,
        top_categories: [],
        monthly_sales: [],
        customer_satisfaction: 0,
        return_rate: 0,
      };

      return { success: true, analytics };
    } catch (error: any) {
      console.error('Error fetching marketplace analytics:', error);
      return { success: false, error: error.message };
    }
  }
}
