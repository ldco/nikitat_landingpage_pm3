import type { RequestEvent } from '@sveltejs/kit'
import { json } from '@sveltejs/kit'
import { requireMaster } from '$lib/server/utils/admin-rbac'
import { jsonSuccess } from '$lib/server/utils/api'

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
  const actor = requireMaster(event)
  const body = await event.request.json().catch(() => null)
  const action = body?.action as string
  if (!action || !ALLOWED_OPS_ACTIONS.includes(action as OpsAction)) {
    return json({ success: false, error: { code: 'ops.invalid', message: `Invalid action. Allowed: ${ALLOWED_OPS_ACTIONS.join(', ')}` } }, { status: 400 })
  }
  return json(jsonSuccess({ action, status: 'simulated', note: 'Ops actions are not yet implemented in this version' }))
}
