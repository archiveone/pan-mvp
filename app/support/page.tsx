'use client'

import { useState } from 'react'
import AppHeader from '@/components/AppHeader'
import { Search, MessageCircle, Phone, Mail, HelpCircle, Shield, CreditCard, Truck, AlertTriangle } from 'lucide-react'

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'All Topics', icon: HelpCircle },
    { id: 'getting-started', name: 'Getting Started', icon: HelpCircle },
    { id: 'buying', name: 'Buying & Selling', icon: CreditCard },
    { id: 'shipping', name: 'Shipping & Delivery', icon: Truck },
    { id: 'safety', name: 'Safety & Security', icon: Shield },
    { id: 'account', name: 'Account & Profile', icon: HelpCircle },
    { id: 'technical', name: 'Technical Issues', icon: AlertTriangle },
  ]

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'How do I create an account?',
      answer: 'Click the "Sign Up" button in the top right corner, enter your email and password, and verify your email address. You can also sign up with Google for faster registration.'
    },
    {
      id: 2,
      category: 'buying',
      question: 'How do I buy something?',
      answer: 'Browse listings on the homepage, click on items you\'re interested in, and use the "Contact Seller" button to message them directly. Arrange payment and pickup/delivery with the seller.'
    },
    {
      id: 3,
      category: 'buying',
      question: 'How do I sell something?',
      answer: 'Click the "+" button in the bottom navigation or "Sell Something" in the footer. Upload photos, add details, set your price, and publish your listing. Respond to buyer messages to complete sales.'
    },
    {
      id: 4,
      category: 'safety',
      question: 'How do I stay safe when buying/selling?',
      answer: 'Always meet in public places, bring a friend if possible, inspect items before paying, use secure payment methods, and trust your instincts. Report suspicious activity immediately.'
    },
    {
      id: 5,
      category: 'shipping',
      question: 'Do you handle shipping?',
      answer: 'Pan is a local marketplace focused on in-person transactions. Sellers can choose to offer delivery, but most transactions are pickup-based. Coordinate directly with sellers for delivery arrangements.'
    },
    {
      id: 6,
      category: 'account',
      question: 'How do I edit my profile?',
      answer: 'Go to your profile page and click the "Edit" button. You can update your name, bio, profile picture, and contact information. Changes are saved automatically.'
    },
    {
      id: 7,
      category: 'technical',
      question: 'The app is not loading properly',
      answer: 'Try refreshing the page, clearing your browser cache, or updating your browser. If the issue persists, contact our technical support team.'
    },
    {
      id: 8,
      category: 'buying',
      question: 'What payment methods are accepted?',
      answer: 'Payment methods vary by seller. Common options include cash, Venmo, PayPal, Zelle, and other digital payment apps. Always confirm payment method with the seller before meeting.'
    }
  ]

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Help & Support
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Find answers to common questions and get help when you need it
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedCategory === category.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <Icon size={24} className="mx-auto mb-2" />
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* FAQs */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => (
                <div key={faq.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <HelpCircle size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No results found. Try adjusting your search or category filter.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Still need help?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Live Chat</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Get instant help from our support team
              </p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Start Chat
              </button>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Email Support</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Send us a detailed message
              </p>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Send Email
              </button>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Phone Support</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Call us during business hours
              </p>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                Call Now
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}