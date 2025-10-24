'use client';

import React, { useState } from 'react';
import { ArrowLeft, Mail, MessageCircle, HelpCircle, Bug, FileText, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SupportPage() {
  const router = useRouter();
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubmitted(true);
    setIsSubmitting(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setContactForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const faqs = [
    {
      question: "How do I create an account?",
      answer: "Click the 'Sign Up' button on the homepage, enter your email and password, and verify your email address. You can also sign up with Google for faster registration."
    },
    {
      question: "How do I reset my password?",
      answer: "Go to the login page and click 'Forgot Password'. Enter your email address and check your inbox for reset instructions."
    },
    {
      question: "How do I create a post?",
      answer: "Click the '+' button in the navigation bar, select 'Create Post', add your content (text, images, or video), and click 'Post'."
    },
    {
      question: "How do I organize my hub?",
      answer: "Go to your profile and click 'My Hub'. You can drag and drop content into different boxes to organize your posts, photos, and other content."
    },
    {
      question: "How do I buy or sell items?",
      answer: "To sell: Create a listing in the marketplace section. To buy: Browse listings, click on items you're interested in, and contact the seller through our messaging system."
    },
    {
      question: "How do I report inappropriate content?",
      answer: "Click the three dots menu on any post or user profile, then select 'Report'. Our moderation team will review the report within 24 hours."
    },
    {
      question: "How do I delete my account?",
      answer: "Go to Settings > Account > Delete Account. Please note that this action is permanent and cannot be undone."
    },
    {
      question: "How do I change my privacy settings?",
      answer: "Go to Settings > Privacy to control who can see your posts, send you messages, and view your profile information."
    }
  ];

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
            <h1 className="text-xl font-semibold text-gray-900">Support & Help</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Help Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <HelpCircle className="w-8 h-8 text-blue-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">FAQ</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Find answers to common questions about using Pan.
            </p>
            <button 
              onClick={() => document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Browse FAQ →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <MessageCircle className="w-8 h-8 text-green-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Live Chat</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Chat with our support team in real-time.
            </p>
            <button className="text-green-600 hover:text-green-700 font-medium">
              Start Chat →
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Mail className="w-8 h-8 text-purple-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Email Support</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Send us a detailed message and we'll respond within 24 hours.
            </p>
            <button 
              onClick={() => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Send Email →
            </button>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Contact Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <Mail className="w-6 h-6 text-blue-500 mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Email Support</h3>
                <p className="text-gray-600">support@pan.app</p>
                <p className="text-sm text-gray-500">Response within 24 hours</p>
              </div>
            </div>

            <div className="flex items-start">
              <Phone className="w-6 h-6 text-green-500 mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Phone Support</h3>
                <p className="text-gray-600">[Your Phone Number]</p>
                <p className="text-sm text-gray-500">Mon-Fri, 9 AM - 6 PM EST</p>
              </div>
            </div>

            <div className="flex items-start">
              <Bug className="w-6 h-6 text-red-500 mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Bug Reports</h3>
                <p className="text-gray-600">bugs@pan.app</p>
                <p className="text-sm text-gray-500">For technical issues</p>
              </div>
            </div>

            <div className="flex items-start">
              <FileText className="w-6 h-6 text-purple-500 mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Legal Inquiries</h3>
                <p className="text-gray-600">legal@pan.app</p>
                <p className="text-sm text-gray-500">For legal matters</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div id="contact-section" className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Send us a Message</h2>
          
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Message Sent!</h3>
              <p className="text-gray-600 mb-4">
                Thank you for contacting us. We'll get back to you within 24 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={contactForm.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={contactForm.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={contactForm.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="general">General Question</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing & Payments</option>
                  <option value="account">Account Issues</option>
                  <option value="report">Report Content</option>
                  <option value="feature">Feature Request</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={contactForm.subject}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  value={contactForm.message}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Please provide as much detail as possible..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

        {/* FAQ Section */}
        <div id="faq-section" className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Still need help?
            </h3>
            <p className="text-blue-700 mb-4">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <button 
              onClick={() => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
