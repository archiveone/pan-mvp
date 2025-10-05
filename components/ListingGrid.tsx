'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Heart, MapPin, Calendar, DollarSign, User, Eye } from 'lucide-react'

interface Listing {
  id: string
  title: string
  content: string
  price?: number
  currency?: string
  location?: string
  created_at: string
  user_id: string
  profiles?: {
    username?: string
    avatar_url?: string
  }
  media_url?: string
}

interface ListingGridProps {
  listings: Listing[]
  loading?: boolean
}

export default function ListingGrid({ listings, loading }: ListingGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {listings.map((listing) => {
        const mainImage = listing.media_url
        const isHovered = hoveredId === listing.id
        
        // Debug logging (commented out to prevent infinite loop)
        // console.log('Listing:', listing.title, 'Image:', mainImage, 'Media URL:', listing.media_url)
        
        return (
          <div
            key={listing.id}
            className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group"
            onMouseEnter={() => setHoveredId(listing.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Main Image */}
            <div className="absolute inset-0">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={listing.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    // Hide the broken image and show fallback
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement
                    if (fallback) fallback.style.display = 'flex'
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
            <div className={`absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm text-white p-3 transition-all duration-300 ${
              isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            }`}>
              <div className="space-y-2">
                {/* Title */}
                <h3 className="font-semibold text-sm line-clamp-1">{listing.title}</h3>
                
                {/* Price */}
                {listing.price && (
                  <div className="flex items-center gap-1 text-green-400">
                    <DollarSign size={12} />
                    <span className="text-sm font-medium">
                      {listing.price} {listing.currency || 'USD'}
                    </span>
                  </div>
                )}
                
                {/* Location */}
                {listing.location && (
                  <div className="flex items-center gap-1 text-gray-300">
                    <MapPin size={12} />
                    <span className="text-xs">{listing.location}</span>
                  </div>
                )}
                
                {/* User Info */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
                    {listing.profiles?.avatar_url ? (
                      <img
                        src={listing.profiles.avatar_url}
                        alt="User"
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <User size={12} />
                    )}
                  </div>
                  <span className="text-xs text-gray-300">
                    {listing.profiles?.username || 'User'}
                  </span>
                </div>
                
                {/* Date */}
                <div className="flex items-center gap-1 text-gray-400">
                  <Calendar size={10} />
                  <span className="text-xs">
                    {new Date(listing.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Gradient Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Save Button */}
            <button className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/30">
              <Heart size={16} className="text-white" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
