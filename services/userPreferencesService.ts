import { supabase } from '../lib/supabase';

export interface UserPreferences {
  // Privacy settings
  profile_visibility: 'public' | 'private' | 'friends';
  show_stats: boolean;
  show_followers: boolean;
  show_posts: boolean;
  show_online_status: boolean;
  allow_messages_from: 'everyone' | 'friends' | 'none';
  show_email: boolean;
  show_phone: boolean;
  allow_search_indexing: boolean;
  
  // Notification settings
  email_notifications: boolean;
  push_notifications: boolean;
  browser_notifications: boolean;
  new_messages: boolean;
  community_updates: boolean;
  listing_updates: boolean;
  promotional_emails: boolean;
  weekly_digest: boolean;
  security_alerts: boolean;
  price_alerts: boolean;
  
  // App settings
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  timezone: string;
  
  // Security settings
  two_factor_enabled: boolean;
  login_alerts: boolean;
  
  // Data sharing
  data_sharing: boolean;
}

const defaultPreferences: UserPreferences = {
  profile_visibility: 'public',
  show_stats: true,
  show_followers: true,
  show_posts: true,
  show_online_status: true,
  allow_messages_from: 'everyone',
  show_email: false,
  show_phone: false,
  allow_search_indexing: true,
  email_notifications: true,
  push_notifications: true,
  browser_notifications: true,
  new_messages: true,
  community_updates: true,
  listing_updates: true,
  promotional_emails: false,
  weekly_digest: true,
  security_alerts: true,
  price_alerts: false,
  theme: 'system',
  language: 'en',
  currency: 'USD',
  timezone: 'UTC',
  two_factor_enabled: false,
  login_alerts: true,
  data_sharing: false,
};

export class UserPreferencesService {
  /**
   * Get user preferences from the database
   */
  static async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      // First try to get from a dedicated preferences table
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!preferencesError && preferencesData) {
        return { ...defaultPreferences, ...preferencesData.preferences };
      }

      // Fallback to profile table for basic settings
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('profile_visibility, show_stats, show_followers, show_posts')
        .eq('id', userId)
        .single();

      if (!profileError && profileData) {
        return {
          ...defaultPreferences,
          profile_visibility: profileData.profile_visibility || 'public',
          show_stats: profileData.show_stats ?? true,
          show_followers: profileData.show_followers ?? true,
          show_posts: profileData.show_posts ?? true,
        };
      }

      return defaultPreferences;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return defaultPreferences;
    }
  }

  /**
   * Save user preferences to the database
   */
  static async saveUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<{ success: boolean; error?: string }> {
    try {
      // Try to save to dedicated preferences table
      const { error: upsertError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          preferences: preferences,
          updated_at: new Date().toISOString(),
        });

      if (!upsertError) {
        return { success: true };
      }

      // If preferences table doesn't exist, save basic settings to profile table
      const profileUpdates: any = {};
      
      if (preferences.profile_visibility !== undefined) {
        profileUpdates.profile_visibility = preferences.profile_visibility;
      }
      if (preferences.show_stats !== undefined) {
        profileUpdates.show_stats = preferences.show_stats;
      }
      if (preferences.show_followers !== undefined) {
        profileUpdates.show_followers = preferences.show_followers;
      }
      if (preferences.show_posts !== undefined) {
        profileUpdates.show_posts = preferences.show_posts;
      }

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', userId);

        if (profileError) throw profileError;
      }

      // Store other preferences in localStorage as fallback
      if (typeof window !== 'undefined') {
        const storedPreferences = this.getStoredPreferences();
        const updatedPreferences = { ...storedPreferences, ...preferences };
        localStorage.setItem('user_preferences', JSON.stringify(updatedPreferences));
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error saving user preferences:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get preferences stored in localStorage (fallback)
   */
  static getStoredPreferences(): Partial<UserPreferences> {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem('user_preferences');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error parsing stored preferences:', error);
      return {};
    }
  }

  /**
   * Save preferences to localStorage (fallback)
   */
  static saveStoredPreferences(preferences: Partial<UserPreferences>): void {
    if (typeof window === 'undefined') return;
    
    try {
      const existing = this.getStoredPreferences();
      const updated = { ...existing, ...preferences };
      localStorage.setItem('user_preferences', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving preferences to localStorage:', error);
    }
  }

  /**
   * Get notification preferences specifically
   */
  static async getNotificationPreferences(userId: string): Promise<Partial<UserPreferences>> {
    const preferences = await this.getUserPreferences(userId);
    return {
      email_notifications: preferences.email_notifications,
      push_notifications: preferences.push_notifications,
      browser_notifications: preferences.browser_notifications,
      new_messages: preferences.new_messages,
      community_updates: preferences.community_updates,
      listing_updates: preferences.listing_updates,
      promotional_emails: preferences.promotional_emails,
      weekly_digest: preferences.weekly_digest,
      security_alerts: preferences.security_alerts,
      price_alerts: preferences.price_alerts,
    };
  }

  /**
   * Save notification preferences specifically
   */
  static async saveNotificationPreferences(userId: string, notificationPrefs: Partial<UserPreferences>): Promise<{ success: boolean; error?: string }> {
    return this.saveUserPreferences(userId, notificationPrefs);
  }

  /**
   * Get privacy preferences specifically
   */
  static async getPrivacyPreferences(userId: string): Promise<Partial<UserPreferences>> {
    const preferences = await this.getUserPreferences(userId);
    return {
      profile_visibility: preferences.profile_visibility,
      show_stats: preferences.show_stats,
      show_followers: preferences.show_followers,
      show_posts: preferences.show_posts,
      show_online_status: preferences.show_online_status,
      allow_messages_from: preferences.allow_messages_from,
      show_email: preferences.show_email,
      show_phone: preferences.show_phone,
      allow_search_indexing: preferences.allow_search_indexing,
      data_sharing: preferences.data_sharing,
    };
  }

  /**
   * Save privacy preferences specifically
   */
  static async savePrivacyPreferences(userId: string, privacyPrefs: Partial<UserPreferences>): Promise<{ success: boolean; error?: string }> {
    return this.saveUserPreferences(userId, privacyPrefs);
  }

  /**
   * Reset preferences to defaults
   */
  static async resetPreferences(userId: string): Promise<{ success: boolean; error?: string }> {
    return this.saveUserPreferences(userId, defaultPreferences);
  }

  /**
   * Export user data (GDPR compliance)
   */
  static async exportUserData(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Get user posts
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId);

      if (postsError) throw postsError;

      // Get user messages (sent)
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', userId);

      if (messagesError) throw messagesError;

      // Get user preferences
      const preferences = await this.getUserPreferences(userId);

      const exportData = {
        profile,
        posts,
        messages,
        preferences,
        exported_at: new Date().toISOString(),
      };

      return { success: true, data: exportData };
    } catch (error: any) {
      console.error('Error exporting user data:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete user data (GDPR compliance)
   */
  static async deleteUserData(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete user preferences
      await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', userId);

      // Delete user posts
      await supabase
        .from('posts')
        .delete()
        .eq('user_id', userId);

      // Delete user messages (both sent and received)
      await supabase
        .from('messages')
        .delete()
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);

      // Delete user profile
      await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_preferences');
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting user data:', error);
      return { success: false, error: error.message };
    }
  }
}
