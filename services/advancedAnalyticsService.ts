import { supabase } from '@/lib/supabase';

// =====================================================
// ADVANCED ANALYTICS SERVICE
// Beyond Protocol: Spotify, YouTube, Shopify Level
// =====================================================

export interface StreamData {
  contentId: string;
  userId?: string;
  sessionId: string;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds: number;
  totalDurationSeconds: number;
  completionPercentage: number;
  qualityLevel?: string;
  deviceType?: string;
  location?: any;
}

export interface SalesData {
  transactionId: string;
  contentId: string;
  sellerId: string;
  buyerId?: string;
  grossAmount: number;
  discountAmount?: number;
  taxAmount?: number;
  platformFee?: number;
  netAmount: number;
  currency?: string;
  paymentMethod?: string;
  isRepeatCustomer?: boolean;
}

export interface ViewData {
  contentId: string;
  userId?: string;
  sessionId: string;
  viewDurationSeconds?: number;
  scrollDepthPercentage?: number;
  clickedCta?: boolean;
  shared?: boolean;
  saved?: boolean;
  liked?: boolean;
  deviceType?: string;
  referrer?: string;
  location?: any;
}

export class AdvancedAnalyticsService {
  // =====================================================
  // STREAM ANALYTICS (Spotify/YouTube Style)
  // =====================================================

  /**
   * Track a stream/play event
   */
  static async trackStream(data: StreamData) {
    try {
      const { data: result, error } = await supabase
        .from('stream_analytics')
        .insert({
          post_id: data.contentId,
          user_id: data.userId,
          session_id: data.sessionId,
          started_at: data.startedAt.toISOString(),
          ended_at: data.endedAt?.toISOString(),
          duration_seconds: data.durationSeconds,
          total_duration_seconds: data.totalDurationSeconds,
          completion_percentage: data.completionPercentage,
          quality_level: data.qualityLevel,
          device_type: data.deviceType,
          location: data.location,
        });

      if (error) {
        if (error.code === '42P01') {
          console.warn('⚠️ stream_analytics table does not exist. Run migration 104_advanced_analytics.sql');
        } else if (error.code === '42501') {
          console.warn('⚠️ Permission denied. Check RLS policies on stream_analytics table');
        } else {
          console.warn('⚠️ Stream tracking failed:', error.message || error);
        }
        return { success: false, error };
      }
      
      console.log('✅ Stream tracked successfully');
      return { success: true, data: result };
    } catch (error) {
      console.warn('⚠️ Stream tracking error (non-blocking):', error);
      return { success: false, error };
    }
  }

