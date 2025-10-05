import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        account: {
          id: 'not_configured',
          type: 'individual',
          status: 'incomplete',
          email: 'user@example.com',
          country: 'US',
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: false,
          requirements: ['Stripe not configured']
        }
      });
    }

    // In a real app, you'd get the account ID from the authenticated user's profile
    // For now, we'll return a mock response
    const mockAccount = {
      id: 'acct_mock123',
      type: 'individual',
      status: 'active',
      email: 'user@example.com',
      country: 'US',
      charges_enabled: true,
      payouts_enabled: true,
      details_submitted: true,
      requirements: []
    };

    return NextResponse.json({
      account: mockAccount
    });
  } catch (error) {
    console.error('Error fetching Stripe Connect account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment account' },
      { status: 500 }
    );
  }
}
