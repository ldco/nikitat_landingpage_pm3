/**
 * GET /api/admin/support-bundle
 *
 * Builds a redacted, server-owned diagnostics bundle for sharing with an agent
 * or engineer during incident triage.
 */
import { desc, eq, count } from 'drizzle-orm'
import { requireAdminSectionAccess, type RbacUser } from '../../utils/admin-rbac'
import { useDatabase, schema } from '../../database/client'
import { safeJsonParseOrNull } from '../../utils/json'
import { getRecentLogs, getBufferStats } from '../../utils/logBuffer'
import { getNetdataSummary } from '../../utils/netdata'
import { getOpsAgentConfig, opsAgentFetch } from '../../utils/ops-agent'
import { audit } from '../../utils/audit'
import { getAdminHealthData } from './health.get'
import type { H3Event } from 'h3'

function redactString(value: string): string {
  return value
    .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[redacted]')
    .replace(/\b([A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g, '[redacted-jwt]')
    .replace(/([?&](?:token|key|secret|password|signature|auth|session)=)[^&\s]+/gi, '$1[redacted]')
    .replace(/\b((?:token|key|secret|password|signature|authorization|cookie|session)[\w-]*\s*[:=]\s*)[^\s,;"']+/gi, '$1[redacted]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted-email]')
}

function redactValue(value: unknown, key = ''): unknown {
  const sensitiveKey = /(token|secret|password|authorization|cookie|session|email)/i.test(key)

  if (value === null || value === undefined) return value
  if (typeof value === 'string') return sensitiveKey ? '[redacted]' : redactString(value)
  if (typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(item => redactValue(item, key))

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
      entryKey,
      redactValue(entryValue, entryKey)
    ])
  )
}

function getOpsProblems(ops: Record<string, unknown> | null): string[] {
  if (!ops || ops.available === false) {
    return [typeof ops?.error === 'string' ? ops.error : 'Ops agent unavailable']
  }

  const problems: string[] = []
  const agent = ops.agent as Record<string, unknown> | undefined
  if (agent?.dockerSocket === false) problems.push('Docker socket is unavailable to the ops agent')

  const containers = Array.isArray(ops.containers) ? ops.containers as Array<Record<string, unknown>> : []
  for (const container of containers) {
    const name = String(container.name || 'container')
    const state = String(container.state || '')
    const health = typeof container.health === 'string' ? container.health : ''
    const restartCount = typeof container.restartCount === 'number' ? container.restartCount : 0

    if (state && state !== 'running') problems.push(`${name} is ${state}`)
    if (restartCount > 0) problems.push(`${name} restarted ${restartCount} time(s)`)
    if (health && !['healthy', 'starting'].includes(health)) problems.push(`${name} health is ${health}`)
  }

  const database = ops.database as Record<string, unknown> | undefined
  const migrations = database?.migrations as Record<string, unknown> | undefined
  const pendingMigrations = typeof migrations?.pending === 'number' ? migrations.pending : 0
  if (pendingMigrations > 0) problems.push(`${pendingMigrations} database migration(s) pending`)
  if (typeof migrations?.error === 'string') problems.push(`Migration journal: ${migrations.error}`)

  const file = database?.file as Record<string, unknown> | undefined
  const backupDir = database?.backupDir as Record<string, unknown> | undefined
  const storage = ops.storage as Record<string, unknown> | undefined
  const uploads = storage?.uploads as Record<string, unknown> | undefined
  const temp = storage?.temp as Record<string, unknown> | undefined

  if (file?.writable === false) problems.push('SQLite database is not writable')
  if (backupDir?.writable === false) problems.push('Backup directory is not writable')
  if (uploads?.writable === false) problems.push('Uploads directory is not writable')
  if (temp?.writable === false) problems.push('Temp directory is not writable')

  return problems
}

async function getOpsSummary(event: H3Event): Promise<Record<string, unknown>> {
  const config = getOpsAgentConfig(event)
  if (!config.enabled) {
    return {
      available: false,
      error: 'Ops agent is disabled'
    }
  }

  try {
    const data = await opsAgentFetch<Record<string, unknown>>(event, '/summary')
    return {
      available: true,
      ...data
    }
  } catch (error: unknown) {
    return {
      available: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

async function getOpsContainerLogs(event: H3Event) {
  const config = getOpsAgentConfig(event)
  if (!config.enabled) {
    return {
      app: { available: false, error: 'Ops agent is disabled' },
      traefik: { available: false, error: 'Ops agent is disabled' }
    }
  }

  const load = async (container: 'app' | 'traefik') => {
    try {
      return await opsAgentFetch(event, '/logs', { query: { container, tail: 250 } })
    } catch (error: unknown) {
      return {
        available: false,
        container,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  const [app, traefik] = await Promise.all([load('app'), load('traefik')])
  return { app, traefik }
}

function getAuditSummary(limit = 50) {
  const db = useDatabase()
  const totalResult = db.select({ count: count() }).from(schema.auditLogs).get()
  const total = totalResult?.count ?? 0
  const recent = db
    .select({
      action: schema.auditLogs.action,
      success: schema.auditLogs.success,
      details: schema.auditLogs.details,
      createdAt: schema.auditLogs.createdAt
    })
    .from(schema.auditLogs)
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(limit)
    .all()

  const actionCounts = db
    .select({
      action: schema.auditLogs.action,
      count: count()
    })
    .from(schema.auditLogs)
    .groupBy(schema.auditLogs.action)
    .all()

  const failedCount = db
    .select({ count: count() })
    .from(schema.auditLogs)
    .where(eq(schema.auditLogs.success, false))
    .get()?.count ?? 0

  return {
    total,
    failed: failedCount,
    byAction: actionCounts,
    recent: recent.map(log => ({
      action: log.action,
      success: log.success,
      details: safeJsonParseOrNull(log.details),
      createdAt: log.createdAt?.toISOString()
    }))
  }
}

export default defineEventHandler(async event => {
  const user = event.context.user as RbacUser | undefined
  await requireAdminSectionAccess(user, 'health')

  try {
    const [health, monitoring, operations, containerLogs] = await Promise.all([
      getAdminHealthData(event),
      getNetdataSummary(event),
      getOpsSummary(event),
      getOpsContainerLogs(event)
    ])

    const bundle = {
      bundleVersion: 2,
      generatedAt: new Date().toISOString(),
      generatedBy: {
        userId: user?.id ?? null,
        role: user?.role ?? null
      },
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        uptimeSeconds: Math.floor(process.uptime()),
        cwd: process.cwd(),
        env: process.env.NODE_ENV || 'development'
      },
      problemSummary: getOpsProblems(operations),
      health,
      monitoring,
      operations,
      appLogs: {
        entries: getRecentLogs(250),
        buffer: getBufferStats()
      },
      containerLogs,
      audit: getAuditSummary()
    }

    await audit.supportBundleExport(event, user?.id ?? 0, true)

    return {
      success: true,
      data: redactValue(bundle)
    }
  } catch (error: unknown) {
    await audit.supportBundleExport(event, user?.id ?? 0, false)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to build support bundle'
    })
  }
})
