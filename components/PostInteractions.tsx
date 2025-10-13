'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Heart, Share2, MessageCircle } from 'lucide-react'

interface PostInteractionsProps {
  contentId: string
  initialLikes?: number
  initialComments?: number
  onCommentClick?: () => void
}

export default function PostInteractions({ 
  contentId, 
  initialLikes = 0, 
  initialComments = 0,
  onCommentClick 
}: PostInteractionsProps) {
  const { user } = useAuth()
  const [likes, setLikes] = useState(initialLikes)
  const [comments, setComments] = useState(initialComments)
  const [isLiked, setIsLiked] = useState(false)
  const [shares, setShares] = useState(0)

  useEffect(() => {
    loadInteractionState()
    loadCounts()
  }, [contentId])

  const loadInteractionState = () => {
    try {
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]')
      setIsLiked(likedPosts.includes(contentId))
    } catch (error) {
      console.error('Error loading interaction state:', error)
    }
  }

  const loadCounts = async () => {
    try {
      // Get comment count
      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', contentId)
        .eq('is_deleted', false)

      if (!error && count !== null) {
        setComments(count)
      }

      // Get post data for likes
      const { data: postData } = await supabase
        .from('posts')
        .select('like_count, share_count')
        .eq('id', contentId)
        .single()

      if (postData) {
        setLikes(postData.like_count || 0)
        setShares(postData.share_count || 0)
      }
    } catch (error) {
      console.error('Error loading counts:', error)
    }
  }

  const handleLike = async () => {
    const newLikedState = !isLiked
    setIsLiked(newLikedState)
    setLikes(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1))

    // Update localStorage
    try {
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]')
      const newLiked = newLikedState
        ? [...likedPosts, contentId]
        : likedPosts.filter((id: string) => id !== contentId)
      localStorage.setItem('likedPosts', JSON.stringify(newLiked))
    } catch (error) {
      console.error('Error saving like state:', error)
    }

    // Update database
    try {
      const { error } = await supabase
        .from('posts')
        .update({ like_count: newLikedState ? likes + 1 : Math.max(0, likes - 1) })
        .eq('id', contentId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating like count:', error)
      // Revert on error
      setIsLiked(!newLikedState)
      setLikes(prev => newLikedState ? Math.max(0, prev - 1) : prev + 1)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/listing/${contentId}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check this out on Pan',
          url: url
        })
        incrementShareCount()
      } catch (error) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
      incrementShareCount()
    }
  }

  const incrementShareCount = async () => {
    setShares(prev => prev + 1)
    
    try {
      await supabase
        .from('posts')
        .update({ share_count: shares + 1 })
        .eq('id', contentId)
    } catch (error) {
      console.error('Error updating share count:', error)
    }
  }

  return (
    <div className="flex items-center gap-6 py-4 border-y border-gray-200">
      {/* Like Button */}
      <button
        onClick={handleLike}
        className={`flex items-center gap-2 transition-colors ${
          isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
        }`}
      >
        <Heart size={20} className={isLiked ? 'fill-current' : ''} />
        <span className="font-semibold">{likes}</span>
        <span className="text-sm hidden sm:inline">Likes</span>
      </button>

      {/* Comment Button */}
      <button
        onClick={onCommentClick}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
      >
        <MessageCircle size={20} />
        <span className="font-semibold">{comments}</span>
        <span className="text-sm hidden sm:inline">Comments</span>
      </button>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors"
      >
        <Share2 size={20} />
        <span className="font-semibold">{shares}</span>
        <span className="text-sm hidden sm:inline">Shares</span>
      </button>
    </div>
  )
}

