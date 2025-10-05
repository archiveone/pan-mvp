'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Sparkles, Zap, Target, Loader2 } from 'lucide-react';
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
  videos: File[];
  location?: string;
  date?: string;
  time?: string;
  endTime?: string;
  capacity?: number;
  category: string;
  businessType: string;
  
  // Event specific
  eventType?: string;
  ageRestriction?: string;
  isTicketed: boolean;
  ticketTypes: TicketType[];
  
  // Hosting specific
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  beds?: number;
  guestCapacity?: number;
  minStay?: string;
  amenities: string[];
  houseRules: string[];
  safetyFeatures?: string[];
  checkInTime?: string;
  checkOutTime?: string;
  
  // Media specific
  streamingPrice?: number;
  downloadPrice?: number;
  isStreamable: boolean;
  isDownloadable: boolean;
  
  // General
  addOns: AddOn[];
}

interface TicketType {
  id: string;
  name: string;
  price: number;
  description: string;
  quantity: number;
  sold: number;
  salesStart?: string;
  salesEnd?: string;
  minPerOrder?: number;
  maxPerOrder?: number;
  transferable?: boolean;
  refundable?: boolean;
}

interface AddOn {
  id: string;
  name: string;
  price: number;
  description: string;
  isRequired: boolean;
}

interface ListingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: ListingData) => void;
}

const contentTypes = [
  { id: 'item', emoji: '🛍️', name: 'Item', description: 'Something to sell', color: 'bg-blue-500' },
  { id: 'service', emoji: '🔧', name: 'Service', description: 'Work you do', color: 'bg-green-500' },
  { id: 'event', emoji: '🎉', name: 'Event', description: 'Something happening', color: 'bg-purple-500' },
  { id: 'experience', emoji: '🌟', name: 'Experience', description: 'Something to do', color: 'bg-orange-500' },
  { id: 'place', emoji: '📍', name: 'Place', description: 'Somewhere to go', color: 'bg-red-500' },
  { id: 'media', emoji: '🎵', name: 'Media', description: 'Music, video, art', color: 'bg-pink-500' }
];

