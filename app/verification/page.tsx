'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { StripeIdentityVerificationFlow } from '@stripe/identity-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export default function VerificationPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeVerification = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        const clientSecret = searchParams.get('client_secret');

        if (!sessionId || !clientSecret) {
          setError('Missing verification parameters');
          return;
        }

        const stripe = await stripePromise;
        if (!stripe) {
          setError('Failed to load Stripe');
          return;
        }

        // Initialize the verification flow
        const verificationFlow = new StripeIdentityVerificationFlow({
          stripe,
          sessionId,
          clientSecret,
        });

        // Mount the verification flow
        const { error } = await verificationFlow.mount('#verification-container');
        
        if (error) {
          setError(error.message);
        }
      } catch (err) {
        setError('Failed to initialize verification');
      } finally {
        setIsLoading(false);
      }
    };

    initializeVerification();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Identity Verification
          </h1>
          <p className="text-gray-600 mb-6">
            Please complete the verification process to access premium features.
          </p>
          
          <div id="verification-container" className="min-h-[400px]">
            {/* Stripe verification flow will be mounted here */}
          </div>
        </div>
      </div>
    </div>
  );
}
