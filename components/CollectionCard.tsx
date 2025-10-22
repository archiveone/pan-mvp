'use client';

import React, { useState } from 'react';
import { Edit2, MoreVertical, Trash2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface Collection {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  background_type: 'color' | 'gradient' | 'image';
  background_color?: string;
  background_gradient?: string;
  background_image_url?: string;
  cover_image_url?: string;
  theme?: string;
  item_count: number;
  is_system: boolean;
}

interface CollectionCardProps {
  collection: Collection;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function CollectionCard({ 
  collection, 
  onClick, 
  onEdit, 
  onDelete 
}: CollectionCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Generate background style
  const getBackgroundStyle = () => {
    if (collection.background_type === 'image' && collection.background_image_url) {
      return {
        backgroundImage: `url(${collection.background_image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    } else if (collection.background_type === 'gradient' && collection.background_gradient) {
      return {
        background: collection.background_gradient,
      };
    } else {
      return {
        backgroundColor: collection.background_color || collection.color,
      };
    }
  };

  return (
    <div 
      className="relative group rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-105 hover:shadow-xl"
      onClick={onClick}
      style={{ minHeight: '200px' }}
    >
      {/* Background */}
      <div 
        className="absolute inset-0 transition-opacity group-hover:opacity-90"
        style={getBackgroundStyle()}
      >
        {/* Overlay gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Cover Image (optional) */}
      {collection.cover_image_url && (
        <div className="absolute inset-0">
          <Image
            src={collection.cover_image_url}
            alt={collection.name}
            fill
            className="object-cover opacity-40"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative p-6 h-full flex flex-col justify-between">
        {/* Top: Menu */}
        <div className="flex justify-end">
          {!collection.is_system && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="w-4 h-4 text-white" />
            </button>
          )}
          
          {showMenu && (
            <div className="absolute top-12 right-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                  setShowMenu(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                  setShowMenu(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom: Collection Info */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
              {collection.icon}
            </span>
            {collection.is_system && (
              <span className="px-2 py-1 text-xs font-medium bg-white/20 backdrop-blur-sm rounded text-white">
                SYSTEM
              </span>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-white mb-1" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
            {collection.name}
          </h3>
          
          {collection.description && (
            <p className="text-sm text-white/80 mb-2 line-clamp-2" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              {collection.description}
            </p>
          )}
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              {collection.item_count} {collection.item_count === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

