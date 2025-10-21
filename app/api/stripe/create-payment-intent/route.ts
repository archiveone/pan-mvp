import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover' as any,
    })

    const { amount, currency, listingId, userId } = await req.json()

    if (!amount || !currency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate service fee (5%)
    const serviceFee = Math.round(amount * 0.05 * 100) // in cents
    const totalAmount = Math.round(amount * 100) + serviceFee // in cents

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        listingId: listingId || '',
        userId: userId || '',
        serviceFee: serviceFee.toString(),
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
    })
  } catch (error: any) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
