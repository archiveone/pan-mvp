'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MessagingInterface from '@/components/MessagingInterface';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import BottomNav from '@/components/BottomNav';

export default function MessagesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in to view messages</h2>
            <p className="text-gray-600">Please sign in to access your messages</p>
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
      <div className="h-screen pt-16 pb-16">
        <MessagingInterface />
      </div>
      <AppFooter />
      <BottomNav />
    </div>
  );
}