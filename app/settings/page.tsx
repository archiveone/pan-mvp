'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Bell, Shield, Palette, Globe, CreditCard, Eye, EyeOff, Download, Trash2, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';

interface UserSettings {
  // Privacy settings
  show_stats: boolean;
  show_followers: boolean;
  show_posts: boolean;
  profile_visibility: 'public' | 'private' | 'friends';
  
  // Notification settings
  email_notifications: boolean;
  push_notifications: boolean;
  new_messages: boolean;
  community_updates: boolean;
  listing_updates: boolean;
  promotional_emails: boolean;
  
  // App settings
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  timezone: string;
  
  // Security settings
  two_factor_enabled: boolean;
  login_alerts: boolean;
}

const defaultSettings: UserSettings = {
  show_stats: true,
  show_followers: true,
  show_posts: true,
  profile_visibility: 'public',
  email_notifications: true,
  push_notifications: true,
  new_messages: true,
  community_updates: true,
  listing_updates: true,
  promotional_emails: false,
  theme: 'system',
  language: 'en',
  currency: 'USD',
  timezone: 'UTC',
  two_factor_enabled: false,
  login_alerts: true,
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'appearance' | 'security' | 'account'>('profile');

  useEffect(() => {
    if (user) {
      loadUserSettings();
    }
  }, [user]);

  const loadUserSettings = async () => {
    if (!user) return;

    try {
      // Load settings from user profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Merge profile data with default settings
      const userSettings = {
        ...defaultSettings,
        show_stats: profileData.show_stats ?? defaultSettings.show_stats,
        show_followers: profileData.show_followers ?? defaultSettings.show_followers,
        show_posts: profileData.show_posts ?? defaultSettings.show_posts,
        profile_visibility: profileData.profile_visibility ?? defaultSettings.profile_visibility,
        theme: theme,
      };

      setSettings(userSettings);
    } catch (error) {
      console.error('Error loading user settings:', error);
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updatedSettings: Partial<UserSettings>) => {
    if (!user) return;

    setSaving(true);
    try {
      const newSettings = { ...settings, ...updatedSettings };
      setSettings(newSettings);

      // Update profile with new settings
      const { error } = await supabase
        .from('profiles')
        .update({
          show_stats: newSettings.show_stats,
          show_followers: newSettings.show_followers,
          show_posts: newSettings.show_posts,
          profile_visibility: newSettings.profile_visibility,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Handle theme change
      if (updatedSettings.theme && updatedSettings.theme !== theme) {
        toggleTheme();
      }

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await signOut();
      router.push('/login');
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      if (confirm('This will permanently delete all your data. Type "DELETE" to confirm.')) {
        try {
          // In a real implementation, you'd call a delete account API
          alert('Account deletion would be implemented here.');
        } catch (error) {
          console.error('Error deleting account:', error);
          alert('Failed to delete account. Please contact support.');
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Eye },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'account', label: 'Account', icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
          {/* Sidebar */}
          <div className="lg:col-span-3">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={20} className="mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main content */}
          <div className="lg:col-span-9">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900 capitalize">
                  {activeTab} Settings
                </h2>
              </div>

              <div className="px-6 py-6">
                {activeTab === 'profile' && (
                  <ProfileSettings 
                    settings={settings} 
                    onSave={saveSettings} 
                    saving={saving}
                  />
                )}

                {activeTab === 'notifications' && (
                  <NotificationSettings 
                    settings={settings} 
                    onSave={saveSettings} 
                    saving={saving}
                  />
                )}

                {activeTab === 'privacy' && (
                  <PrivacySettings 
                    settings={settings} 
                    onSave={saveSettings} 
                    saving={saving}
                  />
                )}

                {activeTab === 'appearance' && (
                  <AppearanceSettings 
                    settings={settings} 
                    onSave={saveSettings} 
                    saving={saving}
                  />
                )}

                {activeTab === 'security' && (
                  <SecuritySettings 
                    settings={settings} 
                    onSave={saveSettings} 
                    saving={saving}
                  />
                )}

                {activeTab === 'account' && (
                  <AccountSettings 
                    settings={settings} 
                    onSave={saveSettings} 
                    saving={saving}
                    onLogout={handleLogout}
                    onDeleteAccount={handleDeleteAccount}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Settings Component
function ProfileSettings({ settings, onSave, saving }: { 
  settings: UserSettings; 
  onSave: (settings: Partial<UserSettings>) => void; 
  saving: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900">Profile Visibility</h3>
        <p className="text-sm text-gray-500">Control who can see your profile information</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Visibility Level</label>
          <select
            value={settings.profile_visibility}
            onChange={(e) => onSave({ profile_visibility: e.target.value as any })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="public">Public - Anyone can see your profile</option>
            <option value="friends">Friends Only - Only your connections can see</option>
            <option value="private">Private - Only you can see your profile</option>
          </select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Show Statistics</h4>
              <p className="text-sm text-gray-500">Display your activity stats on your profile</p>
            </div>
            <button
              onClick={() => onSave({ show_stats: !settings.show_stats })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.show_stats ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.show_stats ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Show Followers</h4>
              <p className="text-sm text-gray-500">Display your follower count</p>
            </div>
            <button
              onClick={() => onSave({ show_followers: !settings.show_followers })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.show_followers ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.show_followers ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Show Posts</h4>
              <p className="text-sm text-gray-500">Display your posts on your profile</p>
            </div>
            <button
              onClick={() => onSave({ show_posts: !settings.show_posts })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.show_posts ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.show_posts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {saving && (
        <div className="text-sm text-blue-600">Saving settings...</div>
      )}
    </div>
  );
}

// Notification Settings Component
function NotificationSettings({ settings, onSave, saving }: { 
  settings: UserSettings; 
  onSave: (settings: Partial<UserSettings>) => void; 
  saving: boolean;
}) {
  const notificationOptions = [
    {
      key: 'email_notifications' as const,
      title: 'Email Notifications',
      description: 'Receive notifications via email',
    },
    {
      key: 'push_notifications' as const,
      title: 'Push Notifications',
      description: 'Receive push notifications in your browser',
    },
    {
      key: 'new_messages' as const,
      title: 'New Messages',
      description: 'Get notified when someone sends you a message',
    },
    {
      key: 'community_updates' as const,
      title: 'Community Updates',
      description: 'Notifications for new posts in communities you follow',
    },
    {
      key: 'listing_updates' as const,
      title: 'Listing Updates',
      description: 'Updates about your listings or saved items',
    },
    {
      key: 'promotional_emails' as const,
      title: 'Promotional Emails',
      description: 'Receive special offers and platform news',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900">Notification Preferences</h3>
        <p className="text-sm text-gray-500">Choose how you want to be notified about activity</p>
      </div>

      <div className="space-y-4">
        {notificationOptions.map((option) => (
          <div key={option.key} className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">{option.title}</h4>
              <p className="text-sm text-gray-500">{option.description}</p>
            </div>
            <button
              onClick={() => onSave({ [option.key]: !settings[option.key] })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings[option.key] ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings[option.key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {saving && (
        <div className="text-sm text-blue-600">Saving settings...</div>
      )}
    </div>
  );
}

// Privacy Settings Component
function PrivacySettings({ settings, onSave, saving }: { 
  settings: UserSettings; 
  onSave: (settings: Partial<UserSettings>) => void; 
  saving: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900">Privacy Controls</h3>
        <p className="text-sm text-gray-500">Manage your privacy and data sharing preferences</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Shield className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Data Protection</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Your personal information is encrypted and stored securely. We never share your data with third parties without your explicit consent.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-900">Profile Visibility</h4>
          <p className="text-sm text-gray-500 mb-3">Control who can see your profile information</p>
          <select
            value={settings.profile_visibility}
            onChange={(e) => onSave({ profile_visibility: e.target.value as any })}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="public">Public - Anyone can see your profile</option>
            <option value="friends">Friends Only - Only your connections can see</option>
            <option value="private">Private - Only you can see your profile</option>
          </select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Show Activity Statistics</h4>
              <p className="text-sm text-gray-500">Display your activity stats on your profile</p>
            </div>
            <button
              onClick={() => onSave({ show_stats: !settings.show_stats })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.show_stats ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.show_stats ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Show Follower Count</h4>
              <p className="text-sm text-gray-500">Display your follower count publicly</p>
            </div>
            <button
              onClick={() => onSave({ show_followers: !settings.show_followers })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.show_followers ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.show_followers ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Show Posts Publicly</h4>
              <p className="text-sm text-gray-500">Display your posts on your public profile</p>
            </div>
            <button
              onClick={() => onSave({ show_posts: !settings.show_posts })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.show_posts ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.show_posts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {saving && (
        <div className="text-sm text-blue-600">Saving settings...</div>
      )}
    </div>
  );
}

// Appearance Settings Component
function AppearanceSettings({ settings, onSave, saving }: { 
  settings: UserSettings; 
  onSave: (settings: Partial<UserSettings>) => void; 
  saving: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900">Appearance</h3>
        <p className="text-sm text-gray-500">Customize how the app looks and feels</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => onSave({ theme: e.target.value as any })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">Choose your preferred color scheme</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Language</label>
          <select
            value={settings.language}
            onChange={(e) => onSave({ language: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Currency</label>
          <select
            value={settings.currency}
            onChange={(e) => onSave({ currency: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="CAD">CAD - Canadian Dollar</option>
            <option value="AUD">AUD - Australian Dollar</option>
            <option value="JPY">JPY - Japanese Yen</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Timezone</label>
          <select
            value={settings.timezone}
            onChange={(e) => onSave({ timezone: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
          </select>
        </div>
      </div>

      {saving && (
        <div className="text-sm text-blue-600">Saving settings...</div>
      )}
    </div>
  );
}

// Security Settings Component
function SecuritySettings({ settings, onSave, saving }: { 
  settings: UserSettings; 
  onSave: (settings: Partial<UserSettings>) => void; 
  saving: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900">Security</h3>
        <p className="text-sm text-gray-500">Manage your account security and authentication</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Shield className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>Keep your account secure by using strong passwords and enabling two-factor authentication when available.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
            <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
          </div>
          <button
            onClick={() => onSave({ two_factor_enabled: !settings.two_factor_enabled })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.two_factor_enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.two_factor_enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Login Alerts</h4>
            <p className="text-sm text-gray-500">Get notified when someone logs into your account</p>
          </div>
          <button
            onClick={() => onSave({ login_alerts: !settings.login_alerts })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.login_alerts ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.login_alerts ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Change Password</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input
              type="password"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input
              type="password"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input
              type="password"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Update Password
          </button>
        </div>
      </div>

      {saving && (
        <div className="text-sm text-blue-600">Saving settings...</div>
      )}
    </div>
  );
}

// Account Settings Component
function AccountSettings({ 
  settings, 
  onSave, 
  saving, 
  onLogout, 
  onDeleteAccount 
}: { 
  settings: UserSettings; 
  onSave: (settings: Partial<UserSettings>) => void; 
  saving: boolean;
  onLogout: () => void;
  onDeleteAccount: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900">Account Management</h3>
        <p className="text-sm text-gray-500">Manage your account data and preferences</p>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Export Data</h4>
          <p className="text-sm text-gray-500 mb-3">Download a copy of all your data</p>
          <button className="flex items-center text-blue-600 hover:text-blue-700">
            <Download size={16} className="mr-2" />
            Download Data
          </button>
        </div>

        <div className="border border-gray-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Account Actions</h4>
          <div className="space-y-3">
            <button
              onClick={onLogout}
              className="flex items-center text-gray-600 hover:text-gray-700"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </button>
          </div>
        </div>

        <div className="border border-red-200 rounded-md p-4 bg-red-50">
          <h4 className="text-sm font-medium text-red-900 mb-2">Danger Zone</h4>
          <p className="text-sm text-red-700 mb-3">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={onDeleteAccount}
            className="flex items-center text-red-600 hover:text-red-700"
          >
            <Trash2 size={16} className="mr-2" />
            Delete Account
          </button>
        </div>
      </div>

      {saving && (
        <div className="text-sm text-blue-600">Saving settings...</div>
      )}
    </div>
  );
}
