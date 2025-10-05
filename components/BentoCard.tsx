import React from 'react';
import { Link } from 'react-router-dom';
import type { Post } from '../types';

// Extremely minimal bento-style card used across masonry grids
const BentoCard: React.FC<{ post: Post }> = ({ post }) => {
  const href = `/post/${post.id}`;
  const hasMedia = Boolean(post.imageUrl || post.videoUrl);

  return (
    <Link to={href} className="block rounded-2xl overflow-hidden bg-gray-100 dark:bg-pan-gray-dark">
      {hasMedia ? (
        post.videoUrl ? (
          <video src={post.videoUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
        ) : (
          <img src={post.imageUrl!} alt={post.title || 'Post'} className="w-full h-full object-cover" />
        )
      ) : (
        <div className="p-4">
          {post.title && <h3 className="text-sm font-semibold mb-1 truncate">{post.title}</h3>}
          <p className="text-sm text-gray-600 dark:text-pan-gray-light line-clamp-4">{post.content}</p>
        </div>
      )}
    </Link>
  );
};

export default BentoCard;


