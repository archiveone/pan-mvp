# Environment Variables Setup

## Required Variables

Create a `.env.local` file in your project root with these variables:

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Stripe Configuration (Optional - for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Google AI Configuration (Optional - for AI features)
GOOGLE_GENAI_API_KEY=your_google_ai_api_key_here
```

## How to Get These Values

### Supabase (Required)
1. Go to your Supabase project dashboard
2. Go to Settings > API
3. Copy the Project URL and anon public key

### Stripe (Optional)
1. Go to Stripe Dashboard > Developers > API Keys
2. Copy the Publishable key and Secret key
3. For webhooks, create a webhook endpoint and copy the signing secret

### Google AI (Optional)
1. Go to Google AI Studio
2. Create an API key
3. Copy the key

## Current Issues

The Stripe error occurs because the environment variables are missing. You can either:
1. Add the Stripe variables to fix payments
2. Or the app will work without Stripe (just without payment features)
