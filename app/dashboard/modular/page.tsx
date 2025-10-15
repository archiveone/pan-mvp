'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useThemePreferences } from '@/contexts/ThemePreferencesContext';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import BottomNav from '@/components/BottomNav';
import { Plus, GripVertical, Edit3, Settings, X } from 'lucide-react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { supabase } from '@/lib/supabase';
import * as Icons from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardWidget {
  id: string;
  user_id: string;
  widget_type: string;
  title: string;
  custom_color?: string;
  icon: string;
  position: number;
  grid_settings: { x: number; y: number; w: number; h: number };
  settings: any;
  is_visible: boolean;
}

const WIDGET_TYPES = [
  { type: 'overview_stats', title: 'Overview Stats', icon: 'Activity', color: '#3B82F6', description: '4 key metrics' },
  { type: 'performance_chart', title: 'Performance Chart', icon: 'TrendingUp', color: '#10B981', description: 'Views over time' },
  { type: 'top_content', title: 'Top Content', icon: 'Star', color: '#F59E0B', description: 'Best performers' },
  { type: 'recent_activity', title: 'Recent Activity', icon: 'Activity', color: '#8B5CF6', description: 'Latest events' },
  { type: 'streaming_stats', title: 'Streaming Stats', icon: 'PlayCircle', color: '#9333EA', description: 'Music & video' },
  { type: 'sales_stats', title: 'Sales Stats', icon: 'ShoppingCart', color: '#10B981', description: 'Revenue & sales' },
  { type: 'audience_map', title: 'Audience Map', icon: 'MapPin', color: '#06B6D4', description: 'Geographic data' },
  { type: 'revenue_breakdown', title: 'Revenue', icon: 'DollarSign', color: '#10B981', description: 'Financial breakdown' },
];

