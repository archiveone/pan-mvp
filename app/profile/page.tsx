'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'

export default function Profile() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    avatar_url: ''
  })

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.user_metadata?.full_name || '',
        bio: profile?.bio || '',
        avatar_url: user.user_metadata?.avatar_url || ''
      })
    }
  }, [user, profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      // Update user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          avatar_url: formData.avatar_url
        }
      })

      if (authError) throw authError

      // Update or create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          bio: formData.bio,
        })

      if (profileError) throw profileError

      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
          <p className="text-gray-600 mb-6">You need to be signed in to view your profile.</p>
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
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600">Manage your account information</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/profile/comprehensive"
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Advanced Profile
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  {formData.avatar_url ? (
                    <img 
                      src={formData.avatar_url} 
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl text-gray-400">👤</span>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {formData.full_name || 'No name set'}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {user.email}
                </p>
                {profile?.handle && (
                  <p className="text-gray-500 text-sm">
                    @{profile.handle}
                  </p>
                )}
                {profile?.is_verified && (
                  <div className="flex items-center justify-center mt-2 text-green-600">
                    <span className="text-sm font-medium">✓ Verified</span>
                  </div>
                )}
                {profile?.is_business && (
                  <div className="flex items-center justify-center mt-2 text-blue-600">
                    <span className="text-sm font-medium">🏢 Business</span>
                  </div>
                )}
                {formData.bio && (
                  <p className="text-gray-600 text-sm mt-3">
                    {formData.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editing ? 'Edit Profile' : 'Profile Information'}
                </h3>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-black hover:text-gray-700 font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>

              {editing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div>
                    <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 mb-2">
                      Avatar URL
                    </label>
                    <input
                      type="url"
                      id="avatar_url"
                      name="avatar_url"
                      value={formData.avatar_url}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <p className="text-gray-900">{formData.full_name || 'Not set'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <p className="text-gray-900">{formData.bio || 'No bio added'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900">{user.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Member Since
                    </label>
                    <p className="text-gray-900">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
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
