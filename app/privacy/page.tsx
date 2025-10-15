'use client'

import AppHeader from '@/components/AppHeader'
import AppFooter from '@/components/AppFooter'
import { Shield, Lock, Eye, Database, Mail, AlertCircle } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <AppHeader />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-black dark:bg-white rounded-xl">
              <Shield className="w-8 h-8 text-white dark:text-black" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Privacy Policy
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <p className="text-lg text-gray-600 dark:text-gray-400">
            At Pan, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information.
          </p>
        </div>

        <div className="space-y-8">
          {/* Information We Collect */}
          <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <Database className="w-6 h-6 text-gray-900 dark:text-white flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Information We Collect
                </h2>
                <div className="space-y-3 text-gray-600 dark:text-gray-400">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Account Information</h3>
                    <p>Name, email address, username, password, and profile details you provide when creating an account.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Content</h3>
                    <p>Posts, listings, messages, comments, images, and other content you create or share on Pan.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Usage Data</h3>
                    <p>How you interact with our platform, including pages visited, features used, and time spent.</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Device Information</h3>
                    <p>IP address, browser type, device type, operating system, and unique device identifiers.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <Eye className="w-6 h-6 text-gray-900 dark:text-white flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  How We Use Your Information
                </h2>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400 list-disc list-inside">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Personalize your experience and show relevant content</li>
                  <li>Communicate with you about updates, features, and support</li>
                  <li>Ensure safety and security of our platform</li>
                  <li>Analyze usage patterns to improve our services</li>
                  <li>Comply with legal obligations</li>
                  <li>Prevent fraud and abuse</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Information Sharing */}
          <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <Lock className="w-6 h-6 text-gray-900 dark:text-white flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Information Sharing
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  We do not sell your personal information. We may share your information in the following circumstances:
                </p>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400 list-disc list-inside">
                  <li><strong>With your consent:</strong> When you explicitly agree to share your information</li>
                  <li><strong>Public content:</strong> Content you post publicly is visible to other users</li>
                  <li><strong>Service providers:</strong> Third-party services that help us operate our platform</li>
                  <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Your Rights */}
          <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-gray-900 dark:text-white flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Your Rights & Choices
                </h2>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400 list-disc list-inside">
                  <li><strong>Access:</strong> Request access to your personal information</li>
                  <li><strong>Correction:</strong> Update or correct your information</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                  <li><strong>Export:</strong> Download a copy of your data</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                  <li><strong>Cookie preferences:</strong> Manage your cookie settings</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Security */}
          <section className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Data Security
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              We implement industry-standard security measures to protect your information, including encryption, secure servers, and regular security audits. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Contact Us
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  If you have questions about this Privacy Policy or want to exercise your rights, contact us at:
                </p>
                <p className="text-gray-900 dark:text-white font-medium">
                  privacy@pan.app
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}

