/**
 * Health Check Endpoint
 *
 * GET /api/health
 *
 * Public endpoint for:
 * - Load balancer health checks
 * - Kubernetes liveness/readiness probes
 * - Docker health checks
 * - Monitoring systems
 *
 * Returns service health status and basic diagnostics.
 */
import { sql } from 'drizzle-orm'
import { useDatabase } from '../database/client'

interface HealthCheck {
  name: string
  status: 'ok' | 'error' | 'warning'
  latency?: number
  message?: string
}

export default defineEventHandler(async event => {
  const startTime = Date.now()
  const runtimeConfig = useRuntimeConfig(event)
  const checks: HealthCheck[] = []
  let overallStatus: 'ok' | 'degraded' | 'unhealthy' = 'ok'

  // Database check
  const dbStart = Date.now()
  try {
    const db = useDatabase()
    // Backward-compatible query: validates SQLite availability without tying health to the latest table shape.
    db.get(sql`select 1 as ok`)
    checks.push({
      name: 'database',
      status: 'ok',
      latency: Date.now() - dbStart
    })
  } catch (error: unknown) {
    overallStatus = 'unhealthy'
    const message = error instanceof Error ? error.message : 'Database connection failed'
    checks.push({
      name: 'database',
      status: 'error',
      message
    })
  }

  // Memory check
  const memUsage = process.memoryUsage()
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
  const memoryThreshold = 500 // MB

  if (heapUsedMB > memoryThreshold) {
    if (overallStatus === 'ok') overallStatus = 'degraded'
    checks.push({
      name: 'memory',
      status: 'warning',
      message: `High memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB`
    })
  } else {
    checks.push({
      name: 'memory',
      status: 'ok',
      message: `${heapUsedMB}MB / ${heapTotalMB}MB`
    })
  }

  // Build response
  const response = {
    success: true,
    data: {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: runtimeConfig.appVersion,
      appVersion: runtimeConfig.appVersion,
      buildTimestamp: runtimeConfig.buildTimestamp,
      buildVersion: runtimeConfig.buildVersion,
      buildSha: runtimeConfig.buildSha,
      checks,
      responseTime: Date.now() - startTime
    }
  }

  // Set appropriate status code
  if (overallStatus === 'unhealthy') {
    setResponseStatus(event, 503)
  } else if (overallStatus === 'degraded') {
    setResponseStatus(event, 200) // Still return 200 for degraded but functional
  }

  return response
})
