import { TransactionService } from './transactionService'
import { BookingService } from './bookingService'
import { 
  Transaction,
  TransactionSubtype,
  CreateTransactionRequest
} from '@/types/transactions'

// Stripe types (simplified for our use case)
interface StripePaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  client_secret: string
  metadata?: Record<string, any>
}

interface StripeSubscription {
  id: string
  status: string
  current_period_start: number
  current_period_end: number
  metadata?: Record<string, any>
}

interface StripeCheckoutSession {
  id: string
  url: string
  payment_status: string
  metadata?: Record<string, any>
}

interface StripeTransfer {
  id: string
  amount: number
  currency: string
  destination: string
  metadata?: Record<string, any>
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'bank_account' | 'wallet'
  card?: {
    brand: string
    last4: string
    exp_month: number
    exp_year: number
  }
  bank_account?: {
    bank_name: string
    last4: string
    account_type: string
  }
  is_default: boolean
}

export interface PaymentResult {
  success: boolean
  payment_intent?: StripePaymentIntent
  checkout_session?: StripeCheckoutSession
  subscription?: StripeSubscription
  transaction?: Transaction
  error?: string
}

export interface RefundRequest {
  transaction_id: string
  amount?: number // Partial refund if specified
  reason: string
  metadata?: Record<string, any>
}

export class PaymentService {
  
  // ==================== PAYMENT INTENT CREATION ====================
  
