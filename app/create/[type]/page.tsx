'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'

const contentTypeConfigs = {
  marketplace_item: {
    name: 'Marketplace Item',
    icon: '🛍️',
    fields: ['title', 'description', 'price', 'category', 'condition', 'location', 'images'],
    categories: ['Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Art', 'Collectibles', 'Other']
  },
  music_album: {
    name: 'Music Album',
    icon: '🎵',
    fields: ['title', 'description', 'price', 'artist_name', 'album_name', 'genre', 'release_date', 'audio_files'],
    categories: ['Rock', 'Pop', 'Hip-Hop', 'Electronic', 'Jazz', 'Classical', 'Folk', 'Other']
  },
  podcast_episode: {
    name: 'Podcast Episode',
    icon: '🎙️',
    fields: ['title', 'description', 'price', 'episode_number', 'duration', 'audio_file'],
    categories: ['News', 'Comedy', 'Education', 'Business', 'Technology', 'Health', 'Entertainment', 'Other']
  },
  video_content: {
    name: 'Video Content',
    icon: '🎬',
    fields: ['title', 'description', 'price', 'duration', 'video_file', 'thumbnail'],
    categories: ['Tutorial', 'Entertainment', 'Education', 'Documentary', 'Music Video', 'Short Film', 'Other']
  },
  art_piece: {
    name: 'Art Piece',
    icon: '🎨',
    fields: ['title', 'description', 'price', 'medium', 'dimensions', 'year_created', 'images'],
    categories: ['Painting', 'Sculpture', 'Digital Art', 'Photography', 'Drawing', 'Mixed Media', 'Other']
  },
  clothing_item: {
    name: 'Fashion Item',
    icon: '👕',
    fields: ['title', 'description', 'price', 'size', 'brand', 'condition', 'images'],
    categories: ['Tops', 'Bottoms', 'Dresses', 'Shoes', 'Accessories', 'Outerwear', 'Underwear', 'Other']
  },
  accommodation: {
    name: 'Accommodation',
    icon: '🏠',
    fields: ['title', 'description', 'price', 'property_type', 'bedrooms', 'bathrooms', 'max_guests', 'amenities', 'images'],
    categories: ['Apartment', 'House', 'Room', 'Hotel', 'Hostel', 'Villa', 'Cabin', 'Other']
  },
  service: {
    name: 'Service',
    icon: '🔧',
    fields: ['title', 'description', 'price', 'service_type', 'hourly_rate', 'availability', 'experience_level'],
    categories: ['Consulting', 'Freelance', 'Repair', 'Delivery', 'Cleaning', 'Tutoring', 'Design', 'Other']
  },
  event: {
    name: 'Event',
    icon: '🎉',
    fields: ['title', 'description', 'price', 'event_date', 'venue', 'capacity', 'ticket_price'],
    categories: ['Conference', 'Workshop', 'Meetup', 'Party', 'Seminar', 'Exhibition', 'Festival', 'Other']
  },
  gig: {
    name: 'Gig',
    icon: '🎤',
    fields: ['title', 'description', 'price', 'event_date', 'venue', 'artist_name', 'genre'],
    categories: ['Concert', 'DJ Set', 'Comedy Show', 'Theater', 'Dance', 'Open Mic', 'Festival', 'Other']
  },
  restaurant: {
    name: 'Restaurant',
    icon: '🍽️',
    fields: ['title', 'description', 'price_range', 'cuisine_type', 'location', 'capacity', 'menu_url', 'images'],
    categories: ['Italian', 'Asian', 'Mexican', 'Mediterranean', 'American', 'French', 'Indian', 'Other']
  },
  bar: {
    name: 'Bar/Pub',
    icon: '🍺',
    fields: ['title', 'description', 'price_range', 'bar_type', 'location', 'capacity', 'special_offers', 'images'],
    categories: ['Cocktail Bar', 'Beer Bar', 'Wine Bar', 'Sports Bar', 'Pub', 'Nightclub', 'Rooftop', 'Other']
  },
  reservation: {
    name: 'Reservation',
    icon: '📅',
    fields: ['title', 'description', 'price', 'date_time', 'duration', 'party_size', 'special_requests'],
    categories: ['Restaurant', 'Spa', 'Hotel', 'Event', 'Tour', 'Appointment', 'Consultation', 'Other']
  },
  portfolio: {
    name: 'Portfolio',
    icon: '💼',
    fields: ['title', 'description', 'skills', 'experience_years', 'education', 'certifications', 'work_samples'],
    categories: ['Design', 'Development', 'Marketing', 'Writing', 'Photography', 'Consulting', 'Sales', 'Other']
  },
  cv: {
    name: 'CV/Resume',
    icon: '📄',
    fields: ['title', 'description', 'skills', 'experience_years', 'education', 'certifications', 'contact_info'],
    categories: ['Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Sales', 'Management', 'Other']
  },
  regular_post: {
    name: 'Regular Post',
    icon: '📝',
    fields: ['title', 'description', 'content', 'tags'],
    categories: ['Personal', 'Professional', 'Educational', 'Entertainment', 'News', 'Opinion', 'Story', 'Other']
  },
  image_gallery: {
    name: 'Image Gallery',
    icon: '📸',
    fields: ['title', 'description', 'images', 'tags'],
    categories: ['Travel', 'Nature', 'Portrait', 'Street', 'Architecture', 'Food', 'Lifestyle', 'Other']
  },
  file_share: {
    name: 'File Share',
    icon: '📁',
    fields: ['title', 'description', 'file_type', 'file_size', 'download_url', 'tags'],
    categories: ['Document', 'Presentation', 'Spreadsheet', 'PDF', 'Code', 'Template', 'Resource', 'Other']
  },
  networking_post: {
    name: 'Networking',
    icon: '🤝',
    fields: ['title', 'description', 'industry', 'skills', 'experience_level', 'looking_for'],
    categories: ['Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Sales', 'Management', 'Other']
  }
}

