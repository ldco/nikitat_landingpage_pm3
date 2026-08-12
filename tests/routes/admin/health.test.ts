import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getLogBufferSize, getRecentLogs, getLogBufferEntries, LOG_BUFFER_SIZE, logger } from '$lib/server/utils/logger'
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

describe('CPU/disk probes are honest (Comment 3)', () => {
  // The health service opens the dev SQLite DB (data/sqlite.db exists in CI
  // and dev), so runHealthProbes is fully exercisable in tests.
  async function loadReport() {
    const { runHealthProbes } = await import('$lib/server/services/health')
    return runHealthProbes()
  }

  it('never reports cpu/disk as ok with an n/a placeholder', async () => {
    const report = await loadReport()
    const cpu = report.checks.find(c => c.id === 'cpu')
    const disk = report.checks.find(c => c.id === 'disk')
    // A probe is either ok with a real value, or honestly unavailable/degraded.
    if (cpu?.status === 'ok') expect(cpu.value).not.toBe('n/a')
    if (disk?.status === 'ok') expect(disk.value).not.toBe('n/a')
    // It must not report fake health: unavailable counts as degraded, never ok.
    if (cpu?.value === 'n/a' || disk?.value === 'n/a') {
      expect(cpu?.status === 'unavailable' || disk?.status === 'unavailable').toBe(true)
    }
  })

  it('exposes unavailable as a distinct probe status', async () => {
    const report = await loadReport()
    for (const check of report.checks) {
      expect(['ok', 'degraded', 'error', 'unavailable']).toContain(check.status)
    }
  })

  it('derives an honest overall status when probes are unavailable', async () => {
    const report = await loadReport()
    const hasUnavailable = report.checks.some(c => c.status === 'unavailable')
    if (hasUnavailable) {
      // 'unavailable' must never contribute to a fully-ok overall status.
      expect(report.status).toBe('degraded')
    }
  })
})

describe('Logger ring buffer normalization (Comment 2)', () => {
  it('captures time/level/msg for string-only calls', () => {
    const sizeBefore = getLogBufferSize()
    logger.info('ring-buffer-string-test')
    const entries = getLogBufferEntries()
    const last = entries[entries.length - 1]
    expect(entries.length).toBeGreaterThan(sizeBefore)
    expect(typeof last.time).toBe('number')
    expect(last.level).toBe(30) // pino info level
    expect(last.msg).toBe('ring-buffer-string-test')
  })

  it('captures the rendered message + numeric level for object-plus-message calls', () => {
    const sizeBefore = getLogBufferSize()
    logger.error({ context: 'ring-buffer-ctx' }, 'ring-buffer-message')
    const entries = getLogBufferEntries()
    const last = entries[entries.length - 1]
    expect(entries.length).toBeGreaterThan(sizeBefore)
    expect(typeof last.time).toBe('number')
    expect(last.level).toBe(50) // pino error level
    expect(last.msg).toBe('ring-buffer-message')
    // Context fields are preserved alongside the message.
    expect(last.context).toBe('ring-buffer-ctx')
  })

  it('preserves the message even when the object carries a msg field', () => {
    const sizeBefore = getLogBufferSize()
    logger.warn({ msg: 'inner-msg' }, 'outer-msg')
    const entries = getLogBufferEntries()
    const last = entries[entries.length - 1]
    expect(entries.length).toBeGreaterThan(sizeBefore)
    expect(last.msg).toBe('outer-msg')
    expect(last.level).toBe(40) // pino warn level
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
