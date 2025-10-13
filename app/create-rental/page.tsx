'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Plus, X, DollarSign, Clock, MapPin, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RentalService, RentalItem } from '@/services/rentalService';
import MediaUploader from '@/components/MediaUploader';

export default function CreateRentalPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Rental item form data
  const [rentalData, setRentalData] = useState({
    title: '',
    description: '',
    category: 'equipment' as RentalItem['category'],
    subcategory: '',
    daily_rate: 0,
    hourly_rate: 0,
    weekly_rate: 0,
    monthly_rate: 0,
    location: '',
    availability_start: '',
    availability_end: '',
    minimum_rental_period: 24, // hours
    maximum_rental_period: 168, // hours (1 week)
    security_deposit: 0,
    insurance_required: false,
    insurance_amount: 0,
    age_restriction: 18,
    license_required: '',
    delivery_available: false,
    delivery_fee: 0,
    delivery_radius: 10,
    pickup_required: true,
    images: [] as string[],
    features: [] as string[],
    condition: 'good' as RentalItem['condition'],
    maintenance_schedule: '',
  });

  const [newFeature, setNewFeature] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setRentalData(prev => ({ ...prev, [field]: value }));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setRentalData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setRentalData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = (files: any[]) => {
    const imageUrls = files.map(file => file.url);
    setRentalData(prev => ({
      ...prev,
      images: [...prev.images, ...imageUrls]
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await RentalService.createRentalItem({
        ...rentalData,
        owner_id: user.id,
        status: 'available',
      });

      if (result.success && result.item) {
        alert('Rental item created successfully!');
        router.push(`/rental/${result.item.id}`);
      } else {
        throw new Error(result.error || 'Failed to create rental item');
      }
    } catch (error: any) {
      console.error('Error creating rental item:', error);
      alert(`Error creating rental item: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
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

  const getCategorySubcategories = (category: string) => {
    const subcategories = {
      vehicle: ['car', 'truck', 'motorcycle', 'bicycle', 'boat', 'rv'],
      equipment: ['construction', 'gardening', 'power_tools', 'audio_visual', 'photography', 'kitchen'],
      property: ['apartment', 'house', 'office', 'warehouse', 'land'],
      clothing: ['formal', 'casual', 'costume', 'workwear', 'accessories'],
      electronics: ['computer', 'phone', 'tablet', 'camera', 'gaming', 'audio'],
      tools: ['hand_tools', 'power_tools', 'specialty_tools', 'measurement'],
      other: ['furniture', 'sports', 'hobby', 'collectibles'],
    };
    return subcategories[category as keyof typeof subcategories] || [];
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You must be logged in to create rental listings.</p>
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
              <h1 className="text-xl font-semibold text-gray-900">Create Rental Listing</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Step {currentStep} of 3
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Basic Info</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4">
              <div className={`h-full bg-blue-600 transition-all duration-300 ${
                currentStep >= 2 ? 'w-full' : 'w-0'
              }`} />
            </div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Pricing & Availability</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4">
              <div className={`h-full bg-blue-600 transition-all duration-300 ${
                currentStep >= 3 ? 'w-full' : 'w-0'
              }`} />
            </div>
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Review</span>
            </div>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Title *
                </label>
                <input
                  type="text"
                  value={rentalData.title}
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
                  value={rentalData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your rental item in detail"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={rentalData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="vehicle">Vehicle</option>
                    <option value="equipment">Equipment</option>
                    <option value="property">Property</option>
                    <option value="clothing">Clothing</option>
                    <option value="electronics">Electronics</option>
                    <option value="tools">Tools</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory *
                  </label>
                  <select
                    value={rentalData.subcategory}
                    onChange={(e) => handleInputChange('subcategory', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select subcategory</option>
                    {getCategorySubcategories(rentalData.category).map(sub => (
                      <option key={sub} value={sub}>
                        {sub.charAt(0).toUpperCase() + sub.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={rentalData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City, State or full address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition *
                </label>
                <select
                  value={rentalData.condition}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
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
                      placeholder="Add a feature (e.g., WiFi, GPS, etc.)"
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
                  {rentalData.features.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {rentalData.features.map((feature, index) => (
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
                  Photos
                </label>
                <MediaUploader
                  onUploadComplete={handleImageUpload}
                  accept="image/*"
                  multiple={true}
                  maxFiles={10}
                />
                {rentalData.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {rentalData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Rental item ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleInputChange('images', rentalData.images.filter((_, i) => i !== index))}
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

        {/* Step 2: Pricing & Availability */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Pricing & Availability</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Rental Rates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Rate *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="number"
                        value={rentalData.daily_rate}
                        onChange={(e) => handleInputChange('daily_rate', parseFloat(e.target.value) || 0)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hourly Rate
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="number"
                        value={rentalData.hourly_rate}
                        onChange={(e) => handleInputChange('hourly_rate', parseFloat(e.target.value) || 0)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weekly Rate
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="number"
                        value={rentalData.weekly_rate}
                        onChange={(e) => handleInputChange('weekly_rate', parseFloat(e.target.value) || 0)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Rate
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="number"
                        value={rentalData.monthly_rate}
                        onChange={(e) => handleInputChange('monthly_rate', parseFloat(e.target.value) || 0)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Availability</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available From *
                    </label>
                    <input
                      type="date"
                      value={rentalData.availability_start}
                      onChange={(e) => handleInputChange('availability_start', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available Until *
                    </label>
                    <input
                      type="date"
                      value={rentalData.availability_end}
                      onChange={(e) => handleInputChange('availability_end', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Rental Terms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Rental Period (hours) *
                    </label>
                    <input
                      type="number"
                      value={rentalData.minimum_rental_period}
                      onChange={(e) => handleInputChange('minimum_rental_period', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="24"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Rental Period (hours) *
                    </label>
                    <input
                      type="number"
                      value={rentalData.maximum_rental_period}
                      onChange={(e) => handleInputChange('maximum_rental_period', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="168"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Security & Requirements</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Security Deposit
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="number"
                        value={rentalData.security_deposit}
                        onChange={(e) => handleInputChange('security_deposit', parseFloat(e.target.value) || 0)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={rentalData.insurance_required}
                        onChange={(e) => handleInputChange('insurance_required', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Insurance Required</span>
                    </label>
                  </div>

                  {rentalData.insurance_required && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance Amount
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="number"
                          value={rentalData.insurance_amount}
                          onChange={(e) => handleInputChange('insurance_amount', parseFloat(e.target.value) || 0)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age Restriction
                    </label>
                    <input
                      type="number"
                      value={rentalData.age_restriction}
                      onChange={(e) => handleInputChange('age_restriction', parseInt(e.target.value) || 18)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="18"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Required
                    </label>
                    <input
                      type="text"
                      value={rentalData.license_required}
                      onChange={(e) => handleInputChange('license_required', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Driver's License, CDL, etc."
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Delivery Options</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={rentalData.delivery_available}
                        onChange={(e) => handleInputChange('delivery_available', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Delivery Available</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={rentalData.pickup_required}
                        onChange={(e) => handleInputChange('pickup_required', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Pickup Required</span>
                    </label>
                  </div>

                  {rentalData.delivery_available && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Delivery Fee
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="number"
                            value={rentalData.delivery_fee}
                            onChange={(e) => handleInputChange('delivery_fee', parseFloat(e.target.value) || 0)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Delivery Radius (miles)
                        </label>
                        <input
                          type="number"
                          value={rentalData.delivery_radius}
                          onChange={(e) => handleInputChange('delivery_radius', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="10"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Review Your Listing</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Item Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p><strong>Title:</strong> {rentalData.title}</p>
                  <p><strong>Category:</strong> {rentalData.category} - {rentalData.subcategory}</p>
                  <p><strong>Location:</strong> {rentalData.location}</p>
                  <p><strong>Condition:</strong> {rentalData.condition}</p>
                  <p><strong>Description:</strong> {rentalData.description}</p>
                  {rentalData.features.length > 0 && (
                    <div>
                      <strong>Features:</strong>
                      <ul className="list-disc list-inside ml-4">
                        {rentalData.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Pricing</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {rentalData.daily_rate > 0 && (
                      <div>
                        <p className="text-sm text-gray-600">Daily Rate</p>
                        <p className="font-semibold">${rentalData.daily_rate}</p>
                      </div>
                    )}
                    {rentalData.hourly_rate > 0 && (
                      <div>
                        <p className="text-sm text-gray-600">Hourly Rate</p>
                        <p className="font-semibold">${rentalData.hourly_rate}</p>
                      </div>
                    )}
                    {rentalData.weekly_rate > 0 && (
                      <div>
                        <p className="text-sm text-gray-600">Weekly Rate</p>
                        <p className="font-semibold">${rentalData.weekly_rate}</p>
                      </div>
                    )}
                    {rentalData.monthly_rate > 0 && (
                      <div>
                        <p className="text-sm text-gray-600">Monthly Rate</p>
                        <p className="font-semibold">${rentalData.monthly_rate}</p>
                      </div>
                    )}
                  </div>
                  {rentalData.security_deposit > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p><strong>Security Deposit:</strong> ${rentalData.security_deposit}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-md font-medium text-gray-900 mb-2">Availability & Terms</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p><strong>Available:</strong> {rentalData.availability_start} to {rentalData.availability_end}</p>
                  <p><strong>Minimum Rental:</strong> {rentalData.minimum_rental_period} hours</p>
                  <p><strong>Maximum Rental:</strong> {rentalData.maximum_rental_period} hours</p>
                  <p><strong>Age Restriction:</strong> {rentalData.age_restriction}+ years</p>
                  {rentalData.license_required && (
                    <p><strong>License Required:</strong> {rentalData.license_required}</p>
                  )}
                  {rentalData.delivery_available && (
                    <p><strong>Delivery:</strong> Available (${rentalData.delivery_fee} fee, {rentalData.delivery_radius} mile radius)</p>
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
            disabled={loading || (currentStep === 1 && (!rentalData.title || !rentalData.description)) || (currentStep === 2 && rentalData.daily_rate === 0)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
            {currentStep === 3 ? 'Create Listing' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
