'use client'

import { useState } from 'react'
import { Star, Smartphone, Music, Gamepad2, BookOpen, Home, Palette, Shirt, Car, Wrench, Gem, Hammer, Sprout, Baby, Heart, Search, MapPin, Calendar, Users, DollarSign, Filter, X } from 'lucide-react'

interface SearchAndFiltersProps {
  onSearch?: (term: string) => void
  searchTerm?: string
  onCategoryChange?: (category: string) => void
  selectedCategory?: string
  onLocationChange?: (location: string) => void
  onDateChange?: (date: string) => void
  onGuestsChange?: (guests: number) => void
  onPriceRangeChange?: (min: number, max: number) => void
  onSortChange?: (sortBy: string) => void
  onAvailabilityChange?: (availability: string) => void
  location?: string
  date?: string
  guests?: number
  priceRange?: { min: number; max: number }
  sortBy?: string
  availability?: string
}

export default function SearchAndFilters({ 
  onSearch, 
  searchTerm = '', 
  onCategoryChange,
  selectedCategory = 'All',
  onLocationChange,
  onDateChange,
  onGuestsChange,
  onPriceRangeChange,
  onSortChange,
  onAvailabilityChange,
  location = '',
  date = '',
  guests = 1,
  priceRange = { min: 0, max: 1000 },
  sortBy = 'trending',
  availability = 'all'
}: SearchAndFiltersProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  const [showFilters, setShowFilters] = useState(false)
  const [localLocation, setLocalLocation] = useState(location)
  const [localDate, setLocalDate] = useState(date)
  const [localGuests, setLocalGuests] = useState(guests)
  const [localPriceRange, setLocalPriceRange] = useState(priceRange)
  const [localSortBy, setLocalSortBy] = useState(sortBy)
  const [localAvailability, setLocalAvailability] = useState(availability)

  const categories = [
    { name: 'All', icon: Star },
    { name: 'Electronics', icon: Smartphone },
    { name: 'Music', icon: Music },
    { name: 'Sports', icon: Gamepad2 },
    { name: 'Books', icon: BookOpen },
    { name: 'Home', icon: Home },
    { name: 'Art', icon: Palette },
    { name: 'Fashion', icon: Shirt },
    { name: 'Vehicles', icon: Car },
    { name: 'Services', icon: Wrench },
    { name: 'Collectibles', icon: Gem },
    { name: 'Tools', icon: Hammer },
    { name: 'Garden', icon: Sprout },
    { name: 'Toys', icon: Baby },
    { name: 'Health', icon: Heart }
  ]

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearchTerm(value)
    onSearch?.(value)
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalLocation(value)
    onLocationChange?.(value)
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalDate(value)
    onDateChange?.(value)
  }

  const handleGuestsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1
    setLocalGuests(value)
    onGuestsChange?.(value)
  }

  const handlePriceRangeChange = (type: 'min' | 'max', value: number) => {
    const newRange = { ...localPriceRange, [type]: value }
    setLocalPriceRange(newRange)
    onPriceRangeChange?.(newRange.min, newRange.max)
  }

  const clearFilters = () => {
    setLocalSearchTerm('')
    setLocalLocation('')
    setLocalDate('')
    setLocalPriceRange({ min: 0, max: 1000 })
    setLocalSortBy('trending')
    setLocalAvailability('all')
    onSearch?.('')
    onLocationChange?.('')
    onDateChange?.('')
    onPriceRangeChange?.(0, 1000)
    onSortChange?.('trending')
    onAvailabilityChange?.('all')
  }

  return (
    <div className="search-section bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-4 pb-0">
        {/* Single Line Search Bar - Responsive */}
        <div className="relative mb-0">
          <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm hover:shadow-md transition-shadow search-bar">
            {/* Search Input */}
            <div className="flex-1 px-4 py-2">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-gray-500 dark:text-gray-400" />
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  value={localSearchTerm}
                  onChange={handleSearchChange}
                  className="flex-1 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-sm bg-transparent"
                />
              </div>
            </div>
            
            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
            
            {/* Location */}
            <div className="px-4 py-2 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
                <input
                  type="text"
                  placeholder="Where?"
                  value={localLocation}
                  onChange={handleLocationChange}
                  className="flex-1 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-sm bg-transparent"
                />
              </div>
            </div>
            
            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
            
            {/* Date */}
            <div className="px-4 py-2 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
                <input
                  type="date"
                  placeholder="When?"
                  value={localDate}
                  onChange={handleDateChange}
                  className="flex-1 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-sm bg-transparent"
                />
              </div>
            </div>
            
            
            {/* Filters */}
            <div className="px-4 py-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <Filter size={16} />
                <span className="text-sm">Filters</span>
              </button>
            </div>
            
            {/* Search Button */}
            <button className="m-1 p-2 bg-gradient-to-r from-lime-400 to-lime-300 hover:brightness-95 text-black rounded-full transition-all duration-200">
              <Search size={16} />
            </button>
          </div>
        </div>
        
        {/* Clear Filters Button */}
        {(localSearchTerm || localLocation || localDate || localPriceRange.min > 0 || localPriceRange.max < 1000) && (
          <div className="flex justify-end mb-4">
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <X size={16} />
              <span className="text-sm">Clear all</span>
            </button>
          </div>
        )}
        
        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={localPriceRange.min}
                    onChange={(e) => handlePriceRangeChange('min', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={localPriceRange.max}
                    onChange={(e) => handlePriceRangeChange('max', parseInt(e.target.value) || 1000)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                  />
                </div>
              </div>
              
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => onCategoryChange?.(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                >
                  {categories.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select 
                  value={localSortBy}
                  onChange={(e) => {
                    setLocalSortBy(e.target.value)
                    onSortChange?.(e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500"
                >
                  <option value="trending">🔥 Trending</option>
                  <option value="popular">⭐ Popular</option>
                  <option value="newest">🆕 Newest First</option>
                  <option value="price_low">💰 Price: Low to High</option>
                  <option value="price_high">💎 Price: High to Low</option>
                  <option value="oldest">📅 Oldest First</option>
                </select>
              </div>
              
              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                <select 
                  value={localAvailability}
                  onChange={(e) => {
                    setLocalAvailability(e.target.value)
                    onAvailabilityChange?.(e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900"
                >
                  <option value="all">All Items</option>
                  <option value="available">Available Now</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Filter Tabs - Responsive */}
        {onCategoryChange && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => {
              const IconComponent = category.icon
              return (
                <button
                  key={category.name}
                  onClick={() => onCategoryChange(category.name)}
                  className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 filter-tab ${
                    selectedCategory === category.name
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <IconComponent size={14} />
                  <span className="text-sm">{category.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
