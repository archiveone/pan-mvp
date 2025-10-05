'use client';

import React, { useState } from 'react';
import { Plus, X, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createSimpleListing, uploadSimpleMedia } from '@/services/simpleListingService';

interface SimpleListingData {
  title: string;
  description: string;
  price: number;
  category: string;
  businessType: string;
  tags: string[];
  images: File[];
}

export default function SimpleListingWizard({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<SimpleListingData>({
    title: '',
    description: '',
    price: 0,
    category: '',
    businessType: '',
    tags: [],
    images: []
  });

  const businessTypes = [
    { id: 'sell', name: 'Sell', emoji: '🛒' },
    { id: 'rent', name: 'Rent', emoji: '🏠' },
    { id: 'event', name: 'Event', emoji: '🎫' },
    { id: 'service', name: 'Service', emoji: '🔧' },
    { id: 'media', name: 'Media', emoji: '🎵' },
    { id: 'community', name: 'Community', emoji: '👥' }
  ];

  const categories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Art',
    'Music', 'Food', 'Travel', 'Health', 'Education', 'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const result = await createSimpleListing({
        title: data.title,
        description: data.description,
        price: data.price,
        tags: data.tags,
        category: data.category,
        businessType: data.businessType
      }, user.id);

      if (result.success && data.images.length > 0) {
        await uploadSimpleMedia(data.images, result.listing.id);
      }

      (window as any).addNotification?.({
        type: 'success',
        title: 'Listing Created!',
        message: 'Your listing has been published successfully'
      });

      onClose();
    } catch (error) {
      (window as any).addNotification?.({
        type: 'error',
        title: 'Failed to Create Listing',
        message: 'Something went wrong. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setData({ ...data, images: [...data.images, ...files] });
  };

  const removeImage = (index: number) => {
    setData({ ...data, images: data.images.filter((_, i) => i !== index) });
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !data.tags.includes(tag.trim())) {
      setData({ ...data, tags: [...data.tags, tag.trim()] });
    }
  };

  const removeTag = (tag: string) => {
    setData({ ...data, tags: data.tags.filter(t => t !== tag) });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Create Listing</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What are you listing? *
              </label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                placeholder="e.g., Vintage Camera, Yoga Class, Concert Tickets"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={data.description}
                onChange={(e) => setData({ ...data, description: e.target.value })}
                placeholder="Tell people about your listing..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                required
              />
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How will people interact? *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {businessTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setData({ ...data, businessType: type.id })}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      data.businessType === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{type.emoji}</div>
                    <div className="text-xs font-medium">{type.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={data.category}
                onChange={(e) => setData({ ...data, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">$</span>
                <input
                  type="number"
                  value={data.price}
                  onChange={(e) => setData({ ...data, price: Number(e.target.value) })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                <span className="text-sm text-gray-500">USD</span>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-1 mb-2">
                {data.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-600"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add tags (press Enter)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photos
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                {data.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {data.images.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || !data.title || !data.description || !data.businessType || !data.category}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Create Listing
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
