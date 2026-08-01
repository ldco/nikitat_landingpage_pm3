/**
 * POST /api/analytics/performance
 *
 * Client-side performance metrics collection (PM v2 parity).
 * Accepts performance timing data and stores in memory (in production
 * this would persist to the analytics_events table or external service).
 */
import { json } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import { z } from 'zod'
import { getClientIp } from '$lib/server/security/rateLimit'

const performanceSchema = z.object({
  url: z.string().optional(),
  metrics: z.object({
    domContentLoaded: z.number().optional(),
    loadComplete: z.number().optional(),
    firstPaint: z.number().optional(),
    firstContentfulPaint: z.number().optional(),
    largestContentfulPaint: z.number().optional(),
    firstInputDelay: z.number().optional(),
    cumulativeLayoutShift: z.number().optional()
  }).optional()
})

export async function POST(event: RequestEvent) {
  const body = await event.request.json().catch(() => null)
  if (!body) return json({ success: true })

  const parsed = performanceSchema.safeParse(body)
  if (!parsed.success) return json({ success: true })

  const ip = getClientIp(event.request)
  const ua = event.request.headers.get('user-agent')

  // In dev, log briefly. Production would persist to analytics table.
  const { metrics } = parsed.data
  if (metrics?.largestContentfulPaint) {
    console.log(`[perf] lcp=${metrics.largestContentfulPaint}ms ip=${ip} ua=${ua?.slice(0, 60) ?? 'n/a'}`)
  }

  return json({ success: true })
}
