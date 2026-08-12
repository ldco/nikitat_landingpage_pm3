import { jsonSuccess } from '$lib/server/utils/api'
import { getPublicHealth } from '$lib/server/services/health'
import type { RequestEvent } from '@sveltejs/kit'
import { z } from 'zod'

const querySchema = z.object({})

/**
 * Public uptime health contract. The shared health service runs the database
 * probe with explicit error handling; the overall status is derived from probe
 * results (a DB failure reports 503/degraded, never a raw 500 — audit I-14/E-9).
 */
export function GET(event: RequestEvent) {
  const parsedQuery = querySchema.safeParse(Object.fromEntries(event.url.searchParams))
  if (!parsedQuery.success) {
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'validation.query', message: 'Invalid query parameters' }
    }), {
      status: 400,
      headers: { 'content-type': 'application/json' }
    })
  }

  const body = jsonSuccess(getPublicHealth())

  return new Response(JSON.stringify(body), {
    status: body.data?.status === 'ok' ? 200 : 503,
    headers: { 'content-type': 'application/json' }
  })
}
