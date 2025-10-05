import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Shield, CheckCircle } from 'lucide-react';
import { paymentService } from '../services/paymentService';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import Button from '../components/Button';

const PaymentPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'link'>('card');
  
  const { currentUser } = useAuth();
  const { posts } = usePosts();
  const navigate = useNavigate();

  useEffect(() => {
    if (postId) {
      const foundPost = posts.find(p => p.id === postId);
      setPost(foundPost);
    }
  }, [postId, posts]);

  const handlePayment = async () => {
    if (!post || !currentUser) return;

    setIsLoading(true);
    setError(null);

    try {
      if (paymentMethod === 'card') {
        // Create payment intent
        const result = await paymentService.createPaymentIntent(
          post.id,
          currentUser.id,
          post.user.id,
          post.priceInfo?.amount || 0,
          'usd'
        );

        if (result) {
          // Process payment with Stripe
          const paymentResult = await paymentService.processPayment(result.clientSecret);
          
          if (paymentResult.success) {
            navigate('/payment/success');
          } else {
            setError(paymentResult.error || 'Payment failed');
          }
        } else {
          setError('Failed to create payment intent');
        }
      } else {
        // Create payment link
        const result = await paymentService.createPaymentLink(
          post.id,
          post.priceInfo?.amount || 0,
          'usd'
        );

        if (result) {
          window.open(result.url, '_blank');
        } else {
          setError('Failed to create payment link');
        }
      }
    } catch (err) {
      setError('Payment processing failed');
      console.error('Payment error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
        <Button onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-pan-gray-dark mr-2">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Complete Purchase</h1>
      </div>

      <div className="max-w-md mx-auto">
        <div className="bg-gray-50 dark:bg-pan-gray-dark rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-2">{post.title}</h2>
          <p className="text-gray-600 dark:text-pan-gray-light mb-4">{post.content}</p>
          
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">${post.priceInfo?.amount || 0}</span>
            <span className="text-sm text-gray-500 dark:text-pan-gray">
              {post.priceInfo?.unit === 'per_hour' ? '/hour' : 
               post.priceInfo?.unit === 'per_ticket' ? '/ticket' : 
               post.priceInfo?.unit === 'per_item' ? '/item' : ''}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Payment Method</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-pan-gray-dark">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'card')}
                />
                <CreditCard size={20} />
                <span>Credit/Debit Card</span>
              </label>
              
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-pan-gray-dark">
                <input
                  type="radio"
                  name="payment"
                  value="link"
                  checked={paymentMethod === 'link'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'link')}
                />
                <Shield size={20} />
                <span>Payment Link (External)</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">Secure Payment</span>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300">
              Your payment is processed securely by Stripe. We never store your payment information.
            </p>
          </div>

          <Button 
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Processing...' : `Pay $${post.priceInfo?.amount || 0}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
