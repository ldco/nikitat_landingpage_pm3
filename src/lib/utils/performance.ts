import { API_ROUTES } from '$lib/utils/api-paths'
/**
 * Performance — Core Web Vitals + navigation timing monitoring
 *
 * PM v2 parity: app-nuxt/app/composables/usePerformance.ts
 * Collects Web Vitals via PerformanceObserver and reports to
 * POST /api/analytics/performance (sendBeacon, no CSRF needed — exempt).
 *
 * Usage:
 *   import { initPerformance } from '$lib/utils/performance'
 *   if (browser) initPerformance()
 */
import { browser } from '$app/environment'

export interface WebVitalsMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
}

// Google thresholds
const VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  FCP: { good: 1800, poor: 3000 },
  INP: { good: 200, poor: 500 }
} as const

function getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = VITALS_THRESHOLDS[metricName as keyof typeof VITALS_THRESHOLDS]
  if (!thresholds) return 'good'
  if (value <= thresholds.good) return 'good'
  if (value > thresholds.poor) return 'poor'
  return 'needs-improvement'
}

const webVitals: Record<string, WebVitalsMetric> = {}
let initialized = false
// Module-scope CLS accumulator so it can be reset per navigation.
let clsValue = 0
let clsObserver: PerformanceObserver | null = null

function recordWebVital(name: string, value: number, delta = 0): void {
  webVitals[name] = { name, value, rating: getRating(name, value), delta }
}

function observeWebVitals(): void {
  if (!('PerformanceObserver' in window)) return

  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
      recordWebVital('LCP', lastEntry.startTime)
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch (error) {
    // LCP not supported
    console.debug('[perf] LCP observer unavailable:', error)
  }

  try {
    const fidObserver = new PerformanceObserver((entryList) => {
      const firstEntry = entryList.getEntries()[0] as PerformanceEntry & { processingStart: number; startTime: number }
      if (firstEntry) {
        recordWebVital('FID', firstEntry.processingStart - firstEntry.startTime)
      }
    })
    fidObserver.observe({ type: 'first-input', buffered: true })
  } catch (error) {
    // FID not supported
    console.debug('[perf] FID observer unavailable:', error)
  }

  try {
    clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as Array<PerformanceEntry & { hadRecentInput: boolean; value: number }>) {
        if (!entry.hadRecentInput) clsValue += entry.value
      }
      recordWebVital('CLS', clsValue)
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })
  } catch (error) {
    // CLS not supported
    console.debug('[perf] CLS observer unavailable:', error)
  }
}

/** Reset per-navigation metric state (called on SPA navigation). */
export function resetPerformance(): void {
  for (const key of Object.keys(webVitals)) {
    delete webVitals[key]
  }
  clsValue = 0
}

function recordNavigationTiming(): void {
  if (!('getEntriesByType' in performance)) return

  const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
  const nav = navigationEntries[0]
  if (nav) {
    recordWebVital('TTFB', nav.responseStart - nav.requestStart)
  }

  const paintEntries = performance.getEntriesByType('paint')
  const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint')
  if (fcp) recordWebVital('FCP', fcp.startTime)
}

/** Build the payload matching the /api/analytics/performance schema. */
export function buildPerformancePayload() {
  return {
    url: window.location.href,
    metrics: {
      largestContentfulPaint: webVitals.LCP?.value,
      firstContentfulPaint: webVitals.FCP?.value,
      firstInputDelay: webVitals.FID?.value,
      cumulativeLayoutShift: webVitals.CLS?.value
    }
  }
}

/** Send the collected report via sendBeacon (fire-and-forget). */
export function sendPerformanceReport(): void {
  if (!browser) return
  try {
    const payload = JSON.stringify(buildPerformancePayload())
    if ('sendBeacon' in navigator) {
      navigator.sendBeacon(API_ROUTES.analytics.performance, new Blob([payload], { type: 'application/json' }))
    } else {
      void fetch(API_ROUTES.analytics.performance, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
        keepalive: true
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn('[perf] failed to send report:', message)
  }
}

/** Get the current metrics snapshot (for debug/devtools). */
export function getPerformanceSnapshot(): Record<string, WebVitalsMetric> {
  return { ...webVitals }
}

/**
 * Initialize Web Vitals observers and report on pagehide.
 * Safe to call multiple times — only initializes once.
 */
export function initPerformance(): void {
  if (!browser || initialized) return
  initialized = true

  observeWebVitals()
  recordNavigationTiming()

  window.addEventListener('pagehide', () => {
    sendPerformanceReport()
  })
}
