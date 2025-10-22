import { supabase } from '@/lib/supabase';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export interface PurchaseOptions {
  postId: string;
  userId: string;
  amount: number;
  metadata?: Record<string, any>;
}

/**
 * Purchase any type of content (music, video, ticket, etc.)
 * This handles the full flow: Stripe payment → Database transaction → Collection
 */
export async function purchasePost(options: PurchaseOptions) {
  const { postId, userId, amount, metadata = {} } = options;

  try {
    // 1. Create Stripe Payment Intent
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        postId,
        userId,
        metadata,
      }),
    });

    const { clientSecret, paymentIntentId } = await response.json();

    // 2. Confirm payment with Stripe
    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe not loaded');

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret);

    if (error) {
      throw new Error(error.message);
    }

    // 3. Call database function to create transaction + add to collection
    const { data, error: dbError } = await supabase.rpc('purchase_post', {
      p_buyer_id: userId,
      p_post_id: postId,
      p_amount: amount,
      p_stripe_payment_intent_id: paymentIntentId,
      p_metadata: metadata,
    });

    if (dbError) throw dbError;

    return {
      success: true,
      transactionId: data,
      paymentIntentId,
    };
  } catch (error) {
    console.error('Purchase failed:', error);
    throw error;
  }
}

/**
 * Quick purchase for free content
 * Just adds to collection without payment
 */
export async function addFreeContentToLibrary(postId: string, userId: string) {
  try {
    // Add to library collection (free content)
    const { data, error } = await supabase.rpc('add_to_collection', {
      p_user_id: userId,
      p_collection_type: 'library',
      p_post_id: postId,
      p_transaction_data: {
        purchased: false,
        free: true,
        status: 'active',
      },
    });

    if (error) throw error;

    return { success: true, collectionItemId: data };
  } catch (error) {
    console.error('Failed to add free content:', error);
    throw error;
  }
}

/**
 * Get purchase button props based on post type
 */
export function getPurchaseButtonText(post: any): string {
  if (!post.is_for_sale || !post.price_amount) {
    return 'Get Free';
  }

  const price = `$${post.price_amount.toFixed(2)}`;

  switch (post.post_type) {
    case 'music_single':
      return `Buy Song ${price}`;
    case 'music_album':
      return `Buy Album ${price}`;
    case 'video':
      return `Rent ${price}`;
    case 'course':
      return `Enroll ${price}`;
    case 'event':
      return `Buy Ticket ${price}`;
    case 'booking':
      return `Book ${price}/night`;
    case 'product':
      return `Buy ${price}`;
    case 'service':
      return `Book Service ${price}`;
    default:
      return `Buy ${price}`;
  }
}

