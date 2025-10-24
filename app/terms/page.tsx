'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TermsOfService() {
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
            <h1 className="text-xl font-semibold text-gray-900">Terms of Service</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="prose prose-lg max-w-none">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
            
            <p className="text-gray-600 mb-6">
              <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
            </p>

            <p className="text-gray-600 mb-8">
              Welcome to Pan! These Terms of Service ("Terms") govern your use of our social platform and marketplace. 
              By accessing or using our service, you agree to be bound by these Terms.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptance of Terms</h2>
            
            <p className="text-gray-600 mb-6">
              By creating an account or using our service, you acknowledge that you have read, understood, 
              and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, 
              please do not use our service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Description of Service</h2>
            
            <p className="text-gray-600 mb-6">
              Pan is a social platform and marketplace that allows users to:
            </p>
            
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>Create and share posts, photos, and videos</li>
              <li>Organize content in personal hubs</li>
                  <li>Buy and sell items in the marketplace</li>
              <li>Connect with friends and communities</li>
              <li>Send messages and participate in group chats</li>
              <li>Create and join events</li>
              <li>Follow other users and build networks</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Accounts</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Account Creation</h3>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>You must be at least 13 years old to create an account</li>
              <li>You must provide accurate and complete information</li>
              <li>You are responsible for maintaining account security</li>
              <li>One person may not maintain multiple accounts</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Account Responsibilities</h3>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>Keep your login credentials secure</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>You are responsible for all activity under your account</li>
              <li>Update your information when it changes</li>
                </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">User Conduct</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Prohibited Activities</h3>
            <p className="text-gray-600 mb-4">You agree not to:</p>
            
            <ul className="list-disc pl-6 mb-6 text-gray-600">
                  <li>Post illegal, harmful, or offensive content</li>
              <li>Harass, abuse, or threaten other users</li>
              <li>Impersonate others or create fake accounts</li>
                  <li>Spam or send unsolicited messages</li>
                  <li>Violate intellectual property rights</li>
              <li>Attempt to hack or compromise our systems</li>
              <li>Use automated tools to access our service</li>
              <li>Engage in fraudulent activities</li>
              <li>Post false or misleading information</li>
              <li>Distribute malware or harmful software</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Content and Intellectual Property</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Content</h3>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>You retain ownership of content you create</li>
              <li>You grant us a license to use your content on our platform</li>
              <li>You are responsible for ensuring you have rights to your content</li>
              <li>You must not post content that violates others' rights</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Our Content</h3>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>Our platform, design, and features are protected by copyright</li>
              <li>You may not copy, modify, or distribute our content</li>
              <li>Our trademarks and logos are our property</li>
                </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Marketplace and Transactions</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Buying and Selling</h3>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>All transactions are between users directly</li>
              <li>We facilitate but do not guarantee transactions</li>
              <li>Users are responsible for payment and delivery</li>
              <li>We may charge fees for certain marketplace features</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Prohibited Items</h3>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>Illegal items or services</li>
              <li>Counterfeit or stolen goods</li>
              <li>Dangerous or hazardous materials</li>
              <li>Adult content or services</li>
              <li>Weapons or ammunition</li>
              <li>Prescription drugs or medical devices</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Privacy and Data</h2>
            
            <p className="text-gray-600 mb-6">
              Your privacy is important to us. Please review our Privacy Policy to understand how we 
              collect, use, and protect your information. By using our service, you consent to our 
              data practices as described in our Privacy Policy.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Availability</h2>
            
            <p className="text-gray-600 mb-6">
              We strive to provide reliable service, but we cannot guarantee uninterrupted access. 
              We may temporarily suspend service for maintenance, updates, or other reasons. We are 
              not liable for any downtime or service interruptions.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Termination</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">By You</h3>
            <p className="text-gray-600 mb-6">
              You may terminate your account at any time by contacting us or using account deletion 
              features in the app. Upon termination, your content may be deleted according to our 
              data retention policies.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">By Us</h3>
            <p className="text-gray-600 mb-6">
              We may suspend or terminate your account if you violate these Terms, engage in harmful 
              behavior, or for other reasons at our discretion. We will provide notice when possible.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Disclaimers and Limitations</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Service Disclaimer</h3>
            <p className="text-gray-600 mb-6">
              Our service is provided "as is" without warranties of any kind. We disclaim all warranties, 
              express or implied, including merchantability, fitness for a particular purpose, and non-infringement.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Limitation of Liability</h3>
            <p className="text-gray-600 mb-6">
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages, including loss of profits, data, or use, arising 
              from your use of our service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Dispute Resolution</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Governing Law</h3>
            <p className="text-gray-600 mb-6">
              These Terms are governed by the laws of [Your Jurisdiction]. Any disputes will be resolved 
              in the courts of [Your Jurisdiction].
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">Dispute Process</h3>
            <ul className="list-disc pl-6 mb-6 text-gray-600">
              <li>Contact us first to attempt resolution</li>
              <li>If unresolved, disputes may be subject to binding arbitration</li>
              <li>Class action waivers may apply</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to Terms</h2>
            
            <p className="text-gray-600 mb-6">
              We may update these Terms from time to time. We will notify you of material changes by 
              posting the new Terms on our platform and updating the "Effective Date." Your continued 
              use of our service after changes constitutes acceptance of the new Terms.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            
            <p className="text-gray-600 mb-4">
              If you have questions about these Terms, please contact us:
            </p>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> legal@pan.app<br/>
                <strong>Address:</strong> [Your Business Address]<br/>
                <strong>Phone:</strong> [Your Contact Number]
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                These Terms of Service are effective as of {new Date().toLocaleDateString()} and were last updated on {new Date().toLocaleDateString()}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}