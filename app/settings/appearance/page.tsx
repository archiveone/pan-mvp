'use client';

import React, { useState } from 'react';

// Disable static generation for this page to avoid SSR issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useThemePreferences } from '@/contexts/ThemePreferencesContext';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import BottomNav from '@/components/BottomNav';
import { Palette, Sparkles, Check, RefreshCw, ArrowLeft } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Neon Green', value: '#10B981', emoji: '💚' },
  { name: 'Electric Teal', value: '#14B8A6', emoji: '💎' },
  { name: 'Lime', value: '#84CC16', emoji: '🍋' },
  { name: 'Cyan', value: '#06B6D4', emoji: '🌊' },
  { name: 'Sky Blue', value: '#0EA5E9', emoji: '☁️' },
  { name: 'Purple', value: '#9333EA', emoji: '💜' },
  { name: 'Pink', value: '#EC4899', emoji: '💗' },
  { name: 'Orange', value: '#F59E0B', emoji: '🍊' },
  { name: 'Red', value: '#EF4444', emoji: '❤️' },
  { name: 'Yellow', value: '#EAB308', emoji: '⭐' },
];

const GRADIENT_PRESETS = [
  { name: 'Blue to Purple', start: '#3B82F6', end: '#9333EA', emoji: '🌌' },
  { name: 'Green to Teal', start: '#10B981', end: '#14B8A6', emoji: '🌿' },
  { name: 'Pink to Orange', start: '#EC4899', end: '#F59E0B', emoji: '🌅' },
  { name: 'Cyan to Blue', start: '#06B6D4', end: '#3B82F6', emoji: '🌊' },
  { name: 'Purple to Pink', start: '#9333EA', end: '#EC4899', emoji: '🎨' },
];

