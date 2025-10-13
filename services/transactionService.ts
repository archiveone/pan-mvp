import { supabase } from '@/lib/supabase'
import { 
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionFilters,
  TransactionAnalytics,
  TransactionCategory,
  TransactionSubtype,
  TransactionStatus,
  PaymentStatus
} from '@/types/transactions'

export class TransactionService {
  
  // ==================== TRANSACTION CRUD ====================
  
  /**
   * Create a new transaction
   */
  static async createTransaction(request: CreateTransactionRequest): Promise<{
    success: boolean;
    transaction?: Transaction;
    error?: string;
  }> {
    try {
      // Calculate total amount (base amount + tax + fees)
      const taxAmount = request.metadata?.tax_amount || 0
      const feeAmount = request.metadata?.fee_amount || 0
      const totalAmount = request.amount + taxAmount + feeAmount

      // Prepare transaction data
      const transactionData = {
        user_id: request.user_id,
        content_id: request.content_id,
        category: request.category,
        subtype: request.subtype,
        amount: request.amount,
        currency: request.currency,
        tax_amount: taxAmount,
        fee_amount: feeAmount,
        total_amount: totalAmount,
        description: request.description,
        metadata: request.metadata || {},
        status: 'pending' as TransactionStatus,
        payment_status: 'pending' as PaymentStatus,
        
        // Category-specific data based on subtype
        ...this.mapCategorySpecificData(request)
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactionData)
        .select()
        .single()

      if (error) throw error

      return { success: true, transaction: data as Transaction }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get transaction by ID
   */
  static async getTransaction(id: string): Promise<{
    success: boolean;
    transaction?: Transaction;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return { success: true, transaction: data as Transaction }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Update transaction
   */
  static async updateTransaction(id: string, request: UpdateTransactionRequest): Promise<{
    success: boolean;
    transaction?: Transaction;
    error?: string;
  }> {
    try {
      const updateData = {
        ...request,
        updated_at: new Date().toISOString(),
        completed_at: request.status === 'completed' ? new Date().toISOString() : undefined
      }

      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { success: true, transaction: data as Transaction }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get transactions with filters
   */
  static async getTransactions(filters: TransactionFilters = {}): Promise<{
    success: boolean;
    transactions?: Transaction[];
    total?: number;
    error?: string;
  }> {
    try {
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id)
      }

      if (filters.content_id) {
        query = query.eq('content_id', filters.content_id)
      }

      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.subtype) {
        query = query.eq('subtype', filters.subtype)
      }

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.payment_status) {
        query = query.eq('payment_status', filters.payment_status)
      }

      if (filters.fulfillment_status) {
        query = query.eq('fulfillment_status', filters.fulfillment_status)
      }

      if (filters.currency) {
        query = query.eq('currency', filters.currency)
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      if (filters.amount_min !== undefined) {
        query = query.gte('amount', filters.amount_min)
      }

      if (filters.amount_max !== undefined) {
        query = query.lte('amount', filters.amount_max)
      }

      // Apply pagination
      const limit = filters.limit || 20
      const offset = filters.offset || 0
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return { 
        success: true, 
        transactions: data as Transaction[], 
        total: count || 0 
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // ==================== CATEGORY-SPECIFIC METHODS ====================

  /**
   * Create ticketing transaction
   */
  static async createTicketingTransaction(
    userId: string,
    contentId: string,
    eventData: {
      event_date: string
      event_time: string
      venue: string
      ticket_quantity: number
      ticket_type?: string
      access_level?: string
    }
  ) {
    return this.createTransaction({
      user_id: userId,
      content_id: contentId,
      category: 'ticketing_attendance',
      subtype: 'event_ticket',
      amount: 0, // Will be set based on ticket pricing
      currency: 'EUR',
      description: `Event ticket for ${eventData.venue}`,
      ticketing_data: eventData
    })
  }

  /**
   * Create booking transaction
   */
  static async createBookingTransaction(
    userId: string,
    contentId: string,
    bookingData: {
      booking_date: string
      start_time: string
      end_time: string
      party_size?: number
      special_requests?: string
    }
  ) {
    return this.createTransaction({
      user_id: userId,
      content_id: contentId,
      category: 'bookings_reservations',
      subtype: 'appointment_booking',
      amount: 0, // Will be set based on service pricing
      currency: 'EUR',
      description: `Booking for ${bookingData.booking_date}`,
      booking_data: bookingData
    })
  }

  /**
   * Create purchase transaction
   */
  static async createPurchaseTransaction(
    userId: string,
    contentId: string,
    purchaseData: {
      quantity: number
      product_variant?: string
      shipping_address?: any
    }
  ) {
    return this.createTransaction({
      user_id: userId,
      content_id: contentId,
      category: 'purchases_ecommerce',
      subtype: 'physical_product',
      amount: 0, // Will be set based on product pricing
      currency: 'EUR',
      description: `Purchase of ${purchaseData.quantity} item(s)`,
      purchase_data: purchaseData
    })
  }

  /**
   * Create rental transaction
   */
  static async createRentalTransaction(
    userId: string,
    contentId: string,
    rentalData: {
      rental_start_date: string
      rental_end_date: string
      security_deposit?: number
      pickup_location?: string
    }
  ) {
    return this.createTransaction({
      user_id: userId,
      content_id: contentId,
      category: 'rentals_leases',
      subtype: 'equipment_rental',
      amount: 0, // Will be set based on rental pricing
      currency: 'EUR',
      description: `Rental from ${rentalData.rental_start_date} to ${rentalData.rental_end_date}`,
      rental_data: rentalData
    })
  }

  // ==================== PAYMENT INTEGRATION ====================

  /**
   * Update transaction with Stripe payment intent
   */
  static async updateWithStripePayment(
    transactionId: string,
    stripeData: {
      payment_intent_id?: string
      subscription_id?: string
      checkout_session_id?: string
      transfer_id?: string
      status: PaymentStatus
    }
  ) {
    return this.updateTransaction(transactionId, {
      stripe_payment_intent_id: stripeData.payment_intent_id,
      stripe_subscription_id: stripeData.subscription_id,
      stripe_checkout_session_id: stripeData.checkout_session_id,
      stripe_transfer_id: stripeData.transfer_id,
      payment_status: stripeData.status,
      status: stripeData.status === 'succeeded' ? 'completed' : 'processing'
    })
  }

  /**
   * Process refund
   */
  static async processRefund(
    transactionId: string,
    refundData: {
      refund_amount: number
      reason: string
      stripe_refund_id?: string
    }
  ) {
    return this.updateTransaction(transactionId, {
      status: 'refunded',
      metadata: {
        refund_amount: refundData.refund_amount,
        refund_reason: refundData.reason,
        stripe_refund_id: refundData.stripe_refund_id,
        refunded_at: new Date().toISOString()
      }
    })
  }

  // ==================== ANALYTICS ====================

  /**
   * Get transaction analytics
   */
  static async getAnalytics(filters: {
    user_id?: string
    content_id?: string
    date_from?: string
    date_to?: string
  } = {}): Promise<{
    success: boolean;
    analytics?: TransactionAnalytics;
    error?: string;
  }> {
    try {
      let query = supabase
        .from('transactions')
        .select('*')

      // Apply filters
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id)
      }

      if (filters.content_id) {
        query = query.eq('content_id', filters.content_id)
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      const { data, error } = await query

      if (error) throw error

      const transactions = data as Transaction[]

      // Calculate analytics
      const analytics: TransactionAnalytics = {
        total_transactions: transactions.length,
        total_revenue: transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0),
        average_transaction_value: 0,
        transactions_by_category: {} as Record<TransactionCategory, number>,
        transactions_by_status: {} as Record<TransactionStatus, number>,
        revenue_by_category: {} as Record<TransactionCategory, number>,
        conversion_rate: 0,
        refund_rate: 0,
        period: {
          start_date: filters.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: filters.date_to || new Date().toISOString()
        }
      }

      // Calculate derived metrics
      if (analytics.total_transactions > 0) {
        analytics.average_transaction_value = analytics.total_revenue / analytics.total_transactions
      }

      // Count by category and status
      transactions.forEach(transaction => {
        // By category
        const category = transaction.category as TransactionCategory
        analytics.transactions_by_category[category] = (analytics.transactions_by_category[category] || 0) + 1
        analytics.revenue_by_category[category] = (analytics.revenue_by_category[category] || 0) + (transaction.total_amount || 0)

        // By status
        const status = transaction.status as TransactionStatus
        analytics.transactions_by_status[status] = (analytics.transactions_by_status[status] || 0) + 1
      })

      // Calculate conversion and refund rates
      const completedTransactions = transactions.filter(t => t.status === 'completed').length
      const refundedTransactions = transactions.filter(t => t.status === 'refunded').length

      analytics.conversion_rate = analytics.total_transactions > 0 ? (completedTransactions / analytics.total_transactions) * 100 : 0
      analytics.refund_rate = analytics.total_transactions > 0 ? (refundedTransactions / analytics.total_transactions) * 100 : 0

      return { success: true, analytics }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Map category-specific data for database insertion
   */
  private static mapCategorySpecificData(request: CreateTransactionRequest): Record<string, any> {
    const baseData: Record<string, any> = {}

    switch (request.category) {
      case 'ticketing_attendance':
        if (request.ticketing_data) {
          Object.assign(baseData, request.ticketing_data)
        }
        break
      case 'bookings_reservations':
        if (request.booking_data) {
          Object.assign(baseData, request.booking_data)
        }
        break
      case 'purchases_ecommerce':
        if (request.purchase_data) {
          Object.assign(baseData, request.purchase_data)
        }
        break
      case 'digital_access_media':
        if (request.digital_access_data) {
          Object.assign(baseData, request.digital_access_data)
        }
        break
      case 'donations_crowdfunding':
        if (request.donation_data) {
          Object.assign(baseData, request.donation_data)
        }
        break
      case 'memberships_subscriptions':
        if (request.membership_data) {
          Object.assign(baseData, request.membership_data)
        }
        break
      case 'rentals_leases':
        if (request.rental_data) {
          Object.assign(baseData, request.rental_data)
        }
        break
      case 'free_trial_rsvp':
        if (request.free_data) {
          Object.assign(baseData, request.free_data)
        }
        break
      case 'hybrid_mixed':
        if (request.hybrid_data) {
          Object.assign(baseData, request.hybrid_data)
        }
        break
      case 'internal_system':
        if (request.internal_data) {
          Object.assign(baseData, request.internal_data)
        }
        break
    }

    return baseData
  }

  /**
   * Get transaction summary for user
   */
  static async getUserTransactionSummary(userId: string): Promise<{
    success: boolean;
    summary?: {
      total_transactions: number
      total_spent: number
      pending_transactions: number
      completed_transactions: number
      refunded_transactions: number
      recent_transactions: Transaction[]
    };
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const transactions = data as Transaction[]
      
      const summary = {
        total_transactions: transactions.length,
        total_spent: transactions
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + (t.total_amount || 0), 0),
        pending_transactions: transactions.filter(t => t.status === 'pending').length,
        completed_transactions: transactions.filter(t => t.status === 'completed').length,
        refunded_transactions: transactions.filter(t => t.status === 'refunded').length,
        recent_transactions: transactions.slice(0, 5)
      }

      return { success: true, summary }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Check if user can make transaction
   */
  static async canUserMakeTransaction(
    userId: string,
    contentId: string,
    transactionType: TransactionSubtype
  ): Promise<{
    success: boolean;
    can_transact: boolean;
    reason?: string;
  }> {
    try {
      // Check for existing pending transactions
      const { data: pendingTransactions, error } = await supabase
        .from('transactions')
        .select('id, status, subtype')
        .eq('user_id', userId)
        .eq('content_id', contentId)
        .eq('status', 'pending')

      if (error) throw error

      if (pendingTransactions && pendingTransactions.length > 0) {
        return {
          success: true,
          can_transact: false,
          reason: 'You already have a pending transaction for this item'
        }
      }

      // Additional business logic based on transaction type
      switch (transactionType) {
        case 'event_ticket':
          // Check if event is still available
          break
        case 'appointment_booking':
          // Check if time slot is available
          break
        case 'equipment_rental':
          // Check if equipment is available for rental period
          break
        // Add more business logic as needed
      }

      return { success: true, can_transact: true }
    } catch (error) {
      return { 
        success: false, 
        can_transact: false,
        reason: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}






