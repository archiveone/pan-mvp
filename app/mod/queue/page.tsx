'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'
import { Shield, Clock, CheckCircle, XCircle, AlertTriangle, Eye, Calendar } from 'lucide-react'

interface QueueItem {
  id: string
  title: string
  content: string
  created_at: string
  safety_checked: boolean
  is_safety_approved: boolean
  safety_score?: number
  safety_violations?: string[]
  media_url?: string
  moderation_status?: string
}

export default function ModQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'flagged'>('all')

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50) // Limit to recent posts
    
    if (!error) {
      setItems(data as any)
      console.log('Loaded posts for moderation:', data?.length, 'items')
    } else {
      console.error('Error loading posts:', error)
    }
    setLoading(false)
  }

  // Refresh queue when returning from item review
  useEffect(() => {
    const handleFocus = () => {
      load()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const getStatusIcon = (item: QueueItem) => {
    const status = item.moderation_status || 'pending'
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />
      case 'age_restricted': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default: return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusText = (item: QueueItem) => {
    const status = item.moderation_status || 'pending'
    switch (status) {
      case 'approved': return 'Approved'
      case 'rejected': return 'Blocked'
      case 'age_restricted': return 'Age Restricted'
      default: return 'Pending Review'
    }
  }

  const getStatusColor = (item: QueueItem) => {
    const status = item.moderation_status || 'pending'
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'age_restricted': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const filteredItems = items.filter(item => {
    const status = item.moderation_status || 'pending'
    if (filter === 'pending') return status === 'pending'
    if (filter === 'flagged') return status === 'rejected' || status === 'age_restricted'
    return true
  })

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <AppHeader />
      
      <main className="max-w-6xl mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Moderation Queue</h1>
              <p className="text-gray-600 dark:text-gray-400">Review and moderate content for safety</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                    {items.filter(i => !i.safety_checked).length}
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">Pending Review</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-800 dark:text-red-200">
                    {items.filter(i => i.safety_checked && !i.is_safety_approved).length}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">Flagged Content</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {items.filter(i => i.is_safety_approved).length}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Approved</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'pending' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Pending Review
            </button>
            <button
              onClick={() => setFilter('flagged')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'flagged' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Flagged Content
            </button>
          </div>
        </div>

        {/* Queue Items */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No items to review</h3>
            <p className="text-gray-600 dark:text-gray-400">All content has been reviewed and moderated.</p>
          </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <Link 
                key={item.id} 
                href={`/mod/item/${item.id}`} 
                className="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                {/* Image */}
                {item.media_url && (
                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <img 
                      src={item.media_url} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                )}
                
                <div className="p-4">
                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    {getStatusIcon(item)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item)}`}>
                      {getStatusText(item)}
                    </span>
                    {item.safety_score !== undefined && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Score: {item.safety_score}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                    {item.title || 'Untitled'}
                  </h3>

                  {/* Content Preview */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                    {item.content}
                  </p>

                  {/* Violations */}
                  {item.safety_violations && item.safety_violations.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Detected Issues:</div>
                      <div className="flex flex-wrap gap-1">
                        {item.safety_violations.slice(0, 3).map((violation, idx) => (
                          <span key={idx} className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                            {violation}
                          </span>
                        ))}
                        {item.safety_violations.length > 3 && (
                          <span className="text-xs text-gray-500">+{item.safety_violations.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1 text-blue-600">
                      <Eye className="w-3 h-3" />
                      Review
                    </div>
                  </div>
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


