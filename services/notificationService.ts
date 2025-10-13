import { supabase } from '@/lib/supabase';

export type NotificationType = 
  | 'follow'
  | 'like'
  | 'comment'
  | 'mention'
  | 'message'
  | 'group_invite'
  | 'follower_post';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  actor_id?: string;
  post_id?: string;
  comment_id?: string;
  conversation_id?: string;
  message?: string;
  is_read: boolean;
  created_at: string;
  actor?: {
    id: string;
    name?: string;
    username?: string;
    avatar_url?: string;
  };
  post?: {
    id: string;
    title?: string;
    media_url?: string;
  };
}

export class NotificationService {
  /**
   * Get all notifications for current user
   */
  static async getUserNotifications(limit = 50): Promise<{ success: boolean; data?: Notification[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id (
            id,
            name,
            username,
            avatar_url
          ),
          post:post_id (
            id,
            title,
            media_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as Notification[] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch notifications' };
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, count: count || 0 };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch count' };
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to mark as read' };
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to mark all as read' };
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete notification' };
    }
  }

  /**
   * Create a follow notification
   */
  static async notifyFollow(targetUserId: string, followerUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: targetUserId,
        p_type: 'follow',
        p_actor_id: followerUserId
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create notification' };
    }
  }

  /**
   * Create a like notification
   */
  static async notifyLike(postOwnerId: string, likerUserId: string, postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: postOwnerId,
        p_type: 'like',
        p_actor_id: likerUserId,
        p_post_id: postId
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create notification' };
    }
  }

  /**
   * Create a comment notification
   */
  static async notifyComment(postOwnerId: string, commenterUserId: string, postId: string, commentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: postOwnerId,
        p_type: 'comment',
        p_actor_id: commenterUserId,
        p_post_id: postId,
        p_comment_id: commentId
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create notification' };
    }
  }

  /**
   * Create a mention notification
   */
  static async notifyMention(mentionedUserId: string, mentionerUserId: string, postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: mentionedUserId,
        p_type: 'mention',
        p_actor_id: mentionerUserId,
        p_post_id: postId
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create notification' };
    }
  }

  /**
   * Create a message notification
   */
  static async notifyMessage(recipientUserId: string, senderUserId: string, conversationId: string, messageText: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: recipientUserId,
        p_type: 'message',
        p_actor_id: senderUserId,
        p_conversation_id: conversationId,
        p_message: messageText
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create notification' };
    }
  }

  /**
   * Create a group invite notification
   */
  static async notifyGroupInvite(invitedUserId: string, inviterUserId: string, conversationId: string, groupName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: invitedUserId,
        p_type: 'group_invite',
        p_actor_id: inviterUserId,
        p_conversation_id: conversationId,
        p_message: groupName
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create notification' };
    }
  }

  /**
   * Create follower post notification
   */
  static async notifyFollowerPost(followerIds: string[], posterUserId: string, postId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Create notifications for all followers
      const promises = followerIds.map(followerId => 
        supabase.rpc('create_notification', {
          p_user_id: followerId,
          p_type: 'follower_post',
          p_actor_id: posterUserId,
          p_post_id: postId
        })
      );

      await Promise.all(promises);

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create notifications' };
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  static subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();

    return subscription;
  }
}
