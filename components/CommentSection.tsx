'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { getCommentsWithReplies, createComment } from '@/services/commentsService'
import { MessageCircle, Send, Heart, User, Trash2, Flag } from 'lucide-react'
import Link from 'next/link'

interface Comment {
  id: string
  content: string
  user_id: string
  post_id: string
  parent_id: string | null
  created_at: string
  like_count: number
  is_deleted: boolean
  gif_url?: string
  is_pinned?: boolean
  profiles?: {
    id: string
    name?: string
    username?: string
    avatar_url?: string
  }
  replies?: Comment[]
}

interface CommentSectionProps {
  contentId: string
  contentType?: string // 'listing', 'event', 'post'
}

export default function CommentSection({ contentId, contentType = 'post' }: CommentSectionProps) {
  const { user, profile } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadComments()
    loadLikedComments()
  }, [contentId])

  const loadComments = async () => {
    try {
      setLoading(true)
      const commentsData = await getCommentsWithReplies(contentId)
      console.log('✅ Comments loaded:', commentsData.length)
      
      // Check if profiles are present and log threading structure
      commentsData.forEach((c, i) => {
        if (c.profiles) {
          console.log(`  Comment ${i + 1} profile:`, c.profiles.name || c.profiles.username)
        } else {
          console.warn(`  Comment ${i + 1} missing profile data`)
        }
        if (c.replies && c.replies.length > 0) {
          console.log(`    └─ Has ${c.replies.length} replies`)
          c.replies.forEach((r, ri) => {
            console.log(`       ${ri + 1}. ${r.profiles?.name || 'User'}: ${r.content.substring(0, 30)}`)
          })
        }
      })
      
      setComments(commentsData as any)
    } catch (error) {
      console.error('Error loading comments:', error)
      // Fail silently - if database isn't set up yet, just show no comments
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  const loadLikedComments = () => {
    try {
      const liked = JSON.parse(localStorage.getItem(`likedComments_${contentId}`) || '[]')
      setLikedComments(new Set(liked))
    } catch (error) {
      console.error('Error loading liked comments:', error)
    }
  }

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return

    setSubmitting(true)
    try {
      const comment = await createComment({
        post_id: contentId,
        user_id: user.id,
        content: newComment.trim()
      })

      if (comment) {
        console.log('✅ Comment posted successfully')
        // Reload comments to get the new one with proper structure
        await loadComments()
        setNewComment('')
      } else {
        throw new Error('Failed to create comment')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      
      // Show user-friendly message
      if (errorMsg.includes('Database tables not set up')) {
        alert('⚠️ Database not ready yet. Please ask the admin to run the migration.\n\nFor now, your comment cannot be saved.')
      } else {
        alert(`Failed to post comment: ${errorMsg}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return

    setSubmitting(true)
    try {
      const reply = await createComment({
        post_id: contentId,
        user_id: user.id,
        content: replyContent.trim(),
        parent_id: parentId
      })

      if (reply) {
        // Reload comments to get updated structure
        await loadComments()
        setReplyContent('')
        setReplyTo(null)
      } else {
        throw new Error('Failed to create reply')
      }
    } catch (error) {
      console.error('Error posting reply:', error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      
      if (errorMsg.includes('Database tables not set up')) {
        alert('⚠️ Database not ready yet. Please ask the admin to run the migration.')
      } else {
        alert('Failed to post reply')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleLikeComment = async (commentId: string) => {
    const newLiked = new Set(likedComments)
    const wasLiked = newLiked.has(commentId)

    if (wasLiked) {
      newLiked.delete(commentId)
    } else {
      newLiked.add(commentId)
    }

    setLikedComments(newLiked)
    localStorage.setItem(`likedComments_${contentId}`, JSON.stringify(Array.from(newLiked)))

    // Update like count in database
    try {
      const comment = comments.find(c => c.id === commentId)
      const newCount = (comment?.like_count || 0) + (wasLiked ? -1 : 1)

      await supabase
        .from('comments')
        .update({ like_count: Math.max(0, newCount) })
        .eq('id', commentId)

      // Update local state
      setComments(comments.map(c => {
        if (c.id === commentId) {
          return { ...c, like_count: Math.max(0, newCount) }
        }
        // Check replies too
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map(r => 
              r.id === commentId ? { ...r, like_count: Math.max(0, newCount) } : r
            )
          }
        }
        return c
      }))
    } catch (error) {
      console.error('Error updating like count:', error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return

    try {
      const { error } = await supabase
        .from('comments')
        .update({ is_deleted: true })
        .eq('id', commentId)
        .eq('user_id', user?.id) // Safety check

      if (error) throw error

      setComments(comments.filter(c => c.id !== commentId))
    } catch (error) {
      console.error('Error deleting comment:', error)
      alert('Failed to delete comment')
    }
  }

  const renderComment = (comment: Comment, isReply = false, depth = 0) => (
    <div key={comment.id} className={isReply ? '' : 'mb-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50'}>
      <div className={`flex gap-3 group ${isReply ? 'ml-8 pl-3 border-l-2 border-lime-300 dark:border-lime-700/50 pt-2 pb-2' : ''}`}>
        {/* Avatar */}
        <Link 
          href={`/profile/${comment.user_id}`} 
          className="flex-shrink-0 hover:opacity-80 transition-opacity"
          title={`View ${comment.profiles?.name || comment.profiles?.username || 'user'}'s profile`}
        >
          <div className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-gradient-to-r from-lime-400 to-lime-300 overflow-hidden ring-2 ring-transparent hover:ring-lime-300 transition-all`}>
            {comment.profiles?.avatar_url ? (
              <img
                src={comment.profiles.avatar_url}
                alt={comment.profiles?.name || comment.profiles?.username || 'User'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    const name = comment.profiles?.name || comment.profiles?.username || 'User'
                    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    const fontSize = isReply ? 'text-xs' : 'text-sm'
                    parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-black font-bold ${fontSize}">${initials}</div>`
                  }
                }}
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center text-black font-bold ${isReply ? 'text-xs' : 'text-sm'}`}>
                {(comment.profiles?.name || comment.profiles?.username || 'U')
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            )}
          </div>
        </Link>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Link 
                  href={`/profile/${comment.user_id}`}
                  className="font-semibold text-gray-900 dark:text-gray-100 text-sm hover:text-lime-500 dark:hover:text-lime-400 transition-colors"
                >
                  {comment.profiles?.name || comment.profiles?.username || 'User'}
                </Link>
                {comment.profiles?.username && comment.profiles?.name && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    @{comment.profiles.username}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{comment.content}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2 px-2">
            <button
              onClick={() => handleLikeComment(comment.id)}
              className={`flex items-center gap-1 text-xs transition-colors ${
                likedComments.has(comment.id)
                  ? 'text-red-500 font-semibold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart size={14} className={likedComments.has(comment.id) ? 'fill-current' : ''} />
              <span>{comment.like_count || 0}</span>
            </button>

            <button
              onClick={() => setReplyTo(comment.id)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-lime-500 dark:hover:text-lime-400 transition-colors font-medium"
            >
              Reply
              {comment.replies && comment.replies.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-lime-100 dark:bg-lime-900/30 text-lime-600 dark:text-lime-400 rounded-full text-[10px] font-bold">
                  {comment.replies.length}
                </span>
              )}
            </button>

            {user?.id === comment.user_id && (
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {/* Reply Input */}
          {replyTo === comment.id && (
            <div className="mt-2 ml-8 pl-3 border-l-2 border-lime-400 dark:border-lime-600">
              {/* Replying to indicator */}
              <div className="mb-2 px-2 py-1 bg-lime-50 dark:bg-lime-900/20 rounded inline-block">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Replying to <span className="font-semibold text-lime-600 dark:text-lime-400">
                    {comment.profiles?.name || comment.profiles?.username || 'User'}
                  </span>
                </span>
              </div>
              
              {/* Reply input */}
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmitReply(comment.id)}
                  placeholder="Write a reply..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm"
                  autoFocus
                />
                <button
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={!replyContent.trim() || submitting}
                  className="px-3 py-2 bg-gradient-to-r from-lime-400 to-lime-300 text-black rounded-lg hover:brightness-95 transition-all disabled:opacity-50 text-sm font-medium"
                >
                  <Send size={14} />
                </button>
                <button
                  onClick={() => {
                    setReplyTo(null)
                    setReplyContent('')
                  }}
                  className="px-2 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Replies - Nested within parent comment */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map(reply => renderComment(reply, true, depth + 1))}
        </div>
      )}
    </div>
  )

  const getCommentLabel = () => {
    switch (contentType) {
      case 'listing':
      case 'event':
        return 'Reviews & Comments'
      default:
        return 'Comments'
    }
  }

  return (
    <div className="space-y-6 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-lime-400 to-lime-300 rounded-lg">
            <MessageCircle size={20} className="text-black" />
          </div>
          {getCommentLabel()}
          <span className="text-gray-400 dark:text-gray-500 text-lg">({comments.length})</span>
        </h2>
      </div>

      {/* New Comment Input */}
      {user ? (
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex gap-3">
            <Link 
              href="/hub" 
              className="flex-shrink-0 hover:opacity-80 transition-opacity"
              title="View your profile"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-lime-400 to-lime-300 overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Your avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        const name = profile?.name || user.user_metadata?.full_name || 'You'
                        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                        parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-black font-bold text-sm">${initials}</div>`
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-black font-bold text-sm">
                    {(profile?.name || user.user_metadata?.full_name || 'U')
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}
              </div>
            </Link>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={`Add a ${contentType === 'listing' ? 'review' : 'comment'}...`}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  className="px-6 py-2 bg-gradient-to-r from-lime-400 to-lime-300 text-black rounded-lg hover:brightness-95 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Post {contentType === 'listing' ? 'Review' : 'Comment'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-3">Sign in to leave a comment</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-gradient-to-r from-lime-400 to-lime-300 text-black rounded-lg hover:brightness-95 transition-all"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3 pt-2">
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 w-1/4 mb-2 rounded"></div>
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && comments.length === 0 && (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border dark:border-gray-700">
            <MessageCircle size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No {contentType === 'listing' ? 'reviews' : 'comments'} yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Be the first to share your thoughts!</p>
          </div>
        )}

        {!loading && comments.map(comment => renderComment(comment, false, 0))}
      </div>
    </div>
  )
}

