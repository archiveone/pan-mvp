'use client';

import React, { useState, useEffect } from 'react';
import { Activity, MessageCircle, Heart, UserPlus, DollarSign, Shield, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface ActivityItem {
  id: string;
  type: 'message' | 'like' | 'follow' | 'payment' | 'verification' | 'community' | 'listing';
  title: string;
  description: string;
  timestamp: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  related_id?: string;
  metadata?: any;
}

interface ActivityFeedProps {
  limit?: number;
  showUserActivities?: boolean;
  className?: string;
}

export default function ActivityFeed({ 
  limit = 20, 
  showUserActivities = true, 
  className = '' 
}: ActivityFeedProps) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadActivities();
    }
  }, [user]);

  const loadActivities = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const activitiesList: ActivityItem[] = [];

      // Load recent messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          sender:profiles!messages_sender_id_fkey(name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!messagesError && messages) {
        messages.forEach(msg => {
          activitiesList.push({
            id: `msg-${msg.id}`,
            type: 'message',
            title: 'New Message',
            description: `${msg.sender?.name || 'Someone'} sent a message`,
            timestamp: msg.created_at,
            user_id: msg.sender_id,
            user_name: msg.sender?.name,
            user_avatar: msg.sender?.avatar_url,
            related_id: msg.id,
            metadata: { content: msg.content }
          });
        });
      }

      // Load recent posts/listings
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content,
          created_at,
          user_id,
          profiles!posts_user_id_fkey(name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!postsError && posts) {
        posts.forEach(post => {
          activitiesList.push({
            id: `post-${post.id}`,
            type: 'listing',
            title: 'New Listing',
            description: `${post.profiles?.name || 'Someone'} created a new listing: ${post.title}`,
            timestamp: post.created_at,
            user_id: post.user_id,
            user_name: post.profiles?.name,
            user_avatar: post.profiles?.avatar_url,
            related_id: post.id,
            metadata: { title: post.title, content: post.content }
          });
        });
      }

      // Load recent communities
      const { data: communities, error: communitiesError } = await supabase
        .from('user_groups')
        .select(`
          id,
          name,
          description,
          created_at,
          created_by,
          profiles!user_groups_created_by_fkey(name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!communitiesError && communities) {
        communities.forEach(community => {
          activitiesList.push({
            id: `community-${community.id}`,
            type: 'community',
            title: 'New Community',
            description: `${community.profiles?.name || 'Someone'} created community: ${community.name}`,
            timestamp: community.created_at,
            user_id: community.created_by,
            user_name: community.profiles?.name,
            user_avatar: community.profiles?.avatar_url,
            related_id: community.id,
            metadata: { name: community.name, description: community.description }
          });
        });
      }

      // Sort by timestamp and limit
      const sortedActivities = activitiesList
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      setActivities(sortedActivities);
    } catch (error: any) {
      setError(error.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'message':
        return <MessageCircle size={16} className="text-blue-500" />;
      case 'like':
        return <Heart size={16} className="text-red-500" />;
      case 'follow':
        return <UserPlus size={16} className="text-green-500" />;
      case 'payment':
        return <DollarSign size={16} className="text-green-600" />;
      case 'verification':
        return <Shield size={16} className="text-purple-500" />;
      case 'community':
        return <Users size={16} className="text-indigo-500" />;
      case 'listing':
        return <TrendingUp size={16} className="text-orange-500" />;
      default:
        return <Activity size={16} className="text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 text-center ${className}`}>
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Activities</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadActivities}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-8 text-center ${className}`}>
        <Activity size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h3>
        <p className="text-gray-600">
          {showUserActivities 
            ? "Your recent activity will appear here."
            : "Recent platform activity will appear here."
          }
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {showUserActivities ? 'Your Activity' : 'Recent Activity'}
        </h2>
        <button
          onClick={loadActivities}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>

      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
        >
          {/* Avatar */}
          <div className="flex-shrink-0">
            {activity.user_avatar ? (
              <img
                src={activity.user_avatar}
                alt={activity.user_name || 'User'}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm font-medium">
                  {activity.user_name?.charAt(0) || 'U'}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              {getActivityIcon(activity.type)}
              <h3 className="text-sm font-medium text-gray-900">
                {activity.title}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              {activity.description}
            </p>
            <p className="text-xs text-gray-400">
              {formatTimeAgo(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}

      {activities.length >= limit && (
        <div className="text-center pt-4">
          <button className="text-sm text-blue-600 hover:text-blue-700">
            Load More Activities
          </button>
        </div>
      )}
    </div>
  );
}
