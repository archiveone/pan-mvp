'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'
import { Play, Pause, Volume2, VolumeX, Maximize, Heart, Share2, Download, Eye, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import AdvancedAnalyticsService from '@/services/advancedAnalyticsService'

export default function VideoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [video, setVideo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const sessionId = useRef(AdvancedAnalyticsService.generateSessionId())
  const streamStartTime = useRef<number>(0)

  useEffect(() => {
    loadVideo()
  }, [params.id])

  const loadVideo = async () => {
    try {
      const { data, error } = await supabase
        .from('video_posts')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error
      setVideo(data)

      // Track page view
      const viewSessionId = AdvancedAnalyticsService.generateSessionId()
      AdvancedAnalyticsService.trackView({
        contentId: params.id as string,
        userId: user?.id,
        sessionId: viewSessionId,
        deviceType: typeof navigator !== 'undefined' && /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      })

      // Increment view count
      await supabase.rpc('increment_video_views', { post_id: params.id })
    } catch (error) {
      console.error('Error loading video:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePlay = () => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
      // Track stream end
      const elapsed = Math.floor((Date.now() - streamStartTime.current) / 1000)
      AdvancedAnalyticsService.updateStream(sessionId.current, elapsed, duration)
    } else {
      videoRef.current.play()
      // Track stream start
      streamStartTime.current = Date.now()
      AdvancedAnalyticsService.startStream(
        params.id as string,
        user?.id,
        sessionId.current,
        duration
      )
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = () => {
    if (!videoRef.current) return
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen()
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
          <Play className="w-12 h-12 text-red-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading video...</p>
        </div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Video not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-0 sm:px-4 py-0 sm:py-8 pb-24">
        {/* Video Player */}
        <div className="relative aspect-video bg-black mb-4 sm:mb-6 sm:rounded-2xl overflow-hidden">
          <video
            ref={videoRef}
            src={video.video_url}
            poster={video.thumbnail_url}
            className="w-full h-full"
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
          />

          {/* Video Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(e) => {
                const newTime = parseFloat(e.target.value)
                if (videoRef.current) {
                  videoRef.current.currentTime = newTime
                }
              }}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer mb-3 accent-red-500"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-red-500 transition-colors"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>

                {/* Volume */}
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-red-500 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>

                {/* Time */}
                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-red-500 transition-colors"
              >
                <Maximize className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Video Info */}
        <div className="bg-white dark:bg-gray-900 px-4 sm:px-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {video.title}
          </h1>

          {video.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {video.description}
            </p>
          )}

          {/* Stats & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{video.view_count || 0} views</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(video.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Like
              </button>
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </button>
              {video.is_downloadable && (
                <a
                  href={video.video_url}
                  download
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              )}
            </div>
          </div>

          {/* Creator Info */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              {video.profiles?.avatar_url ? (
                <img src={video.profiles.avatar_url} alt={video.profiles.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  👤
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {video.profiles?.name || 'Unknown'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{video.profiles?.username || 'user'}
              </p>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  )
}

