'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Download, Share2, MoreHorizontal, FileText, Eye, Clock, User, Star, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DocumentPost {
  id: string
  title: string
  content: string
  document_url: string
  file_type: string
  file_size: number
  download_count: number
  view_count: number
  like_count: number
  comment_count: number
  is_premium: boolean
  premium_price?: number
  is_downloadable: boolean
  user: {
    id: string
    username: string
    avatar_url?: string
    full_name?: string
  }
  created_at: string
}

export default function DocumentDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const [documentPost, setDocumentPost] = useState<DocumentPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadDocumentPost(params.id as string)
    }
  }, [params.id])

  const loadDocumentPost = async (id: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            username,
            avatar_url,
            full_name
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        setDocumentPost({
          id: data.id,
          title: data.title,
          content: data.content,
          document_url: data.document_url,
          file_type: data.file_type,
          file_size: data.file_size,
          download_count: data.download_count || 0,
          view_count: data.view_count || 0,
          like_count: data.like_count || 0,
          comment_count: data.comment_count || 0,
          is_premium: data.is_premium || false,
          premium_price: data.premium_price,
          is_downloadable: data.is_downloadable !== false,
          user: data.profiles,
          created_at: data.created_at
        })
      }
    } catch (err) {
      console.error('Error loading document post:', err)
      setError('Failed to load document post')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!documentPost) return
    
    try {
      // Track download count
      await supabase.rpc('increment_download_count', { content_id: documentPost.id })
      setDocumentPost(prev => prev ? { ...prev, download_count: prev.download_count + 1 } : null)
      
      // Trigger download
      const link = document.createElement('a')
      link.href = documentPost.document_url
      link.download = documentPost.title
      link.click()
    } catch (error) {
      console.error('Error downloading document:', error)
    }
  }

  const toggleSave = async () => {
    if (!user || !documentPost) return
    
    try {
      if (isSaved) {
        // Remove from saved
        await supabase
          .from('saved_posts')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', documentPost.id)
      } else {
        // Add to saved
        await supabase
          .from('saved_posts')
          .insert({
            user_id: user.id,
            post_id: documentPost.id
          })
      }
      
      setIsSaved(!isSaved)
    } catch (error) {
      console.error('Error toggling save:', error)
    }
  }

  const toggleLike = async () => {
    if (!user || !documentPost) return
    
    try {
      if (isLiked) {
        // Remove like
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', documentPost.id)
      } else {
        // Add like
        await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: documentPost.id
          })
      }
      
      setIsLiked(!isLiked)
      setDocumentPost(prev => prev ? { 
        ...prev, 
        like_count: isLiked ? prev.like_count - 1 : prev.like_count + 1 
      } : null)
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase()
    if (type.includes('pdf')) return '📄'
    if (type.includes('doc')) return '📝'
    if (type.includes('xls')) return '📊'
    if (type.includes('ppt')) return '📽️'
    if (type.includes('txt')) return '📄'
    return '📄'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading document...</p>
        </div>
      </div>
    )
  }

  if (error || !documentPost) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Document Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {error || 'This document could not be found.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <span className="text-2xl">{getFileIcon(documentPost.file_type)}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                  {documentPost.title}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="uppercase font-medium">{documentPost.file_type}</span>
                  <span>•</span>
                  <span>{formatFileSize(documentPost.file_size)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleLike}
                className={`p-2 rounded-full transition-colors ${
                  isLiked 
                    ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Star size={20} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
              
              <button
                onClick={toggleSave}
                className={`p-2 rounded-full transition-colors ${
                  isSaved 
                    ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Download size={20} fill={isSaved ? 'currentColor' : 'none'} />
              </button>
              
              <button className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Share2 size={20} />
              </button>
              
              <button className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Document Preview */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
              {/* Document Preview Area */}
              <div className="aspect-[4/3] bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 flex items-center justify-center mb-6">
                {documentPost.file_type.toLowerCase().includes('pdf') ? (
                  <iframe
                    src={documentPost.document_url}
                    className="w-full h-full rounded-xl"
                    title={documentPost.title}
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-6xl mb-4">{getFileIcon(documentPost.file_type)}</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {documentPost.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {documentPost.file_type.toUpperCase()} • {formatFileSize(documentPost.file_size)}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {documentPost.is_downloadable && (
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <Download size={20} />
                      Download
                    </button>
                  )}
                  
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <Share2 size={20} />
                    Share
                  </button>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Eye size={16} />
                    <span>{documentPost.view_count.toLocaleString()} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download size={16} />
                    <span>{documentPost.download_count.toLocaleString()} downloads</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Document Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Document Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type</span>
                  <span className="font-medium uppercase">{documentPost.file_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Size</span>
                  <span className="font-medium">{formatFileSize(documentPost.file_size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Views</span>
                  <span className="font-medium">{documentPost.view_count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Downloads</span>
                  <span className="font-medium">{documentPost.download_count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Likes</span>
                  <span className="font-medium">{documentPost.like_count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Comments</span>
                  <span className="font-medium">{documentPost.comment_count.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Created</span>
                  <span className="font-medium">{formatDate(documentPost.created_at)}</span>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Uploaded by</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                  {documentPost.user.avatar_url ? (
                    <img
                      src={documentPost.user.avatar_url}
                      alt={documentPost.user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User size={24} className="text-gray-600 dark:text-gray-400" />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {documentPost.user.full_name || documentPost.user.username}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    @{documentPost.user.username}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {documentPost.content && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {documentPost.content}
                </p>
              </div>
            )}

            {/* Comments */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Comments ({documentPost.comment_count})
              </h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <User size={16} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Username
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        2 hours ago
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Great document! Very helpful information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}