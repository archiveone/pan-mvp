import React from 'react';
import { useParams, Link } from 'react-router-dom';
import PostCard from '../components/PostCard';
import { ArrowLeft } from 'lucide-react';
import { usePosts } from '../contexts/PostsContext';

const CommunityFeedPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { posts, communities } = usePosts();
  const community = communities.find((c) => c.id === id);
  // FIX: Changed communityId to parentId to correctly filter posts belonging to a community.
  const communityPosts = posts.filter(p => p.parentId === id).sort((a,b) => b.id.localeCompare(a.id));

  if (!community) {
    return (
      <div className="container mx-auto px-4 py-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Community not found</h2>
        <Link to="/community" className="text-pan-red hover:underline">Go back to communities</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Link to={`/community/${id}`} className="p-2 rounded-full hover:bg-gray-100 mr-2">
          <ArrowLeft size={24} />
        </Link>
        {/* FIX: Use `title` property which exists on Post type. */}
        <h1 className="text-2xl font-bold">{community.title} Feed</h1>
      </div>

      <div className="space-y-4">
        {communityPosts.length > 0 ? (
          communityPosts.map(post => <PostCard key={post.id} post={post} hideCommunityLink />)
        ) : (
          <div className="text-center py-10 text-gray-500">
            <h2 className="text-xl font-semibold mb-2">No posts yet!</h2>
            {/* FIX: Use `title` property which exists on Post type. */}
            <p>Be the first to share something in the {community.title} community.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityFeedPage;
