'use client';

import React, { useState, useEffect } from 'react';
import { FolderPlus, Check, X, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AdvancedHubService, HubBox } from '@/services/advancedHubService';

interface SaveToFolderButtonProps {
  itemId: string;
  itemType?: 'post' | 'listing';
  compact?: boolean;
}

export default function SaveToFolderButton({ itemId, itemType = 'post', compact = false }: SaveToFolderButtonProps) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [folders, setFolders] = useState<HubBox[]>([]);
  const [savedFolders, setSavedFolders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showModal && user) {
      loadFolders();
    }
  }, [showModal, user]);

  const loadFolders = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load user's folders (exclude "My Listings" - only show saved/custom folders)
      const result = await AdvancedHubService.getUserHubBoxes(user.id);
      if (result.success && result.data) {
        const savableFolders = result.data.filter(box => 
          // Exclude "My Listings" - it shows all posts automatically
          box.title !== 'My Listings' &&
          // Only show saved and custom types
          (box.box_type === 'saved' || box.box_type === 'custom')
        );
        setFolders(savableFolders);

        // Check which folders already contain this item
        const boxesResult = await AdvancedHubService.getBoxesForItem(user.id, itemId);
        if (boxesResult.success && boxesResult.data) {
          const boxIds = new Set(boxesResult.data.map(box => box.id));
          setSavedFolders(boxIds);
        }
      }
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = async (folderId: string) => {
    try {
      const isCurrentlySaved = savedFolders.has(folderId);

      if (isCurrentlySaved) {
        // Remove from folder
        console.log(`🗑️  Removing item ${itemId} from folder ${folderId}...`);
        const result = await AdvancedHubService.removeItemFromBox(folderId, itemId);
        if (result.success) {
          console.log('✅ Item removed from folder!');
          setSavedFolders(prev => {
            const newSet = new Set(prev);
            newSet.delete(folderId);
            return newSet;
          });
        } else {
          console.error('❌ Failed to remove:', result.error);
          alert('Failed to remove from folder');
        }
      } else {
        // Add to folder
        console.log(`➕ Adding item ${itemId} (type: ${itemType}) to folder ${folderId}...`);
        const result = await AdvancedHubService.addItemToBox(folderId, itemId, itemType);
        console.log('📊 Add result:', result);
        
        if (result.success) {
          console.log('✅ Item added to folder successfully!');
          setSavedFolders(prev => new Set(prev).add(folderId));
        } else {
          console.error('❌ Failed to add:', result.error);
          alert(`Failed to add to folder: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('❌ Error toggling folder:', error);
      alert('An error occurred');
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🌟 Star clicked! Opening folder modal...');
          setShowModal(true);
        }}
        className={`
          ${compact 
            ? 'p-1.5 bg-white/70 hover:bg-white/90 backdrop-blur-sm' 
            : 'px-4 py-2 bg-white hover:bg-gray-50'
          }
          hover:shadow-md active:scale-95 transition-all rounded-full
          flex items-center gap-2 font-medium
        `}
        title="Save to folder"
      >
        <Star 
          className={`${compact ? 'w-4 h-4' : 'w-4 h-4'} ${savedFolders.size > 0 ? 'text-white fill-white' : 'text-white'}`}
          fill={savedFolders.size > 0 ? 'currentColor' : 'none'}
          strokeWidth={2.5}
        />
        {!compact && <span className="text-gray-700">Save to Folder</span>}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add to Collection</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Organize in your folders</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-gray-600 dark:text-gray-400 mt-4">Loading folders...</p>
                </div>
              ) : folders.length === 0 ? (
                <div className="text-center py-8">
                  <FolderPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">No folders yet</p>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      window.location.href = '/hub';
                    }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium"
                  >
                    Create Folder
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {folders.map((folder) => {
                    const isSaved = savedFolders.has(folder.id);
                    const folderColor = folder.custom_color || folder.color || '#3B82F6';

                    return (
                      <button
                        key={folder.id}
                        onClick={() => toggleFolder(folder.id)}
                        className={`
                          w-full p-4 rounded-2xl border-2 transition-all text-left
                          ${isSaved 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          {/* Folder Preview */}
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: folderColor }}
                          >
                            {folder.image_url ? (
                              <img src={folder.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <FolderPlus className="w-6 h-6 text-white" />
                            )}
                          </div>

                          {/* Folder Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{folder.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {folder.is_public ? '🌍 Public' : '🔒 Private'}
                            </p>
                          </div>

                          {/* Checkmark */}
                          <div className={`
                            w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                            ${isSaved ? 'bg-blue-500' : 'border-2 border-gray-300 dark:border-gray-600'}
                          `}>
                            {isSaved && <Check className="w-4 h-4 text-white" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

