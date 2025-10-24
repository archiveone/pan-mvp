'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from './AuthModal'

interface AppHeaderProps {
  // No props needed for the simplified header
}

export default function AppHeader() {
  const { user, signOut } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  return (
    <>
      <header className="app-header sticky top-0 bg-white dark:bg-gray-900 z-50 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-1 sm:py-2">
          {/* Pan Logo - Always at the top */}
          <div className="text-center">
            <Link href="/" className="inline-block">
              <div className="logo-container h-8 sm:h-10 overflow-hidden flex items-center justify-center">
                <img 
                  src="/pan logo finalL.png" 
                  alt="Pan Logo" 
                  className="logo h-16 sm:h-20 mx-auto hover:opacity-80 transition-opacity object-cover mix-blend-multiply dark:invert dark:mix-blend-screen"
                />
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  )
}
