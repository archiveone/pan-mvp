'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Privacy Policy</h1>
            </div>
            </div>
          </div>
          
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="prose prose-lg max-w-none">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
            
            <p className="text-gray-600 mb-6">
              <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
            </p>

            <p className="text-gray-600 mb-8">
              At Pan, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, and safeguard your information when you use our social 
              platform and marketplace.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Personal Information</h3>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>Account information (name, email, username)</li>
              <li>Profile information (bio, profile picture, location)</li>
              <li>Content you create (posts, messages, listings)</li>
              <li>Payment information (processed securely through Stripe/PayPal)</li>
              <li>Device information (device type, operating system)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Usage Information</h3>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>How you interact with our platform</li>
              <li>Features you use most frequently</li>
              <li>Time spent on different sections</li>
              <li>Search queries and preferences</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
            
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>Provide and improve our services</li>
              <li>Personalize your experience</li>
              <li>Facilitate communication between users</li>
              <li>Process payments and transactions</li>
              <li>Send important updates and notifications</li>
              <li>Ensure platform security and prevent fraud</li>
                  <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information Sharing</h2>
            
            <p className="text-gray-600 mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>With your explicit consent</li>
              <li>To comply with legal requirements</li>
              <li>To protect our rights and safety</li>
              <li>With service providers who assist us (under strict confidentiality agreements)</li>
              <li>In case of business transfer (with notice to users)</li>
                </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
            
            <p className="text-gray-600 mb-6">
              We implement industry-standard security measures to protect your information:
            </p>
            
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
              <li>Secure payment processing</li>
              <li>Employee training on data protection</li>
                </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights (GDPR/CCPA)</h2>
            
            <p className="text-gray-600 mb-4">You have the following rights regarding your personal information:</p>
            
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate information</li>
              <li><strong>Erasure:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
              <li><strong>Restriction:</strong> Limit how we process your data</li>
              <li><strong>Objection:</strong> Opt out of certain data processing</li>
                </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies and Tracking</h2>
            
            <p className="text-gray-600 mb-6">
              We use cookies and similar technologies to enhance your experience, analyze usage patterns, 
              and provide personalized content. You can control cookie settings through your browser preferences.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
            
            <p className="text-gray-600 mb-6">
              Our service is not intended for children under 13. We do not knowingly collect personal 
              information from children under 13. If we become aware of such collection, we will take 
              steps to delete the information promptly.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">International Users</h2>
            
            <p className="text-gray-600 mb-6">
              If you are accessing our service from outside the United States, please note that your 
              information may be transferred to, stored, and processed in the United States where our 
              servers are located.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
            
            <p className="text-gray-600 mb-6">
              We may update this Privacy Policy from time to time. We will notify you of any material 
              changes by posting the new Privacy Policy on this page and updating the "Effective Date" 
              at the top of this policy.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            
            <p className="text-gray-600 mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@pan.app<br/>
                <strong>Address:</strong> [Your Business Address]<br/>
                <strong>Phone:</strong> [Your Contact Number]
                </p>
              </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                This Privacy Policy is effective as of {new Date().toLocaleDateString()} and was last updated on {new Date().toLocaleDateString()}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}