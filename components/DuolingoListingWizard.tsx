'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Loader2, Sparkles, Zap, Target, Star, Trophy, Gift, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createSimpleListingV2, uploadSimpleMediaV2, SimpleListingData } from '@/services/simpleListingServiceV2';
import ImageCropper from './ImageCropper';
import ErrorBoundary from './ErrorBoundary';

interface ListingData {
  postType: 'regular' | 'marketplace';
  content: string; // Caption/description
  images: File[];
  tags: string[];
  contentType?: string; // Only for marketplace posts
  businessType?: string; // Only for marketplace posts
  price?: number; // Only for marketplace posts
  currency?: string; // Only for marketplace posts
}

interface ListingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: ListingData) => void;
}

export default function DuolingoListingWizard({ isOpen, onClose, onComplete }: ListingWizardProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [currentImageFile, setCurrentImageFile] = useState<File | null>(null);
  const [data, setData] = useState<ListingData>({
    postType: 'regular',
    content: '',
    images: [],
    tags: [],
    contentType: '',
    businessType: '',
    price: 0,
    currency: 'USD'
  });

  const steps = [
    { id: 'postType', title: 'What kind of post?', subtitle: 'Regular or marketplace?', emoji: '✨' },
    { id: 'content', title: 'Create your post', subtitle: 'Add images and caption', emoji: '📝' },
    { id: 'tags', title: 'Add tags', subtitle: 'Help people find your content', emoji: '🏷️' },
    { id: 'business', title: 'How to monetize?', subtitle: 'Choose your business model', emoji: '💼' },
    { id: 'pricing', title: 'Set your price', subtitle: 'Free or paid?', emoji: '💰' },
    { id: 'review', title: 'Review & Publish', subtitle: 'You\'re almost done!', emoji: '🚀' }
  ];

  const postTypes = [
    { 
      id: 'regular', 
      name: 'Regular Post', 
      emoji: '📱', 
      description: 'Share photos and thoughts',
      examples: ['Photo with caption', 'Thoughts & ideas', 'Inspiration'],
      color: 'from-blue-500 to-blue-600'
    },
    { 
      id: 'marketplace', 
      name: 'Marketplace Post', 
      emoji: '🛒', 
      description: 'Sell something or offer services',
      examples: ['Products', 'Services', 'Events', 'Rentals'],
      color: 'from-green-500 to-green-600'
    }
  ];

  const contentTypes = [
    { id: 'product', name: 'Product', emoji: '🛍️', description: 'Physical or digital goods' },
    { id: 'service', name: 'Service', emoji: '🔧', description: 'Professional services' },
    { id: 'event', name: 'Event', emoji: '🎫', description: 'Events, workshops, meetups' },
    { id: 'rental', name: 'Rental', emoji: '🏠', description: 'Spaces, equipment, vehicles' },
    { id: 'media', name: 'Media', emoji: '🎵', description: 'Music, videos, art' },
    { id: 'experience', name: 'Experience', emoji: '🌟', description: 'Tours, activities, classes' }
  ];

  const businessTypes = [
    { id: 'sell', name: 'Sell', emoji: '🛒', description: 'One-time purchase' },
    { id: 'rent', name: 'Rent', emoji: '🏠', description: 'Temporary rental' },
    { id: 'book', name: 'Book', emoji: '📅', description: 'Reserve time slot' },
    { id: 'stream', name: 'Stream', emoji: '🎵', description: 'Stream content' },
    { id: 'download', name: 'Download', emoji: '💾', description: 'Download files' },
    { id: 'donation', name: 'Donate', emoji: '💝', description: 'Support creator' }
  ];


  const handleNext = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
      setIsAnimating(false);
    }, 200);
  };

  const handlePrev = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(prev => Math.max(prev - 1, 0));
      setIsAnimating(false);
    }, 200);
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
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      (window as any).addNotification?.({
        type: 'error',
        title: 'Upload Timeout',
        message: 'The upload is taking too long. Please try again.'
      });
    }, 30000); // 30 second timeout
    
    try {
      console.log('Starting listing creation...');
      const listingData: SimpleListingData = {
        type: data.postType,
        title: data.content.substring(0, 100), // Use content as title
        description: data.content,
        price: data.price || 0,
        currency: data.currency || 'USD',
        tags: data.tags,
        category: data.contentType || 'general',
        businessType: data.businessType || 'general',
        location: '',
        date: '',
        capacity: 0
      };

      console.log('Creating listing with data:', listingData);
      const result = await createSimpleListingV2(user.id, listingData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create listing');
      }

      console.log('Listing created successfully:', result.listing.id);

      if (data.images.length > 0) {
        console.log(`Uploading ${data.images.length} images...`);
        const mediaResult = await uploadSimpleMediaV2(result.listing.id, data.images);
        if (!mediaResult.success) {
          throw new Error(`Failed to upload images: ${mediaResult.error}`);
        }
        console.log('Images uploaded successfully');
      }

      // Clear timeout since we succeeded
      clearTimeout(timeoutId);

      // Show celebration animation
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        (window as any).addNotification?.({
          type: 'success',
          title: '🎉 Listing Created!',
          message: 'Your listing is now live and ready to earn!'
        });
        onComplete(data);
        onClose();
      }, 2000);
      
    } catch (error) {
      clearTimeout(timeoutId);
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
      case 0: return Boolean(data.postType);
      case 1: return data.content.trim() !== '' && data.images.length > 0;
      case 2: return data.tags.length > 0;
      case 3: return data.postType === 'regular' || data.contentType !== '';
      case 4: return data.postType === 'regular' || data.businessType !== '';
      case 5: return true;
      default: return false;
    }
  };

  const getProgress = () => {
    return ((currentStep + 1) / steps.length) * 100;
  };

  if (!isOpen) return null;

  return (
    <ErrorBoundary>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header with Progress */}
        <div className="p-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{currentStep + 1}</span>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">{steps[currentStep].title}</h2>
                <p className="text-xs text-gray-600">{steps[currentStep].subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              ×
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(getProgress())}%</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 flex-1 overflow-y-auto">
          {/* Post Preview - Show when user has content */}
          {data.content && data.images.length > 0 && currentStep > 1 && (
            <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">U</span>
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-900">Your Post</div>
                  <div className="text-xs text-gray-500">Preview</div>
                </div>
              </div>
              
              {/* Images Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {data.images.slice(0, 4).map((file, index) => (
                  <img
                    key={index}
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                ))}
                {data.images.length > 4 && (
                  <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-500">+{data.images.length - 4} more</span>
                  </div>
                )}
              </div>
              
              {/* Caption */}
              <p className="text-sm text-gray-900 mb-2">{data.content}</p>
              
              {/* Tags */}
              {data.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {data.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                  {data.tags.length > 3 && (
                    <span className="text-xs text-gray-500">+{data.tags.length - 3} more</span>
                  )}
                </div>
              )}
            </div>
          )}

          <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
            {currentStep === 0 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">{steps[currentStep].emoji}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">What kind of post?</h3>
                  <p className="text-sm text-gray-600">Choose between a regular post or marketplace post</p>
                </div>
                
                <div className="space-y-3">
                  {postTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setData({ ...data, postType: type.id as 'regular' | 'marketplace' })}
                      className={`w-full p-6 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                        data.postType === type.id
                          ? 'border-blue-500 bg-blue-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{type.emoji}</div>
                        <div className="flex-1 text-left">
                          <div className="font-bold text-lg text-gray-900 mb-1">{type.name}</div>
                          <div className="text-sm text-gray-600 mb-2">{type.description}</div>
                          <div className="text-xs text-gray-500">
                            {type.examples.join(' • ')}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-bold text-gray-900">Quick Guide</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    <strong>Regular posts</strong> are for sharing photos with captions.<br/>
                    <strong>Marketplace posts</strong> are for selling or offering services.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">{steps[currentStep].emoji}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Create your post</h3>
                  <p className="text-sm text-gray-600">
                    {data.postType === 'regular' 
                      ? 'Add photos and write a caption' 
                      : 'Add photos and describe what you\'re offering'
                    }
                  </p>
                </div>
                
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Photos *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          setCurrentImageFile(files[0]);
                          setShowCropper(true);
                        }
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="text-4xl mb-2">📸</div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Click to upload photos</div>
                      <div className="text-xs text-gray-500">Photos will be cropped to square</div>
                    </label>
                  </div>
                  
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
                            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Caption */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Caption *
                  </label>
                  <textarea
                    value={data.content}
                    onChange={(e) => setData({ ...data, content: e.target.value })}
                    placeholder={
                      data.postType === 'regular' 
                        ? "What's on your mind? Share your thoughts..." 
                        : "Describe what you're offering, what makes it special..."
                    }
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-sm text-gray-900"
                    required
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {data.content.length}/500 characters
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">{steps[currentStep].emoji}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Add tags</h3>
                  <p className="text-sm text-gray-600">Help people discover your content with relevant keywords</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Add tags *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g., vintage, camera, photography"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (value && !data.tags.includes(value)) {
                            setData({ ...data, tags: [...data.tags, value] });
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm text-gray-900"
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector('input[placeholder*="vintage"]') as HTMLInputElement;
                        const value = input?.value.trim();
                        if (value && !data.tags.includes(value)) {
                          setData({ ...data, tags: [...data.tags, value] });
                          input.value = '';
                        }
                      }}
                      className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  
                  {data.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {data.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="flex items-center gap-2 bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                        >
                          {tag}
                          <button
                            onClick={() => setData({ ...data, tags: data.tags.filter((_, i) => i !== index) })}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                {data.postType === 'marketplace' ? (
                  <>
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">{steps[currentStep].emoji}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">What are you offering?</h3>
                      <p className="text-sm text-gray-600">Choose the type of content you're selling</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {contentTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setData({ ...data, contentType: type.id })}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                            data.contentType === type.id
                              ? 'border-blue-500 bg-blue-50 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-2">{type.emoji}</div>
                            <div className="font-bold text-sm text-gray-900 mb-1">{type.name}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">✅</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Regular Post</h3>
                    <p className="text-sm text-gray-600">Your post is ready! No additional setup needed.</p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                {data.postType === 'marketplace' ? (
                  <>
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">{steps[currentStep].emoji}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">How to monetize?</h3>
                      <p className="text-sm text-gray-600">Choose how people will pay for your content</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {businessTypes.map((business) => (
                        <button
                          key={business.id}
                          onClick={() => setData({ ...data, businessType: business.id })}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                            data.businessType === business.id
                              ? 'border-blue-500 bg-blue-50 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-2">{business.emoji}</div>
                            <div className="font-bold text-sm text-gray-900 mb-1">{business.name}</div>
                            <div className="text-xs text-gray-500">{business.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">✅</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Regular Post</h3>
                    <p className="text-sm text-gray-600">Your post is ready! No monetization needed.</p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 5 && data.postType === 'marketplace' && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">{steps[currentStep].emoji}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Set your price</h3>
                  <p className="text-sm text-gray-600">How much will it cost? (You can always change this later)</p>
                </div>
                
                <div className="space-y-6">
                  {/* Pricing Type Selection */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">How do you want to price this?</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setData({ ...data, price: 0 })}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          (data.price || 0) === 0
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2">🆓</div>
                          <div className="font-semibold text-sm">Free</div>
                          <div className="text-xs text-gray-500 mt-1">No cost to users</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => setData({ ...data, price: (data.price || 0) === 0 ? 10 : (data.price || 0) })}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          (data.price || 0) > 0
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2">💰</div>
                          <div className="font-semibold text-sm">Paid</div>
                          <div className="text-xs text-gray-500 mt-1">Set your price</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Price Input - Only show if paid */}
                  {(data.price || 0) > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <label className="block text-sm font-semibold text-blue-900 mb-3">
                        Set your price
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-blue-300">
                          <span className="text-lg text-blue-600 font-semibold">
                            {data.currency === 'USD' ? '$' : data.currency === 'EUR' ? '€' : data.currency === 'GBP' ? '£' : '$'}
                          </span>
                          <input
                            type="number"
                            value={data.price || 0}
                            onChange={(e) => setData({ ...data, price: Number(e.target.value) })}
                            placeholder="0.00"
                            min="0.01"
                            step="0.01"
                            className="w-24 text-lg font-semibold text-blue-900 bg-transparent border-none focus:outline-none"
                          />
                        </div>
                        
                        <select
                          value={data.currency}
                          onChange={(e) => setData({ ...data, currency: e.target.value })}
                          className="px-3 py-2 bg-white border border-blue-300 rounded-lg text-blue-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                        </select>
                      </div>
                      
                      <div className="mt-3 text-xs text-blue-700">
                        💡 You'll receive {data.currency === 'USD' ? '$' : data.currency === 'EUR' ? '€' : data.currency === 'GBP' ? '£' : '$'}{((data.price || 0) * 0.98).toFixed(2)} after our 2% transaction fee
                      </div>
                      
                      {/* Stripe Connection */}
                      <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-xl border border-blue-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-sm">
                              <span className="text-white text-base">💳</span>
                            </div>
                            <div>
                              <div className="text-base font-bold text-gray-900">Payment Account</div>
                              <div className="text-sm text-gray-600">Connect your bank to receive payments</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-3 mb-4">
                          <a
                            href="/dashboard/payments"
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-sm text-center"
                          >
                            Set Up Now
                          </a>
                          <button className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
                            Set Up Later
                          </button>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">Quick Setup</span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            Connect your bank account in 2 minutes to start receiving payments. 
                            You can also set this up later in your dashboard.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Free Content Info */}
                  {(data.price || 0) === 0 && (
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-green-600">✅</div>
                        <span className="text-sm font-semibold text-green-800">Free Content</span>
                      </div>
                      <p className="text-xs text-green-700">
                        This content will be available to everyone at no cost. Great for building your audience!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">{steps[currentStep].emoji}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Add photos</h3>
                  <p className="text-sm text-gray-600">Show what you're offering with great photos</p>
                </div>
                
                <div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setData({ ...data, images: [...data.images, ...files] });
                    }}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer hover:border-blue-400"
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
                            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
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

            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">{steps[currentStep].emoji}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Review & Publish</h3>
                  <p className="text-sm text-gray-600">Everything looks good! Ready to publish your post.</p>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-xl">{data.postType === 'regular' ? '📱' : '🛒'}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{data.postType === 'regular' ? 'Regular Post' : 'Marketplace Post'}</h4>
                      <p className="text-sm text-gray-600">
                        {data.postType === 'regular' ? 'Social sharing' : `${contentTypes.find(t => t.id === data.contentType)?.name || 'Product'}`}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">{data.content}</p>
                  
                  {data.postType === 'marketplace' && (data.price || 0) > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">
                          {data.currency === 'USD' ? '$' : data.currency === 'EUR' ? '€' : data.currency === 'GBP' ? '£' : '$'}{data.price || 0}
                        </span>
                        <span className="text-sm text-gray-500">{data.currency}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {businessTypes.find(b => b.id === data.businessType)?.name}
                      </div>
                    </div>
                  )}
                  
                  {data.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {data.tags.map((tag, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0 || isLoading}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 text-sm"
            >
              <ChevronLeft size={14} />
              Back
            </button>
            
            {currentStep === steps.length - 1 ? (
              <button
                onClick={handleComplete}
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 flex items-center gap-1 text-sm shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    Publish
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 flex items-center gap-1 text-sm shadow-md"
              >
                Next
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Image Cropper */}
      {showCropper && currentImageFile && (
        <ImageCropper
          isOpen={showCropper}
          onClose={() => {
            setShowCropper(false);
            setCurrentImageFile(null);
          }}
          onCropComplete={(croppedFile) => {
            setData({ ...data, images: [...data.images, croppedFile] });
            setShowCropper(false);
            setCurrentImageFile(null);
          }}
          imageFile={currentImageFile}
        />
      )}

      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center z-60 pointer-events-none">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <div className="text-2xl font-bold text-white mb-2">Congratulations!</div>
            <div className="text-lg text-white">Your listing is now live!</div>
          </div>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
}
