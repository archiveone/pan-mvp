import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationService, Notification, NotificationType } from '@/services/notificationService';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load notifications when user changes
  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
      subscribeToRealtimeNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
    }
  }, [user]);

  const loadNotifications = useCallback(async (limit: number = 50) => {
    if (!user) return;

    setLoading(true);
    setError(null);
    
    try {
      const result = await NotificationService.getUserNotifications(limit);
      
      if (result.success && result.data) {
        setNotifications(result.data);
      } else {
        setError(result.error || 'Failed to load notifications');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const result = await NotificationService.getUnreadCount();
      if (result.success && typeof result.count === 'number') {
        setUnreadCount(result.count);
      }
    } catch (error: any) {
      console.error('Error loading unread count:', error);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const result = await NotificationService.markAsRead(notificationId);
      
      if (result.success) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return { success: false, error: 'No user' };

    try {
      const result = await NotificationService.markAllAsRead();
      
      if (result.success) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, is_read: true }))
        );
        setUnreadCount(0);
      }
      
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [user]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const result = await NotificationService.deleteNotification(notificationId);
      
      if (result.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        // Update unread count if the deleted notification was unread
        const deletedNotification = notifications.find(n => n.id === notificationId);
        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
      
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [notifications]);

  const createNotification = useCallback(async (
    type: NotificationType
  ) => {
    // This is handled server-side via NotificationService methods
    return { success: true };
  }, [user]);

  const subscribeToRealtimeNotifications = useCallback(() => {
    if (!user) return;

    const subscription = NotificationService.subscribeToNotifications(
      user.id,
      (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    );

    return () => subscription.unsubscribe();
  }, [user]);

  const refreshNotifications = useCallback(() => {
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refreshNotifications,
    loadNotifications,
  };
}

// Hook for notification preferences
export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      setPreferences(null);
    }
  }, [user]);

  const loadPreferences = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Placeholder - preferences can be added later
      setPreferences({});
    } catch (error: any) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updatePreferences = useCallback(async (newPreferences: any) => {
    if (!user) return { success: false, error: 'No user' };

    setSaving(true);
    try {
      setPreferences(prev => ({ ...prev, ...newPreferences }));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  }, [user]);

  return {
    preferences,
    loading,
    saving,
    updatePreferences,
    loadPreferences,
  };
}

// Hook for browser notification permission
export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return { success: false, error: 'Browser does not support notifications' };
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return { success: result === 'granted' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  const sendNotification = useCallback(async (
    title: string,
    body: string
  ) => {
    if (permission === 'granted' && 'Notification' in window) {
      new Notification(title, { body });
      return { success: true };
    }
    return { success: false };
  }, [permission]);

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
    canSendNotifications: permission === 'granted',
  };
}
