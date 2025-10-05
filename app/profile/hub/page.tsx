'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  Palette, 
  Layout, 
  Image, 
  Code, 
  Eye,
  Save,
  Upload,
  ArrowLeft
} from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'
import ProfileNavigation from '@/components/ProfileNavigation'

export default function HubCustomization() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [formData, setFormData] = useState({
    hub_theme: 'default',
    hub_layout: 'grid',
    hub_banner_url: '',
    hub_description: '',
    custom_css: ''
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        hub_theme: profile.hub_theme || 'default',
        hub_layout: profile.hub_layout || 'grid',
        hub_banner_url: profile.hub_banner_url || '',
        hub_description: profile.hub_description || '',
        custom_css: profile.custom_css || ''
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
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      alert('Hub customization saved successfully!')
    } catch (error) {
      console.error('Error updating hub customization:', error)
      alert('Failed to save hub customization. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-banner-${Date.now()}.${fileExt}`
      const filePath = `hub-banners/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('hub-banners')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from('hub-banners')
        .getPublicUrl(filePath)

      setFormData(prev => ({
        ...prev,
        hub_banner_url: data.publicUrl
      }))
    } catch (error) {
      console.error('Error uploading banner:', error)
      alert('Failed to upload banner. Please try again.')
    }
  }

  const themes = [
    { value: 'default', label: 'Default', description: 'Clean and minimal' },
    { value: 'dark', label: 'Dark', description: 'Dark theme with contrast' },
    { value: 'light', label: 'Light', description: 'Bright and airy' },
    { value: 'colorful', label: 'Colorful', description: 'Vibrant and energetic' },
    { value: 'minimal', label: 'Minimal', description: 'Ultra clean design' }
  ]

  const layouts = [
    { value: 'grid', label: 'Grid', description: 'Card-based grid layout' },
    { value: 'list', label: 'List', description: 'Vertical list layout' },
    { value: 'masonry', label: 'Masonry', description: 'Pinterest-style layout' },
    { value: 'carousel', label: 'Carousel', description: 'Sliding carousel layout' }
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in</h1>
          <p className="text-gray-600 mb-6">You need to be signed in to customize your hub.</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Hub Customization</h1>
              <p className="text-gray-600">Customize your hub's appearance and layout</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>{previewMode ? 'Edit Mode' : 'Preview Mode'}</span>
              </button>
              <Link
                href="/profile"
                className="text-gray-500 hover:text-gray-700 flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation */}
          <div className="lg:col-span-1">
            <ProfileNavigation />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Theme Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                    <Palette className="w-5 h-5 mr-2" />
                    Choose Theme
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {themes.map((theme) => (
                      <label
                        key={theme.value}
                        className={`relative cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                          formData.hub_theme === theme.value
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="hub_theme"
                          value={theme.value}
                          checked={formData.hub_theme === theme.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <div className="font-medium">{theme.label}</div>
                          <div className={`text-sm ${
                            formData.hub_theme === theme.value ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            {theme.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Layout Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                    <Layout className="w-5 h-5 mr-2" />
                    Choose Layout
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {layouts.map((layout) => (
                      <label
                        key={layout.value}
                        className={`relative cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                          formData.hub_layout === layout.value
                            ? 'border-black bg-black text-white'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="hub_layout"
                          value={layout.value}
                          checked={formData.hub_layout === layout.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <div className="flex items-center space-x-3">
                          <div className="font-medium">{layout.label}</div>
                          <div className={`text-sm ${
                            formData.hub_layout === layout.value ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            {layout.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Banner Upload */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                    <Image className="w-5 h-5 mr-2" />
                    Hub Banner
                  </h3>
                  <div className="space-y-4">
                    {formData.hub_banner_url && (
                      <div className="relative">
                        <img
                          src={formData.hub_banner_url}
                          alt="Hub banner"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, hub_banner_url: '' }))}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Banner Image
                      </label>
                      <div className="flex items-center space-x-3">
                        <label className="cursor-pointer bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
                          <Upload className="w-4 h-4" />
                          <span>Choose File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBannerUpload}
                            className="hidden"
                          />
                        </label>
                        <span className="text-sm text-gray-500">
                          Recommended: 1200x300px
                        </span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="hub_banner_url" className="block text-sm font-medium text-gray-700 mb-2">
                        Or enter banner URL
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
                  </div>
                </div>

                {/* Hub Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Hub Description
                  </h3>
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

                {/* Custom CSS */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                    <Code className="w-5 h-5 mr-2" />
                    Custom CSS
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Add custom CSS to further customize your hub's appearance.
                    </p>
                    <textarea
                      id="custom_css"
                      name="custom_css"
                      value={formData.custom_css}
                      onChange={handleChange}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-mono text-sm"
                      placeholder="/* Custom CSS for your hub */&#10;.hub-header {&#10;  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);&#10;}&#10;&#10;.hub-card {&#10;  border-radius: 12px;&#10;  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);&#10;}"
                    />
                  </div>
                </div>

                {/* Preview Mode */}
                {previewMode && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      <div className="text-center">
                        <div className="text-sm text-gray-500 mb-2">Hub Preview</div>
                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          {formData.hub_banner_url && (
                            <div 
                              className="w-full h-24 bg-cover bg-center rounded-lg mb-4"
                              style={{ backgroundImage: `url(${formData.hub_banner_url})` }}
                            />
                          )}
                          <h2 className="text-xl font-bold">{profile?.name || 'Your Name'}</h2>
                          <p className="text-gray-600 text-sm">@{profile?.handle || 'username'}</p>
                          {formData.hub_description && (
                            <p className="text-gray-600 mt-2">{formData.hub_description}</p>
                          )}
                          <div className={`mt-4 grid gap-2 ${
                            formData.hub_layout === 'grid' ? 'grid-cols-2' : 
                            formData.hub_layout === 'list' ? 'grid-cols-1' :
                            formData.hub_layout === 'masonry' ? 'grid-cols-3' : 'grid-cols-1'
                          }`}>
                            <div className="bg-gray-100 rounded p-2 text-xs">Sample Post 1</div>
                            <div className="bg-gray-100 rounded p-2 text-xs">Sample Post 2</div>
                            <div className="bg-gray-100 rounded p-2 text-xs">Sample Post 3</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setFormData({
                      hub_theme: 'default',
                      hub_layout: 'grid',
                      hub_banner_url: '',
                      hub_description: '',
                      custom_css: ''
                    })}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <AppFooter />
      <BottomNav />
    </div>
  )
}

