'use client';

import React, { useState } from 'react';
import { MessageCircle, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MessagingService } from '@/services/messagingService';

interface ContactButtonProps {
  postId: string;
  sellerId: string;
  sellerName: string;
  className?: string;
}

export default function ContactButton({ postId, sellerId, sellerName, className = '' }: ContactButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContact = async () => {
    if (!user) {
      // Redirect to login or show auth modal
      alert('Please sign in to contact the seller');
      return;
    }

    if (user.id === sellerId) {
      alert('You cannot contact yourself');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if conversation already exists
      const existingConversations = await MessagingService.getUserConversations();
      
      if (Array.isArray(existingConversations)) {
        const existingConv = existingConversations.find((conv: any) => 
          conv.type === 'direct' && 
          conv.participants.some((p: any) => p.user_id === sellerId)
        );

        if (existingConv) {
          // Redirect to existing conversation
          window.location.href = `/messages?conversation=${existingConv.id}`;
          return;
        }
      }

      // Create new conversation
      const result = await MessagingService.getOrCreateConversation(sellerId);

      if (result.success && result.conversationId) {
        // Redirect to new conversation
        window.location.href = `/messages?conversation=${result.conversationId}`;
      } else {
        setError(result.error || 'Failed to start conversation');
      }
    } catch (err) {
      setError('Failed to contact seller');
    } finally {
      setLoading(false);
    }
  };

  if (user?.id === sellerId) {
    return null; // Don't show contact button for own posts
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleContact}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <MessageCircle size={16} />
        )}
        {loading ? 'Starting chat...' : 'Contact Seller'}
      </button>
      
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
}
