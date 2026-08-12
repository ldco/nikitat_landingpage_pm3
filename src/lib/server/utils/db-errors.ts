/**
 * Database Error Helpers — map unique-constraint failures to field errors.
 *
 * better-sqlite3 throws a SqliteError with `code` `SQLITE_CONSTRAINT_UNIQUE`
 * when a UNIQUE index/constraint is violated (message contains
 * "UNIQUE constraint failed"). Helpers here centralize detection so CRUD
 * handlers can return actionable 400 responses instead of leaking a 500.
 */

/** Does this error come from a unique-constraint violation? */
export function isUniqueConstraintError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const code = (err as { code?: string }).code ?? ''
  return code === 'SQLITE_CONSTRAINT_UNIQUE'
    || code === 'SQLITE_CONSTRAINT'
    || /UNIQUE constraint failed/i.test(err.message)
}

/**
 * Extract the offending column from a unique-constraint message.
 * Example message: "UNIQUE constraint failed: faq_items.slug" → "slug"
 */
export function uniqueConstraintColumn(err: unknown): string {
  const msg = err instanceof Error ? err.message : ''
  const match = msg.match(/UNIQUE constraint failed:\s*[\w.]+\.(\w+)/)
  return match?.[1] ?? ''
}

/**
 * Build a Zod-style fieldErrors record from a unique-constraint failure.
 * `label` is the i18n key used as the error message for the offending field.
 */
export function uniqueConstraintFieldErrors(
  err: unknown,
  defaults: Array<{ column: string; label: string }>
): Record<string, string[]> | null {
  if (!isUniqueConstraintError(err)) return null
  const column = uniqueConstraintColumn(err)
  const match = defaults.find(d => d.column === column)
  if (match) {
    return { [match.column]: [match.label] }
  }
  // Fallback: point at the first candidate column — the constraint message
  // sometimes names the index rather than a single column.
  const first = defaults[0]
  return first ? { [first.column]: [first.label] } : null
}
