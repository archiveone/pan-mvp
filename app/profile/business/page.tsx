'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  Building2, 
  CreditCard, 
  Shield, 
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Save,
  Upload,
  Globe,
  MapPin,
  Phone,
  Mail
} from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'
import ProfileNavigation from '@/components/ProfileNavigation'

export default function BusinessProfileSetup() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Business Info
    is_business: false,
    business_type: '',
    profile_type: 'business',
    
    // Business Details
    business_name: '',
    business_description: '',
    business_website: '',
    business_location: '',
    business_phone: '',
    business_email: '',
    
    // Verification
    business_verified: false,
    verification_documents: [] as string[],
    
    // Stripe
    stripe_customer_id: '',
    stripe_account_id: '',
    
    // Additional
    business_hours: '',
    business_category: '',
    business_size: '',
    established_year: ''
  })

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        is_business: profile.is_business || false,
        business_type: profile.business_type || '',
        profile_type: profile.profile_type || 'business',
        stripe_customer_id: profile.stripe_customer_id || ''
      }))
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_business: true,
          business_type: formData.business_type,
          profile_type: 'business',
          stripe_customer_id: formData.stripe_customer_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      alert('Business profile updated successfully!')
      setStep(4) // Move to completion step
    } catch (error) {
      console.error('Error updating business profile:', error)
      alert('Failed to update business profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const businessTypes = [
    { value: 'retail', label: 'Retail Store', description: 'Physical or online retail business' },
    { value: 'restaurant', label: 'Restaurant', description: 'Food service establishment' },
    { value: 'service', label: 'Service Provider', description: 'Professional services' },
    { value: 'tech', label: 'Technology', description: 'Software, apps, or tech services' },
    { value: 'creative', label: 'Creative', description: 'Design, art, or creative services' },
    { value: 'consulting', label: 'Consulting', description: 'Business consulting services' },
    { value: 'other', label: 'Other', description: 'Other business type' }
  ]

  const businessSizes = [
    { value: 'solo', label: 'Solo Entrepreneur' },
    { value: 'small', label: 'Small Business (2-10 employees)' },
    { value: 'medium', label: 'Medium Business (11-50 employees)' },
    { value: 'large', label: 'Large Business (50+ employees)' }
  ]

  const businessCategories = [
    'Food & Beverage',
    'Retail & E-commerce',
    'Technology',
    'Healthcare',
    'Education',
    'Finance',
    'Real Estate',
    'Entertainment',
    'Professional Services',
    'Manufacturing',
    'Other'
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
          <p className="text-gray-600 mb-6">You need to be signed in to set up your business profile.</p>
          <Link 
            href="/"
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Business Profile Setup</h1>
              <p className="text-gray-600">Set up your business account and features</p>
            </div>
            <Link
              href="/profile"
              className="text-gray-500 hover:text-gray-700 flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Profile</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation */}
          <div className="lg:col-span-1">
            <ProfileNavigation />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Progress Steps */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  {[1, 2, 3, 4].map((stepNumber) => (
                    <div key={stepNumber} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step >= stepNumber 
                          ? 'bg-black text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {stepNumber}
                      </div>
                      {stepNumber < 4 && (
                        <div className={`w-16 h-1 mx-2 ${
                          step > stepNumber ? 'bg-black' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-600">
                  <span>Business Type</span>
                  <span>Details</span>
                  <span>Verification</span>
                  <span>Complete</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Business Type */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        What type of business do you run?
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {businessTypes.map((type) => (
                          <label
                            key={type.value}
                            className={`relative cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                              formData.business_type === type.value
                                ? 'border-black bg-black text-white'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="business_type"
                              value={type.value}
                              checked={formData.business_type === type.value}
                              onChange={handleChange}
                              className="sr-only"
                            />
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className={`text-sm ${
                                formData.business_type === type.value ? 'text-gray-300' : 'text-gray-500'
                              }`}>
                                {type.description}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        disabled={!formData.business_type}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next Step
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Business Details */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Tell us about your business
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-2">
                            Business Name *
                          </label>
                          <input
                            type="text"
                            id="business_name"
                            name="business_name"
                            value={formData.business_name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="business_size" className="block text-sm font-medium text-gray-700 mb-2">
                            Business Size
                          </label>
                          <select
                            id="business_size"
                            name="business_size"
                            value={formData.business_size}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          >
                            <option value="">Select business size</option>
                            {businessSizes.map((size) => (
                              <option key={size.value} value={size.value}>
                                {size.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="business_category" className="block text-sm font-medium text-gray-700 mb-2">
                            Business Category
                          </label>
                          <select
                            id="business_category"
                            name="business_category"
                            value={formData.business_category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          >
                            <option value="">Select category</option>
                            {businessCategories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="established_year" className="block text-sm font-medium text-gray-700 mb-2">
                            Established Year
                          </label>
                          <input
                            type="number"
                            id="established_year"
                            name="established_year"
                            value={formData.established_year}
                            onChange={handleChange}
                            min="1900"
                            max={new Date().getFullYear()}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label htmlFor="business_description" className="block text-sm font-medium text-gray-700 mb-2">
                          Business Description
                        </label>
                        <textarea
                          id="business_description"
                          name="business_description"
                          value={formData.business_description}
                          onChange={handleChange}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="Describe your business, what you do, and what makes you unique..."
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label htmlFor="business_website" className="block text-sm font-medium text-gray-700 mb-2">
                            Website
                          </label>
                          <input
                            type="url"
                            id="business_website"
                            name="business_website"
                            value={formData.business_website}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="https://yourbusiness.com"
                          />
                        </div>
                        <div>
                          <label htmlFor="business_location" className="block text-sm font-medium text-gray-700 mb-2">
                            Location
                          </label>
                          <input
                            type="text"
                            id="business_location"
                            name="business_location"
                            value={formData.business_location}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="City, State, Country"
                          />
                        </div>
                        <div>
                          <label htmlFor="business_phone" className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            id="business_phone"
                            name="business_phone"
                            value={formData.business_phone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        <div>
                          <label htmlFor="business_email" className="block text-sm font-medium text-gray-700 mb-2">
                            Business Email
                          </label>
                          <input
                            type="email"
                            id="business_email"
                            name="business_email"
                            value={formData.business_email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="contact@yourbusiness.com"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Next Step
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Verification */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Business Verification
                      </h3>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                          <Shield className="w-5 h-5 text-blue-600 mr-2" />
                          <div>
                            <h4 className="text-sm font-medium text-blue-800">Verification Benefits</h4>
                            <p className="text-sm text-blue-700">
                              Verified businesses get a badge, higher search rankings, and access to premium features.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Business Documents
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              Upload business license, tax ID, or other verification documents
                            </p>
                            <input
                              type="file"
                              multiple
                              accept=".pdf,.jpg,.jpeg,.png"
                              className="hidden"
                            />
                            <button
                              type="button"
                              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                            >
                              Choose Files
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="business_verified"
                            name="business_verified"
                            checked={formData.business_verified}
                            onChange={handleChange}
                            className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                          />
                          <label htmlFor="business_verified" className="text-sm font-medium text-gray-700">
                            I confirm that all information provided is accurate and up-to-date
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(4)}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Complete Setup
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Completion */}
                {step === 4 && (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Business Profile Setup Complete!
                      </h3>
                      <p className="text-gray-600">
                        Your business profile has been created successfully. You can now access business features and start building your presence on Pan.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <Building2 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                        <h4 className="font-medium text-gray-900">Business Badge</h4>
                        <p className="text-sm text-gray-600">Your profile now shows a business badge</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <CreditCard className="w-6 h-6 text-green-600 mx-auto mb-2" />
                        <h4 className="font-medium text-gray-900">Payment Setup</h4>
                        <p className="text-sm text-gray-600">Set up payments to receive money</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <Shield className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                        <h4 className="font-medium text-gray-900">Verification</h4>
                        <p className="text-sm text-gray-600">Get verified for more features</p>
                      </div>
                    </div>
                    <div className="flex justify-center space-x-4">
                      <Link
                        href="/dashboard"
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Go to Dashboard
                      </Link>
                      <Link
                        href="/profile/comprehensive"
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Manage Profile
                      </Link>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      <AppFooter />
      <BottomNav />
    </div>
  )
}

