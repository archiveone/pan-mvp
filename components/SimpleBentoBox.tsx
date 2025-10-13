'use client';

import React from 'react';
import { Edit3, LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';

interface SimpleBentoBoxProps {
  title: string;
  count: number;
  icon: keyof typeof Icons;
  color: string;
  customColor?: string;
  imageUrl?: string;
  onClick: () => void;
  onEdit: () => void;
  description?: string;
  children?: React.ReactNode;
}

const SimpleBentoBox: React.FC<SimpleBentoBoxProps> = ({
  title,
  count,
  icon,
  color,
  customColor,
  imageUrl,
  onClick,
  onEdit,
  description,
  children
}) => {
  const IconComponent = Icons[icon] || Icons.Folder;

  // Simplified color mapping
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-cyan-500',
    indigo: 'from-indigo-500 to-purple-500',
    pink: 'from-pink-500 to-rose-500',
    purple: 'from-purple-500 to-violet-500',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-amber-500',
    red: 'from-red-500 to-pink-500',
    teal: 'from-teal-500 to-cyan-500',
    lime: 'from-lime-500 to-green-500',
    amber: 'from-amber-500 to-yellow-500',
    sky: 'from-sky-500 to-blue-500',
    fuchsia: 'from-fuchsia-500 to-pink-500'
  };

  const gradientClass = colorMap[color] || colorMap.blue;

  return (
    <div 
      className="relative group"
      onClick={onClick}
    >
      {/* Main Card */}
      <div 
        className={`relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
          imageUrl ? '' : customColor ? '' : `bg-gradient-to-br ${gradientClass}`
        }`}
        style={
          imageUrl 
            ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : customColor 
            ? { background: `linear-gradient(135deg, ${customColor}, ${customColor}dd)` }
            : {}
        }
      >
        {/* Content */}
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
              <p className="text-white/70 text-sm">{count} {count === 1 ? 'item' : 'items'}</p>
              {description && (
                <p className="text-white/60 text-xs mt-2 line-clamp-2">{description}</p>
              )}
            </div>
            
            {/* Icon with Edit Button */}
            <div className="relative ml-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <IconComponent className="w-7 h-7 text-white" />
              </div>
              
              {/* Edit Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="absolute -top-1 -right-1 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110 z-10"
                title="Edit"
              >
                <Edit3 className="w-3.5 h-3.5 text-gray-900" />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          {children && (
            <div className="mt-4">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleBentoBox;

