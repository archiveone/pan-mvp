import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '../../../../services/stripeService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, postId, userId, metadata } = body;

    if (!amount || !userId) {
      return NextResponse.json(
        { error: 'Amount and userId are required' },
        { status: 400 }
      );
    }

    const result = await StripeService.createPaymentIntent({
      amount,
      currency,
      postId,
      userId,
      metadata,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
