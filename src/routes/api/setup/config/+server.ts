/**
 * GET /api/setup/config
 *
 * Returns current setup state: whether the site is configured
 * (PM_MODE !== 'unconfigured') and basic config summary.
 */
import { json } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import { PM_MODE } from '$lib/config/site'
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
  return json({
    success: true,
    data: {
      configured: PM_MODE !== 'unconfigured',
      mode: PM_MODE,
      locales: ['ru', 'en', 'fr', 'he'],
      defaultLocale: 'ru'
    }
  })
}
