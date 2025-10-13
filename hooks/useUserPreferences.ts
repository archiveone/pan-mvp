import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserPreferencesService, UserPreferences } from '@/services/userPreferencesService';

export function useUserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load preferences when user changes
  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      setPreferences(null);
      setLoading(false);
    }
  }, [user]);

  const loadPreferences = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userPreferences = await UserPreferencesService.getUserPreferences(user.id);
      setPreferences(userPreferences);
    } catch (error) {
      console.error('Error loading user preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const savePreferences = useCallback(async (newPreferences: Partial<UserPreferences>) => {
    if (!user || !preferences) return { success: false, error: 'No user or preferences loaded' };

    setSaving(true);
    try {
      const result = await UserPreferencesService.saveUserPreferences(user.id, newPreferences);
      
      if (result.success) {
        setPreferences({ ...preferences, ...newPreferences });
      }
      
      return result;
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  }, [user, preferences]);

  const resetPreferences = useCallback(async () => {
    if (!user) return { success: false, error: 'No user' };

    setSaving(true);
    try {
      const result = await UserPreferencesService.resetPreferences(user.id);
      
      if (result.success) {
        await loadPreferences(); // Reload preferences
      }
      
      return result;
    } catch (error: any) {
      console.error('Error resetting preferences:', error);
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  }, [user, loadPreferences]);

  const exportUserData = useCallback(async () => {
    if (!user) return { success: false, error: 'No user' };

    try {
      const result = await UserPreferencesService.exportUserData(user.id);
      return result;
    } catch (error: any) {
      console.error('Error exporting user data:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  const deleteUserData = useCallback(async () => {
    if (!user) return { success: false, error: 'No user' };

    try {
      const result = await UserPreferencesService.deleteUserData(user.id);
      return result;
    } catch (error: any) {
      console.error('Error deleting user data:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  return {
    preferences,
    loading,
    saving,
    savePreferences,
    resetPreferences,
    exportUserData,
    deleteUserData,
    loadPreferences,
  };
}

// Hook for notification preferences specifically
export function useNotificationPreferences() {
  const { user } = useAuth();
  const [notificationPrefs, setNotificationPrefs] = useState<Partial<UserPreferences> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotificationPreferences();
    } else {
      setNotificationPrefs(null);
      setLoading(false);
    }
  }, [user]);

  const loadNotificationPreferences = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const prefs = await UserPreferencesService.getNotificationPreferences(user.id);
      setNotificationPrefs(prefs);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveNotificationPreferences = useCallback(async (newPrefs: Partial<UserPreferences>) => {
    if (!user) return { success: false, error: 'No user' };

    setSaving(true);
    try {
      const result = await UserPreferencesService.saveNotificationPreferences(user.id, newPrefs);
      
      if (result.success) {
        setNotificationPrefs({ ...notificationPrefs, ...newPrefs });
      }
      
      return result;
    } catch (error: any) {
      console.error('Error saving notification preferences:', error);
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  }, [user, notificationPrefs]);

  return {
    notificationPrefs,
    loading,
    saving,
    saveNotificationPreferences,
    loadNotificationPreferences,
  };
}

// Hook for privacy preferences specifically
export function usePrivacyPreferences() {
  const { user } = useAuth();
  const [privacyPrefs, setPrivacyPrefs] = useState<Partial<UserPreferences> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadPrivacyPreferences();
    } else {
      setPrivacyPrefs(null);
      setLoading(false);
    }
  }, [user]);

  const loadPrivacyPreferences = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const prefs = await UserPreferencesService.getPrivacyPreferences(user.id);
      setPrivacyPrefs(prefs);
    } catch (error) {
      console.error('Error loading privacy preferences:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const savePrivacyPreferences = useCallback(async (newPrefs: Partial<UserPreferences>) => {
    if (!user) return { success: false, error: 'No user' };

    setSaving(true);
    try {
      const result = await UserPreferencesService.savePrivacyPreferences(user.id, newPrefs);
      
      if (result.success) {
        setPrivacyPrefs({ ...privacyPrefs, ...newPrefs });
      }
      
      return result;
    } catch (error: any) {
      console.error('Error saving privacy preferences:', error);
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  }, [user, privacyPrefs]);

  return {
    privacyPrefs,
    loading,
    saving,
    savePrivacyPreferences,
    loadPrivacyPreferences,
  };
}
