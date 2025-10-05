import { supabase } from './supabaseClient';

// Stripe Identity verification service
export class StripeIdentityService {
  private static instance: StripeIdentityService;
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

  static getInstance(): StripeIdentityService {
    if (!StripeIdentityService.instance) {
      StripeIdentityService.instance = new StripeIdentityService();
    }
    return StripeIdentityService.instance;
  }

  // Start verification session
  async startVerification(userId: string): Promise<{ sessionId: string; url: string } | null> {
    try {
      // Create verification session via your backend (Edge Function)
      const { data, error } = await supabase.functions.invoke('create-verification-session', {
        body: { userId }
      });

      if (error) throw error;

      return {
        sessionId: data.sessionId,
        url: data.url
      };
    } catch (error) {
      console.error('Failed to start verification:', error);
      return null;
    }
  }

  // Check verification status
  async checkVerificationStatus(userId: string): Promise<'unverified' | 'pending' | 'verified' | 'failed'> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('verification_status')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.verification_status || 'unverified';
    } catch (error) {
      console.error('Failed to check verification status:', error);
      return 'unverified';
    }
  }

  // Update verification status (called by webhook)
  async updateVerificationStatus(userId: string, status: 'verified' | 'failed'): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: status })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update verification status:', error);
    }
  }
}

export const stripeIdentity = StripeIdentityService.getInstance();