  /**
   * Create payment intent for one-time payment
   */
  static async createPaymentIntent(
    transactionId: string,
    amount: number,
    currency: string = 'EUR',
    metadata?: Record<string, any>
  ): Promise<{
    success: boolean;
    payment_intent?: StripePaymentIntent;
    error?: string;
  }> {
    try {
      // In a real implementation, this would call Stripe API
      // For now, we'll simulate the response
      const paymentIntent: StripePaymentIntent = {
        id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        status: 'requires_payment_method',
        client_secret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
        metadata: {
          transaction_id: transactionId,
          ...metadata
        }
      }

      // Update transaction with payment intent
      await TransactionService.updateWithStripePayment(transactionId, {
        payment_intent_id: paymentIntent.id,
        status: 'requires_payment_method'
      })

      return { success: true, payment_intent: paymentIntent }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Create checkout session for complex payments
   */
  static async createCheckoutSession(
    transactionId: string,
    amount: number,
    currency: string = 'EUR',
    successUrl?: string,
    cancelUrl?: string,
    metadata?: Record<string, any>
  ): Promise<{
    success: boolean;
    checkout_session?: StripeCheckoutSession;
    error?: string;
  }> {
    try {
      // In a real implementation, this would call Stripe API
      const checkoutSession: StripeCheckoutSession = {
        id: `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: `https://checkout.stripe.com/pay/cs_${Date.now()}`,
        payment_status: 'unpaid',
        metadata: {
          transaction_id: transactionId,
          ...metadata
        }
      }

      // Update transaction with checkout session
      await TransactionService.updateWithStripePayment(transactionId, {
        checkout_session_id: checkoutSession.id,
        status: 'requires_confirmation'
      })

      return { success: true, checkout_session: checkoutSession }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // ==================== CATEGORY-SPECIFIC PAYMENT FLOWS ====================
  
  /**
   * Process ticketing payment (events, concerts, etc.)
   */
  static async processTicketingPayment(
    userId: string,
    contentId: string,
    ticketingData: {
      event_date: string
      event_time: string
      venue: string
      ticket_quantity: number
      ticket_type?: string
      access_level?: string
    },
    amount: number,
    currency: string = 'EUR'
  ): Promise<PaymentResult> {
    try {
      // Create transaction
      const transactionResult = await TransactionService.createTransaction({
        user_id: userId,
        content_id: contentId,
        category: 'ticketing_attendance',
        subtype: 'event_ticket',
        amount: amount,
        currency: currency,
        description: `${ticketingData.ticket_quantity} ticket(s) for ${ticketingData.venue}`,
        metadata: {
          event_date: ticketingData.event_date,
          event_time: ticketingData.event_time,
          venue: ticketingData.venue,
          ticket_quantity: ticketingData.ticket_quantity,
          ticket_type: ticketingData.ticket_type,
          access_level: ticketingData.access_level as "general" | "vip" | "backstage" | "premium" | undefined
        },
        ticketing_data: {
          event_date: ticketingData.event_date,
          event_time: ticketingData.event_time,
          venue: ticketingData.venue,
          ticket_quantity: ticketingData.ticket_quantity,
          ticket_type: ticketingData.ticket_type,
          access_level: ticketingData.access_level as "general" | "vip" | "backstage" | "premium" | undefined
        }
      })

      if (!transactionResult.success || !transactionResult.transaction) {
        return { success: false, error: transactionResult.error }
      }

      // Create payment intent
      const paymentResult = await this.createPaymentIntent(
        transactionResult.transaction.id,
        amount,
        currency,
        { type: 'ticketing', subtype: 'event_ticket' }
      )

      if (!paymentResult.success) {
        return { success: false, error: paymentResult.error }
      }

      return {
        success: true,
        payment_intent: paymentResult.payment_intent,
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
   * Process booking payment (appointments, reservations, etc.)
   */
  static async processBookingPayment(
    userId: string,
    contentId: string,
    bookingData: {
      booking_date: string
      start_time: string
      end_time: string
      party_size: number
      special_requests?: string
    },
    amount: number,
    currency: string = 'EUR'
  ): Promise<PaymentResult> {
    try {
      // Create transaction
      const transactionResult = await TransactionService.createTransaction({
        user_id: userId,
        content_id: contentId,
        category: 'bookings_reservations',
        subtype: 'appointment_booking',
        amount: amount,
        currency: currency,
        description: `Booking for ${bookingData.booking_date} at ${bookingData.start_time}`,
        metadata: {
          booking_date: bookingData.booking_date,
          start_time: bookingData.start_time,
          end_time: bookingData.end_time,
          party_size: bookingData.party_size,
          special_requests: bookingData.special_requests
        },
        booking_data: bookingData
      })

      if (!transactionResult.success || !transactionResult.transaction) {
        return { success: false, error: transactionResult.error }
      }

      // Create payment intent
      const paymentResult = await this.createPaymentIntent(
        transactionResult.transaction.id,
        amount,
        currency,
        { type: 'booking', subtype: 'appointment_booking' }
      )

      if (!paymentResult.success) {
        return { success: false, error: paymentResult.error }
      }

      return {
        success: true,
        payment_intent: paymentResult.payment_intent,
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
   * Process purchase payment (e-commerce)
   */
  static async processPurchasePayment(
    userId: string,
    contentId: string,
    purchaseData: {
      quantity: number
      product_variant?: string
      shipping_address?: any
    },
    amount: number,
    currency: string = 'EUR'
  ): Promise<PaymentResult> {
    try {
      // Create transaction
      const transactionResult = await TransactionService.createTransaction({
        user_id: userId,
        content_id: contentId,
        category: 'purchases_ecommerce',
        subtype: 'physical_product',
        amount: amount,
        currency: currency,
        description: `Purchase of ${purchaseData.quantity} item(s)`,
        metadata: {
          quantity: purchaseData.quantity,
          product_variant: purchaseData.product_variant,
          shipping_address: purchaseData.shipping_address
        },
        purchase_data: purchaseData
      })

      if (!transactionResult.success || !transactionResult.transaction) {
        return { success: false, error: transactionResult.error }
      }

      // Create checkout session for e-commerce (better UX)
      const checkoutResult = await this.createCheckoutSession(
        transactionResult.transaction.id,
        amount,
        currency,
        undefined, // success_url
        undefined, // cancel_url
        { type: 'purchase', subtype: 'physical_product' }
      )

      if (!checkoutResult.success) {
        return { success: false, error: checkoutResult.error }
      }

      return {
        success: true,
        checkout_session: checkoutResult.checkout_session,
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
   * Process rental payment
   */
  static async processRentalPayment(
    userId: string,
    contentId: string,
    rentalData: {
      rental_start_date: string
      rental_end_date: string
      security_deposit?: number
      pickup_location?: string
    },
    amount: number,
    currency: string = 'EUR'
  ): Promise<PaymentResult> {
    try {
      // Create transaction
      const transactionResult = await TransactionService.createTransaction({
        user_id: userId,
        content_id: contentId,
        category: 'rentals_leases',
        subtype: 'equipment_rental',
        amount: amount,
        currency: currency,
        description: `Rental from ${rentalData.rental_start_date} to ${rentalData.rental_end_date}`,
        metadata: {
          rental_start_date: rentalData.rental_start_date,
          rental_end_date: rentalData.rental_end_date,
          security_deposit: rentalData.security_deposit,
          pickup_location: rentalData.pickup_location
        },
        rental_data: rentalData
      })

      if (!transactionResult.success || !transactionResult.transaction) {
        return { success: false, error: transactionResult.error }
      }

      // Create payment intent
      const paymentResult = await this.createPaymentIntent(
        transactionResult.transaction.id,
        amount,
        currency,
        { type: 'rental', subtype: 'equipment_rental' }
      )

      if (!paymentResult.success) {
        return { success: false, error: paymentResult.error }
      }

      return {
        success: true,
        payment_intent: paymentResult.payment_intent,
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
   * Process donation payment
   */
  static async processDonationPayment(
    userId: string,
    contentId: string,
    donationData: {
      donation_type: 'one_time' | 'recurring'
      amount: number
      is_anonymous?: boolean
      message?: string
    },
    currency: string = 'EUR'
  ): Promise<PaymentResult> {
    try {
      // Create transaction
      const transactionResult = await TransactionService.createTransaction({
        user_id: userId,
        content_id: contentId,
        category: 'donations_crowdfunding',
        subtype: donationData.donation_type === 'recurring' ? 'recurring_donation' : 'one_time_donation',
        amount: donationData.amount,
        currency: currency,
        description: donationData.is_anonymous ? 'Anonymous donation' : 'Donation',
        metadata: {
          donation_type: donationData.donation_type,
          is_anonymous: donationData.is_anonymous,
          message: donationData.message
        },
        donation_data: donationData
      })

      if (!transactionResult.success || !transactionResult.transaction) {
        return { success: false, error: transactionResult.error }
      }

      // Create payment intent
      const paymentResult = await this.createPaymentIntent(
        transactionResult.transaction.id,
        donationData.amount,
        currency,
        { type: 'donation', subtype: donationData.donation_type }
      )

      if (!paymentResult.success) {
        return { success: false, error: paymentResult.error }
      }

      return {
        success: true,
        payment_intent: paymentResult.payment_intent,
        transaction: transactionResult.transaction
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // ==================== PAYMENT CONFIRMATION ====================
  
  /**
   * Confirm payment intent
   */
  static async confirmPayment(
    paymentIntentId: string
  ): Promise<{
    success: boolean;
    payment_intent?: StripePaymentIntent;
    error?: string;
  }> {
    try {
      // In a real implementation, this would confirm the payment with Stripe
      // For now, we'll simulate a successful payment
      const paymentIntent: StripePaymentIntent = {
        id: paymentIntentId,
        amount: 0, // Would be fetched from Stripe
        currency: 'eur',
        status: 'succeeded',
        client_secret: '',
        metadata: {}
      }

      // Find and update the related transaction
      // In a real app, you'd query by stripe_payment_intent_id
      
      return { success: true, payment_intent: paymentIntent }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Handle successful payment webhook
   */
  static async handlePaymentSuccess(
    paymentIntentId: string,
    metadata?: Record<string, any>
  ): Promise<{
    success: boolean;
    transaction?: Transaction;
    error?: string;
  }> {
    try {
      // Update transaction status
      const updateResult = await TransactionService.updateWithStripePayment(
        '', // Would need to find transaction by payment intent ID
        {
          payment_intent_id: paymentIntentId,
          status: 'succeeded'
        }
      )

      if (!updateResult.success) {
        return { success: false, error: updateResult.error }
      }

      // Handle category-specific post-payment logic
      if (updateResult.transaction) {
        await this.handlePostPaymentLogic(updateResult.transaction)
      }

      return { 
        success: true, 
        transaction: updateResult.transaction 
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // ==================== REFUNDS ====================
  
  /**
   * Process refund
   */
  static async processRefund(
    refundRequest: RefundRequest
  ): Promise<{
    success: boolean;
    refund_id?: string;
    error?: string;
  }> {
    try {
      // In a real implementation, this would call Stripe refund API
      const refundId = `re_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Update transaction with refund
      await TransactionService.processRefund(refundRequest.transaction_id, {
        refund_amount: refundRequest.amount || 0,
        reason: refundRequest.reason,
        stripe_refund_id: refundId
      })

      return { success: true, refund_id: refundId }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // ==================== SUBSCRIPTIONS ====================
  
  /**
   * Create subscription for recurring payments
   */
  static async createSubscription(
    userId: string,
    contentId: string,
    subscriptionData: {
      price_id: string
      billing_interval: 'monthly' | 'yearly'
      trial_period_days?: number
    }
  ): Promise<{
    success: boolean;
    subscription?: StripeSubscription;
    checkout_session?: StripeCheckoutSession;
    error?: string;
  }> {
    try {
      // In a real implementation, this would create a Stripe subscription
      const subscription: StripeSubscription = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (subscriptionData.billing_interval === 'monthly' ? 30 * 24 * 60 * 60 : 365 * 24 * 60 * 60),
        metadata: {
          user_id: userId,
          content_id: contentId
        }
      }

      return { success: true, subscription: subscription }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // ==================== UTILITY METHODS ====================
  
  /**
   * Handle post-payment logic based on transaction category
   */
  private static async handlePostPaymentLogic(transaction: Transaction): Promise<void> {
    try {
      switch (transaction.category) {
        case 'ticketing_attendance':
          // Generate QR codes, send tickets, etc.
          await this.handleTicketingPostPayment(transaction)
          break
        
        case 'bookings_reservations':
          // Confirm booking, send confirmation email, etc.
          await this.handleBookingPostPayment(transaction)
          break
        
        case 'purchases_ecommerce':
          // Process order, update inventory, etc.
          await this.handlePurchasePostPayment(transaction)
          break
        
        case 'rentals_leases':
          // Confirm rental, send pickup instructions, etc.
          await this.handleRentalPostPayment(transaction)
          break
        
        case 'donations_crowdfunding':
          // Send thank you message, update campaign progress, etc.
          await this.handleDonationPostPayment(transaction)
          break
        
        // Add more category-specific logic as needed
      }
    } catch (error) {
      console.error('Error in post-payment logic:', error)
    }
  }

  private static async handleTicketingPostPayment(transaction: Transaction): Promise<void> {
    // Generate QR code, send ticket email, update event capacity
    console.log('Processing ticketing post-payment logic for transaction:', transaction.id)
  }

  private static async handleBookingPostPayment(transaction: Transaction): Promise<void> {
    // Confirm booking, send confirmation email
    console.log('Processing booking post-payment logic for transaction:', transaction.id)
  }

  private static async handlePurchasePostPayment(transaction: Transaction): Promise<void> {
    // Process order, update inventory
    console.log('Processing purchase post-payment logic for transaction:', transaction.id)
  }

  private static async handleRentalPostPayment(transaction: Transaction): Promise<void> {
    // Confirm rental, send pickup instructions
    console.log('Processing rental post-payment logic for transaction:', transaction.id)
  }

  private static async handleDonationPostPayment(transaction: Transaction): Promise<void> {
    // Send thank you message, update campaign progress
    console.log('Processing donation post-payment logic for transaction:', transaction.id)
  }

  /**
   * Get user's payment methods
   */
  static async getPaymentMethods(userId: string): Promise<{
    success: boolean;
    payment_methods?: PaymentMethod[];
    error?: string;
  }> {
    try {
      // In a real implementation, this would fetch from Stripe
      const paymentMethods: PaymentMethod[] = [
        {
          id: 'pm_1',
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2025
          },
          is_default: true
        }
      ]

      return { success: true, payment_methods: paymentMethods }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Calculate fees and taxes
   */
  static calculateFeesAndTaxes(
    amount: number,
    currency: string = 'EUR',
    country: string = 'IE'
  ): {
    subtotal: number
    tax_amount: number
    processing_fee: number
    platform_fee: number
    total: number
  } {
    const subtotal = amount
    
    // Calculate tax (VAT for Ireland)
    const taxRate = country === 'IE' ? 0.23 : 0.20 // 23% VAT for Ireland
    const tax_amount = subtotal * taxRate
    
    // Calculate processing fee (Stripe: 1.4% + €0.25)
    const processing_fee = Math.max(subtotal * 0.014 + 0.25, 0.50)
    
    // Calculate platform fee (5%)
    const platform_fee = subtotal * 0.05
    
    const total = subtotal + tax_amount + processing_fee + platform_fee

    return {
      subtotal,
      tax_amount,
      processing_fee,
      platform_fee,
      total: Math.round(total * 100) / 100 // Round to 2 decimal places
    }
  }
}