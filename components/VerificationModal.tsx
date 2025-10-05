'use client';

import { useState } from 'react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VerificationModal({ isOpen, onClose, onSuccess }: VerificationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationType, setVerificationType] = useState<'identity' | 'document' | 'address'>('identity');

  const handleStartVerification = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-verification-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current-user-id', // Get from auth context
          type: verificationType,
          returnUrl: `${window.location.origin}/verification-success`,
        }),
      });

      const { sessionId, clientSecret } = await response.json();

      if (sessionId && clientSecret) {
        // Redirect to Stripe verification
        window.location.href = `/verification?session_id=${sessionId}&client_secret=${clientSecret}`;
      } else {
        setError('Failed to start verification');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Verify Your Identity</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Type
            </label>
            <select
              value={verificationType}
              onChange={(e) => setVerificationType(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="identity">Identity Verification</option>
              <option value="document">Document Verification</option>
              <option value="address">Address Verification</option>
            </select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">What you'll need:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Government-issued photo ID</li>
              <li>• Clear, well-lit photos</li>
              <li>• Stable internet connection</li>
            </ul>
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleStartVerification}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Starting...' : 'Start Verification'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
