'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

interface ThemePreferences {
  accentColor: string;
  primaryGradientStart: string;
  primaryGradientEnd: string;
  darkModePreference: 'light' | 'dark' | 'system';
  defaultViewMode: 'grid' | 'list' | 'playlist';
  defaultZoomLevel: number;
}

interface ThemePreferencesContextType {
  preferences: ThemePreferences;
  updateAccentColor: (color: string) => Promise<void>;
  updateGradient: (start: string, end: string) => Promise<void>;
  updatePreferences: (prefs: Partial<ThemePreferences>) => Promise<void>;
  loading: boolean;
}

const defaultPreferences: ThemePreferences = {
  accentColor: '#10B981', // Neon green/teal
  primaryGradientStart: '#3B82F6',
  primaryGradientEnd: '#9333EA',
  darkModePreference: 'system',
  defaultViewMode: 'grid',
  defaultZoomLevel: 3,
};

const ThemePreferencesContext = createContext<ThemePreferencesContextType>({
  preferences: defaultPreferences,
  updateAccentColor: async () => {},
  updateGradient: async () => {},
  updatePreferences: async () => {},
  loading: false,
});

export function ThemePreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<ThemePreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      setPreferences(defaultPreferences);
      setLoading(false);
    }
  }, [user]);

  // Apply accent color to CSS variables
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--accent-color', preferences.accentColor);
      document.documentElement.style.setProperty('--gradient-start', preferences.primaryGradientStart);
      document.documentElement.style.setProperty('--gradient-end', preferences.primaryGradientEnd);
    }
  }, [preferences]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine for new users
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          accentColor: data.accent_color || defaultPreferences.accentColor,
          primaryGradientStart: data.primary_gradient_start || defaultPreferences.primaryGradientStart,
          primaryGradientEnd: data.primary_gradient_end || defaultPreferences.primaryGradientEnd,
          darkModePreference: data.dark_mode_preference || defaultPreferences.darkModePreference,
          defaultViewMode: data.default_view_mode || defaultPreferences.defaultViewMode,
          defaultZoomLevel: data.default_zoom_level || defaultPreferences.defaultZoomLevel,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAccentColor = async (color: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          accent_color: color,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setPreferences(prev => ({ ...prev, accentColor: color }));
    } catch (error) {
      console.error('Error updating accent color:', error);
    }
  };

  const updateGradient = async (start: string, end: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          primary_gradient_start: start,
          primary_gradient_end: end,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setPreferences(prev => ({
        ...prev,
        primaryGradientStart: start,
        primaryGradientEnd: end,
      }));
    } catch (error) {
      console.error('Error updating gradient:', error);
    }
  };

  const updatePreferences = async (prefs: Partial<ThemePreferences>) => {
    if (!user) return;

    try {
      const updateData: any = {};
      
      if (prefs.accentColor) updateData.accent_color = prefs.accentColor;
      if (prefs.primaryGradientStart) updateData.primary_gradient_start = prefs.primaryGradientStart;
      if (prefs.primaryGradientEnd) updateData.primary_gradient_end = prefs.primaryGradientEnd;
      if (prefs.darkModePreference) updateData.dark_mode_preference = prefs.darkModePreference;
      if (prefs.defaultViewMode) updateData.default_view_mode = prefs.defaultViewMode;
      if (prefs.defaultZoomLevel) updateData.default_zoom_level = prefs.defaultZoomLevel;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...updateData,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setPreferences(prev => ({ ...prev, ...prefs }));
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  return (
    <ThemePreferencesContext.Provider
      value={{
        preferences,
        updateAccentColor,
        updateGradient,
        updatePreferences,
        loading,
      }}
    >
      {children}
    </ThemePreferencesContext.Provider>
  );
}

export function useThemePreferences() {
  const context = useContext(ThemePreferencesContext);
  if (!context) {
    throw new Error('useThemePreferences must be used within ThemePreferencesProvider');
  }
  return context;
}

