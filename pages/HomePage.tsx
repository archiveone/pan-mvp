import React from 'react';
import BentoCard from '../components/BentoCard';
import StoriesBar from '../components/StoriesBar';
import { usePersonalizedFeed } from '../hooks/usePersonalizedFeed';

// Minimal home: stories at top, then pure masonry (bento boxes)
const HomePage: React.FC = () => {
  const { recommendedPosts } = usePersonalizedFeed();

  return (
    <>
      {/* Stories at the top */}
      <StoriesBar />
      
      {/* Main feed */}
      <div className="container mx-auto px-4 py-6">
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4">
          {recommendedPosts.filter(p => !p.parentId).map(post => (
            <div key={post.id} className="mb-4 break-inside-avoid">
              <BentoCard post={post} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default HomePage;