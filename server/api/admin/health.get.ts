/**
 * Admin Health Endpoint
 *
 * GET /api/admin/health
 *
 * Returns detailed server health information for the admin health page.
 * Requires master role (enforced here, auth already checked by middleware).
 *
 * Returns more details than the public /api/health endpoint:
 * - Full memory breakdown
 * - Disk usage (if available)
 * - Log buffer stats
 * - Environment info
 */
import { useDatabase, schema } from '../../database/client'
import { requireAdminSectionAccess, type RbacUser } from '../../utils/admin-rbac'
import { getDatabaseDiskPathFromUrl } from '../../utils/admin-health-runtime'
import { getBufferStats } from '../../utils/logBuffer'
import { sql } from 'drizzle-orm'
import { cpus, freemem, loadavg, totalmem } from 'node:os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { getHeapStatistics } from 'node:v8'
import type { H3Event } from 'h3'

const execFileAsync = promisify(execFile)

interface HealthCheck {
  name: string
  status: 'ok' | 'error' | 'warning'
  latency?: number
  message?: string
  details?: Record<string, unknown>
}

interface CgroupMemoryStats {
  scope: 'container' | 'host'
  usedBytes: number
  totalBytes: number
  freeBytes: number
}

interface CgroupCpuLimit {
  scope: 'container' | 'host'
  cores: number
}

function getPercentageStatus(percentage: number): 'ok' | 'warning' | 'error' {
  if (percentage >= 95) return 'error'
  if (percentage >= 85) return 'warning'
  return 'ok'
}

function setOverallStatus(
  current: 'ok' | 'degraded' | 'unhealthy',
  checkStatus: 'ok' | 'warning' | 'error'
): 'ok' | 'degraded' | 'unhealthy' {
  if (checkStatus === 'error') return 'unhealthy'
  if (checkStatus === 'warning' && current === 'ok') return 'degraded'
  return current
}

function readTextFile(path: string): string | null {
  try {
    if (!existsSync(path)) return null
    return readFileSync(path, 'utf8').trim()
  } catch {
    return null
  }
}

