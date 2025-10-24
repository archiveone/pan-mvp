import { supabase } from '@/lib/supabase'

export interface AnalyticsEvent {
  content_id: string
  user_id?: string
  event_type: 'view' | 'like' | 'comment' | 'share' | 'download' | 'play' | 'save' | 'click'
  metadata?: Record<string, any>
  timestamp?: Date
}

export interface ContentAnalytics {
  content_id: string
  title: string
  content_type: string
  media_type?: string
  view_count: number
  like_count: number
  comment_count: number
  share_count: number
  download_count: number
  play_count: number
  save_count: number
  click_count: number
  engagement_rate: number
  created_at: string
  updated_at: string
}

export interface UserAnalytics {
  user_id: string
  total_content: number
  total_views: number
  total_likes: number
  total_comments: number
  total_shares: number
  total_downloads: number
  total_plays: number
  total_saves: number
  average_engagement: number
  top_content: ContentAnalytics[]
  recent_activity: AnalyticsEvent[]
}

export class AnalyticsService {
  
  /**
   * Track an analytics event
   */
  static async trackEvent(event: AnalyticsEvent): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          content_id: event.content_id,
          user_id: event.user_id,
          event_type: event.event_type,
          metadata: event.metadata || {},
          timestamp: event.timestamp || new Date().toISOString()
        })

      if (error) throw error

      // Update content analytics
      await this.updateContentAnalytics(event.content_id, event.event_type)

      return { success: true }
    } catch (error) {
      console.error('Error tracking analytics event:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Update content analytics counters
   */
  static async updateContentAnalytics(contentId: string, eventType: string): Promise<void> {
    try {
      const updateField = this.getAnalyticsField(eventType)
      if (!updateField) return

      const { error } = await supabase.rpc('increment_analytics_counter', {
        content_id: contentId,
        field_name: updateField
      })

      if (error) throw error
    } catch (error) {
      console.error('Error updating content analytics:', error)
    }
  }

  /**
   * Get analytics field name for event type
   */
  private static getAnalyticsField(eventType: string): string | null {
    const fieldMap: Record<string, string> = {
      'view': 'view_count',
      'like': 'like_count',
      'comment': 'comment_count',
      'share': 'share_count',
      'download': 'download_count',
      'play': 'play_count',
      'save': 'save_count',
      'click': 'click_count'
    }
    return fieldMap[eventType] || null
  }

  /**
   * Get content analytics
   */
  static async getContentAnalytics(contentId: string): Promise<{
    success: boolean
    analytics?: ContentAnalytics
    error?: string
  }> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content_type,
          media_type,
          view_count,
          like_count,
          comment_count,
          share_count,
          download_count,
          play_count,
          save_count,
          created_at,
          updated_at
        `)
        .eq('id', contentId)
        .single()

      if (error) throw error

      if (data) {
        const analytics: ContentAnalytics = {
          content_id: data.id,
          title: data.title,
          content_type: data.content_type,
          media_type: data.media_type,
          view_count: data.view_count || 0,
          like_count: data.like_count || 0,
          comment_count: data.comment_count || 0,
          share_count: data.share_count || 0,
          download_count: data.download_count || 0,
          play_count: data.play_count || 0,
          save_count: data.save_count || 0,
          click_count: 0, // Not tracked in posts table yet
          engagement_rate: this.calculateEngagementRate(data),
          created_at: data.created_at,
          updated_at: data.updated_at
        }

        return { success: true, analytics }
      }

      return { success: false, error: 'Content not found' }
    } catch (error) {
      console.error('Error getting content analytics:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get user analytics
   */
  static async getUserAnalytics(userId: string, timeRange: string = '30d'): Promise<{
    success: boolean
    analytics?: UserAnalytics
    error?: string
  }> {
    try {
      // Calculate date range
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get user's content
      const { data: contentData, error: contentError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          content_type,
          media_type,
          view_count,
          like_count,
          comment_count,
          share_count,
          download_count,
          play_count,
          save_count,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('view_count', { ascending: false })

      if (contentError) throw contentError

      if (contentData) {
        const total_content = contentData.length
        const total_views = contentData.reduce((sum, post) => sum + (post.view_count || 0), 0)
        const total_likes = contentData.reduce((sum, post) => sum + (post.like_count || 0), 0)
        const total_comments = contentData.reduce((sum, post) => sum + (post.comment_count || 0), 0)
        const total_shares = contentData.reduce((sum, post) => sum + (post.share_count || 0), 0)
        const total_downloads = contentData.reduce((sum, post) => sum + (post.download_count || 0), 0)
        const total_plays = contentData.reduce((sum, post) => sum + (post.play_count || 0), 0)
        const total_saves = contentData.reduce((sum, post) => sum + (post.save_count || 0), 0)

        const average_engagement = total_content > 0 ? 
          (total_views + total_likes + total_comments + total_shares + total_downloads + total_plays + total_saves) / total_content : 0

        const top_content = contentData.slice(0, 5).map(post => ({
          content_id: post.id,
          title: post.title,
          content_type: post.content_type,
          media_type: post.media_type,
          view_count: post.view_count || 0,
          like_count: post.like_count || 0,
          comment_count: post.comment_count || 0,
          share_count: post.share_count || 0,
          download_count: post.download_count || 0,
          play_count: post.play_count || 0,
          save_count: post.save_count || 0,
          click_count: 0,
          engagement_rate: this.calculateEngagementRate(post),
          created_at: post.created_at,
          updated_at: post.updated_at
        }))

        const analytics: UserAnalytics = {
          user_id: userId,
          total_content,
          total_views,
          total_likes,
          total_comments,
          total_shares,
          total_downloads,
          total_plays,
          total_saves,
          average_engagement,
          top_content,
          recent_activity: [] // Would need to implement analytics_events table
        }

        return { success: true, analytics }
      }

      return { success: false, error: 'No content found' }
    } catch (error) {
      console.error('Error getting user analytics:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Calculate engagement rate
   */
  private static calculateEngagementRate(post: any): number {
    const totalEngagement = (post.view_count || 0) + 
                           (post.like_count || 0) + 
                           (post.comment_count || 0) + 
                           (post.share_count || 0) + 
                           (post.download_count || 0) + 
                           (post.play_count || 0) + 
                           (post.save_count || 0)
    
    return totalEngagement
  }

  /**
   * Track view event
   */
  static async trackView(contentId: string, userId?: string): Promise<void> {
    await this.trackEvent({
      content_id: contentId,
      user_id: userId,
      event_type: 'view'
    })
  }

  /**
   * Track like event
   */
  static async trackLike(contentId: string, userId?: string): Promise<void> {
    await this.trackEvent({
      content_id: contentId,
      user_id: userId,
      event_type: 'like'
    })
  }

  /**
   * Track comment event
   */
  static async trackComment(contentId: string, userId?: string): Promise<void> {
    await this.trackEvent({
      content_id: contentId,
      user_id: userId,
      event_type: 'comment'
    })
  }

  /**
   * Track share event
   */
  static async trackShare(contentId: string, userId?: string, platform?: string): Promise<void> {
    await this.trackEvent({
      content_id: contentId,
      user_id: userId,
      event_type: 'share',
      metadata: { platform }
    })
  }

  /**
   * Track download event
   */
  static async trackDownload(contentId: string, userId?: string): Promise<void> {
    await this.trackEvent({
      content_id: contentId,
      user_id: userId,
      event_type: 'download'
    })
  }

  /**
   * Track play event
   */
  static async trackPlay(contentId: string, userId?: string): Promise<void> {
    await this.trackEvent({
      content_id: contentId,
      user_id: userId,
      event_type: 'play'
    })
  }

  /**
   * Track save event
   */
  static async trackSave(contentId: string, userId?: string): Promise<void> {
    await this.trackEvent({
      content_id: contentId,
      user_id: userId,
      event_type: 'save'
    })
  }

  /**
   * Track click event
   */
  static async trackClick(contentId: string, userId?: string, element?: string): Promise<void> {
    await this.trackEvent({
      content_id: contentId,
      user_id: userId,
      event_type: 'click',
      metadata: { element }
    })
  }

  /**
   * Get analytics dashboard data
   */
  static async getDashboardData(userId: string, timeRange: string = '30d'): Promise<{
    success: boolean
    data?: {
      summary: {
        total_posts: number
        total_views: number
        total_likes: number
        total_comments: number
        total_shares: number
        total_downloads: number
        total_plays: number
        total_saves: number
        average_engagement: number
      }
      top_posts: ContentAnalytics[]
      recent_activity: AnalyticsEvent[]
    }
    error?: string
  }> {
    try {
      const userAnalytics = await this.getUserAnalytics(userId, timeRange)
      
      if (!userAnalytics.success || !userAnalytics.analytics) {
        return { success: false, error: userAnalytics.error }
      }

      const data = {
        summary: {
          total_posts: userAnalytics.analytics.total_content,
          total_views: userAnalytics.analytics.total_views,
          total_likes: userAnalytics.analytics.total_likes,
          total_comments: userAnalytics.analytics.total_comments,
          total_shares: userAnalytics.analytics.total_shares,
          total_downloads: userAnalytics.analytics.total_downloads,
          total_plays: userAnalytics.analytics.total_plays,
          total_saves: userAnalytics.analytics.total_saves,
          average_engagement: userAnalytics.analytics.average_engagement
        },
        top_posts: userAnalytics.analytics.top_content,
        recent_activity: userAnalytics.analytics.recent_activity
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error getting dashboard data:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}