import { jsonSuccess } from '$lib/server/utils/api'
import { useDatabase } from '$lib/server/db'
import { sql } from 'drizzle-orm'
import type { RequestEvent } from '@sveltejs/kit'
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

  // audit I-14 / E-9: verify DB connectivity so the health check reflects
  // more than "process is up". A DB failure returns 503 (unhealthy).
  let db: 'ok' | 'error' = 'ok'
  try {
    useDatabase().run(sql`SELECT 1 as ok`)
  } catch {
    db = 'error'
  }

  const mem = process.memoryUsage()
  const build = {
    version: process.env.APP_BUILD_VERSION || undefined,
    sha: process.env.APP_BUILD_SHA || undefined,
    timestamp: process.env.APP_BUILD_TIMESTAMP || undefined
  }

  const body = jsonSuccess({
    status: db === 'ok' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    db,
    build,
    memory: { heapUsed: mem.heapUsed, heapTotal: mem.heapTotal, rss: mem.rss }
  })

  return new Response(JSON.stringify(body), {
    status: db === 'ok' ? 200 : 503,
    headers: { 'content-type': 'application/json' }
  })
}
