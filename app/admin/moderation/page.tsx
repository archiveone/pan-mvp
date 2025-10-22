'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AppHeader from '@/components/AppHeader';
import { Flag, CheckCircle, XCircle, AlertTriangle, Eye, Ban, Clock } from 'lucide-react';
import Link from 'next/link';

interface ModerationReport {
  id: string;
  post_id: string;
  reported_by: string;
  reported_user_id: string;
  report_type: string;
  description: string;
  status: string;
  created_at: string;
  reporter: {
    name: string;
    username: string;
  };
  reported_user: {
    name: string;
    username: string;
  };
  post: {
    title: string;
    content: string;
    media_url: string;
  };
}

export default function ModerationDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    // Check if user is admin/moderator
    if (!(profile as any)?.is_admin && !(profile as any)?.is_moderator) {
      router.push('/');
      return;
    }

    loadReports();
  }, [user, profile, filter]);

  const loadReports = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('moderation_reports')
        .select(`
          *,
          reporter:reported_by(name, username),
          reported_user:reported_user_id(name, username),
          post:post_id(title, content, media_url)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setReports(data as any || []);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reportId: string, action: string, postId?: string) => {
    try {
      // Update report status
      await supabase
        .from('moderation_reports')
        .update({
          status: 'resolved',
          action_taken: action,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      // Take action on post if needed
      if (postId && action !== 'dismiss') {
        if (action === 'remove') {
          await supabase
            .from('posts')
            .update({
              is_published: false,
              moderation_status: 'rejected',
              moderated_by: user?.id,
              moderated_at: new Date().toISOString(),
            })
            .eq('id', postId);
        }
      }

      // Reload reports
      loadReports();
    } catch (error) {
      console.error('Action failed:', error);
      alert('Failed to take action. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Moderation Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review reported content and take appropriate action
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-orange-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Pending
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            All Reports
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'resolved'
                ? 'bg-green-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Resolved
          </button>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <Flag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No {filter === 'all' ? '' : filter} reports
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'pending' ? 'All caught up! No pending reports to review.' : 'No reports found.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          report.report_type === 'spam' ? 'bg-yellow-100 text-yellow-800' :
                          report.report_type === 'harassment' ? 'bg-red-100 text-red-800' :
                          report.report_type === 'hate_speech' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {report.report_type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          report.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                          report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {report.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Reported by <span className="font-medium">{report.reporter?.name}</span> •{' '}
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Report Description */}
                  {report.description && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{report.description}</p>
                    </div>
                  )}

                  {/* Reported Content */}
                  <div className="mb-4 border-l-4 border-red-500 pl-4">
                    <div className="flex gap-4">
                      {report.post?.media_url && (
                        <img
                          src={report.post.media_url}
                          alt="Reported content"
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          {report.post?.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {report.post?.content}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          By: {report.reported_user?.name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {report.status === 'pending' && (
                    <div className="flex gap-2 flex-wrap">
                      <Link
                        href={`/listing/${report.post_id}`}
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View Post
                      </Link>
                      <button
                        onClick={() => handleAction(report.id, 'dismiss')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleAction(report.id, 'warning', report.post_id)}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Warn User
                      </button>
                      <button
                        onClick={() => handleAction(report.id, 'remove', report.post_id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
                        <Ban className="w-4 h-4" />
                        Remove Content
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

