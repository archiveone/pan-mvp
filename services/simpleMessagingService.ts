import { supabase } from '../lib/supabase';

export interface SimpleMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface SimpleConversation {
  id: string;
  user_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar?: string;
  last_message?: SimpleMessage;
  unread_count: number;
}

export class SimpleMessagingService {
  /**
   * Get user's conversations (simplified)
   */
  static async getConversations(userId: string): Promise<{ success: boolean; conversations?: SimpleConversation[]; error?: string }> {
    try {
      // Get all messages where user is sender or receiver
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, name, avatar_url)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation (pair of users)
      const conversationMap = new Map<string, SimpleConversation>();

      messages?.forEach(message => {
        const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;
        const otherUserName = message.sender_id === userId ? message.receiver?.name : message.sender?.name;
        const otherUserAvatar = message.sender_id === userId ? message.receiver?.avatar_url : message.sender?.avatar_url;
        const conversationKey = [userId, otherUserId].sort().join('-');

        if (!conversationMap.has(conversationKey)) {
          conversationMap.set(conversationKey, {
            id: conversationKey,
            user_id: userId,
            other_user_id: otherUserId,
            other_user_name: otherUserName || 'Unknown User',
            other_user_avatar: otherUserAvatar,
            last_message: message,
            unread_count: message.receiver_id === userId && !message.is_read ? 1 : 0
          });
        } else {
          const conversation = conversationMap.get(conversationKey)!;
          if (!conversation.last_message || new Date(message.created_at) > new Date(conversation.last_message.created_at)) {
            conversation.last_message = message;
          }
          if (message.receiver_id === userId && !message.is_read) {
            conversation.unread_count += 1;
          }
        }
      });

      const conversations = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.last_message?.created_at || 0).getTime() - new Date(a.last_message?.created_at || 0).getTime());

      return { success: true, conversations };
    } catch (error) {
      console.error('Error getting conversations:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get messages between two users
   */
  static async getMessages(userId1: string, userId2: string, limit: number = 50): Promise<{ success: boolean; messages?: SimpleMessage[]; error?: string }> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, name, avatar_url)
        `)
        .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', userId1)
        .eq('sender_id', userId2)
        .eq('is_read', false);

      return { success: true, messages: messages || [] };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a message
   */
  static async sendMessage(
    senderId: string,
    receiverId: string,
    content: string
  ): Promise<{ success: boolean; message?: SimpleMessage; error?: string }> {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          content: content.trim(),
          is_read: false,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, name, avatar_url)
        `)
        .single();

      if (error) throw error;

      return { success: true, message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create or get conversation with a user
   */
  static async createConversation(userId: string, otherUserId: string): Promise<{ success: boolean; conversation?: SimpleConversation; error?: string }> {
    try {
      // Check if conversation already exists
      const conversationsResult = await this.getConversations(userId);
      if (conversationsResult.success && conversationsResult.conversations) {
        const existingConversation = conversationsResult.conversations.find(
          conv => conv.other_user_id === otherUserId
        );
        if (existingConversation) {
          return { success: true, conversation: existingConversation };
        }
      }

      // Get other user's profile
      const { data: otherUser, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .eq('id', otherUserId)
        .single();

      if (profileError) throw profileError;

      // Create new conversation
      const conversation: SimpleConversation = {
        id: `${userId}-${otherUserId}`,
        user_id: userId,
        other_user_id: otherUserId,
        other_user_name: otherUser.name || 'Unknown User',
        other_user_avatar: otherUser.avatar_url,
        unread_count: 0
      };

      return { success: true, conversation };
    } catch (error) {
      console.error('Error creating conversation:', error);
      return { success: false, error: error.message };
    }
  }
}
