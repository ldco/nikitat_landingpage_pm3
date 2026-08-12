import type { RequestEvent } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'
import { z } from 'zod'
import { requireMaster } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { invalidateTranslationCache } from '$lib/server/db/translations-cache'
import { logger } from '$lib/server/utils/logger'
import { audit } from '$lib/server/audit'
import { getClientIp } from '$lib/server/security/rateLimit'

type OpsAction = 'restart' | 'flush_cache' | 'rotate_logs' | 'db_backup' | 'db_integrity'

const ALLOWED_OPS_ACTIONS: OpsAction[] = ['restart', 'flush_cache', 'rotate_logs', 'db_backup', 'db_integrity']

const opsSchema = z.object({ action: z.enum(['restart', 'flush_cache', 'rotate_logs', 'db_backup', 'db_integrity']) })

const querySchema = z.object({
  container: z.enum(['app', 'traefik']).default('app'),
  tail: z.coerce.number().int().min(1).max(500).default(100)
})

/**
 * Ops agent configuration. The agent is an internal-only sidecar with Docker
 * socket access (scripts/ops-agent.mjs); the app reaches it over the private
 * Docker network. Gating follows .env.example: PM_OPS_AGENT_ENABLED toggles the
 * feature, and the shared token defaults to the settings encryption key.
 */
function opsAgentConfig() {
  const enabled = process.env.PM_OPS_AGENT_ENABLED === 'true'
  const port = process.env.PM_OPS_AGENT_PORT || '3010'
  const host = process.env.PM_OPS_AGENT_HOST || 'ops-agent'
  const token = process.env.PM_OPS_AGENT_TOKEN || process.env.PM_SETTINGS_ENCRYPTION_KEY || ''
  return { enabled, baseUrl: `http://${host}:${port}`, token }
}

function opsUnavailableResponse(message: string) {
  return json(
    { success: false, error: { code: 'ops.unavailable', message } },
    { status: 503 }
  )
}

async function proxyOpsGet(event: RequestEvent, path: string): Promise<Response> {
  const cfg = opsAgentConfig()
  if (!cfg.enabled || !cfg.token) {
    return opsUnavailableResponse('PM_OPS_AGENT_ENABLED / PM_OPS_AGENT_TOKEN not configured')
  }

  let res: Response
  try {
    res = await fetch(`${cfg.baseUrl}${path}`, {
      headers: { authorization: `Bearer ${cfg.token}` },
      signal: AbortSignal.timeout(5000)
    })
  } catch (e) {
    logger.warn({ err: e instanceof Error ? e.message : e }, 'ops agent unreachable')
    return opsUnavailableResponse('Ops agent unreachable')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    return opsUnavailableResponse(body?.error ?? `Ops agent error (${res.status})`)
  }
  return res
}

/**
 * GET — ops diagnostics proxy:
 *   /api/admin/ops?view=summary            → agent /summary
 *   /api/admin/ops?view=logs&container=app → agent /logs?container=app
 */
export async function GET(event: RequestEvent) {
  requireMaster(event)
  const parsed = querySchema.safeParse(Object.fromEntries(event.url.searchParams))
  if (!parsed.success) return json({ success: false, error: { code: 'validation.query', message: parsed.error.issues.map(e => e.message).join(', ') } }, { status: 400 })

  const view = event.url.searchParams.get('view') ?? 'summary'
  if (view === 'summary') {
    const proxy = await proxyOpsGet(event, '/summary')
    if (proxy.status !== 200) return proxy
    const body = await proxy.json()
    return json(jsonSuccess(body.data ?? body))
  }
  if (view === 'logs') {
    const proxy = await proxyOpsGet(event, `/logs?container=${encodeURIComponent(parsed.data.container)}&tail=${parsed.data.tail}`)
    if (proxy.status !== 200) return proxy
    const body = await proxy.json()
    return json(jsonSuccess(body.data ?? body))
  }

  return json(jsonSuccess({
    actions: ALLOWED_OPS_ACTIONS,
    description: 'Operations actions available for maintenance'
  }))
}

/**
 * POST — run a safe ops action. Local actions (flush_cache, rotate_logs) run
 * in-process; container actions (db_backup, db_integrity, restart) proxy to
 * the ops agent.
 */
export async function POST(event: RequestEvent) {
  const actor = requireMaster(event)
  const body = await event.request.json().catch(() => null)
  const parsed = opsSchema.safeParse(body)
  if (!parsed.success) return json({ success: false, error: { code: 'validation.body', message: parsed.error.issues.map(e => e.message).join(', ') } }, { status: 400 })
  const ip = getClientIp(event)
  const ua = event.request.headers.get('user-agent')

  switch (parsed.data.action) {
    case 'flush_cache': {
      invalidateTranslationCache()
      audit.opsAction(ip, ua, actor.id, 'flush_cache', true)
      logger.info('Ops: translation cache flushed')
      return json(jsonSuccess({ action: parsed.data.action, status: 'completed', note: 'Translation cache invalidated' }))
    }
    case 'rotate_logs': {
      audit.opsAction(ip, ua, actor.id, 'rotate_logs', true)
      logger.info('Ops: log rotation requested (pino stdout — no-op in dev)')
      return json(jsonSuccess({ action: parsed.data.action, status: 'completed', note: 'Log rotation triggered' }))
    }
    case 'restart':
    case 'db_backup':
    case 'db_integrity': {
      // Container-level actions proxy to the ops agent.
      const cfg = opsAgentConfig()
      if (!cfg.enabled || !cfg.token) {
        return opsUnavailableResponse('PM_OPS_AGENT_ENABLED / PM_OPS_AGENT_TOKEN not configured')
      }
      try {
        const res = await fetch(`${cfg.baseUrl}/actions`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${cfg.token}`
          },
          body: JSON.stringify({ action: parsed.data.action === 'restart' ? 'restart-app' : parsed.data.action }),
          signal: AbortSignal.timeout(15000)
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) return opsUnavailableResponse(data?.error ?? `Ops agent error (${res.status})`)
        audit.opsAction(ip, ua, actor.id, parsed.data.action, true)
        logger.info({ action: parsed.data.action }, 'Ops action completed via agent')
        return json(jsonSuccess(data.data ?? { action: parsed.data.action, status: 'completed' }))
      } catch (e) {
        logger.warn({ err: e instanceof Error ? e.message : e }, 'ops agent unreachable')
        return opsUnavailableResponse('Ops agent unreachable')
      }
    }
  }
}
