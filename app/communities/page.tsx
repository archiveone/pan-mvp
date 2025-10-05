'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'

interface Community {
  id: string
  name: string
  description: string
  cover_image_url?: string
  is_public: boolean
  member_count: number
  post_count: number
  created_by: string
  created_at: string
  user_profiles?: {
    display_name: string
    avatar_url?: string
  }
}

export default function CommunitiesPage() {
  const { user } = useAuth()
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    is_public: true
  })

  useEffect(() => {
    fetchCommunities()
  }, [])

  const fetchCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select(`
          *,
          user_profiles!communities_created_by_fkey (
            display_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCommunities(data || [])
    } catch (error) {
      console.error('Error fetching communities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('communities')
        .insert([{
          name: newCommunity.name,
          description: newCommunity.description,
          is_public: newCommunity.is_public,
          created_by: user.id
        }])
        .select()
        .single()

      if (error) throw error

      // Add creator as admin member
      await supabase
        .from('community_members')
        .insert([{
          community_id: data.id,
          user_id: user.id,
          role: 'admin'
        }])

      setNewCommunity({ name: '', description: '', is_public: true })
      setShowCreateForm(false)
      fetchCommunities()
    } catch (error) {
      console.error('Error creating community:', error)
    }
  }

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    community.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <AppFooter />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Communities</h1>
            <p className="text-gray-600 mt-2">Join communities and start discussions</p>
          </div>
          {user && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Community
            </button>
          )}
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search communities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Create Community Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">Create Community</h2>
              <form onSubmit={handleCreateCommunity}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Community Name
                  </label>
                  <input
                    type="text"
                    value={newCommunity.name}
                    onChange={(e) => setNewCommunity({...newCommunity, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newCommunity.description}
                    onChange={(e) => setNewCommunity({...newCommunity, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newCommunity.is_public}
                      onChange={(e) => setNewCommunity({...newCommunity, is_public: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Public community</span>
                  </label>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Communities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community) => (
            <Link
              key={community.id}
              href={`/communities/${community.id}`}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {community.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {community.description}
                  </p>
                </div>
                <div className="ml-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    community.is_public 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {community.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>{community.member_count} members</span>
                  <span>{community.post_count} posts</span>
                </div>
                <div className="flex items-center">
                  <span>by {community.user_profiles?.display_name}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredCommunities.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No communities found</p>
          </div>
        )}
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  )
}
