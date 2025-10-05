import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, ShieldAlert, Clock, CheckCircle } from 'lucide-react';
import { stripeIdentity } from '../services/stripeIdentity';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';

const VerificationPage: React.FC = () => {
  const [status, setStatus] = useState<'unverified' | 'pending' | 'verified' | 'failed'>('unverified');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      checkStatus();
    }
  }, [currentUser]);

  const checkStatus = async () => {
    if (!currentUser) return;
    
    try {
      const currentStatus = await stripeIdentity.checkVerificationStatus(currentUser.id);
      setStatus(currentStatus);
    } catch (err) {
      console.error('Failed to check verification status:', err);
    }
  };

  const startVerification = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await stripeIdentity.startVerification(currentUser.id);
      
      if (result) {
        // Update status to pending
        setStatus('pending');
        // Open verification in new window
        window.open(result.url, '_blank');
        
        // Poll for status updates
        const pollInterval = setInterval(async () => {
          const newStatus = await stripeIdentity.checkVerificationStatus(currentUser.id);
          setStatus(newStatus);
          
          if (newStatus === 'verified' || newStatus === 'failed') {
            clearInterval(pollInterval);
            setIsLoading(false);
          }
        }, 3000); // Check every 3 seconds
        
        // Clear interval after 10 minutes
        setTimeout(() => clearInterval(pollInterval), 600000);
      } else {
        setError('Failed to start verification. Please try again.');
      }
    } catch (err) {
      setError('Failed to start verification. Please try again.');
      console.error('Verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verified':
        return <CheckCircle size={48} className="text-green-500" />;
      case 'pending':
        return <Clock size={48} className="text-yellow-500" />;
      case 'failed':
        return <ShieldAlert size={48} className="text-red-500" />;
      default:
        return <ShieldAlert size={48} className="text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'verified':
        return {
          title: 'Identity Verified',
          description: 'Your identity has been successfully verified. You can now access all features.',
          color: 'text-green-500'
        };
      case 'pending':
        return {
          title: 'Verification in Progress',
          description: 'Please complete the verification process in the new window. This usually takes 1-2 minutes.',
          color: 'text-yellow-500'
        };
      case 'failed':
        return {
          title: 'Verification Failed',
          description: 'Your identity verification was unsuccessful. Please try again with clear, well-lit photos of your ID.',
          color: 'text-red-500'
        };
      default:
        return {
          title: 'Verify Your Identity',
          description: 'Complete identity verification to unlock all features and build trust with other users.',
          color: 'text-gray-500'
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Link to="/profile" className="p-2 rounded-full hover:bg-pan-gray-dark mr-2">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold">Identity Verification</h1>
      </div>

      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          {getStatusIcon()}
          <h2 className={`text-xl font-bold mt-4 ${statusInfo.color}`}>
            {statusInfo.title}
          </h2>
          <p className="text-gray-600 dark:text-pan-gray-light mt-2">
            {statusInfo.description}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {status === 'unverified' && (
            <div className="bg-gray-50 dark:bg-pan-gray-dark rounded-lg p-6">
              <h3 className="font-semibold mb-2">What you'll need:</h3>
              <ul className="text-sm text-gray-600 dark:text-pan-gray-light space-y-1">
                <li>• Government-issued photo ID</li>
                <li>• Good lighting for clear photos</li>
                <li>• 2-3 minutes to complete</li>
              </ul>
            </div>
          )}

          {status === 'pending' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                Keep this page open while you complete verification in the other window.
              </p>
            </div>
          )}

          {status === 'failed' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Tips for success:</h3>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• Use good lighting</li>
                <li>• Ensure ID is fully visible</li>
                <li>• Avoid glare or shadows</li>
                <li>• Use a clear, recent photo</li>
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            {status === 'unverified' && (
              <Button 
                onClick={startVerification}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Starting...' : 'Start Verification'}
              </Button>
            )}
            
            {status === 'pending' && (
              <Button 
                onClick={checkStatus}
                disabled={isLoading}
                className="flex-1"
              >
                Check Status
              </Button>
            )}
            
            {status === 'failed' && (
              <Button 
                onClick={startVerification}
                disabled={isLoading}
                className="flex-1"
              >
                Try Again
              </Button>
            )}

            <Button 
              variant="outline" 
              onClick={() => navigate('/profile')}
              className="flex-1"
            >
              Back to Profile
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-pan-gray">
            Powered by Stripe Identity • Your data is encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;