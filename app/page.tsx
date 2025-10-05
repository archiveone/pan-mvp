'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'
import ListingGrid from '@/components/ListingGrid'
import SearchAndFilters from '@/components/SearchAndFilters'

interface Listing {
  id: string;
  title: string;
  content: string;
  price?: number;
  currency?: string;
  category?: string;
  location?: string;
  event_date?: string;
  capacity?: number;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_published?: boolean;
  media_url?: string;
  profiles?: { username: string; avatar_url: string };
  is_safety_approved?: boolean;
}

export default function Home() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 })
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  
  // Load listings from database
  useEffect(() => {
    loadListings()
  }, [])

  const loadListings = async () => {
    setLoading(true)
    try {
      // Fetch posts with images
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('is_safety_approved', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching listings:', error)
        console.error('Error details:', error.message)
        setListings([])
      } else {
        console.log('Fetched listings:', data)
        console.log('Sample listing with media:', data?.[0])
        setListings(data || [])
      }
    } catch (error) {
      console.error('Error loading listings:', error)
      setListings([])
    } finally {
      setLoading(false)
    }
  }

  // Filter listings based on all search criteria
  const filteredListings = listings.filter(listing => {
    const matchesCategory = selectedCategory === 'All' || !listing.category || listing.category === selectedCategory
    const matchesSearch = !searchTerm || listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         listing.content?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLocation = !location || !listing.location || listing.location?.toLowerCase().includes(location.toLowerCase())
    const matchesPrice = !listing.price || (listing.price >= priceRange.min && listing.price <= priceRange.max)
    
    return matchesCategory && matchesSearch && matchesLocation && matchesPrice
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <AppHeader />

      {/* Search */}
      <SearchAndFilters 
        onSearch={setSearchTerm}
        searchTerm={searchTerm}
        onCategoryChange={setSelectedCategory}
        selectedCategory={selectedCategory}
        onLocationChange={setLocation}
        onDateChange={setDate}
        onPriceRangeChange={(min, max) => setPriceRange({ min, max })}
        location={location}
        date={date}
        priceRange={priceRange}
      />

      {/* Content */}
      <main className="px-4 py-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <ListingGrid listings={filteredListings} loading={loading} />
        </div>
      </main>

      {/* Footer */}
      <AppFooter />

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  )
}

