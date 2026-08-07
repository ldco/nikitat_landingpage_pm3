import type { RequestEvent } from '@sveltejs/kit'
import { jsonSuccess } from '$lib/server/utils/api'
import { getPublicSettings } from '$lib/server/services/settings'
import { z } from 'zod'

const querySchema = z.object({})

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
  return new Response(JSON.stringify(jsonSuccess(getPublicSettings())), {
    headers: { 'content-type': 'application/json' }
  })
}
