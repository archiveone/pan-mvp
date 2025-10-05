'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import BottomNav from '@/components/BottomNav';
import { getSavedPosts, unsavePost } from '@/services/userHubService';
import { Heart, ArrowLeft, Trash2, ExternalLink } from 'lucide-react';

export default function SavedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadSavedPosts();
  }, [user, router]);

  const loadSavedPosts = async () => {
    if (!user) return;
    
    try {
      const result = await getSavedPosts(user.id);
      if (result.success) {
        setSavedPosts(result.data);
      }
    } catch (error) {
      console.error('Error loading saved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (postId: string) => {
    if (!user) return;
    
    try {
      const result = await unsavePost(user.id, postId);
      if (result.success) {
        setSavedPosts(prev => prev.filter(saved => saved.post_id !== postId));
        (window as any).addNotification?.({
          type: 'success',
          title: 'Removed from Saved',
          message: 'Post has been removed from your saved items'
        });
      }
    } catch (error) {
      console.error('Error unsaving post:', error);
      (window as any).addNotification?.({
        type: 'error',
        title: 'Failed to Remove',
        message: 'Could not remove post from saved items'
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please sign in to view your saved posts.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <AppHeader />
      
      <main className="max-w-6xl mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Saved Posts</h1>
            <p className="text-gray-600">Your bookmarked listings and posts</p>
          </div>
        </div>

        {/* Saved Posts */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : savedPosts.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Saved Posts</h3>
            <p className="text-gray-500 mb-6">Start saving posts you like to see them here</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Browse Posts
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedPosts.map((saved) => (
              <div key={saved.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {saved.posts?.title || 'Untitled Post'}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {saved.posts?.content?.substring(0, 100)}...
                      </p>
                      {saved.posts?.price && (
                        <div className="text-lg font-bold text-green-600">
                          ${saved.posts.price} {saved.posts.currency}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleUnsave(saved.post_id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500 hover:text-red-700"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Saved {new Date(saved.created_at).toLocaleDateString()}</span>
                    <button
                      onClick={() => router.push(`/post/${saved.post_id}`)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Post
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  );
}
