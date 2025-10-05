'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Clock, Star, Zap } from 'lucide-react';

interface Suggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  reason: string;
  emoji: string;
  color: string;
}

interface SmartSuggestionsProps {
  onSuggestionSelect: (suggestion: Suggestion) => void;
  userContext?: {
    recentPosts?: string[];
    interests?: string[];
    location?: string;
  };
}

export default function SmartSuggestions({ onSuggestionSelect, userContext }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateSuggestions();
  }, [userContext]);

  const generateSuggestions = async () => {
    setLoading(true);
    
    // Simulate AI-powered suggestions based on user context
    const mockSuggestions: Suggestion[] = [
      {
        id: 'trending-item',
        type: 'item',
        title: 'Sell Your Old Tech',
        description: 'Electronics are trending right now',
        confidence: 0.95,
        reason: 'Based on your recent activity',
        emoji: '📱',
        color: 'bg-blue-500'
      },
      {
        id: 'seasonal-service',
        type: 'service',
        title: 'Holiday Photography',
        description: 'Perfect timing for seasonal services',
        confidence: 0.88,
        reason: 'Seasonal opportunity',
        emoji: '📸',
        color: 'bg-green-500'
      },
      {
        id: 'local-event',
        type: 'event',
        title: 'Community Meetup',
        description: 'Connect with your local community',
        confidence: 0.82,
        reason: 'Based on your location',
        emoji: '🤝',
        color: 'bg-purple-500'
      },
      {
        id: 'creative-media',
        type: 'media',
        title: 'Share Your Art',
        description: 'Creative content is popular',
        confidence: 0.79,
        reason: 'Matches your interests',
        emoji: '🎨',
        color: 'bg-pink-500'
      }
    ];

    // Simulate loading delay
    setTimeout(() => {
      setSuggestions(mockSuggestions);
      setLoading(false);
    }, 1000);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-100';
    if (confidence >= 0.8) return 'text-blue-600 bg-blue-100';
    if (confidence >= 0.7) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.9) return 'Excellent match';
    if (confidence >= 0.8) return 'Great match';
    if (confidence >= 0.7) return 'Good match';
    return 'Fair match';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={20} className="text-blue-600" />
          <h3 className="font-medium text-gray-900">Smart Suggestions</h3>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-100 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-blue-600" />
        <h3 className="font-medium text-sm text-gray-900">Smart Suggestions</h3>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Zap size={10} />
          AI
        </div>
      </div>
      
      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSuggestionSelect(suggestion)}
            className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all text-left group"
          >
            <div className="flex items-start gap-2">
              <div className={`w-8 h-8 ${suggestion.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                <span className="text-sm">{suggestion.emoji}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  <h4 className="font-medium text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                    {suggestion.title}
                  </h4>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                    {getConfidenceText(suggestion.confidence)}
                  </span>
                </div>
                
                <p className="text-xs text-gray-600 mb-1">
                  {suggestion.description}
                </p>
                
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <TrendingUp size={10} />
                    {Math.round(suggestion.confidence * 100)}%
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={10} />
                    {suggestion.reason}
                  </div>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <span className="text-blue-600 text-xs">→</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="text-center pt-2">
        <button className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
          Show more suggestions
        </button>
      </div>
    </div>
  );
}
