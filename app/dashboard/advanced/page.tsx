'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import BottomNav from '@/components/BottomNav';
import {
  TrendingUp, TrendingDown, Eye, Heart, Bookmark, DollarSign,
  Users, MapPin, Calendar, Clock, Download, Music, Video,
  ShoppingBag, Activity, Zap, Award, Target, RefreshCw,
  PlayCircle, ShoppingCart, CreditCard, MousePointer, Repeat
} from 'lucide-react';
import AdvancedAnalyticsService from '@/services/advancedAnalyticsService';

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';
type TabType = 'overview' | 'streaming' | 'sales' | 'views' | 'conversions' | 'audience';

export default function AdvancedDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [analytics, setAnalytics] = useState<any>(null);
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
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : timeRange === '1y' ? 365 : 999;
      const result = await AdvancedAnalyticsService.getDashboardAnalytics(user.id, days);
      
      if (result.success) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const { overview, streaming, sales, views, engagement, audience } = analytics;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🚀 Advanced Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sales • Streams • Views • Conversions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
              <option value="all">All Time</option>
            </select>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-8 p-2">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'streaming', label: 'Streaming', icon: PlayCircle },
              { id: 'sales', label: 'Sales', icon: ShoppingCart },
              { id: 'views', label: 'Views', icon: Eye },
              { id: 'conversions', label: 'Conversions', icon: Target },
              { id: 'audience', label: 'Audience', icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                icon={<Eye className="w-6 h-6" />}
                label="Total Views"
                value={overview.totalViews.toLocaleString()}
                color="blue"
              />
              <StatCard
                icon={<PlayCircle className="w-6 h-6" />}
                label="Total Streams"
                value={overview.totalStreams.toLocaleString()}
                color="purple"
              />
              <StatCard
                icon={<ShoppingCart className="w-6 h-6" />}
                label="Total Sales"
                value={overview.totalSales.toLocaleString()}
                color="green"
              />
              <StatCard
                icon={<DollarSign className="w-6 h-6" />}
                label="Total Revenue"
                value={`$${overview.totalRevenue.toLocaleString()}`}
                color="emerald"
              />
              <StatCard
                icon={<Heart className="w-6 h-6" />}
                label="Engagement"
                value={overview.totalEngagement.toLocaleString()}
                color="pink"
              />
              <StatCard
                icon={<Activity className="w-6 h-6" />}
                label="Total Posts"
                value={overview.totalPosts.toLocaleString()}
                color="indigo"
              />
            </div>
          </div>
        )}

        {activeTab === 'streaming' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                icon={<PlayCircle className="w-6 h-6" />}
                label="Total Streams"
                value={streaming.totalStreams.toLocaleString()}
                subtitle="All plays"
                color="purple"
              />
              <StatCard
                icon={<Users className="w-6 h-6" />}
                label="Unique Listeners"
                value={streaming.uniqueListeners.toLocaleString()}
                subtitle="Different users"
                color="blue"
              />
              <StatCard
                icon={<Clock className="w-6 h-6" />}
                label="Total Stream Time"
                value={`${Math.floor(streaming.totalStreamTime / 3600)}h`}
                subtitle={`${Math.floor((streaming.totalStreamTime % 3600) / 60)}m streamed`}
                color="indigo"
              />
              <StatCard
                icon={<Activity className="w-6 h-6" />}
                label="Avg Stream Time"
                value={`${Math.floor(streaming.avgStreamTime / 60)}:${String(Math.floor(streaming.avgStreamTime % 60)).padStart(2, '0')}`}
                subtitle="Per stream"
                color="cyan"
              />
              <StatCard
                icon={<Target className="w-6 h-6" />}
                label="Completion Rate"
                value={`${streaming.avgCompletionRate.toFixed(1)}%`}
                subtitle="Avg completion"
                color="green"
              />
              <StatCard
                icon={<Repeat className="w-6 h-6" />}
                label="Full Streams"
                value={streaming.fullStreams.toLocaleString()}
                subtitle="90%+ completed"
                color="emerald"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                🎵 Streaming Insights
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Key Metrics</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Avg. Watch Time:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {Math.floor(streaming.avgStreamTime / 60)}:{String(Math.floor(streaming.avgStreamTime % 60)).padStart(2, '0')}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Completion Rate:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {streaming.avgCompletionRate.toFixed(1)}%
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Hours:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {Math.floor(streaming.totalStreamTime / 3600).toLocaleString()}
                      </span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Listener Behavior</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Streams per Listener:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {(streaming.totalStreams / (streaming.uniqueListeners || 1)).toFixed(1)}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Full Completion:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {((streaming.fullStreams / (streaming.totalStreams || 1)) * 100).toFixed(1)}%
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={<ShoppingCart className="w-6 h-6" />}
                label="Total Sales"
                value={sales.totalSales.toLocaleString()}
                color="blue"
              />
              <StatCard
                icon={<DollarSign className="w-6 h-6" />}
                label="Gross Revenue"
                value={`$${sales.grossRevenue.toLocaleString()}`}
                color="green"
              />
              <StatCard
                icon={<CreditCard className="w-6 h-6" />}
                label="Net Revenue"
                value={`$${sales.netRevenue.toLocaleString()}`}
                subtitle={`After $${sales.platformFees.toFixed(0)} fees`}
                color="emerald"
              />
              <StatCard
                icon={<Activity className="w-6 h-6" />}
                label="Avg Order Value"
                value={`$${sales.avgOrderValue.toFixed(2)}`}
                color="purple"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  💰 Revenue Breakdown
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Gross Revenue</span>
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      ${sales.grossRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Discounts</span>
                    <span className="text-xl font-bold text-red-600 dark:text-red-400">
                      -${sales.discounts.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Platform Fees</span>
                    <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                      -${sales.platformFees.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                    <span className="text-gray-900 dark:text-white font-bold">Net Revenue</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      ${sales.netRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  👥 Customer Insights
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Unique Customers</span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {sales.uniqueCustomers}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Repeat Customers</span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {sales.repeatCustomers}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${sales.repeatRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {sales.repeatRate.toFixed(1)}% repeat rate
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Avg Order Value</span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ${sales.avgOrderValue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'views' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                icon={<Eye className="w-6 h-6" />}
                label="Total Views"
                value={views.totalViews.toLocaleString()}
                color="blue"
              />
              <StatCard
                icon={<Users className="w-6 h-6" />}
                label="Unique Viewers"
                value={views.uniqueViewers.toLocaleString()}
                color="purple"
              />
              <StatCard
                icon={<Clock className="w-6 h-6" />}
                label="Avg View Duration"
                value={`${Math.floor(views.avgViewDuration / 60)}:${String(Math.floor(views.avgViewDuration % 60)).padStart(2, '0')}`}
                color="cyan"
              />
              <StatCard
                icon={<Activity className="w-6 h-6" />}
                label="Engagement Rate"
                value={`${views.engagementRate.toFixed(1)}%`}
                color="green"
              />
              <StatCard
                icon={<MousePointer className="w-6 h-6" />}
                label="CTA Click Rate"
                value={`${views.ctaClickRate.toFixed(1)}%`}
                color="orange"
              />
              <StatCard
                icon={<TrendingDown className="w-6 h-6" />}
                label="Bounce Rate"
                value={`${views.bounceRate.toFixed(1)}%`}
                color="red"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                📊 View Quality Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Avg Scroll Depth</p>
                  <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {views.avgScrollDepth.toFixed(0)}%
                  </p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Engagement Rate</p>
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {views.engagementRate.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Views per Viewer</p>
                  <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {(views.totalViews / (views.uniqueViewers || 1)).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audience' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Top Countries
                </h2>
                <div className="space-y-3">
                  {audience.topCountries.map((country: any, index: number) => {
                    const maxCount = audience.topCountries[0]?.count || 1;
                    const percentage = (country.count / maxCount) * 100;
                    
                    return (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {country.label || 'Unknown'}
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {country.count.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  Device Breakdown
                </h2>
                <div className="space-y-4">
                  {audience.topDevices.map((device: any, index: number) => {
                    const total = audience.topDevices.reduce((sum: number, d: any) => sum + d.count, 0);
                    const percentage = (device.count / total) * 100;
                    
                    return (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {device.label || 'Unknown'}
                          </span>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                🌍 Geographic Distribution
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {audience.topCities.slice(0, 10).map((city: any, index: number) => (
                  <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {city.count}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {city.label || 'Unknown'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'conversions' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              🎯 Conversion Funnel
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Track user journey from view to purchase
            </p>
            
            <div className="space-y-4">
              <FunnelStage label="Views" value={1000} percentage={100} color="blue" />
              <FunnelStage label="Engagement" value={450} percentage={45} color="purple" />
              <FunnelStage label="CTA Clicks" value={200} percentage={20} color="cyan" />
              <FunnelStage label="Add to Cart" value={120} percentage={12} color="green" />
              <FunnelStage label="Checkout" value={80} percentage={8} color="orange" />
              <FunnelStage label="Purchase" value={50} percentage={5} color="emerald" />
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Overall Conversion</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">5.0%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">View → Engage</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">45%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cart → Purchase</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">42%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Time</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">2.3d</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <AppFooter />
      <BottomNav />
    </div>
  );
}

// Stat Card Component
function StatCard({ 
  icon, 
  label, 
  value, 
  subtitle, 
  color = 'blue' 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number; 
  subtitle?: string; 
  color?: string 
}) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
      <div className={`inline-flex p-3 rounded-xl mb-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
        {icon}
      </div>
      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {label}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// Funnel Stage Component
function FunnelStage({ 
  label, 
  value, 
  percentage, 
  color 
}: { 
  label: string; 
  value: number; 
  percentage: number; 
  color: string 
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-400',
    purple: 'from-purple-500 to-purple-400',
    cyan: 'from-cyan-500 to-cyan-400',
    green: 'from-green-500 to-green-400',
    orange: 'from-orange-500 to-orange-400',
    emerald: 'from-emerald-500 to-emerald-400',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-900 dark:text-white">{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">{percentage}%</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
        <div 
          className={`bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]} h-4 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

