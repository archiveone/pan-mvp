'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AppHeader from '@/components/AppHeader'
import BottomNav from '@/components/BottomNav'
import { CheckCircle, Download, Mail, ArrowRight } from 'lucide-react'
import Link from 'next/link'
// import confetti from 'canvas-confetti'

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }

    // Trigger confetti animation
    setTimeout(() => {
      setShowConfetti(true)
      // if (typeof window !== 'undefined' && confetti) {
      //   confetti({
      //     particleCount: 100,
      //     spread: 70,
      //     origin: { y: 0.6 }
      //   })
      // }
    }, 500)
  }, [user, router])

  const transaction = searchParams?.get('transaction')
  const listingId = searchParams?.get('listing')
  const amount = searchParams?.get('amount')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />

      <main className="max-w-2xl mx-auto px-4 py-12 pb-20">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
            <CheckCircle size={56} className="text-green-600 dark:text-green-400" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Payment Successful!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Your booking has been confirmed
          </p>
        </div>

        {/* Transaction Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Transaction Details
          </h2>

          <div className="space-y-3">
            {transaction && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Transaction ID:</span>
                <span className="font-mono text-gray-900 dark:text-gray-100">{transaction.slice(0, 12)}...</span>
              </div>
            )}

            {amount && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Amount Paid:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">${amount} USD</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Payment Method:</span>
              <span className="text-gray-900 dark:text-gray-100">•••• 1234</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Confirmed
              </span>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            What's Next?
          </h2>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <Mail size={16} className="mt-0.5 flex-shrink-0" />
              <span>A confirmation email has been sent to your email address</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>The seller will contact you shortly to arrange details</span>
            </li>
            <li className="flex items-start gap-2">
              <Download size={16} className="mt-0.5 flex-shrink-0" />
              <span>You can view your booking history in your profile</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {listingId && (
            <Link
              href={`/listing/${listingId}`}
              className="block w-full py-3 bg-gradient-to-r from-lime-400 to-lime-300 text-black font-semibold rounded-lg hover:brightness-95 transition-all text-center"
            >
              View Listing Details
            </Link>
          )}

          <Link
            href="/hub"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Go to Hub
            <ArrowRight size={18} />
          </Link>

          <Link
            href="/"
            className="block text-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors py-2"
          >
            Continue Browsing
          </Link>
        </div>

        {/* Support */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need help? <Link href="/support" className="text-lime-600 dark:text-lime-400 hover:underline">Contact Support</Link>
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

