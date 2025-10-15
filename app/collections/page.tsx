'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import BottomNav from '@/components/BottomNav';
import { Plus, GripVertical, Edit3, Camera, Check, X, Sun, Moon } from 'lucide-react';
import { AdvancedHubService, HubBox } from '@/services/advancedHubService';
import AppleStyleBoxEditor from '@/components/AppleStyleBoxEditor';
import { ImageService } from '@/services/imageService';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import * as Icons from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Utility to calculate brightness and determine text color
const getTextColor = (hexColor?: string): string => {
  if (!hexColor) return 'white';
  
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1F2937' : '#FFFFFF';
};

export default function CollectionsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [collections, setCollections] = useState<HubBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingCollection, setEditingCollection] = useState<HubBox | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [boxTypeSelection, setBoxTypeSelection] = useState(false);
  const [selectedBoxType, setSelectedBoxType] = useState<string>('saved');
  
  // Collection content data
  const [collectionContent, setCollectionContent] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadCollections();
  }, [user]);

  const loadCollections = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await AdvancedHubService.getUserHubBoxes(user.id);
      if (result.success && result.data) {
        // Filter to only show saved and custom collections
        const collectionsOnly = result.data.filter(box => 
          box.box_type === 'saved' || box.box_type === 'custom'
        );
        setCollections(collectionsOnly);
        
        // Load content for each collection
        await loadCollectionContent(collectionsOnly);
      }
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCollectionContent = async (collections: HubBox[]) => {
    const content: Record<string, any> = {};

    await Promise.all(
      collections.map(async (collection) => {
        try {
          const itemsResult = await AdvancedHubService.getBoxItems(collection.id);
          
          if (itemsResult.success && itemsResult.data) {
            const items = itemsResult.data;
            
            // Extract images from items for grid display
            const images = items
              .filter((item: any) => item.posts?.media_url)
              .slice(0, 8)
              .map((item: any) => item.posts.media_url);

            content[collection.id] = {
              type: collection.box_type,
              items: items,
              images: images
            };
          } else {
            content[collection.id] = { 
              type: collection.box_type, 
              items: [], 
              images: [] 
            };
          }
        } catch (error) {
          console.error(`Error loading content for collection ${collection.id}:`, error);
          content[collection.id] = { type: collection.box_type, items: [], images: [] };
        }
      })
    );

    setCollectionContent(content);
  };

  const handleEditCollection = (collection: HubBox, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingCollection(collection);
    setIsNew(false);
    setShowEditor(true);
  };

  const handleCreateCollection = () => {
    setBoxTypeSelection(true);
  };

  const handleBoxTypeSelected = (type: string) => {
    setSelectedBoxType(type);
    setBoxTypeSelection(false);
    setEditingCollection(null);
    setIsNew(true);
    setShowEditor(true);
  };

  const handleSaveEditor = async (data: { title: string; color?: string; imageUrl?: string; isPublic?: boolean }) => {
    try {
      let uploadedImageUrl = data.imageUrl;

      // Handle image upload if it's a blob URL
      if (data.imageUrl && data.imageUrl.startsWith('blob:')) {
        const response = await fetch(data.imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'collection-cover.jpg', { type: 'image/jpeg' });
        
        const uploadResult = await ImageService.uploadImage(file, 'content-images', 'collections');
        if (uploadResult.success && uploadResult.url) {
          uploadedImageUrl = uploadResult.url;
        } else {
          alert('Image upload failed. Make sure "content-images" bucket exists and is PUBLIC.');
          return;
        }
      }

      if (isNew) {
        const result = await AdvancedHubService.createHubBox(user!.id, {
          title: data.title,
          box_type: selectedBoxType,
          custom_color: data.color,
          color_type: uploadedImageUrl ? 'preset' : 'custom',
          image_url: uploadedImageUrl,
          icon: selectedBoxType === 'saved' ? 'Bookmark' : 'Folder',
          is_public: data.isPublic || false
        });
        
        if (!result.success) {
          alert(result.error || 'Failed to create collection');
          return;
        }
      } else if (editingCollection) {
        const result = await AdvancedHubService.updateHubBox(editingCollection.id, {
          title: data.title,
          custom_color: data.color,
          color_type: uploadedImageUrl ? 'preset' : 'custom',
          image_url: uploadedImageUrl,
          is_public: data.isPublic
        });
        
        if (!result.success) {
          alert(result.error || 'Failed to update collection');
          return;
        }
      }
      
      setShowEditor(false);
      setEditingCollection(null);
      loadCollections();
    } catch (error) {
      console.error('Error saving collection:', error);
      alert('Failed to save collection');
    }
  };

  const handleDeleteCollection = async () => {
    if (!editingCollection) return;
    
    if (!editingCollection.is_deletable) {
      alert(`"${editingCollection.title}" cannot be deleted.`);
      return;
    }
    
    try {
      const result = await AdvancedHubService.deleteHubBox(editingCollection.id);
      if (result.success) {
        setShowEditor(false);
        setEditingCollection(null);
        loadCollections();
      } else {
        alert(result.error || 'Failed to delete collection');
      }
    } catch (error) {
      alert('Failed to delete collection');
    }
  };

  const handleLayoutChange = async (layout: Layout[]) => {
    if (!layout || layout.length === 0) return;
    
    try {
      await Promise.all(
        layout.map(item => {
          const collection = collections.find(c => c.id === item.i);
          if (!collection) return Promise.resolve();
          
          return AdvancedHubService.updateHubBox(item.i, {
            settings: { 
              ...collection.settings,
              grid: { x: item.x, y: item.y, w: item.w, h: item.h },
              position: item.y * 2 + item.x
            }
          } as any);
        })
      );
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  };

  const handleCollectionClick = (collection: HubBox) => {
    router.push(`/hub/box/${collection.id}`);
  };

  const layouts = {
    lg: collections.map((collection, index) => ({
      i: collection.id,
      x: collection.settings?.grid?.x ?? (index % 2),
      y: collection.settings?.grid?.y ?? Math.floor(index / 2),
      w: collection.settings?.grid?.w ?? 1,
      h: collection.settings?.grid?.h ?? 1,
      minW: 1,
      minH: 1,
      maxW: 2,
      maxH: 2
    }))
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Please sign in to access your collections</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📁 Collections
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Organize your saved content with customizable collections
          </p>
        </div>

        {/* Draggable Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading your collections...</p>
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Icons.Folder className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No collections yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first collection to start organizing</p>
            <button
              onClick={handleCreateCollection}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium inline-flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Create Collection
            </button>
          </div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1024, md: 768, sm: 640, xs: 0 }}
            cols={{ lg: 2, md: 2, sm: 1, xs: 1 }}
            rowHeight={220}
            isDraggable={true}
            isResizable={true}
            onLayoutChange={handleLayoutChange}
            margin={[20, 20]}
            containerPadding={[0, 0]}
            draggableHandle=".drag-handle"
          >
            {collections.map(collection => {
              const IconComponent = (Icons as any)[collection.icon] || Icons.Folder;
              const bgStyle = collection.image_url
                ? {
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${collection.image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }
                : collection.custom_color
                ? { backgroundColor: collection.custom_color }
                : { background: 'linear-gradient(135deg, #3B82F6, #06B6D4)' };
              
              const textColor = collection.image_url ? '#FFFFFF' : getTextColor(collection.custom_color || '#3B82F6');
              const isLightBg = textColor === '#1F2937';
              
              return (
                <div key={collection.id} className="relative group h-full">
                  <div
                    className="h-full rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden cursor-pointer"
                    style={bgStyle}
                    onClick={() => handleCollectionClick(collection)}
                  >
                    {/* Drag Handle */}
                    <div className="drag-handle absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-20 p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg">
                      <GripVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>

                    {/* Content */}
                    <div className="h-full p-6 flex flex-col relative">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold mb-1 truncate" style={{ color: textColor }}>{collection.title}</h3>
                          <p className="text-sm" style={{ color: textColor, opacity: 0.7 }}>
                            {collectionContent[collection.id]?.items?.length || 0} items
                          </p>
                        </div>
                        
                        <div className="relative flex-shrink-0 ml-3">
                          <div className={`${isLightBg ? 'bg-gray-900/10' : 'bg-white/20'} backdrop-blur-sm rounded-xl p-2.5`}>
                            <IconComponent className="w-6 h-6" style={{ color: textColor }} />
                          </div>
                          <button
                            onClick={(e) => handleEditCollection(collection, e)}
                            className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-105 z-10"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-gray-900" />
                          </button>
                        </div>
                      </div>

                      {/* Collection Content Preview - Image Grid */}
                      <div className="flex-1 min-h-0 mb-2">
                        {collectionContent[collection.id]?.images && collectionContent[collection.id].images.length > 0 ? (
                          <div className="grid grid-cols-4 gap-1 h-full">
                            {collectionContent[collection.id].images.map((img: string, idx: number) => (
                              <div key={idx} className="aspect-square bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
                                <img src={img} alt="" className="w-full h-full object-cover" />
                              </div>
                            ))}
                            {Array.from({ length: Math.max(0, 8 - collectionContent[collection.id].images.length) }).map((_, idx) => (
                              <div key={`empty-${idx}`} className="aspect-square bg-white/5 backdrop-blur-sm rounded-lg" />
                            ))}
                          </div>
                        ) : (
                          <div className={`${isLightBg ? 'bg-gray-900/10' : 'bg-white/10'} backdrop-blur-sm rounded-lg p-4 text-center h-full flex flex-col items-center justify-center`}>
                            <Icons.FolderOpen className="w-8 h-8 mb-2" style={{ color: textColor, opacity: 0.5 }} />
                            <p className="text-xs" style={{ color: textColor, opacity: 0.6 }}>
                              No items yet
                            </p>
                            <p className="text-xs mt-1" style={{ color: textColor, opacity: 0.5 }}>
                              Save items to this collection
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Resize Indicator */}
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="w-4 h-4 border-r-2 border-b-2" style={{ borderColor: textColor, opacity: 0.5 }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </ResponsiveGridLayout>
        )}

        {/* Add Collection - Fixed Button Below Grid */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleCreateCollection}
            className="w-64 h-64 rounded-2xl border-4 border-dashed border-purple-400 hover:border-purple-300 hover:bg-purple-400/10 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer active:scale-95"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 flex items-center justify-center transition-colors shadow-lg">
              <Plus className="w-10 h-10 text-white" />
            </div>
            <p className="text-base font-bold text-gray-700 dark:text-gray-300">Add Collection</p>
          </button>
        </div>
        
        {/* Theme Toggle - Top Right Corner */}
        <button
          onClick={toggleTheme}
          className="fixed top-20 right-4 p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all z-50 hover:scale-110"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-gray-900 dark:text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-700" />
          )}
        </button>
      </main>

      {/* Collection Type Selection */}
      {boxTypeSelection && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Choose Collection Type</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Organize your content your way</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => handleBoxTypeSelected('saved')}
                className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 hover:from-pink-100 hover:to-rose-100 dark:hover:from-pink-900/30 dark:hover:to-rose-900/30 rounded-2xl transition-all active:scale-95"
              >
                <Icons.Bookmark className="w-8 h-8 text-pink-600 dark:text-pink-400 mx-auto mb-2" />
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Saved Items</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Others' posts & listings</p>
              </button>
              
              <button
                onClick={() => handleBoxTypeSelected('custom')}
                className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/30 dark:hover:to-teal-900/30 rounded-2xl transition-all active:scale-95"
              >
                <Icons.Sparkles className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Custom</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Mood boards, ideas...</p>
              </button>
            </div>
            <button
              onClick={() => setBoxTypeSelection(false)}
              className="w-full py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Apple-Style Editor */}
      <AppleStyleBoxEditor
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false);
          setEditingCollection(null);
        }}
        onSave={handleSaveEditor}
        onDelete={
          !isNew && editingCollection && editingCollection.is_deletable
            ? handleDeleteCollection 
            : undefined
        }
        initialData={editingCollection ? {
          title: editingCollection.title,
          color: editingCollection.custom_color,
          imageUrl: editingCollection.image_url,
          isPublic: editingCollection.is_public
        } : undefined}
        isNew={isNew}
      />

      <AppFooter />
      <BottomNav />
    </div>
  );
}

