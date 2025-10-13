'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'
import ListingGrid from '@/components/ListingGrid'
import SearchAndFilters from '@/components/SearchAndFilters'
import SmartTagFilters from '@/components/SmartTagFilters'
import StoriesBar from '@/components/StoriesBar'
// import FeaturedListings from '@/components/FeaturedListings'
import { ContentService } from '@/services/contentService'
import { SearchFilters, UnifiedContent } from '@/types/content'

// Use the unified content type from our types
type HomepageContent = UnifiedContent;

export default function Home() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 })
  const [sortBy, setSortBy] = useState('trending')
  const [availability, setAvailability] = useState('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [content, setContent] = useState<HomepageContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Load content from database using unified service
  const loadContent = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const filters: SearchFilters = {
        query: searchTerm || undefined,
        location: location || undefined,
        price_min: priceRange.min > 0 ? priceRange.min : undefined,
        price_max: priceRange.max < 1000 ? priceRange.max : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        sort_by: sortBy as any,
        limit: 50
      }

      const result = await ContentService.searchContent(filters)
      
      if (result.success && result.results) {
        setContent(result.results.results)
      } else {
        console.error('❌ Failed to load content:', result.error)
        setError(result.error || 'Failed to load content')
        setContent([])
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      setError('An unexpected error occurred')
      setContent([])
    } finally {
      setLoading(false)
    }
  }, [searchTerm, location, priceRange, date, availability, sortBy, selectedTags])

  // Load content when component mounts or filters change
  useEffect(() => {
    loadContent()
  }, [loadContent])

  // Convert UnifiedContent to Listing interface for ListingGrid compatibility
  const displayListings = content.map(item => ({
    id: item.id,
    title: item.title,
    content: item.content || '',
    price: (item as any).price_amount ? `${(item as any).price_amount} ${(item as any).currency || 'EUR'}` : undefined,
    currency: (item as any).currency,
    location: item.location,
    category: (item as any).category,
    event_date: (item as any).event_date,
    created_at: item.created_at,
    updated_at: item.updated_at,
    user_id: item.user_id,
    profiles: item.profiles ? {
      username: item.profiles.username || item.profiles.name || 'Unknown User',
      avatar_url: item.profiles.avatar_url || ''
    } : undefined,
    media_url: item.media_url,
    image_url: item.media_url,
    is_sold: false, // We're only showing approved listings, so none should be sold
    content_type: item.content_type // Add content type for better handling
  }))

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <AppHeader />

      {/* Search and Filters (no category tabs) */}
      <SearchAndFilters 
        onSearch={setSearchTerm}
        searchTerm={searchTerm}
        onLocationChange={setLocation}
        onDateChange={setDate}
        onPriceRangeChange={(min, max) => setPriceRange({ min, max })}
        onSortChange={setSortBy}
        onAvailabilityChange={setAvailability}
        location={location}
        date={date}
        priceRange={priceRange}
        sortBy={sortBy}
        availability={availability}
      />

      {/* Smart Tag Filters */}
      <SmartTagFilters 
        posts={content.map(item => ({
          id: item.id,
          user: {
            id: item.user_id || '',
            name: item.profiles?.name || '',
            avatarUrl: item.profiles?.avatar_url || '',
            bio: ''
          },
          postType: item.content_type?.toUpperCase() as any || 'ITEM',
          content: item.content || '',
          tags: (item as any).tags || [],
          likes: 0,
          timestamp: item.created_at
        }))}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
      />

      {/* Featured Listings Section - Temporarily disabled */}
      {/* <FeaturedListings /> */}

      {/* Stories Bar - Above Listings */}
      <StoriesBar />

      {/* Content */}
      <main className="px-4 py-6 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-red-600 text-sm">
                  <strong>Error loading listings:</strong> {error}
                </div>
                <button
                  onClick={loadContent}
                  className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Listings Grid */}
          <ListingGrid listings={displayListings} loading={loading} />
          
          {/* Empty State */}
          {!loading && !error && displayListings.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">No listings found</div>
              <div className="text-gray-400 text-sm mb-4">
                Try adjusting your search criteria or browse all categories
              </div>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setLocation('')
                  setDate('')
                  setPriceRange({ min: 0, max: 1000 })
                  setAvailability('all')
                  setSortBy('trending')
                  setSelectedTags([])
                }}
                className="px-4 py-2 bg-black dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <AppFooter />

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  )
}

