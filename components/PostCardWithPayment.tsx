'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Post } from '@/lib/supabase';
import { Users, Tag, Calendar, MapPin, PlayCircle, FileText, Bookmark, ShieldAlert, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PaymentModal from './PaymentModal';
import ContactButton from './ContactButton';

interface PostCardWithPaymentProps {
  post: Post;
  hideCommunityLink?: boolean;
}

const PostTypeIndicator: React.FC<{ post: Post }> = ({ post }) => {
  const commonClasses = "absolute top-3 right-3 z-10 flex items-center gap-1.5 text-xs font-bold text-white bg-black/50 backdrop-blur-md px-2.5 py-1.5 rounded-full";

  switch (post.post_type) {
    case 'ITEM':
      return <div className={commonClasses}><Tag size={14} /><span>{`$${post.price}`}</span></div>;
    case 'EVENT':
      return <div className={commonClasses}><Calendar size={14} /><span>Event</span></div>;
    case 'COMMUNITY':
      return <div className={commonClasses}><Users size={14} /><span>Community</span></div>;
    case 'PLACE':
      return <div className={commonClasses}><MapPin size={14} /><span>Place</span></div>;
    case 'DOCUMENT':
      return <div className={commonClasses}><FileText size={14} /><span>Document</span></div>;
    case 'MEDIA':
      if (post.video_url) {
        return <div className={commonClasses}><PlayCircle size={14} /><span>Video</span></div>;
      }
      return null;
    default:
      return null;
  }
};

const PostCardWithPayment: React.FC<PostCardWithPaymentProps> = ({ post, hideCommunityLink }) => {
  const { user } = useAuth();
  const [showPayment, setShowPayment] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  const handleBuyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      setShowPayment(true);
    } else {
      // Redirect to login or show auth modal
      alert('Please sign in to purchase');
    }
  };

  const formatPrice = (price: number | null): string | null => {
    if (!price || price === 0) return null;
    return `$${price.toFixed(2)}`;
  };

  const priceText = formatPrice(post.price);

  // Special rendering for flagged posts
  if (post.is_flagged) {
    return (
      <Link 
        href={`/post/${post.id}`} 
        className="group relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-black text-white shadow-lg"
      >
        {/* Blurred Media */}
        {post.video_url ? (
          <video src={post.video_url} className="absolute inset-0 w-full h-full object-cover blur-md" autoPlay loop muted playsInline />
        ) : post.image_url ? (
          <img src={post.image_url} alt={post.title || 'Post image'} className="absolute inset-0 w-full h-full object-cover blur-md" />
        ) : (
          <div className="p-4 flex flex-col justify-start blur-sm">
            <h3 className="font-bold text-white line-clamp-2">{post.title}</h3>
            <p className="text-sm text-gray-300 line-clamp-5 mt-2">{post.content}</p>
          </div>
        )}
        {/* Warning Overlay */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4">
          <ShieldAlert size={32} className="text-yellow-400 mb-2"/>
          <h4 className="font-bold text-white">Content Warning</h4>
          <p className="text-xs text-gray-300">This post may contain sensitive content.</p>
        </div>
      </Link>
    );
  }

  return (
    <>
      <Link 
        href={`/post/${post.id}`} 
        className="group relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-black text-white shadow-lg"
      >
        {/* Media or Text Background */}
        {post.video_url ? (
          <video 
            src={post.video_url} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
            autoPlay 
            loop 
            muted 
            playsInline
          />
        ) : post.image_url ? (
          <img 
            src={post.image_url} 
            alt={post.title || 'Post image'} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
          />
        ) : (
          <div className="p-4 flex flex-col justify-start opacity-100 group-hover:opacity-0 transition-opacity duration-300">
            <h3 className="font-bold text-white line-clamp-2">{post.title}</h3>
            <p className="text-sm text-gray-300 line-clamp-5 mt-2">{post.content}</p>
          </div>
        )}
        
        {/* Post Type Indicator */}
        <PostTypeIndicator post={post} />

        {/* Unified Hover Overlay for ALL post types */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
          <button 
            onClick={handleSaveClick}
            className={`absolute top-3 left-3 z-10 p-2 rounded-full transition-colors bg-black/50 backdrop-blur-md ${isSaved ? 'text-white' : 'text-gray-300 hover:text-white'}`}
            aria-label={isSaved ? "Unsave post" : "Save post"}
          >
            <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
          
          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            {post.title && <h3 className="text-white font-bold text-lg line-clamp-2">{post.title}</h3>}
            
            {priceText && (
              <div className="flex items-center justify-between mt-1">
                <p className="font-semibold text-sm text-white">{priceText}</p>
                <div className="flex items-center gap-1">
                  {user && post.price && post.price > 0 && (
                    <button
                      onClick={handleBuyClick}
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded-full transition-colors"
                    >
                      <CreditCard size={12} />
                      Buy
                    </button>
                  )}
                  <ContactButton
                    postId={post.id}
                    sellerId={post.user_id}
                    sellerName={post.user?.full_name || 'Seller'}
                    className="text-xs px-2 py-1"
                  />
                </div>
              </div>
            )}

            <p className="text-sm text-gray-300 line-clamp-2 my-2">{post.content}</p>
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {post.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-white/20">
              <img src={post.user?.avatar_url || '/avatar-fallback.svg'} alt={post.user?.full_name || 'User'} className="w-8 h-8 rounded-full" />
              <div>
                <p className="text-white font-semibold text-sm">{post.user?.full_name || 'Anonymous'}</p>
                <p className="text-xs text-gray-300">{new Date(post.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          amount={post.price || 0}
          postId={post.id}
          onSuccess={() => {
            console.log('Payment successful!');
            setShowPayment(false);
          }}
        />
      )}
    </>
  );
};

export default PostCardWithPayment;
