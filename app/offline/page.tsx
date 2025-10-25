'use client'

import { Wifi } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setTimeout(() => {
        router.push('/')
      }, 1000)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial status
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className={`p-4 rounded-full ${isOnline ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
            <Wifi 
              size={64} 
              className={isOnline ? 'text-green-600' : 'text-gray-400'}
              strokeWidth={1.5}
            />
          </div>
        </div>

        {isOnline ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Back Online!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Redirecting you back to Pan...
            </p>
            <div className="w-48 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-green-600 animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              You're Offline
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Check your internet connection and try again
            </p>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload()
                }
              }}
              className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Try Again
            </button>
          </>
        )}

        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Some features may be available offline:</p>
          <ul className="mt-2 space-y-1">
            <li>• View cached content</li>
            <li>• Browse your hub</li>
            <li>• Read saved messages</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

