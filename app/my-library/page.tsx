'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'
import { Music, Video, FileText, Download, Play, Heart } from 'lucide-react'
import Link from 'next/link'

interface LibraryItem {
  id: string
  content_id: string
  content_type: string
  content_title: string
  cover_image: string
  creator_name: string
  creator_username: string
  purchased_at: string
  can_download: boolean
  can_stream: boolean
  price_paid: number
  currency: string
  download_url: string
  streaming_url: string
  is_favorite: boolean
}

export default function MyLibraryPage() {
  const { user } = useAuth()
  const [library, setLibrary] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'music' | 'video' | 'document'>('all')

  useEffect(() => {
    if (user) {
      loadLibrary()
    }
  }, [user, filter])

  const loadLibrary = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('my_library')
        .select('*')
        .eq('user_id', user?.id)

      if (filter !== 'all') {
        query = query.eq('content_type', filter)
      }

      const { data, error } = await query.order('purchased_at', { ascending: false })

      if (error) throw error
      setLibrary(data || [])
    } catch (error) {
      console.error('Error loading library:', error)
    } finally {
      setLoading(false)
    }
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'music':
        return <Music className="text-purple-500" size={24} />
      case 'video':
      case 'movie':
        return <Video className="text-red-500" size={24} />
      case 'document':
      case 'ebook':
        return <FileText className="text-blue-500" size={24} />
      default:
        return <FileText className="text-gray-500" size={24} />
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Sign in to view your library</h1>
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">My Library</h1>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['all', 'music', 'video', 'document'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                filter === f
                  ? 'bg-lime-500 text-black'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? 'All Content' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Library Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : library.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your library is empty</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Purchase music, videos, or digital content to build your library!
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-lime-500 text-black rounded-lg font-medium hover:bg-lime-400"
            >
              Browse Content
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {library.map((item) => (
              <Link
                key={item.id}
                href={`/${item.content_type}/${item.content_id}`}
                className="group relative aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                {/* Cover */}
                <div className="absolute inset-0">
                  {item.cover_image ? (
                    <img
                      src={item.cover_image}
                      alt={item.content_title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                      {getContentIcon(item.content_type)}
                    </div>
                  )}
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-semibold text-sm line-clamp-2 mb-1">
                      {item.content_title}
                    </p>
                    <p className="text-white/80 text-xs">
                      {item.creator_name}
                    </p>
                  </div>
                  
                  {/* Play/Download Button */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-12 h-12 bg-lime-500 rounded-full flex items-center justify-center">
                      {item.can_stream ? (
                        <Play size={24} className="text-black ml-1" />
                      ) : (
                        <Download size={24} className="text-black" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Favorite Badge */}
                {item.is_favorite && (
                  <div className="absolute top-2 right-2 z-10 bg-red-500 rounded-full p-1.5">
                    <Heart size={14} className="text-white fill-current" />
                  </div>
                )}

                {/* Type Badge */}
                <div className="absolute top-2 left-2 z-10 bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                  {item.content_type}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  )
}

