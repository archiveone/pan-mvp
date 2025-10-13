import React, { useState } from 'react';
import Link from 'next/link';
import { PlayCircle, Heart, MapPin, Star, Calendar, CreditCard } from 'lucide-react';
import { useSavedPosts } from '../hooks/useSavedListings';
import BookingInterface from './BookingInterface';
import PaymentModal from './PaymentModal';
import SaveToFolderButton from './SaveToFolderButton';

interface Listing {
  id: string
  title: string
  content?: string
  location: string
  category: string
  price: string
  image_url: string
  user_id: string
  created_at: string
  is_sold?: boolean
  content_type?: string
  metadata?: Record<string, any>
}

const getListingTypeDetails = (listing: Listing) => {
    switch (listing.category) {
        case 'Services':
            return { icon: <Star size={16} />, priceText: listing.price };
        case 'Events':
            return { icon: <PlayCircle size={16} />, priceText: listing.price };
        case 'Places':
            return { icon: <MapPin size={16} />, priceText: 'View Details' };
        default:
            return { icon: null, priceText: listing.price };
    }
};

const ListingCard: React.FC<{ listing: Listing }> = ({ listing }) => {
  const { icon: TypeIcon, priceText } = getListingTypeDetails(listing);
  const { isSaved, toggleSave } = useSavedPosts();
  
  // State for booking and payment modals
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  return (
    <>
    <Link 
      href={`/listing/${listing.id}`} 
      className="group relative aspect-square overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
    >
      {listing.image_url ? (
        <img 
            src={listing.image_url} 
            alt={listing.title} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-4xl">
          📷
        </div>
      )}
      
      {/* Listing Type Tag - Always Visible */}
      {listing.category && (
        <div className="absolute top-3 left-3 z-10">
          <div className="inline-flex items-center px-2.5 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
            {TypeIcon && <span className="mr-1">{TypeIcon}</span>}
            {listing.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
        </div>
      )}
      
      {/* Sold overlay */}
      {listing.is_sold && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">
            SOLD
          </div>
        </div>
      )}
      
      {/* White strip hover effect */}
      <div className="absolute inset-x-0 bottom-0 bg-white p-3 transform translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-in-out">
        <div className="flex justify-between items-start">
            <div className="flex-1">
                <h3 className="text-gray-800 font-semibold text-base truncate pr-2">{listing.title}</h3>
                <p className="text-red-600 font-bold text-sm">{priceText}</p>
                {listing.location && (
                  <div className="flex items-center mt-1">
                    <MapPin size={12} className="text-gray-400 mr-1" />
                    <p className="text-gray-500 text-xs">{listing.location}</p>
                  </div>
                )}
            </div>
            {TypeIcon && (
                <div className="text-gray-500 flex-shrink-0">
                    {TypeIcon}
                </div>
            )}
        </div>
      </div>
      
      {/* Save to Folder button */}
      <div 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="absolute top-3 right-3 z-20"
      >
        <SaveToFolderButton 
          itemId={listing.id} 
          itemType="listing" 
          compact 
        />
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-3 left-3 right-3 flex space-x-2">
        {/* Book/Reserve button for booking-type listings */}
        {(listing.metadata?.transaction_category === 'bookings_reservations' || 
          listing.category === 'Services' || 
          listing.category === 'Events') && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowBookingModal(true);
            }}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
          >
            <Calendar size={14} />
            <span>Book</span>
          </button>
        )}

        {/* Buy button for purchase-type listings */}
        {(listing.metadata?.transaction_category === 'purchases_ecommerce' || 
          listing.category === 'Art & Crafts' || 
          listing.category === 'Electronics' || 
          listing.category === 'Fashion') && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowPaymentModal(true);
            }}
            className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
          >
            <CreditCard size={14} />
            <span>Buy</span>
          </button>
        )}

        {/* View Details button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = `/listing/${listing.id}`;
          }}
          className="bg-white bg-opacity-90 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-opacity-100 transition-colors"
        >
          View
        </button>
      </div>
    </Link>

    {/* Booking Modal */}
    <BookingInterface
      isOpen={showBookingModal}
      onClose={() => setShowBookingModal(false)}
      contentId={listing.id}
      title={listing.title}
      price={parseFloat(listing.price.replace(/[^\d.-]/g, '')) || 0}
      currency="EUR"
      onSuccess={(bookingId) => {
        console.log('Booking successful:', bookingId);
        setShowBookingModal(false);
      }}
    />

    {/* Payment Modal */}
    <PaymentModal
      isOpen={showPaymentModal}
      onClose={() => setShowPaymentModal(false)}
      paymentData={{
        contentId: listing.id,
        title: listing.title,
        amount: parseFloat(listing.price.replace(/[^\d.-]/g, '')) || 0,
        currency: "EUR",
        category: listing.metadata?.transaction_category || 'purchases_ecommerce',
        subtype: listing.metadata?.transaction_subtype || 'physical_product',
        metadata: listing.metadata
      }}
      onSuccess={(transactionId) => {
        console.log('Payment successful:', transactionId);
        setShowPaymentModal(false);
      }}
    />
    </>
  );
};

export default ListingCard;
