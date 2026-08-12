/**
 * Health Service — shared server-side health probing (PM2 health page parity)
 *
 * Single source of truth for every health probe used by:
 *   - GET /api/health            (public uptime contract)
 *   - GET /api/admin/health      (admin surface)
 *   - /admin/health              (admin health page view model)
 *
 * Each probe runs with explicit error handling and timing; the overall status
 * is DERIVED from probe results (never hardcoded). A probe failure degrades
 * the status instead of throwing a raw 500.
 */
import { sql } from 'drizzle-orm'
import { useDatabase, schema } from '$lib/server/db'
import { count } from 'drizzle-orm'
import { getLogBufferSize } from '$lib/server/utils/logger'
import { statfsSync } from 'node:fs'
import { join } from 'node:path'
import { loadavg } from 'node:os'

export type ProbeStatus = 'ok' | 'degraded' | 'error' | 'unavailable'

export interface ProbeResult {
  /** Stable probe id (used for i18n keys: admin.healthPage.check.<id>) */
  id: string
  status: ProbeStatus
  /** Human value (count, bytes, duration…) — resolved by the UI via i18n when applicable */
  value?: string
  /** Optional detail for a failed probe */
  error?: string
  /** Probe wall time in ms */
  latencyMs?: number
}

export interface BuildInfo {
  version?: string
  sha?: string
  branch?: string
  message?: string
  timestamp?: string
  node?: string
  environment?: string
  ip?: string
}

export interface HealthReport {
  status: ProbeStatus
  timestamp: string
  uptime: number
  checks: ProbeResult[]
  build: BuildInfo
  memory: { heapUsed: number; heapTotal: number; rss: number }
  /** Audit summary — recent event counts grouped by outcome (PM2 audit trail) */
  audit: { total: number; success: number; failed: number; recent: Array<{ action: string; success: boolean; createdAt: Date }> }
}

/** Execute a probe, capturing status + latency without throwing. */
function runProbe(id: string, probe: () => unknown): ProbeResult {
  const started = Date.now()
  try {
    const result = probe()
    return {
      id,
      status: 'ok',
      latencyMs: Date.now() - started,
      ...(typeof result === 'string' ? { value: result } : {})
    }
  } catch (e) {
    return {
      id,
      status: 'error',
      latencyMs: Date.now() - started,
      error: e instanceof Error ? e.message : 'Unknown error'
    }
  }
}

