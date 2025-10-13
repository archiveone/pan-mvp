'use client'

import { useState, useEffect } from 'react'
import { UserPlus, UserMinus } from 'lucide-react'
import { FollowersService } from '@/services/followersService'
import { useAuth } from '@/contexts/AuthContext'

interface FollowButtonProps {
  userId: string
  initialIsFollowing?: boolean
  onFollowChange?: (isFollowing: boolean) => void
  variant?: 'default' | 'compact'
  className?: string
}

export default function FollowButton({
  userId,
  initialIsFollowing = false,
  onFollowChange,
  variant = 'default',
  className = ''
}: FollowButtonProps) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // Check follow status on mount
  useEffect(() => {
    checkFollowStatus()
  }, [userId])

  const checkFollowStatus = async () => {
    if (!user) {
      setChecking(false)
      return
    }

    setChecking(true)
    const following = await FollowersService.isFollowing(userId)
    setIsFollowing(following)
    setChecking(false)
  }

  const handleFollowToggle = async () => {
    if (!user) {
      alert('Please sign in to follow users')
      return
    }

    if (user.id === userId) {
      return // Can't follow yourself
    }

    setLoading(true)

    try {
      if (isFollowing) {
        const result = await FollowersService.unfollowUser(userId)
        if (result.success) {
          setIsFollowing(false)
          onFollowChange?.(false)
        } else {
          // Check if it's a migration issue
          if (result.error?.includes('not set up') || result.error?.includes('migration')) {
            console.warn('Followers feature not available yet')
            // Silently fail - button will be hidden after check
          } else {
            alert(result.error || 'Failed to unfollow')
          }
        }
      } else {
        const result = await FollowersService.followUser(userId)
        if (result.success) {
          setIsFollowing(true)
          onFollowChange?.(true)
        } else {
          // Check if it's a migration issue
          if (result.error?.includes('not set up') || result.error?.includes('migration')) {
            console.warn('Followers feature not available yet')
            // Silently fail - button will be hidden after check
          } else {
            alert(result.error || 'Failed to follow')
          }
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Don't show button if viewing own profile
  if (!user || user.id === userId) {
    return null
  }

  if (checking) {
    return (
      <div className={`
        ${variant === 'compact' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'}
        bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse
        ${className}
      `}>
        <span className="opacity-0">Loading</span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleFollowToggle}
        disabled={loading}
        className={`
          px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
          ${isFollowing 
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600' 
            : 'bg-gradient-to-r from-lime-400 to-lime-300 hover:brightness-95 text-black'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {loading ? '...' : isFollowing ? 'Following' : 'Follow'}
      </button>
    )
  }

  return (
    <button
      onClick={handleFollowToggle}
      disabled={loading}
      className={`
        flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-all duration-200
        ${isFollowing 
          ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600' 
          : 'bg-gradient-to-r from-lime-400 to-lime-300 hover:brightness-95 text-black'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-sm hover:shadow-md
        ${className}
      `}
    >
      {loading ? (
        <span>Loading...</span>
      ) : (
        <>
          {isFollowing ? (
            <>
              <UserMinus size={16} />
              <span>Following</span>
            </>
          ) : (
            <>
              <UserPlus size={16} />
              <span>Follow</span>
            </>
          )}
        </>
      )}
    </button>
  )
}

