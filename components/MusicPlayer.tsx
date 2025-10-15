'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Heart } from 'lucide-react'

interface MusicPlayerProps {
  tracks: {
    id: string
    title: string
    artist: string
    audioUrl: string
    coverUrl?: string
  }[]
  currentTrackIndex?: number
  onTrackChange?: (index: number) => void
  onSave?: (trackId: string) => void
  savedTracks?: string[]
}

export function MusicPlayer({ 
  tracks, 
  currentTrackIndex = 0,
  onTrackChange,
  onSave,
  savedTracks = []
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentIndex, setCurrentIndex] = useState(currentTrackIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  const currentTrack = tracks[currentIndex]

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => playNext()

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentIndex])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const playNext = () => {
    const nextIndex = (currentIndex + 1) % tracks.length
    setCurrentIndex(nextIndex)
    onTrackChange?.(nextIndex)
    setIsPlaying(true)
    setTimeout(() => audioRef.current?.play(), 100)
  }

  const playPrevious = () => {
    const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1
    setCurrentIndex(prevIndex)
    onTrackChange?.(prevIndex)
    setIsPlaying(true)
    setTimeout(() => audioRef.current?.play(), 100)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    const newMuted = !isMuted
    setIsMuted(newMuted)
    audioRef.current.muted = newMuted
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!currentTrack) return null

  return (
    <div className="bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-700 dark:to-pink-700 rounded-2xl p-6 text-white">
      <audio ref={audioRef} src={currentTrack.audioUrl} preload="metadata" />

      {/* Album Art */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/20 flex-shrink-0">
          {currentTrack.coverUrl ? (
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              🎵
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate">{currentTrack.title}</h3>
          <p className="text-white/80 text-sm truncate">{currentTrack.artist}</p>
        </div>
        <button
          onClick={() => onSave?.(currentTrack.id)}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <Heart
            className="w-5 h-5"
            fill={savedTracks.includes(currentTrack.id) ? 'currentColor' : 'none'}
          />
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
          className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
        />
        <div className="flex justify-between text-xs text-white/80 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={playPrevious}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <SkipBack className="w-6 h-6" />
        </button>
        <button
          onClick={togglePlay}
          className="w-14 h-14 bg-white text-purple-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
        </button>
        <button
          onClick={playNext}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <SkipForward className="w-6 h-6" />
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMute}
          className="p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="flex-1 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
        />
      </div>

      {/* Track List */}
      {tracks.length > 1 && (
        <div className="mt-6 max-h-48 overflow-y-auto space-y-2">
          {tracks.map((track, idx) => (
            <button
              key={track.id}
              onClick={() => {
                setCurrentIndex(idx)
                onTrackChange?.(idx)
                setIsPlaying(true)
                setTimeout(() => audioRef.current?.play(), 100)
              }}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                idx === currentIndex
                  ? 'bg-white/20'
                  : 'hover:bg-white/10'
              }`}
            >
              <p className="font-medium text-sm truncate">{track.title}</p>
              <p className="text-xs text-white/70 truncate">{track.artist}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default MusicPlayer

