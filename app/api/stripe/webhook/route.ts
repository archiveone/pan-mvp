import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Service not configured' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover' as any,
    })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      
      console.log('✅ Payment succeeded:', paymentIntent.id)
      
      // Update transaction in database
      const { error } = await supabase
        .from('transactions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          provider_transaction_id: paymentIntent.id,
          payment_provider: 'stripe',
        })
        .eq('metadata->stripe_payment_intent_id', paymentIntent.id)

      if (error) {
        console.error('Error updating transaction:', error)
      }
      break

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object as Stripe.PaymentIntent
      
      console.log('❌ Payment failed:', failedPayment.id)
      
      // Update transaction status
      await supabase
        .from('transactions')
        .update({
          status: 'failed',
        })
        .eq('metadata->stripe_payment_intent_id', failedPayment.id)
      break

    case 'charge.refunded':
      const refund = event.data.object as Stripe.Charge
      
      console.log('💰 Refund processed:', refund.id)
      
      // Update transaction status
      await supabase
        .from('transactions')
        .update({
          status: 'refunded',
        })
        .eq('provider_transaction_id', refund.payment_intent as string)
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

// Disable body parsing for webhook
export const runtime = 'edge'

