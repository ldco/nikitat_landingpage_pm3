import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { runHealthProbes } from '$lib/server/services/health'
import { getRecentLogs } from '$lib/server/utils/logger'
import type { PageServerLoad } from './$types'

/**
 * Admin Health page — PM2 health page view model (admin-guide §System Health).
 *
 * Consumes the shared health service (runHealthProbes) instead of building ad
 * hoc rows inline. Sections covered:
 *   - systemStatus   current health checks (DB, memory, heap, uptime, version,
 *                     cpu, disk, log buffer)
 *   - releaseInfo    version/build metadata (APP_BUILD_* env, node, env, ip)
 *   - recentLogs     in-memory ring buffer tail (GET /api/admin/logs source)
 *   - auditTrail     audit summary (total/success/failed + recent events)
 *   - ops            ops agent availability + summary (master only)
 *   - monitoring     external monitoring link (Uptime Kuma, when configured)
 */
export const load: PageServerLoad = async (event) => {
  requireAdminPage(event, 'health')
  const report = runHealthProbes()

  // Recent logs from the ring buffer (bounded tail, no file reads).
  const recentLogs = getRecentLogs(20).map(e => ({
    time: new Date(e.time).toISOString(),
    level: e.level,
    msg: e.msg
  }))

  // Ops agent availability + summary (best-effort; proxy endpoint is
  // master-only and agent is an optional sidecar).
  let ops: { available: boolean; summary?: unknown; error?: string } = { available: false }
  if (event.locals.user?.role === 'master' && process.env.PM_OPS_AGENT_ENABLED === 'true') {
    const token = process.env.PM_OPS_AGENT_TOKEN || process.env.PM_SETTINGS_ENCRYPTION_KEY || ''
    const port = process.env.PM_OPS_AGENT_PORT || '3010'
    const host = process.env.PM_OPS_AGENT_HOST || 'ops-agent'
    if (token) {
      try {
        const res = await fetch(`http://${host}:${port}/summary`, {
          headers: { authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(4000)
        })
        if (res.ok) {
          const body = await res.json().catch(() => null)
          ops = { available: true, summary: body?.data ?? body }
        } else {
          ops = { available: false, error: `Ops agent error (${res.status})` }
        }
      } catch (e) {
        ops = { available: false, error: e instanceof Error ? e.message : 'Ops agent unreachable' }
      }
    } else {
      ops = { available: false, error: 'PM_OPS_AGENT_TOKEN not configured' }
    }
  }

  const monitoring = {
    uptimeKumaUrl: process.env.UPTIME_KUMA_URL || (process.env.UPTIME_KUMA_SUBDOMAIN && process.env.SITE_DOMAIN
      ? `https://${process.env.UPTIME_KUMA_SUBDOMAIN}.${process.env.SITE_DOMAIN}`
      : undefined)
  }

  return { report, recentLogs, ops, monitoring }
}
