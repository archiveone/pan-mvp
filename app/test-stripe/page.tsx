'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function TestPaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);
    setMessage(null);

    try {
      // Create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 2000, // $20.00 in cents
          currency: 'usd',
          userId: 'test-user-id',
          metadata: { test: 'true' },
        }),
      });

      const { clientSecret } = await response.json();

      if (!clientSecret) {
        throw new Error('No client secret received');
      }

      // Confirm payment
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/test-stripe?success=true`,
        },
      });

      if (error) {
        setMessage(`Payment failed: ${error.message}`);
      } else {
        setMessage('Payment successful!');
      }
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Test Stripe Payment</h2>
      <p className="text-gray-600 mb-6">Test payment of $20.00</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement />
        
        {message && (
          <div className={`p-3 rounded ${
            message.includes('successful') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}
        
        <button
          type="submit"
          disabled={!stripe || isLoading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Pay $20.00'}
        </button>
      </form>
      
      <div className="mt-6 text-sm text-gray-500">
        <p><strong>Test Cards:</strong></p>
        <p>Success: 4242 4242 4242 4242</p>
        <p>Decline: 4000 0000 0000 0002</p>
      </div>
    </div>
  );
}

export default function TestStripePage() {
  const [showPayment, setShowPayment] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Stripe Integration Test
          </h1>
          <p className="text-gray-600">
            Test your Stripe payment and verification setup
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Payment Test */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Test</h2>
            <p className="text-gray-600 mb-4">
              Test the payment flow with Stripe test cards
            </p>
            
            {!showPayment ? (
              <button
                onClick={() => setShowPayment(true)}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Test Payment
              </button>
            ) : (
              <Elements stripe={stripePromise}>
                <TestPaymentForm />
              </Elements>
            )}
          </div>

          {/* Verification Test */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Verification Test</h2>
            <p className="text-gray-600 mb-4">
              Test identity verification with Stripe Identity
            </p>
            
            <button
              onClick={() => {
                // This would open the verification modal
                alert('Verification test - implement verification modal');
              }}
              className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Test Verification
            </button>
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Setup Instructions
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>1. Add your Stripe keys to <code>.env.local</code></p>
            <p>2. Get test cards from <a href="https://stripe.com/docs/testing" className="underline">Stripe Testing</a></p>
            <p>3. Set up webhooks in your Stripe Dashboard</p>
            <p>4. Deploy Supabase Edge Functions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
