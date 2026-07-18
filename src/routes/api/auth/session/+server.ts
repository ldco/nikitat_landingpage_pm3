import type { RequestEvent } from '@sveltejs/kit'
import { jsonSuccess } from '$lib/server/utils/api'

export function GET(event: RequestEvent) {
  const user = event.locals.user || null
  return new Response(JSON.stringify(jsonSuccess({ authenticated: !!user, user })), {
    headers: { 'content-type': 'application/json' }
  })
}
