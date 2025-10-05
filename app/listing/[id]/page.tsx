'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'

interface Listing {
  id: string
  title: string
  description: string
  price: string
  location: string
  category: string
  image_url: string
  user_id: string
  is_sold: boolean
  created_at: string
  updated_at: string
}

interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string
}

export default function ListingDetail() {
  const params = useParams()
  const { user } = useAuth()
  const [listing, setListing] = useState<Listing | null>(null)
  const [seller, setSeller] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.id) {
      loadListing()
    }
  }, [params.id])

  const loadListing = async () => {
    try {
      // Load listing
      const { data: listingData, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', params.id)
        .single()

      if (listingError) throw listingError
      setListing(listingData)

      // Load seller info
      const { data: sellerData, error: sellerError } = await supabase
        .from('users')
        .select('*')
        .eq('id', listingData.user_id)
        .single()

      if (sellerError) {
        console.warn('Could not load seller info:', sellerError.message)
        // Set default seller info
        setSeller({
          id: listingData.user_id,
          email: 'Unknown',
          full_name: 'Unknown Seller',
          avatar_url: ''
        })
      } else {
        setSeller(sellerData)
      }
    } catch (error) {
      console.error('Error loading listing:', error)
      setError('Listing not found')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500">Loading listing...</div>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Listing Not Found</h1>
          <p className="text-gray-600 mb-6">The listing you're looking for doesn't exist or has been removed.</p>
          <Link 
            href="/"
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logo */}
      <AppHeader />
      
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link 
            href="/"
            className="text-gray-500 hover:text-gray-700 flex items-center"
          >
            ← Back to Home
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image */}
          <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
            {listing.image_url ? (
              <img 
                src={listing.image_url} 
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">
                📷
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{listing.title}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <span>{listing.location}</span>
                <span>•</span>
                <span className="bg-gray-100 px-2 py-1 rounded">{listing.category}</span>
                <span>•</span>
                <span>{new Date(listing.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="text-3xl font-bold text-green-600">
              {listing.price}
            </div>

            {listing.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            {/* Seller Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Seller Information</h3>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  {seller?.avatar_url ? (
                    <img 
                      src={seller.avatar_url} 
                      alt="Seller"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400">👤</span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {seller?.full_name || 'Unknown Seller'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Member since {seller ? new Date(seller.id).getFullYear() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {user ? (
                <div className="space-y-3">
                  <Link
                    href={`/messages?contact=${listing.user_id}`}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium text-center block"
                  >
                    Contact Seller
                  </Link>
                  <button className="w-full bg-gray-100 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                    Save Listing
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    href="/"
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium text-center block"
                  >
                    Sign in to Contact Seller
                  </Link>
                  <Link
                    href="/"
                    className="w-full bg-gray-100 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors text-center block"
                  >
                    Sign in to Save Listing
                  </Link>
                </div>
              )}
            </div>

            {/* Status */}
            {listing.is_sold && (
              <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg">
                <p className="font-medium">This item has been sold</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <AppFooter />

      {/* Bottom Navigation for Mobile */}
      <BottomNav />
    </div>
  )
}
