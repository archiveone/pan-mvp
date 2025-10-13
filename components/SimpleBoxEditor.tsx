'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Upload, Trash2 } from 'lucide-react';
import { AdvancedHubService, HubBox } from '@/services/advancedHubService';
import { ImageService } from '@/services/imageService';

interface SimpleBoxEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  box: HubBox | null;
  userId: string;
  isNew?: boolean;
}

const SimpleBoxEditor: React.FC<SimpleBoxEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  box,
  userId,
  isNew = false
}) => {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [color, setColor] = useState('#3B82F6');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (box) {
      setTitle(box.title);
      setImageUrl(box.image_url || '');
      setColor(box.custom_color || box.color || '#3B82F6');
    }
  }, [box]);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await ImageService.uploadImage(file, 'content-images', 'hub-boxes');
      if (result.success && result.url) {
        setImageUrl(result.url);
      } else {
        alert('Upload failed. Create "content-images" bucket in Supabase Storage (Public: ON)');
      }
    } catch (error) {
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        await AdvancedHubService.createHubBox(userId, {
          title: title.trim(),
          box_type: 'custom',
          custom_color: color,
          color_type: 'custom',
          image_url: imageUrl || undefined,
          icon: 'Folder'
        });
      } else if (box) {
        await AdvancedHubService.updateHubBox(box.id, {
          title: title.trim(),
          custom_color: color,
          color_type: imageUrl ? 'preset' : 'custom',
          image_url: imageUrl || undefined
        });
      }
      onSave();
      onClose();
    } catch (error) {
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!box || !confirm(`Delete "${box.title}"?`)) return;

    setSaving(true);
    try {
      await AdvancedHubService.deleteHubBox(box.id);
      onSave();
      onClose();
    } catch (error) {
      alert('Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      {/* Duolingo-style simple modal */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header - Minimal */}
        <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {isNew ? 'New Collection' : 'Edit Collection'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Clean & Simple */}
        <div className="p-6 space-y-5">
          {/* Title Input */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Collection name..."
              className="w-full px-4 py-3 text-lg font-medium bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 focus:ring-0 focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 transition-colors"
              autoFocus
            />
          </div>

          {/* Image or Color - Simple Toggle */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Cover</p>
            
            {imageUrl ? (
              /* Show Image */
              <div className="relative group">
                <div 
                  className="h-40 rounded-xl bg-cover bg-center"
                  style={{ backgroundImage: `url(${imageUrl})` }}
                >
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-gray-900 rounded-lg text-sm font-medium"
                      >
                        Change
                      </button>
                      <button
                        onClick={() => setImageUrl('')}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Show Color Picker */
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="sr-only"
                    id="color-input"
                  />
                  <label
                    htmlFor="color-input"
                    className="block h-12 rounded-xl cursor-pointer border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                    style={{ backgroundColor: color }}
                  />
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 h-12 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {uploading ? 'Uploading...' : 'Image'}
                  </span>
                </button>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Preview */}
          <div className="rounded-xl overflow-hidden shadow-md">
            <div 
              className="h-24 flex items-end p-4"
              style={{
                background: imageUrl 
                  ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${imageUrl})`
                  : `linear-gradient(135deg, ${color}, ${color}dd)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <h4 className="text-white font-bold text-lg">{title || 'Collection Name'}</h4>
            </div>
          </div>
        </div>

        {/* Footer - Duolingo Style (2 buttons max) */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
          {!isNew && (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="p-3 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors disabled:opacity-50"
              title="Delete"
            >
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex-1 max-w-[200px] py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                {isNew ? 'Create' : 'Save'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleBoxEditor;

