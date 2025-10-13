'use client'

import { useState } from 'react'
import { Star, Users, DollarSign, Clock, MapPin } from 'lucide-react'

interface ExperienceDetailsStepProps {
  data: Partial<any>
  onChange: (data: Partial<any>) => void
}

export default function ExperienceDetailsStep({ data, onChange }: ExperienceDetailsStepProps) {
  const [duration, setDuration] = useState(data.duration || '')
  const [minGroupSize, setMinGroupSize] = useState(data.groupSize?.minimum || '')
  const [maxGroupSize, setMaxGroupSize] = useState(data.groupSize?.maximum || '')
  const [difficulty, setDifficulty] = useState(data.difficulty || 'beginner')
  const [pricePerPerson, setPricePerPerson] = useState(data.pricePerPerson || '')
  const [currency, setCurrency] = useState(data.currency || 'EUR')
  const [meetingPoint, setMeetingPoint] = useState(data.meetingPoint || '')

  const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' }
  ]

  const durations = [
    '1 hour', '2 hours', '3 hours', '4 hours', '6 hours', 
    '8 hours', 'Full day', '2 days', '3 days', 'Weekend'
  ]

  const difficulties = [
    { value: 'beginner', label: 'Beginner', description: 'No experience needed' },
    { value: 'intermediate', label: 'Intermediate', description: 'Some experience helpful' },
    { value: 'advanced', label: 'Advanced', description: 'Experienced participants' },
    { value: 'expert', label: 'Expert', description: 'Professional level' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Experience Details
        </h3>
        <p className="text-gray-600">
          Set up your guided experience with group size, difficulty, and pricing
        </p>
      </div>

      {/* Experience Basics */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Star className="w-6 h-6 text-yellow-600 mr-2" />
          <h4 className="font-semibold text-yellow-900">Experience Basics</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration *
            </label>
            <select
              value={duration}
              onChange={(e) => {
                setDuration(e.target.value)
                onChange({ duration: e.target.value })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="">Select duration</option>
              {durations.map(dur => (
                <option key={dur} value={dur}>{dur}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty Level *
            </label>
            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value)
                onChange({ difficulty: e.target.value })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              {difficulties.map(diff => (
                <option key={diff.value} value={diff.value}>{diff.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600">
            <strong>{difficulties.find(d => d.value === difficulty)?.label}:</strong>{' '}
            {difficulties.find(d => d.value === difficulty)?.description}
          </p>
        </div>
      </div>

      {/* Group Size */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Users className="w-6 h-6 text-blue-600 mr-2" />
          <h4 className="font-semibold text-blue-900">Group Size</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Group Size *
            </label>
            <input
              type="number"
              value={minGroupSize}
              onChange={(e) => {
                setMinGroupSize(e.target.value)
                onChange({ 
                  groupSize: { 
                    ...data.groupSize,
                    minimum: parseInt(e.target.value) || 1 
                  } 
                })
              }}
              placeholder="1"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Group Size *
            </label>
            <input
              type="number"
              value={maxGroupSize}
              onChange={(e) => {
                setMaxGroupSize(e.target.value)
                onChange({ 
                  groupSize: { 
                    ...data.groupSize,
                    maximum: parseInt(e.target.value) || 10 
                  } 
                })
              }}
              placeholder="10"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
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
              Price Per Person *
            </label>
            <div className="flex">
              <input
                type="number"
                value={pricePerPerson}
                onChange={(e) => {
                  setPricePerPerson(e.target.value)
                  onChange({ pricePerPerson: parseFloat(e.target.value) || 0 })
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
        </div>
      </div>

      {/* Meeting Point */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <MapPin className="w-6 h-6 text-purple-600 mr-2" />
          <h4 className="font-semibold text-purple-900">Meeting Point</h4>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Where to Meet *
          </label>
          <input
            type="text"
            value={meetingPoint}
            onChange={(e) => {
              setMeetingPoint(e.target.value)
              onChange({ meetingPoint: e.target.value })
            }}
            placeholder="e.g., Main entrance of Central Park, Starbucks on 5th Avenue"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Experience Details */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Clock className="w-6 h-6 text-orange-600 mr-2" />
          <h4 className="font-semibold text-orange-900">Experience Information</h4>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What's Included
            </label>
            <textarea
              value={data.includes || ''}
              onChange={(e) => onChange({ includes: e.target.value })}
              placeholder="List what's included in your experience..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements
            </label>
            <textarea
              value={data.requirements || ''}
              onChange={(e) => onChange({ requirements: e.target.value })}
              placeholder="What should participants bring or prepare..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What to Bring
            </label>
            <textarea
              value={data.whatToBring || ''}
              onChange={(e) => onChange({ whatToBring: e.target.value })}
              placeholder="List items participants should bring..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}






