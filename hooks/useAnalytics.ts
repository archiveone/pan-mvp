'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdvancedAnalyticsService from '@/services/advancedAnalyticsService';

/**
 * Hook to automatically track page views
 */
export function usePageView(contentId: string, contentType?: string) {
  const { user } = useAuth();
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    
    const sessionId = AdvancedAnalyticsService.generateSessionId();
    
    // Track view
    AdvancedAnalyticsService.trackView({
      contentId,
      userId: user?.id,
      sessionId,
      deviceType: getDeviceType(),
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      location: {
        // You can add geolocation here if needed
      },
    });

    tracked.current = true;
  }, [contentId, user]);
}

/**
 * Hook to track streaming/playback
 */
export function useStreamTracking(contentId: string, totalDuration: number, mediaType: 'audio' | 'video') {
  const { user } = useAuth();
  const sessionId = useRef(AdvancedAnalyticsService.generateSessionId());
  const startTime = useRef<number>(0);

  const startStream = () => {
    startTime.current = Date.now();
    AdvancedAnalyticsService.startStream(contentId, user?.id, sessionId.current, totalDuration);
  };

  const updateStream = (currentTime: number) => {
    const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
    AdvancedAnalyticsService.updateStream(sessionId.current, elapsed, totalDuration);
  };

  const endStream = (currentTime: number) => {
    const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
    AdvancedAnalyticsService.updateStream(sessionId.current, elapsed, totalDuration);
  };

  return { startStream, updateStream, endStream };
}

/**
 * Track engagement actions (like, save, share)
 */
export function useEngagementTracking() {
  const { user } = useAuth();

  const trackLike = async (contentId: string) => {
    if (!user) return;
    
    await AdvancedAnalyticsService.trackView({
      contentId,
      userId: user.id,
      sessionId: AdvancedAnalyticsService.generateSessionId(),
      liked: true,
      deviceType: getDeviceType(),
    });
  };

  const trackSave = async (contentId: string) => {
    if (!user) return;
    
    await AdvancedAnalyticsService.trackView({
      contentId,
      userId: user.id,
      sessionId: AdvancedAnalyticsService.generateSessionId(),
      saved: true,
      deviceType: getDeviceType(),
    });
  };

  const trackShare = async (contentId: string) => {
    if (!user) return;
    
    await AdvancedAnalyticsService.trackView({
      contentId,
      userId: user.id,
      sessionId: AdvancedAnalyticsService.generateSessionId(),
      shared: true,
      deviceType: getDeviceType(),
    });
  };

  return { trackLike, trackSave, trackShare };
}

// Helper function
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}

