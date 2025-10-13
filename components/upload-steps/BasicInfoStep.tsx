'use client'

import { useState } from 'react'
import { UploadType } from '@/types/upload'

interface BasicInfoStepProps {
  data: Partial<any>
  onChange: (data: Partial<any>) => void
}

const categories = {
  post: [
    'General', 'News', 'Tips', 'Personal', 'Community', 'Announcement'
  ],
  listing: [
    'Electronics', 'Clothing', 'Home', 'Vehicles', 'Books', 'Sports', 
    'Toys', 'Art', 'Collectibles', 'Other'
  ],
  event: [
    'Meetup', 'Workshop', 'Conference', 'Social', 'Sports', 'Music', 
    'Art', 'Food', 'Business', 'Other'
  ],
  music: [
    'Song', 'Album', 'Podcast', 'Audiobook', 'Instrumental', 'Remix', 'Other'
  ],
  rental: [
    'Vehicle', 'Equipment', 'Property', 'Clothing', 'Electronics', 
    'Furniture', 'Tools', 'Sports', 'Other'
  ],
  service: [
    'Restaurant', 'Boat Trips', 'Accommodation', 'Transportation', 
    'Entertainment', 'Beauty', 'Fitness', 'Education', 'Consulting', 'Other'
  ],
  experience: [
    'Adventure', 'Cultural', 'Food & Drink', 'Educational', 'Entertainment', 
    'Wellness', 'Sports', 'Art & Craft', 'Technology', 'Other'
  ]
}

export default function BasicInfoStep({ data, onChange }: BasicInfoStepProps) {
  const [title, setTitle] = useState(data.title || '')
  const [description, setDescription] = useState(data.description || '')
  const [category, setCategory] = useState(data.category || '')
  const [location, setLocation] = useState(data.location || '')
  const [tags, setTags] = useState<string[]>(data.tags || [])
  const [tagInput, setTagInput] = useState('')

  const handleTitleChange = (value: string) => {
    setTitle(value)
    onChange({ title: value })
  }

  const handleDescriptionChange = (value: string) => {
    setDescription(value)
    onChange({ description: value })
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    onChange({ category: value })
  }

  const handleLocationChange = (value: string) => {
    setLocation(value)
    onChange({ location: value })
  }

  const handleTagAdd = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()]
      setTags(newTags)
      onChange({ tags: newTags })
      setTagInput('')
    }
  }

  const handleTagRemove = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove)
    setTags(newTags)
    onChange({ tags: newTags })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleTagAdd()
    }
  }

  const availableCategories = categories[data.type as UploadType] || categories.post

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Basic Information
        </h3>
        <p className="text-gray-600">
          Tell us about your {data.type === 'post' ? 'post' : 'content'}
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder={`Enter a compelling title for your ${data.type === 'post' ? 'post' : 'content'}`}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          maxLength={100}
        />
        <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder={`Describe your ${data.type === 'post' ? 'post' : 'content'} in detail...`}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={4}
          maxLength={2000}
        />
        <p className="text-xs text-gray-500 mt-1">{description.length}/2000 characters</p>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a category</option>
          {availableCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => handleLocationChange(e.target.value)}
          placeholder="City, State/Country (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
            >
              {tag}
              <button
                onClick={() => handleTagRemove(tag)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a tag and press Enter"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleTagAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Add tags to help people discover your content
        </p>
      </div>

      {/* Post-specific options */}
      {data.type === 'post' && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900">Post Settings</h4>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={data.allowsComments !== false}
                onChange={(e) => onChange({ allowsComments: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Allow comments</span>
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={data.isPublic !== false}
                onChange={(e) => onChange({ isPublic: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Make this post public</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

