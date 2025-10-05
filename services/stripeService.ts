import Stripe from 'stripe';
import { supabase } from '../lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export interface PaymentIntentData {
  amount: number;
  currency?: string;
  postId?: string;
  userId: string;
  metadata?: Record<string, string>;
}

export interface VerificationSessionData {
  userId: string;
  type: 'identity' | 'document' | 'address';
  returnUrl: string;
}

export class StripeService {
  // Payment Processing
  static async createPaymentIntent(data: PaymentIntentData) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency || 'usd',
        metadata: {
          userId: data.userId,
          postId: data.postId || '',
          ...data.metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Store in database
      const { error } = await supabase
        .from('payment_intents')
        .insert({
          stripe_payment_intent_id: paymentIntent.id,
          user_id: data.userId,
          post_id: data.postId,
          amount: data.amount,
          currency: data.currency || 'usd',
          status: paymentIntent.status,
          client_secret: paymentIntent.client_secret,
          metadata: data.metadata,
        });

      if (error) throw error;

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return { success: false, error: error.message };
    }
  }

  static async confirmPaymentIntent(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        // Update database
        await supabase
          .from('payment_intents')
          .update({ status: 'succeeded' })
          .eq('stripe_payment_intent_id', paymentIntentId);

        return { success: true, paymentIntent };
      }

      return { success: false, error: 'Payment not completed' };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return { success: false, error: error.message };
    }
  }

  // Account Setup for Sellers
  static async createConnectAccount(userId: string, email: string) {
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      // Store in database
      const { error } = await supabase
        .from('stripe_accounts')
        .insert({
          user_id: userId,
          stripe_account_id: account.id,
          account_type: 'express',
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          requirements: account.requirements,
          capabilities: account.capabilities,
        });

      if (error) throw error;

      return { success: true, accountId: account.id };
    } catch (error) {
      console.error('Error creating connect account:', error);
      return { success: false, error: error.message };
    }
  }

  static async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
    try {
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });

      return { success: true, url: accountLink.url };
    } catch (error) {
      console.error('Error creating account link:', error);
      return { success: false, error: error.message };
    }
  }

  // Identity Verification
  static async createVerificationSession(data: VerificationSessionData) {
    try {
      const session = await stripe.identity.verificationSessions.create({
        type: data.type,
        metadata: {
          userId: data.userId,
        },
        options: {
          document: {
            allowed_types: ['driving_license', 'id_card', 'passport'],
          },
        },
        return_url: data.returnUrl,
      });

      // Store in database
      const { error } = await supabase
        .from('stripe_verification_sessions')
        .insert({
          user_id: data.userId,
          session_id: session.id,
          verification_type: data.type,
          status: session.status,
          expires_at: new Date(session.expires_at * 1000),
        });

      if (error) throw error;

      return {
        success: true,
        sessionId: session.id,
        clientSecret: session.client_secret,
      };
    } catch (error) {
      console.error('Error creating verification session:', error);
      return { success: false, error: error.message };
    }
  }

  static async getVerificationSession(sessionId: string) {
    try {
      const session = await stripe.identity.verificationSessions.retrieve(sessionId);
      
      // Update database
      await supabase
        .from('stripe_verification_sessions')
        .update({
          status: session.status,
          verified_at: session.status === 'verified' ? new Date() : null,
          verification_data: session.verified_outputs,
        })
        .eq('session_id', sessionId);

      // Update user verification status
      if (session.status === 'verified') {
        await supabase
          .from('profiles')
          .update({
            verification_status: 'verified',
            verification_level: 'identity',
            verification_data: session.verified_outputs,
          })
          .eq('id', session.metadata.userId);
      }

      return { success: true, session };
    } catch (error) {
      console.error('Error getting verification session:', error);
      return { success: false, error: error.message };
    }
  }

  // Subscriptions
  static async createSubscription(userId: string, priceId: string) {
    try {
      // Get or create customer
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      let customerId = profile?.stripe_customer_id;

      if (!customerId) {
        const customer = await stripe.customers.create({
          metadata: { userId },
        });
        customerId = customer.id;

        // Update profile with customer ID
        await supabase
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', userId);
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Store in database
      await supabase
        .from('stripe_subscriptions')
        .insert({
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000),
          current_period_end: new Date(subscription.current_period_end * 1000),
        });

      return {
        success: true,
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      return { success: false, error: error.message };
    }
  }

  // Webhook Handling
  static async handleWebhook(event: Stripe.Event) {
    try {
      // Store webhook event
      await supabase
        .from('stripe_webhook_events')
        .insert({
          stripe_event_id: event.id,
          event_type: event.type,
          event_data: event.data,
        });

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'identity.verification_session.verified':
          await this.handleVerificationVerified(event.data.object as Stripe.Identity.VerificationSession);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling webhook:', error);
      return { success: false, error: error.message };
    }
  }

  private static async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    await supabase
      .from('payment_intents')
      .update({ status: 'succeeded' })
      .eq('stripe_payment_intent_id', paymentIntent.id);
  }

  private static async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    await supabase
      .from('payment_intents')
      .update({ status: 'failed' })
      .eq('stripe_payment_intent_id', paymentIntent.id);
  }

  private static async handleVerificationVerified(session: Stripe.Identity.VerificationSession) {
    await supabase
      .from('stripe_verification_sessions')
      .update({
        status: 'verified',
        verified_at: new Date(),
        verification_data: session.verified_outputs,
      })
      .eq('session_id', session.id);

    // Update user verification status
    await supabase
      .from('profiles')
      .update({
        verification_status: 'verified',
        verification_level: 'identity',
        verification_data: session.verified_outputs,
      })
      .eq('id', session.metadata.userId);
  }

  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    await supabase
      .from('stripe_subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      })
      .eq('stripe_subscription_id', subscription.id);
  }
}
