'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import CreateButton from './CreateButton'
import AuthModal from './AuthModal'
import NotificationBell from './NotificationBell'

export default function BottomNav() {
  const { user, profile } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center relative">
          {/* Create Button - Perfectly Centered */}
          <CreateButton variant="floating" size="md" />

          {/* Notification Bell & Hub Button - Bottom Right */}
          {user ? (
            <div className="absolute right-0 flex items-center gap-2">
              {/* Notification Bell */}
              <NotificationBell />
              
              {/* User Hub Button */}
              <Link
                href="/hub"
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Your Hub"
              >
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-r from-lime-400 to-lime-300">
                {profile?.avatar_url || user.user_metadata?.avatar_url ? (
                  <img 
                    src={profile?.avatar_url || user.user_metadata?.avatar_url} 
                    alt={profile?.name || user.user_metadata?.full_name || 'Profile'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        const name = profile?.name || user.user_metadata?.full_name || 'User'
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
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-24">
                  {profile?.name || user.user_metadata?.full_name || 'Profile'}
                </div>
              </div>
              </Link>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="absolute right-0 flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Sign in to access your hub"
            >
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-sm">👤</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Sign In</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">to access hub</div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </nav>
  )
}