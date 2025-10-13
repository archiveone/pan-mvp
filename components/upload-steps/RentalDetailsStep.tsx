'use client'

import { useState } from 'react'
import { Clock, DollarSign, Calendar, Shield } from 'lucide-react'

interface RentalDetailsStepProps {
  data: Partial<any>
  onChange: (data: Partial<any>) => void
}

export default function RentalDetailsStep({ data, onChange }: RentalDetailsStepProps) {
  const [hourlyRate, setHourlyRate] = useState(data.hourlyRate || '')
  const [dailyRate, setDailyRate] = useState(data.dailyRate || '')
  const [weeklyRate, setWeeklyRate] = useState(data.weeklyRate || '')
  const [monthlyRate, setMonthlyRate] = useState(data.monthlyRate || '')
  const [currency, setCurrency] = useState(data.currency || 'EUR')
  const [depositRequired, setDepositRequired] = useState(data.depositRequired || '')
  const [minimumRentalPeriod, setMinimumRentalPeriod] = useState(data.minimumRentalPeriod || '1 day')
  const [maximumRentalPeriod, setMaximumRentalPeriod] = useState(data.maximumRentalPeriod || '')

  const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' }
  ]

  const rentalPeriods = [
    '1 hour', '2 hours', '4 hours', '6 hours', '12 hours',
    '1 day', '2 days', '3 days', '1 week', '2 weeks', '1 month'
  ]

  const cancellationPolicies = [
    { value: 'flexible', label: 'Flexible', description: 'Free cancellation up to 24 hours before' },
    { value: 'moderate', label: 'Moderate', description: 'Free cancellation up to 48 hours before' },
    { value: 'strict', label: 'Strict', description: 'No free cancellation' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Rental Details
        </h3>
        <p className="text-gray-600">
          Set up pricing, availability, and booking requirements for your rental item
        </p>
      </div>

      {/* Pricing */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <DollarSign className="w-6 h-6 text-green-600 mr-2" />
          <h4 className="font-semibold text-green-900">Pricing</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hourly Rate
            </label>
            <div className="flex">
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => {
                  setHourlyRate(e.target.value)
                  onChange({ hourlyRate: parseFloat(e.target.value) || 0 })
                }}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <span className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 text-gray-700">
                {currency}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Rate
            </label>
            <div className="flex">
              <input
                type="number"
                value={dailyRate}
                onChange={(e) => {
                  setDailyRate(e.target.value)
                  onChange({ dailyRate: parseFloat(e.target.value) || 0 })
                }}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <span className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 text-gray-700">
                {currency}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weekly Rate
            </label>
            <div className="flex">
              <input
                type="number"
                value={weeklyRate}
                onChange={(e) => {
                  setWeeklyRate(e.target.value)
                  onChange({ weeklyRate: parseFloat(e.target.value) || 0 })
                }}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <span className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 text-gray-700">
                {currency}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Rate
            </label>
            <div className="flex">
              <input
                type="number"
                value={monthlyRate}
                onChange={(e) => {
                  setMonthlyRate(e.target.value)
                  onChange({ monthlyRate: parseFloat(e.target.value) || 0 })
                }}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <span className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 text-gray-700">
                {currency}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value)
              onChange({ currency: e.target.value })
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            {currencies.map(curr => (
              <option key={curr.value} value={curr.value}>
                {curr.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rental Terms */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Clock className="w-6 h-6 text-blue-600 mr-2" />
          <h4 className="font-semibold text-blue-900">Rental Terms</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deposit Required
            </label>
            <div className="flex">
              <input
                type="number"
                value={depositRequired}
                onChange={(e) => {
                  setDepositRequired(e.target.value)
                  onChange({ depositRequired: parseFloat(e.target.value) || 0 })
                }}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg bg-gray-50 text-gray-700">
                {currency}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Rental Period
            </label>
            <select
              value={minimumRentalPeriod}
              onChange={(e) => {
                setMinimumRentalPeriod(e.target.value)
                onChange({ minimumRentalPeriod: e.target.value })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {rentalPeriods.map(period => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Rental Period (optional)
          </label>
          <select
            value={maximumRentalPeriod}
            onChange={(e) => {
              setMaximumRentalPeriod(e.target.value)
              onChange({ maximumRentalPeriod: e.target.value })
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">No limit</option>
            {rentalPeriods.map(period => (
              <option key={period} value={period}>{period}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Booking Requirements */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Shield className="w-6 h-6 text-purple-600 mr-2" />
          <h4 className="font-semibold text-purple-900">Booking Requirements</h4>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Advance Booking Required
            </label>
            <select
              value={data.advanceBooking || '24'}
              onChange={(e) => onChange({ advanceBooking: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
              Cancellation Policy
            </label>
            <div className="space-y-2">
              {cancellationPolicies.map((policy) => (
                <label key={policy.value} className="flex items-start">
                  <input
                    type="radio"
                    name="cancellationPolicy"
                    value={policy.value}
                    checked={data.cancellationPolicy === policy.value}
                    onChange={(e) => onChange({ cancellationPolicy: e.target.value })}
                    className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{policy.label}</div>
                    <div className="text-sm text-gray-600">{policy.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={data.requiresApproval || false}
              onChange={(e) => onChange({ requiresApproval: e.target.checked })}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
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






