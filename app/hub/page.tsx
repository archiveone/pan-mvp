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
import { getUserPosts, getSavedPosts } from '@/services/userHubService';
import { MessagingService, Conversation } from '@/services/messagingService';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Utility to calculate brightness and determine text color
const getTextColor = (hexColor?: string): string => {
  if (!hexColor) return 'white';
  
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance using the formula
  // https://www.w3.org/TR/WCAG20/#relativeluminancedef
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // If luminance > 0.5, use dark text; otherwise use light text
  return luminance > 0.5 ? '#1F2937' : '#FFFFFF';
};

export default function AdvancedHub() {
  const { user, profile, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [hubBoxes, setHubBoxes] = useState<HubBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingBox, setEditingBox] = useState<HubBox | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [boxTypeSelection, setBoxTypeSelection] = useState(false);
  const [selectedBoxType, setSelectedBoxType] = useState<string>('custom');
  
  // Box content data
  const [boxContent, setBoxContent] = useState<Record<string, any>>({});
  
  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    bio: '',
    avatar: '',
    profileBoxColor: '#3B82F6',
    profileBoxImage: ''
  });
  const [profileBoxMode, setProfileBoxMode] = useState<'image' | 'color'>('color');
  const profileBoxFileInputRef = React.useRef<HTMLInputElement>(null);
  const avatarFileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadProfileData();
    loadHubBoxes();
  }, [user, profile]);

  const loadProfileData = async () => {
    if (!user) return;

    // Use profile from AuthContext (already loaded and correct!)
    if (profile) {
      setProfileData({
        name: profile.name || '',
        username: profile.username || profile.handle || '',
        bio: profile.bio || '',
        avatar: profile.avatar_url || '',
        profileBoxColor: (profile as any).profile_box_color || '#3B82F6',
        profileBoxImage: (profile as any).profile_box_image || ''
      });
      setProfileBoxMode((profile as any).profile_box_image ? 'image' : 'color');
    }
  };

  const loadHubBoxes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await AdvancedHubService.initializeDefaultBoxes(user.id);
      const result = await AdvancedHubService.getUserHubBoxes(user.id);
      if (result.success && result.data) {
        setHubBoxes(result.data);
        
        // Load content for each box type
        await loadBoxContent(result.data);
      }
    } catch (error) {
      console.error('Error loading hub boxes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBoxContent = async (boxes: HubBox[]) => {
    const content: Record<string, any> = {};

    await Promise.all(
      boxes.map(async (box) => {
        try {
          // Special case: "My Listings" shows ALL user's posts
          if (box.title === 'My Listings' || (box.box_type === 'posts' && !box.instance_name)) {
            console.log('📤 Loading ALL posts for "My Listings"...');
            
            const { data: userPosts, error } = await supabase
              .from('posts')
              .select('*')
              .eq('user_id', user!.id)
              .order('created_at', { ascending: false });

            if (!error && userPosts) {
              const images = userPosts
                .filter((p: any) => p.media_url)
                .slice(0, 8)
                .map((p: any) => p.media_url);

              content[box.id] = {
                type: 'posts',
                items: userPosts,
                images: images
              };
              
              console.log(`✅ "My Listings": ${userPosts.length} posts, ${images.length} with images`);
            } else {
              console.error('❌ Error loading user posts:', error);
              content[box.id] = { type: 'posts', items: [], images: [] };
            }
          } else {
            // All other boxes: load ONLY saved items from hub_box_items
            console.log(`📦 Loading saved items for box: ${box.title}`);
            const itemsResult = await AdvancedHubService.getBoxItems(box.id);
            
            if (itemsResult.success && itemsResult.data) {
              const items = itemsResult.data;
              
              // Extract images from items for grid display
              const images = items
                .filter((item: any) => item.posts?.media_url)
                .slice(0, 8)
                .map((item: any) => item.posts.media_url);

              content[box.id] = {
                type: box.box_type,
                items: items,
                images: images
              };
              
              console.log(`✅ Box "${box.title}": ${items.length} items, ${images.length} with images`);
            } else {
              // Empty box
              content[box.id] = { 
                type: box.box_type, 
                items: [], 
                images: [] 
              };
            }
          }

          // Special handling for inbox - load conversations
          if (box.box_type === 'inbox') {
            // Check if this is the default "Messages" inbox (no instance_name)
            const isDefaultInbox = !box.instance_name && (box.title === 'Messages' || box.title === 'Inbox');
            
            if (isDefaultInbox) {
              // Default inbox shows ALL conversations
              console.log('📬 Loading all conversations for default inbox...');
              try {
                const conversations = await MessagingService.getUserConversations();
                if (Array.isArray(conversations)) {
                  content[box.id] = {
                    ...content[box.id],
                    conversations: conversations.slice(0, 3)
                  };
                  console.log(`✅ Default inbox: ${conversations.length} conversations`);
                }
              } catch (error) {
                console.warn('Could not load conversations:', error);
              }
            } else {
              // Custom inbox boxes - load assigned conversations
              console.log(`📭 Loading assigned conversations for custom inbox "${box.title}"...`);
              try {
                // Get conversation IDs assigned to this inbox
                const assignedResult = await AdvancedHubService.getInboxConversations(box.id);
                
                if (assignedResult.success && assignedResult.data && assignedResult.data.length > 0) {
                  // Load full conversation data
                  const allConversations = await MessagingService.getUserConversations();
                  
                  if (Array.isArray(allConversations)) {
                    // Filter to only assigned conversations
                    const assignedConversations = allConversations.filter(conv => 
                      assignedResult.data?.includes(conv.id)
                    );
                    
                    content[box.id] = {
                      ...content[box.id],
                      conversations: assignedConversations.slice(0, 3)
                    };
                    
                    console.log(`✅ Custom inbox "${box.title}": ${assignedConversations.length} conversations`);
                  }
                } else {
                  // No conversations assigned yet
                  content[box.id] = {
                    ...content[box.id],
                    conversations: []
                  };
                  console.log(`📭 Custom inbox "${box.title}": 0 conversations (none assigned yet)`);
                }
              } catch (error) {
                console.warn('Could not load assigned conversations:', error);
                content[box.id] = {
                  ...content[box.id],
                  conversations: []
                };
              }
            }
          }
        } catch (error) {
          console.error(`Error loading content for box ${box.id}:`, error);
          content[box.id] = { type: box.box_type, items: [], images: [] };
        }
      })
    );

    setBoxContent(content);
  };

  const handleEditBox = (box: HubBox, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingBox(box);
    setIsNew(false);
    setShowEditor(true);
  };

  const handleCreateBox = () => {
    setBoxTypeSelection(true);
  };

  const handleBoxTypeSelected = (type: string) => {
    setSelectedBoxType(type);
    setBoxTypeSelection(false);
    setEditingBox(null);
    setIsNew(true);
    setShowEditor(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      let uploadedBoxImageUrl = profileData.profileBoxImage;
      let uploadedAvatarUrl = profileData.avatar;

      // Handle avatar upload if it's a blob URL
      if (profileData.avatar && profileData.avatar.startsWith('blob:')) {
        const response = await fetch(profileData.avatar);
        const blob = await response.blob();
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        
        const uploadResult = await ImageService.uploadImage(file, 'content-images', 'avatars');
        if (uploadResult.success && uploadResult.url) {
          uploadedAvatarUrl = uploadResult.url;
        } else {
          alert('Avatar upload failed');
          return;
        }
      }

      // Handle profile box background image upload if it's a blob URL
      if (profileData.profileBoxImage && profileData.profileBoxImage.startsWith('blob:')) {
        const response = await fetch(profileData.profileBoxImage);
        const blob = await response.blob();
        const file = new File([blob], 'profile-bg.jpg', { type: 'image/jpeg' });
        
        const uploadResult = await ImageService.uploadImage(file, 'content-images', 'profile-backgrounds');
        if (uploadResult.success && uploadResult.url) {
          uploadedBoxImageUrl = uploadResult.url;
        } else {
          alert('Background image upload failed');
          return;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          username: profileData.username,
          bio: profileData.bio,
          avatar_url: uploadedAvatarUrl,
          profile_box_color: profileBoxMode === 'color' ? profileData.profileBoxColor : null,
          profile_box_image: profileBoxMode === 'image' ? uploadedBoxImageUrl : null
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setIsEditingProfile(false);
      
      // Refresh profile from AuthContext
      if (refreshProfile) {
        await refreshProfile();
      }
      
      loadProfileData();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    }
  };

  const handleSaveEditor = async (data: { title: string; color?: string; imageUrl?: string; isPublic?: boolean }) => {
    try {
      let uploadedImageUrl = data.imageUrl;

      // Handle image upload if it's a blob URL
      if (data.imageUrl && data.imageUrl.startsWith('blob:')) {
        const response = await fetch(data.imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' });
        
        const uploadResult = await ImageService.uploadImage(file, 'content-images', 'hub-boxes');
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
          icon: selectedBoxType === 'chat_group' ? 'MessageCircle' : 'Folder',
          is_public: data.isPublic || false
        });
        
        if (!result.success) {
          alert(result.error || 'Failed to create box');
          return;
        }
      } else if (editingBox) {
        const result = await AdvancedHubService.updateHubBox(editingBox.id, {
          title: data.title,
          custom_color: data.color,
          color_type: uploadedImageUrl ? 'preset' : 'custom',
          image_url: uploadedImageUrl,
          is_public: data.isPublic
        });
        
        if (!result.success) {
          alert(result.error || 'Failed to update box');
          return;
        }
      }
      
      setShowEditor(false);
      setEditingBox(null);
      loadHubBoxes();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save');
    }
  };

  const handleDeleteBox = async () => {
    if (!editingBox) return;
    
    // Only protect boxes marked as non-deletable (just "My Listings" now)
    if (!editingBox.is_deletable) {
      alert(`"${editingBox.title}" cannot be deleted. You can customize it or duplicate it instead!`);
      return;
    }
    
    try {
      const result = await AdvancedHubService.deleteHubBox(editingBox.id);
      if (result.success) {
        setShowEditor(false);
        setEditingBox(null);
        loadHubBoxes();
      } else {
        alert(result.error || 'Failed to delete');
      }
    } catch (error) {
      alert('Failed to delete');
    }
  };

  const handleLayoutChange = async (layout: Layout[]) => {
    if (!layout || layout.length === 0) return;
    
    try {
      await Promise.all(
        layout.map(item => {
          const box = hubBoxes.find(b => b.id === item.i);
          if (!box) return Promise.resolve();
          
          return AdvancedHubService.updateHubBox(item.i, {
            settings: { 
              ...box.settings,
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

  const handleBoxClick = (box: HubBox) => {
    // Special navigation for inbox boxes
    if (box.box_type === 'inbox') {
      // Check if it's the default inbox or a custom one
      const isDefaultInbox = !box.instance_name && (box.title === 'Messages' || box.title === 'Inbox');
      
      if (isDefaultInbox) {
        // Default inbox - show all conversations (main inbox page)
        router.push('/inbox');
      } else {
        // Custom inbox - each has its OWN independent inbox page
        router.push(`/inbox/${box.id}`);
      }
      return;
    }
    
    // Navigate to box detail page for all other boxes
    router.push(`/hub/box/${box.id}`);
  };

  // TEST FUNCTION - Remove after debugging
  const testSaveFunction = async () => {
    console.log('🧪 TEST: Attempting to save a test item...');
    
    // Get first box
    const firstBox = hubBoxes[0];
    if (!firstBox) {
      alert('No boxes found! Create a box first.');
      return;
    }
    
    // Try to save a test item
    const testItemId = '00000000-0000-0000-0000-000000000001'; // Fake ID for testing
    console.log(`🧪 Saving test item ${testItemId} to box: ${firstBox.title}`);
    
    const result = await AdvancedHubService.addItemToBox(firstBox.id, testItemId, 'post');
    console.log('🧪 TEST RESULT:', result);
    
    if (result.success) {
      alert(`✅ SUCCESS! Saved to ${firstBox.title}. Check console for details.`);
    } else {
      alert(`❌ FAILED: ${result.error}. Check console for details.`);
    }
  };

  const layouts = {
    lg: hubBoxes.map((box, index) => ({
      i: box.id,
      x: box.settings?.grid?.x ?? (index % 2),
      y: box.settings?.grid?.y ?? Math.floor(index / 2),
      w: box.settings?.grid?.w ?? 1,
      h: box.settings?.grid?.h ?? 1,
      minW: 1,
      minH: 1,
      maxW: 2,
      maxH: 2
    }))
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Please sign in to access your hub</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {/* Profile Header */}
        <div 
          className="relative overflow-hidden rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 mb-8"
          style={
            profileBoxMode === 'image' && profileData.profileBoxImage
              ? {
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${profileData.profileBoxImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }
              : {
                  background: `linear-gradient(135deg, ${profileData.profileBoxColor}, ${profileData.profileBoxColor}DD)`
                }
          }
        >
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Profile Image (Avatar) */}
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-xl cursor-pointer" onClick={() => isEditingProfile && avatarFileInputRef.current?.click()}>
                  {profileData.avatar ? (
                    <img 
                      src={profileData.avatar} 
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icons.User className="w-12 h-12 text-white" />
                  )}
                </div>
                {isEditingProfile && (
                  <button
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 bg-blue-500 hover:bg-blue-600 rounded-full p-2 shadow-lg transition-colors"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                )}
                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setProfileData({...profileData, avatar: URL.createObjectURL(file)});
                    }
                  }}
                  className="hidden"
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0 w-full sm:w-auto">
                {isEditingProfile ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      placeholder="Your name"
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border-2 border-blue-500 rounded-xl text-gray-900 dark:text-white font-semibold"
                    />
                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                      placeholder="@username"
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300"
                    />
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      placeholder="Bio..."
                      rows={2}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 resize-none"
                    />
                    
                    {/* Profile Box Background Customization */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Box Background</p>
                      <div className="flex gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setProfileBoxMode('color')}
                          className={`flex-1 py-2 rounded-xl font-medium text-sm transition-colors ${
                            profileBoxMode === 'color'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          Color
                        </button>
                        <button
                          type="button"
                          onClick={() => setProfileBoxMode('image')}
                          className={`flex-1 py-2 rounded-xl font-medium text-sm transition-colors ${
                            profileBoxMode === 'image'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          Image
                        </button>
                      </div>

                      {profileBoxMode === 'color' ? (
                        <input
                          type="color"
                          value={profileData.profileBoxColor}
                          onChange={(e) => setProfileData({...profileData, profileBoxColor: e.target.value})}
                          className="w-full h-12 rounded-xl cursor-pointer"
                        />
                      ) : (
                        <button
                          onClick={() => profileBoxFileInputRef.current?.click()}
                          className="w-full py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          {profileData.profileBoxImage ? 'Change Background' : 'Upload Background'}
                        </button>
                      )}
                      <input
                        ref={profileBoxFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setProfileData({...profileData, profileBoxImage: URL.createObjectURL(file)});
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProfile}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingProfile(false);
                          loadProfileData(); // Reset to saved data
                        }}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                        {profileData.name || 'Your Name'}
                      </h1>
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    {profileData.username && (
                      <p className="text-white/90 text-sm mb-2 drop-shadow">
                        @{profileData.username}
                      </p>
                    )}
                    {profileData.bio && (
                      <p className="text-white/80 text-sm drop-shadow">
                        {profileData.bio}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Draggable Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading your hub...</p>
          </div>
        ) : hubBoxes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No boxes yet</p>
            <button
              onClick={handleCreateBox}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Your First Collection
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
            {hubBoxes.map(box => {
              const IconComponent = (Icons as any)[box.icon] || Icons.Folder;
              const bgStyle = box.image_url
                ? {
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${box.image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }
                : box.custom_color
                ? { backgroundColor: box.custom_color }
                : { background: 'linear-gradient(135deg, #3B82F6, #06B6D4)' };
              
              // Determine text color based on background (only for solid colors)
              const textColor = box.image_url ? '#FFFFFF' : getTextColor(box.custom_color || '#3B82F6');
              const isLightBg = textColor === '#1F2937';
              
              return (
                <div key={box.id} className="relative group h-full">
                  <div
                    className="h-full rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden cursor-pointer"
                    style={bgStyle}
                    onClick={() => handleBoxClick(box)}
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
                          <h3 className="text-xl font-bold mb-1 truncate" style={{ color: textColor }}>{box.title}</h3>
                          <p className="text-sm" style={{ color: textColor, opacity: 0.7 }}>
                            {box.box_type === 'inbox' 
                              ? `${boxContent[box.id]?.conversations?.length || 0} chats`
                              : `${boxContent[box.id]?.items?.length || 0} items`
                            }
                          </p>
                        </div>
                        
                        <div className="relative flex-shrink-0 ml-3">
                          <div className={`${isLightBg ? 'bg-gray-900/10' : 'bg-white/20'} backdrop-blur-sm rounded-xl p-2.5`}>
                            <IconComponent className="w-6 h-6" style={{ color: textColor }} />
                          </div>
                          <button
                            onClick={(e) => handleEditBox(box, e)}
                            className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-105 z-10"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-gray-900" />
                          </button>
                        </div>
                      </div>

                      {/* Box Content Preview */}
                      <div className="flex-1 min-h-0 mb-2">
                        {box.box_type === 'inbox' || box.box_type === 'chat_group' ? (
                          /* Conversation List for Inbox/Chats */
                          <div className="space-y-2">
                            {boxContent[box.id]?.conversations?.map((conv: Conversation) => {
                              const otherUser = conv.participants?.find((p: any) => p.user_id !== user.id);
                              const isGroup = (conv as any).is_group_chat;
                              const groupName = (conv as any).group_name;
                              const groupImage = (conv as any).group_image_url;
                              const memberCount = conv.participants?.length || 0;
                              
                              return (
                                <div key={conv.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 flex items-center gap-2">
                                  {/* Avatar */}
                                  <div className="relative w-8 h-8 rounded-full flex-shrink-0">
                                    {isGroup ? (
                                      /* Group Avatar */
                                      <div className={`w-full h-full rounded-full overflow-hidden ${
                                        groupImage ? 'bg-transparent' : 'bg-gradient-to-br from-blue-400 to-purple-500'
                                      }`}>
                                        {groupImage ? (
                                          <img src={groupImage} alt={groupName || 'Group'} className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                            </svg>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      /* Direct Message Avatar */
                                      <div className="w-full h-full rounded-full bg-white/20 overflow-hidden">
                                        {otherUser?.profile?.avatar_url ? (
                                          <img src={otherUser.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-white text-xs">
                                            {otherUser?.profile?.name?.charAt(0) || '?'}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {/* Group Badge */}
                                    {isGroup && (
                                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center border border-white">
                                        <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate" style={{ color: textColor }}>
                                      {isGroup ? groupName || 'Group Chat' : (otherUser?.profile?.name || 'User')}
                                    </p>
                                    <p className="text-xs truncate" style={{ color: textColor, opacity: 0.6 }}>
                                      {isGroup && `${memberCount} members • `}
                                      {conv.last_message?.preview || 'No messages'}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                            {(!boxContent[box.id]?.conversations || boxContent[box.id].conversations.length === 0) && (
                              <div className={`${isLightBg ? 'bg-gray-900/10' : 'bg-white/10'} backdrop-blur-sm rounded-lg p-4 text-center`}>
                                <p className="text-sm" style={{ color: textColor, opacity: 0.6 }}>
                                  {box.title === 'Messages' || box.title === 'Inbox' ? 'No conversations yet' : 'Assign chats to this inbox'}
                                </p>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* Image Grid for ALL other types (posts, saved, custom, etc.) */
                          boxContent[box.id]?.images && boxContent[box.id].images.length > 0 ? (
                            <div className="grid grid-cols-4 gap-1 h-full">
                              {boxContent[box.id].images.map((img: string, idx: number) => (
                                <div key={idx} className="aspect-square bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
                                  <img src={img} alt="" className="w-full h-full object-cover" />
                                </div>
                              ))}
                              {Array.from({ length: Math.max(0, 8 - boxContent[box.id].images.length) }).map((_, idx) => (
                                <div key={`empty-${idx}`} className="aspect-square bg-white/5 backdrop-blur-sm rounded-lg" />
                              ))}
                            </div>
                          ) : (
                            /* Empty state */
                            <div className={`${isLightBg ? 'bg-gray-900/10' : 'bg-white/10'} backdrop-blur-sm rounded-lg p-4 text-center h-full flex items-center justify-center`}>
                              <p className="text-sm" style={{ color: textColor, opacity: 0.6 }}>
                                {boxContent[box.id]?.items?.length || 0} items
                              </p>
                            </div>
                          )
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

        {/* Add Hub Box - Fixed Button Below Grid */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleCreateBox}
            className="w-64 h-64 rounded-2xl border-4 border-dashed border-lime-400 hover:border-lime-300 hover:bg-lime-400/10 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer active:scale-95"
          >
            <div className="w-20 h-20 rounded-full bg-lime-400 hover:bg-lime-300 flex items-center justify-center transition-colors shadow-lg">
              <Plus className="w-10 h-10 text-black" />
            </div>
            <p className="text-base font-bold text-gray-700 dark:text-gray-300">Add Hub Box</p>
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

      {/* Box Type Selection */}
      {boxTypeSelection && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Choose Collection Type</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Organize your posts, saves, and conversations</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => handleBoxTypeSelected('saved')}
                className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 hover:from-pink-100 hover:to-rose-100 dark:hover:from-pink-900/30 dark:hover:to-rose-900/30 rounded-2xl transition-all active:scale-95"
              >
                <Icons.Bookmark className="w-8 h-8 text-pink-600 dark:text-pink-400 mx-auto mb-2" />
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Saved Listings</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Others' posts & listings</p>
              </button>
              
              <button
                onClick={() => handleBoxTypeSelected('posts')}
                className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 rounded-2xl transition-all active:scale-95"
              >
                <Icons.Grid3x3 className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="font-semibold text-gray-900 dark:text-white text-sm">My Posts</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Organize your own posts</p>
              </button>
              
              <button
                onClick={() => handleBoxTypeSelected('inbox')}
                className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 rounded-2xl transition-all active:scale-95"
              >
                <Icons.MessageCircle className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Messages</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Work, Friends, Family...</p>
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
          setEditingBox(null);
        }}
        onSave={handleSaveEditor}
        onDelete={
          !isNew && editingBox && editingBox.is_deletable
            ? handleDeleteBox 
            : undefined
        }
        initialData={editingBox ? {
          title: editingBox.title,
          color: editingBox.custom_color,
          imageUrl: editingBox.image_url,
          isPublic: editingBox.is_public
        } : undefined}
        isNew={isNew}
      />

      <AppFooter />
      <BottomNav />
    </div>
  );
}

