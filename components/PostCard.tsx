import React from 'react';
import { Link } from 'react-router-dom';
import type { Post, PriceInfo } from '../types';
import { Users, Tag, Calendar, MapPin, PlayCircle, FileText, Bookmark, ShieldAlert } from 'lucide-react';
import { useSavedPosts } from '../hooks/useSavedListings';
import { formatTimeAgo } from '../services/time';

const PostTypeIndicator: React.FC<{ post: Post }> = ({ post }) => {
    // Improved styling for better visibility and aesthetics
    const commonClasses = "absolute top-3 right-3 z-10 flex items-center gap-1.5 text-xs font-bold text-pan-white bg-black/50 backdrop-blur-md px-2.5 py-1.5 rounded-full";

    switch (post.postType) {
        case 'ITEM':
            return <div className={commonClasses}><Tag size={14} /><span>{`$${post.priceInfo?.amount}`}</span></div>;
        case 'EVENT':
            return <div className={commonClasses}><Calendar size={14} /><span>Event</span></div>;
        case 'COMMUNITY':
            return <div className={commonClasses}><Users size={14} /><span>Community</span></div>;
        case 'PLACE':
            return <div className={commonClasses}><MapPin size={14} /><span>Place</span></div>;
        case 'DOCUMENT':
            return <div className={commonClasses}><FileText size={14} /><span>Document</span></div>;
        case 'MEDIA':
             if (post.videoUrl) {
                return <div className={commonClasses}><PlayCircle size={14} /><span>Video</span></div>;
            }
            return null;
        default:
            return null;
    }
};


const PostCard: React.FC<{ post: Post; hideCommunityLink?: boolean }> = ({ post }) => {
  const { isSaved, toggleSave } = useSavedPosts();
  const postIsSaved = isSaved(post.id);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation(); // Stop event bubbling
    toggleSave(post.id);
  };
  
  const formatPrice = (priceInfo: PriceInfo | undefined): string | null => {
    if (!priceInfo || typeof priceInfo.amount !== 'number') {
      return null;
    }
    const { amount, unit } = priceInfo;
    switch (unit) {
      case 'per_item':
        return `$${amount}`;
      case 'per_ticket':
        return `$${amount} / ticket`;
      case 'per_hour':
        return `$${amount} / hr`;
      case 'fixed':
        return `$${amount}`;
      default:
        return null;
    }
  };

  const priceText = formatPrice(post.priceInfo);

  // Special rendering for flagged posts
  if (post.isFlagged) {
    return (
      <Link 
        to={`/post/${post.id}`} 
        className="group relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-pan-gray-dark to-black text-pan-white shadow-lg"
      >
        {/* Blurred Media */}
        {post.videoUrl ? (
          <video src={post.videoUrl} className="absolute inset-0 w-full h-full object-cover blur-md" autoPlay loop muted playsInline />
        ) : post.imageUrl ? (
          <img src={post.imageUrl} alt={post.title || 'Post image'} className="absolute inset-0 w-full h-full object-cover blur-md" />
        ) : (
          <div className="p-4 flex flex-col justify-start blur-sm">
              <h3 className="font-bold text-pan-white line-clamp-2">{post.title}</h3>
              <p className="text-sm text-pan-gray-light line-clamp-5 mt-2">{post.content}</p>
          </div>
        )}
        {/* Warning Overlay */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4">
            <ShieldAlert size={32} className="text-yellow-400 mb-2"/>
            <h4 className="font-bold text-pan-white">Content Warning</h4>
            <p className="text-xs text-pan-gray-light">This post may contain sensitive content.</p>
        </div>
      </Link>
    );
  }


  return (
    <Link 
      to={`/post/${post.id}`} 
      className="group relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-pan-gray-dark to-black text-pan-white shadow-lg"
    >
      {/* Media or Text Background */}
      {post.videoUrl ? (
        <video 
            src={post.videoUrl} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
            autoPlay 
            loop 
            muted 
            playsInline
        />
      ) : post.imageUrl ? (
        <img 
            src={post.imageUrl} 
            alt={post.title || 'Post image'} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
        />
      ) : (
         // Default content for text posts, visible when not hovered
         <div className="p-4 flex flex-col justify-start opacity-100 group-hover:opacity-0 transition-opacity duration-300">
            <h3 className="font-bold text-pan-white line-clamp-2">{post.title}</h3>
            <p className="text-sm text-pan-gray-light line-clamp-5 mt-2">{post.content}</p>
        </div>
      )}
      
      {/* Post Type Indicator */}
      <PostTypeIndicator post={post} />

      {/* Unified Hover Overlay for ALL post types */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
          <button 
            onClick={handleSaveClick}
            className={`absolute top-3 left-3 z-10 p-2 rounded-full transition-colors bg-black/50 backdrop-blur-md ${postIsSaved ? 'text-pan-white' : 'text-pan-gray-light hover:text-pan-white'}`}
            aria-label={postIsSaved ? "Unsave post" : "Save post"}
          >
            <Bookmark size={18} fill={postIsSaved ? 'currentColor' : 'none'} />
          </button>
          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              {post.title && <h3 className="text-pan-white font-bold text-lg line-clamp-2">{post.title}</h3>}
              
              {priceText && <p className="font-semibold text-sm text-pan-white mt-1">{priceText}</p>}

              <p className="text-sm text-pan-gray-light line-clamp-2 my-2">{post.content}</p>
              
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {post.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-white/20 text-pan-white px-2 py-0.5 rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-white/20">
                  <img src={post.user.avatarUrl} alt={post.user.name} className="w-8 h-8 rounded-full" />
                  <div>
                      <p className="text-pan-white font-semibold text-sm">{post.user.name}</p>
                      <p className="text-xs text-pan-gray-light">{formatTimeAgo(post.timestamp)}</p>
                  </div>
              </div>
          </div>
      </div>
    </Link>
  );
};

export default PostCard;