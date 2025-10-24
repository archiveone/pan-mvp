'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Play, Pause, Volume2, Heart, Download, Share2, MoreHorizontal, Clock, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AudioPost {
  id: string
  title: string
  content: string
  audio_url: string
  cover_image_url?: string
  duration: number
  play_count: number
  save_count: number
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

export default function AudioDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const [audioPost, setAudioPost] = useState<AudioPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isSaved, setIsSaved] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadAudioPost(params.id as string)
    }
  }, [params.id])

  const loadAudioPost = async (id: string) => {
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
        setAudioPost({
          id: data.id,
          title: data.title,
          content: data.content,
          audio_url: data.audio_url,
          cover_image_url: data.cover_image_url,
          duration: data.duration,
          play_count: data.play_count || 0,
          save_count: data.save_count || 0,
          like_count: data.like_count || 0,
          comment_count: data.comment_count || 0,
          is_premium: data.is_premium || false,
          premium_price: data.premium_price,
          user: data.profiles,
          created_at: data.created_at
        })
      }
    } catch (err) {
      console.error('Error loading audio post:', err)
      setError('Failed to load audio post')
    } finally {
      setLoading(false)
    }
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    // Track play count
    if (!isPlaying) {
      incrementPlayCount()
    }
  }

  const incrementPlayCount = async () => {
    if (!audioPost) return
    
    try {
      await supabase.rpc('increment_play_count', { content_id: audioPost.id })
      setAudioPost(prev => prev ? { ...prev, play_count: prev.play_count + 1 } : null)
    } catch (error) {
      console.error('Error incrementing play count:', error)
    }
  }

  const toggleSave = async () => {
    if (!user || !audioPost) return
    
    try {
      if (isSaved) {
        // Remove from saved
        await supabase
          .from('saved_posts')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', audioPost.id)
      } else {
        // Add to saved
        await supabase
          .from('saved_posts')
          .insert({
            user_id: user.id,
            post_id: audioPost.id
          })
      }
      
      setIsSaved(!isSaved)
      setAudioPost(prev => prev ? { 
        ...prev, 
        save_count: isSaved ? prev.save_count - 1 : prev.save_count + 1 
      } : null)
    } catch (error) {
      console.error('Error toggling save:', error)
    }
  }

  const toggleLike = async () => {
    if (!user || !audioPost) return
    
    try {
      if (isLiked) {
        // Remove like
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', audioPost.id)
      } else {
        // Add like
        await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: audioPost.id
          })
      }
      
      setIsLiked(!isLiked)
      setAudioPost(prev => prev ? { 
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading audio...</p>
        </div>
      </div>
    )
  }

  if (error || !audioPost) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎵</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Audio Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {error || 'This audio post could not be found.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                {audioPost.title}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <User size={14} />
                <span>{audioPost.user.username}</span>
                <span>•</span>
                <Clock size={14} />
                <span>{formatTime(audioPost.duration)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleLike}
                className={`p-2 rounded-full transition-colors ${
                  isLiked 
                    ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
              
              <button
                onClick={toggleSave}
                className={`p-2 rounded-full transition-colors ${
                  isSaved 
                    ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Download size={20} fill={isSaved ? 'currentColor' : 'none'} />
              </button>
              
              <button className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Share2 size={20} />
              </button>
              
              <button className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Audio Player */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
              {/* Cover Image */}
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-xl mb-6 overflow-hidden">
                {audioPost.cover_image_url ? (
                  <img
                    src={audioPost.cover_image_url}
                    alt={audioPost.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-6xl">🎵</div>
                  </div>
                )}
              </div>

              {/* Audio Controls */}
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={togglePlay}
                      className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <Volume2 size={16} className="text-gray-600 dark:text-gray-400" />
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

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{audioPost.play_count.toLocaleString()} plays</span>
                    <span>{audioPost.save_count.toLocaleString()} saves</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                  {audioPost.user.avatar_url ? (
                    <img
                      src={audioPost.user.avatar_url}
                      alt={audioPost.user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User size={24} className="text-gray-600 dark:text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {audioPost.user.full_name || audioPost.user.username}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    @{audioPost.user.username}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Plays</span>
                  <span className="font-medium">{audioPost.play_count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Saves</span>
                  <span className="font-medium">{audioPost.save_count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Likes</span>
                  <span className="font-medium">{audioPost.like_count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Comments</span>
                  <span className="font-medium">{audioPost.comment_count.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {audioPost.content && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {audioPost.content}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        src={audioPost.audio_url}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  )
}
