import React from 'react';
import { Edit3, LucideIcon } from 'lucide-react';
import { FOLDER_COLORS } from '@/services/foldersService';
import * as Icons from 'lucide-react';

interface BentoBoxProps {
  title: string;
  subtitle: string;
  icon: string;
  color?: string;
  customColor?: string;
  colorType?: 'preset' | 'custom';
  imageUrl?: string;
  onClick: () => void;
  onEdit: () => void;
  children?: React.ReactNode;
  showPreview?: boolean;
  previewContent?: React.ReactNode;
}

const BentoBox: React.FC<BentoBoxProps> = ({
  title,
  subtitle,
  icon,
  color = 'blue',
  customColor,
  colorType = 'preset',
  imageUrl,
  onClick,
  onEdit,
  children,
  showPreview = false,
  previewContent
}) => {
  const colorScheme = FOLDER_COLORS[color] || FOLDER_COLORS.blue;
  const IconComponent = (Icons as any)[icon] || Icons.Folder;

  // Determine background style
  const getBackgroundStyle = () => {
    if (imageUrl) {
      return {
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    } else if (colorType === 'custom' && customColor) {
      return {
        background: `linear-gradient(135deg, ${customColor} 0%, ${adjustBrightness(customColor, -20)} 100%)`
      };
    }
    return {};
  };

  const bgClass = imageUrl || (colorType === 'custom' && customColor)
    ? ''
    : `bg-gradient-to-br ${colorScheme.from} ${colorScheme.to}`;

  // Get edit button color based on folder color
  const getEditButtonColor = () => {
    if (imageUrl || (colorType === 'custom' && customColor)) {
      return 'from-white to-gray-100 hover:from-white hover:to-gray-200';
    }
    return `${colorScheme.from} ${colorScheme.to} hover:brightness-110`;
  };

  const getEditIconColor = () => {
    if (imageUrl || (colorType === 'custom' && customColor)) {
      return 'text-gray-900';
    }
    return 'text-white';
  };

  return (
    <div 
      className={`relative overflow-hidden ${bgClass} rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer hover:scale-[1.02] active:scale-[0.98]`}
      style={getBackgroundStyle()}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />
      
      {/* Content */}
      <div onClick={onClick} className="relative p-6">
        {/* Header with Icon/Image */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold text-white mb-1 truncate">{title}</h3>
            <p className="text-white/80 text-sm">{subtitle}</p>
          </div>
          
          {/* Icon Badge with Edit Button */}
          <div className="relative flex-shrink-0 ml-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 group-hover:bg-white/30 transition-all duration-300 group-hover:scale-105">
              <IconComponent className="w-8 h-8 text-white" />
            </div>
            
            {/* Edit Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className={`absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br ${getEditButtonColor()} rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 z-10 ring-2 ring-white dark:ring-gray-800`}
              title="✏️ Customize this folder"
            >
              <Edit3 className={`w-4 h-4 ${getEditIconColor()}`} />
            </button>
          </div>
        </div>

        {/* Preview Content Area */}
        {showPreview && previewContent && (
          <div className="mb-4">
            {previewContent}
          </div>
        )}

        {/* Custom Children Content */}
        {children}

        {/* Footer Action */}
        <div className="flex items-center text-white/80 group-hover:text-white transition-colors mt-4">
          <span className="text-sm font-medium">View details</span>
          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// Helper function
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  
  return '#' + ((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1).toUpperCase();
}

export default BentoBox;

