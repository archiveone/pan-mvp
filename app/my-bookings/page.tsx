'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'
import { Calendar, MapPin, Home, User, Clock } from 'lucide-react'
import Link from 'next/link'

interface Booking {
  id: string
  booking_number: string
  listing_title: string
  business_name: string
  check_in_date: string
  check_out_date: string
  address: string
  status: string
  confirmation_code: string
  total_price: number
  currency: string
  host_name: string
  listing_images: string[]
}

export default function MyBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')

  useEffect(() => {
    if (user) {
      loadBookings()
    }
  }, [user, filter])

  const loadBookings = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('my_bookings')
        .select('*')
        .eq('user_id', user?.id)

      if (filter === 'upcoming') {
        query = query.gte('check_in_date', new Date().toISOString().split('T')[0])
      } else if (filter === 'past') {
        query = query.lt('check_in_date', new Date().toISOString().split('T')[0])
      }

      const { data, error } = await query.order('check_in_date', { ascending: false })

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error loading bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Sign in to view your bookings</h1>
          <Link href="/" className="text-lime-600 hover:underline">Go to homepage</Link>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      
      <main className="max-w-6xl mx-auto px-4 py-6 pb-20">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">My Bookings</h1>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['upcoming', 'past', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-lime-500 text-black'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏠</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No bookings yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Book your first stay, appointment, or service!
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-lime-500 text-black rounded-lg font-medium hover:bg-lime-400"
            >
              Browse Listings
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="md:flex">
                  {/* Image */}
                  <div className="md:w-48 h-48 md:h-auto">
                    {booking.listing_images?.[0] ? (
                      <img
                        src={booking.listing_images[0]}
                        alt={booking.listing_title || booking.business_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-4xl">
                        🏠
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {booking.listing_title || booking.business_name}
                        </h3>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar size={16} />
                            <span>
                              {new Date(booking.check_in_date).toLocaleDateString()} 
                              {booking.check_out_date && ` - ${new Date(booking.check_out_date).toLocaleDateString()}`}
                            </span>
                          </div>
                          {booking.address && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <MapPin size={16} />
                              <span>{booking.address}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <User size={16} />
                            <span>Host: {booking.host_name}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status */}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>

                    {/* Confirmation & Price */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Confirmation Code</p>
                        <p className="font-mono font-bold text-gray-900 dark:text-white">{booking.confirmation_code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {booking.total_price} {booking.currency}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  )
}