const categories = {
  item: ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Other'],
  service: ['Professional', 'Creative', 'Technical', 'Personal', 'Business', 'Other'],
  event: ['Concert', 'Workshop', 'Meetup', 'Conference', 'Party', 'Other'],
  experience: ['Tour', 'Class', 'Adventure', 'Tasting', 'Spa', 'Other'],
  place: ['Restaurant', 'Hotel', 'Venue', 'Shop', 'Office', 'Other'],
  media: ['Music', 'Video', 'Art', 'Podcast', 'Book', 'Other']
};

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
    videos: [],
    category: '',
    businessType: '',
    isTicketed: false,
    ticketTypes: [],
    addOns: [],
    amenities: [],
    houseRules: [],
    isStreamable: false,
    isDownloadable: false
  });
  const [isAnimating, setIsAnimating] = useState(false);

  // Dynamic steps based on business type
  const getSteps = () => {
    const baseSteps = [
      { id: 'type', title: 'What are you sharing?', subtitle: 'Choose the type of content' },
      { id: 'details', title: 'Tell us about it', subtitle: 'Add title and description' },
      { id: 'business', title: 'How will people interact?', subtitle: 'Choose your business model' }
    ];

    // Add pricing step for paid business types
    if (data.businessType && !['free', 'donation', 'volunteer', 'community'].includes(data.businessType)) {
      baseSteps.push({ id: 'pricing', title: 'Set your price', subtitle: 'How much will it cost?' });
    }

    // Add specific features based on business type
    if (data.businessType === 'ticketing' || data.businessType === 'event') {
      baseSteps.push({ id: 'ticketing', title: 'Event details', subtitle: 'Set up your event' });
    } else if (data.businessType === 'rental' || data.businessType === 'accommodation') {
      baseSteps.push({ id: 'hosting', title: 'Hosting details', subtitle: 'Amenities and rules' });
    } else if (['streaming', 'download', 'music', 'video', 'podcast'].includes(data.businessType)) {
      baseSteps.push({ id: 'media', title: 'Media settings', subtitle: 'Streaming and download options' });
    }

    // Always add media and tags
    baseSteps.push(
      { id: 'media', title: 'Add media', subtitle: 'Photos, videos, audio' },
      { id: 'tags', title: 'Add tags', subtitle: 'Help people find your content' },
      { id: 'review', title: 'Review', subtitle: 'Check everything looks good' }
    );

    return baseSteps;
  };

  const steps = getSteps();

  const handleNext = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
      setIsAnimating(false);
    }, 150);
  };

  const handlePrev = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(prev => Math.max(prev - 1, 0));
      setIsAnimating(false);
    }, 150);
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
      // Prepare data for database
      const listingData: CreateListingData = {
        type: data.type,
        title: data.title,
        description: data.description,
        price: data.price,
        currency: data.currency,
        tags: data.tags,
        category: data.category,
        businessType: data.businessType,
        
        // Event specific
        eventType: data.eventType,
        ageRestriction: data.ageRestriction,
        date: data.date,
        time: data.time,
        endTime: data.endTime,
        capacity: data.capacity,
        location: data.location,
        
        // Hosting specific
        propertyType: data.propertyType,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        beds: data.beds,
        guestCapacity: data.guestCapacity,
        minStay: data.minStay,
        amenities: data.amenities,
        houseRules: data.houseRules,
        safetyFeatures: data.safetyFeatures,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        
        // Media specific
        streamingPrice: data.streamingPrice,
        downloadPrice: data.downloadPrice,
        isStreamable: data.isStreamable,
        isDownloadable: data.isDownloadable,
        
        // Ticket types and add-ons
        ticketTypes: data.ticketTypes,
        addOns: data.addOns
      };

      // Create listing in database
      const result = await createListing(listingData, user.id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create listing');
      }

      // Upload media files if any
      const allFiles = [...data.images, ...data.videos];
      if (allFiles.length > 0) {
        const mediaResult = await uploadMediaFiles(allFiles, result.listing.id);
        if (!mediaResult.success) {
          console.warn('Media upload failed:', mediaResult.error);
        }
      }

      // Show success notification
      (window as any).addNotification?.({
        type: 'success',
        title: 'Listing Created!',
        message: 'Your listing has been published successfully'
      });

      // Complete the wizard
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

  const getProgress = () => {
    return ((currentStep + 1) / steps.length) * 100;
  };

  const canProceed = () => {
    const currentStepId = steps[currentStep]?.id;
    
    switch (currentStepId) {
      case 'type': return data.type !== '';
      case 'details': return data.title.trim() !== '' && data.description.trim() !== '';
      case 'business': return data.businessType !== '';
      case 'pricing': return true; // Price is optional
      case 'ticketing': return true; // Ticketing details are optional
      case 'hosting': return true; // Hosting details are optional
      case 'media': return true; // Media is optional
      case 'tags': return true; // Tags are optional
      case 'review': return true; // Review step
      default: return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-xl w-full max-w-sm mx-auto shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-500" />
            </button>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {steps[currentStep].title}
              </h2>
              <p className="text-sm text-gray-500">
                {steps[currentStep].subtitle}
              </p>
            </div>
            <div className="w-8" />
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 min-h-[300px]">
          <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
            {steps[currentStep]?.id === 'type' && <TypeStep data={data} setData={setData} />}
            {steps[currentStep]?.id === 'details' && <DetailsStep data={data} setData={setData} />}
            {steps[currentStep]?.id === 'business' && <BusinessStep data={data} setData={setData} />}
            {steps[currentStep]?.id === 'pricing' && <PricingStep data={data} setData={setData} />}
            {steps[currentStep]?.id === 'ticketing' && <TicketingStep data={data} setData={setData} />}
            {steps[currentStep]?.id === 'hosting' && <HostingStep data={data} setData={setData} />}
            {steps[currentStep]?.id === 'media' && <MediaStep data={data} setData={setData} />}
            {steps[currentStep]?.id === 'tags' && <TagsStep data={data} setData={setData} />}
            {steps[currentStep]?.id === 'review' && <ReviewStep data={data} />}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
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
                    <Sparkles size={16} />
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

// Step Components
function TypeStep({ data, setData }: { data: ListingData; setData: (data: ListingData) => void }) {
  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Zap size={20} className="text-blue-600" />
        </div>
        <h3 className="text-base font-medium text-gray-900 mb-1">What are you sharing?</h3>
        <p className="text-xs text-gray-500">Choose the type of content</p>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {contentTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => setData({ ...data, type: type.id })}
            className={`p-3 rounded-lg border-2 transition-all ${
              data.type === type.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className={`w-8 h-8 ${type.color} rounded-full flex items-center justify-center mx-auto mb-1`}>
                <span className="text-lg">{type.emoji}</span>
              </div>
              <div className="font-medium text-xs text-gray-900">{type.name}</div>
              <div className="text-xs text-gray-500 leading-tight">{type.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CategoryStep({ data, setData }: { data: ListingData; setData: (data: ListingData) => void }) {
  const availableCategories = categories[data.type as keyof typeof categories] || [];

  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Target size={20} className="text-green-600" />
        </div>
        <h3 className="text-base font-medium text-gray-900 mb-1">Pick a category</h3>
        <p className="text-xs text-gray-500">Help people find your content</p>
      </div>
      
      <div className="space-y-1">
        {availableCategories.map((category) => (
          <button
            key={category}
            onClick={() => setData({ ...data, category })}
            className={`w-full p-2 rounded-lg border-2 transition-all text-left ${
              data.category === category
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-gray-900">{category}</span>
              {data.category === category && (
                <Check size={14} className="text-green-600" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function DetailsStep({ data, setData }: { data: ListingData; setData: (data: ListingData) => void }) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Sparkles size={20} className="text-purple-600" />
        </div>
        <h3 className="text-base font-medium text-gray-900 mb-1">Tell us about it</h3>
        <p className="text-xs text-gray-500">Add a title and description</p>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            placeholder="What are you sharing?"
            className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            placeholder="Describe what you're sharing..."
            rows={3}
            className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
      </div>
    </div>
  );
}

function PricingStep({ data, setData }: { data: ListingData; setData: (data: ListingData) => void }) {
  const [isFree, setIsFree] = useState(data.price === 0);

  const handlePriceChange = (price: number) => {
    setData({ ...data, price });
    setIsFree(price === 0);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">💰</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Set your price</h3>
        <p className="text-sm text-gray-500">Free or paid?</p>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handlePriceChange(0)}
            className={`p-4 rounded-lg border-2 transition-all ${
              isFree
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🆓</div>
              <div className="font-medium text-gray-900">Free</div>
            </div>
          </button>
          
          <button
            onClick={() => handlePriceChange(10)}
            className={`p-4 rounded-lg border-2 transition-all ${
              !isFree
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">💵</div>
              <div className="font-medium text-gray-900">Paid</div>
            </div>
          </button>
        </div>
        
        {!isFree && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">$</span>
                <input
                  type="number"
                  value={data.price}
                  onChange={(e) => handlePriceChange(Number(e.target.value))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="flex-1 px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      </div>
    </div>
  );
}

function TagsStep({ data, setData }: { data: ListingData; setData: (data: ListingData) => void }) {
  const [newTag, setNewTag] = useState('');
  const suggestedTags = ['popular', 'trending', 'new', 'limited', 'exclusive'];

  const addTag = (tag: string) => {
    if (tag.trim() && !data.tags.includes(tag.trim())) {
      setData({ ...data, tags: [...data.tags, tag.trim()] });
    }
  };

  const removeTag = (tag: string) => {
    setData({ ...data, tags: data.tags.filter(t => t !== tag) });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🏷️</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Add some tags</h3>
        <p className="text-sm text-gray-500">Help with discovery (optional)</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add tags
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag(newTag);
                  setNewTag('');
                }
              }}
              placeholder="Type a tag..."
              className="flex-1 px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => {
                addTag(newTag);
                setNewTag('');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
        
        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        
        <div>
          <p className="text-sm text-gray-500 mb-2">Suggested tags:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map((tag) => (
              <button
                key={tag}
                onClick={() => addTag(tag)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BusinessStep({ data, setData }: { data: ListingData; setData: (data: ListingData) => void }) {
  const businessTypes = [
    // E-commerce & Sales
    { id: 'purchase', name: 'Purchase', emoji: '🛒', description: 'One-time purchase', color: 'bg-blue-100' },
    { id: 'auction', name: 'Auction', emoji: '🔨', description: 'Bid-based selling', color: 'bg-yellow-100' },
    { id: 'marketplace', name: 'Marketplace', emoji: '🏪', description: 'Multi-vendor platform', color: 'bg-green-100' },
    { id: 'wholesale', name: 'Wholesale', emoji: '📦', description: 'Bulk sales', color: 'bg-indigo-100' },
    { id: 'retail', name: 'Retail', emoji: '🛍️', description: 'Direct to consumer', color: 'bg-purple-100' },
    
    // Rental & Sharing
    { id: 'rental', name: 'Rental', emoji: '🏠', description: 'Temporary rental', color: 'bg-green-100' },
    { id: 'sharing', name: 'Sharing', emoji: '🤝', description: 'Peer-to-peer sharing', color: 'bg-blue-100' },
    { id: 'lease', name: 'Lease', emoji: '📋', description: 'Long-term rental', color: 'bg-teal-100' },
    { id: 'timeshare', name: 'Timeshare', emoji: '⏰', description: 'Shared ownership', color: 'bg-orange-100' },
    
    // Booking & Reservations
    { id: 'booking', name: 'Booking', emoji: '📅', description: 'Reserve a time slot', color: 'bg-purple-100' },
    { id: 'reservation', name: 'Reservation', emoji: '🍽️', description: 'Reserve a table/spot', color: 'bg-orange-100' },
    { id: 'appointment', name: 'Appointment', emoji: '⏰', description: 'Schedule meeting', color: 'bg-blue-100' },
    { id: 'consultation', name: 'Consultation', emoji: '💼', description: 'Professional advice', color: 'bg-indigo-100' },
    { id: 'session', name: 'Session', emoji: '🎯', description: 'One-on-one session', color: 'bg-pink-100' },
    
    // Events & Entertainment
    { id: 'ticketing', name: 'Ticketing', emoji: '🎫', description: 'Event tickets', color: 'bg-red-100' },
    { id: 'event', name: 'Event', emoji: '🎪', description: 'Organize events', color: 'bg-yellow-100' },
    { id: 'workshop', name: 'Workshop', emoji: '🔧', description: 'Educational session', color: 'bg-green-100' },
    { id: 'class', name: 'Class', emoji: '📚', description: 'Teaching session', color: 'bg-blue-100' },
    { id: 'tour', name: 'Tour', emoji: '🗺️', description: 'Guided experience', color: 'bg-teal-100' },
    { id: 'experience', name: 'Experience', emoji: '✨', description: 'Unique activity', color: 'bg-purple-100' },
    
    // Media & Content
    { id: 'streaming', name: 'Streaming', emoji: '🎵', description: 'Stream content', color: 'bg-pink-100' },
    { id: 'download', name: 'Download', emoji: '💾', description: 'Download files', color: 'bg-indigo-100' },
    { id: 'podcast', name: 'Podcast', emoji: '🎙️', description: 'Audio content', color: 'bg-purple-100' },
    { id: 'video', name: 'Video', emoji: '🎥', description: 'Video content', color: 'bg-red-100' },
    { id: 'music', name: 'Music', emoji: '🎶', description: 'Musical content', color: 'bg-pink-100' },
    { id: 'ebook', name: 'E-book', emoji: '📖', description: 'Digital book', color: 'bg-green-100' },
    { id: 'course', name: 'Course', emoji: '🎓', description: 'Educational content', color: 'bg-blue-100' },
    { id: 'tutorial', name: 'Tutorial', emoji: '📝', description: 'How-to guide', color: 'bg-yellow-100' },
    
    // Services
    { id: 'service', name: 'Service', emoji: '🔧', description: 'Professional service', color: 'bg-gray-100' },
    { id: 'freelance', name: 'Freelance', emoji: '💻', description: 'Project-based work', color: 'bg-indigo-100' },
    { id: 'consulting', name: 'Consulting', emoji: '💡', description: 'Expert advice', color: 'bg-yellow-100' },
    { id: 'coaching', name: 'Coaching', emoji: '🏆', description: 'Personal development', color: 'bg-green-100' },
    { id: 'mentoring', name: 'Mentoring', emoji: '👨‍🏫', description: 'Guidance & support', color: 'bg-blue-100' },
    { id: 'therapy', name: 'Therapy', emoji: '🧠', description: 'Mental health support', color: 'bg-purple-100' },
    { id: 'fitness', name: 'Fitness', emoji: '💪', description: 'Physical training', color: 'bg-red-100' },
    { id: 'beauty', name: 'Beauty', emoji: '💄', description: 'Beauty services', color: 'bg-pink-100' },
    { id: 'wellness', name: 'Wellness', emoji: '🧘', description: 'Health & wellness', color: 'bg-teal-100' },
    
    // Community & Social
    { id: 'community', name: 'Community', emoji: '👥', description: 'Join community', color: 'bg-yellow-100' },
    { id: 'membership', name: 'Membership', emoji: '🎖️', description: 'Exclusive access', color: 'bg-purple-100' },
    { id: 'club', name: 'Club', emoji: '🏆', description: 'Exclusive group', color: 'bg-blue-100' },
    { id: 'forum', name: 'Forum', emoji: '💬', description: 'Discussion platform', color: 'bg-green-100' },
    { id: 'network', name: 'Network', emoji: '🌐', description: 'Professional network', color: 'bg-indigo-100' },
    { id: 'social', name: 'Social', emoji: '👋', description: 'Social interaction', color: 'bg-pink-100' },
    
    // Subscriptions & Recurring
    { id: 'subscription', name: 'Subscription', emoji: '🔄', description: 'Recurring payment', color: 'bg-teal-100' },
    { id: 'membership', name: 'Membership', emoji: '🎖️', description: 'Exclusive access', color: 'bg-purple-100' },
    { id: 'retainer', name: 'Retainer', emoji: '💰', description: 'Ongoing service', color: 'bg-green-100' },
    { id: 'patreon', name: 'Patreon', emoji: '🎭', description: 'Creator support', color: 'bg-pink-100' },
    
    // Donations & Support
    { id: 'donation', name: 'Donation', emoji: '💝', description: 'Support creator', color: 'bg-rose-100' },
    { id: 'tip', name: 'Tip', emoji: '💸', description: 'Show appreciation', color: 'bg-yellow-100' },
    { id: 'crowdfunding', name: 'Crowdfunding', emoji: '🚀', description: 'Project funding', color: 'bg-blue-100' },
    { id: 'sponsorship', name: 'Sponsorship', emoji: '🏢', description: 'Brand partnership', color: 'bg-indigo-100' },
    
    // Food & Hospitality
    { id: 'restaurant', name: 'Restaurant', emoji: '🍽️', description: 'Dining experience', color: 'bg-orange-100' },
    { id: 'catering', name: 'Catering', emoji: '🍱', description: 'Food service', color: 'bg-green-100' },
    { id: 'delivery', name: 'Delivery', emoji: '🚚', description: 'Food delivery', color: 'bg-blue-100' },
    { id: 'popup', name: 'Pop-up', emoji: '🎪', description: 'Temporary venue', color: 'bg-purple-100' },
    
    // Travel & Tourism
    { id: 'travel', name: 'Travel', emoji: '✈️', description: 'Travel experience', color: 'bg-blue-100' },
    { id: 'accommodation', name: 'Accommodation', emoji: '🏨', description: 'Lodging service', color: 'bg-green-100' },
    { id: 'transport', name: 'Transport', emoji: '🚗', description: 'Transportation', color: 'bg-gray-100' },
    { id: 'guide', name: 'Guide', emoji: '🗺️', description: 'Local guide', color: 'bg-teal-100' },
    
    // Creative & Arts
    { id: 'art', name: 'Art', emoji: '🎨', description: 'Artistic creation', color: 'bg-pink-100' },
    { id: 'design', name: 'Design', emoji: '🎨', description: 'Creative design', color: 'bg-purple-100' },
    { id: 'photography', name: 'Photography', emoji: '📸', description: 'Photo service', color: 'bg-blue-100' },
    { id: 'writing', name: 'Writing', emoji: '✍️', description: 'Written content', color: 'bg-green-100' },
    { id: 'performance', name: 'Performance', emoji: '🎭', description: 'Live performance', color: 'bg-red-100' },
    
    // Technology & Digital
    { id: 'software', name: 'Software', emoji: '💻', description: 'Digital product', color: 'bg-indigo-100' },
    { id: 'app', name: 'App', emoji: '📱', description: 'Mobile application', color: 'bg-blue-100' },
    { id: 'plugin', name: 'Plugin', emoji: '🔌', description: 'Software extension', color: 'bg-green-100' },
    { id: 'template', name: 'Template', emoji: '📄', description: 'Reusable design', color: 'bg-purple-100' },
    { id: 'api', name: 'API', emoji: '🔗', description: 'Technical service', color: 'bg-gray-100' },
    
    // Health & Wellness
    { id: 'health', name: 'Health', emoji: '🏥', description: 'Healthcare service', color: 'bg-red-100' },
    { id: 'medical', name: 'Medical', emoji: '⚕️', description: 'Medical service', color: 'bg-blue-100' },
    { id: 'nutrition', name: 'Nutrition', emoji: '🥗', description: 'Dietary guidance', color: 'bg-green-100' },
    { id: 'mental', name: 'Mental Health', emoji: '🧠', description: 'Psychological support', color: 'bg-purple-100' },
    
    // Education & Training
    { id: 'education', name: 'Education', emoji: '🎓', description: 'Learning service', color: 'bg-blue-100' },
    { id: 'training', name: 'Training', emoji: '🏋️', description: 'Skill development', color: 'bg-green-100' },
    { id: 'certification', name: 'Certification', emoji: '📜', description: 'Official credential', color: 'bg-yellow-100' },
    { id: 'workshop', name: 'Workshop', emoji: '🔧', description: 'Hands-on learning', color: 'bg-orange-100' },
    
    // Legal & Professional
    { id: 'legal', name: 'Legal', emoji: '⚖️', description: 'Legal service', color: 'bg-gray-100' },
    { id: 'accounting', name: 'Accounting', emoji: '📊', description: 'Financial service', color: 'bg-green-100' },
    { id: 'insurance', name: 'Insurance', emoji: '🛡️', description: 'Protection service', color: 'bg-blue-100' },
    { id: 'realestate', name: 'Real Estate', emoji: '🏘️', description: 'Property service', color: 'bg-purple-100' },
    
    // Miscellaneous
    { id: 'barter', name: 'Barter', emoji: '🤝', description: 'Trade without money', color: 'bg-yellow-100' },
    { id: 'free', name: 'Free', emoji: '🆓', description: 'No cost service', color: 'bg-green-100' },
    { id: 'volunteer', name: 'Volunteer', emoji: '🤲', description: 'Volunteer work', color: 'bg-blue-100' },
    { id: 'exchange', name: 'Exchange', emoji: '🔄', description: 'Mutual exchange', color: 'bg-purple-100' }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">💼</span>
        </div>
        <h3 className="text-base font-medium text-gray-900 mb-1">Business type</h3>
        <p className="text-xs text-gray-500">How will people interact with your content?</p>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          {businessTypes.map((business) => (
            <button
              key={business.id}
              onClick={() => setData({ ...data, businessType: business.id })}
              className={`p-2 rounded-lg border-2 transition-all text-left ${
                data.businessType === business.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{business.emoji}</span>
                <span className="text-xs font-medium text-gray-900 truncate">{business.name}</span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{business.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TicketingStep({ data, setData }: { data: ListingData; setData: (data: ListingData) => void }) {
  const [newTicket, setNewTicket] = useState({ 
    name: '', 
    price: 0, 
    description: '', 
    quantity: 0,
    salesStart: '',
    salesEnd: '',
    minPerOrder: 1,
    maxPerOrder: 10,
    transferable: true,
    refundable: true
  });

  const addTicket = () => {
    if (newTicket.name.trim()) {
      const ticket: TicketType = {
        id: Date.now().toString(),
        ...newTicket,
        sold: 0
      };
      setData({ ...data, ticketTypes: [...data.ticketTypes, ticket] });
      setNewTicket({ 
        name: '', 
        price: 0, 
        description: '', 
        quantity: 0,
        salesStart: '',
        salesEnd: '',
        minPerOrder: 1,
        maxPerOrder: 10,
        transferable: true,
        refundable: true
      });
    }
  };

  const removeTicket = (id: string) => {
    setData({ ...data, ticketTypes: data.ticketTypes.filter(t => t.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">🎫</span>
        </div>
        <h3 className="text-base font-medium text-gray-900 mb-1">Event details</h3>
        <p className="text-xs text-gray-500">Set up your event like Eventbrite</p>
      </div>
      
      <div className="space-y-4">
        {/* Event Date & Time */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">Event Date & Time</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={data.date || ''}
              onChange={(e) => setData({ ...data, date: e.target.value })}
              className="px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
            />
            <input
              type="time"
              value={data.time || ''}
              onChange={(e) => setData({ ...data, time: e.target.value })}
              className="px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
            />
          </div>
        </div>

        {/* Event End Time */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">Event End Time</label>
          <input
            type="time"
            value={data.endTime || ''}
            onChange={(e) => setData({ ...data, endTime: e.target.value })}
            className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">Location</label>
          <input
            type="text"
            value={data.location || ''}
            onChange={(e) => setData({ ...data, location: e.target.value })}
            placeholder="Venue name or address"
            className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
          />
        </div>

        {/* Event Type */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">Event Type</label>
          <select
            value={data.eventType || ''}
            onChange={(e) => setData({ ...data, eventType: e.target.value })}
            className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
          >
            <option value="">Select event type</option>
            <option value="conference">Conference</option>
            <option value="workshop">Workshop</option>
            <option value="concert">Concert</option>
            <option value="festival">Festival</option>
            <option value="meetup">Meetup</option>
            <option value="webinar">Webinar</option>
            <option value="exhibition">Exhibition</option>
            <option value="sports">Sports</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Capacity */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">Capacity</label>
          <input
            type="number"
            value={data.capacity || ''}
            onChange={(e) => setData({ ...data, capacity: Number(e.target.value) })}
            placeholder="Max attendees"
            className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
          />
        </div>

        {/* Age Restrictions */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">Age Restrictions</label>
          <select
            value={data.ageRestriction || ''}
            onChange={(e) => setData({ ...data, ageRestriction: e.target.value })}
            className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
          >
            <option value="">No restrictions</option>
            <option value="18+">18+ only</option>
            <option value="21+">21+ only</option>
            <option value="all-ages">All ages</option>
            <option value="family">Family friendly</option>
          </select>
        </div>

        {/* Ticket Types */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Ticket Types</div>
          {data.ticketTypes.map((ticket) => (
            <div key={ticket.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm">{ticket.name} - ${ticket.price}</div>
                <button
                  onClick={() => removeTicket(ticket.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div>{ticket.description}</div>
                <div>Quantity: {ticket.quantity} | Sold: {ticket.sold}</div>
                <div>Sales: {ticket.salesStart} to {ticket.salesEnd}</div>
                <div>Per order: {ticket.minPerOrder}-{ticket.maxPerOrder}</div>
              </div>
            </div>
          ))}
          
          <div className="space-y-3 p-3 border border-gray-300 rounded-lg">
            <div className="text-xs font-medium text-gray-700">Add New Ticket Type</div>
            
            <input
              type="text"
              value={newTicket.name}
              onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })}
              placeholder="Ticket name (e.g., General Admission, VIP, Early Bird)"
              className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
            />
            
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={newTicket.price}
                onChange={(e) => setNewTicket({ ...newTicket, price: Number(e.target.value) })}
                placeholder="Price"
                className="px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
              />
              <input
                type="number"
                value={newTicket.quantity}
                onChange={(e) => setNewTicket({ ...newTicket, quantity: Number(e.target.value) })}
                placeholder="Quantity"
                className="px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
              />
            </div>
            
            <input
              type="text"
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
              placeholder="Description (what's included, benefits, etc.)"
              className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
            />
            
            <div className="grid grid-cols-2 gap-2">
              <input
                type="datetime-local"
                value={newTicket.salesStart}
                onChange={(e) => setNewTicket({ ...newTicket, salesStart: e.target.value })}
                placeholder="Sales start"
                className="px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
              />
              <input
                type="datetime-local"
                value={newTicket.salesEnd}
                onChange={(e) => setNewTicket({ ...newTicket, salesEnd: e.target.value })}
                placeholder="Sales end"
                className="px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={newTicket.minPerOrder}
                onChange={(e) => setNewTicket({ ...newTicket, minPerOrder: Number(e.target.value) })}
                placeholder="Min per order"
                className="px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
              />
              <input
                type="number"
                value={newTicket.maxPerOrder}
                onChange={(e) => setNewTicket({ ...newTicket, maxPerOrder: Number(e.target.value) })}
                placeholder="Max per order"
                className="px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
              />
            </div>
            
            <div className="flex gap-4">
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={newTicket.transferable}
                  onChange={(e) => setNewTicket({ ...newTicket, transferable: e.target.checked })}
                />
                Transferable
              </label>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={newTicket.refundable}
                  onChange={(e) => setNewTicket({ ...newTicket, refundable: e.target.checked })}
                />
                Refundable
              </label>
            </div>
            
            <button
              onClick={addTicket}
              className="w-full px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Add Ticket Type
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function HostingStep({ data, setData }: { data: ListingData; setData: (data: ListingData) => void }) {
  const [newAmenity, setNewAmenity] = useState('');
  const [newRule, setNewRule] = useState('');

  const addAmenity = () => {
    if (newAmenity.trim()) {
      setData({ ...data, amenities: [...data.amenities, newAmenity.trim()] });
      setNewAmenity('');
    }
  };

  const addRule = () => {
    if (newRule.trim()) {
      setData({ ...data, houseRules: [...data.houseRules, newRule.trim()] });
      setNewRule('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setData({ ...data, amenities: data.amenities.filter(a => a !== amenity) });
  };

  const removeRule = (rule: string) => {
    setData({ ...data, houseRules: data.houseRules.filter(r => r !== rule) });
  };

  const commonAmenities = [
    'WiFi', 'Kitchen', 'Washer', 'Dryer', 'Air conditioning', 'Heating', 'TV', 'Hair dryer',
    'Iron', 'Hot tub', 'Pool', 'Gym', 'Parking', 'Elevator', 'Smoke alarm', 'Carbon monoxide alarm',
    'Fire extinguisher', 'First aid kit', 'Luggage dropoff', 'Self check-in', 'Pets allowed',
    'Smoking allowed', 'Long term stays', 'Laptop friendly workspace'
  ];

  const commonRules = [
    'No smoking', 'No pets', 'No parties or events', 'No loud music after 10pm',
    'Check-in after 3pm', 'Check-out before 11am', 'No unregistered guests',
    'Keep noise down', 'Clean up after yourself', 'Respect neighbors'
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">🏠</span>
        </div>
        <h3 className="text-base font-medium text-gray-900 mb-1">Hosting details</h3>
        <p className="text-xs text-gray-500">Set up your space like Airbnb</p>
      </div>
      
      <div className="space-y-4">
        {/* Property Type */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">Property Type</label>
          <select
            value={data.propertyType || ''}
            onChange={(e) => setData({ ...data, propertyType: e.target.value })}
            className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
          >
            <option value="">Select property type</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="condo">Condo</option>
            <option value="townhouse">Townhouse</option>
            <option value="villa">Villa</option>
            <option value="studio">Studio</option>
            <option value="loft">Loft</option>
            <option value="cabin">Cabin</option>
            <option value="treehouse">Treehouse</option>
            <option value="yurt">Yurt</option>
            <option value="boat">Boat</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Room Details */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Bedrooms</label>
            <input
              type="number"
              value={data.bedrooms || ''}
              onChange={(e) => setData({ ...data, bedrooms: Number(e.target.value) })}
              placeholder="0"
              className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Bathrooms</label>
            <input
              type="number"
              value={data.bathrooms || ''}
              onChange={(e) => setData({ ...data, bathrooms: Number(e.target.value) })}
              placeholder="0"
              className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Beds</label>
            <input
              type="number"
              value={data.beds || ''}
              onChange={(e) => setData({ ...data, beds: Number(e.target.value) })}
              placeholder="0"
              className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
            />
          </div>
        </div>

        {/* Guest Capacity */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">Guest Capacity</label>
          <input
            type="number"
            value={data.guestCapacity || ''}
            onChange={(e) => setData({ ...data, guestCapacity: Number(e.target.value) })}
            placeholder="Max number of guests"
            className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
          />
        </div>

        {/* Check-in/out times */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Check-in Time</label>
            <input
              type="time"
              value={data.checkInTime || ''}
              onChange={(e) => setData({ ...data, checkInTime: e.target.value })}
              className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Check-out Time</label>
            <input
              type="time"
              value={data.checkOutTime || ''}
              onChange={(e) => setData({ ...data, checkOutTime: e.target.value })}
              className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
            />
          </div>
        </div>

        {/* Minimum Stay */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">Minimum Stay</label>
          <select
            value={data.minStay || ''}
            onChange={(e) => setData({ ...data, minStay: e.target.value })}
            className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
          >
            <option value="">Select minimum stay</option>
            <option value="1">1 night</option>
            <option value="2">2 nights</option>
            <option value="3">3 nights</option>
            <option value="7">1 week</option>
            <option value="14">2 weeks</option>
            <option value="30">1 month</option>
          </select>
        </div>

        {/* Amenities */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">Amenities</div>
          <div className="grid grid-cols-2 gap-1">
            {commonAmenities.map((amenity) => (
              <label key={amenity} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={data.amenities.includes(amenity)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setData({ ...data, amenities: [...data.amenities, amenity] });
                    } else {
                      setData({ ...data, amenities: data.amenities.filter(a => a !== amenity) });
                    }
                  }}
                />
                {amenity}
              </label>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addAmenity()}
              placeholder="Add custom amenity"
              className="flex-1 px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
            />
            <button
              onClick={addAmenity}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </div>
        
        {/* House Rules */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">House Rules</div>
          <div className="grid grid-cols-1 gap-1">
            {commonRules.map((rule) => (
              <label key={rule} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={data.houseRules.includes(rule)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setData({ ...data, houseRules: [...data.houseRules, rule] });
                    } else {
                      setData({ ...data, houseRules: data.houseRules.filter(r => r !== rule) });
                    }
                  }}
                />
                {rule}
              </label>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addRule()}
              placeholder="Add custom rule"
              className="flex-1 px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
            />
            <button
              onClick={addRule}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Add
            </button>
          </div>
        </div>

        {/* Safety Features */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">Safety Features</div>
          <div className="grid grid-cols-2 gap-1">
            {['Smoke alarm', 'Carbon monoxide alarm', 'Fire extinguisher', 'First aid kit', 'Security cameras', 'Safe'].map((safety) => (
              <label key={safety} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={data.safetyFeatures?.includes(safety) || false}
                  onChange={(e) => {
                    const current = data.safetyFeatures || [];
                    if (e.target.checked) {
                      setData({ ...data, safetyFeatures: [...current, safety] });
                    } else {
                      setData({ ...data, safetyFeatures: current.filter(s => s !== safety) });
                    }
                  }}
                />
                {safety}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturesStep({ data, setData }: { data: ListingData; setData: (data: ListingData) => void }) {
  const [newTicket, setNewTicket] = useState({ name: '', price: 0, description: '', quantity: 0 });
  const [newAddOn, setNewAddOn] = useState({ name: '', price: 0, description: '', isRequired: false });
  const [newAmenity, setNewAmenity] = useState('');
  const [newRule, setNewRule] = useState('');

  const addTicket = () => {
    if (newTicket.name.trim()) {
      const ticket: TicketType = {
        id: Date.now().toString(),
        ...newTicket,
        sold: 0
      };
      setData({ ...data, ticketTypes: [...data.ticketTypes, ticket] });
      setNewTicket({ name: '', price: 0, description: '', quantity: 0 });
    }
  };

  const addAddOn = () => {
    if (newAddOn.name.trim()) {
      const addOn: AddOn = {
        id: Date.now().toString(),
        ...newAddOn
      };
      setData({ ...data, addOns: [...data.addOns, addOn] });
      setNewAddOn({ name: '', price: 0, description: '', isRequired: false });
    }
  };

  const addAmenity = () => {
    if (newAmenity.trim()) {
      setData({ ...data, amenities: [...data.amenities, newAmenity.trim()] });
      setNewAmenity('');
    }
  };

  const addRule = () => {
    if (newRule.trim()) {
      setData({ ...data, houseRules: [...data.houseRules, newRule.trim()] });
      setNewRule('');
    }
  };

  const removeTicket = (id: string) => {
    setData({ ...data, ticketTypes: data.ticketTypes.filter(t => t.id !== id) });
  };

  const removeAddOn = (id: string) => {
    setData({ ...data, addOns: data.addOns.filter(a => a.id !== id) });
  };

  const removeAmenity = (amenity: string) => {
    setData({ ...data, amenities: data.amenities.filter(a => a !== amenity) });
  };

  const removeRule = (rule: string) => {
    setData({ ...data, houseRules: data.houseRules.filter(r => r !== rule) });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">⚙️</span>
        </div>
        <h3 className="text-base font-medium text-gray-900 mb-1">Add features</h3>
        <p className="text-xs text-gray-500">Ticketing, streaming, hosting options</p>
      </div>
      
      <div className="space-y-4">
        {/* Event Ticketing */}
        {data.businessType === 'ticketing' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isTicketed"
                checked={data.isTicketed}
                onChange={(e) => setData({ ...data, isTicketed: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isTicketed" className="text-sm font-medium text-gray-900">
                Enable ticketing
              </label>
            </div>
            
            {data.isTicketed && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">Ticket Types</div>
                {data.ticketTypes.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{ticket.name} - ${ticket.price}</div>
                      <div className="text-xs text-gray-500">{ticket.description}</div>
                    </div>
                    <button
                      onClick={() => removeTicket(ticket.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newTicket.name}
                    onChange={(e) => setNewTicket({ ...newTicket, name: e.target.value })}
                    placeholder="Ticket name"
                    className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={newTicket.price}
                      onChange={(e) => setNewTicket({ ...newTicket, price: Number(e.target.value) })}
                      placeholder="Price"
                      className="flex-1 px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
                    />
                    <input
                      type="number"
                      value={newTicket.quantity}
                      onChange={(e) => setNewTicket({ ...newTicket, quantity: Number(e.target.value) })}
                      placeholder="Quantity"
                      className="flex-1 px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
                    />
                  </div>
                  <input
                    type="text"
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    placeholder="Description"
                    className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
                  />
                  <button
                    onClick={addTicket}
                    className="w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Add Ticket
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Media Streaming */}
        {(data.businessType === 'streaming' || data.businessType === 'download') && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isStreamable"
                checked={data.isStreamable}
                onChange={(e) => setData({ ...data, isStreamable: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isStreamable" className="text-sm font-medium text-gray-900">
                Enable streaming
              </label>
            </div>
            
            {data.isStreamable && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Streaming Price</label>
                <input
                  type="number"
                  value={data.streamingPrice || 0}
                  onChange={(e) => setData({ ...data, streamingPrice: Number(e.target.value) })}
                  placeholder="0.00"
                  className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
                />
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDownloadable"
                checked={data.isDownloadable}
                onChange={(e) => setData({ ...data, isDownloadable: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isDownloadable" className="text-sm font-medium text-gray-900">
                Enable downloads
              </label>
            </div>
            
            {data.isDownloadable && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Download Price</label>
                <input
                  type="number"
                  value={data.downloadPrice || 0}
                  onChange={(e) => setData({ ...data, downloadPrice: Number(e.target.value) })}
                  placeholder="0.00"
                  className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
                />
              </div>
            )}
          </div>
        )}

        {/* Hosting Amenities */}
        {(data.businessType === 'rental' || data.businessType === 'booking' || data.businessType === 'reservation') && (
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-700">Amenities</div>
            <div className="flex flex-wrap gap-1">
              {data.amenities.map((amenity) => (
                <span key={amenity} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {amenity}
                  <button onClick={() => removeAmenity(amenity)} className="hover:text-blue-600">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addAmenity()}
                placeholder="Add amenity (WiFi, Pool, etc.)"
                className="flex-1 px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
              />
              <button
                onClick={addAmenity}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            
            <div className="text-xs font-medium text-gray-700">House Rules</div>
            <div className="space-y-1">
              {data.houseRules.map((rule) => (
                <div key={rule} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{rule}</span>
                  <button onClick={() => removeRule(rule)} className="text-red-500 hover:text-red-700 text-sm">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addRule()}
                placeholder="Add house rule"
                className="flex-1 px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
              />
              <button
                onClick={addRule}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Add-ons for any business */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Add-ons</div>
          {data.addOns.map((addOn) => (
            <div key={addOn.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-sm">{addOn.name} - ${addOn.price}</div>
                <div className="text-xs text-gray-500">{addOn.description}</div>
              </div>
              <button
                onClick={() => removeAddOn(addOn.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          
          <div className="space-y-2">
            <input
              type="text"
              value={newAddOn.name}
              onChange={(e) => setNewAddOn({ ...newAddOn, name: e.target.value })}
              placeholder="Add-on name"
              className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={newAddOn.price}
                onChange={(e) => setNewAddOn({ ...newAddOn, price: Number(e.target.value) })}
                placeholder="Price"
                className="flex-1 px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
              />
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={newAddOn.isRequired}
                  onChange={(e) => setNewAddOn({ ...newAddOn, isRequired: e.target.checked })}
                />
                Required
              </label>
            </div>
            <input
              type="text"
              value={newAddOn.description}
              onChange={(e) => setNewAddOn({ ...newAddOn, description: e.target.value })}
              placeholder="Description"
              className="w-full px-2 py-1 text-sm text-gray-900 border border-gray-300 rounded"
            />
            <button
              onClick={addAddOn}
              className="w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Add Add-on
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaStep({ data, setData }: { data: ListingData; setData: (data: ListingData) => void }) {
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setData({ ...data, images: [...data.images, ...files] });
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setData({ ...data, videos: [...data.videos, ...files] });
  };

  const removeImage = (index: number) => {
    setData({ ...data, images: data.images.filter((_, i) => i !== index) });
  };

  const removeVideo = (index: number) => {
    setData({ ...data, videos: data.videos.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">📸</span>
        </div>
        <h3 className="text-base font-medium text-gray-900 mb-1">Add media</h3>
        <p className="text-xs text-gray-500">Photos, videos, audio (optional)</p>
      </div>
      
      <div className="space-y-4">
        {/* Photos */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">Photos</div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="text-2xl mb-1">📷</div>
              <div className="text-xs text-gray-600">Click to upload photos</div>
              <div className="text-xs text-gray-500">Multiple angles recommended</div>
            </label>
          </div>
          
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
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Videos */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">Videos</div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input
              type="file"
              multiple
              accept="video/*"
              onChange={handleVideoChange}
              className="hidden"
              id="video-upload"
            />
            <label htmlFor="video-upload" className="cursor-pointer">
              <div className="text-2xl mb-1">🎥</div>
              <div className="text-xs text-gray-600">Click to upload videos</div>
              <div className="text-xs text-gray-500">MP4, MOV up to 100MB</div>
            </label>
          </div>
          
          {data.videos.length > 0 && (
            <div className="space-y-2">
              {data.videos.map((file, index) => (
                <div key={index} className="relative bg-gray-100 rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <div className="text-lg">🎥</div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-900">{file.name}</div>
                      <div className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                    <button
                      onClick={() => removeVideo(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audio for musicians */}
        {data.type === 'media' && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700">Audio Files</div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                multiple
                accept="audio/*"
                onChange={handleVideoChange} // Reuse video handler for now
                className="hidden"
                id="audio-upload"
              />
              <label htmlFor="audio-upload" className="cursor-pointer">
                <div className="text-2xl mb-1">🎵</div>
                <div className="text-xs text-gray-600">Click to upload audio</div>
                <div className="text-xs text-gray-500">MP3, WAV up to 50MB</div>
              </label>
            </div>
          </div>
        )}

        {/* Media tips */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs font-medium text-blue-900 mb-1">💡 Tips for great media:</div>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Use good lighting for photos</li>
            <li>• Show multiple angles</li>
            <li>• Keep videos under 2 minutes</li>
            <li>• Use high-quality audio for music</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ReviewStep({ data }: { data: ListingData }) {
  const selectedType = contentTypes.find(t => t.id === data.type);
  
  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Check size={20} className="text-green-600" />
        </div>
        <h3 className="text-base font-medium text-gray-900 mb-1">Almost done!</h3>
        <p className="text-xs text-gray-500">Review your listing</p>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 ${selectedType?.color} rounded-full flex items-center justify-center`}>
            <span className="text-sm">{selectedType?.emoji}</span>
          </div>
          <div>
            <div className="font-medium text-sm text-gray-900">{selectedType?.name}</div>
            <div className="text-xs text-gray-500">{data.category}</div>
            {data.businessType && (
              <div className="text-xs text-blue-600 font-medium">
                {data.businessType.charAt(0).toUpperCase() + data.businessType.slice(1)} model
              </div>
            )}
          </div>
        </div>
        
        <div>
          <div className="font-medium text-sm text-gray-900 mb-1">{data.title}</div>
          <div className="text-xs text-gray-600">{data.description}</div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900">
            {data.price === 0 ? 'Free' : `$${data.price}`}
          </div>
          {data.tags.length > 0 && (
            <div className="flex gap-1">
              {data.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Media summary */}
        <div className="text-xs text-gray-500">
          {data.images.length > 0 && `${data.images.length} photo${data.images.length !== 1 ? 's' : ''}`}
          {data.videos.length > 0 && `${data.images.length > 0 ? ', ' : ''}${data.videos.length} video${data.videos.length !== 1 ? 's' : ''}`}
          {data.images.length === 0 && data.videos.length === 0 && 'No media attached'}
        </div>

        {/* Features summary */}
        {data.isTicketed && data.ticketTypes.length > 0 && (
          <div className="text-xs text-gray-500">
            {data.ticketTypes.length} ticket type{data.ticketTypes.length !== 1 ? 's' : ''} configured
          </div>
        )}

        {data.isStreamable && (
          <div className="text-xs text-gray-500">
            Streaming enabled (${data.streamingPrice || 0})
          </div>
        )}

        {data.isDownloadable && (
          <div className="text-xs text-gray-500">
            Downloads enabled (${data.downloadPrice || 0})
          </div>
        )}

        {data.amenities.length > 0 && (
          <div className="text-xs text-gray-500">
            {data.amenities.length} amenit{data.amenities.length !== 1 ? 'ies' : 'y'} listed
          </div>
        )}

        {data.addOns.length > 0 && (
          <div className="text-xs text-gray-500">
            {data.addOns.length} add-on{data.addOns.length !== 1 ? 's' : ''} available
          </div>
        )}
      </div>
    </div>
  );
}
