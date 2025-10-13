'use client';

import React, { useState, useEffect } from 'react';
import { MessagingService, Conversation } from '@/services/messagingService';
import { Check, X, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const MessageRequests: React.FC = () => {
  const [requests, setRequests] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    const data = await MessagingService.getMessageRequests();
    setRequests(data);
    setLoading(false);
  };

  const handleAccept = async (conversationId: string) => {
    const result = await MessagingService.acceptMessageRequest(conversationId);
    if (result.success) {
      setRequests(prev => prev.filter(r => r.id !== conversationId));
      // Optionally navigate to the conversation
      router.push(`/inbox/${conversationId}`);
    }
  };

  const handleDecline = async (conversationId: string) => {
    const result = await MessagingService.declineMessageRequest(conversationId);
    if (result.success) {
      // Optionally delete immediately or just hide
      await MessagingService.deleteMessageRequest(conversationId);
      setRequests(prev => prev.filter(r => r.id !== conversationId));
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No message requests</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {requests.map((request) => {
        const otherParticipant = request.participants?.find(
          (p: any) => p.user_id !== request.participants[0]?.user_id
        );
        const profile = otherParticipant?.profile;

        return (
          <div
            key={request.id}
            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {(profile?.name || profile?.username || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {profile?.name || profile?.username || 'Unknown User'}
                </h3>
                {profile?.username && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{profile.username}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Message request
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAccept(request.id)}
                  className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                  title="Accept"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDecline(request.id)}
                  className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full transition-colors"
                  title="Decline"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessageRequests;

