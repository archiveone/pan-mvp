'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import BottomNav from '@/components/BottomNav';
import { 
  ArrowLeft, Grid3x3, List, Play, Shuffle, Filter, 
  SortAsc, Tag, Folder, Download, Trash2, Share2,
  Music, Video, Image as ImageIcon, FileText, MapPin,
  Calendar, DollarSign, User, MoreVertical, Edit3,
  Search, X, ChevronDown
} from 'lucide-react';
import { AdvancedHubService, HubBox } from '@/services/advancedHubService';
import { supabase } from '@/lib/supabase';
import * as Icons from 'lucide-react';

type ViewMode = 'grid' | 'list' | 'playlist';
type SortBy = 'recent' | 'oldest' | 'title' | 'type' | 'price';
type FilterBy = 'all' | 'music' | 'video' | 'image' | 'hotel' | 'restaurant' | 'event' | 'product';

interface CollectionItem {
  id: string;
  post_id: string;
  added_at: string;
  posts: {
    id: string;
    title: string;
    content: string;
    media_url?: string;
    media_type?: string;
    price?: string;
    location?: string;
    created_at: string;
    user_id: string;
    profiles?: {
      username: string;
      avatar_url?: string;
    };
  };
}

export default function CollectionDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<HubBox | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // View controls
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Playlist mode
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadCollection();
  }, [user, collectionId]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [items, sortBy, filterBy, searchQuery]);

  const loadCollection = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load collection details
      const collectionResult = await AdvancedHubService.getUserHubBoxes(user.id);
      if (collectionResult.success && collectionResult.data) {
        const coll = collectionResult.data.find(c => c.id === collectionId);
        if (coll) {
          setCollection(coll);
        }
      }

      // Load items
      const itemsResult = await AdvancedHubService.getBoxItems(collectionId);
      if (itemsResult.success && itemsResult.data) {
        setItems(itemsResult.data);
      }
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...items];

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.posts?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.posts?.content?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filter by type
    if (filterBy !== 'all') {
      filtered = filtered.filter(item => {
        const mediaType = item.posts?.media_type?.toLowerCase();
        return mediaType === filterBy;
      });
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
        case 'oldest':
          return new Date(a.added_at).getTime() - new Date(b.added_at).getTime();
        case 'title':
          return (a.posts?.title || '').localeCompare(b.posts?.title || '');
        case 'type':
          return (a.posts?.media_type || '').localeCompare(b.posts?.media_type || '');
        case 'price':
          const priceA = parseFloat(a.posts?.price || '0');
          const priceB = parseFloat(b.posts?.price || '0');
          return priceB - priceA;
        default:
          return 0;
      }
    });

    setFilteredItems(filtered);
  };

  const removeItem = async (itemId: string) => {
    if (!confirm('Remove this item from the collection?')) return;
    
    try {
      const result = await AdvancedHubService.removeItemFromBox(collectionId, itemId);
      if (result.success) {
        setItems(items.filter(i => i.post_id !== itemId));
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const playPlaylist = () => {
    const playableItems = filteredItems.filter(item => 
      item.posts?.media_type === 'video' || item.posts?.media_type === 'audio'
    );
    if (playableItems.length > 0) {
      setCurrentPlayingIndex(0);
      setIsPlaying(true);
      setViewMode('playlist');
    }
  };

  const shufflePlaylist = () => {
    const playableItems = filteredItems.filter(item => 
      item.posts?.media_type === 'video' || item.posts?.media_type === 'audio'
    );
    if (playableItems.length > 0) {
      const randomIndex = Math.floor(Math.random() * playableItems.length);
      setCurrentPlayingIndex(randomIndex);
      setIsPlaying(true);
      setViewMode('playlist');
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Collection not found</p>
          <button
            onClick={() => router.push('/collections')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl"
          >
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  const IconComponent = (Icons as any)[collection.icon] || Icons.Folder;
  const playableCount = filteredItems.filter(i => i.posts?.media_type === 'video' || i.posts?.media_type === 'audio').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/collections')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Collections
          </button>

          {/* Collection Info */}
          <div 
            className="relative overflow-hidden rounded-3xl shadow-lg mb-6 h-48"
            style={
              collection.image_url
                ? {
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${collection.image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }
                : collection.custom_color
                ? { backgroundColor: collection.custom_color }
                : { background: 'linear-gradient(135deg, #3B82F6, #06B6D4)' }
            }
          >
            <div className="absolute inset-0 p-8 flex items-end">
              <div className="flex items-center gap-4 w-full">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                  <IconComponent className="w-12 h-12 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2">{collection.title}</h1>
                  <p className="text-white/80 text-sm">
                    {filteredItems.length} items • {collection.is_public ? '🌍 Public' : '🔒 Private'}
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/hub/box/${collection.id}`)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl transition-colors"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in collection..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            {/* View Mode */}
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow' : 'hover:bg-white/50 dark:hover:bg-gray-600/50'
                }`}
                title="Grid View"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow' : 'hover:bg-white/50 dark:hover:bg-gray-600/50'
                }`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
              {playableCount > 0 && (
                <button
                  onClick={() => setViewMode('playlist')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'playlist' ? 'bg-white dark:bg-gray-600 shadow' : 'hover:bg-white/50 dark:hover:bg-gray-600/50'
                  }`}
                  title="Playlist View"
                >
                  <Play className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Recently Added</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title A-Z</option>
              <option value="type">By Type</option>
              <option value="price">By Price</option>
            </select>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterBy)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="music">🎵 Music</option>
              <option value="video">🎬 Videos</option>
              <option value="image">📸 Images</option>
              <option value="hotel">🏨 Hotels</option>
              <option value="restaurant">🍽️ Restaurants</option>
              <option value="event">🎪 Events</option>
              <option value="product">🛍️ Products</option>
            </select>

            {/* Play Actions */}
            {playableCount > 0 && (
              <>
                <button
                  onClick={playPlaylist}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Play All ({playableCount})
                </button>
                <button
                  onClick={shufflePlaylist}
                  className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors"
                  title="Shuffle"
                >
                  <Shuffle className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <Icons.FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
              {searchQuery || filterBy !== 'all' ? 'No matching items' : 'Collection is empty'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery || filterBy !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Start saving items to this collection'}
            </p>
            {(searchQuery || filterBy !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterBy('all');
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="group relative aspect-square bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow hover:shadow-xl transition-all">
                {/* Media */}
                {item.posts?.media_url ? (
                  <img
                    src={item.posts.media_url}
                    alt={item.posts.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    <Icons.FileText className="w-12 h-12 text-gray-400" />
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2">
                      {item.posts?.title || 'Untitled'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`/listing/${item.post_id}`)}
                        className="flex-1 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-xs rounded-lg transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => removeItem(item.post_id)}
                        className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Type Badge */}
                {item.posts?.media_type && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs">
                    {item.posts.media_type === 'video' && '🎬'}
                    {item.posts.media_type === 'audio' && '🎵'}
                    {item.posts.media_type === 'image' && '📸'}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow hover:shadow-lg transition-all flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {item.posts?.media_url ? (
                    <img
                      src={item.posts.media_url}
                      alt={item.posts.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icons.FileText className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                    {item.posts?.title || 'Untitled'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                    {item.posts?.content}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    {item.posts?.media_type && (
                      <span className="flex items-center gap-1">
                        {item.posts.media_type === 'video' && <Video className="w-3 h-3" />}
                        {item.posts.media_type === 'audio' && <Music className="w-3 h-3" />}
                        {item.posts.media_type}
                      </span>
                    )}
                    {item.posts?.price && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {item.posts.price}
                      </span>
                    )}
                    <span>Added {new Date(item.added_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/listing/${item.post_id}`)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                  >
                    View
                  </button>
                  <button
                    onClick={() => removeItem(item.post_id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              🎵 Playlist Mode
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {playableCount} playable items in this collection
            </p>
            <div className="space-y-2">
              {filteredItems
                .filter(item => item.posts?.media_type === 'video' || item.posts?.media_type === 'audio')
                .map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      index === currentPlayingIndex
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => {
                      setCurrentPlayingIndex(index);
                      setIsPlaying(true);
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        {index === currentPlayingIndex && isPlaying ? (
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                        ) : (
                          <Play className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                          {item.posts?.title || 'Untitled'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.posts?.media_type === 'audio' ? '🎵 Audio' : '🎬 Video'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  );
}

