'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MessagingService, Message, Conversation } from '@/services/messagingService';

export function useMessaging(userId: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await MessagingService.getConversations(userId);
      if (result.success && result.conversations) {
        setConversations(result.conversations);
      } else {
        setError(result.error || 'Failed to load conversations');
      }
    } catch (err) {
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!userId) return;
    
    try {
      const result = await MessagingService.getMessages(conversationId, userId);
      if (result.success && result.messages) {
        setMessages(result.messages);
      } else {
        setError(result.error || 'Failed to load messages');
      }
    } catch (err) {
      setError('Failed to load messages');
    }
  }, [userId]);

  // Send a message
  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text'
  ) => {
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    try {
      const result = await MessagingService.sendMessage(
        conversationId,
        userId,
        content,
        messageType
      );
      
      if (result.success) {
        // Reload messages to show the new one
        await loadMessages(conversationId);
      }
      
      return result;
    } catch (err) {
      return { success: false, error: 'Failed to send message' };
    }
  }, [userId, loadMessages]);

  // Mark conversation as read
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!userId) return;
    
    try {
      await MessagingService.markAsRead(conversationId, userId);
      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  }, [userId]);

  // Add reaction to message
  const addReaction = useCallback(async (messageId: string, reaction: string) => {
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    try {
      return await MessagingService.addReaction(messageId, userId, reaction);
    } catch (err) {
      return { success: false, error: 'Failed to add reaction' };
    }
  }, [userId]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    try {
      const result = await MessagingService.deleteMessage(messageId, userId);
      if (result.success) {
        // Remove message from local state
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
      return result;
    } catch (err) {
      return { success: false, error: 'Failed to delete message' };
    }
  }, [userId]);

  // Create new conversation
  const createConversation = useCallback(async (
    type: 'direct' | 'group' | 'channel',
    participantIds: string[],
    name?: string,
    description?: string
  ) => {
    if (!userId) return { success: false, error: 'User not authenticated' };
    
    try {
      const result = await MessagingService.createConversation(
        type,
        [userId, ...participantIds],
        name,
        description
      );
      
      if (result.success && result.conversation) {
        setConversations(prev => [result.conversation!, ...prev]);
      }
      
      return result;
    } catch (err) {
      return { success: false, error: 'Failed to create conversation' };
    }
  }, [userId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel('encrypted_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'encrypted_messages'
        },
        (payload) => {
          // Handle new message
          console.log('New message received:', payload);
          // You might want to decrypt and add to local state here
        }
      )
      .subscribe();

    // Subscribe to conversation updates
    const conversationsSubscription = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          // Handle conversation updates
          console.log('Conversation updated:', payload);
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      conversationsSubscription.unsubscribe();
    };
  }, [userId]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    messages,
    loading,
    error,
    loadConversations,
    loadMessages,
    sendMessage,
    markAsRead,
    addReaction,
    deleteMessage,
    createConversation
  };
}
