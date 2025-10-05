#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Stripe integration for Pan Marketplace...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('Please create .env.local with your environment variables.\n');
  
  console.log('Required environment variables:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key');
  console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key');
  console.log('STRIPE_SECRET_KEY=sk_test_your_secret_key');
  console.log('STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret\n');
} else {
  console.log('✅ .env.local file found');
}

// Check if Stripe dependencies are installed
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const hasStripe = packageJson.dependencies && (
    packageJson.dependencies['@stripe/stripe-js'] || 
    packageJson.dependencies['@stripe/react-stripe-js']
  );
  
  if (hasStripe) {
    console.log('✅ Stripe dependencies installed');
  } else {
    console.log('❌ Stripe dependencies not found');
    console.log('Run: npm install @stripe/stripe-js @stripe/react-stripe-js\n');
  }
}

console.log('📋 Next steps:');
console.log('1. Get your Stripe API keys from https://dashboard.stripe.com/apikeys');
console.log('2. Add them to your .env.local file');
console.log('3. Run the database-stripe-clean.sql script in Supabase');
console.log('4. Deploy the webhook function: supabase functions deploy stripe-webhook');
console.log('5. Set up webhooks in your Stripe Dashboard');
console.log('6. Test payments at /test-stripe\n');

console.log('🎯 Your Pan marketplace now supports:');
console.log('• Secure payments with Stripe');
console.log('• Identity verification');
console.log('• Seller payouts');
console.log('• Subscription management');
console.log('• Real-time webhook processing\n');

console.log('🔗 Useful links:');
console.log('• Stripe Dashboard: https://dashboard.stripe.com');
console.log('• Stripe Testing: https://stripe.com/docs/testing');
console.log('• Test Cards: 4242 4242 4242 4242 (success)');
console.log('• Test Cards: 4000 0000 0000 0002 (decline)\n');

console.log('✨ Happy coding!');
