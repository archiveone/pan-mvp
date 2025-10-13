'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, X, Upload } from 'lucide-react'
import Image from 'next/image'

export default function EditListingPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Form fields
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('listing')
  const [location, setLocation] = useState('')
  const [priceAmount, setPriceAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [tags, setTags] = useState('')

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    if (params.id) {
      loadListing(params.id as string)
    }
  }, [params.id, user, router])

  const loadListing = async (id: string) => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id) // Only allow editing own posts
        .single()

      if (error) throw error

      if (!data) {
        alert('Listing not found or you don\'t have permission to edit it')
        router.push('/my-posts')
        return
      }

      setListing(data)
      
      // Populate form
      setTitle(data.title || '')
      setContent(data.content || '')
      setCategory(data.category || 'listing')
      setLocation(data.location || '')
      setPriceAmount(data.price_amount?.toString() || '')
      setCurrency(data.currency || 'USD')
      setTags(data.tags?.join(', ') || '')
      
    } catch (error) {
      console.error('Error loading listing:', error)
      alert('Failed to load listing')
      router.push('/my-posts')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required')
      return
    }

    setSubmitting(true)

    try {
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean)

      const updateData = {
        title: title.trim(),
        content: content.trim(),
        category,
        location: location.trim() || null,
        price_amount: priceAmount ? parseFloat(priceAmount) : null,
        currency: priceAmount ? currency : null,
        tags: tagsArray.length > 0 ? tagsArray : null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', params.id as string)
        .eq('user_id', user?.id)

      if (error) throw error

      alert('✅ Listing updated successfully!')
      router.push(`/listing/${params.id}`)
      
    } catch (error) {
      console.error('Error updating listing:', error)
      alert('Failed to update listing. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <AppHeader />
        <div className="max-w-3xl mx-auto px-4 py-6 pb-20">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 w-1/3 mb-6"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 mb-4"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 mb-4"></div>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />

      <main className="max-w-3xl mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/listing/${params.id}`)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-900 dark:text-gray-100" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Edit Listing
            </h1>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Image Display */}
          {listing?.media_url && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Image
              </label>
              <div className="relative aspect-video w-full bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={listing.media_url}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                To change the image, please create a new listing
              </p>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              placeholder="Enter title..."
              required
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent resize-none"
              placeholder="Enter description..."
              required
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            >
              <option value="listing">Listing</option>
              <option value="service">Service</option>
              <option value="event">Event</option>
              <option value="community">Community</option>
              <option value="job">Job</option>
              <option value="housing">Housing</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              placeholder="City, Country"
            />
          </div>

          {/* Price */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price (Optional)
              </label>
              <input
                type="number"
                id="price"
                value={priceAmount}
                onChange={(e) => setPriceAmount(e.target.value)}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              placeholder="tag1, tag2, tag3"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push(`/listing/${params.id}`)}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-medium flex items-center justify-center gap-2"
            >
              <X size={20} />
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-lime-400 to-lime-300 text-black rounded-lg hover:brightness-95 transition-all disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      <BottomNav />
    </div>
  )
}

