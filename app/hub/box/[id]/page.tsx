'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit3, Grid3x3, List, LayoutGrid } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AdvancedHubService, HubBox } from '@/services/advancedHubService';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import BottomNav from '@/components/BottomNav';
import * as Icons from 'lucide-react';

export default function BoxDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const { user } = useAuth();
  const [box, setBox] = useState<HubBox | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (id && user) {
      loadBoxData();
    }
  }, [id, user]);

  const loadBoxData = async () => {
    setLoading(true);
    try {
      // Get box details
      const boxResult = await AdvancedHubService.getUserHubBoxes(user!.id);
      if (boxResult.success && boxResult.data) {
        const foundBox = boxResult.data.find(b => b.id === id);
        if (foundBox) {
          setBox(foundBox);
        }
      }

      // Get box items
      const itemsResult = await AdvancedHubService.getBoxItems(id as string);
      if (itemsResult.success && itemsResult.data) {
        setItems(itemsResult.data);
      }
    } catch (error) {
      console.error('Error loading box:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    router.push('/');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!box) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Collection Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">This collection doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => router.push('/hub')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium"
          >
            Back to Hub
          </button>
        </main>
      </div>
    );
  }

  const IconComponent = (Icons as any)[box.icon] || Icons.Folder;
  const bgColor = box.custom_color || box.color || '#3B82F6';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/hub')}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: bgColor }}
              >
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{box.title}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                  {box.is_public ? ' • Public' : ' • Private'}
                </p>
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Description if exists */}
        {box.description && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl">
            <p className="text-gray-700 dark:text-gray-300">{box.description}</p>
          </div>
        )}

        {/* Items */}
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <IconComponent className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No items yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start adding items to this collection from your feed
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium"
            >
              Browse Feed
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="aspect-square bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  if (item.posts?.id) {
                    router.push(`/listing/${item.posts.id}`);
                  }
                }}
              >
                {item.posts?.media_url ? (
                  <img 
                    src={item.posts.media_url} 
                    alt={item.posts.title || 'Item'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                    <Icons.FileText className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                {item.posts?.title && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white text-sm font-medium truncate">{item.posts.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center gap-4"
                onClick={() => {
                  if (item.posts?.id) {
                    router.push(`/listing/${item.posts.id}`);
                  }
                }}
              >
                {item.posts?.media_url ? (
                  <img 
                    src={item.posts.media_url} 
                    alt={item.posts.title || 'Item'}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icons.FileText className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {item.posts?.title || 'Untitled'}
                  </h3>
                  {item.posts?.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {item.posts.description}
                    </p>
                  )}
                  {item.posts?.location && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      📍 {item.posts.location}
                    </p>
                  )}
                </div>
                {item.posts?.price && (
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-blue-600 dark:text-blue-400">
                      {item.posts.price}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  );
}

