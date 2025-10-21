'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useThemePreferences } from '@/contexts/ThemePreferencesContext';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import BottomNav from '@/components/BottomNav';
import { Plus, GripVertical, Edit3, Settings as SettingsIcon, RefreshCw } from 'lucide-react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { supabase } from '@/lib/supabase';
import * as Icons from 'lucide-react';
import AppleStyleBoxEditor from '@/components/AppleStyleBoxEditor';
import { ImageService } from '@/services/imageService';
import {
  TrendingUp, TrendingDown, Eye, Heart, Bookmark, DollarSign,
  Users, MapPin, Activity, PlayCircle, ShoppingCart, BarChart3, Target, Download,
  Music, Video, Image as ImageIcon, Home, Utensils, Calendar as CalendarIcon, ShoppingBag, FileText
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalViews: number;
    totalLikes: number;
    totalSaves: number;
    totalRevenue: number;
    viewsChange: number;
    likesChange: number;
    savesChange: number;
    revenueChange: number;
  };
  byType: {
    [key: string]: {
      views: number;
      likes: number;
      saves: number;
      revenue: number;
      count: number;
    };
  };
  topPosts: Array<{
    id: string;
    title: string;
    type: string;
    views: number;
    likes: number;
    saves: number;
    revenue: number;
    created_at: string;
  }>;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
  audienceData: {
    topLocations: Array<{ location: string; count: number }>;
    demographics: { age: string; percentage: number }[];
    devices: { device: string; percentage: number }[];
  };
  performance: {
    dates: string[];
    views: number[];
    likes: number[];
    saves: number[];
    revenue: number[];
  };
}

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';
type MetricType = 'views' | 'likes' | 'saves' | 'revenue';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('views');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadAnalytics();
  }, [user, timeRange]);

  const loadAnalytics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load comprehensive analytics
      const data = await fetchAnalytics(user.id, timeRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (userId: string, range: TimeRange): Promise<AnalyticsData> => {
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate.setFullYear(2020, 0, 1); // Beginning of time
        break;
    }

    // Fetch ALL user's content from ALL tables
    const [
      regularPosts,
      musicPosts,
      videoPosts,
      documentPosts,
      bookableListings,
      advancedListings,
      advancedEvents,
    ] = await Promise.all([
      supabase.from('posts').select('*').eq('user_id', userId).gte('created_at', startDate.toISOString()),
      supabase.from('music_posts').select('*').eq('user_id', userId).gte('created_at', startDate.toISOString()),
      supabase.from('video_posts').select('*').eq('user_id', userId).gte('created_at', startDate.toISOString()),
      supabase.from('document_posts').select('*').eq('user_id', userId).gte('created_at', startDate.toISOString()),
      supabase.from('bookable_listings').select('*').eq('user_id', userId).gte('created_at', startDate.toISOString()),
      supabase.from('advanced_listings').select('*').eq('user_id', userId).gte('created_at', startDate.toISOString()),
      supabase.from('advanced_events').select('*').eq('user_id', userId).gte('created_at', startDate.toISOString()),
    ]);

    // Combine all content
    const posts = [
      ...(regularPosts.data || []),
      ...(musicPosts.data || []),
      ...(videoPosts.data || []),
      ...(documentPosts.data || []),
      ...(bookableListings.data || []),
      ...(advancedListings.data || []),
      ...(advancedEvents.data || []),
    ];

    console.log(`📦 Dashboard fetching analytics for ${posts.length} total content items`);

    const contentIds = posts.map(p => p.id);
    
    // Fetch ALL analytics data from ALL tables
    const [viewData, streamData, salesData, conversionData, engagementData, analyticsEvents] = await Promise.all([
      supabase.from('view_analytics').select('*').in('content_id', contentIds).gte('viewed_at', startDate.toISOString()),
      supabase.from('stream_analytics').select('*').in('content_id', contentIds).gte('started_at', startDate.toISOString()),
      supabase.from('sales_analytics').select('*').eq('seller_id', userId).gte('sale_date', startDate.toISOString()),
      supabase.from('conversion_analytics').select('*').in('content_id', contentIds),
      supabase.from('engagement_scores').select('*').eq('user_id', userId),
      supabase.from('analytics_events').select('*').in('content_id', contentIds).gte('created_at', startDate.toISOString()),
    ]);

    console.log('📊 Analytics loaded:');
    console.log(`  Posts: ${posts.length}`);
    console.log(`  Views: ${viewData.data?.length || 0}`);
    console.log(`  Streams: ${streamData.data?.length || 0}`);
    console.log(`  Sales: ${salesData.data?.length || 0}`);
    console.log(`  Events: ${analyticsEvents.data?.length || 0}`);

    // Calculate REAL metrics
    const overview = {
      totalViews: viewData.data?.length || 0,
      totalLikes: viewData.data?.filter((v: any) => v.liked).length || 0,
      totalSaves: viewData.data?.filter((v: any) => v.saved).length || 0,
      totalRevenue: salesData.data?.reduce((sum: number, s: any) => sum + (s.net_amount || 0), 0) || 0,
      totalStreams: streamData.data?.length || 0,
      totalEvents: analyticsEvents.data?.length || 0,
      viewsChange: 0, // Calculate from previous period
      likesChange: 0,
      savesChange: 0,
      revenueChange: 0,
    };

    // Group by content type - REAL DATA
    const byType: any = {
      music: {
        count: musicPosts.data?.length || 0,
        views: 0,
        streams: 0,
        revenue: 0,
      },
      video: {
        count: videoPosts.data?.length || 0,
        views: 0,
        streams: 0,
        revenue: 0,
      },
      posts: {
        count: regularPosts.data?.length || 0,
        views: 0,
        likes: 0,
        saves: 0,
      },
      bookable: {
        count: bookableListings.data?.length || 0,
        views: 0,
        bookings: 0,
        revenue: 0,
      },
      listings: {
        count: advancedListings.data?.length || 0,
        views: 0,
        sales: 0,
        revenue: 0,
      },
      events: {
        count: advancedEvents.data?.length || 0,
        views: 0,
        tickets: 0,
        revenue: 0,
      },
    };

    // Calculate REAL metrics per type
    (musicPosts.data || []).forEach((item: any) => {
      const itemViews = viewData.data?.filter((v: any) => v.content_id === item.id) || [];
      const itemStreams = streamData.data?.filter((s: any) => s.content_id === item.id) || [];
      byType.music.views += itemViews.length;
      byType.music.streams += itemStreams.length;
    });

    (videoPosts.data || []).forEach((item: any) => {
      const itemViews = viewData.data?.filter((v: any) => v.content_id === item.id) || [];
      const itemStreams = streamData.data?.filter((s: any) => s.content_id === item.id) || [];
      byType.video.views += itemViews.length;
      byType.video.streams += itemStreams.length;
    });

    (regularPosts.data || []).forEach((item: any) => {
      const itemViews = viewData.data?.filter((v: any) => v.content_id === item.id) || [];
      byType.posts.views += itemViews.length;
      byType.posts.likes += itemViews.filter((v: any) => v.liked).length;
      byType.posts.saves += itemViews.filter((v: any) => v.saved).length;
    });

    (bookableListings.data || []).forEach((item: any) => {
      const itemViews = viewData.data?.filter((v: any) => v.content_id === item.id) || [];
      const itemSales = salesData.data?.filter((s: any) => s.listing_id === item.id) || [];
      byType.bookable.views += itemViews.length;
      byType.bookable.bookings += itemSales.length;
      byType.bookable.revenue += itemSales.reduce((sum: number, s: any) => sum + (s.net_amount || 0), 0);
    });

    (advancedListings.data || []).forEach((item: any) => {
      const itemViews = viewData.data?.filter((v: any) => v.content_id === item.id) || [];
      const itemSales = salesData.data?.filter((s: any) => s.listing_id === item.id) || [];
      byType.listings.views += itemViews.length;
      byType.listings.sales += itemSales.length;
      byType.listings.revenue += itemSales.reduce((sum: number, s: any) => sum + (s.net_amount || 0), 0);
    });

    (advancedEvents.data || []).forEach((item: any) => {
      const itemViews = viewData.data?.filter((v: any) => v.content_id === item.id) || [];
      const itemSales = salesData.data?.filter((s: any) => s.listing_id === item.id) || [];
      byType.events.views += itemViews.length;
      byType.events.tickets += itemSales.length;
      byType.events.revenue += itemSales.reduce((sum: number, s: any) => sum + (s.net_amount || 0), 0);
    });

    // Top performing posts - REAL DATA
    const postMetrics = posts.map((p: any) => {
      const postViews = viewData.data?.filter((v: any) => v.content_id === p.id) || [];
      const postStreams = streamData.data?.filter((s: any) => s.content_id === p.id) || [];
      const postSales = salesData.data?.filter((s: any) => s.listing_id === p.id || s.content_id === p.id) || [];
      
      return {
        id: p.id,
        title: p.title,
        type: 'post',
        views: postViews.length,
        likes: postViews.filter(v => v.liked).length,
        saves: postViews.filter(v => v.saved).length,
        revenue: postSales.reduce((sum, s) => sum + (s.net_amount || 0), 0),
        streams: postStreams.length,
        created_at: p.created_at,
      };
    }) || [];
    
    const topPosts = postMetrics.sort((a, b) => b.views - a.views).slice(0, 10);

    // Recent activity (mock)
    const recentActivity = [
      { type: 'view', description: 'Your post "Summer Vibes" got 127 new views', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { type: 'like', description: '45 people liked your music post', timestamp: new Date(Date.now() - 7200000).toISOString() },
      { type: 'save', description: '12 users saved your hotel listing', timestamp: new Date(Date.now() - 10800000).toISOString() },
      { type: 'purchase', description: 'New booking for "Seaside Villa" - $250', timestamp: new Date(Date.now() - 14400000).toISOString() },
      { type: 'follow', description: '8 new followers this week', timestamp: new Date(Date.now() - 18000000).toISOString() },
    ];

    // Audience data (mock)
    const audienceData = {
      topLocations: [
        { location: 'Los Angeles, CA', count: 1234 },
        { location: 'New York, NY', count: 987 },
        { location: 'London, UK', count: 765 },
        { location: 'Tokyo, Japan', count: 543 },
        { location: 'Paris, France', count: 421 },
      ],
      demographics: [
        { age: '18-24', percentage: 25 },
        { age: '25-34', percentage: 35 },
        { age: '35-44', percentage: 20 },
        { age: '45-54', percentage: 12 },
        { age: '55+', percentage: 8 },
      ],
      devices: [
        { device: 'Mobile', percentage: 65 },
        { device: 'Desktop', percentage: 28 },
        { device: 'Tablet', percentage: 7 },
      ],
    };

    // Performance over time - REAL DATA
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
    const dates: string[] = [];
    const views: number[] = [];
    const likes: number[] = [];
    const saves: number[] = [];
    const revenue: number[] = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Count views for this day
      const dayViews = viewData.data?.filter((v: any) => v.viewed_at?.startsWith(dateStr)) || [];
      const daySales = salesData.data?.filter((s: any) => s.sale_date?.startsWith(dateStr)) || [];
      
      views.push(dayViews.length);
      likes.push(dayViews.filter((v: any) => v.liked).length);
      saves.push(dayViews.filter((v: any) => v.saved).length);
      revenue.push(daySales.reduce((sum: number, s: any) => sum + (s.net_amount || 0), 0));
    }

    return {
      overview,
      byType,
      topPosts,
      recentActivity,
      audienceData,
      performance: { dates, views, likes, saves, revenue },
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const exportData = () => {
    alert('Export functionality coming soon!');
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Analytics Data</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Start creating content to see your analytics!</p>
          <button
            onClick={() => router.push('/hub')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium"
          >
            Go to Hub
          </button>
        </div>
      </div>
    );
  }

  const { overview, byType, topPosts, recentActivity, audienceData, performance } = analytics;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              📊 Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive analytics for all your content
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
              <option value="all">All Time</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Export Button */}
            <button
              onClick={exportData}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Overview Stats - 4 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Views */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className={`flex items-center gap-1 text-sm font-semibold ${
                overview.viewsChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {overview.viewsChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(overview.viewsChange).toFixed(1)}%
                </span>
              </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {Math.floor(overview.totalViews).toLocaleString()}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
          </div>

          {/* Total Likes */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-xl">
                <Heart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <span className={`flex items-center gap-1 text-sm font-semibold ${
                overview.likesChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {overview.likesChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(overview.likesChange).toFixed(1)}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {Math.floor(overview.totalLikes).toLocaleString()}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Likes</p>
          </div>

          {/* Total Saves */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Bookmark className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className={`flex items-center gap-1 text-sm font-semibold ${
                overview.savesChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {overview.savesChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(overview.savesChange).toFixed(1)}%
                </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {Math.floor(overview.totalSaves).toLocaleString()}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Saves</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className={`flex items-center gap-1 text-sm font-semibold ${
                overview.revenueChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {overview.revenueChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(overview.revenueChange).toFixed(1)}%
                </span>
              </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              ${Math.floor(overview.totalRevenue).toLocaleString()}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Performance Over Time</h2>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
            >
              <option value="views">Views</option>
              <option value="likes">Likes</option>
              <option value="saves">Saves</option>
              <option value="revenue">Revenue</option>
            </select>
          </div>
          
          {/* Simple chart visualization */}
          <div className="h-64 flex items-end justify-between gap-2">
            {performance[selectedMetric].map((value, index) => {
              const maxValue = Math.max(...performance[selectedMetric]);
              const height = (value / maxValue) * 100;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg hover:opacity-80 transition-opacity cursor-pointer relative group"
                    style={{ height: `${height}%` }}
                    title={`${performance.dates[index]}: ${Math.floor(value).toLocaleString()}`}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {Math.floor(value).toLocaleString()}
              </div>
            </div>
                  {performance.dates.length <= 30 && index % Math.ceil(performance.dates.length / 10) === 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 rotate-45 origin-left">
                      {performance.dates[index]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance by Content Type */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Performance by Type</h2>
            <div className="space-y-4">
              {Object.entries(byType).map(([type, data]: [string, any]) => {
                if (data.count === 0) return null;
                
                const icon = type === 'music' ? Music : 
                            type === 'video' ? Video :
                            type === 'image' ? ImageIcon :
                            type === 'hotel' ? Home :
                            type === 'restaurant' ? Utensils :
                            type === 'event' ? CalendarIcon :
                            type === 'product' ? ShoppingBag : FileText;
                const IconComponent = icon;
                
                return (
                  <div key={type} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                          <IconComponent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{type}</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{data.count} items</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {Math.floor(data.views).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">views</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">Likes</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{Math.floor(data.likes)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">Saves</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{Math.floor(data.saves)}</p>
              </div>
              <div>
                        <p className="text-gray-600 dark:text-gray-400 text-xs">Revenue</p>
                        <p className="font-semibold text-gray-900 dark:text-white">${Math.floor(data.revenue)}</p>
                      </div>
                    </div>
              </div>
                );
              })}
            </div>
          </div>

          {/* Top Locations */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Top Locations</h2>
            <div className="space-y-4">
              {audienceData.topLocations.map((location, index) => {
                const maxCount = audienceData.topLocations[0].count;
                const percentage = (location.count / maxCount) * 100;
                
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {location.location}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {location.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
              </div>
              </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Performing Posts */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Top Performing Content</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Content</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Type</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Views</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Likes</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Saves</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {topPosts.map((post, index) => (
                  <tr key={post.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">{post.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(post.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium capitalize">
                        {post.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                      {post.views.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                      {post.likes.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                      {post.saves.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600 dark:text-green-400">
                      ${Math.floor(post.revenue).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => router.push(`/listing/${post.id}`)}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
                    </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'view' ? 'bg-blue-100 dark:bg-blue-900/30' :
                  activity.type === 'like' ? 'bg-pink-100 dark:bg-pink-900/30' :
                  activity.type === 'save' ? 'bg-purple-100 dark:bg-purple-900/30' :
                  activity.type === 'purchase' ? 'bg-green-100 dark:bg-green-900/30' :
                  'bg-gray-100 dark:bg-gray-800'
                }`}>
                  {activity.type === 'view' && <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  {activity.type === 'like' && <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />}
                  {activity.type === 'save' && <Bookmark className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                  {activity.type === 'purchase' && <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />}
                  {activity.type === 'follow' && <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white font-medium">{activity.description}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  );
}
