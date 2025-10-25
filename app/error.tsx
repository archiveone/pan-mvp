'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('❌ Page Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-100 dark:bg-red-900 rounded-full">
            <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
          Something went wrong!
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          We encountered an unexpected error while loading this page.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-auto">
            <p className="text-xs font-mono text-red-600 dark:text-red-400">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-gray-500 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Try Again
          </button>

          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/'
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Home className="w-5 h-5" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}

