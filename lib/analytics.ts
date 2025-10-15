// Analytics and monitoring utilities for Pan

export class Analytics {
  private static initialized = false

  static initialize() {
    if (this.initialized) return
    
    // Initialize analytics only if user has given consent
    const consent = this.getConsent()
    
    if (consent?.analytics) {
      this.initializeGoogleAnalytics()
      this.initialized = true
    }
  }

  private static getConsent() {
    if (typeof window === 'undefined') return null
    
    try {
      const consentString = localStorage.getItem('cookieConsent')
      return consentString ? JSON.parse(consentString) : null
    } catch {
      return null
    }
  }

  private static initializeGoogleAnalytics() {
    // TODO: Add your Google Analytics ID
    const GA_ID = process.env.NEXT_PUBLIC_GA_ID
    
    if (!GA_ID) return

    // Load GA script
    const script = document.createElement('script')
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
    script.async = true
    document.head.appendChild(script)

    // Initialize GA
    ;(window as any).dataLayer = (window as any).dataLayer || []
    function gtag(...args: any[]) {
      ;(window as any).dataLayer.push(args)
    }
    gtag('js', new Date())
    gtag('config', GA_ID)
  }

  // Track page view
  static trackPageView(url: string) {
    const consent = this.getConsent()
    if (!consent?.analytics) return

    try {
      if ((window as any).gtag) {
        ;(window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
          page_path: url,
        })
      }
    } catch (error) {
      console.error('Failed to track page view:', error)
    }
  }

  // Track custom event
  static trackEvent(eventName: string, eventParams?: Record<string, any>) {
    const consent = this.getConsent()
    if (!consent?.analytics) return

    try {
      if ((window as any).gtag) {
        ;(window as any).gtag('event', eventName, eventParams)
      }
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }

  // Track user action
  static track(action: string, category: string, label?: string, value?: number) {
    this.trackEvent(action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Error tracking
export class ErrorTracking {
  private static initialized = false

  static initialize() {
    if (this.initialized || typeof window === 'undefined') return

    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.logError(event.error)
    })

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(event.reason)
    })

    this.initialized = true
  }

  static logError(error: Error | any) {
    console.error('Error tracked:', error)

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    try {
      // Example: Send to your API
      // fetch('/api/log-error', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     message: error?.message || 'Unknown error',
      //     stack: error?.stack,
      //     timestamp: new Date().toISOString(),
      //     url: window.location.href,
      //     userAgent: navigator.userAgent,
      //   }),
      // })
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError)
    }
  }
}

// Performance monitoring
export class PerformanceMonitoring {
  static measurePageLoad() {
    if (typeof window === 'undefined') return

    window.addEventListener('load', () => {
      const perfData = window.performance.timing
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
      
      Analytics.trackEvent('page_load_time', {
        load_time: pageLoadTime,
        page: window.location.pathname,
      })
    })
  }

  static measureInteraction(name: string, duration: number) {
    Analytics.trackEvent('user_interaction', {
      interaction_name: name,
      duration: duration,
    })
  }
}

// Initialize everything
export function initializeMonitoring() {
  if (typeof window === 'undefined') return

  Analytics.initialize()
  ErrorTracking.initialize()
  PerformanceMonitoring.measurePageLoad()
}

export default Analytics

