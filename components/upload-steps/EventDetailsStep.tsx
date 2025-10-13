'use client'

import { useState } from 'react'
import { Calendar, Clock, MapPin, Users, Ticket, DollarSign } from 'lucide-react'

interface EventDetailsStepProps {
  data: Partial<any>
  onChange: (data: Partial<any>) => void
}

export default function EventDetailsStep({ data, onChange }: EventDetailsStepProps) {
  const [startDate, setStartDate] = useState(data.startDate || '')
  const [startTime, setStartTime] = useState(data.startTime || '')
  const [endDate, setEndDate] = useState(data.endDate || '')
  const [endTime, setEndTime] = useState(data.endTime || '')
  const [venue, setVenue] = useState(data.venue || '')
  const [address, setAddress] = useState(data.address || '')
  const [capacity, setCapacity] = useState(data.capacity || '')
  const [ticketPrice, setTicketPrice] = useState(data.ticketPrice || '')
  const [currency, setCurrency] = useState(data.currency || 'EUR')
  const [ageRestriction, setAgeRestriction] = useState(data.ageRestriction || '')
  const [requiresApproval, setRequiresApproval] = useState(data.requiresApproval || false)

  const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD (C$)' },
    { value: 'AUD', label: 'AUD (A$)' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Event Details
        </h3>
        <p className="text-gray-600">
          Set up your event with dates, location, and ticketing
        </p>
      </div>

      {/* Date & Time */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Calendar className="w-6 h-6 text-blue-600 mr-2" />
          <h4 className="font-semibold text-blue-900">Date & Time</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                onChange({ startDate: e.target.value })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time *
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value)
                onChange({ startTime: e.target.value })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date (optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                onChange({ endDate: e.target.value })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time (optional)
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => {
                setEndTime(e.target.value)
                onChange({ endTime: e.target.value })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <MapPin className="w-6 h-6 text-green-600 mr-2" />
          <h4 className="font-semibold text-green-900">Location</h4>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Venue Name *
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => {
                setVenue(e.target.value)
                onChange({ venue: e.target.value })
              }}
              placeholder="e.g., Community Center, Park, Restaurant"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <textarea
              value={address}
              onChange={(e) => {
                setAddress(e.target.value)
                onChange({ address: e.target.value })
              }}
              placeholder="Full address including city, state, postal code"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
      </div>

      {/* Capacity & Pricing */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Users className="w-6 h-6 text-purple-600 mr-2" />
          <h4 className="font-semibold text-purple-900">Capacity & Pricing</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Capacity
            </label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => {
                setCapacity(e.target.value)
                onChange({ capacity: parseInt(e.target.value) || undefined })
              }}
              placeholder="Number of attendees"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ticket Price
            </label>
            <div className="flex">
              <input
                type="number"
                value={ticketPrice}
                onChange={(e) => {
                  setTicketPrice(e.target.value)
                  onChange({ ticketPrice: parseFloat(e.target.value) || 0 })
                }}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <select
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value)
                  onChange({ currency: e.target.value })
                }}
                className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {currencies.map(curr => (
                  <option key={curr.value} value={curr.value}>
                    {curr.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Age Restriction (optional)
          </label>
          <input
            type="number"
            value={ageRestriction}
            onChange={(e) => {
              setAgeRestriction(e.target.value)
              onChange({ ageRestriction: parseInt(e.target.value) || undefined })
            }}
            placeholder="Minimum age (leave empty for all ages)"
            min="0"
            max="21"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Registration Settings */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Ticket className="w-6 h-6 text-orange-600 mr-2" />
          <h4 className="font-semibold text-orange-900">Registration Settings</h4>
        </div>

        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={requiresApproval}
              onChange={(e) => {
                setRequiresApproval(e.target.checked)
                onChange({ requiresApproval: e.target.checked })
              }}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Require approval for registrations
            </span>
          </label>

          <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              <strong>Note:</strong> If enabled, you'll need to manually approve each registration request.
              This is useful for events with limited capacity or special requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

