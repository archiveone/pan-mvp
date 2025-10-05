import { supabase } from './supabaseClient';

// Payment service for marketplace transactions
export class PaymentService {
  private static instance: PaymentService;
  private stripe: any = null;

  constructor() {
    // Initialize Stripe only when needed
    if (typeof window !== 'undefined' && import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      import('@stripe/stripe-js').then(({ loadStripe }) => {
        loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY).then(stripe => {
          this.stripe = stripe;
        });
      });
    }
  }

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  // Create payment intent for a post
  async createPaymentIntent(postId: string, buyerId: string, sellerId: string, amount: number, currency: string = 'usd'): Promise<{ clientSecret: string; paymentIntentId: string } | null> {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: { 
          postId, 
          buyerId, 
          sellerId, 
          amount: Math.round(amount * 100), // Convert to cents
          currency 
        }
      });

      if (error) throw error;

      return {
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId
      };
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      return null;
    }
  }

  // Process payment with Stripe
  async processPayment(clientSecret: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not initialized');
      }

      const { error } = await this.stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/#/payment/success`,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Payment processing failed:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }

  // Get payment history for a user
  async getPaymentHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          post:posts(title, content),
          buyer:profiles!payments_buyer_id_fkey(name),
          seller:profiles!payments_seller_id_fkey(name)
        `)
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get payment history:', error);
      return [];
    }
  }

  // Create payment link for a post (alternative to payment intent)
  async createPaymentLink(postId: string, amount: number, currency: string = 'usd'): Promise<{ url: string } | null> {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: { 
          postId, 
          amount: Math.round(amount * 100), // Convert to cents
          currency 
        }
      });

      if (error) throw error;

      return { url: data.url };
    } catch (error) {
      console.error('Failed to create payment link:', error);
      return null;
    }
  }
}

export const paymentService = PaymentService.getInstance();
