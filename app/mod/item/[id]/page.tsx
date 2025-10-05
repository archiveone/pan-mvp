'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import BottomNav from '@/components/BottomNav'
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Shield, Calendar, User, Flag, Eye, Save } from 'lucide-react'

export default function ModItemPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    load()
  }, [params?.id])

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('posts').select('*').eq('id', params.id).single()
    if (!error) setItem(data)
    setLoading(false)
  }

  const approve = async () => {
    setActionLoading(true)
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return alert('Sign in required')
    
    try {
      const res = await fetch('/api/moderation/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: params.id, actorId: user.id, reason })
      })
      const json = await res.json()
      
      if (json.success) {
        // Show success message
        alert('✅ Post approved successfully!')
        router.push('/mod/queue')
      } else {
        alert(`❌ Approve failed: ${json.error}`)
      }
    } catch (error) {
      alert('❌ Network error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  const block = async (ageRestrict = false) => {
    setActionLoading(true)
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return alert('Sign in required')
    
    try {
      const res = await fetch('/api/moderation/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: params.id, actorId: user.id, reason, ageRestrict })
      })
      const json = await res.json()
      
      if (json.success) {
        // Show success message
        const message = ageRestrict ? '✅ Post age-restricted successfully!' : '✅ Post blocked successfully!'
        alert(message)
        router.push('/mod/queue')
      } else {
        alert(`❌ Block failed: ${json.error}`)
      }
    } catch (error) {
      alert('❌ Network error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 py-6 pb-20">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </main>
        <AppFooter />
        <BottomNav />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <AppHeader />
        <main className="max-w-4xl mx-auto px-4 py-6 pb-20">
          <div className="text-center py-12">
            <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Post not found</h3>
            <p className="text-gray-600 dark:text-gray-400">This post may have been deleted or doesn't exist.</p>
          </div>
        </main>
        <AppFooter />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <AppHeader />
      
      <main className="max-w-4xl mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/mod/queue')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Review Content</h1>
              <p className="text-gray-600 dark:text-gray-400">Moderate this post for safety and compliance</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Posted by User</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{item.title}</h2>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{item.content}</div>
                
                {/* Media */}
                {item.media_url && (
                  <div className="mt-4">
                    <img 
                      src={item.media_url} 
                      alt="Post media" 
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Safety Analysis */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Flag className="w-5 h-5" />
                Safety Analysis
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Safety Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (item.safety_score || 0) < 30 ? 'bg-green-500' :
                          (item.safety_score || 0) < 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${item.safety_score || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.safety_score || 0}/100
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    !item.safety_checked ? 'bg-yellow-100 text-yellow-800' :
                    item.is_safety_approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {!item.safety_checked ? 'Pending Review' :
                     item.is_safety_approved ? 'Approved' : 'Flagged'}
                  </span>
                </div>

                {item.safety_violations && item.safety_violations.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Detected Issues:</span>
                    <div className="flex flex-wrap gap-2">
                      {item.safety_violations.map((violation: string, idx: number) => (
                        <span key={idx} className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                          {violation}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions Panel */}
          <div className="space-y-6">
            {/* Moderation Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Moderation Actions</h3>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reason / Notes
                  </label>
                  <textarea
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    rows={3}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Add notes about your decision..."
                  />
                </div>

                <div className="space-y-2">
                  <button
                    onClick={approve}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </button>

                  <button
                    onClick={() => block(false)}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-4 h-4" />
                    {actionLoading ? 'Processing...' : 'Block'}
                  </button>

                  <button
                    onClick={() => block(true)}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {actionLoading ? 'Processing...' : 'Age Restrict'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Quick Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Created:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {item.content_type || 'Post'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Category:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {item.category || 'Uncategorized'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  )
}