function readNumberFile(path: string): number | null {
  const value = readTextFile(path)
  if (!value || value === 'max') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function isUsableCgroupLimit(limit: number | null): limit is number {
  return typeof limit === 'number' && Number.isFinite(limit) && limit > 0 && limit < 9007199254740991
}

function getCgroupMemoryStats(): CgroupMemoryStats {
  const v2Usage = readNumberFile('/sys/fs/cgroup/memory.current')
  const v2Limit = readNumberFile('/sys/fs/cgroup/memory.max')

  if (v2Usage !== null && isUsableCgroupLimit(v2Limit)) {
    return {
      scope: 'container',
      usedBytes: v2Usage,
      totalBytes: v2Limit,
      freeBytes: Math.max(0, v2Limit - v2Usage)
    }
  }

  const v1Usage = readNumberFile('/sys/fs/cgroup/memory/memory.usage_in_bytes')
  const v1Limit = readNumberFile('/sys/fs/cgroup/memory/memory.limit_in_bytes')

  if (v1Usage !== null && isUsableCgroupLimit(v1Limit)) {
    return {
      scope: 'container',
      usedBytes: v1Usage,
      totalBytes: v1Limit,
      freeBytes: Math.max(0, v1Limit - v1Usage)
    }
  }

  const hostTotal = totalmem()
  const hostFree = freemem()

  return {
    scope: 'host',
    usedBytes: Math.max(0, hostTotal - hostFree),
    totalBytes: hostTotal,
    freeBytes: hostFree
  }
}

function getCpuLimit(): CgroupCpuLimit {
  const cpuMax = readTextFile('/sys/fs/cgroup/cpu.max')
  if (cpuMax) {
    const [quotaValue, periodValue] = cpuMax.split(/\s+/)
    const quota = quotaValue === 'max' ? null : Number(quotaValue)
    const period = Number(periodValue)
    if (quota && period > 0) {
      return {
        scope: 'container',
        cores: Math.max(0.01, quota / period)
      }
    }
  }

  const quota = readNumberFile('/sys/fs/cgroup/cpu/cpu.cfs_quota_us')
  const period = readNumberFile('/sys/fs/cgroup/cpu/cpu.cfs_period_us')
  if (quota && quota > 0 && period && period > 0) {
    return {
      scope: 'container',
      cores: Math.max(0.01, quota / period)
    }
  }

  return {
    scope: 'host',
    cores: Math.max(1, cpus().length)
  }
}

function readCgroupCpuUsageMicros(): number | null {
  const cpuStat = readTextFile('/sys/fs/cgroup/cpu.stat')
  if (cpuStat) {
    const usageLine = cpuStat.split('\n').find(line => line.startsWith('usage_usec '))
    const usage = Number(usageLine?.split(/\s+/)[1])
    if (Number.isFinite(usage)) return usage
  }

  const usageNanos = readNumberFile('/sys/fs/cgroup/cpuacct/cpuacct.usage')
  return usageNanos === null ? null : usageNanos / 1000
}

async function getCpuCheck(): Promise<HealthCheck> {
  const limit = getCpuLimit()
  const firstUsage = readCgroupCpuUsageMicros()

  if (limit.scope === 'container' && firstUsage !== null) {
    const startedAt = process.hrtime.bigint()
    await delay(100)
    const secondUsage = readCgroupCpuUsageMicros()
    const endedAt = process.hrtime.bigint()

    if (secondUsage !== null && secondUsage >= firstUsage) {
      const elapsedMicros = Number(endedAt - startedAt) / 1000
      const rawPercentage = elapsedMicros > 0
        ? ((secondUsage - firstUsage) / (elapsedMicros * limit.cores)) * 100
        : 0
      const percentage = Math.max(0, Math.round(rawPercentage))

      return {
        name: 'cpu',
        status: getPercentageStatus(percentage),
        details: {
          scope: limit.scope,
          percentage,
          cores: Number(limit.cores.toFixed(2)),
          usageDeltaMs: Math.round((secondUsage - firstUsage) / 1000)
        }
      }
    }
  }

  const oneMinuteLoad = loadavg()[0] || 0
  const percentage = Math.round((oneMinuteLoad / limit.cores) * 100)

  return {
    name: 'cpu',
    status: getPercentageStatus(percentage),
    details: {
      scope: limit.scope,
      percentage,
      load1m: Number(oneMinuteLoad.toFixed(2)),
      cores: Number(limit.cores.toFixed(2))
    }
  }
}

function getRuntimeDiskPaths(): Array<{ name: string; path: string }> {
  const candidates = [
    { name: 'diskData', path: '/app/data' },
    { name: 'diskUploads', path: '/app/uploads' }
  ]

  const databaseUrl = process.env.DATABASE_URL || ''
  const databasePath = getDatabaseDiskPathFromUrl(databaseUrl)
  if (databasePath) {
    candidates.push({ name: 'diskDatabase', path: databasePath })
  }

  candidates.push({ name: 'diskApp', path: process.cwd() })

  const seen = new Set<string>()
  return candidates
    .map(candidate => ({ ...candidate, path: resolve(candidate.path) }))
    .filter(candidate => {
      if (seen.has(candidate.path) || !existsSync(candidate.path)) return false
      seen.add(candidate.path)
      return true
    })
}

async function getDiskCheck(name: string, path: string): Promise<HealthCheck> {
  try {
    const { stdout } = await execFileAsync('df', ['-Pk', path], {
      timeout: 3000,
      maxBuffer: 32 * 1024,
      shell: false
    })
    const lines = stdout.trim().split('\n')
    const dataLine = lines[lines.length - 1]
    const parts = dataLine?.trim().split(/\s+/) || []
    const sizeKB = Number(parts[1] || 0)
    const usedKB = Number(parts[2] || 0)
    const availableKB = Number(parts[3] || 0)
    const mount = parts[5] || '/'
    const percentage = sizeKB > 0 ? Math.round((usedKB / sizeKB) * 100) : 0

    return {
      name,
      status: getPercentageStatus(percentage),
      details: {
        scope: 'runtimePath',
        path,
        percentage,
        usedMB: Math.round(usedKB / 1024),
        totalMB: Math.round(sizeKB / 1024),
        availableMB: Math.round(availableKB / 1024),
        mount
      }
    }
  } catch (error: unknown) {
    return {
      name,
      status: 'warning',
      message: error instanceof Error ? error.message : 'Disk usage check failed',
      details: {
        scope: 'runtimePath',
        path
      }
    }
  }
}

async function getDiskChecks(): Promise<HealthCheck[]> {
  const paths = getRuntimeDiskPaths()
  if (paths.length === 0) {
    return [await getDiskCheck('diskApp', process.cwd())]
  }

  return Promise.all(paths.map(item => getDiskCheck(item.name, item.path)))
}

export async function getAdminHealthData(event: H3Event) {
  const startTime = Date.now()
  const runtimeConfig = useRuntimeConfig(event)
  const checks: HealthCheck[] = []
  let overallStatus: 'ok' | 'degraded' | 'unhealthy' = 'ok'

  // Database check with more details
  const dbStart = Date.now()
  try {
    const db = useDatabase()

    // Check connection using COUNT(*) instead of loading all rows
    const userCountResult = db.select({ count: sql<number>`count(*)` }).from(schema.users).get()
    const userCount = userCountResult?.count ?? 0

    // Get audit log count using COUNT(*)
    const auditCountResult = db.select({ count: sql<number>`count(*)` }).from(schema.auditLogs).get()
    const auditCount = auditCountResult?.count ?? 0

    checks.push({
      name: 'database',
      status: 'ok',
      latency: Date.now() - dbStart,
      details: {
        users: userCount,
        auditLogs: auditCount
      }
    })
  } catch (error: unknown) {
    overallStatus = 'unhealthy'
    checks.push({
      name: 'database',
      status: 'error',
      message: error instanceof Error ? error.message : 'Database connection failed'
    })
  }

  // Runtime RAM check. Prefer cgroup limits in containers; fall back to host memory.
  const ramStats = getCgroupMemoryStats()
  const totalRamMB = Math.round(ramStats.totalBytes / 1024 / 1024)
  const freeRamMB = Math.round(ramStats.freeBytes / 1024 / 1024)
  const usedRamMB = Math.round(ramStats.usedBytes / 1024 / 1024)
  const ramPercentage = totalRamMB > 0 ? Math.round((usedRamMB / totalRamMB) * 100) : 0
  const ramStatus = getPercentageStatus(ramPercentage)
  overallStatus = setOverallStatus(overallStatus, ramStatus)
  checks.push({
    name: 'ram',
    status: ramStatus,
    details: {
      scope: ramStats.scope,
      percentage: ramPercentage,
      usedMB: usedRamMB,
      totalMB: totalRamMB,
      freeMB: freeRamMB
    }
  })

  // Node.js heap check, useful to distinguish app memory from host RAM.
  const memUsage = process.memoryUsage()
  const heapStats = getHeapStatistics()
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
  const heapLimitMB = Math.round(heapStats.heap_size_limit / 1024 / 1024)
  const nodeHeapPercentage = heapLimitMB > 0 ? Math.round((heapUsedMB / heapLimitMB) * 100) : 0
  const nodeHeapStatus = getPercentageStatus(nodeHeapPercentage)
  overallStatus = setOverallStatus(overallStatus, nodeHeapStatus)
  checks.push({
    name: 'nodeHeap',
    status: nodeHeapStatus,
    details: {
      scope: 'process',
      percentage: nodeHeapPercentage,
      usedMB: heapUsedMB,
      totalMB: heapLimitMB,
      allocatedMB: heapTotalMB,
      rssMB: Math.round(memUsage.rss / 1024 / 1024),
      externalMB: Math.round(memUsage.external / 1024 / 1024)
    }
  })

  const diskChecks = await getDiskChecks()
  for (const diskCheck of diskChecks) {
    overallStatus = setOverallStatus(overallStatus, diskCheck.status)
    checks.push(diskCheck)
  }

  // Log buffer check
  const bufferStats = getBufferStats()
  checks.push({
    name: 'logBuffer',
    status: 'ok',
    details: {
      scope: 'process',
      entries: bufferStats.size,
      maxEntries: bufferStats.maxSize,
      oldestEntry: bufferStats.oldestEntry
    }
  })

  const cpuCheck = await getCpuCheck()
  overallStatus = setOverallStatus(overallStatus, cpuCheck.status)
  checks.push(cpuCheck)

  // Build response
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: runtimeConfig.appVersion,
    appVersion: runtimeConfig.appVersion,
    buildTimestamp: runtimeConfig.buildTimestamp,
    buildVersion: runtimeConfig.buildVersion,
    buildSha: runtimeConfig.buildSha,
    buildBranch: runtimeConfig.buildBranch,
    buildCommitMessage: runtimeConfig.buildCommitMessage,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    checks,
    responseTime: Date.now() - startTime
  }
}

export default defineEventHandler(async event => {
  const user = event.context.user as RbacUser | undefined
  await requireAdminSectionAccess(user, 'health')

  return {
    success: true,
    data: await getAdminHealthData(event)
  }
})
