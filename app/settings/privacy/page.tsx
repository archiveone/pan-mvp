'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Shield, Lock, User, Users, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface PrivacySettings {
  profile_visibility: 'public' | 'private' | 'friends';
  show_stats: boolean;
  show_followers: boolean;
  show_posts: boolean;
  show_online_status: boolean;
  allow_messages_from: 'everyone' | 'friends' | 'none';
  show_email: boolean;
  show_phone: boolean;
  allow_search_indexing: boolean;
  data_sharing: boolean;
}

const defaultPrivacySettings: PrivacySettings = {
  profile_visibility: 'public',
  show_stats: true,
  show_followers: true,
  show_posts: true,
  show_online_status: true,
  allow_messages_from: 'everyone',
  show_email: false,
  show_phone: false,
  allow_search_indexing: true,
  data_sharing: false,
};

export default function PrivacySettingsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>(defaultPrivacySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && profile) {
      loadPrivacySettings();
    }
  }, [user, profile]);

  const loadPrivacySettings = async () => {
    if (!user || !profile) return;

    try {
      // Load settings from user profile
      const userSettings = {
        profile_visibility: profile.profile_visibility || 'public',
        show_stats: profile.show_stats ?? true,
        show_followers: profile.show_followers ?? true,
        show_posts: profile.show_posts ?? true,
        show_online_status: true, // Default
        allow_messages_from: 'everyone' as const,
        show_email: false, // Default
        show_phone: false, // Default
        allow_search_indexing: true, // Default
        data_sharing: false, // Default
      };

      setSettings(userSettings);
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      setSettings(defaultPrivacySettings);
    } finally {
      setLoading(false);
    }
  };

  const savePrivacySettings = async (updatedSettings: Partial<PrivacySettings>) => {
    if (!user) return;

    setSaving(true);
    try {
      const newSettings = { ...settings, ...updatedSettings };
      setSettings(newSettings);

      // Update profile with new privacy settings
      const { error } = await supabase
        .from('profiles')
        .update({
          profile_visibility: newSettings.profile_visibility,
          show_stats: newSettings.show_stats,
          show_followers: newSettings.show_followers,
          show_posts: newSettings.show_posts,
        })
        .eq('id', user.id);

      if (error) throw error;

      alert('Privacy settings saved successfully!');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      alert('Failed to save privacy settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key: keyof PrivacySettings) => {
    if (key === 'profile_visibility' || key === 'allow_messages_from') {
      return; // These are handled by select dropdowns
    }
    savePrivacySettings({ [key]: !settings[key] });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const privacyCategories = [
    {
      title: 'Profile Visibility',
      icon: Eye,
      description: 'Control who can see your profile information',
      settings: [
        {
          type: 'select',
          key: 'profile_visibility' as const,
          title: 'Profile Visibility',
          description: 'Choose who can view your profile',
          options: [
            { value: 'public', label: 'Public - Anyone can see your profile' },
            { value: 'friends', label: 'Friends Only - Only your connections can see' },
            { value: 'private', label: 'Private - Only you can see your profile' },
          ],
        },
      ],
    },
    {
      title: 'Information Sharing',
      icon: User,
      description: 'Control what information is visible on your profile',
      settings: [
        {
          type: 'toggle',
          key: 'show_stats' as const,
          title: 'Show Activity Statistics',
          description: 'Display your activity stats on your profile',
          icon: Shield,
        },
        {
          type: 'toggle',
          key: 'show_followers' as const,
          title: 'Show Follower Count',
          description: 'Display your follower count publicly',
          icon: Users,
        },
        {
          type: 'toggle',
          key: 'show_posts' as const,
          title: 'Show Posts Publicly',
          description: 'Display your posts on your public profile',
          icon: Globe,
        },
        {
          type: 'toggle',
          key: 'show_online_status' as const,
          title: 'Show Online Status',
          description: 'Let others see when you are online',
          icon: Eye,
        },
      ],
    },
    {
      title: 'Communication',
      icon: Lock,
      description: 'Control who can contact you and how',
      settings: [
        {
          type: 'select',
          key: 'allow_messages_from' as const,
          title: 'Allow Messages From',
          description: 'Choose who can send you direct messages',
          options: [
            { value: 'everyone', label: 'Everyone - Anyone can message you' },
            { value: 'friends', label: 'Friends Only - Only your connections' },
            { value: 'none', label: 'No One - Disable direct messages' },
          ],
        },
      ],
    },
    {
      title: 'Contact Information',
      icon: EyeOff,
      description: 'Control the visibility of your contact details',
      settings: [
        {
          type: 'toggle',
          key: 'show_email' as const,
          title: 'Show Email Address',
          description: 'Display your email address on your profile',
          icon: Eye,
        },
        {
          type: 'toggle',
          key: 'show_phone' as const,
          title: 'Show Phone Number',
          description: 'Display your phone number on your profile',
          icon: Eye,
        },
      ],
    },
    {
      title: 'Search & Discovery',
      icon: Globe,
      description: 'Control how others can find and discover you',
      settings: [
        {
          type: 'toggle',
          key: 'allow_search_indexing' as const,
          title: 'Allow Search Indexing',
          description: 'Allow search engines to index your profile',
          icon: Globe,
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
              <h1 className="text-xl font-semibold text-gray-900">Privacy Settings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Privacy Notice */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Your Privacy Matters</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  We respect your privacy and give you control over your personal information. 
                  Your data is encrypted and stored securely. We never share your personal 
                  information with third parties without your explicit consent.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {privacyCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.title} className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <Icon size={20} className="mr-3 text-gray-500" />
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">{category.title}</h2>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-6">
                  <div className="space-y-6">
                    {category.settings.map((setting) => {
                      const SettingIcon = setting.icon;
                      
                      if (setting.type === 'select') {
                        return (
                          <div key={setting.key}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {setting.title}
                            </label>
                            <p className="text-sm text-gray-500 mb-3">{setting.description}</p>
                            <select
                              value={settings[setting.key]}
                              onChange={(e) => savePrivacySettings({ [setting.key]: e.target.value })}
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                              {setting.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      }

                      return (
                        <div key={setting.key} className="flex items-center justify-between">
                          <div className="flex items-center">
                            {SettingIcon && (
                              <SettingIcon size={20} className="mr-3 text-gray-400" />
                            )}
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

        {/* Data Protection Notice */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <Lock className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Data Protection</h3>
              <div className="mt-2 text-sm text-green-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Your personal data is encrypted using industry-standard encryption</li>
                  <li>We comply with GDPR and other privacy regulations</li>
                  <li>You can request a copy of your data or delete your account at any time</li>
                  <li>We never sell your personal information to third parties</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {saving && (
          <div className="mt-4 text-center">
            <div className="text-sm text-blue-600">Saving privacy settings...</div>
          </div>
        )}
      </div>
    </div>
  );
}
