import { supabase } from '../lib/supabase';
import { EncryptionService } from './encryptionService';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  content: string;
  content_hash: string;
  reply_to_id?: string;
  edited_at?: string;
  is_deleted: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url: string;
  };
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  delivery_status?: MessageDeliveryStatus[];
}

export interface MessageAttachment {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  thumbnail_url?: string;
}

export interface MessageReaction {
  id: string;
  user_id: string;
  reaction: string;
  created_at: string;
}

export interface MessageDeliveryStatus {
  id: string;
  user_id: string;
  status: 'sent' | 'delivered' | 'read';
  timestamp: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'channel';
  name?: string;
  description?: string;
  avatar_url?: string;
  created_by: string;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
  participants: ConversationParticipant[];
  last_message?: Message;
  unread_count: number;
}

export interface ConversationParticipant {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  last_read_at?: string;
  is_muted: boolean;
  is_archived: boolean;
  user: {
    id: string;
    full_name: string;
    avatar_url: string;
    last_seen_at: string;
  };
}

export class MessagingService {
  /**
   * Initialize user's encryption keys
   */
  static async initializeUserEncryption(userId: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Generate key pair
      const { publicKey, privateKey } = EncryptionService.generateKeyPair();
      
      // Encrypt private key with user's password
      const encryptedPrivateKey = EncryptionService.encryptMessage(privateKey, password);
      
      // Store keys in database
      const { error } = await supabase
        .from('user_encryption_keys')
        .insert({
          user_id: userId,
          public_key: publicKey,
          private_key_encrypted: JSON.stringify(encryptedPrivateKey),
          key_version: 1
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new conversation
   */
  static async createConversation(
    type: 'direct' | 'group' | 'channel',
    participantIds: string[],
    name?: string,
    description?: string
  ): Promise<{ success: boolean; conversation?: Conversation; error?: string }> {
    try {
      // Generate shared encryption key for group chats
      const sharedKey = type === 'direct' ? null : EncryptionService.generateSharedKey();
      
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          type,
          name,
          description,
          is_encrypted: true,
          encryption_key_encrypted: sharedKey ? JSON.stringify({ key: sharedKey }) : null
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      const participants = participantIds.map(userId => ({
        conversation_id: conversation.id,
        user_id: userId,
        role: userId === conversation.created_by ? 'admin' : 'member'
      }));

      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      return { success: true, conversation };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send an encrypted message
   */
  static async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text',
    replyToId?: string,
    attachments?: MessageAttachment[]
  ): Promise<{ success: boolean; message?: Message; error?: string }> {
    try {
      // Get conversation encryption key
      const { data: conversation } = await supabase
        .from('conversations')
        .select('encryption_key_encrypted')
        .eq('id', conversationId)
        .single();

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // For now, we'll use a simple encryption approach
      // In production, you'd decrypt the shared key with user's private key
      const sharedKey = conversation.encryption_key_encrypted 
        ? JSON.parse(conversation.encryption_key_encrypted).key 
        : EncryptionService.generateSharedKey();

      // Encrypt message content
      const encryptedContent = EncryptionService.encryptMessage(content, sharedKey);
      const contentHash = EncryptionService.generateMessageHash(content);

      // Create message
      const { data: message, error: messageError } = await supabase
        .from('encrypted_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          message_type: messageType,
          content_encrypted: JSON.stringify(encryptedContent),
          content_hash: contentHash,
          reply_to_id: replyToId,
          encryption_metadata: {
            algorithm: 'AES-256-CBC',
            key_version: 1
          }
        })
        .select(`
          *,
          sender:profiles!encrypted_messages_sender_id_fkey(id, full_name, avatar_url)
        `)
        .single();

      if (messageError) throw messageError;

      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        const encryptedAttachments = attachments.map(attachment => ({
          message_id: message.id,
          file_name: attachment.file_name,
          file_type: attachment.file_type,
          file_size: attachment.file_size,
          file_url_encrypted: EncryptionService.encryptMessage(attachment.file_url, sharedKey).encrypted,
          thumbnail_url_encrypted: attachment.thumbnail_url 
            ? EncryptionService.encryptMessage(attachment.thumbnail_url, sharedKey).encrypted 
            : null,
          encryption_metadata: {
            algorithm: 'AES-256-CBC',
            key_version: 1
          }
        }));

        await supabase
          .from('message_attachments')
          .insert(encryptedAttachments);
      }

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return { success: true, message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get messages for a conversation
   */
  static async getMessages(
    conversationId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ success: boolean; messages?: Message[]; error?: string }> {
    try {
      // Get conversation encryption key
      const { data: conversation } = await supabase
        .from('conversations')
        .select('encryption_key_encrypted')
        .eq('id', conversationId)
        .single();

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Get encrypted messages
      const { data: messages, error: messagesError } = await supabase
        .from('encrypted_messages')
        .select(`
          *,
          sender:profiles!encrypted_messages_sender_id_fkey(id, full_name, avatar_url),
          attachments:message_attachments(id, file_name, file_type, file_size, file_url_encrypted, thumbnail_url_encrypted),
          reactions:message_reactions(id, user_id, reaction_encrypted, created_at),
          delivery_status:message_delivery_status(id, user_id, status, timestamp)
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (messagesError) throw messagesError;

      // Decrypt messages
      const sharedKey = conversation.encryption_key_encrypted 
        ? JSON.parse(conversation.encryption_key_encrypted).key 
        : EncryptionService.generateSharedKey();

      const decryptedMessages = messages.map(msg => {
        try {
          const encryptedData = JSON.parse(msg.content_encrypted);
          const decryptedContent = EncryptionService.decryptMessage(encryptedData, sharedKey);
          
          return {
            ...msg,
            content: decryptedContent.success ? decryptedContent.decrypted : '[Encrypted]',
            attachments: msg.attachments?.map(att => ({
              ...att,
              file_url: EncryptionService.decryptMessage(
                JSON.parse(att.file_url_encrypted), 
                sharedKey
              ).decrypted,
              thumbnail_url: att.thumbnail_url_encrypted 
                ? EncryptionService.decryptMessage(
                    JSON.parse(att.thumbnail_url_encrypted), 
                    sharedKey
                  ).decrypted 
                : null
            })),
            reactions: msg.reactions?.map(reaction => ({
              ...reaction,
              reaction: EncryptionService.decryptMessage(
                JSON.parse(reaction.reaction_encrypted), 
                sharedKey
              ).decrypted
            }))
          };
        } catch (error) {
          return {
            ...msg,
            content: '[Decryption failed]',
            attachments: [],
            reactions: []
          };
        }
      });

      return { success: true, messages: decryptedMessages };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's conversations
   */
  static async getConversations(userId: string): Promise<{ success: boolean; conversations?: Conversation[]; error?: string }> {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            *,
            user:profiles!conversation_participants_user_id_fkey(id, full_name, avatar_url, last_seen_at)
          ),
          last_message:encrypted_messages(
            *,
            sender:profiles!encrypted_messages_sender_id_fkey(id, full_name, avatar_url)
          )
        `)
        .eq('participants.user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return { success: true, conversations };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark message as read
   */
  static async markAsRead(conversationId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Update participant's last_read_at
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      // Update delivery status for unread messages
      const { data: messages } = await supabase
        .from('encrypted_messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (messages && messages.length > 0) {
        const deliveryStatuses = messages.map(msg => ({
          message_id: msg.id,
          user_id: userId,
          status: 'read',
          timestamp: new Date().toISOString()
        }));

        await supabase
          .from('message_delivery_status')
          .upsert(deliveryStatuses);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Add reaction to message
   */
  static async addReaction(
    messageId: string,
    userId: string,
    reaction: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get conversation encryption key
      const { data: message } = await supabase
        .from('encrypted_messages')
        .select('conversation_id, conversations(encryption_key_encrypted)')
        .eq('id', messageId)
        .single();

      if (!message) {
        throw new Error('Message not found');
      }

      const sharedKey = message.conversations.encryption_key_encrypted 
        ? JSON.parse(message.conversations.encryption_key_encrypted).key 
        : EncryptionService.generateSharedKey();

      // Encrypt reaction
      const encryptedReaction = EncryptionService.encryptMessage(reaction, sharedKey);

      // Add or update reaction
      await supabase
        .from('message_reactions')
        .upsert({
          message_id: messageId,
          user_id: userId,
          reaction_encrypted: JSON.stringify(encryptedReaction)
        });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete message
   */
  static async deleteMessage(messageId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await supabase
        .from('encrypted_messages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', userId);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
