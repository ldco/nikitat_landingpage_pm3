import { jsonSuccess } from '$lib/server/utils/api'
import type { RequestEvent } from '@sveltejs/kit'

export function GET(_event: RequestEvent) {
  return new Response(JSON.stringify(jsonSuccess({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })), {
    headers: { 'content-type': 'application/json' }
  })
}
