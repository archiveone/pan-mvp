'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Settings, Palette, Building2, Shield } from 'lucide-react'

export default function ProfileNavigation() {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/profile',
      label: 'Basic Profile',
      icon: User,
      description: 'Basic profile information'
    },
    {
      href: '/profile/comprehensive',
      label: 'Advanced Profile',
      icon: Settings,
      description: 'Complete profile management'
    },
    {
      href: '/profile/hub',
      label: 'Hub Customization',
      icon: Palette,
      description: 'Customize your hub appearance'
    },
    {
      href: '/profile/business',
      label: 'Business Setup',
      icon: Building2,
      description: 'Business account features'
    },
    {
      href: '/profile/verification',
      label: 'Verification',
      icon: Shield,
      description: 'Account verification status'
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Management</h3>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-black text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <div>
                <div className="font-medium">{item.label}</div>
                <div className={`text-xs ${
                  isActive ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  {item.description}
                </div>
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

