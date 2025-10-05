import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '../components/Button';
import { ArrowLeft, Heart, MessageCircle, MapPin, Calendar, Clock } from 'lucide-react';
import { useSavedPosts } from '../hooks/useSavedListings';
import type { Post } from '../types';
import { usePosts } from '../contexts/PostsContext';
import PostCard from '../components/PostCard';

const getListingActionDetails = (listing: Post) => {
    switch (listing.postType) {
        case 'SERVICE':
            return {
                buttonText: 'Book Now',
                confirmText: `Are you sure you want to book "${listing.title}" for $${listing.priceInfo.amount}/hr?`
            };
        case 'EVENT':
            return {
                buttonText: 'Get Tickets',
                confirmText: `Are you sure you want to get tickets for "${listing.title}" for $${listing.priceInfo.amount}?`
            };
        case 'PLACE':
            return {
                buttonText: 'Make a Reservation',
                confirmText: `Proceed to make a reservation at "${listing.title}"?`
            };
        case 'ITEM':
        default:
            return {
                buttonText: 'Buy Now',
                confirmText: `Are you sure you want to buy "${listing.title}" for $${listing.priceInfo.amount}?`
            };
    }
};


const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { posts } = usePosts();
  const listing = posts.find((l) => l.id === id);
  const [isConfirming, setIsConfirming] = useState(false);
  
  const { isSaved, toggleSave } = useSavedPosts();
  const listingIsSaved = listing ? isSaved(listing.id) : false;

  const otherPostsFromUser = useMemo(() => {
    if (!listing) return [];
    return posts.filter(p => p.user.id === listing.user.id && p.id !== id).slice(0, 2);
  }, [listing, id, posts]);

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-bold mb-4">Listing not found</h2>
        <Link to="/" className="text-pan-red hover:underline">Go back home</Link>
      </div>
    );
  }
  
  const { buttonText, confirmText } = getListingActionDetails(listing);

  const handleConfirmAction = () => {
    alert('Proceeding to next step! (Mock)');
    setIsConfirming(false); 
  };
  
  const priceText = listing.priceInfo.unit === 'fixed' ? '' :
                    listing.priceInfo.unit === 'per_item' ? `$${listing.priceInfo.amount}` :
                    `$${listing.priceInfo.amount} ${listing.priceInfo.unit.replace('per_', '/')}`;

  return (
    <div className="bg-pan-off-white min-h-screen">
      <div className="relative bg-black">
        {listing.videoUrl ? (
            <video 
                src={listing.videoUrl} 
                className="w-full h-80 object-cover"
                autoPlay
                loop
                controls
            />
        ) : (
            <img src={listing.imageUrl} alt={listing.title} className="w-full h-80 object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
        <Link to="/" className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm p-2 rounded-full text-gray-800 hover:bg-white transition">
            <ArrowLeft size={24}/>
        </Link>
        <div className="absolute bottom-4 left-4 text-white">
            <h1 className="text-3xl font-bold">{listing.title}</h1>
            {priceText && <p className="text-2xl font-semibold text-pan-peach">{priceText}</p>}
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
            <Link to={`/profile/${listing.user.id}`} className="flex items-center gap-3">
                <img src={listing.user.avatarUrl} alt={listing.user.name} className="w-12 h-12 rounded-full" />
                <div>
                    <p className="font-bold">{listing.user.name}</p>
                    <p className="text-sm text-gray-500">View Profile</p>
                </div>
            </Link>
            <div className="flex items-center gap-4">
                <button 
                  onClick={() => toggleSave(listing.id)}
                  className={`transition-colors ${listingIsSaved ? 'text-pan-red' : 'text-gray-500 hover:text-pan-red'}`}
                  aria-label={listingIsSaved ? 'Unsave this item' : 'Save this item'}
                >
                    <Heart size={28} fill={listingIsSaved ? 'currentColor' : 'none'}/>
                </button>
                <button className="text-gray-500 hover:text-pan-red transition-colors">
                    <MessageCircle size={28}/>
                </button>
            </div>
        </div>
        
        {(listing.location || listing.dateTime || listing.duration) && (
            <div className="my-6 p-4 bg-white rounded-xl shadow-sm space-y-3">
                <h2 className="font-bold text-xl mb-2">Details</h2>
                {listing.location && (
                    <div className="flex items-center gap-3 text-gray-700">
                        <MapPin size={20} className="text-gray-400"/>
                        <span>{listing.location}</span>
                    </div>
                )}
                {listing.dateTime && (
                    <div className="flex items-center gap-3 text-gray-700">
                        <Calendar size={20} className="text-gray-400"/>
                        <span>{listing.dateTime}</span>
                    </div>
                )}
                {listing.duration && (
                    <div className="flex items-center gap-3 text-gray-700">
                        <Clock size={20} className="text-gray-400"/>
                        <span>{listing.duration}</span>
                    </div>
                )}
            </div>
        )}

        <div className="my-6">
            <h2 className="font-bold text-xl mb-2">Description</h2>
            <p className="text-gray-600 leading-relaxed">{listing.content}</p>
        </div>

        <div className="flex gap-2 mb-6">
            {(listing.tags || []).map(tag => (
                <span key={tag} className="bg-gray-200 text-gray-700 text-xs font-semibold px-3 py-1 rounded-full">{tag}</span>
            ))}
        </div>
        
        <Button onClick={() => setIsConfirming(true)}>
          {buttonText}
        </Button>
      </div>

      {otherPostsFromUser.length > 0 && (
          <div className="p-6 border-t border-gray-200">
              <h2 className="text-xl font-bold mb-4 text-gray-800">More from {listing.user.name}</h2>
              <div className="grid grid-cols-2 gap-4">
                  {otherPostsFromUser.map(p => <PostCard key={p.id} post={p} />)}
              </div>
          </div>
      )}

      {isConfirming && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center transform transition-all duration-300 animate-scaleIn">
            <h2 className="text-xl font-bold mb-2">Confirm Action</h2>
            <p className="text-gray-600 mb-6">{confirmText}</p>
            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setIsConfirming(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmAction}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out forwards; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ListingDetailPage;