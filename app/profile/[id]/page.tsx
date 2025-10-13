'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, MapPin, Calendar, User, Settings, Users, GripVertical, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import FollowButton from '@/components/FollowButton'
import { FollowersService } from '@/services/followersService'
import { AdvancedHubService, HubBox } from '@/services/advancedHubService'
import { MessagingService, Conversation } from '@/services/messagingService'
import { Responsive, WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import * as Icons from 'lucide-react'

const ResponsiveGridLayout = WidthProvider(Responsive)

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

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [followerStats, setFollowerStats] = useState({ followers_count: 0, following_count: 0, is_following: false })
  const [hubBoxes, setHubBoxes] = useState<HubBox[]>([])
  const [boxContent, setBoxContent] = useState<Record<string, any>>({})

  const isOwnProfile = currentUser?.id === params?.id

  useEffect(() => {
    if (params?.id) {
      loadProfile(params.id as string)
      loadUserPosts(params.id as string)
      loadFollowerStats(params.id as string)
      loadPublicHubBoxes(params.id as string)
    }
  }, [params])

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const loadUserPosts = async (userId: string) => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      setUserPosts(data || [])
    } catch (error) {
      console.error('Error loading user posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFollowerStats = async (userId: string) => {
    try {
      const stats = await FollowersService.getFollowerStats(userId)
      setFollowerStats({
        followers_count: stats.followers_count || 0,
        following_count: stats.following_count || 0,
        is_following: stats.is_following || false
      })
    } catch (error) {
      // Silent fail - service already handles errors gracefully
      setFollowerStats({ followers_count: 0, following_count: 0, is_following: false })
    }
  }

  const handleFollowChange = (isFollowing: boolean) => {
    setFollowerStats(prev => ({
      ...prev,
      is_following: isFollowing,
      followers_count: isFollowing ? prev.followers_count + 1 : prev.followers_count - 1
    }))
  }

  const loadPublicHubBoxes = async (userId: string) => {
    try {
      console.log('📦 Loading public hub boxes for user:', userId);
      
      // Load user's hub boxes
      const result = await AdvancedHubService.getUserHubBoxes(userId);
      
      console.log('📦 Hub boxes result:', result);
      
      if (result.success && result.data) {
        console.log('📦 Total boxes:', result.data.length);
        console.log('📦 Boxes:', result.data.map(b => ({ title: b.title, is_public: b.is_public })));
        
        // Filter to only PUBLIC boxes (is_public = true)
        // For now, show ALL non-inbox boxes if viewing own profile, or public boxes for others
        const publicBoxes = isOwnProfile 
          ? result.data.filter(box => box.box_type !== 'inbox')
          : result.data.filter(box => box.is_public);
          
        console.log('📦 Public/visible boxes:', publicBoxes.length);
        setHubBoxes(publicBoxes);
        
        // Load content for each public box
        if (publicBoxes.length > 0) {
          await loadPublicBoxContent(publicBoxes, userId);
        }
      }
    } catch (error) {
      console.error('Error loading public hub boxes:', error);
    }
  };

  const loadPublicBoxContent = async (boxes: HubBox[], userId: string) => {
    const content: Record<string, any> = {};

    await Promise.all(
      boxes.map(async (box) => {
        try {
          if (box.box_type === 'inbox' || box.box_type === 'chat_group') {
            // Don't show inbox/chat content on public profiles
            content[box.id] = { type: box.box_type, conversations: [], items: [], images: [] };
          } else {
            // Load saved items from hub_box_items
            const itemsResult = await AdvancedHubService.getBoxItems(box.id);
            
            if (itemsResult.success && itemsResult.data) {
              const items = itemsResult.data;
              const images = items
                .filter((item: any) => item.posts?.media_url)
                .slice(0, 8)
                .map((item: any) => item.posts.media_url);

              content[box.id] = {
                type: box.box_type,
                items: items,
                images: images
              };
            } else {
              content[box.id] = { type: box.box_type, items: [], images: [] };
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

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <AppHeader />
        <div className="max-w-6xl mx-auto px-4 py-6 pb-20">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 w-32 rounded-2xl mb-6"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 w-1/2"></div>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <AppHeader />
        <div className="max-w-6xl mx-auto px-4 py-6 pb-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Profile not found</h1>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-lime-400 to-lime-300 text-black rounded-lg hover:brightness-95 transition-all"
          >
            Back to Home
          </button>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-6 pb-20">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        {/* Profile Header - Matches hub profile box exactly */}
        <div 
          className="rounded-2xl shadow-lg overflow-hidden relative border"
          style={{
            height: '200px',
            backgroundColor: profile.profile_box_image ? 'transparent' : (profile.profile_box_color || '#3B82F6'),
            backgroundImage: profile.profile_box_image ? `url(${profile.profile_box_image})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderColor: profile.profile_box_image ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
          }}
        >
          {/* Overlay for image backgrounds */}
          {profile.profile_box_image && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60"></div>
          )}
          
          <div className="relative z-10 h-full flex flex-col p-6">
            {/* Top: Edit Button / Follow Button */}
            <div className="flex justify-end mb-auto">
              {isOwnProfile ? (
                <Link
                  href="/hub"
                  className="px-4 py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg hover:bg-white dark:hover:bg-gray-900 transition-colors text-sm font-medium text-gray-900 dark:text-gray-100 shadow-lg flex items-center gap-2"
                >
                  <Settings size={16} />
                  Edit Profile
                </Link>
              ) : (
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg">
                  <FollowButton
                    userId={params?.id as string}
                    initialIsFollowing={followerStats.is_following}
                    onFollowChange={handleFollowChange}
                  />
                </div>
              )}
            </div>

            {/* Bottom: Profile Info */}
            <div className="flex items-end justify-between">
              <div className="flex items-start gap-4">
                {/* Avatar - Left Side */}
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-2xl bg-gray-200 dark:bg-gray-700">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700">
                      <User className="w-10 h-10 text-gray-600 dark:text-gray-300" />
                    </div>
                  )}
                </div>
                
                {/* Info - Name, Username, Bio */}
                <div className="flex-1 space-y-2">
                  <h1 className="inline bg-black/80 backdrop-blur-sm text-2xl font-bold text-white leading-none">
                    {profile.name || 'User'}
                  </h1>
                  <br />
                  <p className="inline bg-black/80 backdrop-blur-sm text-base text-white/90 leading-none">
                    @{profile.username || 'user'}
                  </p>
                  {profile.bio && (
                    <>
                      <br />
                      <p className="inline bg-black/80 backdrop-blur-sm text-sm text-white/80 max-w-md leading-none">
                        {profile.bio}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Stats & Actions - Bottom Right */}
              <div className="flex flex-col items-end gap-2">
                {/* Message Button - Above Stats (for other profiles) */}
                {!isOwnProfile && (
                  <Link
                    href="/inbox"
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors text-sm font-medium text-white shadow-lg flex items-center gap-2 border border-white/30"
                  >
                    <MessageCircle size={16} />
                    Message
                  </Link>
                )}
                
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 bg-black/90 backdrop-blur-sm text-white px-2 py-1 shadow-lg">
                    <span className="text-base font-bold leading-none">{userPosts.length}</span>
                    <span className="text-xs opacity-90 leading-none font-medium">Posts</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-black/90 backdrop-blur-sm text-white px-2 py-1 shadow-lg cursor-pointer hover:bg-black hover:shadow-xl hover:scale-105 transition-all">
                    <span className="text-base font-bold leading-none">{followerStats.followers_count}</span>
                    <span className="text-xs opacity-90 leading-none font-medium">Followers</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-black/90 backdrop-blur-sm text-white px-2 py-1 shadow-lg cursor-pointer hover:bg-black hover:shadow-xl hover:scale-105 transition-all">
                    <span className="text-base font-bold leading-none">{followerStats.following_count}</span>
                    <span className="text-xs opacity-90 leading-none font-medium">Following</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Public Hub Boxes */}
        {hubBoxes.length > 0 && (
          <div className="mb-12 mt-8">
            <ResponsiveGridLayout
              className="layout"
              layouts={{
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
                })),
                md: hubBoxes.map((box, index) => ({
                  i: box.id,
                  x: box.settings?.grid?.x ?? (index % 2),
                  y: box.settings?.grid?.y ?? Math.floor(index / 2),
                  w: box.settings?.grid?.w ?? 1,
                  h: box.settings?.grid?.h ?? 1,
                  minW: 1,
                  minH: 1,
                  maxW: 2,
                  maxH: 2
                })),
                sm: hubBoxes.map((box, index) => ({
                  i: box.id,
                  x: 0,
                  y: index,
                  w: 1,
                  h: box.settings?.grid?.h ?? 1,
                  minW: 1,
                  minH: 1
                })),
              }}
              breakpoints={{ lg: 1024, md: 768, sm: 640, xs: 0 }}
              cols={{ lg: 2, md: 2, sm: 1, xs: 1 }}
              rowHeight={220}
              isDraggable={false}
              isResizable={false}
              margin={[20, 20]}
              containerPadding={[0, 0]}
            >
              {hubBoxes.map((box) => {
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
                
                const textColor = box.image_url ? '#FFFFFF' : getTextColor(box.custom_color || '#3B82F6');
                const isLightBg = textColor === '#1F2937';

                return (
                  <div
                    key={box.id}
                    className="relative group h-full"
                  >
                    <div
                      className="h-full rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden cursor-pointer"
                      style={bgStyle}
                      onClick={() => {
                        if (box.box_type === 'inbox') {
                          return;
                        }
                        router.push(`/hub/box/${box.id}`);
                      }}
                    >
                      {/* Content */}
                      <div className="h-full p-6 flex flex-col relative">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold mb-1 truncate" style={{ color: textColor }}>
                              {box.title}
                            </h3>
                            <p className="text-sm" style={{ color: textColor, opacity: 0.7 }}>
                              {boxContent[box.id]?.items?.length || 0} items
                            </p>
                          </div>
                          
                          <div className="flex-shrink-0 ml-3">
                            <div className={`${isLightBg ? 'bg-gray-900/10' : 'bg-white/20'} backdrop-blur-sm rounded-xl p-2.5`}>
                              <IconComponent className="w-6 h-6" style={{ color: textColor }} />
                            </div>
                          </div>
                        </div>

                        {/* Box Content Preview */}
                        <div className="flex-1 min-h-0 mb-2">
                          {boxContent[box.id]?.images && boxContent[box.id].images.length > 0 ? (
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
                            <div className={`${isLightBg ? 'bg-gray-900/10' : 'bg-white/10'} backdrop-blur-sm rounded-lg p-4 text-center h-full flex items-center justify-center`}>
                              <p className="text-sm" style={{ color: textColor, opacity: 0.6 }}>
                                {boxContent[box.id]?.items?.length || 0} items
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </ResponsiveGridLayout>
          </div>
        )}

        {/* User's Posts */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            {isOwnProfile ? 'Your Listings' : `${profile.name || 'User'}'s Listings`}
          </h2>

          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
              ))}
            </div>
          )}

          {!loading && userPosts.length === 0 && (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-xl border dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
            </div>
          )}

          {!loading && userPosts.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {userPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/listing/${post.id}`}
                  className="group relative aspect-square overflow-hidden bg-gray-200 dark:bg-gray-700"
                >
                  {post.media_url ? (
                    <img
                      src={post.media_url}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                      📦
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                    <h3 className="text-white font-semibold text-sm line-clamp-2 mb-1">
                      {post.title}
                    </h3>
                    {post.price_amount && (
                      <p className="text-green-400 text-xs font-semibold">
                        {post.price_amount} {post.currency || 'EUR'}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  )
}


