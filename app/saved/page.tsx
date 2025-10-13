'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'
import { Star, ArrowLeft, Plus, FolderPlus, Edit2, Trash2, Move, X, Check } from 'lucide-react'
import Link from 'next/link'
import { SavedFoldersService, SavedFolder, SavedItem } from '@/services/savedFoldersService'
import { supabase } from '@/lib/supabase'

export default function SavedListingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [folders, setFolders] = useState<SavedFolder[]>([])
  const [savedItems, setSavedItems] = useState<SavedItem[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showEditFolder, setShowEditFolder] = useState(false)
  const [editingFolder, setEditingFolder] = useState<SavedFolder | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState('#84cc16')
  const [newFolderIcon, setNewFolderIcon] = useState('📁')
  const [movingItem, setMovingItem] = useState<string | null>(null)
  const [foldersAvailable, setFoldersAvailable] = useState(true) // Check if migration is run

  const folderColors = [
    { value: '#ef4444', name: 'Red' },
    { value: '#f97316', name: 'Orange' },
    { value: '#eab308', name: 'Yellow' },
    { value: '#84cc16', name: 'Lime' },
    { value: '#10b981', name: 'Green' },
    { value: '#06b6d4', name: 'Cyan' },
    { value: '#3b82f6', name: 'Blue' },
    { value: '#6366f1', name: 'Indigo' },
    { value: '#8b5cf6', name: 'Violet' },
    { value: '#a855f7', name: 'Purple' },
    { value: '#d946ef', name: 'Fuchsia' },
    { value: '#ec4899', name: 'Pink' },
    { value: '#f43f5e', name: 'Rose' },
    { value: '#64748b', name: 'Slate' },
    { value: '#78716c', name: 'Stone' },
    { value: '#1f2937', name: 'Gray' }
  ]

  const folderIconCategories = [
    { label: 'General', icons: ['📁', '⭐', '📌', '🔖', '💎', '✨', '🎯'] },
    { label: 'Music & Audio', icons: ['🎵', '🎶', '🎧', '🎸', '🎹', '🎤', '🎼'] },
    { label: 'Video & Media', icons: ['🎬', '📹', '📺', '🎥', '🎞️', '📽️', '🖼️'] },
    { label: 'Gaming', icons: ['🎮', '🕹️', '👾', '🎲', '🃏', '🎰', '🏆'] },
    { label: 'Travel & Stays', icons: ['✈️', '🏨', '🏖️', '🗺️', '🏝️', '🌍', '🧳'] },
    { label: 'Leisure & Fun', icons: ['🎉', '🎊', '🎈', '🎪', '🎭', '🎨', '🎠'] },
    { label: 'Business & Work', icons: ['💼', '📊', '💰', '📈', '🏢', '💻', '📱'] },
    { label: 'Shopping', icons: ['🛍️', '🛒', '💳', '🎁', '🏷️', '💝', '🎀'] },
    { label: 'Food & Drink', icons: ['🍔', '🍕', '☕', '🍰', '🍜', '🍷', '🍹'] },
    { label: 'Home & Living', icons: ['🏠', '🏡', '🛋️', '🪴', '🕯️', '🖼️', '🛏️'] },
    { label: 'Social & Friends', icons: ['👥', '👫', '🤝', '💬', '📱', '💌', '🎓'] },
    { label: 'Communities', icons: ['👨‍👩‍👧‍👦', '🌐', '🏘️', '🤲', '🫂', '💫', '🌟'] },
    { label: 'Favorites', icons: ['❤️', '💕', '💖', '💗', '💙', '💚', '🧡'] },
    { label: 'Fashion & Style', icons: ['👗', '👔', '👠', '👜', '💄', '👓', '⌚'] },
    { label: 'Sports & Fitness', icons: ['⚽', '🏀', '🏋️', '🧘', '🚴', '🏊', '⛷️'] },
    { label: 'Nature & Outdoors', icons: ['🌳', '🌸', '🌺', '🌻', '🦋', '🐝', '🌿'] },
    { label: 'Vehicles', icons: ['🚗', '🏎️', '🏍️', '🚲', '🛴', '✈️', '⛵'] },
    { label: 'Education', icons: ['📚', '📖', '✏️', '📝', '🎓', '🔬', '🧪'] },
    { label: 'Health & Wellness', icons: ['💊', '🏥', '🧘‍♀️', '🥗', '💆', '🧖', '🩺'] },
    { label: 'Pets & Animals', icons: ['🐶', '🐱', '🐹', '🐰', '🦊', '🐼', '🦁'] }
  ]

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    loadData()
  }, [user, router])

  useEffect(() => {
    if (foldersAvailable) {
      loadFolderItemsFromDB(selectedFolder)
    } else {
      loadFromLocalStorage()
    }
  }, [selectedFolder, foldersAvailable])

  const loadData = async () => {
    setLoading(true)
    
    // Try to load folders from database
    const result = await SavedFoldersService.getFolders()
    const hasDatabase = result.success && !result.error
    
    if (hasDatabase) {
      setFolders(result.folders)
      setFoldersAvailable(true)
    } else {
      setFoldersAvailable(false)
      console.warn('Folders not available - migration may not be run yet')
    }
    
    // Load items (now knows if folders are available)
    if (hasDatabase) {
      await loadFolderItemsFromDB(selectedFolder)
    } else {
      await loadFromLocalStorage()
    }
    
    setLoading(false)
  }

  const loadFolderItemsFromDB = async (folderId: string | null) => {
    console.log('📂 Loading items from DB for folder:', folderId || 'all')
    try {
      const result = await SavedFoldersService.getFolderItems(folderId)
      console.log('📥 DB Result:', result)
      
      if (result.success && result.items.length > 0) {
        console.log(`✅ Loaded ${result.items.length} items from database`)
        setSavedItems(result.items)
      } else if (result.success && result.items.length === 0) {
        // Database is available but no items - try localStorage
        console.log('📦 No items in DB, trying localStorage')
        await loadFromLocalStorage()
      } else {
        // Database error - fallback to localStorage
        console.log('⚠️ Database error, falling back to localStorage')
        await loadFromLocalStorage()
      }
    } catch (error) {
      console.warn('Could not load from database, falling back to localStorage', error)
      await loadFromLocalStorage()
    }
  }

  const loadFromLocalStorage = async () => {
    console.log('🔄 loadFromLocalStorage called')
    
    try {
      // Get saved post IDs from localStorage
      const savedPostsString = localStorage.getItem('savedPosts')
      console.log('📋 localStorage savedPosts:', savedPostsString)
      const savedPostIds = JSON.parse(savedPostsString || '[]')
      console.log('📋 Parsed savedPostIds:', savedPostIds, 'Count:', savedPostIds.length)
      
      if (savedPostIds.length === 0) {
        console.log('⚠️ No saved posts found in localStorage')
        setSavedItems([])
        return
      }

      console.log(`🔍 Fetching ${savedPostIds.length} posts from database...`)
      
      // Fetch the actual posts
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .in('id', savedPostIds)

      if (error) {
        console.error('❌ Error loading posts from database:', error)
        setSavedItems([])
        return
      }

      console.log(`✅ Loaded ${data?.length || 0} posts from database`)

      // Convert to SavedItem format
      const items = (data || []).map(post => ({
        id: post.id,
        user_id: user?.id || '',
        post_id: post.id,
        folder_id: null,
        created_at: post.created_at,
        post: post
      }))

      console.log('✅ Converted to SavedItem format:', items.length, 'items')
      console.log('📦 Setting savedItems state with:', items)
      setSavedItems(items)
    } catch (error) {
      console.error('❌ Error loading from localStorage:', error)
      setSavedItems([])
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    const result = await SavedFoldersService.createFolder(
      newFolderName,
      newFolderColor,
      newFolderIcon
    )

    if (result.success) {
      setShowCreateFolder(false)
      setNewFolderName('')
      setNewFolderColor('#84cc16')
      setNewFolderIcon('📁')
      loadData()
    } else {
      alert(result.error || 'Failed to create folder')
    }
  }

  const handleUpdateFolder = async () => {
    if (!editingFolder || !newFolderName.trim()) return

    const result = await SavedFoldersService.updateFolder(editingFolder.id, {
      name: newFolderName,
      color: newFolderColor,
      icon: newFolderIcon
    })

    if (result.success) {
      setShowEditFolder(false)
      setEditingFolder(null)
      setNewFolderName('')
      loadData()
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Delete this folder? Items will be moved to "All Saved"')) return

    const result = await SavedFoldersService.deleteFolder(folderId)
    if (result.success) {
      if (selectedFolder === folderId) {
        setSelectedFolder(null)
      }
      loadData()
    }
  }

  const handleUnsave = async (postId: string) => {
    try {
      // Try database first
      const result = await SavedFoldersService.unsavePost(postId)
      if (result.success) {
        setSavedItems(prev => prev.filter(item => item.post_id !== postId))
        loadData() // Refresh folder counts
        return
      }
    } catch (error) {
      console.warn('Database unsave failed, using localStorage')
    }
    
    // Fallback to localStorage
    const savedPostIds = JSON.parse(localStorage.getItem('savedPosts') || '[]')
    const newIds = savedPostIds.filter((id: string) => id !== postId)
    localStorage.setItem('savedPosts', JSON.stringify(newIds))
    setSavedItems(prev => prev.filter(item => item.post_id !== postId))
  }

  const handleMoveItem = async (postId: string, folderId: string | null) => {
    const result = await SavedFoldersService.moveToFolder(postId, folderId)
    if (result.success) {
      setMovingItem(null)
      loadFolderItemsFromDB(selectedFolder)
      loadData() // Refresh folder counts
    }
  }

  const startEditFolder = (folder: SavedFolder) => {
    setEditingFolder(folder)
    setNewFolderName(folder.name)
    setNewFolderColor(folder.color)
    setNewFolderIcon(folder.icon)
    setShowEditFolder(true)
  }

  if (!user) {
    return null
  }

  // Calculate total saved items
  const totalSaved = foldersAvailable 
    ? folders.reduce((sum, f) => sum + (f.item_count || 0), 0) + savedItems.filter(i => !i.folder_id).length
    : savedItems.length

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/hub')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-900 dark:text-gray-100" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Saved Listings</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {totalSaved} saved items 
                {savedItems.length > 0 && ` (showing ${savedItems.length})`}
              </p>
              <button 
                onClick={() => {
                  console.log('🔍 Debug Info:')
                  console.log('- savedItems:', savedItems)
                  console.log('- totalSaved:', totalSaved)
                  console.log('- localStorage savedPosts:', localStorage.getItem('savedPosts'))
                  console.log('- foldersAvailable:', foldersAvailable)
                  loadData()
                }}
                className="text-xs text-blue-500 hover:underline mt-1"
              >
                Debug & Refresh
              </button>
            </div>
          </div>
          {foldersAvailable && (
            <button
              onClick={() => setShowCreateFolder(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-lime-400 to-lime-300 text-black rounded-lg hover:brightness-95 transition-all shadow-sm"
            >
              <FolderPlus size={16} />
              New Folder
            </button>
          )}
        </div>

        {/* Folders */}
        {foldersAvailable && folders.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 overflow-x-auto pb-4">
            {/* All Saved */}
            <button
              onClick={() => setSelectedFolder(null)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                selectedFolder === null
                  ? 'bg-gradient-to-r from-lime-400 to-lime-300 text-black shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-xl">📋</span>
              <div className="text-left">
                <div className="font-semibold text-sm">All Saved</div>
                <div className="text-xs opacity-75">{totalSaved} items</div>
              </div>
            </button>

            {/* User Folders */}
            {folders.map((folder) => (
              <div key={folder.id} className="relative group">
                <button
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                    selectedFolder === folder.id
                      ? 'bg-gradient-to-r from-lime-400 to-lime-300 text-black shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  style={{
                    backgroundColor: selectedFolder === folder.id ? undefined : `${folder.color}15`
                  }}
                >
                  <span className="text-xl">{folder.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold text-sm">{folder.name}</div>
                    <div className="text-xs opacity-75">{folder.item_count || 0} items</div>
                  </div>
                </button>

                {/* Folder Actions */}
                <div className="absolute top-0 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEditFolder(folder)}
                    className="p-1 bg-white dark:bg-gray-700 rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <Edit2 size={12} className="text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="p-1 bg-white dark:bg-gray-700 rounded-full shadow-sm hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={12} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg"></div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && savedItems.length === 0 && (
          <div className="text-center py-20">
            <Star size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {selectedFolder ? 'No items in this folder' : 'No saved listings yet'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Start saving listings you like</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gradient-to-r from-lime-400 to-lime-300 text-black rounded-lg hover:brightness-95 transition-colors"
            >
              Browse Listings
            </button>
          </div>
        )}

        {/* Saved Listings Grid */}
        {!loading && savedItems.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {savedItems.map((item) => (
              <div key={item.id} className="group relative">
                <Link href={`/listing/${item.post_id}`}>
                  <div className="aspect-square overflow-hidden bg-gray-200 dark:bg-gray-700 relative rounded-lg">
                    {item.post?.media_url ? (
                      <img
                        src={item.post.media_url}
                        alt={item.post.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-4xl">
                        📦
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="absolute top-2 right-2 flex gap-2 z-10">
                      {foldersAvailable && folders.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setMovingItem(movingItem === item.post_id ? null : item.post_id)
                          }}
                          className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-sm"
                        >
                          <Move size={14} className="text-gray-700 dark:text-gray-300" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleUnsave(item.post_id)
                        }}
                        className="p-2 hover:scale-110 transition-all"
                        title="Unsave"
                      >
                        <Star size={16} className="fill-yellow-400 text-yellow-400" />
                      </button>
                    </div>

                    {/* Move to Folder Menu */}
                    {movingItem === item.post_id && (
                      <div 
                        className="absolute top-12 right-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-2 z-20 min-w-[200px]"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                      >
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
                          Move to folder
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleMoveItem(item.post_id, null)
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-gray-700 dark:text-gray-300"
                        >
                          <span>📋</span> All Saved
                        </button>
                        {folders.map((folder) => (
                          <button
                            key={folder.id}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleMoveItem(item.post_id, folder.id)
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-gray-700 dark:text-gray-300"
                          >
                            <span>{folder.icon}</span> {folder.name}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Info Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                      <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                        {item.post?.title}
                      </h3>
                      {item.post?.price_amount && (
                        <p className="text-lime-400 text-xs font-semibold">
                          {item.post.price_amount} {item.post.currency || 'EUR'}
                        </p>
                      )}
                      {item.post?.location && (
                        <p className="text-gray-300 text-xs truncate mt-1">
                          📍 {item.post.location}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-80 max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">New Folder</h2>
              <button
                onClick={() => setShowCreateFolder(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Folder Name */}
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-lime-500"
                autoFocus
              />

              {/* Icons - Compact Grid */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wide">
                  Icon
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {folderIconCategories.map((category) => (
                    <div key={category.label}>
                      <div className="text-[9px] font-medium text-gray-400 dark:text-gray-500 mb-0.5 uppercase tracking-wide">
                        {category.label}
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {category.icons.map((icon) => (
                          <button
                            key={icon}
                            onClick={() => setNewFolderIcon(icon)}
                            className={`text-sm p-1 rounded transition-all ${
                              newFolderIcon === icon
                                ? 'bg-gradient-to-r from-lime-400 to-lime-300 scale-110 shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colors - Square Grid */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wide">
                  Color
                </label>
                <div className="grid grid-cols-8 gap-1.5">
                  {folderColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewFolderColor(color.value)}
                      className={`w-full aspect-square rounded transition-all ${
                        newFolderColor === color.value 
                          ? 'ring-2 ring-lime-400 scale-110 shadow-md' 
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-3 py-2.5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowCreateFolder(false)}
                className="flex-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="flex-1 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-lime-400 to-lime-300 text-black rounded hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Folder Modal */}
      {showEditFolder && editingFolder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-80 max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Edit Folder</h2>
              <button
                onClick={() => setShowEditFolder(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Folder Name */}
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-lime-500"
                autoFocus
              />

              {/* Icons - Compact Grid */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wide">
                  Icon
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {folderIconCategories.map((category) => (
                    <div key={category.label}>
                      <div className="text-[9px] font-medium text-gray-400 dark:text-gray-500 mb-0.5 uppercase tracking-wide">
                        {category.label}
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {category.icons.map((icon) => (
                          <button
                            key={icon}
                            onClick={() => setNewFolderIcon(icon)}
                            className={`text-sm p-1 rounded transition-all ${
                              newFolderIcon === icon
                                ? 'bg-gradient-to-r from-lime-400 to-lime-300 scale-110 shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colors - Square Grid */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 mb-1.5 uppercase tracking-wide">
                  Color
                </label>
                <div className="grid grid-cols-8 gap-1.5">
                  {folderColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewFolderColor(color.value)}
                      className={`w-full aspect-square rounded transition-all ${
                        newFolderColor === color.value 
                          ? 'ring-2 ring-lime-400 scale-110 shadow-md' 
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-3 py-2.5 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowEditFolder(false)}
                className="flex-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateFolder}
                disabled={!newFolderName.trim()}
                className="flex-1 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-lime-400 to-lime-300 text-black rounded hover:brightness-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
      <BottomNav />
    </div>
  )
}
