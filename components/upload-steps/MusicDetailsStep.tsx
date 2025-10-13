'use client'

import { useState } from 'react'
import { Music, DollarSign, Download, Play, Eye } from 'lucide-react'

interface MusicDetailsStepProps {
  data: Partial<any>
  onChange: (data: Partial<any>) => void
}

export default function MusicDetailsStep({ data, onChange }: MusicDetailsStepProps) {
  const [genre, setGenre] = useState(data.genre || '')
  const [price, setPrice] = useState(data.price || '')
  const [currency, setCurrency] = useState(data.currency || 'EUR')
  const [licenseType, setLicenseType] = useState(data.licenseType || 'non_exclusive')
  const [downloadEnabled, setDownloadEnabled] = useState(data.downloadEnabled || true)
  const [streamingEnabled, setStreamingEnabled] = useState(data.streamingEnabled || true)
  const [previewEnabled, setPreviewEnabled] = useState(data.previewEnabled || true)

  const genres = [
    'Pop', 'Rock', 'Hip Hop', 'Electronic', 'Jazz', 'Classical', 'Country', 
    'R&B', 'Reggae', 'Folk', 'Blues', 'Alternative', 'Indie', 'Other'
  ]

  const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' }
  ]

  const licenseTypes = [
    { value: 'exclusive', label: 'Exclusive', description: 'Buyer gets exclusive rights' },
    { value: 'non_exclusive', label: 'Non-Exclusive', description: 'Can be sold to multiple buyers' },
    { value: 'royalty_free', label: 'Royalty-Free', description: 'No ongoing royalties' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Music Details
        </h3>
        <p className="text-gray-600">
          Set pricing, licensing, and distribution options for your audio content
        </p>
      </div>

      {/* Genre & Pricing */}
      <div className="bg-pink-50 border border-pink-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Music className="w-6 h-6 text-pink-600 mr-2" />
          <h4 className="font-semibold text-pink-900">Basic Info</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Genre *
            </label>
            <select
              value={genre}
              onChange={(e) => {
                setGenre(e.target.value)
                onChange({ genre: e.target.value })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="">Select genre</option>
              {genres.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price *
            </label>
            <div className="flex">
              <input
                type="number"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value)
                  onChange({ price: parseFloat(e.target.value) || 0 })
                }}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
              <select
                value={currency}
                onChange={(e) => {
                  setCurrency(e.target.value)
                  onChange({ currency: e.target.value })
                }}
                className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
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

      {/* Licensing */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <DollarSign className="w-6 h-6 text-blue-600 mr-2" />
          <h4 className="font-semibold text-blue-900">Licensing</h4>
        </div>

        <div className="space-y-3">
          {licenseTypes.map((license) => (
            <label key={license.value} className="flex items-start">
              <input
                type="radio"
                name="licenseType"
                value={license.value}
                checked={licenseType === license.value}
                onChange={(e) => {
                  setLicenseType(e.target.value)
                  onChange({ licenseType: e.target.value })
                }}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <div className="font-medium text-gray-900">{license.label}</div>
                <div className="text-sm text-gray-600">{license.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Distribution Options */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Download className="w-6 h-6 text-green-600 mr-2" />
          <h4 className="font-semibold text-green-900">Distribution Options</h4>
        </div>

        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={downloadEnabled}
              onChange={(e) => {
                setDownloadEnabled(e.target.checked)
                onChange({ downloadEnabled: e.target.checked })
              }}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <div className="ml-3">
              <div className="font-medium text-gray-900">Enable Download</div>
              <div className="text-sm text-gray-600">Buyers can download the audio file</div>
            </div>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={streamingEnabled}
              onChange={(e) => {
                setStreamingEnabled(e.target.checked)
                onChange({ streamingEnabled: e.target.checked })
              }}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <div className="ml-3">
              <div className="font-medium text-gray-900">Enable Streaming</div>
              <div className="text-sm text-gray-600">Buyers can stream the audio online</div>
            </div>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={previewEnabled}
              onChange={(e) => {
                setPreviewEnabled(e.target.checked)
                onChange({ previewEnabled: e.target.checked })
              }}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <div className="ml-3">
              <div className="font-medium text-gray-900">Enable Preview</div>
              <div className="text-sm text-gray-600">Show a preview to potential buyers</div>
            </div>
          </label>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Eye className="w-6 h-6 text-purple-600 mr-2" />
          <h4 className="font-semibold text-purple-900">Additional Information</h4>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lyrics (optional)
            </label>
            <textarea
              value={data.lyrics || ''}
              onChange={(e) => onChange({ lyrics: e.target.value })}
              placeholder="Add lyrics if applicable..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credits (optional)
            </label>
            <textarea
              value={data.credits || ''}
              onChange={(e) => onChange({ credits: e.target.value })}
              placeholder="Producer, songwriter, featured artists, etc..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}



