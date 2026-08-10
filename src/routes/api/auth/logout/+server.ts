import type { RequestEvent } from '@sveltejs/kit'
import { z } from 'zod'
import { jsonSuccess } from '$lib/server/utils/api'
import { deleteSession } from '$lib/server/auth/session'
import { audit } from '$lib/server/audit'
import { getClientIp } from '$lib/server/security/rateLimit'

// Rule C.10: mutations validate input with Zod. Logout carries no payload —
// accept an empty/absent body and reject anything unexpected.
const logoutBodySchema = z.object({}).optional()

export async function POST(event: RequestEvent) {
  const body = await event.request.json().catch(() => undefined)
  const parsed = logoutBodySchema.safeParse(body)
  if (!parsed.success) return new Response(JSON.stringify({ success: false, error: { code: 'VALIDATION', message: 'Unexpected body' } }), { status: 400, headers: { 'content-type': 'application/json' } })

  const sessionId = event.cookies.get('pm-session')
  if (sessionId) {
    deleteSession(sessionId)
    event.cookies.delete('pm-session', { path: '/' })
  }

  const user = event.locals.user
  if (user) {
    const ip = getClientIp(event)
    const ua = event.request.headers.get('user-agent')
    audit.logout(ip, ua, user.id)
  }

  return new Response(JSON.stringify(jsonSuccess({ message: 'auth.loggedOut' })), {
    headers: { 'content-type': 'application/json' }
  })
}
