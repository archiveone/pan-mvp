'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Star, MapPin, Calendar, DollarSign, Share2, Flag, User, ArrowRight, Shield } from 'lucide-react'
import Link from 'next/link'
import { useSavedPosts } from '@/hooks/useSavedListings'
import PostInteractions from '@/components/PostInteractions'
import CommentSection from '@/components/CommentSection'

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { isSaved, toggleSave } = useSavedPosts()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  useEffect(() => {
    if (params?.id) {
      loadListing(params.id as string)
    }
  }, [params?.id])

  const loadListing = async (id: string) => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            name,
            username,
            avatar_url,
            bio
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      setListing(data)

      // Increment view count
      await supabase.rpc('increment_view_count', { content_id: id })
    } catch (error) {
      console.error('Error loading listing:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: listing?.title,
        text: listing?.content,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <AppHeader />
        <div className="max-w-6xl mx-auto px-4 py-6 pb-20">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 mb-6"></div>
            <div className="h-8 bg-gray-200 w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 w-1/2"></div>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-white">
        <AppHeader />
        <div className="max-w-6xl mx-auto px-4 py-6 pb-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Listing not found</h1>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-lime-400 to-lime-300 text-black rounded-lg hover:brightness-95 transition-colors"
          >
            Back to Home
          </button>
        </div>
        <BottomNav />
      </div>
    )
  }

  const allImages = [listing.media_url, ...(listing.media_urls || [])].filter(Boolean)

  return (
    <div className="min-h-screen bg-white">
      <AppHeader />

      <main className="max-w-6xl mx-auto px-4 py-6 pb-20">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square overflow-hidden bg-gray-200 relative">
              {allImages.length > 0 ? (
                <img
                  src={allImages[currentImageIndex]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">
                  📦
                </div>
              )}

              {/* Image Navigation */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    ›
                  </button>
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {allImages.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square overflow-hidden bg-gray-200 ${
                      index === currentImageIndex ? 'ring-2 ring-orange-400' : ''
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Title & Actions */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold text-gray-900 flex-1">{listing.title}</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleSave(listing.id)}
                  className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all hover:scale-105"
                  title={isSaved(listing.id) ? 'Unsave' : 'Save'}
                >
                  <Star 
                    size={20} 
                    className={`transition-all ${
                      isSaved(listing.id) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'fill-none text-gray-600 dark:text-gray-400'
                    }`}
                  />
                </button>
                <button
                  onClick={handleShare}
                  className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            {/* Price */}
            {listing.price_amount && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 text-green-700 mb-1">
                  <DollarSign size={20} />
                  <span className="text-sm font-medium">Price</span>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {listing.price_amount} {listing.currency || 'EUR'}
                </div>
              </div>
            )}

            {/* Seller Info */}
            {listing.profiles && (
              <Link
                href={`/profile/${listing.profiles.id}`}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                  {listing.profiles.avatar_url ? (
                    <img
                      src={listing.profiles.avatar_url}
                      alt={listing.profiles.username || listing.profiles.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={24} className="text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">
                    {listing.profiles.name || listing.profiles.username || 'User'}
                  </div>
                  <div className="text-sm text-gray-500">
                    @{listing.profiles.username || 'user'}
                  </div>
                  {listing.profiles.bio && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{listing.profiles.bio}</p>
                  )}
                </div>
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )}

            {/* Location */}
            {listing.location && (
              <div className="flex items-center gap-3 text-gray-700">
                <MapPin size={20} className="text-gray-400" />
                <span className="font-medium">{listing.location}</span>
              </div>
            )}

            {/* Category */}
            {listing.category && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {listing.category.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
                {listing.content_type && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {listing.content_type}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {listing.content || 'No description provided.'}
              </p>
            </div>

            {/* Tags */}
            {listing.tags && listing.tags.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Event Details */}
            {(listing.event_date || listing.event_time) && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Event Details</h2>
                <div className="space-y-2">
                  {listing.event_date && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar size={18} className="text-blue-500" />
                      <span>{new Date(listing.event_date).toLocaleDateString()}</span>
                      {listing.event_time && <span>at {listing.event_time}</span>}
                    </div>
                  )}
                  {listing.venue && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin size={18} className="text-blue-500" />
                      <span>{listing.venue}</span>
                    </div>
                  )}
                  {listing.capacity && (
                    <div className="text-sm text-gray-600">
                      Capacity: {listing.capacity} people
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Posted Date */}
            <div className="text-sm text-gray-500 pt-4 border-t">
              Posted on {new Date(listing.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              {user?.id === listing.user_id ? (
                <div className="flex gap-3">
                  <Link
                    href={`/listing/${listing.id}/edit`}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-lime-400 to-lime-300 text-black rounded-lg hover:brightness-95 transition-all font-semibold text-center"
                  >
                    Edit Listing
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this listing?')) {
                        alert('Delete functionality will be implemented')
                      }
                    }}
                    className="px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <>
                  {listing.price_amount && (
                    <Link
                      href={`/checkout/${listing.id}`}
                      className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-gradient-to-r from-lime-400 to-lime-300 text-black rounded-lg hover:brightness-95 transition-all font-semibold text-lg shadow-lg hover:shadow-xl"
                    >
                      <Shield size={20} />
                      {listing.category === 'event' ? 'Book Now' : 
                       listing.category === 'service' ? 'Book Service' : 
                       'Buy Now'}
                      <ArrowRight size={20} />
                    </Link>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        if (!user) {
                          alert('Please sign in to message the seller')
                          return
                        }
                        
                        console.log('📧 Starting conversation with seller:', listing.user_id)
                        
                        // First check if following
                        const { data: followCheck } = await supabase
                          .from('followers')
                          .select('id')
                          .eq('follower_id', user.id)
                          .eq('following_id', listing.user_id)
                          .single()
                        
                        const isFollowing = !!followCheck
                        
                        if (!isFollowing) {
                          const confirmFollow = confirm(
                            'You must follow this seller before messaging them.\n\n' +
                            'Would you like to follow them now?'
                          )
                          
                          if (confirmFollow) {
                            // Follow the user
                            const { error: followError } = await supabase
                              .from('followers')
                              .insert({
                                follower_id: user.id,
                                following_id: listing.user_id
                              })
                            
                            if (followError) {
                              if (followError.code === '42P01') {
                                // Followers table doesn't exist, allow messaging
                                console.warn('⚠️ Followers system not set up, allowing message')
                              } else {
                                alert('Failed to follow user. Please try again.')
                                return
                              }
                            } else {
                              alert('✅ You are now following this seller! You can now message them.')
                            }
                          } else {
                            return
                          }
                        }
                        
                        const { MessagingService } = await import('@/services/messagingService')
                        const result = await MessagingService.getOrCreateConversation(listing.user_id)
                        
                        console.log('📧 Conversation result:', result)
                        
                        if (result.success && result.conversationId) {
                          console.log('✅ Opening inbox with conversation:', result.conversationId)
                          router.push(`/inbox?conversation=${result.conversationId}`)
                        } else {
                          const errorMsg = result.error || 'Failed to start conversation'
                          console.error('❌ Conversation error:', errorMsg)
                          
                          if (errorMsg.includes('must follow')) {
                            alert('⚠️ ' + errorMsg)
                          } else if (errorMsg.includes('migration') || errorMsg.includes('not set up')) {
                            alert('⚠️ Messaging system not ready yet.\n\n' +
                                  'Please run the migration in Supabase:\n' +
                                  'add_messaging_system.sql')
                          } else {
                            alert('Failed to start conversation:\n\n' + errorMsg)
                          }
                        }
                      }}
                      className={`flex-1 px-6 py-3 ${listing.price_amount ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' : 'bg-gradient-to-r from-lime-400 to-lime-300 text-black'} rounded-lg hover:brightness-95 transition-colors font-medium`}
                    >
                      Message Seller
                    </button>
                    <button
                      onClick={() => toggleSave(listing.id)}
                      className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                      {isSaved(listing.id) ? 'Saved ⭐' : 'Save'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Interactions (Likes, Comments, Shares) */}
        <div className="mt-8">
          <PostInteractions
            contentId={listing.id}
            initialLikes={listing.like_count || 0}
            initialComments={0}
            onCommentClick={() => {
              const commentSection = document.getElementById('comments')
              commentSection?.scrollIntoView({ behavior: 'smooth' })
            }}
          />
        </div>

        {/* Comments Section */}
        <div id="comments" className="mt-8">
          <CommentSection
            contentId={listing.id}
            contentType={listing.content_type || 'listing'}
          />
        </div>
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  )
}
