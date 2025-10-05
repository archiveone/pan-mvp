import React from 'react';
import { Link } from 'react-router-dom';
// FIX: Replaced non-existent 'Listing' type with 'Post'.
import type { Post } from '../types';
import { PlayCircle, Ticket, Clock, MapPin } from 'lucide-react';

// FIX: Replaced non-existent 'Listing' type with 'Post'.
const getListingTypeDetails = (listing: Post) => {
    // FIX: Changed to listing.postType to match the Post/Listing interface.
    switch (listing.postType) {
        case 'SERVICE':
            return { icon: <Clock size={16} />, priceText: `$${listing.priceInfo.amount} /hr` };
        // FIX: Changed 'EXPERIENCE' to 'EVENT' to align with PostType and mock data.
        case 'EVENT':
            return { icon: <Ticket size={16} />, priceText: `$${listing.priceInfo.amount} /ticket` };
        case 'PLACE':
            return { icon: <MapPin size={16} />, priceText: 'View Details' };
        case 'ITEM':
        default:
            return { icon: null, priceText: `$${listing.priceInfo.amount}` };
    }
};

// FIX: Replaced non-existent 'Listing' type with 'Post'.
const ListingCard: React.FC<{ listing: Post }> = ({ listing }) => {
  const { icon: TypeIcon, priceText } = getListingTypeDetails(listing);

  return (
    <Link 
      to={`/listing/${listing.id}`} 
      className="group relative aspect-square rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
    >
      {listing.videoUrl ? (
        <>
            <video 
                src={listing.videoUrl} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                autoPlay 
                loop 
                muted 
                playsInline
            />
            <div className="absolute top-3 right-3 text-white/90 bg-black/30 p-1.5 rounded-full backdrop-blur-sm">
                <PlayCircle size={24} />
            </div>
        </>
      ) : (
        <img 
            src={listing.imageUrl} 
            alt={listing.title} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
        />
      )}
      
      {/* White strip hover effect */}
      <div className="absolute inset-x-0 bottom-0 bg-white p-3 transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-gray-800 font-semibold text-base truncate pr-2">{listing.title}</h3>
                <p className="text-pan-red font-bold text-sm">{priceText}</p>
            </div>
            {TypeIcon && (
                <div className="text-gray-500 flex-shrink-0">
                    {TypeIcon}
                </div>
            )}
        </div>
      </div>
    </Link>
  );
};

export default ListingCard;
