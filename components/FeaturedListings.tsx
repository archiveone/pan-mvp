'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, DollarSign, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { HomepageService, HomepageListing } from '@/services/homepageService'

interface FeaturedListingsProps {
  title?: string
  subtitle?: string
}

export default function FeaturedListings({ 
  title = "Featured Listings", 
  subtitle = "Discover amazing items from our community" 
}: FeaturedListingsProps) {
  const [featuredListings, setFeaturedListings] = useState<HomepageListing[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    loadFeaturedListings()
  }, [])

  const loadFeaturedListings = async () => {
    setLoading(true)
    try {
      const result = await HomepageService.getFeaturedListings()
      if (result.success && result.listings) {
        setFeaturedListings(result.listings)
      }
    } catch (error) {
      console.error('Error loading featured listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, featuredListings.length - 2))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, featuredListings.length - 2)) % Math.max(1, featuredListings.length - 2))
  }

  if (loading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (featuredListings.length === 0) {
    return null
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">{subtitle}</p>
        </div>

        {/* Desktop Grid View */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredListings.slice(0, 6).map((listing) => (
            <Link
              key={listing.id}
              href={`/listing/${listing.id}`}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 group"
            >
              <div className="aspect-video overflow-hidden rounded-t-xl">
                {listing.media_url ? (
                  <img
                    src={listing.media_url}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement
                      if (fallback) fallback.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div 
                  className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center"
                  style={{ display: listing.media_url ? 'none' : 'flex' }}
                >
                  <div className="text-gray-500 text-4xl">📦</div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {listing.title}
                  </h3>
                  {listing.profiles?.is_verified && (
                    <Star className="w-4 h-4 text-blue-500 fill-current flex-shrink-0 ml-2" />
                  )}
                </div>
                
                {listing.content && (
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {listing.content}
                  </p>
                )}

                <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                  {listing.location && (
                    <div className="flex items-center gap-1">
                      <MapPin size={12} />
                      <span className="line-clamp-1">{listing.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  {(listing.price || listing.price_amount) && (
                    <div className="flex items-center gap-1 text-green-600 font-semibold">
                      <DollarSign size={16} />
                      <span>{listing.price || `${listing.price_amount} ${listing.currency || 'EUR'}`}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    {listing.profiles?.avatar_url ? (
                      <img
                        src={listing.profiles.avatar_url}
                        alt="User"
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs text-gray-600">
                          {listing.profiles?.name?.[0] || 'U'}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-gray-500">
                      {listing.profiles?.username || listing.profiles?.name || 'User'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile Carousel View */}
        <div className="md:hidden relative">
          <div className="overflow-hidden rounded-xl">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {featuredListings.map((listing) => (
                <div key={listing.id} className="w-full flex-shrink-0">
                  <Link
                    href={`/listing/${listing.id}`}
                    className="bg-white rounded-xl shadow-sm block"
                  >
                    <div className="aspect-video overflow-hidden rounded-t-xl">
                      {listing.media_url ? (
                        <img
                          src={listing.media_url}
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <div className="text-gray-500 text-4xl">📦</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-2">
                          {listing.title}
                        </h3>
                        {listing.profiles?.is_verified && (
                          <Star className="w-4 h-4 text-blue-500 fill-current flex-shrink-0 ml-2" />
                        )}
                      </div>
                      
                      {listing.content && (
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {listing.content}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        {(listing.price || listing.price_amount) && (
                          <div className="flex items-center gap-1 text-green-600 font-semibold">
                            <DollarSign size={16} />
                            <span>{listing.price || `${listing.price_amount} ${listing.currency || 'EUR'}`}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          {listing.profiles?.avatar_url ? (
                            <img
                              src={listing.profiles.avatar_url}
                              alt="User"
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-xs text-gray-600">
                                {listing.profiles?.name?.[0] || 'U'}
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-gray-500">
                            {listing.profiles?.username || listing.profiles?.name || 'User'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
          
          {featuredListings.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg"
              >
                <ChevronLeft size={20} className="text-gray-700" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg"
              >
                <ChevronRight size={20} className="text-gray-700" />
              </button>
            </>
          )}
          
          {/* Dots indicator */}
          {featuredListings.length > 1 && (
            <div className="flex justify-center mt-4 gap-2">
              {Array.from({ length: Math.max(1, featuredListings.length - 2) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* View All Button */}
        <div className="text-center mt-8">
          <Link
            href="/marketplace"
            className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            View All Listings
            <ChevronRight size={16} className="ml-2" />
          </Link>
        </div>
      </div>
    </section>
  )
}
