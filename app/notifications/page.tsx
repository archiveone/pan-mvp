'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, CheckCheck, Trash2, Filter, MoreVertical } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/services/notificationService';

type FilterType = 'all' | 'unread' | 'read';
type SortType = 'newest' | 'oldest';

export default function NotificationsPage() {
  const router = useRouter();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  // Filter and sort notifications
  const filteredNotifications = notifications
    .filter(notification => {
      if (filter === 'unread') return !(notification as any).read;
      if (filter === 'read') return (notification as any).read;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(notificationId);
      return newSet;
    });
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setSelectedNotifications(new Set());
  };

  const handleDeleteNotification = async (notificationId: string) => {
    await deleteNotification(notificationId);
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(notificationId);
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedNotifications.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedNotifications.size} notification(s)?`)) {
      const deletePromises = Array.from(selectedNotifications).map(id => deleteNotification(id));
      await Promise.all(deletePromises);
      setSelectedNotifications(new Set());
    }
  };

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
  };

  const clearSelection = () => {
    setSelectedNotifications(new Set());
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_message':
        return '💬';
      case 'new_comment':
        return '💭';
      case 'new_like':
        return '❤️';
      case 'new_follow':
        return '👥';
      case 'listing_sold':
        return '💰';
      case 'payment_received':
        return '💳';
      case 'payment_failed':
        return '❌';
      case 'verification_complete':
        return '✅';
      case 'verification_failed':
        return '⚠️';
      case 'community_invite':
        return '🏘️';
      case 'community_update':
        return '📢';
      case 'price_alert':
        return '📈';
      case 'security_alert':
        return '🔒';
      case 'system_update':
        return '🔧';
      default:
        return '🔔';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <CheckCheck size={16} />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as FilterType)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Notifications</option>
                  <option value="unread">Unread Only</option>
                  <option value="read">Read Only</option>
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortType)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            {/* Selection Actions */}
            {selectedNotifications.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedNotifications.size} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 text-sm flex items-center space-x-1"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {selectedNotifications.size === 0 && filteredNotifications.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                <button
                  onClick={selectAll}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Select All
                </button>
                <span className="text-sm text-gray-600">
                  {filteredNotifications.length} notification(s) found
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Notifications List */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Notifications</h3>
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "You're all caught up! New notifications will appear here."
                : `No ${filter} notifications found.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg border transition-colors ${
                  notification.read 
                    ? 'border-gray-200' 
                    : 'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    {/* Selection Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.has(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />

                    {/* Notification Icon */}
                    <div className="flex-shrink-0">
                      <span className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`text-sm font-medium ${
                            notification.read ? 'text-gray-900' : 'text-gray-900'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-700 p-1"
                              title="Mark as read"
                            >
                              <Check size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="text-gray-400 hover:text-red-600 p-1"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
