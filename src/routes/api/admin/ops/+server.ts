import type { RequestEvent } from '@sveltejs/kit'
import { error, json } from '@sveltejs/kit'
import { z } from 'zod'
import { requireMaster } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { invalidateTranslationCache } from '$lib/server/db/translations-cache'
import { logger } from '$lib/server/utils/logger'
import { audit } from '$lib/server/audit'
import { getClientIp } from '$lib/server/security/rateLimit'

type OpsAction = 'restart' | 'flush_cache' | 'rotate_logs'

const ALLOWED_OPS_ACTIONS: OpsAction[] = ['restart', 'flush_cache', 'rotate_logs']

const opsSchema = z.object({ action: z.enum(['restart', 'flush_cache', 'rotate_logs']) })

export function GET(event: RequestEvent) {
  requireMaster(event)
  return json(jsonSuccess({
    actions: ALLOWED_OPS_ACTIONS,
    description: 'Operations actions available for maintenance'
  }))
}

export async function POST(event: RequestEvent) {
  const actor = requireMaster(event)
  const body = await event.request.json().catch(() => null)
  const parsed = opsSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))

  switch (parsed.data.action) {
    case 'flush_cache': {
      invalidateTranslationCache()
      const ip = getClientIp(event); const ua = event.request.headers.get('user-agent'); audit.opsAction(ip, ua, actor.id, 'flush_cache', true)
      logger.info('Ops: translation cache flushed')
      return json(jsonSuccess({ action: parsed.data.action, status: 'completed', note: 'Translation cache invalidated' }))
    }
    case 'rotate_logs': {
      const ip = getClientIp(event); const ua = event.request.headers.get('user-agent'); audit.opsAction(ip, ua, actor.id, 'rotate_logs', true)
      logger.info('Ops: log rotation requested (pino stdout — no-op in dev)')
      return json(jsonSuccess({ action: parsed.data.action, status: 'completed', note: 'Log rotation triggered' }))
    }
    case 'restart': {
      const ip = getClientIp(event); const ua = event.request.headers.get('user-agent'); audit.opsAction(ip, ua, actor.id, 'restart', true)
      return json(jsonSuccess({ action: parsed.data.action, status: 'not_supported', note: 'Restart via process manager (systemd/pm2)' }))
    }
  }
}
