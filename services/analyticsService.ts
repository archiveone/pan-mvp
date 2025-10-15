import { supabase } from '@/lib/supabase';

export interface Analytics {
  content_id: string;
  user_id: string;
  metric_type: 'view' | 'like' | 'save' | 'share' | 'purchase' | 'booking';
  value: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface DemographicData {
  location?: string;
  age_range?: string;
  device_type?: string;
  referrer?: string;
}

export class AnalyticsService {
  /**
   * Track a metric event (view, like, save, etc.)
   */
  static async trackMetric(
    contentId: string,
    userId: string,
    metricType: Analytics['metric_type'],
    value: number = 1,
    metadata?: Record<string, any>
  ) {
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .insert({
          content_id: contentId,
          user_id: userId,
          metric_type: metricType,
          value,
          metadata,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error tracking metric:', error);
      return { success: false, error };
    }
  }

  /**
   * Track a view
   */
  static async trackView(contentId: string, userId?: string, demographics?: DemographicData) {
    return this.trackMetric(contentId, userId || 'anonymous', 'view', 1, demographics);
  }

  /**
   * Track a like
   */
  static async trackLike(contentId: string, userId: string) {
    return this.trackMetric(contentId, userId, 'like', 1);
  }

  /**
   * Track a save
   */
  static async trackSave(contentId: string, userId: string) {
    return this.trackMetric(contentId, userId, 'save', 1);
  }

  /**
   * Track a share
   */
  static async trackShare(contentId: string, userId: string, platform?: string) {
    return this.trackMetric(contentId, userId, 'share', 1, { platform });
  }

  /**
   * Track a purchase/booking
   */
  static async trackPurchase(contentId: string, userId: string, amount: number, currency: string = 'USD') {
    return this.trackMetric(contentId, userId, 'purchase', amount, { currency });
  }

  /**
   * Get analytics for a specific content item
   */
  static async getContentAnalytics(contentId: string, startDate?: Date, endDate?: Date) {
    try {
      let query = supabase
        .from('analytics_events')
        .select('*')
        .eq('content_id', contentId);

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Aggregate metrics
      const metrics = {
        views: 0,
        likes: 0,
        saves: 0,
        shares: 0,
        revenue: 0,
      };

      data?.forEach((event: Analytics) => {
        switch (event.metric_type) {
          case 'view':
            metrics.views += event.value;
            break;
          case 'like':
            metrics.likes += event.value;
            break;
          case 'save':
            metrics.saves += event.value;
            break;
          case 'share':
            metrics.shares += event.value;
            break;
          case 'purchase':
          case 'booking':
            metrics.revenue += event.value;
            break;
        }
      });

      return { success: true, data: metrics, events: data };
    } catch (error) {
      console.error('Error getting content analytics:', error);
      return { success: false, error };
    }
  }

  /**
   * Get analytics for a user's content
   */
  static async getUserAnalytics(userId: string, startDate?: Date, endDate?: Date) {
    try {
      // First, get all user's content
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', userId);

      if (postsError) throw postsError;

      const contentIds = posts?.map(p => p.id) || [];

      if (contentIds.length === 0) {
        return {
          success: true,
          data: {
            totalViews: 0,
            totalLikes: 0,
            totalSaves: 0,
            totalShares: 0,
            totalRevenue: 0,
            byContent: {},
          },
        };
      }

      // Get analytics for all user's content
      let query = supabase
        .from('analytics_events')
        .select('*')
        .in('content_id', contentIds);

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data: events, error: eventsError } = await query;

      if (eventsError) throw eventsError;

      // Aggregate metrics
      const totals = {
        totalViews: 0,
        totalLikes: 0,
        totalSaves: 0,
        totalShares: 0,
        totalRevenue: 0,
      };

      const byContent: Record<string, any> = {};

      events?.forEach((event: Analytics) => {
        // Initialize content metrics if not exists
        if (!byContent[event.content_id]) {
          byContent[event.content_id] = {
            views: 0,
            likes: 0,
            saves: 0,
            shares: 0,
            revenue: 0,
          };
        }

        // Update content-specific metrics
        switch (event.metric_type) {
          case 'view':
            byContent[event.content_id].views += event.value;
            totals.totalViews += event.value;
            break;
          case 'like':
            byContent[event.content_id].likes += event.value;
            totals.totalLikes += event.value;
            break;
          case 'save':
            byContent[event.content_id].saves += event.value;
            totals.totalSaves += event.value;
            break;
          case 'share':
            byContent[event.content_id].shares += event.value;
            totals.totalShares += event.value;
            break;
          case 'purchase':
          case 'booking':
            byContent[event.content_id].revenue += event.value;
            totals.totalRevenue += event.value;
            break;
        }
      });

      return { success: true, data: { ...totals, byContent } };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return { success: false, error };
    }
  }

