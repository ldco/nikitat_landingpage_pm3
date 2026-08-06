import type { RequestEvent } from '@sveltejs/kit'
import { jsonSuccess } from '$lib/server/utils/api'
import { deleteSession } from '$lib/server/auth/session'
import { audit } from '$lib/server/audit'
import { getClientIp } from '$lib/server/security/rateLimit'

export async function POST(event: RequestEvent) {
  const sessionId = event.cookies.get('pm-session')
  if (sessionId) {
    deleteSession(sessionId)
    event.cookies.delete('pm-session', { path: '/' })
  }

  const user = event.locals.user
  if (user) {
    const ip = getClientIp(event.request)
    const ua = event.request.headers.get('user-agent')
    audit.logout(ip, ua, user.id)
  }

  return new Response(JSON.stringify(jsonSuccess({ message: 'auth.loggedOut' })), {
    headers: { 'content-type': 'application/json' }
  })
}
