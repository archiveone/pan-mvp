'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useThemePreferences } from '@/contexts/ThemePreferencesContext';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import BottomNav from '@/components/BottomNav';
import { Plus, GripVertical, Edit3, RefreshCw, X } from 'lucide-react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { supabase } from '@/lib/supabase';
import * as Icons from 'lucide-react';
import AppleStyleBoxEditor from '@/components/AppleStyleBoxEditor';
import { ImageService } from '@/services/imageService';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardWidget {
  id: string;
  user_id: string;
  widget_type: string;
  title: string;
  custom_color?: string;
  image_url?: string;
  icon: string;
  grid_settings: { x: number; y: number; w: number; h: number };
  settings: any;
  is_visible: boolean;
  time_range: string;
}

const WIDGET_TYPES = [
  { type: 'overview_stats', title: 'Overview', icon: 'Activity', color: '#3B82F6', description: 'Views, likes, saves, revenue' },
  { type: 'performance_chart', title: 'Performance', icon: 'TrendingUp', color: '#10B981', description: 'Trends over time' },
  { type: 'top_content', title: 'Top Content', icon: 'Star', color: '#F59E0B', description: 'Best performers' },
  { type: 'recent_activity', title: 'Activity', icon: 'Activity', color: '#8B5CF6', description: 'Latest events' },
  { type: 'streaming_stats', title: 'Streaming', icon: 'PlayCircle', color: '#9333EA', description: 'Music & video' },
  { type: 'sales_stats', title: 'Sales', icon: 'ShoppingCart', color: '#10B981', description: 'Revenue & sales' },
  { type: 'audience_map', title: 'Audience', icon: 'MapPin', color: '#06B6D4', description: 'Geographic data' },
  { type: 'revenue_breakdown', title: 'Revenue', icon: 'DollarSign', color: '#10B981', description: 'Financial' },
];

// Utility function for text color
const getTextColor = (hexColor?: string): string => {
  if (!hexColor) return 'white';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1F2937' : '#FFFFFF';
};

