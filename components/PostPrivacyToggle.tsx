'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PostPrivacyToggleProps {
  postId: string;
  initialIsPrivate?: boolean;
  onToggle?: (isPrivate: boolean) => void;
  compact?: boolean;
}

export default function PostPrivacyToggle({ 
  postId, 
  initialIsPrivate = false, 
  onToggle,
  compact = false 
}: PostPrivacyToggleProps) {
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const togglePrivacy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (loading) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_private: !isPrivate })
        .eq('id', postId);

      if (error) throw error;

      setIsPrivate(!isPrivate);
      onToggle?.(!isPrivate);
    } catch (error) {
      console.error('Error toggling post privacy:', error);
      alert('Failed to update privacy setting');
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={togglePrivacy}
          disabled={loading}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`
            p-2 rounded-xl transition-all
            ${isPrivate 
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' 
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            }
            ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
          `}
          title={isPrivate ? 'Private (only you)' : 'Public (on profile)'}
        >
          {isPrivate ? (
            <Lock className="w-4 h-4" />
          ) : (
            <Globe className="w-4 h-4" />
          )}
        </button>
        
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg whitespace-nowrap pointer-events-none">
            {isPrivate ? 'Private (Only You)' : 'Public (On Profile)'}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={togglePrivacy}
      disabled={loading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all
        ${isPrivate 
          ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' 
          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md active:scale-95'}
      `}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isPrivate ? (
        <Lock className="w-4 h-4" />
      ) : (
        <Globe className="w-4 h-4" />
      )}
      <span className="text-sm">
        {isPrivate ? 'Private' : 'Public'}
      </span>
    </button>
  );
}

