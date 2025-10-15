'use client';

import { useState } from 'react';
import { MapPin, Calendar, Star, DollarSign, Bed, Users, Heart, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface HotelListing {
  id: string;
  title: string;
  description?: string;
  city: string;
  country: string;
  basePrice: number;
  currency: string;
  images: string[];
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  averageRating?: number;
  reviewCount?: number;
  propertyType?: string;
}

interface HotelSavesBoxProps {
  hotels: HotelListing[];
  boxId: string;
  boxTitle: string;
}

export default function HotelSavesBox({ hotels, boxId, boxTitle }: HotelSavesBoxProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'saved'>('saved');

  // Calculate trip stats
  const totalCost = hotels.reduce((sum, h) => sum + h.basePrice, 0);
  const avgRating = hotels.length > 0
    ? hotels.reduce((sum, h) => sum + (h.averageRating || 0), 0) / hotels.length
    : 0;

  if (hotels.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-8 text-center text-white">
        <div className="text-6xl mb-4">🏨</div>
        <h3 className="text-xl font-bold mb-2">No Hotels Saved</h3>
        <p className="text-white/80">Save hotels and rentals to plan your trips</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">{boxTitle}</h2>
        
        {/* Trip Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
            <div className="text-2xl font-bold">{hotels.length}</div>
            <div className="text-sm text-white/80">Places</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
            <div className="text-2xl font-bold">{totalCost.toLocaleString()}</div>
            <div className="text-sm text-white/80">Total Cost</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
            <div className="text-2xl font-bold flex items-center gap-1">
              <Star size={16} fill="currentColor" />
              {avgRating.toFixed(1)}
            </div>
            <div className="text-sm text-white/80">Avg Rating</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Grid
          </button>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="saved">Recently Saved</option>
          <option value="price">Price: Low to High</option>
          <option value="rating">Highest Rated</option>
        </select>
      </div>

      {/* Hotels List/Grid */}
      <div className={`p-4 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-4'} max-h-[600px] overflow-y-auto`}>
        {hotels.map((hotel) => (
          <Link
            key={hotel.id}
            href={`/rental/${hotel.id}`}
            className="block bg-white hover:bg-gray-50 rounded-xl border border-gray-200 overflow-hidden transition-all hover:shadow-lg"
          >
            {/* Hotel Image */}
            <div className="aspect-video relative overflow-hidden">
              {hotel.images[0] ? (
                <img 
                  src={hotel.images[0]} 
                  alt={hotel.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <div className="text-4xl">🏨</div>
                </div>
              )}
              
              {/* Heart Icon */}
              <div className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                <Heart size={16} className="text-red-500" fill="currentColor" />
              </div>
            </div>

            {/* Hotel Info */}
            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-1 truncate">{hotel.title}</h3>
              
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                <MapPin size={14} />
                <span className="truncate">{hotel.city}, {hotel.country}</span>
              </div>

              {/* Rating */}
              {hotel.averageRating && (
                <div className="flex items-center gap-1 mb-2">
                  <Star size={14} className="text-yellow-500" fill="currentColor" />
                  <span className="text-sm font-semibold text-gray-900">
                    {hotel.averageRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({hotel.reviewCount} reviews)
                  </span>
                </div>
              )}

              {/* Amenities */}
              <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                {hotel.bedrooms && (
                  <span className="flex items-center gap-1">
                    <Bed size={12} />
                    {hotel.bedrooms} bed
                  </span>
                )}
                {hotel.maxGuests && (
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {hotel.maxGuests} guests
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-gray-900">
                  {hotel.currency}{hotel.basePrice}
                </span>
                <span className="text-sm text-gray-500">/ night</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Trip Summary Footer */}
      <div className="border-t bg-gray-50 p-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-600">Estimated Total</div>
            <div className="text-xl font-bold text-gray-900">
              €{totalCost.toLocaleString()}
            </div>
          </div>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
            Plan Trip
          </button>
        </div>
      </div>
    </div>
  );
}

