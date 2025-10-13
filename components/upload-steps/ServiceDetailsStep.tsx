'use client'

import { useState } from 'react'
import { Briefcase, DollarSign, Clock, Shield } from 'lucide-react'

interface ServiceDetailsStepProps {
  data: Partial<any>
  onChange: (data: Partial<any>) => void
}

export default function ServiceDetailsStep({ data, onChange }: ServiceDetailsStepProps) {
  const [pricingType, setPricingType] = useState(data.pricing?.type || 'fixed')
  const [basePrice, setBasePrice] = useState(data.pricing?.basePrice || '')
  const [currency, setCurrency] = useState(data.pricing?.currency || 'EUR')
  const [duration, setDuration] = useState(data.duration || '')
  const [capacity, setCapacity] = useState(data.capacity || '')

  const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' }
  ]

  const pricingTypes = [
    { value: 'fixed', label: 'Fixed Price', description: 'Same price regardless of time' },
    { value: 'hourly', label: 'Hourly Rate', description: 'Price per hour' },
    { value: 'per_person', label: 'Per Person', description: 'Price per person' },
    { value: 'per_item', label: 'Per Item', description: 'Price per item/service' }
  ]

  const durations = [
    '30 minutes', '1 hour', '1.5 hours', '2 hours', '3 hours', 
    '4 hours', '6 hours', '8 hours', 'Full day', 'Custom'
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Service Details
        </h3>
        <p className="text-gray-600">
          Set up pricing, duration, and booking requirements for your service
        </p>
      </div>

      {/* Pricing */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <DollarSign className="w-6 h-6 text-green-600 mr-2" />
          <h4 className="font-semibold text-green-900">Pricing Structure</h4>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pricing Type *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pricingTypes.map((type) => (
                <label key={type.value} className="flex items-start">
                  <input
                    type="radio"
                    name="pricingType"
                    value={type.value}
                    checked={pricingType === type.value}
                    onChange={(e) => {
                      setPricingType(e.target.value)
                      onChange({ 
                        pricing: { 
                          ...data.pricing, 
                          type: e.target.value 
                        } 
                      })
                    }}
                    className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-600">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {pricingType === 'hourly' ? 'Hourly Rate' : 
                 pricingType === 'per_person' ? 'Price Per Person' :
                 pricingType === 'per_item' ? 'Price Per Item' : 'Base Price'} *
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => {
                    setBasePrice(e.target.value)
                    onChange({ 
                      pricing: { 
                        ...data.pricing, 
                        basePrice: parseFloat(e.target.value) || 0 
                      } 
                    })
                  }}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <select
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value)
                    onChange({ 
                      pricing: { 
                        ...data.pricing, 
                        currency: e.target.value 
                      } 
                    })
                  }}
                  className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {currencies.map(curr => (
                    <option key={curr.value} value={curr.value}>
                      {curr.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {pricingType === 'fixed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => {
                    setDuration(e.target.value)
                    onChange({ duration: e.target.value })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select duration</option>
                  {durations.map(dur => (
                    <option key={dur} value={dur}>{dur}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Capacity */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Briefcase className="w-6 h-6 text-blue-600 mr-2" />
          <h4 className="font-semibold text-blue-900">Service Capacity</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Capacity (optional)
          </label>
          <input
            type="number"
            value={capacity}
            onChange={(e) => {
              setCapacity(e.target.value)
              onChange({ capacity: parseInt(e.target.value) || undefined })
            }}
            placeholder="Number of people you can serve"
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty if no limit
          </p>
        </div>
      </div>

      {/* Service Details */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Clock className="w-6 h-6 text-purple-600 mr-2" />
          <h4 className="font-semibold text-purple-900">Service Information</h4>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's Included
            </label>
            <textarea
              value={data.includes || ''}
              onChange={(e) => onChange({ includes: e.target.value })}
              placeholder="List what's included in your service..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's Not Included
            </label>
            <textarea
              value={data.excludes || ''}
              onChange={(e) => onChange({ excludes: e.target.value })}
              placeholder="List what's not included or additional costs..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Requirements
            </label>
            <textarea
              value={data.requirements || ''}
              onChange={(e) => onChange({ requirements: e.target.value })}
              placeholder="What should customers bring or prepare..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Booking Requirements */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Shield className="w-6 h-6 text-orange-600 mr-2" />
          <h4 className="font-semibold text-orange-900">Booking Requirements</h4>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Advance Booking Required
            </label>
            <select
              value={data.advanceBooking || '24'}
              onChange={(e) => onChange({ advanceBooking: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="1">1 hour</option>
              <option value="6">6 hours</option>
              <option value="12">12 hours</option>
              <option value="24">24 hours</option>
              <option value="48">48 hours</option>
              <option value="72">72 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Notice Required
            </label>
            <select
              value={data.minimumNotice || '2'}
              onChange={(e) => onChange({ minimumNotice: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="4">4 hours</option>
              <option value="6">6 hours</option>
              <option value="12">12 hours</option>
              <option value="24">24 hours</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={data.requiresApproval || false}
              onChange={(e) => onChange({ requiresApproval: e.target.checked })}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Require approval for bookings
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}






