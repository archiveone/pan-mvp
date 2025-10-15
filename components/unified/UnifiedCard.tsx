'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface UnifiedCardProps {
  // Visual
  image?: string;
  icon?: React.ReactNode;
  color?: string;
  gradient?: boolean;
  
  // Content
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string | React.ReactNode;
  
  // Metadata
  metadata?: Array<{ icon?: React.ReactNode; label: string; value: string | number }>;
  
  // Actions
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  actions?: React.ReactNode;
  
  // State
  loading?: boolean;
  selected?: boolean;
  disabled?: boolean;
  
  // Layout
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'featured';
}

export default function UnifiedCard({
  image,
  icon,
  color = '#3B82F6',
  gradient = true,
  title,
  subtitle,
  description,
  badge,
  metadata,
  onClick,
  onEdit,
  onDelete,
  actions,
  loading = false,
  selected = false,
  disabled = false,
  size = 'md',
  variant = 'default',
}: UnifiedCardProps) {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const bgStyle = image
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : gradient
    ? { background: `linear-gradient(135deg, ${color}, ${color}DD)` }
    : { backgroundColor: color };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-2xl ${sizeClasses[size]} shadow-lg animate-pulse`}>
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    );
  }

  return (
    <div
      className={`
        group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg 
        hover:shadow-xl transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
        ${selected ? 'ring-2 ring-blue-500' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${variant === 'featured' ? 'border-2 border-blue-500' : ''}
        overflow-hidden
      `}
      onClick={!disabled ? onClick : undefined}
    >
      {/* Background (if image or color) */}
      {(image || color) && variant !== 'minimal' && (
        <div className="absolute inset-0" style={bgStyle} />
      )}

      {/* Content */}
      <div className={`relative ${sizeClasses[size]} ${image || color ? 'text-white' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            {/* Badge */}
            {badge && (
              <div className="inline-block mb-2">
                {typeof badge === 'string' ? (
                  <span className="px-2 py-1 bg-black/60 text-white text-xs rounded-full backdrop-blur-sm font-medium">
                    {badge}
                  </span>
                ) : (
                  badge
                )}
              </div>
            )}

            {/* Title */}
            <h3 className="text-xl font-bold mb-1 truncate">
              {title}
            </h3>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-sm opacity-80">
                {subtitle}
              </p>
            )}
          </div>

          {/* Icon */}
          {icon && (
            <div className="ml-3 flex-shrink-0">
              <div className={`p-2.5 ${image || color ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'} rounded-xl backdrop-blur-sm`}>
                {icon}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm opacity-70 mb-3 line-clamp-2">
            {description}
          </p>
        )}

        {/* Metadata */}
        {metadata && metadata.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3 text-sm opacity-80">
            {metadata.map((item, index) => (
              <div key={index} className="flex items-center gap-1">
                {item.icon}
                <span>{item.label}: {item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {actions && (
          <div className="mt-4">
            {actions}
          </div>
        )}
      </div>

      {/* Edit Button (appears on hover) */}
      {onEdit && !disabled && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute top-3 right-3 w-7 h-7 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-105 z-10"
          title="Edit"
        >
          <svg className="w-3.5 h-3.5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
    </div>
  );
}

