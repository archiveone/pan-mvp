'use client'

import { useState } from 'react'
import { Check, Eye, Edit3, Globe, Lock, Image, Music, Video, FileText, X } from 'lucide-react'

interface ReviewStepProps {
  data: Partial<any>
  onChange: (data: Partial<any>) => void
}

export default function ReviewStep({ data, onChange }: ReviewStepProps) {
  const [isPublic, setIsPublic] = useState(data.isPublic !== false)
  const [publishNow, setPublishNow] = useState(true)

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  const getContentTypeIcon = () => {
    switch (data.type) {
      case 'post': return '📝'
      case 'listing': return '🛍️'
      case 'event': return '📅'
      case 'music': return '🎵'
      case 'rental': return '🚗'
      case 'service': return '💼'
      case 'experience': return '⭐'
      case 'group': return '👥'
      default: return '📄'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Review & Publish
        </h3>
        <p className="text-gray-600">
          Review your content before publishing
        </p>
      </div>

      {/* Content Preview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          {/* Main Image */}
          <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            {data.images && data.images.length > 0 ? (
              <img
                src={URL.createObjectURL(data.images[0])}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                {getContentTypeIcon()}
              </div>
            )}
          </div>

          {/* Content Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{getContentTypeIcon()}</span>
              <h4 className="text-lg font-semibold text-gray-900 truncate">
                {data.title}
              </h4>
            </div>

            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {data.description}
            </p>

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded">
                {data.category}
              </span>
              {data.location && (
                <span className="bg-gray-100 px-2 py-1 rounded">
                  📍 {data.location}
                </span>
              )}
              {data.tags && data.tags.length > 0 && (
                <span className="bg-gray-100 px-2 py-1 rounded">
                  #{data.tags[0]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Type-specific details */}
        {data.type === 'listing' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Price:</span>
                <p className="font-semibold text-green-600">
                  {formatPrice(data.price, data.currency)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Condition:</span>
                <p className="font-medium capitalize">{data.condition}</p>
              </div>
              <div>
                <span className="text-gray-500">Quantity:</span>
                <p className="font-medium">{data.quantity}</p>
              </div>
              <div>
                <span className="text-gray-500">Shipping:</span>
                <p className="font-medium">
                  {data.shippingOptions?.shipping ? 'Available' : 'Pickup only'}
                </p>
              </div>
            </div>
          </div>
        )}

        {data.type === 'event' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Date:</span>
                <p className="font-medium">{data.startDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Time:</span>
                <p className="font-medium">{data.startTime}</p>
              </div>
              <div>
                <span className="text-gray-500">Venue:</span>
                <p className="font-medium">{data.venue}</p>
              </div>
            </div>
          </div>
        )}

        {data.type === 'music' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Price:</span>
                <p className="font-semibold text-green-600">
                  {formatPrice(data.price, data.currency)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Genre:</span>
                <p className="font-medium">{data.genre}</p>
              </div>
              <div>
                <span className="text-gray-500">License:</span>
                <p className="font-medium capitalize">{data.licenseType}</p>
              </div>
              <div>
                <span className="text-gray-500">Format:</span>
                <p className="font-medium">
                  {data.downloadEnabled ? 'Download' : 'Streaming'}
                </p>
              </div>
            </div>
          </div>
        )}

        {data.type === 'group' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Type:</span>
                <p className="font-medium capitalize">{data.groupType || 'Free'} Group</p>
              </div>
              <div>
                <span className="text-gray-500">Privacy:</span>
                <p className="font-medium capitalize">{data.privacy || 'Public'}</p>
              </div>
              {data.groupType === 'paid' && (
                <div>
                  <span className="text-gray-500">Membership:</span>
                  <p className="font-semibold text-green-600">
                    {formatPrice(data.membershipFee, data.currency)} / {data.billingPeriod}
                  </p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Max Members:</span>
                <p className="font-medium">{data.maxMembers || 'Unlimited'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* All Media Preview */}
      {((data.images && data.images.length > 0) || 
        (data.audioFiles && data.audioFiles.length > 0) ||
        (data.videoFiles && data.videoFiles.length > 0) ||
        (data.documentFiles && data.documentFiles.length > 0)) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Uploaded Media & Files
          </h4>

          {/* Images */}
          {data.images && data.images.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <Image className="w-4 h-4 text-green-600 mr-2" />
                <h5 className="font-medium text-gray-700">
                  Images ({data.images.length})
                </h5>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {data.images.map((image: File, index: number) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-1 text-xs text-gray-500 truncate">
                      {image.name}
                    </div>
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Main
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audio Files */}
          {data.audioFiles && data.audioFiles.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <Music className="w-4 h-4 text-purple-600 mr-2" />
                <h5 className="font-medium text-gray-700">
                  Audio Files ({data.audioFiles.length})
                </h5>
              </div>
              <div className="space-y-2">
                {data.audioFiles.map((file: File, index: number) => (
                  <div key={index} className="flex items-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <Music className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <audio src={URL.createObjectURL(file)} controls className="ml-3" style={{ maxWidth: '200px' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Files */}
          {data.videoFiles && data.videoFiles.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <Video className="w-4 h-4 text-blue-600 mr-2" />
                <h5 className="font-medium text-gray-700">
                  Video Files ({data.videoFiles.length})
                </h5>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.videoFiles.map((file: File, index: number) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
                    <video
                      src={URL.createObjectURL(file)}
                      controls
                      className="w-full aspect-video bg-black"
                    />
                    <div className="p-3">
                      <p className="font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Files */}
          {data.documentFiles && data.documentFiles.length > 0 && (
            <div>
              <div className="flex items-center mb-3">
                <FileText className="w-4 h-4 text-amber-600 mr-2" />
                <h5 className="font-medium text-gray-700">
                  Documents ({data.documentFiles.length})
                </h5>
              </div>
              <div className="space-y-2">
                {data.documentFiles.map((file: File, index: number) => (
                  <div key={index} className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <FileText className="w-5 h-5 text-amber-600 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Publishing Options */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Publishing Options</h4>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="publish-now"
              name="publish"
              checked={publishNow}
              onChange={() => setPublishNow(true)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="publish-now" className="flex items-center">
              <Globe className="w-5 h-5 text-green-600 mr-2" />
              <div>
                <div className="font-medium text-gray-900">Publish Now</div>
                <div className="text-sm text-gray-600">
                  Make your content visible to everyone immediately
                </div>
              </div>
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="publish-later"
              name="publish"
              checked={!publishNow}
              onChange={() => setPublishNow(false)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="publish-later" className="flex items-center">
              <Lock className="w-5 h-5 text-gray-600 mr-2" />
              <div>
                <div className="font-medium text-gray-900">Save as Draft</div>
                <div className="text-sm text-gray-600">
                  Save for later editing and publishing
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => {
                setIsPublic(e.target.checked)
                onChange({ isPublic: e.target.checked })
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Make this content public and searchable
            </span>
          </label>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Check className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Ready to publish?</p>
            <p>
              By publishing, you agree to our terms of service and confirm that your content 
              complies with our community guidelines. Your content will be reviewed by our 
              moderation team.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

