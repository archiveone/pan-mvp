import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Function to get Stripe instance (lazy initialization)
function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  
  return new Stripe(secretKey, {
    apiVersion: '2024-11-20.acacia',
  });
}

export async function POST(request: NextRequest) {
  try {
    const { amount, postId, userId, metadata } = await request.json();

    // Get Stripe instance
    const stripe = getStripe();

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // in cents
      currency: 'usd',
      metadata: {
        postId,
        userId,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Payment intent creation failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

