'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import BottomNav from '@/components/BottomNav';
import CreateButton from '@/components/CreateButton';
import SmartSuggestions from '@/components/SmartSuggestions';
import BusinessShowcase from '@/components/BusinessShowcase';
import { Sparkles, Zap, Target, TrendingUp } from 'lucide-react';

export default function CreatePage() {
  const { user } = useAuth();
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSuggestionSelect = (suggestion: any) => {
    console.log('Selected suggestion:', suggestion);
    // This would open the wizard with pre-filled data
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in to create content</h2>
            <p className="text-gray-600">Please sign in to start sharing</p>
          </div>
        </div>
        <AppFooter />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="pt-16 pb-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles size={32} className="text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              What would you like to share?
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create anything from items to sell, services to offer, events to host, or experiences to share.
            </p>
          </div>

          {/* Business Showcase */}
          <BusinessShowcase />

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Zap size={24} className="text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Quick Create</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Get AI-powered suggestions based on what's trending and your interests.
              </p>
              <CreateButton variant="inline" size="lg" />
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Target size={24} className="text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Start from Scratch</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Begin with a blank canvas and create exactly what you envision.
              </p>
              <CreateButton variant="minimal" size="lg" />
            </div>
          </div>

          {/* Smart Suggestions */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp size={24} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Smart Suggestions</h2>
                <p className="text-gray-600">AI-powered recommendations just for you</p>
              </div>
            </div>
            <SmartSuggestions onSuggestionSelect={handleSuggestionSelect} />
          </div>

          {/* Content Types */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
              What can you create?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { emoji: '🛍️', title: 'Items', desc: 'Sell products, collectibles, or anything physical', color: 'bg-blue-500' },
                { emoji: '🔧', title: 'Services', desc: 'Offer your skills, expertise, or professional services', color: 'bg-green-500' },
                { emoji: '🎉', title: 'Events', desc: 'Host concerts, workshops, meetups, or parties', color: 'bg-purple-500' },
                { emoji: '🌟', title: 'Experiences', desc: 'Create tours, classes, adventures, or unique activities', color: 'bg-orange-500' },
                { emoji: '📍', title: 'Places', desc: 'Share restaurants, venues, rentals, or locations', color: 'bg-red-500' },
                { emoji: '🎵', title: 'Media', desc: 'Sell music, videos, art, podcasts, or digital content', color: 'bg-pink-500' }
              ].map((type, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 ${type.color} rounded-full flex items-center justify-center mb-4`}>
                    <span className="text-2xl">{type.emoji}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{type.title}</h3>
                  <p className="text-sm text-gray-600">{type.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AppFooter />
      <BottomNav />
    </div>
  );
}