'use client';

import React, { useState } from 'react';
import { Heart, Plus, Check } from 'lucide-react';
import { AdvancedHubService, HubBox } from '@/services/advancedHubService';

interface SaveToBoxButtonProps {
  listingId: string;
  listingType: string;
  userId: string;
  userBoxes: HubBox[];
  onSaved?: () => void;
  variant?: 'icon' | 'button';
}

const SaveToBoxButton: React.FC<SaveToBoxButtonProps> = ({
  listingId,
  listingType,
  userId,
  userBoxes,
  onSaved,
  variant = 'icon'
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedBoxes, setSavedBoxes] = useState<Set<string>>(new Set());

  const handleSaveToBox = async (boxId: string) => {
    setSaving(true);
    try {
      // Add item to box
      const { data, error } = await supabase
        .from('hub_box_items')
        .insert({
          box_id: boxId,
          item_type: listingType,
          item_id: listingId
        });

      if (!error) {
        setSavedBoxes(prev => new Set([...prev, boxId]));
        onSaved?.();
        setShowDropdown(false);
      }
    } catch (error) {
      console.error('Error saving to box:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAndSave = async () => {
    const title = prompt('Name your collection:');
    if (!title) return;

    setSaving(true);
    try {
      const result = await AdvancedHubService.createHubBox(userId, {
        title: title.trim(),
        box_type: 'saved',
        icon: 'Bookmark',
        color: 'blue'
      });

      if (result.success && result.data) {
        await handleSaveToBox(result.data.id);
      }
    } catch (error) {
      alert('Failed to create collection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      {/* Save Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`group ${
          variant === 'icon'
            ? 'p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full'
            : 'px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl flex items-center gap-2'
        } transition-colors`}
      >
        <Heart 
          className={`w-5 h-5 ${
            savedBoxes.size > 0 
              ? 'fill-red-500 text-red-500' 
              : 'text-gray-600 dark:text-gray-400 group-hover:text-red-500'
          }`}
        />
        {variant === 'button' && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Save
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-[9999] overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Save to collection
              </p>
            </div>

            {/* Box List */}
            <div className="max-h-64 overflow-y-auto">
              {userBoxes.filter(b => b.box_type === 'saved' || b.box_type === 'custom').map(box => (
                <button
                  key={box.id}
                  onClick={() => handleSaveToBox(box.id)}
                  disabled={saving}
                  className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 disabled:opacity-50"
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: box.custom_color || '#3B82F6' }}
                  >
                    {savedBoxes.has(box.id) ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <Heart className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white truncate">
                    {box.title}
                  </span>
                </button>
              ))}

              {/* Create New */}
              <button
                onClick={handleCreateAndSave}
                disabled={saving}
                className="w-full p-3 border-t border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-3 disabled:opacity-50"
              >
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Create new collection
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Import helper
import { supabase } from '@/lib/supabase';

export default SaveToBoxButton;

