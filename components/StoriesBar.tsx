import React, { useState, useEffect } from 'react';
import { Plus, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import StoryCreator from './StoryCreator';
import StoryViewer from './StoryViewer';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url?: string;
  created_at: string;
  viewed: boolean;
  profiles?: {
    name?: string;
    username?: string;
    avatar_url?: string;
  };
}

interface UserStories {
  user_id: string;
  username: string;
  avatar_url?: string;
  stories: Story[];
  hasUnviewed: boolean;
}

const StoriesBar: React.FC = () => {
  const { user } = useAuth();
  const [showCreator, setShowCreator] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedUserStories, setSelectedUserStories] = useState<UserStories | null>(null);
  const [userStories, setUserStories] = useState<UserStories[]>([]);
  const [myStories, setMyStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStories();
    }
  }, [user]);

  const loadStories = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      // Dynamic import to avoid circular dependencies
      const { StoriesService } = await import('../services/storiesService');
      
      // Get stories from followed users only
      const result = await StoriesService.getFollowedUsersStories(user.id);
      
      if (result.success && result.data) {
        setUserStories(result.data);
      }
      
      // Get my own stories
      const myStoriesResult = await StoriesService.getMyStories(user.id);
      if (myStoriesResult.success && myStoriesResult.data) {
        setMyStories(myStoriesResult.data);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStory = (stories: UserStories) => {
    setSelectedUserStories(stories);
    setShowViewer(true);
  };

  const handleCreateStory = () => {
    setShowCreator(true);
  };

  const handleStoryCreated = (story: Story) => {
    setMyStories([...myStories, story]);
    setShowCreator(false);
    loadStories(); // Reload to show new story
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex gap-6 overflow-x-auto scrollbar-hide">
            {/* Add Your Story */}
            <button
              onClick={handleCreateStory}
              className="flex-shrink-0 flex flex-col items-center gap-2 group"
            >
              <div className="relative p-1 overflow-visible">
                {myStories.length > 0 ? (
                  // User has stories - show their avatar
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[2px] group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 p-[2px]">
                      <img
                        src={user?.user_metadata?.avatar_url || '/default-avatar.png'}
                        alt="Your story"
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  // No stories - show add button
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-400 to-lime-300 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <Plus size={32} className="text-white" />
                  </div>
                )}
                {/* Add icon overlay */}
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <Camera size={14} className="text-white" />
                </div>
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[64px] truncate text-center">
                {myStories.length > 0 ? 'Your Story' : 'Add Story'}
              </span>
            </button>

            {/* Other Users' Stories */}
            {userStories.map((userStory) => (
              <button
                key={userStory.user_id}
                onClick={() => handleViewStory(userStory)}
                className="flex-shrink-0 flex flex-col items-center gap-2 group"
              >
                <div className="relative p-1 overflow-visible">
                  <div className={`w-16 h-16 rounded-full ${
                    userStory.hasUnviewed
                      ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600'
                      : 'bg-gray-300 dark:bg-gray-700'
                  } p-[2px] group-hover:scale-110 transition-all duration-300`}>
                    <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 p-[2px]">
                      <img
                        src={userStory.avatar_url || '/default-avatar.png'}
                        alt={userStory.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[64px] truncate text-center">
                  {userStory.username}
                </span>
              </button>
            ))}

            {/* Placeholder Circles - Fading effect (4 circles) */}
            {!loading && (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={`placeholder-${i}`} 
                    className="flex-shrink-0 flex flex-col items-center gap-2"
                    style={{
                      opacity: 0.7 - (i * 0.15)
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                ))}
              </>
            )}

            {/* Loading Skeletons */}
            {loading && (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i} 
                    className="flex-shrink-0 flex flex-col items-center gap-2"
                    style={{
                      opacity: 0.7 - (i * 0.15)
                    }}
                  >
                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    <div className="w-12 h-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Story Creator Modal */}
      {showCreator && (
        <StoryCreator
          isOpen={showCreator}
          onClose={() => setShowCreator(false)}
          onStoryCreated={handleStoryCreated}
        />
      )}

      {/* Story Viewer Modal */}
      {showViewer && selectedUserStories && (
        <StoryViewer
          isOpen={showViewer}
          userStories={selectedUserStories}
          onClose={() => {
            setShowViewer(false);
            setSelectedUserStories(null);
          }}
          onNext={() => {
            // TODO: Load next user's stories
          }}
        />
      )}
    </>
  );
};

export default StoriesBar;