export default function ModularDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { preferences } = useThemePreferences();
  
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [selectedWidgetType, setSelectedWidgetType] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>({});

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadWidgets();
    loadAnalytics();
  }, [user]);

  const loadWidgets = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Initialize default widgets if none exist
      await initializeDefaultWidgets();
      
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_visible', true)
        .order('position');

      if (error) throw error;

      if (data) {
        setWidgets(data);
      }
    } catch (error) {
      console.error('Error loading widgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultWidgets = async () => {
    if (!user) return;

    const { data: existing } = await supabase
      .from('dashboard_widgets')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (existing && existing.length > 0) return;

    // Create 4 default widgets
    const defaults = [
      { widget_type: 'overview_stats', title: 'Overview', icon: 'Activity', position: 0, grid_settings: { x: 0, y: 0, w: 2, h: 1 }, custom_color: '#3B82F6' },
      { widget_type: 'performance_chart', title: 'Performance', icon: 'TrendingUp', position: 1, grid_settings: { x: 0, y: 1, w: 2, h: 1 }, custom_color: '#10B981' },
      { widget_type: 'top_content', title: 'Top Content', icon: 'Star', position: 2, grid_settings: { x: 0, y: 2, w: 1, h: 1 }, custom_color: '#F59E0B' },
      { widget_type: 'recent_activity', title: 'Activity', icon: 'Activity', position: 3, grid_settings: { x: 1, y: 2, w: 1, h: 1 }, custom_color: '#8B5CF6' },
    ];

    for (const widget of defaults) {
      await supabase.from('dashboard_widgets').insert({
        user_id: user.id,
        ...widget,
      });
    }
  };

  const loadAnalytics = async () => {
    if (!user) return;

    try {
      console.log('📊 Loading comprehensive analytics...');
      
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
        supabase.from('posts').select('*').eq('user_id', user.id),
        supabase.from('music_posts').select('*').eq('user_id', user.id),
        supabase.from('video_posts').select('*').eq('user_id', user.id),
        supabase.from('document_posts').select('*').eq('user_id', user.id),
        supabase.from('bookable_listings').select('*').eq('user_id', user.id),
        supabase.from('advanced_listings').select('*').eq('user_id', user.id),
        supabase.from('advanced_events').select('*').eq('user_id', user.id),
      ]);

      // Combine all content IDs
      const allContent = [
        ...(regularPosts.data || []),
        ...(musicPosts.data || []),
        ...(videoPosts.data || []),
        ...(documentPosts.data || []),
        ...(bookableListings.data || []),
        ...(advancedListings.data || []),
        ...(advancedEvents.data || []),
      ];

      const contentIds = allContent.map((c: any) => c.id);
      
      console.log(`📦 Found ${allContent.length} total content items across all tables`);

      // Fetch ALL analytics data
      const [
        viewData,
        streamData,
        salesData,
        conversionData,
        engagementData,
        analyticsEvents,
      ] = await Promise.all([
        supabase.from('view_analytics').select('*').in('content_id', contentIds),
        supabase.from('stream_analytics').select('*').in('content_id', contentIds),
        supabase.from('sales_analytics').select('*').eq('seller_id', user.id),
        supabase.from('conversion_analytics').select('*').in('content_id', contentIds),
        supabase.from('engagement_scores').select('*').eq('user_id', user.id),
        supabase.from('analytics_events').select('*').in('content_id', contentIds),
      ]);

      console.log('📊 Analytics data loaded:');
      console.log(`  Views: ${viewData.data?.length || 0}`);
      console.log(`  Streams: ${streamData.data?.length || 0}`);
      console.log(`  Sales: ${salesData.data?.length || 0}`);
      console.log(`  Events: ${analyticsEvents.data?.length || 0}`);

      setAnalyticsData({
        posts: allContent,
        views: viewData.data || [],
        streams: streamData.data || [],
        sales: salesData.data || [],
        conversions: conversionData.data || [],
        engagement: engagementData.data || [],
        events: analyticsEvents.data || [],
        
        // Content breakdown
        musicPosts: musicPosts.data || [],
        videoPosts: videoPosts.data || [],
        documentPosts: documentPosts.data || [],
        bookableListings: bookableListings.data || [],
        advancedListings: advancedListings.data || [],
        advancedEvents: advancedEvents.data || [],
      });
    } catch (error) {
      console.error('❌ Error loading analytics:', error);
    }
  };

  const handleAddWidget = (widgetType: string) => {
    const widgetInfo = WIDGET_TYPES.find(w => w.type === widgetType);
    if (!widgetInfo) return;

    setSelectedWidgetType(widgetType);
    setEditingWidget(null);
    setIsNew(true);
    setShowWidgetSelector(false);
    setShowEditor(true);
  };

  const handleEditWidget = (widget: DashboardWidget, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingWidget(widget);
    setIsNew(false);
    setShowEditor(true);
  };

  const handleSaveWidget = async (data: { title: string; color?: string; imageUrl?: string; isPublic?: boolean }) => {
    try {
      let uploadedImageUrl = data.imageUrl;

      // Handle image upload
      if (data.imageUrl && data.imageUrl.startsWith('blob:')) {
        const response = await fetch(data.imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'widget-cover.jpg', { type: 'image/jpeg' });
        
        const uploadResult = await ImageService.uploadImage(file, 'content-images', 'dashboard-widgets');
        if (uploadResult.success && uploadResult.url) {
          uploadedImageUrl = uploadResult.url;
        }
      }

      if (isNew) {
        const widgetInfo = WIDGET_TYPES.find(w => w.type === selectedWidgetType);
        const { error } = await supabase
          .from('dashboard_widgets')
          .insert({
            user_id: user!.id,
            widget_type: selectedWidgetType,
            title: data.title,
            custom_color: data.color,
            image_url: uploadedImageUrl,
            icon: widgetInfo?.icon || 'BarChart3',
            position: widgets.length,
            grid_settings: { x: widgets.length % 2, y: Math.floor(widgets.length / 2), w: 1, h: 1 },
          });

        if (error) throw error;
      } else if (editingWidget) {
        const { error } = await supabase
          .from('dashboard_widgets')
          .update({
            title: data.title,
            custom_color: data.color,
            image_url: uploadedImageUrl,
          })
          .eq('id', editingWidget.id);

        if (error) throw error;
      }

      setShowEditor(false);
      setEditingWidget(null);
      loadWidgets();
    } catch (error) {
      console.error('Error saving widget:', error);
      alert('Failed to save widget');
    }
  };

  const handleDeleteWidget = async () => {
    if (!editingWidget) return;

    try {
      const { error } = await supabase
        .from('dashboard_widgets')
        .delete()
        .eq('id', editingWidget.id);

      if (error) throw error;

      setShowEditor(false);
      setEditingWidget(null);
      loadWidgets();
    } catch (error) {
      console.error('Error deleting widget:', error);
      alert('Failed to delete widget');
    }
  };

  const handleLayoutChange = async (layout: Layout[]) => {
    if (!layout || layout.length === 0) return;
    
    try {
      await Promise.all(
        layout.map((item, index) => {
          return supabase
            .from('dashboard_widgets')
            .update({
              grid_settings: { x: item.x, y: item.y, w: item.w, h: item.h },
              position: index,
            })
            .eq('id', item.i);
        })
      );
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const layouts = {
    lg: widgets.map((widget) => ({
      i: widget.id,
      x: widget.grid_settings?.x ?? 0,
      y: widget.grid_settings?.y ?? 0,
      w: widget.grid_settings?.w ?? 1,
      h: widget.grid_settings?.h ?? 1,
      minW: 1,
      minH: 1,
      maxW: 2,
      maxH: 2,
    })),
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: preferences.accentColor, borderTopColor: 'transparent' }}
          />
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
              Your analytics workspace - fully customizable
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Draggable Widgets Grid */}
        {widgets.length === 0 ? (
          <div className="text-center py-20">
            <Icons.BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No widgets yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Add your first analytics widget</p>
            <button
              onClick={() => setShowWidgetSelector(true)}
              className="px-6 py-3 text-white rounded-xl font-medium inline-flex items-center gap-2 shadow-lg"
              style={{ backgroundColor: preferences.accentColor }}
            >
              <Plus className="w-5 h-5" />
              Add Widget
            </button>
          </div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1024, md: 768, sm: 640, xs: 0 }}
            cols={{ lg: 2, md: 2, sm: 1, xs: 1 }}
            rowHeight={250}
            isDraggable={true}
            isResizable={true}
            onLayoutChange={handleLayoutChange}
            margin={[20, 20]}
            containerPadding={[0, 0]}
            draggableHandle=".drag-handle"
          >
            {widgets.map((widget) => {
              const IconComponent = (Icons as any)[widget.icon] || Icons.BarChart3;
              const bgStyle = widget.image_url
                ? {
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${widget.image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : widget.custom_color
                ? { backgroundColor: widget.custom_color }
                : { background: `linear-gradient(135deg, ${preferences.accentColor}, ${preferences.accentColor}DD)` };
              
              const textColor = widget.image_url ? '#FFFFFF' : getTextColor(widget.custom_color || preferences.accentColor);
              const isLightBg = textColor === '#1F2937';

              return (
                <div key={widget.id} className="group h-full">
                  <div
                    className="h-full rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden relative"
                    style={bgStyle}
                  >
                    {/* Drag Handle */}
                    <div className="drag-handle absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-20 p-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg">
                      <GripVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>

                    {/* Content */}
                    <div className="h-full p-6 flex flex-col relative">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold mb-1 truncate" style={{ color: textColor }}>
                            {widget.title}
                          </h3>
                          <p className="text-sm" style={{ color: textColor, opacity: 0.7 }}>
                            {widget.widget_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                        </div>
                        
                        <div className="relative flex-shrink-0 ml-3">
                          <div className={`${isLightBg ? 'bg-gray-900/10' : 'bg-white/20'} backdrop-blur-sm rounded-xl p-2.5`}>
                            <IconComponent className="w-6 h-6" style={{ color: textColor }} />
                          </div>
                          <button
                            onClick={(e) => handleEditWidget(widget, e)}
                            className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-105 z-10"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-gray-900" />
                          </button>
                        </div>
                      </div>

                      {/* Widget Content */}
                      <div className="flex-1 min-h-0">
                        <WidgetContent 
                          widget={widget} 
                          data={analyticsData} 
                          textColor={textColor}
                          accentColor={widget.custom_color || preferences.accentColor}
                        />
                      </div>

                      {/* Resize Indicator */}
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="w-4 h-4 border-r-2 border-b-2" style={{ borderColor: textColor, opacity: 0.5 }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </ResponsiveGridLayout>
        )}

        {/* Add Widget Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setShowWidgetSelector(true)}
            className="w-64 h-64 rounded-2xl border-4 border-dashed hover:scale-105 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer"
            style={{ 
              borderColor: preferences.accentColor,
              backgroundColor: `${preferences.accentColor}10`,
            }}
          >
            <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: preferences.accentColor }}
            >
              <Plus className="w-10 h-10 text-white" />
            </div>
            <p className="text-base font-bold text-gray-700 dark:text-gray-300">Add Widget</p>
          </button>
        </div>
      </main>

      {/* Widget Selector Modal */}
      {showWidgetSelector && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Add Dashboard Widget</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Choose analytics to track</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {WIDGET_TYPES.map((type) => {
                const IconComponent = (Icons as any)[type.icon];
                return (
                  <button
                    key={type.type}
                    onClick={() => handleAddWidget(type.type)}
                    className="p-6 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all active:scale-95"
                  >
                    <div className="p-3 rounded-xl mb-3 mx-auto w-fit" style={{ backgroundColor: `${type.color}20` }}>
                      {IconComponent && <IconComponent className="w-8 h-8" style={{ color: type.color }} />}
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{type.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{type.description}</p>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowWidgetSelector(false)}
              className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Apple-Style Editor */}
      <AppleStyleBoxEditor
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false);
          setEditingWidget(null);
        }}
        onSave={handleSaveWidget}
        onDelete={!isNew && editingWidget ? handleDeleteWidget : undefined}
        initialData={editingWidget ? {
          title: editingWidget.title,
          color: editingWidget.custom_color,
          imageUrl: editingWidget.image_url,
        } : undefined}
        isNew={isNew}
      />

      <AppFooter />
      <BottomNav />
    </div>
  );
}

// Widget Content Component with REAL functionality
function WidgetContent({ 
  widget, 
  data, 
  textColor,
  accentColor 
}: { 
  widget: DashboardWidget; 
  data: any;
  textColor: string;
  accentColor: string;
}) {
  const { views = [], streams = [], sales = [], posts = [] } = data;

  switch (widget.widget_type) {
    case 'overview_stats':
      return (
        <div className="grid grid-cols-2 gap-4">
          <StatMini 
            label="Views" 
            value={views.length.toLocaleString()} 
            textColor={textColor}
            accentColor={accentColor}
          />
          <StatMini 
            label="Streams" 
            value={streams.length.toLocaleString()} 
            textColor={textColor}
            accentColor={accentColor}
          />
          <StatMini 
            label="Saves" 
            value={views.filter((v: any) => v.saved).length.toLocaleString()} 
            textColor={textColor}
            accentColor={accentColor}
          />
          <StatMini 
            label="Revenue" 
            value={`$${sales.reduce((sum: number, s: any) => sum + (s.net_amount || 0), 0).toFixed(0)}`} 
            textColor={textColor}
            accentColor={accentColor}
          />
        </div>
      );
    
    case 'performance_chart':
      // Real chart with actual data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        const dayViews = views.filter((v: any) => v.viewed_at?.startsWith(dateStr));
        return dayViews.length;
      });
      
      const maxViews = Math.max(...last7Days, 1);
      
      return (
        <div className="h-full flex items-end gap-2">
          {last7Days.map((count, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className="w-full rounded-t-lg transition-all"
                style={{ 
                  height: `${(count / maxViews) * 100}%`,
                  backgroundColor: accentColor,
                  opacity: 0.8,
                  minHeight: '4px'
                }}
              />
            </div>
          ))}
        </div>
      );
    
    case 'top_content':
      // Real top content by views
      const postViews = posts.map((p: any) => ({
        ...p,
        viewCount: views.filter((v: any) => v.content_id === p.id).length,
      })).sort((a: any, b: any) => b.viewCount - a.viewCount).slice(0, 3);

      return (
        <div className="space-y-3">
          {postViews.length > 0 ? postViews.map((post: any, i: number) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ backgroundColor: `${textColor}10` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white"
                style={{ backgroundColor: accentColor }}
              >
                #{i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: textColor }}>
                  {post.title}
                </p>
                <p className="text-xs" style={{ color: textColor, opacity: 0.7 }}>
                  {post.viewCount} views
                </p>
              </div>
            </div>
          )) : (
            <p className="text-center text-sm" style={{ color: textColor, opacity: 0.6 }}>
              No data yet
            </p>
          )}
        </div>
      );
    
    case 'recent_activity':
      // Real recent activity
      const recentViews = views.slice(0, 5).sort((a: any, b: any) => 
        new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime()
      );

      return (
        <div className="space-y-2">
          {recentViews.length > 0 ? recentViews.map((view: any, i: number) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 rounded-full mt-1.5" style={{ backgroundColor: accentColor }} />
              <div className="flex-1">
                <p style={{ color: textColor, opacity: 0.9 }}>
                  {view.saved ? 'Saved' : view.liked ? 'Liked' : 'Viewed'} content
                </p>
                <p className="text-xs" style={{ color: textColor, opacity: 0.5 }}>
                  {new Date(view.viewed_at).toRelativeTimeString() || 'Just now'}
                </p>
              </div>
            </div>
          )) : (
            <p className="text-center text-sm py-4" style={{ color: textColor, opacity: 0.6 }}>
              No activity yet
            </p>
          )}
        </div>
      );
    
    case 'streaming_stats':
      return (
        <div className="space-y-4">
          <StatRow 
            label="Total Streams" 
            value={streams.length.toLocaleString()} 
            textColor={textColor}
          />
          <StatRow 
            label="Unique Listeners" 
            value={new Set(streams.map((s: any) => s.user_id).filter(Boolean)).size.toLocaleString()} 
            textColor={textColor}
          />
          <StatRow 
            label="Avg Completion" 
            value={`${(streams.reduce((sum: number, s: any) => sum + (s.completion_percentage || 0), 0) / (streams.length || 1)).toFixed(1)}%`}
            textColor={textColor}
          />
        </div>
      );
    
    case 'sales_stats':
      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum: number, s: any) => sum + (s.net_amount || 0), 0);
      const avgOrderValue = totalRevenue / (totalSales || 1);

      return (
        <div className="space-y-4">
          <StatRow label="Total Sales" value={totalSales.toLocaleString()} textColor={textColor} />
          <StatRow label="Revenue" value={`$${totalRevenue.toFixed(0)}`} textColor={textColor} />
          <StatRow label="AOV" value={`$${avgOrderValue.toFixed(2)}`} textColor={textColor} />
        </div>
      );
    
    case 'audience_map':
      const countries = views.filter((v: any) => v.country).reduce((acc: any, v: any) => {
        acc[v.country] = (acc[v.country] || 0) + 1;
        return acc;
      }, {});
      const topCountries = Object.entries(countries).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3);

      return (
        <div className="space-y-3">
          {topCountries.length > 0 ? topCountries.map(([country, count]: any, i) => {
            const maxCount = topCountries[0][1];
            const percentage = (count / maxCount) * 100;
            
            return (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: textColor }}>{country}</span>
                  <span className="text-sm font-bold" style={{ color: textColor }}>{count}</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full">
                  <div 
                    className="h-2 rounded-full" 
                    style={{ width: `${percentage}%`, backgroundColor: accentColor }}
                  />
                </div>
              </div>
            );
          }) : (
            <p className="text-center text-sm py-4" style={{ color: textColor, opacity: 0.6 }}>
              No location data yet
            </p>
          )}
        </div>
      );
    
    case 'revenue_breakdown':
      const grossRevenue = sales.reduce((sum: number, s: any) => sum + (s.gross_amount || 0), 0);
      const fees = sales.reduce((sum: number, s: any) => sum + (s.platform_fee || 0), 0);
      const netRevenue = sales.reduce((sum: number, s: any) => sum + (s.net_amount || 0), 0);

      return (
        <div className="space-y-3">
          <div className="p-3 rounded-xl" style={{ backgroundColor: `${textColor}10` }}>
            <p className="text-xs mb-1" style={{ color: textColor, opacity: 0.7 }}>Gross</p>
            <p className="text-2xl font-bold" style={{ color: textColor }}>${grossRevenue.toFixed(0)}</p>
          </div>
          <div className="p-3 rounded-xl" style={{ backgroundColor: `${textColor}10` }}>
            <p className="text-xs mb-1" style={{ color: textColor, opacity: 0.7 }}>Fees</p>
            <p className="text-xl font-bold" style={{ color: textColor }}>-${fees.toFixed(0)}</p>
          </div>
          <div className="p-3 rounded-xl border-2" style={{ backgroundColor: `${accentColor}20`, borderColor: accentColor }}>
            <p className="text-xs mb-1" style={{ color: textColor, opacity: 0.7 }}>Net</p>
            <p className="text-2xl font-bold" style={{ color: textColor }}>${netRevenue.toFixed(0)}</p>
          </div>
        </div>
      );
    
    default:
      return (
        <div className="h-full flex items-center justify-center">
          <p className="text-sm" style={{ color: textColor, opacity: 0.6 }}>
            Loading data...
          </p>
        </div>
      );
  }
}

function StatMini({ label, value, textColor, accentColor }: { label: string; value: string; textColor: string; accentColor: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold mb-1" style={{ color: textColor }}>{value}</p>
      <p className="text-xs" style={{ color: textColor, opacity: 0.7 }}>{label}</p>
    </div>
  );
}

function StatRow({ label, value, textColor }: { label: string; value: string; textColor: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: textColor, opacity: 0.7 }}>{label}</span>
      <span className="font-bold" style={{ color: textColor }}>{value}</span>
    </div>
  );
}

// Add to Date prototype for relative time
declare global {
  interface Date {
    toRelativeTimeString(): string;
  }
}

Date.prototype.toRelativeTimeString = function() {
  const seconds = Math.floor((new Date().getTime() - this.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

