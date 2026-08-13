/**
 * System Translation Keys — the SINGLE source for the system/content split.
 *
 * System keys are developer-managed (the i18n catalog owns their values);
 * content keys (hero.*, about.*, …) are editor-managed. This prefix list is
 * the one place the classification lives so the three consumers can never
 * drift:
 *   - seed classification   (src/lib/server/db/seed-data/translations.ts)
 *   - authorization gate    (src/lib/server/services/translations.ts)
 *   - editor UI type        (src/lib/utils/translations-editor.ts)
 *
 * A key is "system" when it starts with one of these prefixes. Everything
 * else is content. Pure framework module — safe to import from client and
 * server code.
 */
export const SYSTEM_PREFIXES = [
  'admin.',
  'nav.',
  'common.',
  'auth.',
  'validation.',
  'footer.',
  'error.',
  'apiErrors.'
] as const

export function isSystemKey(key: string): boolean {
  return SYSTEM_PREFIXES.some(prefix => key.startsWith(prefix))
}

/**
 * Content namespaces hidden from the translations editor (legal docs are
 * managed from their own admin surface, not the translations screen).
 * Shared by the server-side count precomputation and the editor page, so tab
 * badges and totals can never drift.
 */
export const HIDDEN_CONTENT_NAMESPACES: ReadonlySet<string> = new Set(['legalDocuments'])

/**
 * True when the key is a VISIBLE content row in the translations editor:
 * non-system AND outside the hidden namespaces. The single shared rule behind
 * the Content/System totals (server SQL aggregates + client row counting) so
 * the editor badges and the server summary can never drift.
 */
export function isEditorVisibleKey(key: string): boolean {
  if (isSystemKey(key)) return false
  return !HIDDEN_CONTENT_NAMESPACES.has(key.split('.')[0] ?? 'root')
}
