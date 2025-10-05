'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  User, 
  Edit3, 
  Shield, 
  Building2, 
  Palette, 
  Settings, 
  Camera,
  Globe,
  MapPin,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Star,
  Crown
} from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'

export default function ComprehensiveProfile() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    handle: '',
    username: '',
    bio: '',
    avatar_url: '',
    website: '',
    user_location: '',
    
    // Business Info
    is_business: false,
    business_type: '',
    profile_type: 'personal',
    
    // Verification
    is_verified: false,
    verification_status: 'unverified',
    verification_level: 'basic',
    
    // Safety
    bio_safety_checked: false,
    bio_is_safety_approved: false,
    bio_safety_score: 0,
    
    // Hub Customization
    hub_theme: 'default',
    hub_layout: 'grid',
    hub_banner_url: '',
    hub_description: '',
    custom_css: '',
    
    // Privacy
    show_stats: true,
    show_followers: true,
    show_posts: true,
    
    // Stripe
    stripe_customer_id: ''
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        handle: profile.handle || '',
        username: profile.username || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
        website: profile.website || '',
        user_location: profile.user_location || '',
        is_business: profile.is_business || false,
        business_type: profile.business_type || '',
        profile_type: profile.profile_type || 'personal',
        is_verified: profile.is_verified || false,
        verification_status: profile.verification_status || 'unverified',
        verification_level: profile.verification_level || 'basic',
        bio_safety_checked: profile.bio_safety_checked || false,
        bio_is_safety_approved: profile.bio_is_safety_approved || false,
        bio_safety_score: profile.bio_safety_score || 0,
        hub_theme: profile.hub_theme || 'default',
        hub_layout: profile.hub_layout || 'grid',
        hub_banner_url: profile.hub_banner_url || '',
        hub_description: profile.hub_description || '',
        custom_css: profile.custom_css || '',
        show_stats: profile.show_stats !== false,
        show_followers: profile.show_followers !== false,
        show_posts: profile.show_posts !== false,
        stripe_customer_id: profile.stripe_customer_id || ''
      })
    }
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...formData,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setEditing(false)
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setFormData(prev => ({
        ...prev,
        avatar_url: data.publicUrl
      }))
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Failed to upload avatar. Please try again.')
    }
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
      <AppHeader />
      
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Comprehensive Profile</h1>
              <p className="text-gray-600">Manage your complete profile with advanced features</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Dashboard
              </Link>
              <button
                onClick={() => setEditing(!editing)}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>{editing ? 'Cancel' : 'Edit Profile'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center relative">
                  {formData.avatar_url ? (
                    <img 
                      src={formData.avatar_url} 
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                  {editing && (
                    <label className="absolute bottom-0 right-0 bg-black text-white rounded-full p-2 cursor-pointer hover:bg-gray-800 transition-colors">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {formData.name || 'No name set'}
                </h2>
                <p className="text-gray-500 text-sm">
                  @{formData.handle || formData.username || 'nohandle'}
                </p>
                {formData.is_verified && (
                  <div className="flex items-center justify-center mt-2 text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Verified</span>
                  </div>
                )}
                {formData.is_business && (
                  <div className="flex items-center justify-center mt-2 text-blue-600">
                    <Building2 className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Business</span>
                  </div>
                )}
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2 ${
                    activeTab === 'basic' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Basic Info</span>
                </button>
                <button
                  onClick={() => setActiveTab('business')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2 ${
                    activeTab === 'business' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Business</span>
                </button>
                <button
                  onClick={() => setActiveTab('verification')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2 ${
                    activeTab === 'verification' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Verification</span>
                </button>
                <button
                  onClick={() => setActiveTab('hub')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2 ${
                    activeTab === 'hub' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  <span>Hub Design</span>
                </button>
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2 ${
                    activeTab === 'privacy' ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Privacy</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {editing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information Tab */}
                  {activeTab === 'basic' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Basic Information
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Display Name *
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="handle" className="block text-sm font-medium text-gray-700 mb-2">
                            Handle (for @mentions) *
                          </label>
                          <input
                            type="text"
                            id="handle"
                            name="handle"
                            value={formData.handle}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="username"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                            Username
                          </label>
                          <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label htmlFor="user_location" className="block text-sm font-medium text-gray-700 mb-2">
                            Location
                          </label>
                          <input
                            type="text"
                            id="user_location"
                            name="user_location"
                            value={formData.user_location}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="City, Country"
                          />
                        </div>
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
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="Tell us about yourself..."
                        />
                      </div>

                      <div>
                        <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                          Website
                        </label>
                        <input
                          type="url"
                          id="website"
                          name="website"
                          value={formData.website}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                  )}

                  {/* Business Information Tab */}
                  {activeTab === 'business' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Building2 className="w-5 h-5 mr-2" />
                        Business Information
                      </h3>
                      
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="is_business"
                          name="is_business"
                          checked={formData.is_business}
                          onChange={handleChange}
                          className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                        />
                        <label htmlFor="is_business" className="text-sm font-medium text-gray-700">
                          This is a business account
                        </label>
                      </div>

                      {formData.is_business && (
                        <>
                          <div>
                            <label htmlFor="business_type" className="block text-sm font-medium text-gray-700 mb-2">
                              Business Type
                            </label>
                            <select
                              id="business_type"
                              name="business_type"
                              value={formData.business_type}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            >
                              <option value="">Select business type</option>
                              <option value="retail">Retail</option>
                              <option value="restaurant">Restaurant</option>
                              <option value="service">Service</option>
                              <option value="tech">Technology</option>
                              <option value="creative">Creative</option>
                              <option value="other">Other</option>
                            </select>
                          </div>

                          <div>
                            <label htmlFor="profile_type" className="block text-sm font-medium text-gray-700 mb-2">
                              Profile Type
                            </label>
                            <select
                              id="profile_type"
                              name="profile_type"
                              value={formData.profile_type}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                            >
                              <option value="personal">Personal</option>
                              <option value="business">Business</option>
                              <option value="creator">Creator</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Verification Tab */}
                  {activeTab === 'verification' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Shield className="w-5 h-5 mr-2" />
                        Verification & Safety
                      </h3>
                      
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                          <div>
                            <h4 className="text-sm font-medium text-yellow-800">Verification Status</h4>
                            <p className="text-sm text-yellow-700">
                              {formData.is_verified ? 'Your account is verified' : 'Your account is not yet verified'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="verification_status" className="block text-sm font-medium text-gray-700 mb-2">
                            Verification Status
                          </label>
                          <select
                            id="verification_status"
                            name="verification_status"
                            value={formData.verification_status}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          >
                            <option value="unverified">Unverified</option>
                            <option value="pending">Pending</option>
                            <option value="verified">Verified</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="verification_level" className="block text-sm font-medium text-gray-700 mb-2">
                            Verification Level
                          </label>
                          <select
                            id="verification_level"
                            name="verification_level"
                            value={formData.verification_level}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          >
                            <option value="basic">Basic</option>
                            <option value="premium">Premium</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="bio_safety_checked"
                          name="bio_safety_checked"
                          checked={formData.bio_safety_checked}
                          onChange={handleChange}
                          className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                        />
                        <label htmlFor="bio_safety_checked" className="text-sm font-medium text-gray-700">
                          Bio has been safety checked
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="bio_is_safety_approved"
                          name="bio_is_safety_approved"
                          checked={formData.bio_is_safety_approved}
                          onChange={handleChange}
                          className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                        />
                        <label htmlFor="bio_is_safety_approved" className="text-sm font-medium text-gray-700">
                          Bio is safety approved
                        </label>
                      </div>

                      <div>
                        <label htmlFor="bio_safety_score" className="block text-sm font-medium text-gray-700 mb-2">
                          Bio Safety Score (0-100)
                        </label>
                        <input
                          type="number"
                          id="bio_safety_score"
                          name="bio_safety_score"
                          value={formData.bio_safety_score}
                          onChange={handleChange}
                          min="0"
                          max="100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}

                  {/* Hub Customization Tab */}
                  {activeTab === 'hub' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Palette className="w-5 h-5 mr-2" />
                        Hub Customization
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="hub_theme" className="block text-sm font-medium text-gray-700 mb-2">
                            Hub Theme
                          </label>
                          <select
                            id="hub_theme"
                            name="hub_theme"
                            value={formData.hub_theme}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          >
                            <option value="default">Default</option>
                            <option value="dark">Dark</option>
                            <option value="light">Light</option>
                            <option value="colorful">Colorful</option>
                            <option value="minimal">Minimal</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="hub_layout" className="block text-sm font-medium text-gray-700 mb-2">
                            Hub Layout
                          </label>
                          <select
                            id="hub_layout"
                            name="hub_layout"
                            value={formData.hub_layout}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          >
                            <option value="grid">Grid</option>
                            <option value="list">List</option>
                            <option value="masonry">Masonry</option>
                            <option value="carousel">Carousel</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="hub_banner_url" className="block text-sm font-medium text-gray-700 mb-2">
                          Hub Banner URL
                        </label>
                        <input
                          type="url"
                          id="hub_banner_url"
                          name="hub_banner_url"
                          value={formData.hub_banner_url}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="https://example.com/banner.jpg"
                        />
                      </div>

                      <div>
                        <label htmlFor="hub_description" className="block text-sm font-medium text-gray-700 mb-2">
                          Hub Description
                        </label>
                        <textarea
                          id="hub_description"
                          name="hub_description"
                          value={formData.hub_description}
                          onChange={handleChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="Describe your hub..."
                        />
                      </div>

                      <div>
                        <label htmlFor="custom_css" className="block text-sm font-medium text-gray-700 mb-2">
                          Custom CSS
                        </label>
                        <textarea
                          id="custom_css"
                          name="custom_css"
                          value={formData.custom_css}
                          onChange={handleChange}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-mono text-sm"
                          placeholder="/* Custom CSS for your hub */"
                        />
                      </div>
                    </div>
                  )}

                  {/* Privacy Tab */}
                  {activeTab === 'privacy' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Settings className="w-5 h-5 mr-2" />
                        Privacy Settings
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Eye className="w-5 h-5 text-gray-400" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Show Statistics</h4>
                              <p className="text-sm text-gray-500">Display your profile statistics publicly</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            id="show_stats"
                            name="show_stats"
                            checked={formData.show_stats}
                            onChange={handleChange}
                            className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Eye className="w-5 h-5 text-gray-400" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Show Followers</h4>
                              <p className="text-sm text-gray-500">Display your follower count publicly</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            id="show_followers"
                            name="show_followers"
                            checked={formData.show_followers}
                            onChange={handleChange}
                            className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Eye className="w-5 h-5 text-gray-400" />
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Show Posts</h4>
                              <p className="text-sm text-gray-500">Display your posts publicly</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            id="show_posts"
                            name="show_posts"
                            checked={formData.show_posts}
                            onChange={handleChange}
                            className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
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
                <div className="space-y-6">
                  {/* Display current profile information based on active tab */}
                  {activeTab === 'basic' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                          <p className="text-gray-900">{formData.name || 'Not set'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Handle</label>
                          <p className="text-gray-900">@{formData.handle || 'Not set'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                          <p className="text-gray-900">{formData.username || 'Not set'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                          <p className="text-gray-900">{formData.user_location || 'Not set'}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <p className="text-gray-900">{formData.bio || 'No bio added'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                        <p className="text-gray-900">
                          {formData.website ? (
                            <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {formData.website}
                            </a>
                          ) : 'Not set'}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'business' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                          <p className="text-gray-900">{formData.is_business ? 'Business Account' : 'Personal Account'}</p>
                        </div>
                        {formData.is_business && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                              <p className="text-gray-900">{formData.business_type || 'Not specified'}</p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Type</label>
                              <p className="text-gray-900">{formData.profile_type || 'Personal'}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'verification' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Verification & Safety</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Verification Status</label>
                          <p className="text-gray-900 capitalize">{formData.verification_status || 'Unverified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Verification Level</label>
                          <p className="text-gray-900 capitalize">{formData.verification_level || 'Basic'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Safety Checked</label>
                          <p className="text-gray-900">{formData.bio_safety_checked ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Safety Approved</label>
                          <p className="text-gray-900">{formData.bio_is_safety_approved ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Safety Score</label>
                          <p className="text-gray-900">{formData.bio_safety_score || 0}/100</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'hub' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Hub Customization</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                          <p className="text-gray-900 capitalize">{formData.hub_theme || 'Default'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Layout</label>
                          <p className="text-gray-900 capitalize">{formData.hub_layout || 'Grid'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Banner</label>
                          <p className="text-gray-900">
                            {formData.hub_banner_url ? (
                              <a href={formData.hub_banner_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                View Banner
                              </a>
                            ) : 'Not set'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <p className="text-gray-900">{formData.hub_description || 'Not set'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Custom CSS</label>
                          <p className="text-gray-900">{formData.custom_css ? 'Custom styles applied' : 'No custom styles'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'privacy' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Privacy Settings</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Show Statistics</span>
                          <span className={`px-2 py-1 rounded text-xs ${formData.show_stats ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {formData.show_stats ? 'Public' : 'Private'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Show Followers</span>
                          <span className={`px-2 py-1 rounded text-xs ${formData.show_followers ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {formData.show_followers ? 'Public' : 'Private'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Show Posts</span>
                          <span className={`px-2 py-1 rounded text-xs ${formData.show_posts ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {formData.show_posts ? 'Public' : 'Private'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AppFooter />
      <BottomNav />
    </div>
  )
}