  /**
   * Get stream analytics for content
   */
  static async getStreamAnalytics(contentId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('stream_analytics')
        .select('*')
        .eq('content_id', contentId)
        .gte('started_at', startDate.toISOString());

      if (error) throw error;

      // Calculate metrics
      const metrics = {
        totalStreams: data?.length || 0,
        uniqueListeners: new Set(data?.map(d => d.user_id).filter(Boolean)).size,
        totalStreamTime: data?.reduce((sum, d) => sum + (d.duration_seconds || 0), 0) || 0,
        avgCompletionRate: data?.reduce((sum, d) => sum + (d.completion_percentage || 0), 0) / (data?.length || 1) || 0,
        fullStreams: data?.filter(d => d.completion_percentage >= 90).length || 0,
        topLocations: this.aggregateByKey(data || [], 'location'),
        topDevices: this.aggregateByKey(data || [], 'device_type'),
      };

      return { success: true, data: metrics, rawData: data };
    } catch (error) {
      console.error('Error getting stream analytics:', error);
      return { success: false, error };
    }
  }

  // =====================================================
  // SALES ANALYTICS (Shopify Style)
  // =====================================================

  /**
   * Track a sale
   */
  static async trackSale(data: SalesData) {
    try {
      const { data: result, error } = await supabase
        .from('sales_analytics')
        .insert({
          transaction_id: data.transactionId,
          post_id: data.contentId,
          seller_id: data.sellerId,
          buyer_id: data.buyerId,
          gross_amount: data.grossAmount,
          discount_amount: data.discountAmount || 0,
          tax_amount: data.taxAmount || 0,
          platform_fee: data.platformFee || 0,
          net_amount: data.netAmount,
          currency: data.currency || 'USD',
          payment_method: data.paymentMethod,
          is_repeat_customer: data.isRepeatCustomer || false,
        });

      if (error) throw error;
      return { success: true, data: result };
    } catch (error) {
      console.error('Error tracking sale:', error);
      return { success: false, error };
    }
  }

  /**
   * Get sales analytics
   */
  static async getSalesAnalytics(sellerId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('sales_analytics')
        .select('*')
        .eq('seller_id', sellerId)
        .gte('sale_date', startDate.toISOString());

      if (error) throw error;

      // Calculate metrics
      const metrics = {
        totalSales: data?.length || 0,
        grossRevenue: data?.reduce((sum, d) => sum + (d.gross_amount || 0), 0) || 0,
        netRevenue: data?.reduce((sum, d) => sum + (d.net_amount || 0), 0) || 0,
        totalFees: data?.reduce((sum, d) => sum + (d.platform_fee || 0), 0) || 0,
        totalDiscounts: data?.reduce((sum, d) => sum + (d.discount_amount || 0), 0) || 0,
        avgOrderValue: (data?.reduce((sum, d) => sum + (d.net_amount || 0), 0) || 0) / (data?.length || 1),
        uniqueCustomers: new Set(data?.map(d => d.buyer_id).filter(Boolean)).size,
        repeatCustomers: data?.filter(d => d.is_repeat_customer).length || 0,
        topProducts: await this.getTopSellingProducts(sellerId, days),
        salesByCountry: this.aggregateByKey(data || [], 'billing_country'),
      };

      return { success: true, data: metrics, rawData: data };
    } catch (error) {
      console.error('Error getting sales analytics:', error);
      return { success: false, error };
    }
  }

  /**
   * Get top selling products
   */
  static async getTopSellingProducts(sellerId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('sales_analytics')
        .select('content_id, gross_amount')
        .eq('seller_id', sellerId)
        .gte('sale_date', startDate.toISOString());

      if (error) throw error;

      // Group by content
      const byContent: Record<string, { count: number; revenue: number }> = {};
      
      data?.forEach(sale => {
        if (!byContent[sale.content_id]) {
          byContent[sale.content_id] = { count: 0, revenue: 0 };
        }
        byContent[sale.content_id].count++;
        byContent[sale.content_id].revenue += sale.gross_amount;
      });

      // Sort by count
      const sorted = Object.entries(byContent)
        .map(([id, stats]) => ({ contentId: id, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return sorted;
    } catch (error) {
      console.error('Error getting top products:', error);
      return [];
    }
  }

  // =====================================================
  // VIEW ANALYTICS (YouTube Style)
  // =====================================================

  /**
   * Track a view event
   */
  static async trackView(data: ViewData) {
    try {
      const { data: result, error } = await supabase
        .from('view_analytics')
        .insert({
          post_id: data.contentId,
          user_id: data.userId,
          session_id: data.sessionId,
          view_duration: data.viewDurationSeconds || 0,
          shared: data.shared || false,
          saved: data.saved || false,
          liked: data.liked || false,
          device_type: data.deviceType,
          referrer: data.referrer,
          country_code: data.location?.country,
        });

      if (error) {
        if (error.code === '42P01') {
          console.warn('⚠️ view_analytics table does not exist. Run migration 104_advanced_analytics.sql');
        } else if (error.code === '42501') {
          console.warn('⚠️ Permission denied. Check RLS policies on view_analytics table');
        } else {
          console.warn('⚠️ Analytics tracking failed:', error.message || error);
        }
        return { success: false, error };
      }
      
      console.log('✅ View tracked successfully');
      return { success: true, data: result };
    } catch (error) {
      console.warn('⚠️ Analytics tracking error (non-blocking):', error);
      return { success: false, error };
    }
  }

  /**
   * Get view analytics
   */
  static async getViewAnalytics(contentId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('view_analytics')
        .select('*')
        .eq('content_id', contentId)
        .gte('viewed_at', startDate.toISOString());

      if (error) throw error;

      const metrics = {
        totalViews: data?.length || 0,
        uniqueViewers: new Set(data?.map(d => d.user_id).filter(Boolean)).size,
        avgViewDuration: (data?.reduce((sum, d) => sum + (d.view_duration_seconds || 0), 0) || 0) / (data?.length || 1),
        avgScrollDepth: (data?.reduce((sum, d) => sum + (d.scroll_depth_percentage || 0), 0) || 0) / (data?.length || 1),
        engagementRate: ((data?.filter(d => d.liked || d.saved || d.shared || d.commented).length || 0) / (data?.length || 1)) * 100,
        ctaClickRate: ((data?.filter(d => d.clicked_cta).length || 0) / (data?.length || 1)) * 100,
        bounceRate: ((data?.filter(d => d.bounce).length || 0) / (data?.length || 1)) * 100,
        topReferrers: this.aggregateByKey(data || [], 'referrer'),
        topCountries: this.aggregateByKey(data || [], 'country'),
      };

      return { success: true, data: metrics, rawData: data };
    } catch (error) {
      console.error('Error getting view analytics:', error);
      return { success: false, error };
    }
  }

  // =====================================================
  // CONVERSION ANALYTICS (Funnel Tracking)
  // =====================================================

  /**
   * Track conversion funnel stage
   */
  static async updateConversionStage(
    sessionId: string,
    contentId: string,
    stage: 'viewed' | 'engaged' | 'clicked_cta' | 'added_to_cart' | 'initiated_checkout' | 'completed_purchase',
    metadata?: any
  ) {
    try {
      const updateData: any = {
        [stage]: true,
        [`${stage}_at`]: new Date().toISOString(),
      };

      if (stage === 'completed_purchase' && metadata?.amount) {
        updateData.purchase_amount = metadata.amount;
      }

      const { data, error } = await supabase
        .from('conversion_analytics')
        .upsert({
          session_id: sessionId,
          content_id: contentId,
          user_id: metadata?.userId,
          ...updateData,
        }, {
          onConflict: 'session_id,content_id',
        });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating conversion stage:', error);
      return { success: false, error };
    }
  }

  /**
   * Get conversion funnel data
   */
  static async getConversionFunnel(contentId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('conversion_analytics')
        .select('*')
        .eq('content_id', contentId)
        .gte('viewed_at', startDate.toISOString());

      if (error) throw error;

      const metrics = {
        views: data?.filter(d => d.viewed).length || 0,
        engagements: data?.filter(d => d.engaged).length || 0,
        ctaClicks: data?.filter(d => d.clicked_cta).length || 0,
        cartAdds: data?.filter(d => d.added_to_cart).length || 0,
        checkouts: data?.filter(d => d.initiated_checkout).length || 0,
        purchases: data?.filter(d => d.completed_purchase).length || 0,
        
        // Conversion rates
        viewToEngageRate: ((data?.filter(d => d.engaged).length || 0) / (data?.filter(d => d.viewed).length || 1)) * 100,
        engageToCtaRate: ((data?.filter(d => d.clicked_cta).length || 0) / (data?.filter(d => d.engaged).length || 1)) * 100,
        ctaToCartRate: ((data?.filter(d => d.added_to_cart).length || 0) / (data?.filter(d => d.clicked_cta).length || 1)) * 100,
        cartToCheckoutRate: ((data?.filter(d => d.initiated_checkout).length || 0) / (data?.filter(d => d.added_to_cart).length || 1)) * 100,
        checkoutToPurchaseRate: ((data?.filter(d => d.completed_purchase).length || 0) / (data?.filter(d => d.initiated_checkout).length || 1)) * 100,
        overallConversionRate: ((data?.filter(d => d.completed_purchase).length || 0) / (data?.filter(d => d.viewed).length || 1)) * 100,
        
        // Average time to convert
        avgTimeToPurchase: data?.filter(d => d.time_to_purchase_seconds).reduce((sum, d) => sum + (d.time_to_purchase_seconds || 0), 0) / (data?.filter(d => d.time_to_purchase_seconds).length || 1),
      };

      return { success: true, data: metrics };
    } catch (error) {
      console.error('Error getting conversion funnel:', error);
      return { success: false, error };
    }
  }

  // =====================================================
  // UNIFIED DASHBOARD ANALYTICS
  // =====================================================

  /**
   * Get comprehensive dashboard data
   */
  static async getDashboardAnalytics(userId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get user's content
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId);

      if (postsError) throw postsError;

      const contentIds = posts?.map(p => p.id) || [];

      if (contentIds.length === 0) {
        return {
          success: true,
          data: this.getEmptyDashboard(),
        };
      }

      // Parallel fetch all analytics
      const [streamData, salesData, viewData, engagementData] = await Promise.all([
        // Stream analytics
        supabase
          .from('stream_analytics')
          .select('*')
          .in('content_id', contentIds)
          .gte('started_at', startDate.toISOString()),
        
        // Sales analytics
        supabase
          .from('sales_analytics')
          .select('*')
          .eq('seller_id', userId)
          .gte('sale_date', startDate.toISOString()),
        
        // View analytics
        supabase
          .from('view_analytics')
          .select('*')
          .in('content_id', contentIds)
          .gte('viewed_at', startDate.toISOString()),
        
        // Engagement scores
        supabase
          .from('engagement_scores')
          .select('*')
          .eq('user_id', userId),
      ]);

      const streams = streamData.data || [];
      const sales = salesData.data || [];
      const views = viewData.data || [];
      const engagement = engagementData.data || [];

      // Calculate comprehensive metrics
      const dashboard = {
        // Overview
        overview: {
          totalPosts: posts?.length || 0,
          totalViews: views.length,
          totalStreams: streams.length,
          totalSales: sales.length,
          totalRevenue: sales.reduce((sum, s) => sum + (s.net_amount || 0), 0),
          totalEngagement: views.filter(v => v.liked || v.saved || v.shared).length,
        },

        // Streaming metrics (Spotify/YouTube style)
        streaming: {
          totalStreams: streams.length,
          uniqueListeners: new Set(streams.map(s => s.user_id).filter(Boolean)).size,
          totalStreamTime: streams.reduce((sum, s) => sum + (s.duration_seconds || 0), 0),
          avgStreamTime: streams.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / (streams.length || 1),
          avgCompletionRate: streams.reduce((sum, s) => sum + (s.completion_percentage || 0), 0) / (streams.length || 1),
          fullStreams: streams.filter(s => s.completion_percentage >= 90).length,
        },

        // Sales metrics (Shopify style)
        sales: {
          totalSales: sales.length,
          grossRevenue: sales.reduce((sum, s) => sum + (s.gross_amount || 0), 0),
          netRevenue: sales.reduce((sum, s) => sum + (s.net_amount || 0), 0),
          platformFees: sales.reduce((sum, s) => sum + (s.platform_fee || 0), 0),
          discounts: sales.reduce((sum, s) => sum + (s.discount_amount || 0), 0),
          avgOrderValue: sales.reduce((sum, s) => sum + (s.net_amount || 0), 0) / (sales.length || 1),
          uniqueCustomers: new Set(sales.map(s => s.buyer_id).filter(Boolean)).size,
          repeatCustomers: sales.filter(s => s.is_repeat_customer).length,
          repeatRate: (sales.filter(s => s.is_repeat_customer).length / (sales.length || 1)) * 100,
        },

        // View metrics (YouTube style)
        views: {
          totalViews: views.length,
          uniqueViewers: new Set(views.map(v => v.user_id).filter(Boolean)).size,
          avgViewDuration: views.reduce((sum, v) => sum + (v.view_duration_seconds || 0), 0) / (views.length || 1),
          avgScrollDepth: views.reduce((sum, v) => sum + (v.scroll_depth_percentage || 0), 0) / (views.length || 1),
          engagementRate: (views.filter(v => v.liked || v.saved || v.shared || v.commented).length / (views.length || 1)) * 100,
          ctaClickRate: (views.filter(v => v.clicked_cta).length / (views.length || 1)) * 100,
          bounceRate: (views.filter(v => v.bounce).length / (views.length || 1)) * 100,
        },

        // Engagement
        engagement: {
          totalLikes: views.filter(v => v.liked).length,
          totalSaves: views.filter(v => v.saved).length,
          totalShares: views.filter(v => v.shared).length,
          totalComments: views.filter(v => v.commented).length,
          avgEngagementScore: engagement.reduce((sum, e) => sum + (e.overall_score || 0), 0) / (engagement.length || 1),
        },

        // Audience
        audience: {
          topCountries: this.aggregateByKey(views, 'country').slice(0, 5),
          topCities: this.aggregateByKey(views, 'city').slice(0, 10),
          topDevices: this.aggregateByKey(views, 'device_type'),
          topReferrers: this.aggregateByKey(views, 'referrer').slice(0, 10),
        },

        // Time series data
        timeSeries: await this.getTimeSeriesData(contentIds, startDate, days),
      };

      return { success: true, data: dashboard };
    } catch (error) {
      console.error('Error getting dashboard analytics:', error);
      return { success: false, error };
    }
  }

  // =====================================================
  // HELPER FUNCTIONS
  // =====================================================

  /**
   * Aggregate data by key
   */
  private static aggregateByKey(data: any[], key: string): Array<{ label: string; count: number }> {
    const counts: Record<string, number> = {};
    
    data.forEach(item => {
      const value = item[key];
      if (value) {
        const label = typeof value === 'object' ? JSON.stringify(value) : String(value);
        counts[label] = (counts[label] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get time series data
   */
  private static async getTimeSeriesData(contentIds: string[], startDate: Date, days: number) {
    const series: Array<{ date: string; views: number; streams: number; sales: number; revenue: number }> = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      series.push({
        date: dateStr,
        views: 0,
        streams: 0,
        sales: 0,
        revenue: 0,
      });
    }

    return series;
  }

  /**
   * Get empty dashboard (for new users)
   */
  private static getEmptyDashboard() {
    return {
      overview: { totalPosts: 0, totalViews: 0, totalStreams: 0, totalSales: 0, totalRevenue: 0, totalEngagement: 0 },
      streaming: { totalStreams: 0, uniqueListeners: 0, totalStreamTime: 0, avgStreamTime: 0, avgCompletionRate: 0, fullStreams: 0 },
      sales: { totalSales: 0, grossRevenue: 0, netRevenue: 0, platformFees: 0, discounts: 0, avgOrderValue: 0, uniqueCustomers: 0, repeatCustomers: 0, repeatRate: 0 },
      views: { totalViews: 0, uniqueViewers: 0, avgViewDuration: 0, avgScrollDepth: 0, engagementRate: 0, ctaClickRate: 0, bounceRate: 0 },
      engagement: { totalLikes: 0, totalSaves: 0, totalShares: 0, totalComments: 0, avgEngagementScore: 0 },
      audience: { topCountries: [], topCities: [], topDevices: [], topReferrers: [] },
      timeSeries: [],
    };
  }

  // =====================================================
  // REAL-TIME TRACKING
  // =====================================================

  /**
   * Start streaming session
   */
  static async startStream(contentId: string, userId: string | undefined, sessionId: string, totalDuration: number) {
    return this.trackStream({
      contentId,
      userId,
      sessionId,
      startedAt: new Date(),
      durationSeconds: 0,
      totalDurationSeconds: totalDuration,
      completionPercentage: 0,
      deviceType: this.getDeviceType(),
    });
  }

  /**
   * Update streaming session
   */
  static async updateStream(sessionId: string, durationSeconds: number, totalDuration: number) {
    try {
      const completionPercentage = (durationSeconds / totalDuration) * 100;

      const { error } = await supabase
        .from('stream_analytics')
        .update({
          duration_seconds: durationSeconds,
          completion_percentage: completionPercentage,
          ended_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating stream:', error);
      return { success: false, error };
    }
  }

  /**
   * Get device type
   */
  private static getDeviceType(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'mobile';
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  /**
   * Generate session ID
   */
  static generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default AdvancedAnalyticsService;

