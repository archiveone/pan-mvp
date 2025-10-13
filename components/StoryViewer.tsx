import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Send, MoreVertical } from 'lucide-react';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
}

interface UserStories {
  user_id: string;
  username: string;
  avatar_url?: string;
  stories: Story[];
}

interface StoryViewerProps {
  isOpen: boolean;
  userStories: UserStories;
  onClose: () => void;
  onNext: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ isOpen, userStories, onClose, onNext }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentStory = userStories.stories[currentIndex];
  const duration = currentStory?.media_type === 'video' ? 15000 : 5000; // 15s for video, 5s for image

  useEffect(() => {
    if (!isPaused && isOpen) {
      const startTime = Date.now();
      
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = (elapsed / duration) * 100;
        
        if (newProgress >= 100) {
          handleNext();
        } else {
          setProgress(newProgress);
        }
      }, 16); // ~60fps

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [currentIndex, isPaused, isOpen, duration]);

  const handleNext = () => {
    if (currentIndex < userStories.stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      // End of stories, go to next user or close
      onNext();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleMouseDown = () => {
    setIsPaused(true);
  };

  const handleMouseUp = () => {
    setIsPaused(false);
  };

  const handleReply = () => {
    if (replyText.trim()) {
      // TODO: Send reply message
      console.log('Reply:', replyText);
      setReplyText('');
      setShowReplyInput(false);
    }
  };

  if (!isOpen || !currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        {/* Progress Bars */}
        <div className="flex gap-1 mb-4">
          {userStories.stories.map((_, index) => (
            <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* User Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={userStories.avatar_url || '/default-avatar.png'}
              alt={userStories.username}
              className="w-10 h-10 rounded-full border-2 border-white"
            />
            <div>
              <p className="text-white font-semibold">{userStories.username}</p>
              <p className="text-white/70 text-xs">
                {new Date(currentStory.created_at).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <MoreVertical size={20} />
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Story Content */}
      <div className="relative w-full max-w-lg h-full flex items-center justify-center">
        {/* Navigation Areas */}
        <button
          onClick={handlePrevious}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10 flex items-center justify-start pl-4"
        >
          {currentIndex > 0 && (
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
              <ChevronLeft size={24} />
            </div>
          )}
        </button>

        {currentStory.media_type === 'image' ? (
          <img
            src={currentStory.media_url}
            alt="Story"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            src={currentStory.media_url}
            className="max-w-full max-h-full object-contain"
            autoPlay
            muted
            playsInline
            onEnded={handleNext}
          />
        )}

        <button
          onClick={handleNext}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchEnd={handleMouseUp}
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10 flex items-center justify-end pr-4"
        >
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity">
            <ChevronRight size={24} />
          </div>
        </button>
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
        {showReplyInput ? (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleReply()}
              placeholder={`Reply to ${userStories.username}...`}
              className="flex-1 px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white placeholder-white/60 focus:outline-none focus:border-white/50"
              autoFocus
            />
            <button
              onClick={handleReply}
              className="w-12 h-12 bg-gradient-to-r from-lime-400 to-lime-300 rounded-full flex items-center justify-center hover:brightness-95 transition-all"
            >
              <Send size={20} className="text-black" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReplyInput(true)}
              className="flex-1 px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full text-white text-left hover:bg-white/30 transition-colors"
            >
              Send message...
            </button>
            <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
              <Heart size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;

