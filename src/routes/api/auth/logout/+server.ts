import type { RequestEvent } from '@sveltejs/kit'
import { jsonSuccess } from '$lib/server/utils/api'
import { deleteSession } from '$lib/server/auth/session'

export async function POST(event: RequestEvent) {
  const sessionId = event.cookies.get('pm-session')
  if (sessionId) {
    deleteSession(sessionId)
    event.cookies.delete('pm-session', { path: '/' })
  }

  return new Response(JSON.stringify(jsonSuccess({ message: 'Logged out' })), {
    headers: { 'content-type': 'application/json' }
  })
}