  /**
   * Get performance over time
   */
  static async getPerformanceTimeSeries(
    userId: string,
    metric: 'views' | 'likes' | 'saves' | 'revenue',
    days: number = 30
  ) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get user's content
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', userId);

      if (postsError) throw postsError;

      const contentIds = posts?.map(p => p.id) || [];

      if (contentIds.length === 0) {
        return { success: true, data: [] };
      }

      // Get events
      const { data: events, error: eventsError } = await supabase
        .from('analytics_events')
        .select('*')
        .in('content_id', contentIds)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (eventsError) throw eventsError;

      // Group by date
      const byDate: Record<string, number> = {};

      events?.forEach((event: Analytics) => {
        const date = new Date(event.created_at).toISOString().split('T')[0];
        
        if (!byDate[date]) {
          byDate[date] = 0;
        }

        const metricMap = {
          views: 'view',
          likes: 'like',
          saves: 'save',
          revenue: ['purchase', 'booking'],
        };

        const targetMetrics = Array.isArray(metricMap[metric]) 
          ? metricMap[metric] 
          : [metricMap[metric]];

        if (targetMetrics.includes(event.metric_type)) {
          byDate[date] += event.value;
        }
      });

      // Fill in missing dates
      const result = [];
      for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          value: byDate[dateStr] || 0,
        });
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Error getting performance time series:', error);
      return { success: false, error };
    }
  }

  /**
   * Get top performing content
   */
  static async getTopContent(userId: string, metric: 'views' | 'likes' | 'saves' | 'revenue', limit: number = 10) {
    try {
      const analytics = await this.getUserAnalytics(userId);

      if (!analytics.success || !analytics.data) {
        return { success: false, error: 'Failed to fetch analytics' };
      }

      const { byContent } = analytics.data;

      // Get post details
      const contentIds = Object.keys(byContent);
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .in('id', contentIds);

      if (postsError) throw postsError;

      // Combine and sort
      const combined = posts?.map(post => ({
        ...post,
        analytics: byContent[post.id],
        sortValue: byContent[post.id]?.[metric] || 0,
      })).sort((a, b) => b.sortValue - a.sortValue).slice(0, limit) || [];

      return { success: true, data: combined };
    } catch (error) {
      console.error('Error getting top content:', error);
      return { success: false, error };
    }
  }

  /**
   * Get demographic data
   */
  static async getDemographics(userId: string) {
    try {
      const { data: posts } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', userId);

      const contentIds = posts?.map(p => p.id) || [];

      if (contentIds.length === 0) {
        return { success: true, data: { locations: [], devices: [], ageRanges: [] } };
      }

      const { data: events } = await supabase
        .from('analytics_events')
        .select('metadata')
        .in('content_id', contentIds)
        .eq('metric_type', 'view');

      // Aggregate demographics
      const locations: Record<string, number> = {};
      const devices: Record<string, number> = {};
      const ageRanges: Record<string, number> = {};

      events?.forEach((event: Analytics) => {
        if (event.metadata?.location) {
          locations[event.metadata.location] = (locations[event.metadata.location] || 0) + 1;
        }
        if (event.metadata?.device_type) {
          devices[event.metadata.device_type] = (devices[event.metadata.device_type] || 0) + 1;
        }
        if (event.metadata?.age_range) {
          ageRanges[event.metadata.age_range] = (ageRanges[event.metadata.age_range] || 0) + 1;
        }
      });

      return {
        success: true,
        data: {
          locations: Object.entries(locations).map(([location, count]) => ({ location, count })).sort((a, b) => b.count - a.count),
          devices: Object.entries(devices).map(([device, count]) => ({ device, count })).sort((a, b) => b.count - a.count),
          ageRanges: Object.entries(ageRanges).map(([age, count]) => ({ age, count })).sort((a, b) => b.count - a.count),
        },
      };
    } catch (error) {
      console.error('Error getting demographics:', error);
      return { success: false, error };
    }
  }
}

export default AnalyticsService;

