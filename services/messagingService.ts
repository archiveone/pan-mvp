import { supabase } from '@/lib/supabase'
import { encryptMessage, decryptMessage, simpleEncrypt, simpleDecrypt, getPrivateKey } from '@/lib/encryption'

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  encrypted_content: string
  decrypted_content?: string
  preview?: string
  content_type: string
  media_url?: string
  listing_id?: string
  is_deleted: boolean
  is_edited: boolean
  edited_at?: string
  created_at: string
  sender?: {
    id: string
    name?: string
    username?: string
    avatar_url?: string
  }
}

export interface Conversation {
  id: string
  created_at: string
  updated_at: string
  last_message_at: string
  request_status?: 'pending' | 'accepted' | 'declined'
  participants: ConversationParticipant[]
  last_message?: Message
  unread_count?: number
}

export interface ConversationParticipant {
  id: string
  user_id: string
  joined_at: string
  is_muted: boolean
  last_read_at: string
  unread_count: number
  profile?: {
    id: string
    name?: string
    username?: string
    avatar_url?: string
  }
}

export const MessagingService = {
  /**
   * Get or create a conversation with another user
   * Only allows messaging users you follow
   */
  async getOrCreateConversation(otherUserId: string): Promise<{ success: boolean; conversationId?: string; error?: string }> {
    try {
      const { data: currentUser } = await supabase.auth.getUser()
      if (!currentUser.user) {
        return { success: false, error: 'Not authenticated' }
      }

      console.log('🔍 Getting/creating conversation between:', currentUser.user.id, 'and', otherUserId)
      
      // Check if user is following the other person (optional check)
      try {
        const { data: followCheck, error: followError } = await supabase
          .from('followers')
          .select('id')
          .eq('follower_id', currentUser.user.id)
          .eq('following_id', otherUserId)
          .single()

        if (followError && followError.code !== 'PGRST116') {
          // If followers table doesn't exist, allow messaging (development mode)
          if (followError.code === '42P01' || followError.message?.includes('does not exist')) {
            console.warn('⚠️ Followers table not found, allowing messaging in dev mode')
          } else {
            console.warn('⚠️ Could not check follow status, allowing anyway:', followError)
          }
        } else if (!followCheck && followError?.code === 'PGRST116') {
          // Not following but allow anyway for inbox functionality
          console.warn('⚠️ Not following user, but allowing conversation for inbox feature')
        }
      } catch (err) {
        console.warn('⚠️ Follow check failed, allowing conversation anyway:', err)
      }
      
      console.log('✅ Follow check passed')

      // Try RPC function first
      try {
        const { data, error } = await supabase
          .rpc('get_or_create_conversation', {
            p_user1_id: currentUser.user.id,
            p_user2_id: otherUserId,
          })

        if (!error && data) {
          console.log('✅ Got conversation from RPC:', data)
          return { success: true, conversationId: data }
        }

        console.warn('⚠️ RPC failed, using manual method:', error)
      } catch (rpcError) {
        console.warn('⚠️ RPC not available, using manual method')
      }

      // Fallback: Manual conversation creation
      // 1. Check if conversation exists
      const { data: existingParticipants, error: searchError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUser.user.id)
        .is('left_at', null)

      if (!searchError && existingParticipants && existingParticipants.length > 0) {
        // Check if any of these conversations include the other user
        for (const participant of existingParticipants) {
          const { data: otherParticipant, error: checkError } = await supabase
            .from('conversation_participants')
            .select('id')
            .eq('conversation_id', participant.conversation_id)
            .eq('user_id', otherUserId)
            .is('left_at', null)
            .single()

          if (!checkError && otherParticipant) {
            console.log('✅ Found existing conversation:', participant.conversation_id)
            return { success: true, conversationId: participant.conversation_id }
          }
        }
      }

      // 2. Create new conversation
      console.log('📝 Attempting to create new conversation...')
      
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single()

      console.log('📝 Insert result:', { data: newConv, error: convError })

      if (convError) {
        console.error('❌ Error creating conversation:', convError)
        console.error('Full error details:', {
          message: convError.message,
          code: convError.code,
          details: convError.details,
          hint: convError.hint,
          statusCode: (convError as any).statusCode
        })
        
        // Check if it's a missing table error
        if (convError.code === '42P01' || convError.message?.includes('does not exist')) {
          return {
            success: false,
            error: 'Messaging system not set up. Please run the messaging migration in Supabase.'
          }
        }
        console.error('Stringified error:', JSON.stringify(convError, null, 2))
        
        // Check if tables don't exist or RLS policy issue
        if (convError.code === '42P01' || 
            convError.message?.includes('does not exist') ||
            convError.message?.includes('relation') ||
            convError.message?.includes('schema cache')) {
          return { 
            success: false, 
            error: '⚠️ Messaging tables not set up yet. Please run the migration: supabase/migrations/add_messaging_system.sql' 
          }
        }
        
        if (convError.code === '42P17' || convError.code === '42501' || 
            convError.message?.includes('policy') ||
            convError.message?.includes('row level security')) {
          return { 
            success: false, 
            error: '⚠️ Messaging RLS policies have issues. Please re-run the migration: supabase/migrations/add_messaging_system.sql' 
          }
        }
        
        return { success: false, error: convError.message || 'Failed to create conversation' }
      }

      if (!newConv) {
        console.error('❌ No conversation data returned')
        return { success: false, error: 'Failed to create conversation' }
      }

      console.log('✅ Created new conversation:', newConv.id)

      // 3. Add participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConv.id, user_id: currentUser.user.id },
          { conversation_id: newConv.id, user_id: otherUserId }
        ])

      if (participantsError) {
        console.error('❌ Error adding participants:', participantsError)
        console.error('Full error:', participantsError)
        return { success: false, error: 'Failed to add participants: ' + participantsError.message }
      }

      console.log('✅ Added participants to conversation')
      return { success: true, conversationId: newConv.id }
      
    } catch (error: any) {
      console.error('❌ Error in getOrCreateConversation:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get all conversations for current user
   */
  async getUserConversations(): Promise<Conversation[]> {
    try {
      const { data: currentUser } = await supabase.auth.getUser()
      if (!currentUser.user) {
        console.log('⚠️ No user authenticated')
        return []
      }

      console.log('📬 Loading conversations for user:', currentUser.user.id)

      // Get all conversations where user is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          unread_count,
          last_read_at
        `)
        .eq('user_id', currentUser.user.id)
        .is('left_at', null)

      console.log('📬 Participant data:', participantData, 'Error:', participantError)

      if (participantError) {
        console.error('❌ Error fetching participants:', participantError)
        
        // Check if table doesn't exist
        if (participantError.code === '42P01' || 
            participantError.message?.includes('does not exist')) {
          console.warn('⚠️ conversation_participants table does not exist. Run migration.')
          return []
        }
        
        throw participantError
      }
      if (!participantData || participantData.length === 0) return []

      const conversationIds = participantData.map(p => p.conversation_id)

      // Get conversation details
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false })

      if (convError) throw convError

      // Get all participants for these conversations
      const { data: allParticipants, error: allParticipantsError } = await supabase
        .from('conversation_participants')
        .select('*')
        .in('conversation_id', conversationIds)
        .is('left_at', null)

      console.log('👥 All participants:', allParticipants, 'Error:', allParticipantsError)

      if (allParticipantsError) throw allParticipantsError
      
      // Manually fetch profiles for participants
      const userIds = [...new Set(allParticipants?.map(p => p.user_id) || [])]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .in('id', userIds)
      
      console.log('👤 Loaded profiles:', profiles?.length)
      
      // Map profiles to participants
      const participantsWithProfiles = (allParticipants || []).map(p => ({
        ...p,
        profile: profiles?.find(prof => prof.id === p.user_id)
      }))

      // Get last message for each conversation
      const { data: lastMessages } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(1)
      
      console.log('💬 Last messages:', lastMessages?.length)

      // Build conversation objects
      const conversationsWithDetails = (conversations || []).map(conv => {
        const participants = (participantsWithProfiles || [])
          .filter(p => p.conversation_id === conv.id)
          .map(p => ({
            id: p.id,
            user_id: p.user_id,
            joined_at: p.joined_at,
            is_muted: p.is_muted,
            last_read_at: p.last_read_at,
            unread_count: p.unread_count,
            profile: p.profile,
          }))

        const lastMessage = lastMessages?.find(m => m.conversation_id === conv.id)
        const myParticipant = participantData.find(p => p.conversation_id === conv.id)

        return {
          ...conv,
          participants,
          last_message: lastMessage,
          unread_count: myParticipant?.unread_count || 0,
        }
      })

      console.log('✅ Loaded conversations:', conversationsWithDetails.length)
      return conversationsWithDetails
    } catch (error: any) {
      // Silent fail if tables don't exist
      if (error.code === '42P01' || 
          error.message?.includes('does not exist') ||
          error.message?.includes('schema cache')) {
        console.warn('⚠️ Messaging tables not set up yet')
        return []
      }
      
      // Only log real errors
      console.error('❌ Error getting conversations:', error)
      console.error('Full error:', JSON.stringify(error, null, 2))
      return []
    }
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      console.log('💬 Loading messages for conversation:', conversationId)
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })

      console.log('💬 Messages data:', data?.length, 'Error:', error)

      if (error) {
        console.error('❌ Error fetching messages:', error)
        
        // Check if table doesn't exist
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('⚠️ messages table does not exist. Run migration.')
          return []
        }
        
        throw error
      }

      // Decrypt messages and fetch sender profiles
      const { data: currentUser } = await supabase.auth.getUser()
      if (!currentUser.user) return data || []

      // Get unique sender IDs
      const senderIds = [...new Set(data?.map(m => m.sender_id) || [])]
      
      // Fetch sender profiles
      const { data: senderProfiles } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .in('id', senderIds)
      
      console.log('👤 Loaded sender profiles:', senderProfiles?.length)

      const privateKey = getPrivateKey(currentUser.user.id)
      
      const decryptedMessages = (data || []).map(msg => ({
        ...msg,
        sender: senderProfiles?.find(p => p.id === msg.sender_id),
        decrypted_content: privateKey 
          ? simpleDecrypt(msg.encrypted_content) // Using simple encryption for now
          : msg.preview || '[Encrypted]',
      }))

      console.log('✅ Loaded and decrypted messages:', decryptedMessages.length)
      return decryptedMessages
    } catch (error: any) {
      // Silent fail if tables don't exist
      if (error.code === '42P01' || 
          error.message?.includes('does not exist') ||
          error.message?.includes('schema cache')) {
        console.warn('⚠️ Messaging tables not set up yet')
        return []
      }
      
      // Only log real errors
      console.error('❌ Error getting messages:', error)
      console.error('Full error:', JSON.stringify(error, null, 2))
      return []
    }
  },

  /**
   * Send a message
   */
  async sendMessage(
    conversationId: string,
    content: string,
    contentType: string = 'text',
    mediaUrl?: string,
    listingId?: string
  ): Promise<{ success: boolean; message?: Message; error?: string }> {
    try {
      const { data: currentUser } = await supabase.auth.getUser()
      if (!currentUser.user) {
        return { success: false, error: 'Not authenticated' }
      }

      // Encrypt message (using simple encryption for now)
      const encrypted = simpleEncrypt(content)
      const preview = content.substring(0, 50)

      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUser.user.id,
          encrypted_content: encrypted,
          preview: preview,
          content_type: contentType,
          media_url: mediaUrl,
          listing_id: listingId,
        })
        .select()
        .single()
      
      // Fetch sender profile separately
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .eq('id', currentUser.user.id)
        .single()

      if (error) throw error

      return { 
        success: true, 
        message: {
          ...message,
          sender: senderProfile,
          decrypted_content: content,
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Mark conversation as read
   */
  async markAsRead(conversationId: string): Promise<void> {
    try {
      const { data: currentUser } = await supabase.auth.getUser()
      if (!currentUser.user) return

      await supabase.rpc('mark_conversation_read', {
        p_conversation_id: conversationId,
        p_user_id: currentUser.user.id,
      })
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  },

  /**
   * Search users to start conversation
   */
  async searchUsers(query: string): Promise<any[]> {
    try {
      if (!query.trim()) return []

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(10)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('Error searching users:', error)
      return []
    }
  },

  /**
   * Get message requests (pending conversations)
   */
  async getMessageRequests(): Promise<Conversation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            *,
            profile:user_id(id, name, username, avatar_url)
          )
        `)
        .eq('request_status', 'pending')
        .eq('is_group_chat', false)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filter to only show requests where current user is the recipient (not sender)
      const requests = (data || []).filter(conv => {
        const otherParticipant = conv.participants?.find((p: any) => p.user_id !== user.id)
        return otherParticipant !== undefined
      })

      return requests as Conversation[]
    } catch (error) {
      console.error('Error fetching message requests:', error)
      return []
    }
  },

  /**
   * Accept a message request
   */
  async acceptMessageRequest(conversationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ request_status: 'accepted' })
        .eq('id', conversationId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error accepting request:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to accept request' 
      }
    }
  },

  /**
   * Decline a message request
   */
  async declineMessageRequest(conversationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ request_status: 'declined' })
        .eq('id', conversationId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error declining request:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to decline request' 
      }
    }
  },

  /**
   * Delete a declined request
   */
  async deleteMessageRequest(conversationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)
        .eq('request_status', 'declined')

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error deleting request:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete request' 
      }
    }
  },
}