export default function AppearanceSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { preferences, updateAccentColor, updateGradient, loading } = useThemePreferences();
  
  const [selectedAccent, setSelectedAccent] = useState(preferences.accentColor);
  const [selectedGradientStart, setSelectedGradientStart] = useState(preferences.primaryGradientStart);
  const [selectedGradientEnd, setSelectedGradientEnd] = useState(preferences.primaryGradientEnd);
  const [customColor, setCustomColor] = useState(preferences.accentColor);
  const [saving, setSaving] = useState(false);

  if (!user) {
    router.push('/');
    return null;
  }

  const handleSaveAccent = async () => {
    setSaving(true);
    await updateAccentColor(selectedAccent);
    setSaving(false);
  };

  const handleSaveGradient = async () => {
    setSaving(true);
    await updateGradient(selectedGradientStart, selectedGradientEnd);
    setSaving(false);
  };

  const handleReset = async () => {
    setSelectedAccent('#10B981');
    setSelectedGradientStart('#3B82F6');
    setSelectedGradientEnd('#9333EA');
    setCustomColor('#10B981');
    
    setSaving(true);
    await updateAccentColor('#10B981');
    await updateGradient('#3B82F6', '#9333EA');
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/settings')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Settings
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎨 Appearance
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your Pan experience with your own colors
          </p>
        </div>

        {/* Accent Color Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            Accent Color
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            This color appears throughout Pan (buttons, highlights, active states)
          </p>

          {/* Preset Colors */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 mb-6">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedAccent(color.value)}
                className={`aspect-square rounded-xl border-4 transition-all hover:scale-110 ${
                  selectedAccent === color.value
                    ? 'border-gray-900 dark:border-white scale-110'
                    : 'border-transparent'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                {selectedAccent === color.value && (
                  <div className="w-full h-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white drop-shadow-lg" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Custom Color Picker */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Or Choose Custom Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  setSelectedAccent(e.target.value);
                }}
                className="w-20 h-12 rounded-xl cursor-pointer border-2 border-gray-200 dark:border-gray-700"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  setSelectedAccent(e.target.value);
                }}
                placeholder="#10B981"
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Preview
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
                <button
                  className="px-6 py-3 text-white rounded-xl font-medium shadow-lg"
                  style={{ backgroundColor: selectedAccent }}
                >
                  Primary Button
                </button>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
                <div 
                  className="w-12 h-12 rounded-full mx-auto"
                  style={{ backgroundColor: selectedAccent }}
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Accent Icon</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
                <div className="text-2xl font-bold" style={{ color: selectedAccent }}>
                  Highlighted Text
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveAccent}
            disabled={saving || selectedAccent === preferences.accentColor}
            className="w-full px-6 py-3 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: selectedAccent !== preferences.accentColor ? selectedAccent : '#3B82F6',
            }}
          >
            {saving ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : selectedAccent !== preferences.accentColor ? (
              <>
                <Check className="w-5 h-5" />
                Apply Accent Color
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Current Color
              </>
            )}
          </button>
        </div>

        {/* Primary Gradient Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Palette className="w-6 h-6 text-blue-500" />
            Primary Gradient
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Used for primary action buttons (Create, Save, etc.)
          </p>

          {/* Gradient Presets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {GRADIENT_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  setSelectedGradientStart(preset.start);
                  setSelectedGradientEnd(preset.end);
                }}
                className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                  selectedGradientStart === preset.start && selectedGradientEnd === preset.end
                    ? 'border-gray-900 dark:border-white'
                    : 'border-transparent'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${preset.start}, ${preset.end})`,
                }}
              >
                <div className="flex items-center justify-between text-white">
                  <span className="font-medium text-sm">{preset.emoji} {preset.name}</span>
                  {selectedGradientStart === preset.start && selectedGradientEnd === preset.end && (
                    <Check className="w-5 h-5" strokeWidth={3} />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Custom Gradient */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Or Create Custom Gradient
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">Start Color</label>
                <input
                  type="color"
                  value={selectedGradientStart}
                  onChange={(e) => setSelectedGradientStart(e.target.value)}
                  className="w-full h-12 rounded-xl cursor-pointer border-2 border-gray-200 dark:border-gray-700"
                />
                <input
                  type="text"
                  value={selectedGradientStart}
                  onChange={(e) => setSelectedGradientStart(e.target.value)}
                  className="w-full px-3 py-2 mt-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">End Color</label>
                <input
                  type="color"
                  value={selectedGradientEnd}
                  onChange={(e) => setSelectedGradientEnd(e.target.value)}
                  className="w-full h-12 rounded-xl cursor-pointer border-2 border-gray-200 dark:border-gray-700"
                />
                <input
                  type="text"
                  value={selectedGradientEnd}
                  onChange={(e) => setSelectedGradientEnd(e.target.value)}
                  className="w-full px-3 py-2 mt-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Gradient Preview */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Preview
            </label>
            <div className="p-8 rounded-2xl text-center" style={{
              background: `linear-gradient(135deg, ${selectedGradientStart}, ${selectedGradientEnd})`,
            }}>
              <button className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold text-lg hover:bg-white/30 transition-colors">
                Create New Post
              </button>
            </div>
          </div>

          {/* Save Gradient */}
          <button
            onClick={handleSaveGradient}
            disabled={saving || (selectedGradientStart === preferences.primaryGradientStart && selectedGradientEnd === preferences.primaryGradientEnd)}
            className="w-full px-6 py-3 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: selectedGradientStart !== preferences.primaryGradientStart || selectedGradientEnd !== preferences.primaryGradientEnd
                ? `linear-gradient(135deg, ${selectedGradientStart}, ${selectedGradientEnd})`
                : '#3B82F6',
            }}
          >
            {saving ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (selectedGradientStart !== preferences.primaryGradientStart || selectedGradientEnd !== preferences.primaryGradientEnd) ? (
              <>
                <Check className="w-5 h-5" />
                Apply Gradient
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Current Gradient
              </>
            )}
          </button>
        </div>

        {/* Reset Button */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Reset to Defaults
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Reset all appearance settings to Pan's default theme
          </p>
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Reset to Defaults
          </button>
        </div>
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  );
}

