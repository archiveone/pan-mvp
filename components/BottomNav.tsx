'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import CreateButton from './CreateButton'
import AuthModal from './AuthModal'

export default function BottomNav() {
  const { user, profile } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-center relative">
          {/* Create Button - Perfectly Centered */}
          <CreateButton variant="floating" size="md" />

          {/* User Hub Button - Positioned absolutely to the right */}
          {user ? (
            <Link
              href="/hub"
              className="absolute right-0 flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Your Hub"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                {user.user_metadata?.avatar_url || profile?.avatar_url ? (
                  <img 
                    src={user.user_metadata?.avatar_url || profile?.avatar_url} 
                    alt="Profile"
                    className="w-8 h-8 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">👤</span>
                  </div>
                )}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-900 truncate max-w-24">
                  {user.user_metadata?.full_name || 'Your Hub'}
                </div>
                <div className="text-xs text-gray-500">Hub</div>
              </div>
            </Link>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="absolute right-0 flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Sign in to access your hub"
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm">👤</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-500">Sign In</div>
                <div className="text-xs text-gray-400">to access hub</div>
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