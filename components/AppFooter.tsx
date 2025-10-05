import Link from 'next/link'

export default function AppFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo Section */}
          <div className="text-center md:text-left">
            <Link href="/" className="inline-block">
              <img 
                src="/pan logo transparent.png" 
                alt="Pan Logo" 
                className="h-10 mx-auto md:mx-0 mb-4 logo-white"
              />
            </Link>
            <p className="text-gray-600 text-sm">
              Your local marketplace for buying and selling
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Connect with your community through trusted transactions
            </p>
          </div>
          
          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link href="/" className="block text-gray-600 hover:text-black transition-colors text-sm">
                Browse Listings
              </Link>
              <Link href="/dashboard" className="block text-gray-600 hover:text-black transition-colors text-sm">
                My Dashboard
              </Link>
              <Link href="/create-listing" className="block text-gray-600 hover:text-black transition-colors text-sm">
                Sell Something
              </Link>
              <Link href="/messages" className="block text-gray-600 hover:text-black transition-colors text-sm">
                Messages
              </Link>
              <Link href="/profile" className="block text-gray-600 hover:text-black transition-colors text-sm">
                My Profile
              </Link>
            </div>
          </div>
          
          {/* Support & Legal */}
          <div className="text-center md:text-left">
            <h3 className="font-semibold text-gray-900 mb-4">Support & Legal</h3>
            <div className="space-y-2">
              <Link href="#" className="block text-gray-600 hover:text-black transition-colors text-sm">
                How it works
              </Link>
              <Link href="#" className="block text-gray-600 hover:text-black transition-colors text-sm">
                Safety tips
              </Link>
              <Link href="#" className="block text-gray-600 hover:text-black transition-colors text-sm">
                Help center
              </Link>
              <Link href="#" className="block text-gray-600 hover:text-black transition-colors text-sm">
                Contact us
              </Link>
              <Link href="#" className="block text-gray-600 hover:text-black transition-colors text-sm">
                Terms of Service
              </Link>
              <Link href="#" className="block text-gray-600 hover:text-black transition-colors text-sm">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
        
        {/* Bottom Copyright */}
        <div className="border-t border-gray-200 mt-8 pt-6 text-center">
          <p className="text-gray-500 text-sm">
            © 2024 Pan. All rights reserved. Built with ❤️ for local communities.
          </p>
        </div>
      </div>
    </footer>
  )
}
