'use client'

import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import { FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <AppHeader />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-black dark:bg-white rounded-xl">
              <FileText className="w-8 h-8 text-white dark:text-black" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Terms of Service
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Acceptance */}
          <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              By accessing or using Pan, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this platform.
            </p>
          </section>

          {/* User Accounts */}
          <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              2. User Accounts
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>When creating an account, you must:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account</li>
                <li>Be at least 13 years old (or 16 in EU)</li>
                <li>Not create multiple accounts</li>
                <li>Not impersonate others</li>
              </ul>
            </div>
          </section>

          {/* Acceptable Use */}
          <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  3. Acceptable Use
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2">You may use Pan to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-gray-600 dark:text-gray-400">
                  <li>Share content and connect with others</li>
                  <li>Buy and sell items in the marketplace</li>
                  <li>Join communities and participate in discussions</li>
                  <li>Organize and attend events</li>
                  <li>Message other users</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Prohibited Conduct */}
          <section className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  4. Prohibited Conduct
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2">You may NOT:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-gray-600 dark:text-gray-400">
                  <li>Post illegal, harmful, or offensive content</li>
                  <li>Harass, threaten, or bully others</li>
                  <li>Spam or send unsolicited messages</li>
                  <li>Violate intellectual property rights</li>
                  <li>Attempt to hack or disrupt the platform</li>
                  <li>Use bots or automated tools</li>
                  <li>Sell prohibited items or services</li>
                  <li>Engage in fraudulent activity</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Content */}
          <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              5. Content Rights
            </h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>
                You retain ownership of content you post on Pan. By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content on the platform.
              </p>
              <p>
                You are responsible for your content and must have the rights to post it.
              </p>
            </div>
          </section>

          {/* Marketplace */}
          <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              6. Marketplace Terms
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
              <li>Pan is a platform connecting buyers and sellers</li>
              <li>We are not party to transactions between users</li>
              <li>Sellers are responsible for accurate listings</li>
              <li>Payment processing fees may apply</li>
              <li>Refunds are subject to seller policies</li>
            </ul>
          </section>

          {/* Termination */}
          <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              7. Termination
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              We reserve the right to suspend or terminate your account at any time for violating these terms. You may also delete your account at any time through your account settings.
            </p>
          </section>

          {/* Disclaimer */}
          <section className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  8. Disclaimer
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Pan is provided "as is" without warranties of any kind. We do not guarantee uninterrupted access, accuracy of content, or specific results from using the platform.
                </p>
              </div>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              9. Limitation of Liability
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Pan shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
            </p>
          </section>

          {/* Changes */}
          <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              10. Changes to Terms
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              We may modify these terms at any time. Continued use of Pan after changes constitutes acceptance of the new terms. We will notify users of significant changes.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Contact Us
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-3">
              For questions about these Terms of Service:
            </p>
            <p className="text-gray-900 dark:text-white font-medium">
              legal@pan.app
            </p>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}

