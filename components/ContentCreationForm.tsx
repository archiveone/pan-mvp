'use client'

import { useState, useRef } from 'react'
import { ContentService } from '@/services/contentService'
import { ImageService } from '@/services/imageService'
import { ContentType, UnifiedContent } from '@/types/content'
import { X, Upload, Image as ImageIcon, DollarSign, MapPin, Calendar, Users, Tag } from 'lucide-react'

interface ContentCreationFormProps {
  contentType: ContentType
  onSuccess?: (content: UnifiedContent) => void
  onCancel?: () => void
  initialData?: Partial<UnifiedContent>
}

export default function ContentCreationForm({ 
  contentType, 
  onSuccess, 
  onCancel,
  initialData 
}: ContentCreationFormProps) {
  const [formData, setFormData] = useState({
    title: (initialData as any)?.title || '',
    content: (initialData as any)?.content || '',
    category: (initialData as any)?.category || '',
    location: (initialData as any)?.location || '',
    tags: (initialData as any)?.tags?.join(', ') || '',
    price_amount: (initialData as any)?.price_amount || '',
    currency: (initialData as any)?.currency || 'EUR',
    event_date: (initialData as any)?.event_date || '',
    event_time: (initialData as any)?.event_time || '',
    capacity: (initialData as any)?.capacity || '',
    is_private: (initialData as any)?.is_private || false,
    allows_comments: (initialData as any)?.allows_comments ?? true,
    ...initialData
  })

  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return

    const fileArray = Array.from(files)
    const validation = ImageService.validateImages(fileArray)
    
    if (!validation.valid) {
      setError(validation.errors.join(', '))
      return
    }

    setImages(prev => [...prev, ...fileArray])
    
    // Create preview URLs
    const newPreviews = ImageService.createPreviewUrls(fileArray)
    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    
    // Revoke the preview URL and remove it
    const previewUrl = imagePreviews[index]
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)
    setError('')

    try {
      // Upload images first
      let mediaUrls: string[] = []
      if (images.length > 0) {
        const uploadResult = await ImageService.uploadImages(images)
        if (uploadResult.success && uploadResult.urls) {
          mediaUrls = uploadResult.urls
        } else {
          throw new Error(uploadResult.error || 'Failed to upload images')
        }
      }

      // Prepare content data
      const contentData: any = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        location: formData.location,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        content_type: contentType,
        is_published: true,
        is_safety_approved: true,
        moderation_status: 'approved', // For now, auto-approve
        allows_comments: formData.allows_comments
      }

      // Add media URLs
      if (mediaUrls.length > 0) {
        contentData.media_url = mediaUrls[0] // Primary image
        contentData.media_urls = mediaUrls // All images
      }

      // Add content-type specific fields
      switch (contentType) {
        case 'listing':
          contentData.price_amount = formData.price_amount ? parseFloat(formData.price_amount) : null
          contentData.currency = formData.currency
          contentData.is_available = true
          break
        case 'event':
          contentData.event_date = formData.event_date
          contentData.event_time = formData.event_time
          contentData.capacity = formData.capacity ? parseInt(formData.capacity) : null
          contentData.event_type = 'meetup'
          contentData.registration_required = false
          break
        case 'group':
          contentData.is_private = formData.is_private
          contentData.join_approval_required = false
          contentData.allows_posts = true
          contentData.allows_events = true
          contentData.allows_discussions = true
          break
      }

      // Create content using Supabase directly (since we don't have a create method in ContentService yet)
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('posts')
        .insert(contentData)
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      if (onSuccess) {
        onSuccess(data as UnifiedContent)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create content')
    } finally {
      setUploading(false)
    }
  }

  const getFormTitle = () => {
    switch (contentType) {
      case 'listing': return 'Create New Listing'
      case 'post': return 'Create New Post'
      case 'event': return 'Create New Event'
      case 'group': return 'Create New Group'
      default: return 'Create Content'
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{getFormTitle()}</h2>
        <p className="text-gray-600 mt-1">
          {contentType === 'listing' && 'List an item for sale or trade'}
          {contentType === 'post' && 'Share something with the community'}
          {contentType === 'event' && 'Organize an event or meetup'}
          {contentType === 'group' && 'Create a group for like-minded people'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Fields */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter a descriptive title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            required
            rows={4}
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe your content in detail"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select category</option>
              <option value="Electronics">Electronics</option>
              <option value="Music">Music</option>
              <option value="Sports">Sports</option>
              <option value="Books">Books</option>
              <option value="Clothing">Clothing</option>
              <option value="Home & Garden">Home & Garden</option>
              <option value="Vehicles">Vehicles</option>
              <option value="Services">Services</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline w-4 h-4 mr-1" />
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="City, State or Region"
            />
          </div>
        </div>

        {/* Content Type Specific Fields */}
        {contentType === 'listing' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline w-4 h-4 mr-1" />
                Price
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price_amount}
                onChange={(e) => handleInputChange('price_amount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="Free">Free</option>
              </select>
            </div>
          </div>
        )}

        {contentType === 'event' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Event Date
              </label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) => handleInputChange('event_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Time
              </label>
              <input
                type="time"
                value={formData.event_time}
                onChange={(e) => handleInputChange('event_time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline w-4 h-4 mr-1" />
                Capacity
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Max attendees"
              />
            </div>
          </div>
        )}

        {contentType === 'group' && (
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_private}
                onChange={(e) => handleInputChange('is_private', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Private group (requires approval to join)</span>
            </label>
          </div>
        )}

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <ImageIcon className="inline w-4 h-4 mr-1" />
            Images
          </label>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleImageSelect(e.target.files)}
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center w-full"
            >
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-gray-600">Click to upload images</span>
              <span className="text-sm text-gray-400">PNG, JPG, WebP up to 5MB each</span>
            </button>
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag className="inline w-4 h-4 mr-1" />
            Tags
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => handleInputChange('tags', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter tags separated by commas"
          />
          <p className="text-sm text-gray-500 mt-1">
            Help people find your content with relevant tags
          </p>
        </div>

        {/* Comments Setting */}
        {(contentType === 'post' || contentType === 'group') && (
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.allows_comments}
                onChange={(e) => handleInputChange('allows_comments', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Allow comments</span>
            </label>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={uploading}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Creating...' : 'Create Content'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

