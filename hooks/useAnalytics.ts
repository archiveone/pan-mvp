import { useCallback, useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AnalyticsService } from '@/services/analyticsService'

export interface UseAnalyticsReturn {
  trackView: (contentId: string) => Promise<void>
  trackLike: (contentId: string) => Promise<void>
  trackComment: (contentId: string) => Promise<void>
  trackShare: (contentId: string, platform?: string) => Promise<void>
  trackDownload: (contentId: string) => Promise<void>
  trackPlay: (contentId: string) => Promise<void>
  trackSave: (contentId: string) => Promise<void>
  trackClick: (contentId: string, element?: string) => Promise<void>
  trackEvent: (contentId: string, eventType: string, metadata?: Record<string, any>) => Promise<void>
}

export function useAnalytics(): UseAnalyticsReturn {
  const { user } = useAuth()

  const trackView = useCallback(async (contentId: string) => {
    try {
      await AnalyticsService.trackView(contentId, user?.id)
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }, [user?.id])

  const trackLike = useCallback(async (contentId: string) => {
    try {
      await AnalyticsService.trackLike(contentId, user?.id)
    } catch (error) {
      console.error('Error tracking like:', error)
    }
  }, [user?.id])

  const trackComment = useCallback(async (contentId: string) => {
    try {
      await AnalyticsService.trackComment(contentId, user?.id)
    } catch (error) {
      console.error('Error tracking comment:', error)
    }
  }, [user?.id])

  const trackShare = useCallback(async (contentId: string, platform?: string) => {
    try {
      await AnalyticsService.trackShare(contentId, user?.id, platform)
    } catch (error) {
      console.error('Error tracking share:', error)
    }
  }, [user?.id])

  const trackDownload = useCallback(async (contentId: string) => {
    try {
      await AnalyticsService.trackDownload(contentId, user?.id)
    } catch (error) {
      console.error('Error tracking download:', error)
    }
  }, [user?.id])

  const trackPlay = useCallback(async (contentId: string) => {
    try {
      await AnalyticsService.trackPlay(contentId, user?.id)
    } catch (error) {
      console.error('Error tracking play:', error)
    }
  }, [user?.id])

  const trackSave = useCallback(async (contentId: string) => {
    try {
      await AnalyticsService.trackSave(contentId, user?.id)
    } catch (error) {
      console.error('Error tracking save:', error)
    }
  }, [user?.id])

  const trackClick = useCallback(async (contentId: string, element?: string) => {
    try {
      await AnalyticsService.trackClick(contentId, user?.id, element)
    } catch (error) {
      console.error('Error tracking click:', error)
    }
  }, [user?.id])

  const trackEvent = useCallback(async (
    contentId: string, 
    eventType: string, 
    metadata?: Record<string, any>
  ) => {
    try {
      await AnalyticsService.trackEvent({
        content_id: contentId,
        user_id: user?.id,
        event_type: eventType as any,
        metadata
      })
    } catch (error) {
      console.error('Error tracking event:', error)
    }
  }, [user?.id])

  return {
    trackView,
    trackLike,
    trackComment,
    trackShare,
    trackDownload,
    trackPlay,
    trackSave,
    trackClick,
    trackEvent
  }
}

// Hook for getting analytics data
export function useAnalyticsData(userId?: string, timeRange: string = '30d') {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      const result = await AnalyticsService.getUserAnalytics(userId, timeRange)
      
      if (result.success && result.analytics) {
        setData(result.analytics)
      } else {
        setError(result.error || 'Failed to load analytics')
      }
    } catch (err) {
      console.error('Error loading analytics data:', err)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [userId, timeRange])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    data,
    loading,
    error,
    refetch: loadData
  }
}

// Hook for getting dashboard data
export function useDashboardData(userId?: string, timeRange: string = '30d') {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!userId) return

    try {
      setLoading(true)
      setError(null)

      const result = await AnalyticsService.getDashboardData(userId, timeRange)
      
      if (result.success && result.data) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to load dashboard data')
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [userId, timeRange])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    data,
    loading,
    error,
    refetch: loadData
  }
}