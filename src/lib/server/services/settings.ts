/**
 * Settings Service — Typed queries for the settings key-value table
 *
 * Owns the shared settings queries used by:
 *   - Public /api/settings (filtered to non-sensitive keys)
 *   - Admin settings list / update
 *   - Telegram/email integration reads
 */
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'

/**
 * Keys that must never be exposed to unauthenticated clients.
 * Bot tokens, chat IDs, analytics tracking IDs, verification codes,
 * and any integration credential.
 */
const SENSITIVE_KEY_PATTERNS: RegExp[] = [
  /token/i,
  /secret/i,
  /password/i,
  /chatId/i,
  /pixel/i
]

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some(pattern => pattern.test(key))
}

/** Public settings map — excludes sensitive keys. */
export function getPublicSettings(): Record<string, string | null> {
  const db = useDatabase()
  const allSettings = db.select({
    key: schema.settings.key,
    value: schema.settings.value
  }).from(schema.settings).all()

  const map: Record<string, string | null> = {}
  for (const s of allSettings) {
    if (!isSensitiveKey(s.key)) {
      map[s.key] = s.value
    }
  }
  return map
}

/** Full settings map (admin only — caller must enforce auth). */
export function getAllSettings(): Array<{ key: string; value: string | null; type: 'string' | 'number' | 'boolean' | 'json'; group: string | null }> {
  const db = useDatabase()
  return db.select({
    key: schema.settings.key,
    value: schema.settings.value,
    type: schema.settings.type,
    group: schema.settings.group
  }).from(schema.settings).all()
}

/** Single setting value by key (integration reads, e.g. telegram token). */
export function getSetting(key: string): string | null {
  const db = useDatabase()
  const row = db.select({ value: schema.settings.value })
    .from(schema.settings)
    .where(eq(schema.settings.key, key))
    .get()
  return row?.value ?? null
}

/** Upsert a single setting. */
export function setSetting(key: string, value: string, type: 'string' | 'number' | 'boolean' | 'json' = 'string', group = 'general') {
  const db = useDatabase()
  const existing = db.select({ id: schema.settings.id })
    .from(schema.settings)
    .where(eq(schema.settings.key, key))
    .get()
  if (existing) {
    db.update(schema.settings).set({ value, type, group, updatedAt: new Date() })
      .where(eq(schema.settings.id, existing.id))
      .run()
  } else {
    db.insert(schema.settings).values({ key, value, type, group }).run()
  }
}
