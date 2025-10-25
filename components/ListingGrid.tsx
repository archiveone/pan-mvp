'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Star, MapPin, Calendar, DollarSign, User } from 'lucide-react'
import { useSavedPosts } from '../hooks/useSavedListings'
import SaveToFolderButton from './SaveToFolderButton'
import AdvancedAnalyticsService from '@/services/advancedAnalyticsService'
import { useAuth } from '@/contexts/AuthContext'

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
  video_url?: string
  audio_url?: string
  is_sold?: boolean
  content_type?: string
  media_type?: 'image' | 'video' | 'audio' | 'document'
  duration?: number
  file_type?: string
}

interface ListingGridProps {
  listings: Listing[]
  loading?: boolean
}

export default function ListingGrid({ listings, loading }: ListingGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(3) // 1 (largest) to 6 (smallest)
  const [showZoomIndicator, setShowZoomIndicator] = useState(false)
  const [mobileTappedId, setMobileTappedId] = useState<string | null>(null)
  const [tapTimeout, setTapTimeout] = useState<NodeJS.Timeout | null>(null)
  const { isSaved, toggleSave } = useSavedPosts()
  const { user } = useAuth()
  
  // Mobile tap handling - one tap to show info, double tap to navigate
  const handleMobileTap = (listingId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Clear any existing timeout
    if (tapTimeout) {
      clearTimeout(tapTimeout)
    }
    
    if (mobileTappedId === listingId) {
      // Double tap - navigate to listing
      setMobileTappedId(null)
      handleListingClick(listingId)
      if (typeof window !== 'undefined') {
        window.location.href = `/listing/${listingId}`
      }
    } else {
      // First tap - show info
      setMobileTappedId(listingId)
      const timeout = setTimeout(() => {
        setMobileTappedId(null)
      }, 2000) // Auto-hide after 2 seconds
      setTapTimeout(timeout)
    }
  }
  
  // Track view when user clicks on a listing
  const handleListingClick = (listingId: string) => {
    const sessionId = AdvancedAnalyticsService.generateSessionId()
    AdvancedAnalyticsService.trackView({
      contentId: listingId,
      userId: user?.id,
      sessionId,
      deviceType: typeof navigator !== 'undefined' && /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    })
  }
  
  // Map zoom levels to grid column classes (mobile-optimized)
  const gridClasses = {
    1: 'grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2',        // Largest
    2: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2',        
    3: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',        // Default
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',        
    5: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6',        
    6: 'grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8'         // Smallest
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
  
  // Pinch gesture and zoom controls
  React.useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    let initialDistance = 0
    let initialZoomLevel = 3
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        initialDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        )
        initialZoomLevel = zoomLevel
      }
    }
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        )
        
        const scale = currentDistance / initialDistance
        const threshold = 0.1
        
        if (scale > 1 + threshold) {
          // Pinch out - zoom in
          if (initialZoomLevel > 1) {
            setZoomLevel(initialZoomLevel - 1)
            showIndicator()
          }
        } else if (scale < 1 - threshold) {
          // Pinch in - zoom out
          if (initialZoomLevel < 6) {
            setZoomLevel(initialZoomLevel + 1)
            showIndicator()
          }
        }
      }
    }
    
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
    
    // Add touch event listeners for pinch gestures
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('keydown', handleKeyPress)
    window.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('keydown', handleKeyPress)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [zoomIn, zoomOut, zoomLevel, showIndicator])

  if (loading) {
    return (
      <div className={`grid ${gridClasses[zoomLevel as keyof typeof gridClasses]} gap-4`}>
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
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
          {zoomLevel === 1 ? '1 per row' : 
           zoomLevel === 2 ? '2 per row' : 
           zoomLevel === 3 ? '3-4 per row' : 
           zoomLevel === 4 ? '4-5 per row' : 
           zoomLevel === 5 ? '5-6 per row' : 
           '6+ per row'}
        </div>
      )}
      
      <div className={`grid ${gridClasses[zoomLevel as keyof typeof gridClasses]} gap-4`}>
      {listings.map((listing) => {
        const mainImage = listing.image_url || listing.media_url
        const videoUrl = listing.video_url || (listing.media_type === 'video' ? listing.media_url : null)
        const audioUrl = listing.audio_url || (listing.media_type === 'audio' ? listing.media_url : null)
        const isVideo = !!videoUrl
        const isAudio = !!audioUrl
        const isHovered = hoveredId === listing.id
        
        return (
          <div
            key={listing.id}
            className="relative aspect-square overflow-hidden group"
            onMouseEnter={() => setHoveredId(listing.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={(e) => {
              // On mobile, use tap system; on desktop, use hover
              if (window.innerWidth < 768) {
                handleMobileTap(listing.id, e)
              }
            }}
          >
            <Link
              href={
                listing.content_type === 'event' ? `/event/${listing.id}` :
                listing.content_type === 'rental' ? `/rental/${listing.id}` :
                listing.content_type === 'booking' ? `/booking/${listing.id}` :
                listing.content_type === 'music' ? `/music/${listing.id}` :
                listing.content_type === 'video' ? `/video/${listing.id}` :
                listing.content_type === 'document' ? `/document/${listing.id}` :
                `/listing/${listing.id}`
              }
              className="absolute inset-0 cursor-pointer block"
              onClick={(e) => {
                // On desktop, navigate immediately
                if (window.innerWidth >= 768) {
                  handleListingClick(listing.id)
                } else {
                  // On mobile, prevent default navigation (handled by tap system)
                  e.preventDefault()
                }
              }}
            >
            {/* Main Media (Image, Video, or Audio) */}
            <div className="absolute inset-0">
              {isVideo ? (
                /* Video Preview - Auto-plays on card hover */
                <div className="relative w-full h-full">
                  <video
                    ref={(el) => {
                      if (el && isHovered) {
                        el.play().catch(() => {}) // Auto-play when card is hovered
                      } else if (el && !isHovered) {
                        el.pause()
                        el.currentTime = 0
                      }
                    }}
                    src={videoUrl}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={mainImage}
                  />
                  {/* Video Play Icon Overlay - Fades out when playing */}
                  <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <div className="w-0 h-0 border-l-[16px] border-l-white border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1"></div>
                    </div>
                  </div>
                  {listing.duration && (
                    <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                      {Math.floor(listing.duration / 60)}:{String(listing.duration % 60).padStart(2, '0')}
                    </div>
                  )}
                </div>
              ) : isAudio ? (
                /* Audio Visual */
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 dark:from-purple-600 dark:to-pink-700 flex items-center justify-center relative">
                  {mainImage ? (
                    <img
                      src={mainImage}
                      alt={listing.title}
                      className="w-full h-full object-cover opacity-80"
                    />
                  ) : (
                    <div className="text-white text-6xl">🎵</div>
                  )}
                  {/* Music Icon Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                    </div>
                  </div>
                  {listing.duration && (
                    <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {Math.floor(listing.duration / 60)}:{String(listing.duration % 60).padStart(2, '0')}
                    </div>
                  )}
                </div>
              ) : mainImage ? (
                /* Image */
                <img
                  src={mainImage}
                  alt={listing.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    console.warn('Failed to load image:', mainImage)
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
              ) : null}
              
              {/* Fallback for no media - Enhanced with better icons */}
              {!isVideo && !isAudio && !mainImage && (
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex flex-col items-center justify-center">
                  <div className="text-gray-500 dark:text-gray-400 text-5xl mb-2">
                    {/* Content type based icons */}
                    {listing.content_type === 'event' ? '🎪' :
                     listing.content_type === 'rental' ? '🏠' :
                     listing.content_type === 'booking' ? '🔑' :
                     listing.content_type === 'music' ? '🎵' :
                     listing.content_type === 'video' ? '🎬' :
                     listing.file_type === 'pdf' ? '📄' :
                     
                     /* Category based icons */
                     listing.category === 'Restaurants' ? '🍽️' :
                     listing.category === 'Food & Drink' ? '🍲' :
                     listing.category === 'Hotels' ? '🏨' :
                     listing.category === 'Experiences' ? '🎭' :
                     listing.category === 'Services' ? '✨' :
                     listing.category === 'Places' ? '📍' :
                     listing.category === 'Art & Crafts' ? '🎨' :
                     listing.category === 'Fashion' ? '👗' :
                     listing.category === 'Electronics' ? '⚡' :
                     '📦'}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium">
                    {listing.content_type || listing.category || 'listing'}
                  </div>
                </div>
              )}
            </div>

            {/* Content Type Badge - REMOVED per user request */}

            {/* Hover Information Bar (Desktop) / Tap to Show on Mobile */}
            <div className={`absolute bottom-0 left-0 right-0 h-20 sm:h-28 bg-black/85 backdrop-blur-sm text-white p-2 sm:p-3 transition-all duration-300 flex flex-col ${
              // On mobile, show only when tapped; on desktop, show on hover
              (window.innerWidth < 768 ? mobileTappedId === listing.id : isHovered) 
                ? 'translate-y-0 opacity-100' 
                : 'sm:translate-y-full sm:opacity-0 translate-y-full opacity-0'
            }`}>
              {/* Title Section */}
              <div className="mb-1 sm:mb-2">
                <h3 className="font-semibold text-xs sm:text-sm line-clamp-1 leading-tight">{listing.title}</h3>
              </div>
              
              {/* Price & Location Section */}
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <div className="flex items-center gap-0.5 sm:gap-1 text-green-400">
                  {listing.price && (
                    <>
                      <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs font-semibold">
                        {listing.price}
                      </span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-0.5 sm:gap-1 text-gray-300">
                  {listing.location && (
                    <>
                      <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                      <span className="text-[9px] sm:text-[11px] truncate max-w-[80px] sm:max-w-[120px]">{listing.location}</span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Bottom Section - User & Date */}
              <div className="flex items-center justify-between pt-1 sm:pt-1.5 border-t border-white/10 mt-auto">
                {/* User Info - Clickable */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (typeof window !== 'undefined') {
                      window.location.href = `/profile/${listing.user_id}`
                    }
                  }}
                  className="flex items-center gap-1 sm:gap-1.5 hover:bg-white/10 rounded-lg px-0.5 sm:px-1 py-0.5 -ml-1 transition-colors cursor-pointer"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {listing.profiles?.avatar_url ? (
                      <img
                        src={listing.profiles.avatar_url}
                        alt={listing.profiles?.username || listing.profiles?.name || 'User'}
                        className="w-full h-full rounded-full object-cover"
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
                      <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-[9px] sm:text-[11px] font-medium text-gray-200 truncate max-w-[60px] sm:max-w-[100px]">
                    {listing.profiles?.username || listing.profiles?.name || 'User'}
                  </span>
                </button>
                
                {/* Date */}
                <div className="flex items-center gap-0.5 text-gray-400">
                  <Calendar className="w-2 h-2 sm:w-2.5 sm:h-2.5 flex-shrink-0" />
                  <span className="text-[8px] sm:text-[10px]">
                    {new Date(listing.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Gradient Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>

          {/* Save to Folder Button - Always Visible */}
          <div
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 z-30 flex items-center justify-center"
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
