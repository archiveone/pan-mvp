'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Star, MapPin, Calendar, DollarSign, User } from 'lucide-react'
import { useSavedPosts } from '../hooks/useSavedListings'
import SaveToFolderButton from './SaveToFolderButton'

interface Listing {
  id: string
  title: string
  content: string
  price?: string
  currency?: string
  location?: string
  category?: string
  event_date?: string
  created_at: string
  updated_at: string
  user_id: string
  profiles?: {
    username?: string
    name?: string
    avatar_url?: string
  }
  media_url?: string
  image_url?: string
  is_sold?: boolean
}

interface ListingGridProps {
  listings: Listing[]
  loading?: boolean
}

export default function ListingGrid({ listings, loading }: ListingGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(3) // 1 (largest) to 6 (smallest)
  const [showZoomIndicator, setShowZoomIndicator] = useState(false)
  const { isSaved, toggleSave } = useSavedPosts()
  
  // Map zoom levels to grid column classes
  const gridClasses = {
    1: 'grid-cols-1 md:grid-cols-1 lg:grid-cols-2',        // Largest
    2: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2',        
    3: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',        // Default
    4: 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5',        
    5: 'grid-cols-3 md:grid-cols-5 lg:grid-cols-6',        
    6: 'grid-cols-4 md:grid-cols-6 lg:grid-cols-8'         // Smallest
  }
  
  const showIndicator = React.useCallback(() => {
    setShowZoomIndicator(true)
    setTimeout(() => setShowZoomIndicator(false), 800)
  }, [])
  
  const zoomIn = React.useCallback(() => {
    setZoomLevel(prev => {
      const newLevel = Math.max(1, prev - 1)
      if (newLevel !== prev) showIndicator()
      return newLevel
    })
  }, [showIndicator])
  
  const zoomOut = React.useCallback(() => {
    setZoomLevel(prev => {
      const newLevel = Math.min(6, prev + 1)
      if (newLevel !== prev) showIndicator()
      return newLevel
    })
  }, [showIndicator])
  
  // Invisible zoom controls - Keyboard shortcuts (Ctrl/Cmd + / -) and Mouse Wheel
  React.useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault()
        zoomIn()
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault()
        zoomOut()
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault()
        setZoomLevel(3) // Reset to default
      }
    }
    
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        if (e.deltaY < 0) {
          zoomIn() // Scroll up = zoom in
        } else {
          zoomOut() // Scroll down = zoom out
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [zoomIn, zoomOut])

  if (loading) {
    return (
      <div className={`grid ${gridClasses[zoomLevel as keyof typeof gridClasses]} gap-4`}>
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
        ))}
      </div>
    )
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400 text-lg">No listings found</div>
        <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">Be the first to create a listing!</div>
      </div>
    )
  }

  return (
    <>
      {/* Subtle Zoom Level Indicator */}
      {showZoomIndicator && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm animate-fade-in">
          Zoom: {zoomLevel}/6
        </div>
      )}
      
      <div className={`grid ${gridClasses[zoomLevel as keyof typeof gridClasses]} gap-4`}>
      {listings.map((listing) => {
        const mainImage = listing.image_url || listing.media_url
        const isHovered = hoveredId === listing.id
        
        // Debug logging for profile data
        if (listing.profiles) {
          console.log('Listing:', listing.title, 'Profile:', listing.profiles, 'Avatar URL:', listing.profiles.avatar_url)
        }
        
        return (
          <div
            key={listing.id}
            className="relative aspect-square overflow-hidden group"
            onMouseEnter={() => setHoveredId(listing.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <Link
              href={`/listing/${listing.id}`}
              className="absolute inset-0 cursor-pointer block"
            >
            {/* Main Image */}
            <div className="absolute inset-0">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={listing.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    console.warn('Failed to load image:', mainImage)
                    // Hide the broken image and show fallback
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement
                    if (fallback) fallback.style.display = 'flex'
                  }}
                  onLoad={() => {
                    console.log('Successfully loaded image:', mainImage)
                  }}
                />
              ) : null}
              
              {/* Fallback for no image or broken image */}
              <div 
                className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center"
                style={{ display: mainImage ? 'none' : 'flex' }}
              >
                <div className="text-gray-500 dark:text-gray-400 text-4xl">📦</div>
              </div>
            </div>

            {/* Hover Information Bar */}
            <div className={`absolute bottom-0 left-0 right-0 h-28 bg-black/85 backdrop-blur-sm text-white p-3 transition-all duration-300 flex flex-col ${
              isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            }`}>
              {/* Title Section */}
              <div className="mb-2">
                <h3 className="font-semibold text-sm line-clamp-1 leading-tight">{listing.title}</h3>
              </div>
              
              {/* Price & Location Section */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 text-green-400">
                  {listing.price && (
                    <>
                      <DollarSign size={12} />
                      <span className="text-xs font-semibold">
                        {listing.price}
                      </span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-1 text-gray-300">
                  {listing.location && (
                    <>
                      <MapPin size={10} />
                      <span className="text-[11px] truncate max-w-[120px]">{listing.location}</span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Bottom Section - User & Date */}
              <div className="flex items-center justify-between pt-1.5 border-t border-white/10 mt-auto">
                {/* User Info - Clickable */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.location.href = `/profile/${listing.user_id}`
                  }}
                  className="flex items-center gap-1.5 hover:bg-white/10 rounded-lg px-1 py-0.5 -ml-1 transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                    {listing.profiles?.avatar_url ? (
                      <img
                        src={listing.profiles.avatar_url}
                        alt={listing.profiles?.username || listing.profiles?.name || 'User'}
                        className="w-6 h-6 rounded-full object-cover"
                        onError={(e) => {
                          console.warn('Failed to load avatar:', listing.profiles?.avatar_url)
                          e.currentTarget.style.display = 'none'
                          const parent = e.currentTarget.parentElement
                          if (parent) {
                            const icon = document.createElement('div')
                            icon.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
                            parent.appendChild(icon)
                          }
                        }}
                      />
                    ) : (
                      <User size={12} />
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-gray-200 truncate max-w-[100px]">
                    {listing.profiles?.username || listing.profiles?.name || 'User'}
                  </span>
                </button>
                
                {/* Date */}
                <div className="flex items-center gap-0.5 text-gray-400">
                  <Calendar size={9} />
                  <span className="text-[10px]">
                    {new Date(listing.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Gradient Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>

          {/* Save to Folder Button */}
          <div
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="absolute top-3 right-3 z-20"
          >
            <SaveToFolderButton 
              itemId={listing.id} 
              itemType="listing" 
              compact 
            />
          </div>

          {/* Old star button removed */}
        </div>
        )
      })}
      </div>
    </>
  )
}
