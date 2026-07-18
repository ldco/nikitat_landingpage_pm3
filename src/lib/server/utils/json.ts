/**
 * Safe JSON parse — returns fallback on failure
 */
export function safeJsonParse<T = unknown>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}
