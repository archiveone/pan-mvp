import React from 'react';
import { Edit3, LucideIcon } from 'lucide-react';
import { UserFolder, FOLDER_COLORS } from '@/services/foldersService';

interface FolderCardProps {
  folder: UserFolder | DefaultFolderData;
  onClick: () => void;
  onEdit: () => void;
  itemCount: number;
  isDefault?: boolean;
}

export interface DefaultFolderData {
  id: string;
  title: string;
  description?: string;
  color: string;
  custom_color?: string;
  color_type?: 'preset' | 'custom';
  image_url?: string;
  icon: string;
  item_count?: number;
}

const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  onClick,
  onEdit,
  itemCount,
  isDefault = false
}) => {
  const colorScheme = FOLDER_COLORS[folder.color] || FOLDER_COLORS.blue;
  
  // Dynamic icon import
  const IconComponent = React.lazy(() => 
    import('lucide-react').then(mod => ({ default: mod[folder.icon as keyof typeof mod] as LucideIcon || mod.Folder }))
  );

  // Determine background style
  const getBackgroundStyle = () => {
    if (folder.image_url) {
      return {
        backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.4), transparent), url(${folder.image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    } else if (folder.color_type === 'custom' && folder.custom_color) {
      return { 
        background: `linear-gradient(135deg, ${folder.custom_color} 0%, ${adjustBrightness(folder.custom_color, -20)} 100%)`
      };
    }
    return {};
  };

  const bgClass = folder.image_url || (folder.color_type === 'custom' && folder.custom_color)
    ? ''
    : `bg-gradient-to-br ${colorScheme.from} ${colorScheme.to}`;

  return (
    <div 
      className={`relative overflow-hidden ${bgClass} rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer`}
      style={getBackgroundStyle()}
    >
      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
      
      <div 
        onClick={onClick}
        className="relative p-6 sm:p-8"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 truncate">
              {folder.title}
            </h3>
            <p className="text-white/80 text-sm">
              {itemCount} {folder.title === 'Inbox' ? 'conversations' : folder.title === 'Groups' ? 'groups' : 'items'}
            </p>
          </div>
          
          {/* Icon with Edit Button */}
          <div className="relative flex-shrink-0 ml-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 group-hover:bg-white/30 transition-colors">
              <React.Suspense fallback={<div className="w-6 h-6 sm:w-8 sm:h-8" />}>
                <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </React.Suspense>
            </div>
            
            {/* Edit Button on Icon Badge */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110 active:scale-95 z-10 touch-manipulation"
              title="Edit folder"
            >
              <Edit3 className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
        
        {/* Description */}
        {('description' in folder) && folder.description && (
          <p className="text-white/70 text-sm mb-4 line-clamp-2">
            {folder.description}
          </p>
        )}
        
        {/* Footer Action */}
        <div className="flex items-center text-white/80 group-hover:text-white transition-colors">
          <span className="text-sm font-medium">
            {isDefault ? `View all ${folder.title.toLowerCase()}` : 'Open folder'}
          </span>
          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// Helper function to adjust color brightness
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1).toUpperCase();
}

export default FolderCard;

