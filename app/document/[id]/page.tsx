'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'
import { FileText, Download, Eye, Calendar, File } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function DocumentDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  
  const [document, setDocument] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDocument()
  }, [params.id])

  const loadDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('document_posts')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            username,
            avatar_url
          )
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error
      setDocument(data)
    } catch (error) {
      console.error('Error loading document:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!document) return

    // Increment download count
    await supabase.rpc('increment_document_downloads', { post_id: params.id })

    // Download file
    window.open(document.document_url, '_blank')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return '📄'
      case 'doc':
      case 'docx':
        return '📝'
      case 'xls':
      case 'xlsx':
        return '📊'
      case 'ppt':
      case 'pptx':
        return '📽️'
      default:
        return '📁'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading document...</p>
        </div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Document not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 py-12 pb-24">
        {/* Document Preview */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-12 mb-8 text-center">
          <div className="text-8xl mb-4">{getFileIcon(document.file_type)}</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {document.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {document.description}
          </p>

          {/* File Info */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-8">
            <div className="flex items-center gap-2">
              <File className="w-4 h-4" />
              <span>{document.file_type.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>{formatFileSize(document.file_size)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{document.download_count || 0} downloads</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(document.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Actions */}
          {document.is_downloadable && (
            <button
              onClick={handleDownload}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors inline-flex items-center gap-3 text-lg"
            >
              <Download className="w-6 h-6" />
              Download Document
            </button>
          )}
        </div>

        {/* PDF Viewer (if PDF) */}
        {document.file_type.toLowerCase() === 'pdf' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-8">
            <iframe
              src={`${document.document_url}#toolbar=0`}
              className="w-full h-[600px] rounded-lg"
              title={document.title}
            />
          </div>
        )}

        {/* Creator Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Uploaded by</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              {document.profiles?.avatar_url ? (
                <img src={document.profiles.avatar_url} alt={document.profiles.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  👤
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                {document.profiles?.name || 'Unknown'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{document.profiles?.username || 'user'}
              </p>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  )
}

