'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Play, Pause, Volume2, Heart, Download, Share2, MoreHorizontal, Eye, ThumbsUp, MessageCircle, Clock, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface VideoPost {
  id: string
  title: string
  content: string
  video_url: string
  thumbnail_url?: string
  duration: number
  resolution?: string
  view_count: number
  like_count: number
  comment_count: number
  is_premium: boolean
  premium_price?: number
  user: {
    id: string
    username: string
    avatar_url?: string
    full_name?: string
  }
  created_at: string
}

export default function VideoDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const [videoPost, setVideoPost] = useState<VideoPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isLiked, setIsLiked] = useState(false)
  const [showControls, setShowControls] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadVideoPost(params.id as string)
    }
  }, [params.id])

  const loadVideoPost = async (id: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        setVideoPost({
          id: data.id,
          title: data.title,
          content: data.content,
          video_url: data.video_url,
          thumbnail_url: data.thumbnail_url,
          duration: data.duration,
          resolution: data.resolution,
          view_count: data.view_count || 0,
          like_count: data.like_count || 0,
          comment_count: data.comment_count || 0,
          is_premium: data.is_premium || false,
          premium_price: data.premium_price,
          user: data.profiles,
          created_at: data.created_at
        })
      }
    } catch (err) {
      console.error('Error loading video post:', err)
      setError('Failed to load video post')
    } finally {
      setLoading(false)
    }
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    // Track view count
    if (!isPlaying) {
      incrementViewCount()
    }
  }

  const incrementViewCount = async () => {
    if (!videoPost) return
    
    try {
      await supabase.rpc('increment_view_count', { content_id: videoPost.id })
      setVideoPost(prev => prev ? { ...prev, view_count: prev.view_count + 1 } : null)
    } catch (error) {
      console.error('Error incrementing view count:', error)
    }
  }

  const toggleLike = async () => {
    if (!user || !videoPost) return
    
    try {
      if (isLiked) {
        // Remove like
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', videoPost.id)
      } else {
        // Add like
        await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: videoPost.id
          })
      }
      
      setIsLiked(!isLiked)
      setVideoPost(prev => prev ? { 
        ...prev, 
        like_count: isLiked ? prev.like_count - 1 : prev.like_count + 1 
      } : null)
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading video...</p>
        </div>
      </div>
    )
  }

  if (error || !videoPost) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Video Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {error || 'This video could not be found.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Video Player */}
      <div className="relative bg-black">
        <div className="aspect-video relative">
          <video
            src={videoPost.video_url}
            poster={videoPost.thumbnail_url}
            className="w-full h-full object-contain"
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onMouseMove={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
            controls={false}
          />
          
          {/* Custom Controls Overlay */}
          <div className={`absolute inset-0 bg-black/20 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={togglePlay}
                className="w-16 h-16 bg-white/90 hover:bg-white text-black rounded-full flex items-center justify-center transition-all hover:scale-110"
              >
                {isPlaying ? <Pause size={32} /> : <Play size={32} />}
              </button>
            </div>
            
            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center gap-4 text-white">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-1">
                    <div 
                      className="bg-white h-1 rounded-full transition-all"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Volume2 size={20} />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-20"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {/* Title and Stats */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {videoPost.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Eye size={16} />
                    <span>{videoPost.view_count.toLocaleString()} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    <span>{formatTime(videoPost.duration)}</span>
                  </div>
                  {videoPost.resolution && (
                    <span className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                      {videoPost.resolution}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-4">
                  <button
                    onClick={toggleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                      isLiked 
                        ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <ThumbsUp size={20} fill={isLiked ? 'currentColor' : 'none'} />
                    <span>{videoPost.like_count.toLocaleString()}</span>
                  </button>
                  
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <MessageCircle size={20} />
                    <span>{videoPost.comment_count.toLocaleString()}</span>
                  </button>
                  
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Share2 size={20} />
                    <span>Share</span>
                  </button>
                  
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Download size={20} />
                    <span>Download</span>
                  </button>
                </div>
                
                <button className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <MoreHorizontal size={20} />
                </button>
              </div>

              {/* Channel Info */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                    {videoPost.user.avatar_url ? (
                      <img
                        src={videoPost.user.avatar_url}
                        alt={videoPost.user.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <User size={24} className="text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {videoPost.user.full_name || videoPost.user.username}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      @{videoPost.user.username}
                    </p>
                  </div>
                </div>
                
                <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium transition-colors">
                  Subscribe
                </button>
              </div>

              {/* Description */}
              {videoPost.content && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(videoPost.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {videoPost.content}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Related Videos */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Related Videos</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-32 h-20 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center">
                    <Play size={16} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                      Related Video Title
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Channel Name • 1.2K views • 2 days ago
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-32 h-20 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center">
                    <Play size={16} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                      Another Related Video
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Another Channel • 856 views • 1 week ago
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Comments ({videoPost.comment_count})
              </h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <User size={16} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Username
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        2 hours ago
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Great video! Really enjoyed this content.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}