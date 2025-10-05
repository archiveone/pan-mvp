import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Post } from '../types';
import { Heart } from 'lucide-react';

const PostGridCard: React.FC<{ post: Post }> = ({ post }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);

  const handleLikeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(newLikedState ? likeCount + 1 : likeCount - 1);
  };

  // Variant for posts with an image background
  if (post.imageUrl) {
    return (
      <Link 
        to={`/profile`} // Assuming posts link to profile for now
        className="group relative aspect-square rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
      >
        <img 
            src={post.imageUrl} 
            alt="Post" 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
        />
        
        {/* White strip hover effect */}
        <div className="absolute inset-x-0 bottom-0 bg-white p-3 transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
          <div className="flex items-center gap-2">
            <img src={post.user.avatarUrl} alt={post.user.name} className="w-8 h-8 rounded-full" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{post.user.name}</p>
              <p className="text-xs text-gray-500 line-clamp-1">{post.content}</p>
            </div>
            <button 
              onClick={handleLikeClick}
              className={`flex-shrink-0 flex items-center gap-1.5 p-1.5 rounded-lg transition-colors text-xs ${isLiked ? 'text-pan-red bg-red-50' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
              aria-label={isLiked ? 'Unlike post' : 'Like post'}
            >
              <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
              <span className="font-semibold">{likeCount}</span>
            </button>
          </div>
        </div>
      </Link>
    );
  }

  // Variant for text-only posts
  return (
    <Link 
        to={`/profile`} 
        className="group relative aspect-square rounded-2xl overflow-hidden shadow-md p-4 flex flex-col justify-between bg-white hover:shadow-xl hover:scale-105 transition-all duration-300"
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <img src={post.user.avatarUrl} alt={post.user.name} className="w-8 h-8 rounded-full" />
          <span className="font-semibold text-sm text-gray-800 truncate">{post.user.name}</span>
        </div>
        <p className="text-gray-600 text-sm line-clamp-5">{post.content}</p>
      </div>
       <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
            <span>{post.timestamp}</span>
            <button 
                onClick={handleLikeClick}
                className={`flex items-center gap-1.5 transition-colors ${isLiked ? 'text-pan-red' : 'text-gray-500 hover:text-pan-red'}`}
                aria-label={isLiked ? 'Unlike post' : 'Like post'}
            >
                <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
                <span className="font-medium">{likeCount} Likes</span>
            </button>
       </div>
    </Link>
  );
};

export default PostGridCard;