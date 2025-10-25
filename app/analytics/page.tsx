'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageCircle, 
  Download, 
  Play, 
  Share2, 
  Calendar,
  Filter,
  Download as DownloadIcon,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PostAnalytics {
  id: string
  title: string
  content_type: string
  media_type: string
  created_at: string
  view_count: number
  like_count: number
  comment_count: number
  share_count: number
  download_count: number
  play_count: number
  save_count: number
  is_premium: boolean
  premium_price?: number
  user: {
    username: string
    avatar_url?: string
  }
}

interface AnalyticsSummary {
  total_posts: number
  total_views: number
  total_likes: number
  total_comments: number
  total_shares: number
  total_downloads: number
  total_plays: number
  total_saves: number
  average_engagement: number
  top_performing_post: PostAnalytics | null
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<PostAnalytics[]>([])
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState('30d')
  const [contentType, setContentType] = useState('all')
  const [sortBy, setSortBy] = useState('views')

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user, timeRange, contentType, sortBy])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Calculate date range
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Build query
      let query = supabase
        .from('posts')
        .select(`
          id,
          title,
          content_type,
          media_type,
          created_at,
          view_count,
          like_count,
          comment_count,
          share_count,
          download_count,
          play_count,
          save_count,
          is_premium,
          premium_price,
          profiles!posts_user_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('user_id', user?.id)
        .gte('created_at', startDate.toISOString())
        .order(sortBy === 'views' ? 'view_count' : 
               sortBy === 'likes' ? 'like_count' : 
               sortBy === 'comments' ? 'comment_count' : 
               sortBy === 'downloads' ? 'download_count' : 
               sortBy === 'plays' ? 'play_count' : 'created_at', 
               { ascending: false })

      // Filter by content type
      if (contentType !== 'all') {
        query = query.eq('content_type', contentType)
      }

      const { data, error } = await query

      if (error) throw error

      if (data) {
        setAnalytics(data as PostAnalytics[])
        calculateSummary(data as PostAnalytics[])
      }
    } catch (err) {
      console.error('Error loading analytics:', err)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = (posts: PostAnalytics[]) => {
    const total_posts = posts.length
    const total_views = posts.reduce((sum, post) => sum + (post.view_count || 0), 0)
    const total_likes = posts.reduce((sum, post) => sum + (post.like_count || 0), 0)
    const total_comments = posts.reduce((sum, post) => sum + (post.comment_count || 0), 0)
    const total_shares = posts.reduce((sum, post) => sum + (post.share_count || 0), 0)
    const total_downloads = posts.reduce((sum, post) => sum + (post.download_count || 0), 0)
    const total_plays = posts.reduce((sum, post) => sum + (post.play_count || 0), 0)
    const total_saves = posts.reduce((sum, post) => sum + (post.save_count || 0), 0)
    
    const average_engagement = total_posts > 0 ? 
      (total_views + total_likes + total_comments + total_shares + total_downloads + total_plays + total_saves) / total_posts : 0

    const top_performing_post = posts.length > 0 ? posts[0] : null

    setSummary({
      total_posts,
      total_views,
      total_likes,
      total_comments,
      total_shares,
      total_downloads,
      total_plays,
      total_saves,
      average_engagement,
      top_performing_post
    })
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'music': return '🎵'
      case 'video': return '🎬'
      case 'document': return '📄'
      case 'listing': return '🛒'
      case 'event': return '📅'
      default: return '📝'
    }
  }

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'music': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'video': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'document': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'listing': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'event': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 size={24} className="text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Content Analytics
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={loadAnalytics}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCw size={20} />
              </button>
              
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
                <DownloadIcon size={20} />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
          </div>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <select
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Content</option>
            <option value="post">Posts</option>
            <option value="music">Music</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
            <option value="listing">Listings</option>
            <option value="event">Events</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="views">Sort by Views</option>
            <option value="likes">Sort by Likes</option>
            <option value="comments">Sort by Comments</option>
            <option value="downloads">Sort by Downloads</option>
            <option value="plays">Sort by Plays</option>
            <option value="created_at">Sort by Date</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <BarChart3 size={20} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Posts</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(summary.total_posts)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Eye size={20} className="text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(summary.total_views)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <Heart size={20} className="text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Likes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(summary.total_likes)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Engagement</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatNumber(summary.average_engagement)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Table */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Post Performance
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Likes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Comments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Downloads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Plays
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {analytics.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-lg">{getContentTypeIcon(post.content_type)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                            {post.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            by {post.user.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getContentTypeColor(post.content_type)}`}>
                        {post.content_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {formatNumber(post.view_count || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {formatNumber(post.like_count || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {formatNumber(post.comment_count || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {formatNumber(post.download_count || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {formatNumber(post.play_count || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <BarChart3 size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">
                  Analytics Error
                </h3>
                <p className="text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && analytics.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Analytics Data
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You haven't created any content yet, or there's no data for the selected time range.
            </p>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/create'
                }
              }}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Create Content
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
