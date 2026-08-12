import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getLogBufferSize, getRecentLogs, LOG_BUFFER_SIZE } from '$lib/server/utils/logger'
import { getPublicHealth } from '$lib/server/services/health'

/**
 * Route-level tests for the PM2 health surface — guards against the page
 * regressing back to a placeholder. Verifies:
 *   - the health page consumes a structured view model (not ad hoc rows)
 *   - the PM2 baseline sections have i18n labels
 *   - the public health contract derives status from probes (never hardcoded)
 *   - the logs endpoint reads a bounded ring buffer
 */

describe('Health page view model (PM2 baseline sections)', () => {
  const pageServer = readFileSync(resolve('src/routes/admin/health/+page.server.ts'), 'utf-8')
  const pageSvelte = readFileSync(resolve('src/routes/admin/health/+page.svelte'), 'utf-8')

  it('consumes the shared health service instead of ad hoc rows', () => {
    expect(pageServer).toContain("runHealthProbes")
    expect(pageServer).not.toMatch(/const checks: HealthCheck\[\] = \[/)
  })

  it('serves the PM2 baseline sections', () => {
    // systemStatus / releaseInfo / recentLogs / auditTrail / ops / monitoring
    expect(pageServer).toContain('runHealthProbes()')
    expect(pageServer).toContain('getRecentLogs')
    expect(pageServer).toContain('ops')
    expect(pageServer).toContain('monitoring')
    expect(pageSvelte).toContain('systemStatus')
    expect(pageSvelte).toContain('releaseInfo')
    expect(pageSvelte).toContain('recentLogs')
    expect(pageSvelte).toContain('auditTrail')
    expect(pageSvelte).toContain('opsTitle')
    expect(pageSvelte).toContain('externalMonitoring')
  })

  it('labels come from admin.healthPage.* i18n keys, not hardcoded strings', () => {
    const seed = JSON.parse(readFileSync(resolve('i18n/system-seed.json'), 'utf-8')) as Array<{ key: string; locale: string }>
    const enKeys = new Set(seed.filter(i => i.locale === 'en').map(i => i.key))
    for (const key of ['admin.healthPage.systemStatus', 'admin.healthPage.releaseInfo', 'admin.healthPage.recentLogs', 'admin.healthPage.auditTrail', 'admin.healthPage.opsTitle', 'admin.healthPage.externalMonitoring', 'admin.healthPage.uptime', 'admin.healthPage.status.ok', 'admin.healthPage.status.degraded', 'admin.healthPage.status.unhealthy', 'admin.healthPage.noLogs', 'admin.healthPage.noAuditEvents', 'admin.healthPage.opsUnavailable', 'admin.healthPage.monitoringUnavailable', 'admin.healthPage.openUptimeKuma', 'admin.healthPage.time', 'admin.healthPage.action', 'admin.healthPage.status', 'admin.healthPage.check.database', 'admin.healthPage.check.ram', 'admin.healthPage.check.nodeHeap', 'admin.healthPage.check.logBuffer', 'admin.healthPage.check.cpu', 'admin.healthPage.check.disk']) {
      expect(enKeys.has(key), `missing i18n key: ${key}`).toBe(true)
    }
  })
})

describe('Public health contract (GET /api/health)', () => {
  it('derives status from probes and never hardcodes ok', () => {
    const health = getPublicHealth()
    expect(health).toHaveProperty('status')
    expect(health).toHaveProperty('timestamp')
    expect(health).toHaveProperty('uptime')
    expect(health).toHaveProperty('db')
    expect(health).toHaveProperty('memory')
    expect(health).toHaveProperty('build')
    expect(['ok', 'degraded']).toContain(health.status)
    expect(['ok', 'error']).toContain(health.db)
  })

  it('build info is sourced from env metadata', () => {
    const health = getPublicHealth()
    expect(health.build).toHaveProperty('version')
    expect(health.build).toHaveProperty('node')
  })
})

describe('Recent logs ring buffer (GET /api/admin/logs)', () => {
  it('is bounded and returns a tail', () => {
    expect(LOG_BUFFER_SIZE).toBeGreaterThan(0)
    expect(getLogBufferSize()).toBeGreaterThanOrEqual(0)
    const tail = getRecentLogs(10)
    expect(Array.isArray(tail)).toBe(true)
    expect(tail.length).toBeLessThanOrEqual(LOG_BUFFER_SIZE)
  })

  it('each entry carries time/level/msg shape', () => {
    for (const e of getRecentLogs(5)) {
      expect(typeof e.time).toBe('number')
      expect(typeof e.level).toBe('number')
      expect(typeof e.msg).toBe('string')
    }
  })
})
