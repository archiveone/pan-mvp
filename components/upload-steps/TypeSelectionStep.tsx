'use client'

import { useState } from 'react'
import { UploadType } from '@/types/upload'
import { 
  FileText, 
  ShoppingBag, 
  Calendar, 
  Music, 
  Car, 
  Briefcase, 
  Star,
  Users,
  ArrowRight
} from 'lucide-react'

interface TypeSelectionStepProps {
  data: Partial<any>
  onChange: (data: Partial<any>) => void
}

const contentTypes = [
  {
    type: 'post' as UploadType,
    title: 'Regular Post',
    description: 'Share thoughts, updates, or general content',
    icon: FileText,
    color: 'bg-blue-500',
    features: ['Text & images', 'Comments enabled', 'Public sharing']
  },
  {
    type: 'listing' as UploadType,
    title: 'Marketplace Listing',
    description: 'Sell items in our marketplace',
    icon: ShoppingBag,
    color: 'bg-green-500',
    features: ['Price setting', 'Condition details', 'Shipping options']
  },
  {
    type: 'event' as UploadType,
    title: 'Event',
    description: 'Create events with ticket sales',
    icon: Calendar,
    color: 'bg-purple-500',
    features: ['Date & time', 'Ticket pricing', 'Venue details']
  },
  {
    type: 'music' as UploadType,
    title: 'Music & Audio',
    description: 'Upload and sell music or audio content',
    icon: Music,
    color: 'bg-pink-500',
    features: ['Audio upload', 'Licensing options', 'Streaming/Download']
  },
  {
    type: 'rental' as UploadType,
    title: 'Rental Item',
    description: 'Rent out equipment, vehicles, or items',
    icon: Car,
    color: 'bg-orange-500',
    features: ['Booking calendar', 'Hourly/Daily rates', 'Availability slots']
  },
  {
    type: 'service' as UploadType,
    title: 'Service',
    description: 'Offer services like restaurants, boat trips',
    icon: Briefcase,
    color: 'bg-indigo-500',
    features: ['Service booking', 'Pricing tiers', 'Availability calendar']
  },
  {
    type: 'experience' as UploadType,
    title: 'Experience',
    description: 'Create guided experiences and activities',
    icon: Star,
    color: 'bg-yellow-500',
    features: ['Group activities', 'Skill levels', 'What\'s included']
  },
  {
    type: 'group' as UploadType,
    title: 'Group / Community',
    description: 'Create forums, communities, or membership groups',
    icon: Users,
    color: 'bg-teal-500',
    features: ['Free or Paid membership', 'Private/Public access', 'Discussion forums']
  }
]

export default function TypeSelectionStep({ data, onChange }: TypeSelectionStepProps) {
  const [selectedType, setSelectedType] = useState<UploadType | null>(data.type || null)

  const handleTypeSelect = (type: UploadType) => {
    setSelectedType(type)
    onChange({ type })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          What would you like to create?
        </h3>
        <p className="text-gray-600">
          Choose the type of content that best fits what you want to share
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contentTypes.map((contentType) => {
          const IconComponent = contentType.icon
          const isSelected = selectedType === contentType.type

          return (
            <div
              key={contentType.type}
              onClick={() => handleTypeSelect(contentType.type)}
              className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${contentType.color}`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {contentType.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {contentType.description}
                  </p>

                  <ul className="space-y-1">
                    {contentType.features.map((feature, index) => (
                      <li key={index} className="text-xs text-gray-500 flex items-center">
                        <div className="w-1 h-1 bg-gray-400 rounded-full mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedType && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
              {(() => {
                const IconComponent = contentTypes.find(t => t.type === selectedType)?.icon
                return IconComponent ? <IconComponent className="w-4 h-4 text-white" /> : null
              })()}
            </div>
            <div>
              <p className="font-medium text-blue-900">
                Selected: {contentTypes.find(t => t.type === selectedType)?.title}
              </p>
              <p className="text-sm text-blue-700">
                {contentTypes.find(t => t.type === selectedType)?.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

