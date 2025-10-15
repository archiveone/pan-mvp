'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, List } from 'lucide-react';

interface VideoTrack {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  viewCount?: number;
}

interface VideoPlaylistBoxProps {
  videos: VideoTrack[];
  boxId: string;
  boxTitle: string;
}

export default function VideoPlaylistBox({ videos, boxId, boxTitle }: VideoPlaylistBoxProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentVideo = videos[currentVideoIndex];

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    setCurrentVideoIndex((currentVideoIndex + 1) % videos.length);
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleEnded = () => {
    playNext();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (videos.length === 0) {
    return (
      <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl p-8 text-center text-white">
        <div className="text-6xl mb-4">🎬</div>
        <h3 className="text-xl font-bold mb-2">No Videos Yet</h3>
        <p className="text-white/80">Save videos to start your playlist</p>
      </div>
    );
  }

  return (
    <div className="bg-black rounded-2xl overflow-hidden shadow-2xl">
      {/* Video Player */}
      <div className="relative aspect-video bg-black group">
        <video
          ref={videoRef}
          src={currentVideo?.videoUrl}
          poster={currentVideo?.thumbnailUrl}
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
        />

        {/* Play Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <button
              onClick={togglePlay}
              className="w-20 h-20 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-2xl transition-all hover:scale-110"
            >
              <Play size={32} className="text-black ml-1" />
            </button>
          </div>
        )}

        {/* Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Progress Bar */}
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer mb-3
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:cursor-pointer"
          />

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="p-2 rounded-full hover:bg-white/20 text-white transition-all"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <button
                onClick={playNext}
                className="p-2 rounded-full hover:bg-white/20 text-white transition-all"
              >
                <SkipForward size={20} />
              </button>

              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1 text-white/80 hover:text-white"
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
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
                  className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-2
                    [&::-webkit-slider-thumb]:h-2
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:cursor-pointer"
                />
              </div>

              <span className="text-sm text-white/60 ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPlaylist(!showPlaylist)}
                className="p-2 rounded-full hover:bg-white/20 text-white transition-all"
                title="Playlist"
              >
                <List size={20} />
              </button>
              
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full hover:bg-white/20 text-white transition-all"
                title="Fullscreen"
              >
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Playlist */}
      {showPlaylist && (
        <div className="bg-gray-900 p-4 max-h-80 overflow-y-auto">
          <h3 className="text-sm font-semibold text-white/80 mb-3">Playlist ({videos.length} videos)</h3>
          <div className="space-y-2">
            {videos.map((video, index) => (
              <div
                key={video.id}
                onClick={() => {
                  setCurrentVideoIndex(index);
                  setIsPlaying(true);
                }}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                  index === currentVideoIndex
                    ? 'bg-white/20'
                    : 'hover:bg-white/10'
                }`}
              >
                <div className="w-16 h-10 rounded overflow-hidden bg-black/20 flex-shrink-0">
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">▶️</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{video.title}</p>
                  {video.description && (
                    <p className="text-xs text-white/60 truncate">{video.description}</p>
                  )}
                </div>
                <div className="text-xs text-white/40">
                  {formatTime(video.duration)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden Audio Element for volume control */}
      <audio ref={audioRef as any} style={{ display: 'none' }} />
    </div>
  );
}

