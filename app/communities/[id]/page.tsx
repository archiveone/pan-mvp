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

interface Post {
  id: string
  title: string
  content: string
  content_type: string
  created_at: string
  user_profiles?: {
    display_name: string
    avatar_url?: string
  }
  comments?: Comment[]
  likes?: Like[]
}

interface Comment {
  id: string
  content: string
  created_at: string
  user_profiles?: {
    display_name: string
    avatar_url?: string
  }
}

interface Like {
  id: string
  user_id: string
}

export default function CommunityDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const [community, setCommunity] = useState<Community | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    content_type: 'community_post'
  })

  useEffect(() => {
    if (params.id) {
      fetchCommunity()
      fetchPosts()
      checkMembership()
    }
  }, [params.id, user])

  const fetchCommunity = async () => {
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
        .eq('id', params.id)
        .single()

      if (error) throw error
      setCommunity(data)
    } catch (error) {
      console.error('Error fetching community:', error)
    }
  }

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          post_id,
          posts!inner (
            id,
            title,
            content,
            content_type,
            created_at,
            user_profiles!inner (
              display_name,
              avatar_url
            )
          )
        `)
        .eq('community_id', params.id)
        .order('posts.created_at', { ascending: false })

      if (error) throw error
      setPosts(data?.map(item => item.posts) || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkMembership = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', params.id)
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setIsMember(!!data)
    } catch (error) {
      console.error('Error checking membership:', error)
    }
  }

  const handleJoinCommunity = async () => {
    if (!user || !community) return

    try {
      const { error } = await supabase
        .from('community_members')
        .insert([{
          community_id: community.id,
          user_id: user.id,
          role: 'member'
        }])

      if (error) throw error
      setIsMember(true)
      setCommunity(prev => prev ? { ...prev, member_count: prev.member_count + 1 } : null)
    } catch (error) {
      console.error('Error joining community:', error)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !community) return

    try {
      // Create the post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert([{
          user_id: user.id,
          title: newPost.title,
          content: newPost.content,
          content_type: newPost.content_type,
          is_published: true
        }])
        .select()
        .single()

      if (postError) throw postError

      // Link to community
      const { error: communityError } = await supabase
        .from('community_posts')
        .insert([{
          post_id: postData.id,
          community_id: community.id,
          post_type: 'post'
        }])

      if (communityError) throw communityError

      setNewPost({ title: '', content: '', content_type: 'community_post' })
      setShowCreatePost(false)
      fetchPosts()
    } catch (error) {
      console.error('Error creating post:', error)
    }
  }

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

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Community not found</h1>
            <Link href="/communities" className="text-blue-600 hover:text-blue-700">
              ← Back to Communities
            </Link>
          </div>
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
        {/* Community Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {community.name}
              </h1>
              <p className="text-gray-600 mb-4">{community.description}</p>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <span>{community.member_count} members</span>
                <span>{community.post_count} posts</span>
                <span>Created by {community.user_profiles?.display_name}</span>
              </div>
            </div>
            <div className="ml-6">
              <span className={`px-3 py-1 text-sm rounded-full ${
                community.is_public 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {community.is_public ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
          
          {user && (
            <div className="flex gap-3">
              {!isMember ? (
                <button
                  onClick={handleJoinCommunity}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Join Community
                </button>
              ) : (
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Post
                </button>
              )}
              <Link
                href="/communities"
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Back to Communities
              </Link>
            </div>
          )}
        </div>

        {/* Create Post Modal */}
        {showCreatePost && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
              <h2 className="text-xl font-bold mb-4">Create Post</h2>
              <form onSubmit={handleCreatePost}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={6}
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                  >
                    Post
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreatePost(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Posts */}
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {post.user_profiles?.avatar_url ? (
                    <img
                      src={post.user_profiles.avatar_url}
                      alt={post.user_profiles.display_name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <span className="text-gray-500 text-sm">
                      {post.user_profiles?.display_name?.charAt(0) || '?'}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {post.user_profiles?.display_name}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                    {post.content}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <button className="hover:text-blue-600">Like</button>
                    <button className="hover:text-blue-600">Comment</button>
                    <button className="hover:text-blue-600">Share</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No posts yet</p>
            {isMember && (
              <button
                onClick={() => setShowCreatePost(true)}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create the first post
              </button>
            )}
          </div>
        )}
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  )
}
