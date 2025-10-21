'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Plus, X, DollarSign, Package, Truck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MarketplaceService } from '@/services/marketplaceService';
import MediaUploader from '@/components/MediaUploader';

export default function CreateListingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [listingData, setListingData] = useState({
    title: '',
    description: '',
    category: 'product' as any,
    subcategory: '',
    listing_type: 'instant_buy' as any,
    price: 0,
    original_price: 0,
    quantity_available: 1,
    minimum_order: 1,
    maximum_order: 10,
    condition: 'new' as any,
    images: [] as string[],
    features: [] as string[],
    tags: [] as string[],
    location: '',
    delivery_available: false,
    delivery_fee: 0,
    delivery_methods: ['pickup'] as string[],
    availability_start: '',
    availability_end: '',
    booking_required: false,
    cancellation_policy: 'no_refund' as any,
    return_policy: 'no_returns' as any,
    warranty_info: '',
    age_restriction: 0,
    tax_included: false,
    tax_rate: 0,
  });

  const [newFeature, setNewFeature] = useState('');
  const [newTag, setNewTag] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setListingData(prev => ({ ...prev, [field]: value }));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setListingData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const addTag = () => {
    if (newTag.trim()) {
      setListingData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeFeature = (index: number) => {
    setListingData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const removeTag = (index: number) => {
    setListingData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = (files: any[]) => {
    const imageUrls = files.map(file => file.url);
    setListingData(prev => ({
      ...prev,
      images: [...prev.images, ...imageUrls]
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await MarketplaceService.createListing({
        ...listingData,
        seller_id: user.id,
        currency: 'USD',
        quantity_sold: 0,
        status: 'active',
        featured: false,
        promoted: false,
        views_count: 0,
        favorites_count: 0,
        rating_average: 0,
        rating_count: 0,
      } as any);

      if (result.success && result.listing) {
        alert('Listing created successfully!');
        router.push(`/listing/${result.listing.id}`);
      } else {
        throw new Error(result.error || 'Failed to create listing');
      }
    } catch (error: any) {
      console.error('Error creating listing:', error);
      alert(`Error creating listing: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You must be logged in to create listings.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Create Marketplace Listing</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Step {currentStep} of 4
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className="flex-1 h-0.5 bg-gray-200 mx-4">
                    <div className={`h-full bg-blue-600 transition-all duration-300 ${
                      currentStep > step ? 'w-full' : 'w-0'
                    }`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Listing Title *
                </label>
                <input
                  type="text"
                  value={listingData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Professional Camera Kit"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={listingData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your item in detail"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={listingData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                    <option value="experience">Experience</option>
                    <option value="event_ticket">Event Ticket</option>
                    <option value="rental_item">Rental Item</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Listing Type *
                  </label>
                  <select
                    value={listingData.listing_type}
                    onChange={(e) => handleInputChange('listing_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="instant_buy">Instant Buy</option>
                    <option value="auction">Auction</option>
                    <option value="reservation">Reservation</option>
                    <option value="subscription">Subscription</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition *
                  </label>
                  <select
                    value={listingData.condition}
                    onChange={(e) => handleInputChange('condition', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="new">New</option>
                    <option value="like_new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={listingData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City, State or full address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos *
                </label>
                <MediaUploader
                  onUploadComplete={handleImageUpload}
                  accept="image/*"
                  multiple={true}
                  maxFiles={10}
                />
                {listingData.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {listingData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Listing ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleInputChange('images', listingData.images.filter((_, i) => i !== index))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pricing & Inventory */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Pricing & Inventory</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="number"
                      value={listingData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Price
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="number"
                      value={listingData.original_price}
                      onChange={(e) => handleInputChange('original_price', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity Available *
                  </label>
                  <input
                    type="number"
                    value={listingData.quantity_available}
                    onChange={(e) => handleInputChange('quantity_available', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Order
                  </label>
                  <input
                    type="number"
                    value={listingData.minimum_order}
                    onChange={(e) => handleInputChange('minimum_order', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Order
                  </label>
                  <input
                    type="number"
                    value={listingData.maximum_order}
                    onChange={(e) => handleInputChange('maximum_order', parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add a feature"
                      onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                    />
                    <button
                      type="button"
                      onClick={addFeature}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  {listingData.features.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {listingData.features.map((feature, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {feature}
                          <button
                            onClick={() => removeFeature(index)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add a tag"
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  {listingData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {listingData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(index)}
                            className="ml-2 text-gray-600 hover:text-gray-800"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Delivery & Policies */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Delivery & Policies</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Delivery Options</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={listingData.delivery_available}
                        onChange={(e) => handleInputChange('delivery_available', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Delivery Available</span>
                    </label>
                  </div>

                  {listingData.delivery_available && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Fee
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="number"
                          value={listingData.delivery_fee}
                          onChange={(e) => handleInputChange('delivery_fee', parseFloat(e.target.value) || 0)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Policies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cancellation Policy
                    </label>
                    <select
                      value={listingData.cancellation_policy}
                      onChange={(e) => handleInputChange('cancellation_policy', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="no_refund">No Refunds</option>
                      <option value="full_refund_24h">Full Refund (24 hours)</option>
                      <option value="full_refund_7d">Full Refund (7 days)</option>
                      <option value="partial_refund_14d">Partial Refund (14 days)</option>
                      <option value="custom">Custom Policy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Return Policy
                    </label>
                    <select
                      value={listingData.return_policy}
                      onChange={(e) => handleInputChange('return_policy', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="no_returns">No Returns</option>
                      <option value="30_day_return">30 Day Return</option>
                      <option value="14_day_return">14 Day Return</option>
                      <option value="custom">Custom Policy</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Warranty Information
                    </label>
                    <textarea
                      value={listingData.warranty_info}
                      onChange={(e) => handleInputChange('warranty_info', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe warranty coverage"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age Restriction
                    </label>
                    <input
                      type="number"
                      value={listingData.age_restriction}
                      onChange={(e) => handleInputChange('age_restriction', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0 for no restriction"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={listingData.tax_included}
                        onChange={(e) => handleInputChange('tax_included', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Tax Included in Price</span>
                    </label>
                  </div>

                  {!listingData.tax_included && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        value={listingData.tax_rate}
                        onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Review Your Listing</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Listing Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p><strong>Title:</strong> {listingData.title}</p>
                  <p><strong>Category:</strong> {listingData.category}</p>
                  <p><strong>Type:</strong> {listingData.listing_type}</p>
                  <p><strong>Condition:</strong> {listingData.condition}</p>
                  <p><strong>Location:</strong> {listingData.location}</p>
                  <p><strong>Description:</strong> {listingData.description}</p>
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Pricing & Inventory</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p><strong>Price:</strong> ${listingData.price}</p>
                  {listingData.original_price > 0 && (
                    <p><strong>Original Price:</strong> ${listingData.original_price}</p>
                  )}
                  <p><strong>Quantity Available:</strong> {listingData.quantity_available}</p>
                  <p><strong>Order Limits:</strong> {listingData.minimum_order} - {listingData.maximum_order}</p>
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Features & Tags</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {listingData.features.length > 0 && (
                    <div>
                      <strong>Features:</strong>
                      <ul className="list-disc list-inside ml-4">
                        {listingData.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {listingData.tags.length > 0 && (
                    <div className="mt-2">
                      <strong>Tags:</strong>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {listingData.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Policies</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p><strong>Cancellation:</strong> {listingData.cancellation_policy}</p>
                  <p><strong>Returns:</strong> {listingData.return_policy}</p>
                  {listingData.warranty_info && (
                    <p><strong>Warranty:</strong> {listingData.warranty_info}</p>
                  )}
                  {listingData.age_restriction > 0 && (
                    <p><strong>Age Restriction:</strong> {listingData.age_restriction}+ years</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <button
            onClick={nextStep}
            disabled={loading || (currentStep === 1 && (!listingData.title || !listingData.description))}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
            {currentStep === 4 ? 'Create Listing' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}