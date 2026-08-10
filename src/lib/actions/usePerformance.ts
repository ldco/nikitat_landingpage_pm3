/**
 * usePerformance — client performance tracking (audit N-16 framework gap)
 *
 * Observes Long Tasks and Largest Contentful Paint, posting them to the
 * existing POST /api/analytics/performance endpoint (CSRF-exempt beacon).
 * SSR-safe and fail-silent: no-ops when PerformanceObserver is unavailable.
 *
 * @example
 *   const stop = usePerformance()
 *   stop()  // disconnect observers
 */
export function usePerformance(): () => void {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
    return () => {}
  }

  const observers: PerformanceObserver[] = []
  const beacon = (data: Record<string, unknown>) => {
    try {
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ metrics: data }),
        keepalive: true
      })
    } catch (error) {
      // analytics is best-effort; never throw from the reporting path
      console.debug('[perf] beacon failed:', error)
    }
  }

  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      if (entries.length > 0) {
        beacon({ longTaskCount: entries.length, longestTask: Math.max(...entries.map((e) => e.duration)) })
      }
    })
    longTaskObserver.observe({ type: 'longtask', buffered: true })
    observers.push(longTaskObserver)
  } catch (error) {
    // longtask not supported
    console.debug('[perf] longtask observer unavailable:', error)
  }

  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const last = entries[entries.length - 1]
      if (last) {
        beacon({ largestContentfulPaint: last.startTime })
      }
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
    observers.push(lcpObserver)
  } catch (error) {
    // LCP not supported
    console.debug('[perf] LCP observer unavailable:', error)
  }

  return () => {
    for (const o of observers) o.disconnect()
  }
}
