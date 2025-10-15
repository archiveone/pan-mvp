'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'
import ListingGrid from '@/components/ListingGrid'
import SearchAndFilters from '@/components/SearchAndFilters'
import SmartTagFilters from '@/components/SmartTagFilters'
import StoriesBar from '@/components/StoriesBar'
import { useDebounce } from '@/hooks/useDebounce'
// import FeaturedListings from '@/components/FeaturedListings'
import { ContentService } from '@/services/contentService'
import { UnifiedFeedService, UnifiedFeedItem } from '@/services/unifiedFeedService'
import { SearchFilters, UnifiedContent } from '@/types/content'

// Use the unified feed type
type HomepageContent = UnifiedFeedItem;

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
  
  // Debounce search inputs to avoid firing on every keystroke
  const debouncedSearch = useDebounce(searchTerm, 500)
  const debouncedLocation = useDebounce(location, 500)
  
  // Load content from database using unified feed service
  const loadContent = useCallback(async () => {
    // Don't reload if already loading
    if (loading && content.length > 0) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Use the new unified feed service (with caching)
      const results = await UnifiedFeedService.getUnifiedFeed({
        query: debouncedSearch || undefined,
        location: debouncedLocation || undefined,
        priceMin: priceRange.min > 0 ? priceRange.min : undefined,
        priceMax: priceRange.max < 1000 ? priceRange.max : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        limit: 50
      })
      
      setContent(results)
      setError(null)
    } catch (error) {
      console.error('❌ Error loading feed:', error)
      setError('Unable to load content. Please check your connection and try again.')
      // Don't clear existing content on error
      if (content.length === 0) {
        setContent([])
      }
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, debouncedLocation, priceRange, selectedTags, content.length, loading])

  // Load content when component mounts or filters change
  // Using debounced values prevents excessive reloading
  useEffect(() => {
    loadContent()
  }, [debouncedSearch, debouncedLocation, priceRange.min, priceRange.max, selectedTags])

  // Convert UnifiedFeedItem to Listing interface for ListingGrid compatibility
  const displayListings = content.map(item => ({
    id: item.id,
    title: item.title,
    content: item.description || item.content || '',
    price: item.price ? `${item.price} ${item.currency || 'USD'}` : undefined,
    currency: item.currency,
    location: item.location,
    category: item.category,
    event_date: item.extraData?.startDate,
    created_at: item.createdAt,
    updated_at: item.createdAt,
    user_id: item.userId,
    profiles: item.userProfile ? {
      username: item.userProfile.username || item.userProfile.name || 'Unknown User',
      avatar_url: item.userProfile.avatarUrl || ''
    } : undefined,
    media_url: item.mediaUrl || item.thumbnailUrl,
    image_url: item.thumbnailUrl || item.mediaUrl,
    is_sold: false,
    content_type: item.type // Use the unified type
  }))

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
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
            id: item.userId || '',
            name: item.userProfile?.name || '',
            avatarUrl: item.userProfile?.avatarUrl || '',
            bio: ''
          },
          postType: item.type?.toUpperCase() as any || 'ITEM',
          content: item.description || item.content || '',
          tags: item.tags || [],
          likes: 0,
          timestamp: item.createdAt
        }))}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
      />

      {/* Featured Listings Section - Temporarily disabled */}
      {/* <FeaturedListings /> */}

      {/* Stories Bar - Above Listings */}
      <StoriesBar />

      {/* Content */}
      <main className="px-3 sm:px-4 py-4 sm:py-6 pb-24 sm:pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Error State */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
                <div className="text-red-600 dark:text-red-400 text-sm flex-1">
                  <strong>Error loading listings:</strong> {error}
                </div>
                <button
                  onClick={loadContent}
                  className="w-full sm:w-auto sm:ml-4 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
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
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="text-gray-500 dark:text-gray-400 text-base sm:text-lg mb-2">No listings found</div>
              <div className="text-gray-400 dark:text-gray-500 text-sm mb-4">
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
                className="px-6 py-3 bg-black dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
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

