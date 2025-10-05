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
          <header className="sticky top-0 bg-white z-10">
        <div className="max-w-6xl mx-auto px-4 py-1">
          {/* Pan Logo - Always at the top */}
          <div className="text-center">
            <Link href="/" className="inline-block">
              <img 
                src="/pan logo transparent.png" 
                alt="Pan Logo" 
                className="h-14 mx-auto hover:opacity-80 transition-opacity logo-white"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
      />
    </>
  )
}
