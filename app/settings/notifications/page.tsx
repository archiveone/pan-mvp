'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, BellOff, Mail, Smartphone, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface NotificationSettings {
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
}

const defaultNotificationSettings: NotificationSettings = {
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
};

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotificationSettings();
    }
  }, [user]);

  const loadNotificationSettings = async () => {
    if (!user) return;

    try {
      // Load settings from user profile or a dedicated settings table
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // For now, use default settings
      // In a real implementation, you'd store these in a user_settings table
      setSettings(defaultNotificationSettings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      setSettings(defaultNotificationSettings);
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async (updatedSettings: Partial<NotificationSettings>) => {
    if (!user) return;

    setSaving(true);
    try {
      const newSettings = { ...settings, ...updatedSettings };
      setSettings(newSettings);

      // In a real implementation, you'd save these to a user_settings table
      // For now, we'll just update the local state
      alert('Notification settings saved successfully!');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      alert('Failed to save notification settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    saveNotificationSettings({ [key]: !settings[key] });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const notificationCategories = [
    {
      title: 'General Notifications',
      icon: Bell,
      settings: [
        {
          key: 'email_notifications' as const,
          title: 'Email Notifications',
          description: 'Receive notifications via email',
          icon: Mail,
        },
        {
          key: 'push_notifications' as const,
          title: 'Push Notifications',
          description: 'Receive push notifications on your device',
          icon: Smartphone,
        },
        {
          key: 'browser_notifications' as const,
          title: 'Browser Notifications',
          description: 'Show notifications in your browser',
          icon: Globe,
        },
      ],
    },
    {
      title: 'Activity Notifications',
      icon: Bell,
      settings: [
        {
          key: 'new_messages' as const,
          title: 'New Messages',
          description: 'Get notified when someone sends you a message',
          icon: Bell,
        },
        {
          key: 'community_updates' as const,
          title: 'Community Updates',
          description: 'Notifications for new posts in communities you follow',
          icon: Bell,
        },
        {
          key: 'listing_updates' as const,
          title: 'Listing Updates',
          description: 'Updates about your listings or saved items',
          icon: Bell,
        },
      ],
    },
    {
      title: 'Marketing & Updates',
      icon: Bell,
      settings: [
        {
          key: 'promotional_emails' as const,
          title: 'Promotional Emails',
          description: 'Receive special offers and platform news',
          icon: Mail,
        },
        {
          key: 'weekly_digest' as const,
          title: 'Weekly Digest',
          description: 'Get a weekly summary of your activity',
          icon: Bell,
        },
      ],
    },
    {
      title: 'Security & Alerts',
      icon: Bell,
      settings: [
        {
          key: 'security_alerts' as const,
          title: 'Security Alerts',
          description: 'Important security notifications',
          icon: Bell,
        },
        {
          key: 'price_alerts' as const,
          title: 'Price Alerts',
          description: 'Notifications when items you want change price',
          icon: Bell,
        },
      ],
    },
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
              <h1 className="text-xl font-semibold text-gray-900">Notification Settings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {notificationCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.title} className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <Icon size={20} className="mr-3 text-gray-500" />
                    <h2 className="text-lg font-medium text-gray-900">{category.title}</h2>
                  </div>
                </div>

                <div className="px-6 py-6">
                  <div className="space-y-6">
                    {category.settings.map((setting) => {
                      const SettingIcon = setting.icon;
                      return (
                        <div key={setting.key} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <SettingIcon size={20} className="mr-3 text-gray-400" />
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">
                                {setting.title}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {setting.description}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleSetting(setting.key)}
                            disabled={saving}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                              settings[setting.key] ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                settings[setting.key] ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          </div>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  const allOn = Object.keys(settings).reduce((acc, key) => {
                    acc[key as keyof NotificationSettings] = true;
                    return acc;
                  }, {} as NotificationSettings);
                  saveNotificationSettings(allOn);
                }}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Bell size={16} className="mr-2" />
                Turn All On
              </button>
              <button
                onClick={() => {
                  const allOff = Object.keys(settings).reduce((acc, key) => {
                    acc[key as keyof NotificationSettings] = false;
                    return acc;
                  }, {} as NotificationSettings);
                  saveNotificationSettings(allOff);
                }}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <BellOff size={16} className="mr-2" />
                Turn All Off
              </button>
            </div>
          </div>
        </div>

        {saving && (
          <div className="mt-4 text-center">
            <div className="text-sm text-blue-600">Saving notification settings...</div>
          </div>
        )}
      </div>
    </div>
  );
}
