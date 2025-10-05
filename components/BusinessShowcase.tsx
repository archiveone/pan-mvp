'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Star, TrendingUp, Users, DollarSign, Zap, Target, Gift, Heart, Trophy } from 'lucide-react';

export default function BusinessShowcase() {
  const [currentExample, setCurrentExample] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const businessExamples = [
    {
      type: 'Sell Products',
      emoji: '🛒',
      title: 'Vintage Camera Collection',
      price: '$299',
      description: 'Professional photographer selling rare vintage cameras',
      color: 'from-blue-500 to-blue-600',
      icon: DollarSign
    },
    {
      type: 'Host Events',
      emoji: '🎫',
      title: 'Yoga Workshop Series',
      price: '$45',
      description: 'Certified instructor teaching mindfulness and movement',
      color: 'from-green-500 to-green-600',
      icon: Users
    },
    {
      type: 'Rent Spaces',
      emoji: '🏠',
      title: 'Cozy Studio Apartment',
      price: '$89/night',
      description: 'Perfect for digital nomads and short stays',
      color: 'from-purple-500 to-purple-600',
      icon: Target
    },
    {
      type: 'Create Content',
      emoji: '🎵',
      title: 'Original Music Album',
      price: '$12',
      description: 'Indie artist sharing their latest musical journey',
      color: 'from-pink-500 to-pink-600',
      icon: Zap
    },
    {
      type: 'Offer Services',
      emoji: '🔧',
      title: 'Web Design Consultation',
      price: '$150/hour',
      description: 'Expert developer helping startups build their online presence',
      color: 'from-orange-500 to-orange-600',
      icon: Star
    },
    {
      type: 'Build Community',
      emoji: '👥',
      title: 'Entrepreneur Network',
      price: 'Free',
      description: 'Connect with like-minded business owners and founders',
      color: 'from-teal-500 to-teal-600',
      icon: Heart
    }
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentExample(prev => (prev + 1) % businessExamples.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const current = businessExamples[currentExample];

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-6 mb-8 overflow-hidden">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900">Start Your Business Today</h2>
          <Trophy className="w-6 h-6 text-yellow-500" />
        </div>
        <p className="text-gray-600">Join thousands of creators, entrepreneurs, and professionals earning on Pan</p>
      </div>

      {/* Animated Business Example */}
      <div className="relative">
        <div className={`transition-all duration-500 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 bg-gradient-to-r ${current.color} rounded-full flex items-center justify-center`}>
                <span className="text-2xl">{current.emoji}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-500">{current.type}</span>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{current.title}</h3>
                <p className="text-sm text-gray-600">{current.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{current.price}</div>
                <div className="text-sm text-gray-500">per item</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>4.9 rating</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-blue-500" />
                <span>127 sales</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span>$3,821 earned</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Types Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {businessExamples.map((example, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer hover:shadow-md ${
              index === currentExample
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setCurrentExample(index)}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">{example.emoji}</div>
              <div className="font-medium text-sm text-gray-900">{example.type}</div>
              <div className="text-xs text-gray-500 mt-1">{example.price}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Call to Action */}
      <div className="text-center mt-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-5 h-5" />
            <span className="font-bold">Ready to start earning?</span>
          </div>
          <p className="text-sm opacity-90">
            Create your first listing in just 2 minutes and join our community of successful entrepreneurs
          </p>
        </div>
      </div>
    </div>
  );
}
