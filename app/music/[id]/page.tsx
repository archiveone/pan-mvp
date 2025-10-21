'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'
import { Play, Pause, Heart, Share2, Download, Music, Clock, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import AdvancedAnalyticsService from '@/services/advancedAnalyticsService'

export default function MusicDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const audioRef = useRef<HTMLAudioElement>(null)
  
  const [music, setMusic] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isSaved, setIsSaved] = useState(false)
  const sessionId = useRef(AdvancedAnalyticsService.generateSessionId())
  const streamStartTime = useRef<number>(0)

  useEffect(() => {
    if (params?.id) {
      loadMusic()
    }
  }, [params?.id])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const loadMusic = async () => {
    if (!params?.id) return
    
    try {
      const { data, error } = await supabase
        .from('music_posts')
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
      setMusic(data)

      // Track page view
      const viewSessionId = AdvancedAnalyticsService.generateSessionId()
      AdvancedAnalyticsService.trackView({
        contentId: params.id as string,
        userId: user?.id,
        sessionId: viewSessionId,
        deviceType: typeof navigator !== 'undefined' && /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      })

      // Increment play count
      await supabase.rpc('increment_music_plays', { post_id: params.id })

      // Check if saved
      if (user) {
        const { data: savedData } = await supabase
          .from('saved_music')
          .select('id')
          .eq('user_id', user.id)
          .eq('music_post_id', params.id)
          .single()
        
        setIsSaved(!!savedData)
      }
    } catch (error) {
      console.error('Error loading music:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePlay = () => {
    if (!audioRef.current || !params?.id) return

    if (isPlaying) {
      audioRef.current.pause()
      // Track stream end
      const elapsed = Math.floor((Date.now() - streamStartTime.current) / 1000)
      AdvancedAnalyticsService.updateStream(sessionId.current, elapsed, duration)
    } else {
      audioRef.current.play()
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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const toggleSave = async () => {
    if (!user || !params?.id) {
      router.push('/login')
      return
    }

    try {
      if (isSaved) {
        await supabase
          .from('saved_music')
          .delete()
          .eq('user_id', user.id)
          .eq('music_post_id', params.id)
      } else {
        await supabase
          .from('saved_music')
          .insert({
            user_id: user.id,
            music_post_id: params.id
          })
      }
      setIsSaved(!isSaved)
    } catch (error) {
      console.error('Error toggling save:', error)
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
          <Music className="w-12 h-12 text-purple-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading music...</p>
        </div>
      </div>
    )
  }

  if (!music) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Music not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-white dark:from-purple-900/20 dark:to-gray-900">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 py-12 pb-24">
        {/* Album Art */}
        <div className="mb-8">
          <div className="aspect-square max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl">
            {music.cover_image_url ? (
              <img
                src={music.cover_image_url}
                alt={music.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Music className="w-32 h-32 text-white opacity-50" />
              </div>
            )}
          </div>
        </div>

        {/* Song Info */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {music.title}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
            {music.artist}
          </p>
          {music.album && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {music.album}
            </p>
          )}
          {music.genre && (
            <span className="inline-block mt-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
              {music.genre}
            </span>
          )}
        </div>

        {/* Audio Player */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
          <audio ref={audioRef} src={music.audio_url} preload="metadata" />

          {/* Play Button */}
          <div className="flex items-center justify-center mb-6">
            <button
              onClick={togglePlay}
              className="w-16 h-16 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleSave}
              className={`p-3 rounded-full transition-colors ${
                isSaved
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Heart className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} />
            </button>
            <button className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            {music.is_saveable && (
              <a
                href={music.audio_url}
                download
                className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <Download className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>

        {/* Artist Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            {music.profiles?.avatar_url ? (
              <img
                src={music.profiles.avatar_url}
                alt={music.profiles.name}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-gray-900 dark:text-white">
                Uploaded by {music.profiles?.name || 'Unknown'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {music.play_count || 0} plays • {music.save_count || 0} saves
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

