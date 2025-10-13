import React from 'react';
import { useSavedPosts } from '../hooks/useSavedListings';
import { usePosts } from '../contexts/PostsContext';
import { Link } from 'react-router-dom';
import { Heart, MapPin, DollarSign } from 'lucide-react';

const SavedPage: React.FC = () => {
  const { posts } = usePosts();
  const { isSaved } = useSavedPosts();
  const savedPosts = posts.filter(post => isSaved(post.id));

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">Saved Items</h1>
      
      {savedPosts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {savedPosts.map(post => (
            <Link
              key={post.id}
              to={`/post/${post.id}`}
              className="group block bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              {/* Image */}
              <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
                {post.imageUrl || post.videoUrl ? (
                  post.videoUrl ? (
                    <video
                      src={post.videoUrl}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={post.imageUrl}
                      alt={post.title || post.content.substring(0, 50)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    📦
                  </div>
                )}
                
                {/* Saved indicator */}
                <div className="absolute top-2 right-2 bg-pink-500 text-white p-1.5 rounded-full shadow-lg">
                  <Heart size={14} fill="white" />
                </div>
              </div>

              {/* Content */}
              <div className="p-3">
                {/* Title */}
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {post.title || post.content.substring(0, 50)}
                </h3>

                {/* Location */}
                {post.location && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <MapPin size={12} />
                    <span className="truncate">{post.location}</span>
                  </div>
                )}

                {/* Price */}
                {post.priceInfo && (
                  <div className="flex items-center gap-1 text-sm font-bold text-gray-900 dark:text-gray-100">
                    <DollarSign size={14} />
                    <span>{post.priceInfo.amount} {post.priceInfo.unit}</span>
                  </div>
                )}

                {/* Post Type Badge */}
                <div className="mt-2">
                  <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                    {post.postType}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="mb-4">
            <Heart size={48} className="mx-auto text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">Nothing saved yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Start saving posts you like!</p>
        </div>
      )}
    </div>
  );
};

export default SavedPage;
