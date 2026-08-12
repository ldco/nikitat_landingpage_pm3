import type { RequestEvent } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'
import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { getRecentLogs } from '$lib/server/utils/logger'

const ALLOWED_LOG_TYPES = ['app', 'error', 'access', 'audit'] as const

const querySchema = z.object({
  type: z.enum(ALLOWED_LOG_TYPES).default('app'),
  lines: z.coerce.number().int().min(1).max(500).default(50)
})

/**
 * Recent application logs from the in-memory ring buffer (PM2 monitoring.md
 * parity: "Recent Logs | In-memory buffer | GET /api/admin/logs"). Bounded
 * tail — never reads log files synchronously. The `type` filter maps to a
 * severity hint: error types surface error-level entries, others surface the
 * buffer tail.
 */
export function GET(event: RequestEvent) {
  requireAdminPage(event, 'health')
  const parsed = querySchema.safeParse(Object.fromEntries(event.url.searchParams))
  if (!parsed.success) return json({ success: false, error: { code: 'validation.query', message: parsed.error.issues.map(e => e.message).join(', ') } }, { status: 400 })

  const { type, lines } = parsed.data
  const entries = getRecentLogs(lines)
  // PM2: an 'error' view filters to error-level lines; everything else is the raw tail.
  const filtered = type === 'error'
    ? entries.filter(e => (e.level ?? 30) >= 50)
    : entries

  const formatted = filtered.map(e => ({
    time: new Date(e.time).toISOString(),
    level: e.level,
    msg: e.msg
  }))

  return json(jsonSuccess({ log: formatted, totalLines: formatted.length }))
}
