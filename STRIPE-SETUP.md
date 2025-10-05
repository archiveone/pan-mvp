# Stripe Integration Setup Guide

This guide will help you set up Stripe payments and identity verification for your Pan marketplace.

## 1. Stripe Account Setup

### Create Stripe Account
1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete your business information
3. Activate your account (may require additional verification)

### Get API Keys
1. Go to [Dashboard > Developers > API Keys](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable key** and **Secret key**
3. Add them to your `.env.local` file:

```env
# Stripe Keys
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase (you should already have these)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 2. Database Setup

Run the Stripe integration SQL script:

```sql
-- Run this in your Supabase SQL editor
-- Copy and paste the contents of database-stripe-integration.sql
```

## 3. Install Dependencies

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js @stripe/identity-js
```

## 4. Deploy Supabase Edge Functions

Deploy the Stripe webhook handler:

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the webhook function
supabase functions deploy stripe-webhook
```

## 5. Configure Stripe Webhooks

1. Go to [Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL to: `https://your-project-ref.supabase.co/functions/v1/stripe-webhook`
4. Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `identity.verification_session.verified`
   - `identity.verification_session.requires_input`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `account.updated`
5. Copy the webhook signing secret and add it to your environment variables

## 6. Test the Integration

### Test Payments
1. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
2. Test the payment flow in your app

### Test Identity Verification
1. Use test mode in Stripe Dashboard
2. Test the verification flow with test documents

## 7. Production Setup

### Switch to Live Mode
1. Get your live API keys from Stripe Dashboard
2. Update your environment variables
3. Update webhook endpoints to use your production domain
4. Test with real (small) transactions

### Enable Connect for Sellers
1. Go to [Dashboard > Connect](https://dashboard.stripe.com/connect)
2. Enable Express accounts
3. Configure your Connect settings

## 8. Features Included

### Payment Processing
- ✅ One-time payments for posts/listings
- ✅ Subscription management
- ✅ Payment method storage
- ✅ Transaction history

### Identity Verification
- ✅ Document verification
- ✅ Identity verification
- ✅ Address verification
- ✅ Verification status tracking

### Seller Features
- ✅ Stripe Connect for sellers
- ✅ Payout management
- ✅ Account onboarding

## 9. Usage Examples

### Create a Payment
```typescript
import { PaymentModal } from '@/components/PaymentModal';

function PostCard({ post }) {
  const [showPayment, setShowPayment] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowPayment(true)}>
        Buy for ${post.price}
      </button>
      
      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        amount={post.price}
        postId={post.id}
        onSuccess={() => console.log('Payment successful!')}
      />
    </>
  );
}
```

### Start Verification
```typescript
import { VerificationModal } from '@/components/VerificationModal';

function ProfilePage() {
  const [showVerification, setShowVerification] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowVerification(true)}>
        Verify Identity
      </button>
      
      <VerificationModal
        isOpen={showVerification}
        onClose={() => setShowVerification(false)}
        onSuccess={() => console.log('Verification successful!')}
      />
    </>
  );
}
```

## 10. Security Considerations

- Never expose secret keys in client-side code
- Always validate webhook signatures
- Use HTTPS in production
- Implement proper error handling
- Monitor for suspicious activity

## 11. Troubleshooting

### Common Issues

**Webhook not receiving events:**
- Check webhook URL is correct
- Verify webhook secret is set correctly
- Check Supabase function logs

**Payment failures:**
- Verify API keys are correct
- Check card details are valid
- Ensure sufficient funds

**Verification not working:**
- Check Stripe Identity is enabled
- Verify webhook events are configured
- Check browser compatibility

### Getting Help

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [Supabase Documentation](https://supabase.com/docs)

## 12. Next Steps

1. **Customize the UI** - Modify the payment and verification modals to match your design
2. **Add more payment methods** - Enable bank transfers, digital wallets, etc.
3. **Implement subscriptions** - Add recurring billing for premium features
4. **Add analytics** - Track payment success rates and user behavior
5. **Implement fraud detection** - Use Stripe Radar for additional security
