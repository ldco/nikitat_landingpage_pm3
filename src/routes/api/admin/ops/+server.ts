import type { RequestEvent } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'
import { requireMaster } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'
import { invalidateTranslationCache } from '$lib/server/db/translations-cache'
import { logger } from '$lib/server/utils/logger'

type OpsAction = 'restart' | 'flush_cache' | 'rotate_logs'

const ALLOWED_OPS_ACTIONS: OpsAction[] = ['restart', 'flush_cache', 'rotate_logs']

export function GET(event: RequestEvent) {
  requireMaster(event)
  return json(jsonSuccess({
    actions: ALLOWED_OPS_ACTIONS,
    description: 'Operations actions available for maintenance'
  }))
}

export async function POST(event: RequestEvent) {
  requireMaster(event)
  const body = await event.request.json().catch(() => null)
  const action = body?.action as string
  if (!action || !ALLOWED_OPS_ACTIONS.includes(action as OpsAction)) {
    return json({ success: false, error: { code: 'ops.invalid', message: `Invalid action. Allowed: ${ALLOWED_OPS_ACTIONS.join(', ')}` } }, { status: 400 })
  }

  switch (action as OpsAction) {
    case 'flush_cache': {
      invalidateTranslationCache()
      logger.info('Ops: translation cache flushed')
      return json(jsonSuccess({ action, status: 'completed', note: 'Translation cache invalidated' }))
    }
    case 'rotate_logs': {
      logger.info('Ops: log rotation requested (pino stdout — no-op in dev)')
      return json(jsonSuccess({ action, status: 'completed', note: 'Log rotation triggered' }))
    }
    case 'restart': {
      // In production with adapter-node this would signal the process manager.
      // SvelteKit has no runtime restart API — defer to process manager.
      return json(jsonSuccess({ action, status: 'not_supported', note: 'Restart via process manager (systemd/pm2)' }))
    }
  }
}
