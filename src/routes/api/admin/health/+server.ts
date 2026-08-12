import type { RequestEvent } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { runHealthProbes } from '$lib/server/services/health'

/**
 * Admin health surface. Builds on the SAME public contract as /api/health
 * (status, timestamp, uptime, db, build, memory) and layers admin-only fields
 * (per-check states, audit summary) on top. The overall status is derived from
 * probe results — degraded/unhealthy payloads are returned with the matching
 * HTTP status instead of throwing raw 500s.
 */
export function GET(event: RequestEvent) {
  requireAdminPage(event, 'health')
  const report = runHealthProbes()

  return json(jsonSuccess({
    // ── public contract (parity with GET /api/health) ──
    // Preserve the richer derived status: 'error' (unhealthy), 'degraded',
    // or 'ok' — never flatten non-ok to a single degraded bucket.
    status: report.status === 'error' ? 'error' : report.status === 'ok' ? 'ok' : 'degraded',
    timestamp: report.timestamp,
    uptime: report.uptime,
    db: report.checks.find(c => c.id === 'database')?.status ?? 'error',
    build: report.build,
    memory: report.memory,
    // ── admin-only fields ──
    checks: report.checks,
    audit: report.audit,
    node: process.version
  }), {
    status: report.status === 'error' ? 503 : 200
  })
}
