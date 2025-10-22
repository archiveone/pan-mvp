'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UnifiedContentCreator from './UnifiedContentCreator';

interface CreateButtonProps {
  variant?: 'floating' | 'inline' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function CreateButton({ 
  variant = 'floating', 
  size = 'md',
  className = '' 
}: CreateButtonProps) {
  const { user } = useAuth();
  const [showWizard, setShowWizard] = useState(false);

  const handleCreateClick = () => {
    if (!user) {
      alert('Please sign in to create content');
      return;
    }
    setShowWizard(true);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-10 h-10';
      case 'lg': return 'w-16 h-16';
      default: return 'w-12 h-12';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 16;
      case 'lg': return 24;
      default: return 20;
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'inline':
        return 'bg-gradient-to-r from-lime-400 to-lime-300 hover:brightness-95 text-black rounded-lg px-4 py-2 transition-all';
      case 'minimal':
        return 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg px-4 py-2 transition-all';
      default:
        return 'bg-gradient-to-r from-lime-400 to-lime-300 hover:brightness-95 text-black rounded-full shadow-lg hover:shadow-xl transition-all';
    }
  };

  return (
    <>
      <button
        onClick={handleCreateClick}
        className={`${getVariantClasses()} ${getSizeClasses()} ${className} flex items-center justify-center transition-all duration-200`}
        title="Create new listing"
      >
        <Plus size={getIconSize()} />
      </button>

      <UnifiedContentCreator
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={(contentId) => {
          console.log('Content created successfully:', contentId)
          setShowWizard(false)
          // Refresh the page to show new content
          window.location.reload()
        }}
      />
    </>
  );
}