'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import { Shield, Download, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PrivacySettings() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleExportData = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/export-data', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to export data')
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pan-data-export-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setMessage({ type: 'success', text: 'Your data has been exported successfully!' })
    } catch (error) {
      console.error('Export error:', error)
      setMessage({ type: 'error', text: 'Failed to export data. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    const confirmText = prompt('Type "DELETE" to confirm account deletion:')
    if (confirmText !== 'DELETE') {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      // TODO: Implement account deletion API
      // This should:
      // 1. Delete all user content
      // 2. Delete user profile
      // 3. Sign out user
      // 4. Delete auth account

      alert('Account deletion will be implemented soon. Please contact support.')
    } catch (error) {
      console.error('Delete error:', error)
      setMessage({ type: 'error', text: 'Failed to delete account. Please contact support.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-gray-900 dark:text-white" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Privacy & Data
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your privacy settings and data
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            )}
            <p className={message.type === 'success' 
              ? 'text-green-800 dark:text-green-200' 
              : 'text-red-800 dark:text-red-200'
            }>
              {message.text}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Export Data */}
          <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Export Your Data
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Download a copy of all your data including posts, messages, profile information, and more.
                  You'll receive a JSON file with all your information.
                </p>
                <button
                  onClick={handleExportData}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  {loading ? 'Exporting...' : 'Export Data'}
                </button>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Data Retention
            </h2>
            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <p>We retain your data as long as your account is active.</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Profile data: Retained until account deletion</li>
                <li>Posts and listings: 7 days after deletion</li>
                <li>Messages: 30 days after deletion</li>
                <li>Activity logs: 90 days</li>
              </ul>
            </div>
          </section>

          {/* Privacy Rights */}
          <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              Your Privacy Rights
            </h2>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400 list-disc list-inside ml-4">
              <li>Right to access your personal data</li>
              <li>Right to correct inaccurate data</li>
              <li>Right to delete your data</li>
              <li>Right to data portability</li>
              <li>Right to object to data processing</li>
              <li>Right to withdraw consent</li>
            </ul>
          </section>

          {/* Delete Account */}
          <section className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Delete Account
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Account
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
