import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-09-30.clover',
    })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      throw new Error('No stripe signature found')
    }

    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new Error('No webhook secret found')
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    console.log('Processing webhook event:', event.type)

    // Store webhook event in database
    const { error: webhookError } = await supabaseClient
      .from('stripe_webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        event_data: event.data,
        processed: false,
      })

    if (webhookError) {
      console.error('Error storing webhook event:', webhookError)
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent, supabaseClient)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent, supabaseClient)
        break

      case 'identity.verification_session.verified':
        await handleVerificationVerified(event.data.object as Stripe.Identity.VerificationSession, supabaseClient)
        break

      case 'identity.verification_session.requires_input':
        await handleVerificationRequiresInput(event.data.object as Stripe.Identity.VerificationSession, supabaseClient)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, supabaseClient)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabaseClient)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabaseClient)
        break

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account, supabaseClient)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Mark webhook as processed
    await supabaseClient
      .from('stripe_webhook_events')
      .update({ processed: true })
      .eq('stripe_event_id', event.id)

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  console.log('Payment succeeded:', paymentIntent.id)
  
  await supabase
    .from('payment_intents')
    .update({ 
      status: 'succeeded',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  // Create transaction record
  await supabase
    .from('transactions')
    .insert({
      user_id: paymentIntent.metadata.userId,
      post_id: paymentIntent.metadata.postId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'completed',
      stripe_payment_intent_id: paymentIntent.id,
      metadata: paymentIntent.metadata,
    })
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  console.log('Payment failed:', paymentIntent.id)
  
  await supabase
    .from('payment_intents')
    .update({ 
      status: 'failed',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)
}

async function handleVerificationVerified(session: Stripe.Identity.VerificationSession, supabase: any) {
  console.log('Verification verified:', session.id)
  
  await supabase
    .from('stripe_verification_sessions')
    .update({
      status: 'verified',
      verified_at: new Date().toISOString(),
      verification_data: session.verified_outputs,
    })
    .eq('session_id', session.id)

  // Update user verification status
  await supabase
    .from('profiles')
    .update({
      verification_status: 'verified',
      verification_level: 'identity',
      verification_data: session.verified_outputs,
    })
    .eq('id', session.metadata.userId)
}

async function handleVerificationRequiresInput(session: Stripe.Identity.VerificationSession, supabase: any) {
  console.log('Verification requires input:', session.id)
  
  await supabase
    .from('stripe_verification_sessions')
    .update({
      status: 'pending',
    })
    .eq('session_id', session.id)
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription, supabase: any) {
  console.log('Subscription created:', subscription.id)
  
  await supabase
    .from('stripe_subscriptions')
    .insert({
      user_id: subscription.metadata.userId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0].price.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: any) {
  console.log('Subscription updated:', subscription.id)
  
  await supabase
    .from('stripe_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  console.log('Subscription deleted:', subscription.id)
  
  await supabase
    .from('stripe_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleAccountUpdated(account: Stripe.Account, supabase: any) {
  console.log('Account updated:', account.id)
  
  await supabase
    .from('stripe_accounts')
    .update({
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: account.requirements,
      capabilities: account.capabilities,
    })
    .eq('stripe_account_id', account.id)
}