import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Upload, Trash2 } from 'lucide-react';
import { FoldersService, UserFolder, FOLDER_COLORS } from '@/services/foldersService';
import { DefaultFoldersService } from '@/services/defaultFoldersService';
import { ImageService } from '@/services/imageService';
import ColorPicker from '@/components/ColorPicker';
import * as Icons from 'lucide-react';

interface UnifiedFolderEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  folder: UserFolder | any;
  userId: string;
  isDefault?: boolean;
  defaultKey?: string;
}

const ICON_MAP: Record<string, React.FC<any>> = {
  Users: Icons.Users,
  Palette: Icons.Palette,
  ShoppingBag: Icons.ShoppingBag,
  Briefcase: Icons.Briefcase,
  Bookmark: Icons.Bookmark,
  FileText: Icons.FileText,
  Image: Icons.Image,
  Folder: Icons.Folder,
  Upload: Icons.Upload,
  Mail: Icons.Mail,
  Heart: Icons.Heart
};

const UnifiedFolderEditor: React.FC<UnifiedFolderEditorProps> = ({
  isOpen,
  onClose,
  onUpdated,
  folder,
  userId,
  isDefault = false,
  defaultKey
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [folderData, setFolderData] = useState({
    title: '',
    description: '',
    color: 'blue',
    custom_color: undefined as string | undefined,
    color_type: 'preset' as 'preset' | 'custom',
    image_url: undefined as string | undefined,
    icon: 'Folder',
    is_public: false
  });

  useEffect(() => {
    if (folder) {
      setFolderData({
        title: folder.title,
        description: folder.description || '',
        color: folder.color || 'blue',
        custom_color: folder.custom_color,
        color_type: folder.color_type || 'preset',
        image_url: folder.image_url,
        icon: folder.icon || 'Folder',
        is_public: folder.is_public || false
      });
    }
  }, [folder]);

  if (!isOpen || !folder) return null;

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await ImageService.uploadImage(file, 'content-images', 'folders');
      if (result.success && result.url) {
        setFolderData({ ...folderData, image_url: result.url });
      } else {
        alert(result.error || 'Failed to upload image. Make sure "content-images" bucket exists and is PUBLIC.');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setFolderData({ ...folderData, image_url: undefined });
  };

  const handleSave = async () => {
    if (!folderData.title.trim()) {
      alert('Please enter a folder title');
      return;
    }

    setLoading(true);
    try {
      let result;
      
      if (isDefault && defaultKey) {
        // Save customization for default folder
        result = await DefaultFoldersService.saveDefaultFolderCustomization(
          userId,
          defaultKey,
          folderData
        );
      } else {
        // Update custom folder
        result = await FoldersService.updateFolder(folder.id, folderData);
      }
      
      if (result.success) {
        onUpdated();
        onClose();
      } else {
        alert(result.error || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving folder:', error);
      alert('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isDefault) {
      alert('Cannot delete default folders. You can customize their appearance instead.');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${folder.title}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      const result = await FoldersService.deleteFolder(folder.id);
      
      if (result.success) {
        onUpdated();
        onClose();
      } else {
        alert(result.error || 'Failed to delete folder');
      }
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Failed to delete folder');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isDefault ? 'Customize' : 'Edit'} Folder
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {isDefault ? `Personalize your ${folder.title} folder` : 'Edit folder settings'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Folder Title *
            </label>
            <input
              type="text"
              value={folderData.title}
              onChange={(e) => setFolderData({ ...folderData, title: e.target.value })}
              placeholder="Enter folder name..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={folderData.description}
              onChange={(e) => setFolderData({ ...folderData, description: e.target.value })}
              placeholder="What's this folder for?"
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 transition-all resize-none"
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cover Image (Optional)
            </label>
            {folderData.image_url ? (
              <div className="relative group">
                <img
                  src={folderData.image_url}
                  alt="Folder cover"
                  className="w-full h-48 object-cover rounded-xl"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition-all flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingImage ? (
                  <>
                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-600 dark:text-gray-400">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400" />
                    <div className="text-center">
                      <p className="text-gray-700 dark:text-gray-300 font-medium">Upload Cover Image</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  </>
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Color Selection */}
          <ColorPicker
            selectedColor={folderData.color}
            selectedCustomColor={folderData.custom_color}
            colorType={folderData.color_type}
            onColorChange={(color, customColor, colorType) => {
              setFolderData({
                ...folderData,
                color,
                custom_color: customColor,
                color_type: colorType || 'preset'
              });
            }}
          />

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Choose Icon
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {Object.entries(ICON_MAP).map(([iconName, IconComponent]) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setFolderData({ ...folderData, icon: iconName })}
                  className={`p-4 bg-gray-50 dark:bg-gray-900 rounded-xl hover:scale-105 active:scale-95 transition-all duration-200 ${
                    folderData.icon === iconName ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30' : ''
                  }`}
                >
                  <IconComponent className={`w-6 h-6 mx-auto ${
                    folderData.icon === iconName ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                  }`} />
                </button>
              ))}
            </div>
          </div>

          {/* Public/Private Toggle (only for custom folders) */}
          {!isDefault && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Public Folder</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Others can view this folder</p>
              </div>
              <button
                type="button"
                onClick={() => setFolderData({ ...folderData, is_public: !folderData.is_public })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  folderData.is_public ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    folderData.is_public ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Preview
            </label>
            <div className="relative overflow-hidden rounded-2xl shadow-lg">
              {/* Background: Image or Color */}
              {folderData.image_url ? (
                <div className="relative h-48">
                  <img src={folderData.image_url} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>
              ) : folderData.color_type === 'custom' && folderData.custom_color ? (
                <div 
                  className="h-48" 
                  style={{ 
                    background: `linear-gradient(135deg, ${folderData.custom_color} 0%, ${adjustBrightness(folderData.custom_color, -20)} 100%)`
                  }}
                >
                  <div className="absolute inset-0 bg-black/10" />
                </div>
              ) : (
                <div className={`h-48 bg-gradient-to-br ${FOLDER_COLORS[folderData.color]?.from || 'from-blue-500'} ${FOLDER_COLORS[folderData.color]?.to || 'to-cyan-500'}`}>
                  <div className="absolute inset-0 bg-black/10" />
                </div>
              )}
              
              {/* Content Overlay */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold text-white mb-1 truncate">{folderData.title || 'Folder Name'}</h3>
                    <p className="text-white/80 text-sm line-clamp-2">{folderData.description || 'Your description here'}</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2.5 ml-3 flex-shrink-0">
                    {ICON_MAP[folderData.icon] && 
                      React.createElement(ICON_MAP[folderData.icon], { className: 'w-6 h-6 text-white' })
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-3">
          {!isDefault && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || loading}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 active:bg-red-800 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Delete
                </>
              )}
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            disabled={loading || deleting}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 active:bg-gray-400 dark:active:bg-gray-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !folderData.title.trim() || deleting}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 active:from-blue-800 active:to-purple-800 transition-all font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
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

export default UnifiedFolderEditor;

