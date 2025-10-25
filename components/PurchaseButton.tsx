'use client';

import React, { useState } from 'react';
import { ShoppingCart, Download, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { purchasePost, addFreeContentToLibrary, getPurchaseButtonText } from '@/services/purchaseService';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/useToast';

interface PurchaseButtonProps {
  post: any;
  className?: string;
  onSuccess?: () => void;
}

export default function PurchaseButton({ post, className = '', onSuccess }: PurchaseButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState(false);

  const isFree = !post.is_for_sale || post.price_amount === 0;
  const buttonText = getPurchaseButtonText(post);

  const handlePurchase = async () => {
    if (!user) {
      router.push('/login?redirect=' + (typeof window !== 'undefined' ? window.location.pathname : '/'));
      return;
    }

    setLoading(true);

    try {
      if (isFree) {
        // Free content - just add to library
        await addFreeContentToLibrary(post.id, user.id);
        setPurchased(true);
        onSuccess?.();
        
        // Show success message
        toast.success('Added to your library!');
      } else {
        // Paid content - go through Stripe
        const result = await purchasePost({
          postId: post.id,
          userId: user.id,
          amount: post.price_amount,
          metadata: {
            post_type: post.post_type,
            title: post.title,
          },
        });

        setPurchased(true);
        onSuccess?.();

        // Show success and redirect to library
        toast.success('Purchase successful! Check your library.');
        
        // Redirect based on type
        const redirectPath = {
          event: '/my-tickets',
          booking: '/my-bookings',
          product: '/my-purchases',
        }[post.post_type] || '/my-library';

        router.push(redirectPath);
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error('Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render toast container
  const ToastContainer = toast.ToastContainer;

  if (purchased) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg ${className}`}
      >
        <Check className="w-5 h-5" />
        <span>Purchased!</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handlePurchase}
        disabled={loading}
        className={`flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${className}`}
      >
        {isFree ? (
          <Download className="w-5 h-5" />
        ) : (
          <ShoppingCart className="w-5 h-5" />
        )}
        <span>{loading ? 'Processing...' : buttonText}</span>
      </button>
      <ToastContainer />
    </>
  );
}

