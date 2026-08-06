import type { RequestEvent } from '@sveltejs/kit'
import { jsonSuccess } from '$lib/server/utils/api'
import { useDatabase, schema } from '$lib/server/db'
import { z } from 'zod'

/** GET endpoint has no query params — response validated for shape */
const querySchema = z.object({})

/**
 * Keys that must never be exposed to unauthenticated clients.
 * These include bot tokens, chat IDs, analytics tracking IDs,
 * verification codes, and any integration credential.
 */
const SENSITIVE_KEY_PATTERNS: RegExp[] = [
  /token/i,
  /secret/i,
  /password/i,
  /chatId/i,
  /pixel/i
]

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some(pattern => pattern.test(key))
}

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
  const db = useDatabase()
  const allSettings = db.select({
    key: schema.settings.key,
    value: schema.settings.value,
    type: schema.settings.type
  }).from(schema.settings).all()

  // Return as key-value map, excluding sensitive keys
  const map: Record<string, string | null> = {}
  for (const s of allSettings) {
    if (!isSensitiveKey(s.key)) {
      map[s.key] = s.value
    }
  }

  return new Response(JSON.stringify(jsonSuccess(map)), {
    headers: { 'content-type': 'application/json' }
  })
}
