'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createListing, uploadMediaFiles, CreateListingData } from '@/services/listingService';

interface ListingData {
  type: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  tags: string[];
  images: File[];
  category: string;
  businessType: string;
  location?: string;
  date?: string;
  time?: string;
  capacity?: number;
  amenities: string[];
  houseRules: string[];
  ticketTypes: Array<{
    name: string;
    price: number;
    description: string;
    quantity: number;
  }>;
  addOns: Array<{
    name: string;
    price: number;
    description: string;
    isRequired: boolean;
  }>;
}

interface ListingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: ListingData) => void;
}

export default function ListingWizard({ isOpen, onClose, onComplete }: ListingWizardProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ListingData>({
    type: '',
    title: '',
    description: '',
    price: 0,
    currency: 'USD',
    tags: [],
    images: [],
    category: '',
    businessType: '',
    amenities: [],
    houseRules: [],
    ticketTypes: [],
    addOns: []
  });

  const steps = [
    { id: 'type', title: 'What are you sharing?', subtitle: 'Choose the type of content' },
    { id: 'details', title: 'Tell us about it', subtitle: 'Add title and description' },
    { id: 'business', title: 'How will people interact?', subtitle: 'Choose your business model' },
    { id: 'pricing', title: 'Set your price', subtitle: 'Free or paid?' },
    { id: 'features', title: 'Add features', subtitle: 'Customize your listing' },
    { id: 'media', title: 'Add photos', subtitle: 'Show what you\'re sharing' },
    { id: 'review', title: 'Review', subtitle: 'Check everything looks good' }
  ];

  const contentTypes = [
    { id: 'marketplace', name: 'Marketplace', emoji: '🛒', color: 'bg-blue-100' },
    { id: 'event', name: 'Event', emoji: '🎫', color: 'bg-red-100' },
    { id: 'place', name: 'Place', emoji: '🏠', color: 'bg-green-100' },
    { id: 'media', name: 'Media', emoji: '🎵', color: 'bg-purple-100' },
    { id: 'service', name: 'Service', emoji: '🔧', color: 'bg-orange-100' },
    { id: 'community', name: 'Community', emoji: '👥', color: 'bg-pink-100' }
  ];

  const businessTypes = [
    { id: 'purchase', name: 'Purchase', emoji: '🛒', description: 'One-time purchase' },
    { id: 'rental', name: 'Rental', emoji: '🏠', description: 'Temporary rental' },
    { id: 'booking', name: 'Booking', emoji: '📅', description: 'Reserve a time slot' },
    { id: 'ticketing', name: 'Ticketing', emoji: '🎫', description: 'Event tickets' },
    { id: 'streaming', name: 'Streaming', emoji: '🎵', description: 'Stream content' },
    { id: 'community', name: 'Community', emoji: '👥', description: 'Join community' },
    { id: 'subscription', name: 'Subscription', emoji: '🔄', description: 'Recurring payment' },
    { id: 'donation', name: 'Donation', emoji: '💝', description: 'Support creator' }
  ];

  const categories = {
    marketplace: ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Art'],
    event: ['Concert', 'Workshop', 'Conference', 'Meetup', 'Festival', 'Sports'],
    place: ['Restaurant', 'Hotel', 'Venue', 'Shop', 'Office', 'Other'],
    media: ['Music', 'Video', 'Art', 'Podcast', 'Book', 'Other'],
    service: ['Consulting', 'Coaching', 'Design', 'Writing', 'Photography', 'Other'],
    community: ['Forum', 'Group', 'Network', 'Club', 'Discussion', 'Other']
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleComplete = async () => {
    if (!user) {
      (window as any).addNotification?.({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please sign in to create a listing'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const listingData: CreateListingData = {
        type: data.type,
        title: data.title,
        description: data.description,
        price: data.price,
        currency: data.currency,
        tags: data.tags,
        category: data.category,
        businessType: data.businessType,
        location: data.location,
        date: data.date,
        time: data.time,
        capacity: data.capacity,
        amenities: data.amenities,
        houseRules: data.houseRules,
        ticketTypes: data.ticketTypes,
        addOns: data.addOns,
        isStreamable: false,
        isDownloadable: false
      };

      const result = await createListing(listingData, user.id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create listing');
      }

      if (data.images.length > 0) {
        await uploadMediaFiles(data.images, result.listing.id);
      }

      (window as any).addNotification?.({
        type: 'success',
        title: 'Listing Created!',
        message: 'Your listing has been published successfully'
      });

      onComplete(data);
      onClose();
      
    } catch (error) {
      console.error('Error creating listing:', error);
      (window as any).addNotification?.({
        type: 'error',
        title: 'Failed to Create Listing',
        message: error instanceof Error ? error.message : 'Something went wrong'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return data.type !== '';
      case 1: return data.title.trim() !== '' && data.description.trim() !== '';
      case 2: return data.businessType !== '';
      case 3: return true;
      case 4: return true;
      case 5: return true;
      case 6: return true;
      default: return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{steps[currentStep].title}</h2>
              <p className="text-sm text-gray-500">{steps[currentStep].subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {currentStep + 1} of {steps.length}
              </span>
              <div className="w-24 h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[400px]">
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {contentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setData({ ...data, type: type.id })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      data.type === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${type.color} rounded-full flex items-center justify-center`}>
                        <span className="text-xl">{type.emoji}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{type.name}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={data.title}
                  onChange={(e) => setData({ ...data, title: e.target.value })}
                  placeholder="What are you sharing?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={data.description}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  placeholder="Describe what you're sharing..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={data.category}
                  onChange={(e) => setData({ ...data, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Select a category</option>
                  {data.type && categories[data.type as keyof typeof categories]?.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {businessTypes.map((business) => (
                  <button
                    key={business.id}
                    onClick={() => setData({ ...data, businessType: business.id })}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      data.businessType === business.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{business.emoji}</span>
                      <span className="font-medium text-sm">{business.name}</span>
                    </div>
                    <p className="text-xs text-gray-500">{business.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <select
                    value={data.currency}
                    onChange={(e) => setData({ ...data, currency: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚙️</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Features</h3>
                <p className="text-sm text-gray-500">
                  Additional features will be added based on your business type
                </p>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setData({ ...data, images: [...data.images, ...files] });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                {data.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {data.images.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => setData({ ...data, images: data.images.filter((_, i) => i !== index) })}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{data.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{data.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Type: {data.type}</span>
                  <span>Business: {data.businessType}</span>
                  <span>Price: ${data.price}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0 || isLoading}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>
            
            {currentStep === steps.length - 1 ? (
              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Publish
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                Next
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
