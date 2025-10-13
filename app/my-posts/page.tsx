'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'
import { Upload, ArrowLeft, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function MyPostsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    loadUserPosts()
  }, [user, router])

  const loadUserPosts = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setUserPosts(data || [])
    } catch (error) {
      console.error('Error loading user posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user?.id) // Extra safety check

      if (error) throw error

      setUserPosts(prev => prev.filter(post => post.id !== postId))
      
      alert('Post deleted successfully')
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/hub')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Posts</h1>
              <p className="text-gray-600">{userPosts.length} posts</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 animate-pulse"></div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && userPosts.length === 0 && (
          <div className="text-center py-20">
            <Upload size={64} className="mx-auto text-gray-300 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No posts yet</h2>
            <p className="text-gray-600 mb-6">Create your first post to get started</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gradient-to-r from-lime-400 to-lime-300 text-black rounded-lg hover:brightness-95 transition-all"
            >
              Create Post
            </button>
          </div>
        )}

        {/* User Posts Grid */}
        {!loading && userPosts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {userPosts.map((post) => (
              <div key={post.id} className="group relative">
                <Link href={`/listing/${post.id}`}>
                  <div className="aspect-square overflow-hidden bg-gray-200 relative">
                    {post.media_url ? (
                      <img
                        src={post.media_url}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                        📦
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Link
                        href={`/listing/${post.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-gradient-to-r from-lime-400 to-lime-300 text-black rounded-full hover:brightness-95 transition-all shadow-lg"
                        title="Edit post"
                      >
                        <Edit size={14} />
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleDelete(post.id)
                        }}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        title="Delete post"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-28 bg-black/85 backdrop-blur-sm text-white p-3 transition-all duration-300 flex flex-col opacity-0 group-hover:opacity-100">
                      <h3 className="font-semibold text-sm line-clamp-1 mb-2">{post.title}</h3>
                      {post.price_amount && (
                        <p className="text-green-400 text-xs font-semibold">
                          {post.price_amount} {post.currency || 'EUR'}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-auto text-xs text-gray-400">
                        <span>{post.content_type}</span>
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
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