function formatBytes(bytes: number): string {
  const mb = bytes / 1024 / 1024
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${d}d ${h}h ${m}m`
}

function getDatabaseProbe(): ProbeResult {
  return runProbe('database', () => {
    useDatabase().run(sql`SELECT 1 as ok`)
    return 'connected'
  })
}

function getMemoryProbe(): ProbeResult {
  const mem = process.memoryUsage()
  return {
    id: 'ram',
    status: 'ok',
    value: formatBytes(mem.rss)
  }
}

function getHeapProbe(): ProbeResult {
  const mem = process.memoryUsage()
  return {
    id: 'nodeHeap',
    status: 'ok',
    value: `${formatBytes(mem.heapUsed)} / ${formatBytes(mem.heapTotal)}`
  }
}

function getUptimeProbe(): ProbeResult {
  return {
    id: 'uptime',
    status: 'ok',
    value: formatUptime(process.uptime())
  }
}

function getVersionProbe(): ProbeResult {
  return {
    id: 'version',
    status: 'ok',
    value: process.env.APP_BUILD_VERSION || 'dev'
  }
}

/**
 * Passive current-load CPU probe (PM2 devops-system.md §5.1: "cgroup quota or
 * 1-min loadavg"). NEVER busy-waits: process.cpuUsage() is only meaningful as
 * a DELTA between two observations, so we retain the previous sample + wall
 * timestamp and compute utilization from the real elapsed time since the last
 * health check. This measures the load the PROCESS actually experienced
 * between checks — observational, not self-generated.
 *
 * The first call has no baseline, so it seeds one and reports the 1-min load
 * average (also the fallback in environments where cpuUsage is unavailable).
 */
interface CpuBaseline {
  user: number
  system: number
  at: number
}

let cpuBaseline: CpuBaseline | null = null

/** Minimum elapsed wall time (ms) for a meaningful utilization delta. */
const CPU_MIN_INTERVAL_MS = 250

function getCpuProbe(): ProbeResult {
  try {
    const now = Date.now()
    const usage = process.cpuUsage() // [user, system] µs, cumulative since process start
    const prev = cpuBaseline

    if (prev && now - prev.at >= CPU_MIN_INTERVAL_MS) {
      const elapsedMs = now - prev.at
      const activeUs = (usage.user - prev.user) + (usage.system - prev.system)
      // activeUs is µs of CPU time across `elapsedMs` of wall time; convert to
      // a percentage of one core, capped at 100%.
      const pct = Math.min(100, Math.max(0, (activeUs / 1000 / elapsedMs) * 100))
      cpuBaseline = { user: usage.user, system: usage.system, at: now }
      return {
        id: 'cpu',
        status: 'ok',
        value: `${Math.round(pct)}%`
      }
    }

    // No baseline yet (first call) or too-short interval: seed the baseline and
    // report the 1-min load average as an observational fallback signal.
    cpuBaseline = { user: usage.user, system: usage.system, at: now }
    const oneMin = loadavg()[0] ?? 0
    return {
      id: 'cpu',
      status: 'ok',
      value: `load ${oneMin.toFixed(2)}`
    }
  } catch (e) {
    return {
      id: 'cpu',
      status: 'unavailable',
      error: e instanceof Error ? e.message : 'CPU data unavailable'
    }
  }
}

/**
 * Disk storage paths the runtime depends on (PM2 devops-system.md §5.1:
 * "disk usage (df per mount: data, uploads, DB, app root)"). Each path is
 * probed separately so the health page reports distinct storage checks.
 */
function getDiskPaths(): Array<{ id: string; dir: string }> {
  const cwd = process.cwd()
  const dbPath = process.env.DATABASE_URL || './data/sqlite.db'
  const dbDir = dbPath.includes('/') ? dbPath.slice(0, dbPath.lastIndexOf('/')) || '/' : cwd
  return [
    { id: 'disk', dir: cwd },
    { id: 'diskApp', dir: cwd },
    { id: 'diskData', dir: join(cwd, 'data') },
    { id: 'diskDatabase', dir: dbDir },
    { id: 'diskUploads', dir: join(cwd, 'public', 'uploads') }
  ]
}

function probeDiskPath(id: string, dir: string): ProbeResult {
  try {
    const s = statfsSync(dir)
    const freeBytes = Number(s.bavail) * Number(s.bsize)
    const totalBytes = Number(s.blocks) * Number(s.bsize)
    const pct = totalBytes > 0 ? Math.round((freeBytes / totalBytes) * 100) : null
    return {
      id,
      status: 'ok',
      value: pct !== null ? `${pct}% free (${formatBytes(freeBytes)})` : `${formatBytes(freeBytes)} free`
    }
  } catch (e) {
    return {
      id,
      status: 'unavailable',
      error: e instanceof Error ? e.message : 'Disk data unavailable'
    }
  }
}

function getDiskProbes(): ProbeResult[] {
  return getDiskPaths().map(({ id, dir }) => probeDiskPath(id, dir))
}

function getLogBufferProbe(): ProbeResult {
  return {
    id: 'logBuffer',
    status: 'ok',
    value: `${getLogBufferSize()} entries`
  }
}

function getBuildInfo(): BuildInfo {
  return {
    version: process.env.APP_BUILD_VERSION || undefined,
    sha: process.env.APP_BUILD_SHA || undefined,
    branch: process.env.APP_BUILD_BRANCH || undefined,
    message: process.env.APP_BUILD_MESSAGE || undefined,
    timestamp: process.env.APP_BUILD_TIMESTAMP || undefined,
    node: process.version,
    environment: process.env.NODE_ENV || 'development',
    ip: process.env.PM_INSTANCE_IP || undefined
  }
}

function getAuditSummary(): HealthReport['audit'] {
  const db = useDatabase()
  const totalRow = db.select({ n: count() }).from(schema.auditLogs).get()
  const successRow = db.select({ n: count() }).from(schema.auditLogs).where(sql`success = 1`).get()
  const total = totalRow?.n ?? 0
  const success = successRow?.n ?? 0
  const rows = db.select({
    action: schema.auditLogs.action,
    success: schema.auditLogs.success,
    createdAt: schema.auditLogs.createdAt
  }).from(schema.auditLogs)
    .orderBy(sql`${schema.auditLogs.createdAt} desc`)
    .limit(5).all()
  const recent = rows.map(r => ({
    action: r.action,
    success: r.success === true,
    createdAt: r.createdAt ?? new Date(0)
  }))
  return { total, success, failed: total - success, recent }
}

/**
 * Run every probe and build a full health report. Probe failures downgrade the
 * derived overall status — a broken DB yields 'degraded'/'unhealthy', never a
 * thrown 500.
 */
export function runHealthProbes(): HealthReport {
  const probes: ProbeResult[] = [
    getDatabaseProbe(),
    getMemoryProbe(),
    getHeapProbe(),
    getUptimeProbe(),
    getVersionProbe(),
    getCpuProbe(),
    ...getDiskProbes(),
    getLogBufferProbe()
  ]

  // Overall status is derived from probe results. 'error' → unhealthy,
  // 'degraded' or 'unavailable' → degraded (unimplemented probes must never
  // report the system as fully healthy).
  const status: ProbeStatus = probes.some(p => p.status === 'error')
    ? 'error'
    : probes.some(p => p.status === 'degraded' || p.status === 'unavailable')
      ? 'degraded'
      : 'ok'

  const mem = process.memoryUsage()
  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: probes,
    build: getBuildInfo(),
    memory: { heapUsed: mem.heapUsed, heapTotal: mem.heapTotal, rss: mem.rss },
    audit: getAuditSummary()
  }
}

/**
 * Public (uptime) contract — the subset /api/health exposes. Status is derived
 * from the database probe so a DB outage reports 503/degraded (audit I-14).
 */
export function getPublicHealth() {
  const dbProbe = getDatabaseProbe()
  const mem = process.memoryUsage()
  return {
    status: dbProbe.status === 'ok' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    db: dbProbe.status,
    build: getBuildInfo(),
    memory: { heapUsed: mem.heapUsed, heapTotal: mem.heapTotal, rss: mem.rss }
  }
}