export default function CreateContentType() {
  const params = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [selectedFiles, setSelectedFiles] = useState([])

  const contentType = params?.type as string
  const config = contentTypeConfigs[contentType as keyof typeof contentTypeConfigs]

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Content Type Not Found</h1>
          <p className="text-gray-600 mb-6">The content type you're looking for doesn't exist.</p>
          <Link 
            href="/create"
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Create
          </Link>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
          <p className="text-gray-600 mb-6">You need to be signed in to create content.</p>
          <Link 
            href="/"
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      // Create the main post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.id,
            content_type: contentType,
            ...formData,
          }
        ])
        .select()
        .single()

      if (postError) throw postError

      // Create content-specific records based on type
      if (contentType === 'marketplace_item') {
        await supabase.from('marketplace_items').insert([{
          post_id: postData.id,
          ...formData
        }])
      } else if (contentType === 'music_album') {
        await supabase.from('media_content').insert([{
          post_id: postData.id,
          ...formData
        }])
      }
      // Add more content-specific logic here...

      router.push('/hub')
    } catch (error) {
      console.error('Error creating content:', error)
      alert('Failed to create content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const renderField = (fieldName: string) => {
    const commonFields = {
      title: (
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title || ''}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Enter a compelling title"
          />
        </div>
      ),
      description: (
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="Describe your content..."
          />
        </div>
      ),
      price: (
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            Price (€)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price || ''}
            onChange={handleChange}
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="0.00"
          />
        </div>
      ),
      location: (
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            placeholder="City, Country"
          />
        </div>
      )
    }

    return commonFields[fieldName] || null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <AppHeader />
      
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link 
              href="/create"
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back to Create
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <span className="text-3xl">{config.icon}</span>
                <span>Create {config.name}</span>
              </h1>
              <p className="text-gray-600">Share your {config.name.toLowerCase()} with the community</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            {config.fields.map((field) => (
              <div key={field}>
                {renderField(field)}
              </div>
            ))}

            {/* Category Selection */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">Select a category</option>
                {config.categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <Link
              href="/create"
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : `Create ${config.name}`}
            </button>
          </div>
        </form>
      </div>

      {/* Footer */}
      <AppFooter />

      {/* Bottom Navigation for Mobile */}
      <BottomNav />
    </div>
  )
}
