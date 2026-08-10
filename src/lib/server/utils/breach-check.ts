/**
 * HIBP Breach Check (optional — audit N-4)
 *
 * Checks a candidate password against the HaveIBeenPwned range API using
 * k-anonymity: only the first 5 hex chars of the SHA-1 hash are sent; the
 * full hash never leaves the server. Env-gated and fail-open — when disabled,
 * unreachable, or the API errors, the check returns "not breached" so password
 * flows never block on an external dependency.
 *
 * Env: PM_FEATURES_HIBP=true enables the check (default off).
 */
import { createHash } from 'node:crypto'

function isEnabled(): boolean {
  return process.env.PM_FEATURES_HIBP === 'true'
}

/**
 * Returns true when the password appears in known breach data.
 * Fail-open: any error or disabled state returns false.
 */
export async function isPasswordBreached(password: string): Promise<boolean> {
  if (!isEnabled()) return false

  try {
    const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase()
    const prefix = sha1.slice(0, 5)
    const suffix = sha1.slice(5)

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
      signal: AbortSignal.timeout(5000)
    })
    if (!res.ok) return false

    const body = await res.text()
    // Each line: "SUFFIX:COUNT" — match the full suffix (case-insensitive).
    for (const line of body.split('\n')) {
      const [candidate] = line.split(':')
      if (candidate && candidate.trim().toUpperCase() === suffix) {
        return true
      }
    }
    return false
  } catch {
    return false
  }
}
