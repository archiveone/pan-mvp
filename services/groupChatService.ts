import { supabase } from '@/lib/supabase';

export interface GroupChat {
  id: string;
  group_name: string;
  group_image_url?: string;
  created_by: string;
  created_at: string;
  member_count: number;
  members?: GroupMember[];
  last_message?: any;
}

export interface GroupMember {
  user_id: string;
  is_admin: boolean;
  profile?: {
    name: string;
    username: string;
    avatar_url?: string;
  };
}

export class GroupChatService {
  /**
   * Create a new group chat
   */
  static async createGroupChat(
    groupName: string,
    memberIds: string[],
    groupImageUrl?: string
  ): Promise<{ success: boolean; conversationId?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('create_group_chat', {
        p_creator_id: user.id,
        p_group_name: groupName,
        p_member_ids: memberIds,
        p_group_image_url: groupImageUrl
      });

      if (error) throw error;

      console.log('✅ Group chat created:', data);
      return { success: true, conversationId: data };
    } catch (error: any) {
      console.error('❌ Error creating group chat:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add member to group chat
   */
  static async addMember(
    conversationId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('add_group_member', {
        p_conversation_id: conversationId,
        p_user_id: userId,
        p_added_by: user.id
      });

      if (error) throw error;

      console.log('✅ Member added to group');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error adding member:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove member from group chat
   */
  static async removeMember(
    conversationId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('remove_group_member', {
        p_conversation_id: conversationId,
        p_user_id: userId,
        p_removed_by: user.id
      });

      if (error) throw error;

      console.log('✅ Member removed from group');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error removing member:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Leave group chat
   */
  static async leaveGroup(
    conversationId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('leave_group_chat', {
        p_conversation_id: conversationId,
        p_user_id: user.id
      });

      if (error) throw error;

      console.log('✅ Left group chat');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error leaving group:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update group details
   */
  static async updateGroup(
    conversationId: string,
    updates: { group_name?: string; group_image_url?: string }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update(updates)
        .eq('id', conversationId);

      if (error) throw error;

      console.log('✅ Group updated');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error updating group:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get group members
   */
  static async getGroupMembers(
    conversationId: string
  ): Promise<GroupMember[]> {
    try {
      // Get participants
      const { data: participants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId);

      if (participantsError) throw participantsError;

      // Get admins
      const { data: admins, error: adminsError } = await supabase
        .from('group_chat_admins')
        .select('user_id')
        .eq('conversation_id', conversationId);

      if (adminsError) throw adminsError;

      const adminIds = new Set(admins?.map(a => a.user_id) || []);

      // Get profiles
      const userIds = participants?.map(p => p.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .in('id', userIds);

      const members: GroupMember[] = (participants || []).map(p => ({
        user_id: p.user_id,
        is_admin: adminIds.has(p.user_id),
        profile: profiles?.find(prof => prof.id === p.user_id)
      }));

      return members;
    } catch (error) {
      console.error('Error loading group members:', error);
      return [];
    }
  }

  /**
   * Make user admin
   */
  static async makeAdmin(
    conversationId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('group_chat_admins')
        .insert({
          conversation_id: conversationId,
          user_id: userId
        });

      if (error) throw error;

      console.log('✅ User promoted to admin');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error making admin:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove admin status
   */
  static async removeAdmin(
    conversationId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('group_chat_admins')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;

      console.log('✅ Admin status removed');
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error removing admin:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is admin
   */
  static async isAdmin(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('group_chat_admins')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .single();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  }
}

