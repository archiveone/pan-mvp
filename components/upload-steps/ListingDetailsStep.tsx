'use client'

import { useState } from 'react'
import { DollarSign, Package, Truck, MapPin } from 'lucide-react'

interface ListingDetailsStepProps {
  data: Partial<any>
  onChange: (data: Partial<any>) => void
}

const conditions = [
  { value: 'new', label: 'New', description: 'Brand new, never used' },
  { value: 'like_new', label: 'Like New', description: 'Excellent condition, minimal wear' },
  { value: 'good', label: 'Good', description: 'Some wear but works perfectly' },
  { value: 'fair', label: 'Fair', description: 'Noticeable wear but functional' },
  { value: 'poor', label: 'Poor', description: 'Heavy wear or damage' }
]

const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' }
]

export default function ListingDetailsStep({ data, onChange }: ListingDetailsStepProps) {
  const [price, setPrice] = useState(data.price || '')
  const [currency, setCurrency] = useState(data.currency || 'EUR')
  const [condition, setCondition] = useState(data.condition || '')
  const [quantity, setQuantity] = useState(data.quantity || 1)
  const [isNegotiable, setIsNegotiable] = useState(data.isNegotiable || false)
  const [shippingOptions, setShippingOptions] = useState(data.shippingOptions || {
    localPickup: true,
    shipping: false,
    shippingCost: ''
  })

  const handlePriceChange = (value: string) => {
    setPrice(value)
    onChange({ price: parseFloat(value) || 0 })
  }

  const handleShippingCostChange = (value: string) => {
    setShippingOptions(prev => ({
      ...prev,
      shippingCost: value
    }))
    onChange({ 
      shippingOptions: {
        ...shippingOptions,
        shippingCost: parseFloat(value) || 0
      }
    })
  }

  const updateShippingOptions = (updates: Partial<typeof shippingOptions>) => {
    const newOptions = { ...shippingOptions, ...updates }
    setShippingOptions(newOptions)
    onChange({ shippingOptions: newOptions })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Listing Details
        </h3>
        <p className="text-gray-600">
          Set the price and details for your marketplace listing
        </p>
      </div>

      {/* Price Section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <DollarSign className="w-6 h-6 text-green-600 mr-2" />
          <h4 className="font-semibold text-green-900">Pricing</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price *
            </label>
            <div className="flex">
              <input
                type="number"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <select
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value)
                  onChange({ currency: e.target.value })
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity Available
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => {
                setQuantity(parseInt(e.target.value) || 1)
                onChange({ quantity: parseInt(e.target.value) || 1 })
              }}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isNegotiable}
              onChange={(e) => {
                setIsNegotiable(e.target.checked)
                onChange({ isNegotiable: e.target.checked })
              }}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Price is negotiable
            </span>
          </label>
        </div>
      </div>

      {/* Condition Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Package className="w-6 h-6 text-blue-600 mr-2" />
          <h4 className="font-semibold text-blue-900">Condition</h4>
        </div>

        <div className="space-y-3">
          {conditions.map((cond) => (
            <label key={cond.value} className="flex items-start">
              <input
                type="radio"
                name="condition"
                value={cond.value}
                checked={condition === cond.value}
                onChange={(e) => {
                  setCondition(e.target.value)
                  onChange({ condition: e.target.value })
                }}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <div className="font-medium text-gray-900">{cond.label}</div>
                <div className="text-sm text-gray-600">{cond.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Shipping Options */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Truck className="w-6 h-6 text-purple-600 mr-2" />
          <h4 className="font-semibold text-purple-900">Shipping Options</h4>
        </div>

        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={shippingOptions.localPickup}
              onChange={(e) => updateShippingOptions({ localPickup: e.target.checked })}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Local pickup available
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={shippingOptions.shipping}
              onChange={(e) => updateShippingOptions({ shipping: e.target.checked })}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Shipping available
            </span>
          </label>

          {shippingOptions.shipping && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Cost
              </label>
              <div className="flex">
                <input
                  type="number"
                  value={shippingOptions.shippingCost}
                  onChange={(e) => handleShippingCostChange(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <span className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 text-gray-700">
                  {currency}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for free shipping
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Location Details */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <MapPin className="w-6 h-6 text-orange-600 mr-2" />
          <h4 className="font-semibold text-orange-900">Location Details</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pickup/Meet Location
          </label>
          <input
            type="text"
            value={data.meetLocation || ''}
            onChange={(e) => onChange({ meetLocation: e.target.value })}
            placeholder="Where can buyers pick up the item?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            This helps buyers know where to meet you
          </p>
        </div>
      </div>
    </div>
  )
}

