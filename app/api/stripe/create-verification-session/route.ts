import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '../../../../services/stripeService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, returnUrl } = body;

    if (!userId || !type || !returnUrl) {
      return NextResponse.json(
        { error: 'userId, type, and returnUrl are required' },
        { status: 400 }
      );
    }

    const result = await StripeService.createVerificationSession({
      userId,
      type,
      returnUrl,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      sessionId: result.sessionId,
      clientSecret: result.clientSecret,
    });
  } catch (error) {
    console.error('Error creating verification session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
