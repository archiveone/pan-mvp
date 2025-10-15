import { supabase } from '@/lib/supabase';

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  messagesEnabled: boolean;
  bookingsEnabled: boolean;
  salesEnabled: boolean;
  reviewsEnabled: boolean;
  followersEnabled: boolean;
  priceDropsEnabled: boolean;
  recommendationsEnabled: boolean;
  marketingEnabled: boolean;
  smartDigestEnabled: boolean;
  digestFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface SmartNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  actionLabel?: string;
  imageUrl?: string;
  icon?: string;
  color?: string;
  isRead: boolean;
  createdAt: Date;
  relatedType?: string;
  relatedId?: string;
}

class SmartNotificationsService {
  // Get user's notification preferences
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data || this.getDefaultPreferences();
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  // Update notification preferences
  async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>) {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error updating preferences:', error);
      return { success: false, error };
    }
  }

  // Get user's notifications
  async getNotifications(
    userId: string,
    filters?: {
      unreadOnly?: boolean;
      type?: string;
      limit?: number;
    }
  ): Promise<SmartNotification[]> {
    try {
      let query = supabase
        .from('enhanced_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.unreadOnly) {
        query = query.eq('is_read', false);
      }

      if (filters?.type) {
        query = query.eq('notification_type', filters.type);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('enhanced_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('enhanced_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error };
    }
  }

  // Mark all as read
  async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('enhanced_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error marking all as read:', error);
      return { success: false, error };
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('enhanced_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error };
    }
  }

  // Create price drop alert
  async createPriceDropAlert(
    userId: string,
    listingId: string,
    listingType: string,
    currentPrice: number,
    thresholdPercentage: number = 10
  ) {
    try {
      const { data, error } = await supabase
        .from('price_drop_alerts')
        .insert({
          user_id: userId,
          listing_id: listingId,
          listing_type: listingType,
          original_price: currentPrice,
          alert_threshold_percentage: thresholdPercentage,
          last_checked_price: currentPrice
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      // Ignore duplicate alert errors
      if (error?.code === '23505') {
        return { success: true, data: null };
      }
      console.error('Error creating price alert:', error);
      return { success: false, error };
    }
  }

  // Get user's price alerts
  async getPriceAlerts(userId: string) {
    try {
      const { data, error } = await supabase
        .from('price_drop_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting price alerts:', error);
      return [];
    }
  }

  // Remove price alert
  async removePriceAlert(alertId: string) {
    try {
      const { error } = await supabase
        .from('price_drop_alerts')
        .update({ is_active: false })
        .eq('id', alertId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error removing price alert:', error);
      return { success: false, error };
    }
  }

  // Create event reminder
  async createEventReminder(
    userId: string,
    eventId: string,
    minutesBefore: number = 60
  ) {
    try {
      const { data, error } = await supabase
        .from('event_reminders')
        .insert({
          user_id: userId,
          event_id: eventId,
          reminder_type: 'before',
          remind_before_minutes: minutesBefore
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      if (error?.code === '23505') {
        return { success: true, data: null };
      }
      console.error('Error creating event reminder:', error);
      return { success: false, error };
    }
  }

  // Trigger notification (called by system/triggers)
  async sendNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    options?: {
      actionUrl?: string;
      actionLabel?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      imageUrl?: string;
      icon?: string;
      color?: string;
      relatedType?: string;
      relatedId?: string;
    }
  ) {
    try {
      // Check user preferences
      const prefs = await this.getPreferences(userId);
      if (!prefs?.inAppEnabled) return { success: false };

      // Check category-specific preferences
      const categoryEnabled = this.isCategoryEnabled(type, prefs);
      if (!categoryEnabled) return { success: false };

      // Check quiet hours
      if (prefs?.quietHoursEnabled && this.isQuietHours(prefs)) {
        // Schedule for later or skip based on priority
        if (options?.priority !== 'urgent') {
          return { success: false, reason: 'quiet_hours' };
        }
      }

      // Create notification
      const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_type: type,
        p_title: title,
        p_message: message,
        p_action_url: options?.actionUrl,
        p_priority: options?.priority || 'normal',
        p_related_id: options?.relatedId
      });

      if (error) throw error;

      // Send push notification if enabled
      if (prefs?.pushEnabled) {
        await this.sendPushNotification(userId, title, message, options?.actionUrl);
      }

      // Send email if enabled and high priority
      if (prefs?.emailEnabled && (options?.priority === 'high' || options?.priority === 'urgent')) {
        await this.sendEmailNotification(userId, title, message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, error };
    }
  }

  // Helper: Check if category is enabled
  private isCategoryEnabled(type: string, prefs: NotificationPreferences): boolean {
    const categoryMap: { [key: string]: keyof NotificationPreferences } = {
      message: 'messagesEnabled',
      booking: 'bookingsEnabled',
      sale: 'salesEnabled',
      review: 'reviewsEnabled',
      follow: 'followersEnabled',
      price_drop: 'priceDropsEnabled',
      recommendation: 'recommendationsEnabled'
    };

    const key = categoryMap[type];
    return key ? prefs[key] as boolean : true;
  }

  // Helper: Check if in quiet hours
  private isQuietHours(prefs: NotificationPreferences): boolean {
    if (!prefs.quietHoursStart || !prefs.quietHoursEnd) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = prefs.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = prefs.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  // Helper: Send push notification
  private async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    url?: string
  ) {
    // TODO: Implement with web push API or service worker
    console.log('Push notification:', { userId, title, body, url });
  }

  // Helper: Send email notification
  private async sendEmailNotification(
    userId: string,
    subject: string,
    body: string
  ) {
    // TODO: Implement with email service (SendGrid, etc.)
    console.log('Email notification:', { userId, subject, body });
  }

  // Default preferences
  private getDefaultPreferences(): NotificationPreferences {
    return {
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: false,
      inAppEnabled: true,
      messagesEnabled: true,
      bookingsEnabled: true,
      salesEnabled: true,
      reviewsEnabled: true,
      followersEnabled: true,
      priceDropsEnabled: true,
      recommendationsEnabled: true,
      marketingEnabled: false,
      smartDigestEnabled: true,
      digestFrequency: 'daily',
      quietHoursEnabled: false
    };
  }

  // Batch notifications for digest
  async sendDigest(userId: string, frequency: 'daily' | 'weekly') {
    try {
      const timeframe = frequency === 'daily' ? 1 : 7;
      const since = new Date();
      since.setDate(since.getDate() - timeframe);

      // Get unread notifications
      const notifications = await this.getNotifications(userId, {
        unreadOnly: true
      });

      if (notifications.length === 0) return { success: true };

      // Group by type
      const grouped = notifications.reduce((acc: any, notif) => {
        acc[notif.type] = acc[notif.type] || [];
        acc[notif.type].push(notif);
        return acc;
      }, {});

      // Create digest message
      const summary = Object.entries(grouped)
        .map(([type, items]: [string, any]) => `${items.length} ${type}(s)`)
        .join(', ');

      await this.sendNotification(
        userId,
        'system',
        `Your ${frequency} digest`,
        `You have ${notifications.length} updates: ${summary}`,
        {
          actionUrl: '/notifications',
          priority: 'low'
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Error sending digest:', error);
      return { success: false, error };
    }
  }
}

export const smartNotifications = new SmartNotificationsService();

