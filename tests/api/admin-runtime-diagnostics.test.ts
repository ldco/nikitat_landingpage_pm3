/**
 * Admin runtime diagnostics API tests
 *
 * Covers Docker-first health, monitoring, and terminal contracts.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import { $fetch } from '@nuxt/test-utils/e2e'
import { getDatabaseDiskPathFromUrl } from '../../server/utils/admin-health-runtime'
import { loginAsMaster, unwrapApiEnvelope, type ApiSuccessEnvelope } from '../utils/helpers'
import { setupApiTest, waitForApiServer } from '../utils/api-test-setup'

interface HealthCheck {
  name: string
  status: 'ok' | 'warning' | 'error'
  latency?: number
  details?: Record<string, unknown>
}

interface HealthData {
  status: 'ok' | 'degraded' | 'unhealthy'
  timestamp: string
  checks: HealthCheck[]
  responseTime: number
}

interface MonitoringSummary {
  available: boolean
  source: string
  timestamp: string
  metrics: Array<{
    id: string
    status: 'ok' | 'warning' | 'error' | 'unavailable'
    value: number | null
    points: Array<{ timestamp: number; value: number }>
  }>
}

interface TerminalCommandOption {
  command: string
  labelKey: string
}

interface TerminalCommandResult {
  command: string
  output: string
  exitCode: number
  durationMs: number
  startedAt: string
}

interface FetchError {
  statusCode?: number
}

describe('Admin runtime diagnostics', async () => {
  await setupApiTest(43109)

  beforeAll(async () => {
    await waitForApiServer(43109)
  })

  it('GET /api/admin/health returns scoped runtime checks', async () => {
    const { headers } = await loginAsMaster()
    const response = await $fetch<ApiSuccessEnvelope<HealthData>>('/api/admin/health', { headers })
    const data = unwrapApiEnvelope(response)

    expect(['ok', 'degraded', 'unhealthy']).toContain(data.status)
    expect(typeof data.timestamp).toBe('string')
    expect(typeof data.responseTime).toBe('number')
    expect(Array.isArray(data.checks)).toBe(true)

    const ram = data.checks.find(check => check.name === 'ram')
    const cpu = data.checks.find(check => check.name === 'cpu')
    const diskChecks = data.checks.filter(check => check.name.startsWith('disk'))

    expect(ram?.details?.scope).toEqual(expect.stringMatching(/^(container|host)$/))
    expect(cpu?.details?.scope).toEqual(expect.stringMatching(/^(container|host)$/))
    expect(diskChecks.length).toBeGreaterThan(0)
    expect(diskChecks.every(check => check.details?.scope === 'runtimePath')).toBe(true)
  })

  it('detects database disk paths from file URLs and plain absolute DATABASE_URL values', async () => {
    expect(getDatabaseDiskPathFromUrl('file:/app/data/sqlite.db')).toBe('/app/data')
    expect(getDatabaseDiskPathFromUrl('/app/data/sqlite.db')).toBe('/app/data')
    expect(getDatabaseDiskPathFromUrl('data/sqlite.db')).toBeNull()
  })

  it('GET /api/admin/monitoring/summary returns the monitoring contract', async () => {
    const { headers } = await loginAsMaster()
    const response = await $fetch<ApiSuccessEnvelope<MonitoringSummary>>('/api/admin/monitoring/summary', { headers })
    const data = unwrapApiEnvelope(response)

    expect(typeof data.available).toBe('boolean')
    expect(typeof data.source).toBe('string')
    expect(typeof data.timestamp).toBe('string')
    expect(Array.isArray(data.metrics)).toBe(true)
  })

  it('GET /api/admin/terminal/commands exposes Docker-first safe commands only', async () => {
    const { headers } = await loginAsMaster()
    const response = await $fetch<ApiSuccessEnvelope<{ commands: TerminalCommandOption[] }>>(
      '/api/admin/terminal/commands',
      { headers }
    )
    const data = unwrapApiEnvelope(response)
    const commands = data.commands.map(option => option.command)

    expect(commands).toContain('process')
    expect(commands).toContain('cat /proc/self/cgroup')
    expect(commands).toContain('df -h . /app/data /app/uploads')
    expect(commands.some(command => command.includes('systemctl'))).toBe(false)
    expect(commands.some(command => command.includes('puppetmaster-app'))).toBe(false)
  })

  it('POST /api/admin/terminal executes allowed commands and rejects deprecated systemd commands', async () => {
    const { headers } = await loginAsMaster()
    const response = await $fetch<ApiSuccessEnvelope<TerminalCommandResult>>('/api/admin/terminal', {
      method: 'POST',
      headers,
      body: { command: 'help' }
    })
    const result = unwrapApiEnvelope(response)

    expect(result.command).toBe('help')
    expect(result.exitCode).toBe(0)
    expect(result.output).toContain('Allowed read-only diagnostics commands')
    expect(result.output).not.toContain('systemctl')

    try {
      await $fetch('/api/admin/terminal', {
        method: 'POST',
        headers,
        body: { command: 'systemctl status puppetmaster-app --no-pager' }
      })
      expect.fail('Deprecated systemd terminal command should be rejected')
    } catch (error: unknown) {
      expect((error as FetchError).statusCode).toBe(400)
    }
  })
})
