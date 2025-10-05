'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Listing } from '@/lib/supabase'
import Link from 'next/link'
import { CreditCard, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    soldListings: 0,
    views: 0
  })

  useEffect(() => {
    if (user) {
      loadUserListings()
      loadStats()
    }
  }, [user])

  const loadUserListings = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setListings(data || [])
    } catch (error) {
      console.error('Error loading listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('listings')
        .select('is_sold')
        .eq('user_id', user.id)

      if (error) throw error

      const total = data?.length || 0
      const sold = data?.filter(l => l.is_sold).length || 0
      const active = total - sold

      setStats({
        totalListings: total,
        activeListings: active,
        soldListings: sold,
        views: 0 // We'll implement view tracking later
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const markAsSold = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ is_sold: true })
        .eq('id', listingId)

      if (error) throw error
      
      // Reload listings and stats
      await loadUserListings()
      await loadStats()
    } catch (error) {
      console.error('Error marking as sold:', error)
    }
  }

  const deleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId)

      if (error) throw error
      
      // Reload listings and stats
      await loadUserListings()
      await loadStats()
    } catch (error) {
      console.error('Error deleting listing:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
          <p className="text-gray-600 mb-6">You need to be signed in to access your dashboard.</p>
          <Link 
            href="/"
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Home
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
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Manage your listings and account</p>
              {profile && (
                <div className="flex items-center space-x-4 mt-2">
                  {profile.is_verified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Verified
                    </span>
                  )}
                  {profile.is_business && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      🏢 Business
                    </span>
                  )}
                  {profile.handle && (
                    <span className="text-sm text-gray-500">@{profile.handle}</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/profile/comprehensive"
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Manage Profile
              </Link>
              <Link
                href="/create-listing"
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                + New Listing
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Listings</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.totalListings}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Active Listings</h3>
            <p className="text-2xl font-bold text-green-600">{stats.activeListings}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Sold Items</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.soldListings}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Total Views</h3>
            <p className="text-2xl font-bold text-purple-600">{stats.views}</p>
          </div>
        </div>

        {/* Profile Status Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Profile Completion */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Profile Status</h3>
              <Link
                href="/profile/comprehensive"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Complete Profile
              </Link>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Basic Info</span>
                <span className="text-sm font-medium text-green-600">✓ Complete</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Verification</span>
                <span className={`text-sm font-medium ${
                  profile?.is_verified ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {profile?.is_verified ? '✓ Verified' : '⏳ Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Business Setup</span>
                <span className={`text-sm font-medium ${
                  profile?.is_business ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {profile?.is_business ? '✓ Business' : 'Not Set'}
                </span>
              </div>
            </div>
          </div>

          {/* Hub Customization */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Hub Design</h3>
              <Link
                href="/profile/hub"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Customize
              </Link>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Theme</span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {profile?.hub_theme || 'Default'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Layout</span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {profile?.hub_layout || 'Grid'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Custom CSS</span>
                <span className={`text-sm font-medium ${
                  profile?.custom_css ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {profile?.custom_css ? '✓ Applied' : 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Privacy</h3>
              <Link
                href="/profile/comprehensive"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Manage
              </Link>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Show Stats</span>
                <span className={`text-sm font-medium ${
                  profile?.show_stats !== false ? 'text-green-600' : 'text-red-600'
                }`}>
                  {profile?.show_stats !== false ? 'Public' : 'Private'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Show Followers</span>
                <span className={`text-sm font-medium ${
                  profile?.show_followers !== false ? 'text-green-600' : 'text-red-600'
                }`}>
                  {profile?.show_followers !== false ? 'Public' : 'Private'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Show Posts</span>
                <span className={`text-sm font-medium ${
                  profile?.show_posts !== false ? 'text-green-600' : 'text-red-600'
                }`}>
                  {profile?.show_posts !== false ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Setup Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Payment Setup</h3>
                <p className="text-gray-600">Set up your payment account to receive money from sales</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4" />
                <span>Not set up</span>
              </div>
              <div className="flex space-x-2">
                <Link
                  href="/dashboard/payments"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Set Up Payments</span>
                </Link>
                <Link
                  href="/dashboard/funds"
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Manage Funds</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Listings</h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">Loading your listings...</div>
            </div>
          ) : listings.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-500 mb-4">You haven't created any listings yet.</div>
              <Link
                href="/create-listing"
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Create Your First Listing
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {listings.map((listing) => (
                <div key={listing.id} className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Image */}
                    <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {listing.image_url ? (
                        <img 
                          src={listing.image_url} 
                          alt={listing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          📷
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {listing.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {listing.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span className="font-semibold text-green-600">{listing.price}</span>
                            <span>{listing.location}</span>
                            <span className="bg-gray-100 px-2 py-1 rounded">{listing.category}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              listing.is_sold 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {listing.is_sold ? 'Sold' : 'Active'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          {!listing.is_sold && (
                            <button
                              onClick={() => markAsSold(listing.id)}
                              className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded hover:bg-green-200 transition-colors"
                            >
                              Mark as Sold
                            </button>
                          )}
                          <Link
                            href={`/edit-listing/${listing.id}`}
                            className="text-sm bg-gray-100 text-gray-800 px-3 py-1 rounded hover:bg-gray-200 transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => deleteListing(listing.id)}
                            className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <AppFooter />

      {/* Bottom Navigation for Mobile */}
      <BottomNav />
    </div>
  )
}