export default function ModularDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { preferences } = useThemePreferences();
  
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWidgetSelector, setShowWidgetSelector] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadWidgets();
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

    // Check if user has widgets
    const { data: existing } = await supabase
      .from('dashboard_widgets')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (existing && existing.length > 0) return;

    // Create default widgets
    const defaultWidgets = [
      { widget_type: 'overview_stats', title: 'Overview', position: 0, grid_settings: { x: 0, y: 0, w: 2, h: 1 } },
      { widget_type: 'performance_chart', title: 'Performance', position: 1, grid_settings: { x: 0, y: 1, w: 2, h: 1 } },
      { widget_type: 'top_content', title: 'Top Content', position: 2, grid_settings: { x: 0, y: 2, w: 1, h: 1 } },
      { widget_type: 'recent_activity', title: 'Activity', position: 3, grid_settings: { x: 1, y: 2, w: 1, h: 1 } },
    ];

    for (const widget of defaultWidgets) {
      await supabase.from('dashboard_widgets').insert({
        user_id: user.id,
        ...widget,
      });
    }
  };

  const addWidget = async (widgetType: string) => {
    if (!user) return;

    const widgetInfo = WIDGET_TYPES.find(w => w.type === widgetType);
    if (!widgetInfo) return;

    try {
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .insert({
          user_id: user.id,
          widget_type: widgetType,
          title: widgetInfo.title,
          icon: widgetInfo.icon,
          custom_color: widgetInfo.color,
          position: widgets.length,
          grid_settings: { x: widgets.length % 2, y: Math.floor(widgets.length / 2), w: 1, h: 1 },
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setWidgets([...widgets, data]);
      }
      
      setShowWidgetSelector(false);
    } catch (error) {
      console.error('Error adding widget:', error);
    }
  };

  const removeWidget = async (widgetId: string) => {
    if (!confirm('Remove this widget from your dashboard?')) return;

    try {
      const { error } = await supabase
        .from('dashboard_widgets')
        .delete()
        .eq('id', widgetId);

      if (error) throw error;

      setWidgets(widgets.filter(w => w.id !== widgetId));
    } catch (error) {
      console.error('Error removing widget:', error);
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
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                📊 Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Customize your analytics workspace
              </p>
            </div>
            <button
              onClick={() => router.push('/settings/appearance')}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Settings className="w-5 h-5" />
              Theme
            </button>
          </div>
        </div>

        {/* Widgets Grid */}
        {widgets.length === 0 ? (
          <div className="text-center py-20">
            <Icons.BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No widgets yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Add your first widget to start tracking</p>
            <button
              onClick={() => setShowWidgetSelector(true)}
              className="px-6 py-3 text-white rounded-xl font-medium inline-flex items-center gap-2"
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
              
              return (
                <div key={widget.id} className="group">
                  <div className="h-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden">
                    {/* Drag Handle */}
                    <div className="drag-handle absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-20 p-1.5 bg-white/90 dark:bg-gray-700/90 backdrop-blur-sm rounded-lg shadow-lg">
                      <GripVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>

                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl" style={{ backgroundColor: `${widget.custom_color || preferences.accentColor}20` }}>
                            <IconComponent className="w-5 h-5" style={{ color: widget.custom_color || preferences.accentColor }} />
                          </div>
                          <h3 className="font-bold text-gray-900 dark:text-white">{widget.title}</h3>
                        </div>
                        <button
                          onClick={() => removeWidget(widget.id)}
                          className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                        >
                          <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {/* Widget Content */}
                    <div className="p-6">
                      <WidgetContent widget={widget} accentColor={widget.custom_color || preferences.accentColor} />
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
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Add Dashboard Widget</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Choose analytics widgets to track</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {WIDGET_TYPES.map((type) => {
                const IconComponent = (Icons as any)[type.icon];
                return (
                  <button
                    key={type.type}
                    onClick={() => addWidget(type.type)}
                    className="p-6 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all text-left"
                  >
                    <div className="p-3 rounded-xl mb-3 inline-flex" style={{ backgroundColor: `${type.color}20` }}>
                      {IconComponent && <IconComponent className="w-6 h-6" style={{ color: type.color }} />}
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

      <AppFooter />
      <BottomNav />
    </div>
  );
}

// Widget Content Component
function WidgetContent({ widget, accentColor }: { widget: DashboardWidget; accentColor: string }) {
  switch (widget.widget_type) {
    case 'overview_stats':
      return (
        <div className="grid grid-cols-2 gap-4">
          <StatMini label="Views" value="12.3K" color={accentColor} />
          <StatMini label="Likes" value="1.5K" color={accentColor} />
          <StatMini label="Saves" value="789" color={accentColor} />
          <StatMini label="Revenue" value="$3.4K" color={accentColor} />
        </div>
      );
    
    case 'performance_chart':
      return (
        <div className="h-32 flex items-end gap-2">
          {[40, 60, 45, 70, 55, 80, 65].map((height, i) => (
            <div key={i} className="flex-1 rounded-t-lg" style={{ 
              height: `${height}%`, 
              backgroundColor: accentColor,
              opacity: 0.8,
            }} />
          ))}
        </div>
      );
    
    case 'top_content':
      return (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white"
                style={{ backgroundColor: accentColor }}
              >
                #{i}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  Content Title {i}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {(1000 - i * 100).toLocaleString()} views
                </p>
              </div>
            </div>
          ))}
        </div>
      );
    
    case 'recent_activity':
      return (
        <div className="space-y-3">
          {['View', 'Like', 'Save'].map((action, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
              <span className="text-gray-900 dark:text-white">{action} on "Post Title"</span>
            </div>
          ))}
        </div>
      );
    
    case 'streaming_stats':
      return (
        <div className="space-y-3">
          <StatRow label="Total Streams" value="45.6K" color={accentColor} />
          <StatRow label="Listeners" value="12.3K" color={accentColor} />
          <StatRow label="Hours" value="1.2K" color={accentColor} />
        </div>
      );
    
    case 'sales_stats':
      return (
        <div className="space-y-3">
          <StatRow label="Sales" value="234" color={accentColor} />
          <StatRow label="Revenue" value="$45.6K" color={accentColor} />
          <StatRow label="AOV" value="$195" color={accentColor} />
        </div>
      );
    
    default:
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Widget content
        </div>
      );
  }
}

function StatMini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-bold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

