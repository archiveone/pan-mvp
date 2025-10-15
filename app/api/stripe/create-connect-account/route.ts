import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json();
    
    if (!type || !['individual', 'business'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid account type' },
        { status: 400 }
      );
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express', // Use Express for easier onboarding
      country: 'US', // You can make this dynamic based on user location
      email: 'user@example.com', // This should come from the authenticated user
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: type,
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payments?success=true`,
      type: 'account_onboarding',
    });

    return NextResponse.json({
      account_id: account.id,
      account_link_url: accountLink.url,
    });
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    return NextResponse.json(
      { error: 'Failed to create payment account' },
      { status: 500 }
    );
  }
}