import React from 'react';
import { useSavedPosts } from '../hooks/useSavedListings';
import { usePosts } from '../contexts/PostsContext';
import BentoCard from '../components/BentoCard';

const SavedPage: React.FC = () => {
  const { posts } = usePosts();
  const { isSaved } = useSavedPosts();
  const savedPosts = posts.filter(post => isSaved(post.id));

  return (
    <div className="container mx-auto px-4 py-6">
      {savedPosts.length > 0 ? (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4">
          {savedPosts.map(post => (
            <div key={post.id} className="mb-4 break-inside-avoid">
              <BentoCard post={post} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-pan-gray">Nothing saved yet.</div>
      )}
    </div>
  );
};

export default SavedPage;
