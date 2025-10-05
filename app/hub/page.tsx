'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import BottomNav from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import { 
  getUserPosts, 
  getSavedPosts, 
  getUserGroups, 
  getPortfolioFiles, 
  getUserAnalytics,
  updateUserProfile,
  savePost,
  unsavePost,
  joinGroup,
  leaveGroup,
  uploadPortfolioFile,
  deletePortfolioFile
} from '@/services/userHubService';
import { User, Edit3, Heart, Users, FileText, Upload, Settings, Camera, X, Save, Check, LogOut, Trash2, Moon, Sun, Shield, Bell, Palette } from 'lucide-react';

export default function UserHub() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [savedListings, setSavedListings] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [portfolioFiles, setPortfolioFiles] = useState<any[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.user_metadata?.full_name || '',
    username: (profile as any)?.username || '',
    bio: profile?.bio || '',
    avatar: user?.user_metadata?.avatar_url || profile?.avatar_url || ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    // Load user data
    loadUserData();
  }, [user, router]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      // Load user's posts
      const postsResult = await getUserPosts(user.id);
      if (postsResult.success) {
        setUserPosts(postsResult.data || []);
      } else {
        console.warn('Failed to load posts:', postsResult.error);
      }

      // Load saved listings
      const savedResult = await getSavedPosts(user.id);
      if (savedResult.success) {
        setSavedListings(savedResult.data || []);
      } else {
        console.warn('Failed to load saved posts:', savedResult.error);
      }

      // Load user groups
      const groupsResult = await getUserGroups(user.id);
      if (groupsResult.success) {
        setUserGroups(groupsResult.data || []);
      } else {
        console.warn('Failed to load groups:', groupsResult.error);
      }

      // Load portfolio files
      const filesResult = await getPortfolioFiles(user.id);
      if (filesResult.success) {
        setPortfolioFiles(filesResult.data || []);
      } else {
        console.warn('Failed to load portfolio files:', filesResult.error);
      }

    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingImage(true);
    try {
      // Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `avatars/${user.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pan-uploads')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pan-uploads')
        .getPublicUrl(fileName);

      // Update profile data
      setProfileData({...profileData, avatar: publicUrl});
      
    } catch (error) {
      console.error('Error uploading image:', error);
      (window as any).addNotification?.({
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload profile image'
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      console.log('Saving profile with data:', {
        username: profileData.username,
        bio: profileData.bio,
        avatar_url: profileData.avatar
      });

      const result = await updateUserProfile(user.id, {
        username: profileData.username,
        bio: profileData.bio,
        avatar_url: profileData.avatar,
        name: profileData.username // Add name field for compatibility
      });

      if (result.success) {
        setIsEditingProfile(false);
        (window as any).addNotification?.({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your profile has been saved successfully'
        });
        // Reload user data
        loadUserData();
      } else {
        console.error('Profile update failed:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      (window as any).addNotification?.({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save profile changes'
      });
    }
  };

  const handleBentoClick = (type: string) => {
    switch (type) {
      case 'posts':
        // Navigate to user's posts page
        router.push('/my-posts');
        break;
      case 'saved':
        // Navigate to saved posts page
        router.push('/saved');
        break;
      case 'groups':
        // Navigate to groups page
        router.push('/groups');
        break;
      case 'portfolio':
        // Navigate to portfolio page
        router.push('/portfolio');
        break;
      default:
        break;
    }
  };

  const handleLogout = async () => {
    try {
      const { signOut } = useAuth();
      await signOut();
      (window as any).addNotification?.({
        type: 'success',
        title: 'Signed Out',
        message: 'You have been signed out successfully'
      });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      (window as any).addNotification?.({
        type: 'error',
        title: 'Logout Failed',
        message: 'Failed to sign out. Please try again.'
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    try {
      // This would typically call a delete account API
      // For now, we'll just sign out and show a message
      await handleLogout();
      (window as any).addNotification?.({
        type: 'info',
        title: 'Account Deletion',
        message: 'Account deletion feature coming soon. For now, you have been signed out.'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      (window as any).addNotification?.({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete account. Please try again.'
      });
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Toggle dark mode class on document
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save preference to localStorage
    localStorage.setItem('darkMode', (!isDarkMode).toString());
  };

  // Load dark mode preference on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Please sign in to access your hub</div>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
        <div className="min-h-screen profile-dashboard bg-white dark:bg-gray-900">
      <AppHeader />
      
      <main className="main-content max-w-6xl mx-auto px-4 py-6 pb-20">
        {/* Profile Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-3xl shadow-lg border border-gray-100 mb-8">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-400 to-purple-400 rounded-full translate-y-24 -translate-x-24"></div>
          </div>
          
          <div className="relative p-8">
            <div className="flex items-start gap-8">
              {/* Profile Image */}
              <div className="relative group">
                <div className="relative">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center hover:scale-105 transition-all duration-300 shadow-xl group-hover:shadow-2xl"
                    disabled={isUploadingImage}
                  >
                    {profileData.avatar ? (
                      <img 
                        src={profileData.avatar} 
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-white" />
                    )}
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      </div>
                    )}
                  </button>
                  
                  {/* Camera Icon Overlay */}
                  <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-3 shadow-lg border-2 border-gray-100 group-hover:scale-110 transition-transform">
                    <Camera className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
                
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Profile Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
                        placeholder="Your name"
                        autoFocus
                      />
                    ) : (
                      <h1 
                        className="text-3xl font-bold text-gray-900 cursor-pointer hover:bg-white/50 px-3 py-2 rounded-xl transition-all duration-200"
                        onClick={() => setIsEditingProfile(true)}
                      >
                        {profileData.name || 'Your Name'}
                      </h1>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-gray-500">@</span>
                      {isEditingProfile ? (
                        <input
                          type="text"
                          value={profileData.username}
                          onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                          className="text-lg text-gray-600 bg-transparent border-b border-blue-500 focus:outline-none"
                          placeholder="username"
                        />
                      ) : (
                        <span className="text-lg text-gray-600 cursor-pointer hover:bg-white/50 px-2 py-1 rounded transition-colors">
                          {profileData.username || 'username'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                      <div className="flex items-center gap-2">
                        {/* Dark Mode Toggle */}
                        <button 
                          onClick={toggleDarkMode}
                          className="p-3 hover:bg-white/50 rounded-xl transition-all duration-200 group"
                          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                          {isDarkMode ? (
                            <Sun className="w-5 h-5 text-yellow-600 group-hover:text-yellow-700 transition-colors" />
                          ) : (
                            <Moon className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
                          )}
                        </button>

                        {/* Settings Button */}
                        <button 
                          onClick={() => setShowSettings(!showSettings)}
                          className="p-3 hover:bg-white/50 rounded-xl transition-all duration-200 group"
                          title="Settings"
                        >
                          <Settings className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
                        </button>
                      </div>
                </div>
                
                {isEditingProfile ? (
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    className="w-full text-gray-600 bg-white/50 border-2 border-blue-500 rounded-xl p-4 focus:outline-none resize-none backdrop-blur-sm"
                    placeholder="Add a bio to tell people about yourself..."
                    rows={3}
                  />
                ) : (
                  <p 
                    className="text-gray-600 text-lg cursor-pointer hover:bg-white/50 px-3 py-2 rounded-xl transition-all duration-200"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    {profileData.bio || 'Add a bio to tell people about yourself...'}
                  </p>
                )}

                {isEditingProfile && (
                  <div className="flex gap-3 mt-6">
                    <button 
                      onClick={handleSaveProfile}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <Check className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button 
                      onClick={() => {
                        setProfileData({
                          name: user?.user_metadata?.full_name || '',
                          username: (profile as any)?.username || '',
                          bio: profile?.bio || '',
                          avatar: user?.user_metadata?.avatar_url || profile?.avatar_url || ''
                        });
                        setIsEditingProfile(false);
                      }}
                      className="bg-white/50 text-gray-700 px-6 py-3 rounded-xl hover:bg-white/70 transition-all duration-200 flex items-center gap-2 border border-gray-200"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bento Box Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* My Posts */}
          <div 
            onClick={() => handleBentoClick('posts')}
            className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
          >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors"></div>
            <div className="relative p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 group-hover:bg-white/30 transition-colors">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <div className="text-white/60 text-sm">
                  {userPosts.length} posts
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">My Posts</h3>
              <p className="text-white/80 text-lg mb-4">Your marketplace posts</p>
              
              {/* Recent Posts Preview */}
              <div className="space-y-2 mb-4">
                {userPosts.slice(0, 3).map((post, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-white font-medium text-sm truncate">{post.title}</div>
                    <div className="text-white/60 text-xs">{new Date(post.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
                {userPosts.length === 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div className="text-white/60 text-sm">No posts yet</div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center text-white/80 group-hover:text-white transition-colors">
                <span className="text-sm font-medium">View all posts</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Saved */}
          <div 
            onClick={() => handleBentoClick('saved')}
            className="relative overflow-hidden bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
          >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors"></div>
            <div className="relative p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 group-hover:bg-white/30 transition-colors">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <div className="text-white/60 text-sm">
                  {savedListings.length} saved
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Saved</h3>
              <p className="text-white/80 text-lg mb-4">Your saved listings</p>
              
              {/* Recent Saved Preview */}
              <div className="space-y-2 mb-4">
                {savedListings.slice(0, 3).map((saved, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-white font-medium text-sm truncate">{saved.posts?.title || 'Saved item'}</div>
                    <div className="text-white/60 text-xs">{new Date(saved.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
                {savedListings.length === 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div className="text-white/60 text-sm">No saved items</div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center text-white/80 group-hover:text-white transition-colors">
                <span className="text-sm font-medium">View all saved</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Groups */}
          <div 
            onClick={() => handleBentoClick('groups')}
            className="relative overflow-hidden bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
          >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors"></div>
            <div className="relative p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 group-hover:bg-white/30 transition-colors">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="text-white/60 text-sm">
                  {userGroups.length} groups
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Groups</h3>
              <p className="text-white/80 text-lg mb-4">Communities you're in</p>
              
              {/* Recent Groups Preview */}
              <div className="space-y-2 mb-4">
                {userGroups.slice(0, 3).map((group, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-white font-medium text-sm truncate">{group.groups?.name || 'Group'}</div>
                    <div className="text-white/60 text-xs">{new Date(group.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
                {userGroups.length === 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div className="text-white/60 text-sm">No groups yet</div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center text-white/80 group-hover:text-white transition-colors">
                <span className="text-sm font-medium">View all groups</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Portfolio */}
          <div 
            onClick={() => handleBentoClick('portfolio')}
            className="relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
          >
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors"></div>
            <div className="relative p-8">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 group-hover:bg-white/30 transition-colors">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <div className="text-white/60 text-sm">
                  {portfolioFiles.length} files
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Portfolio</h3>
              <p className="text-white/80 text-lg mb-4">Your work & files</p>
              
              {/* Recent Files Preview */}
              <div className="space-y-2 mb-4">
                {portfolioFiles.slice(0, 3).map((file, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="text-white font-medium text-sm truncate">{file.name}</div>
                    <div className="text-white/60 text-xs">{new Date(file.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
                {portfolioFiles.length === 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div className="text-white/60 text-sm">No files yet</div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center text-white/80 group-hover:text-white transition-colors">
                <span className="text-sm font-medium">View all files</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Dropdown */}
        {showSettings && (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Settings</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

                  <div className="p-4 space-y-3">
                {/* Dark Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                      {isDarkMode ? (
                        <Sun className="w-4 h-4 text-yellow-600" />
                      ) : (
                        <Moon className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Dark Mode</h4>
                      <p className="text-xs text-gray-500">Toggle themes</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isDarkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                      <Bell className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Notifications</h4>
                      <p className="text-xs text-gray-500">Manage preferences</p>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                    Configure
                  </button>
                </div>

                {/* Privacy */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                      <Shield className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Privacy</h4>
                      <p className="text-xs text-gray-500">Control settings</p>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                    Manage
                  </button>
                </div>

                {/* Appearance */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                      <Palette className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Appearance</h4>
                      <p className="text-xs text-gray-500">Customize profile</p>
                    </div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                    Customize
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 my-4"></div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="p-1.5 bg-gray-100 rounded-lg">
                    <LogOut className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">Sign Out</h4>
                    <p className="text-xs text-gray-500">Sign out of account</p>
                  </div>
                </button>

                {/* Delete Account */}
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="w-full flex items-center gap-2 p-2 text-left hover:bg-red-50 rounded-lg transition-colors"
                >
                  <div className="p-1.5 bg-red-100 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-red-600 text-sm">Delete Account</h4>
                    <p className="text-xs text-red-500">Permanently delete account</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Account Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Delete Account</h3>
                    <p className="text-gray-600">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-red-800 mb-2">Warning</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• All your posts and content will be deleted</li>
                    <li>• Your profile and settings will be removed</li>
                    <li>• This action is permanent and cannot be reversed</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  );
}