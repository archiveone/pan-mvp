'use client';

import React, { useState } from 'react';
import { X, Upload, Palette, Image as ImageIcon } from 'lucide-react';
import { ImageService } from '@/services/imageService';

interface CollectionEditorProps {
  collection?: any;
  onSave: (data: any) => void;
  onClose: () => void;
}

const GRADIENT_PRESETS = [
  { name: 'Purple Dream', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Ocean', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: 'Sunset', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { name: 'Forest', value: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)' },
  { name: 'Fire', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Sky', value: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { name: 'Midnight', value: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)' },
  { name: 'Rose', value: 'linear-gradient(135deg, #e96443 0%, #904e95 100%)' },
];

const ICON_OPTIONS = ['📁', '❤️', '⭐', '🎵', '🎨', '🍕', '✈️', '📚', '🎬', '🏠', '🎫', '📦', '🎮', '⚽', '🌟'];

export default function CollectionEditor({ collection, onSave, onClose }: CollectionEditorProps) {
  const [formData, setFormData] = useState({
    name: collection?.name || '',
    description: collection?.description || '',
    icon: collection?.icon || '📁',
    color: collection?.color || '#3B82F6',
    background_type: collection?.background_type || 'gradient',
    background_color: collection?.background_color || '#1F2937',
    background_gradient: collection?.background_gradient || GRADIENT_PRESETS[0].value,
    background_image_url: collection?.background_image_url || '',
    cover_image_url: collection?.cover_image_url || '',
  });

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'background' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await ImageService.uploadImage(file);
      if (type === 'background') {
        setFormData(prev => ({ 
          ...prev, 
          background_type: 'image',
          background_image_url: url 
        }));
      } else {
        setFormData(prev => ({ ...prev, cover_image_url: url }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Please enter a collection name');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full my-auto max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {collection ? 'Edit Collection' : 'New Collection'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Collection Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
              placeholder="My Awesome Collection"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description (optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700"
              rows={3}
              placeholder="What's this collection about?"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium mb-2">Icon</label>
            <div className="grid grid-cols-10 gap-2">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setFormData(prev => ({ ...prev, icon }))}
                  className={`text-2xl p-2 rounded-lg transition-all ${
                    formData.icon === icon 
                      ? 'bg-blue-500 scale-110' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Background Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Background Style</label>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setFormData(prev => ({ ...prev, background_type: 'color' }))}
                className={`flex-1 py-2 px-4 rounded-lg ${
                  formData.background_type === 'color' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                Solid Color
              </button>
              <button
                onClick={() => setFormData(prev => ({ ...prev, background_type: 'gradient' }))}
                className={`flex-1 py-2 px-4 rounded-lg ${
                  formData.background_type === 'gradient' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                Gradient
              </button>
              <button
                onClick={() => setFormData(prev => ({ ...prev, background_type: 'image' }))}
                className={`flex-1 py-2 px-4 rounded-lg ${
                  formData.background_type === 'image' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                Image
              </button>
            </div>

            {/* Color Picker */}
            {formData.background_type === 'color' && (
              <input
                type="color"
                value={formData.background_color}
                onChange={(e) => setFormData(prev => ({ ...prev, background_color: e.target.value }))}
                className="w-full h-20 rounded-lg cursor-pointer"
              />
            )}

            {/* Gradient Presets */}
            {formData.background_type === 'gradient' && (
              <div className="grid grid-cols-4 gap-2">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setFormData(prev => ({ ...prev, background_gradient: preset.value }))}
                    className={`h-16 rounded-lg transition-all ${
                      formData.background_gradient === preset.value 
                        ? 'ring-4 ring-blue-500 scale-105' 
                        : 'hover:scale-105'
                    }`}
                    style={{ background: preset.value }}
                    title={preset.name}
                  />
                ))}
              </div>
            )}

            {/* Image Upload */}
            {formData.background_type === 'image' && (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'background')}
                  className="hidden"
                  id="bg-upload"
                  disabled={uploading}
                />
                <label htmlFor="bg-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {uploading ? 'Uploading...' : 'Click to upload background image'}
                  </p>
                </label>
                {formData.background_image_url && (
                  <img src={formData.background_image_url} alt="Background" className="mt-4 h-32 w-full object-cover rounded-lg" />
                )}
              </div>
            )}
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium mb-2">Preview</label>
            <div 
              className="h-40 rounded-lg flex items-center justify-center"
              style={{
                background: formData.background_type === 'gradient' 
                  ? formData.background_gradient 
                  : formData.background_color,
                backgroundImage: formData.background_type === 'image' && formData.background_image_url
                  ? `url(${formData.background_image_url})`
                  : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="text-center text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                <div className="text-4xl mb-2">{formData.icon}</div>
                <div className="text-xl font-bold">{formData.name || 'Collection Name'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={uploading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {collection ? 'Save Changes' : 'Create Collection'}
          </button>
        </div>
      </div>
    </div>
  );
}

