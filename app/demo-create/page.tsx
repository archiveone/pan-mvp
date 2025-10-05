'use client';

import React from 'react';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import BottomNav from '@/components/BottomNav';
import CreateButton from '@/components/CreateButton';
import SmartSuggestions from '@/components/SmartSuggestions';
import { Sparkles, Zap, Target, TrendingUp, ArrowRight } from 'lucide-react';

export default function DemoCreatePage() {
  const handleSuggestionSelect = (suggestion: any) => {
    console.log('Selected suggestion:', suggestion);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AppHeader />
      
      <div className="pt-16 pb-20">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Sparkles size={40} className="text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Create Anything, Share Everything
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Our intuitive, Duolingo-style creation flow makes it easy to share items, services, events, experiences, places, and media.
            </p>
            
            {/* Demo Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <CreateButton variant="inline" size="lg" />
              <CreateButton variant="minimal" size="lg" />
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Zap size={32} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Suggestions</h3>
              <p className="text-gray-600 mb-6">
                AI-powered recommendations based on trends, your interests, and what's popular in your area.
              </p>
              <div className="text-sm text-blue-600 font-medium flex items-center gap-2">
                Try it now <ArrowRight size={16} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Target size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Step-by-Step</h3>
              <p className="text-gray-600 mb-6">
                Guided wizard that breaks down content creation into simple, manageable steps.
              </p>
              <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                See how it works <ArrowRight size={16} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <TrendingUp size={32} className="text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Minimal Design</h3>
              <p className="text-gray-600 mb-6">
                Clean, distraction-free interface that focuses on what matters most - your content.
              </p>
              <div className="text-sm text-purple-600 font-medium flex items-center gap-2">
                Experience it <ArrowRight size={16} />
              </div>
            </div>
          </div>

          {/* Smart Suggestions Demo */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp size={24} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Smart Suggestions</h2>
                <p className="text-gray-600">See what AI recommends for you</p>
              </div>
            </div>
            <SmartSuggestions onSuggestionSelect={handleSuggestionSelect} />
          </div>

          {/* Content Types Showcase */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Six Ways to Share
            </h2>
            <p className="text-lg text-gray-600">
              From physical items to digital experiences, create anything you can imagine.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { emoji: '🛍️', title: 'Items', desc: 'Sell products, collectibles, or anything physical', color: 'from-blue-500 to-blue-600' },
              { emoji: '🔧', title: 'Services', desc: 'Offer your skills, expertise, or professional services', color: 'from-green-500 to-green-600' },
              { emoji: '🎉', title: 'Events', desc: 'Host concerts, workshops, meetups, or parties', color: 'from-purple-500 to-purple-600' },
              { emoji: '🌟', title: 'Experiences', desc: 'Create tours, classes, adventures, or unique activities', color: 'from-orange-500 to-orange-600' },
              { emoji: '📍', title: 'Places', desc: 'Share restaurants, venues, rentals, or locations', color: 'from-red-500 to-red-600' },
              { emoji: '🎵', title: 'Media', desc: 'Sell music, videos, art, podcasts, or digital content', color: 'from-pink-500 to-pink-600' }
            ].map((type, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                <div className={`w-16 h-16 bg-gradient-to-r ${type.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <span className="text-3xl">{type.emoji}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{type.title}</h3>
                <p className="text-gray-600 text-sm">{type.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <div className="bg-white rounded-2xl p-12 shadow-sm">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ready to start creating?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join thousands of creators sharing amazing content every day.
              </p>
              <CreateButton variant="inline" size="lg" />
            </div>
          </div>
        </div>
      </div>

      <AppFooter />
      <BottomNav />
    </div>
  );
}
