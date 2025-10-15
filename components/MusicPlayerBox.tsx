'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Repeat, Shuffle, Heart, MoreVertical } from 'lucide-react';

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  audioUrl: string;
  coverImageUrl?: string;
  duration: number;
}

interface MusicPlayerBoxProps {
  tracks: MusicTrack[];
  boxId: string;
  boxTitle: string;
}

export default function MusicPlayerBox({ tracks, boxId, boxTitle }: MusicPlayerBoxProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      setCurrentTrackIndex(randomIndex);
    } else {
      setCurrentTrackIndex((currentTrackIndex + 1) % tracks.length);
    }
    setIsPlaying(true);
  };

  const playPrevious = () => {
    if (currentTime > 3) {
      // If more than 3 seconds in, restart current track
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    } else {
      // Go to previous track
      setCurrentTrackIndex(
        currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1
      );
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (isRepeat) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      playNext();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (tracks.length === 0) {
    return (
      <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 text-center text-white">
        <div className="text-6xl mb-4">🎵</div>
        <h3 className="text-xl font-bold mb-2">No Music Yet</h3>
        <p className="text-white/80">Save music tracks to start your playlist</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl overflow-hidden shadow-2xl">
      {/* Now Playing */}
      <div className="p-6">
        {/* Album Art */}
        <div className="aspect-square rounded-xl overflow-hidden shadow-2xl mb-6 bg-black/20">
          {currentTrack?.coverImageUrl ? (
            <img 
              src={currentTrack.coverImageUrl} 
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-8xl">🎵</div>
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2 truncate">
            {currentTrack?.title || 'No Track'}
          </h2>
          <p className="text-white/80 truncate">
            {currentTrack?.artist || 'Unknown Artist'}
            {currentTrack?.album && ` • ${currentTrack.album}`}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-lg"
          />
          <div className="flex justify-between text-sm text-white/60 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => setIsShuffle(!isShuffle)}
            className={`p-2 rounded-full transition-all ${
              isShuffle ? 'bg-white/30 text-white' : 'text-white/60 hover:text-white'
            }`}
            title="Shuffle"
          >
            <Shuffle size={20} />
          </button>

          <button
            onClick={playPrevious}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            title="Previous"
          >
            <SkipBack size={24} />
          </button>

          <button
            onClick={togglePlay}
            className="p-5 rounded-full bg-white hover:bg-white/90 text-purple-600 shadow-xl hover:scale-105 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
          </button>

          <button
            onClick={playNext}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
            title="Next"
          >
            <SkipForward size={24} />
          </button>

          <button
            onClick={() => setIsRepeat(!isRepeat)}
            className={`p-2 rounded-full transition-all ${
              isRepeat ? 'bg-white/30 text-white' : 'text-white/60 hover:text-white'
            }`}
            title="Repeat"
          >
            <Repeat size={20} />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-white/80 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              setIsMuted(false);
            }}
            className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        {/* Queue/Playlist */}
        <div className="bg-black/20 rounded-xl p-4 max-h-60 overflow-y-auto">
          <h3 className="text-sm font-semibold text-white/80 mb-3">Up Next ({tracks.length} tracks)</h3>
          <div className="space-y-2">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                onClick={() => {
                  setCurrentTrackIndex(index);
                  setIsPlaying(true);
                }}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                  index === currentTrackIndex
                    ? 'bg-white/20'
                    : 'hover:bg-white/10'
                }`}
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/20 flex-shrink-0">
                  {track.coverImageUrl ? (
                    <img src={track.coverImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🎵</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{track.title}</p>
                  <p className="text-xs text-white/60 truncate">{track.artist}</p>
                </div>
                <div className="text-xs text-white/40">
                  {formatTime(track.duration)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack?.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
}

