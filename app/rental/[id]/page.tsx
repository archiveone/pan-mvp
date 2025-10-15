'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'
import { Calendar, MapPin, Users, Bed, Bath, Home, Star, Heart, Share2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import BookingService from '@/services/bookingService'

export default function RentalDetailPage() {
  const params = useParams()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)

  useEffect(() => {
    loadListing()
  }, [params.id])

  const loadListing = async () => {
    try {
      const { data, error } = await supabase
        .from('bookable_listings')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            username,
            avatar_url,
            host_since,
            superhost
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error
      setListing(data)
    } catch (error) {
      console.error('Error loading rental:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    if (!listing || !checkIn || !checkOut) return 0

    const nights = Math.ceil(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    )

    const basePrice = listing.base_price * nights
    const cleaningFee = listing.cleaning_fee || 0
    const serviceFee = basePrice * (listing.service_fee_percentage / 100)

    return basePrice + cleaningFee + serviceFee
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Listing not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-4 py-8 pb-24">
        {/* Image Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-8 rounded-2xl overflow-hidden">
          <div className="aspect-[4/3] lg:row-span-2">
            <img
              src={listing.images?.[selectedImage] || '/placeholder.jpg'}
              alt={listing.title}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setSelectedImage((selectedImage + 1) % (listing.images?.length || 1))}
            />
          </div>
          {listing.images?.slice(1, 5).map((img: string, idx: number) => (
            <div key={idx} className="aspect-[4/3] hidden lg:block">
              <img
                src={img}
                alt={`${listing.title} ${idx + 2}`}
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedImage(idx + 1)}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Location */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {listing.title}
                </h1>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                    <Heart className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>{listing.city}, {listing.state}, {listing.country}</span>
              </div>
              {listing.average_rating > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{listing.average_rating.toFixed(1)}</span>
                  <span className="text-gray-500">({listing.review_count} reviews)</span>
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="flex items-center gap-6 py-4 border-y border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span>{listing.max_guests} guests</span>
              </div>
              <div className="flex items-center gap-2">
                <Bed className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span>{listing.bedrooms} bedrooms</span>
              </div>
              <div className="flex items-center gap-2">
                <Bath className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span>{listing.bathrooms} baths</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">About this place</h2>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>

            {/* Amenities */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Amenities</h2>
                <div className="grid grid-cols-2 gap-3">
                  {listing.amenities.map((amenity: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                        ✓
                      </div>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="mb-6">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${listing.base_price}
                  <span className="text-base font-normal text-gray-600 dark:text-gray-400"> / night</span>
                </div>
              </div>

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Check-out
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Guests */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Guests
                </label>
                <input
                  type="number"
                  min="1"
                  max={listing.max_guests}
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Price Breakdown */}
              {checkIn && checkOut && (
                <div className="mb-6 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>${listing.base_price} × {Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))} nights</span>
                    <span>${listing.base_price * Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))}</span>
                  </div>
                  {listing.cleaning_fee > 0 && (
                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                      <span>Cleaning fee</span>
                      <span>${listing.cleaning_fee}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-700 dark:text-gray-300">
                    <span>Service fee</span>
                    <span>${(listing.base_price * Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)) * listing.service_fee_percentage / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>Total</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Reserve Button */}
              <button className="w-full py-4 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-semibold rounded-xl transition-all">
                {listing.instant_book ? 'Book Now' : 'Request to Book'}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                You won't be charged yet
              </p>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  )
}

