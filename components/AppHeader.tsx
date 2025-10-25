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
      <header className="app-header sticky top-0 bg-white dark:bg-gray-900 z-50 border-b border-gray-200 dark:border-gray-800 safe-area-top">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-1 sm:py-1.5">
          {/* Pan Logo - Vertically centered */}
          <div className="flex items-center justify-center h-8 sm:h-10">
            <Link href="/" className="inline-block">
              <div className="logo-container flex items-center justify-center">
                <img 
                  src="/pan logo finalL.png" 
                  alt="Pan Logo" 
                  className="logo h-12 sm:h-14 hover:opacity-80 transition-opacity object-contain mix-blend-multiply dark:invert dark:mix-blend-screen"
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
