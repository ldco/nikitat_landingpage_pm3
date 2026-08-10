/**
 * Rate Limiting — In-Memory Token Bucket
 *
 * IP-based rate limiting for API endpoints.
 * Uses a simple Map-based store. For multi-instance deploys, swap in Redis.
 * Limiter instances are per-process (not shared across instances) — see
 * docs/architecture notes on the in-memory limitation (audit N-2).
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

export function createRateLimiter(limit: number, windowMs: number, _prefix?: string) {
  const store = new Map<string, RateLimitEntry>()

  // Periodic cleanup of expired entries (every 5 min)
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key)
    }
  }, 5 * 60 * 1000).unref()

  function check(key: string): boolean {
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || entry.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + windowMs })
      return true
    }

    if (entry.count >= limit) return false

    entry.count++
    return true
  }

  function remaining(key: string): number {
    const now = Date.now()
    const entry = store.get(key)
    if (!entry || entry.resetAt < now) return limit
    return Math.max(0, limit - entry.count)
  }

  function reset(key: string): void {
    store.delete(key)
  }

  function clear(): void {
    store.clear()
  }

  return { check, remaining, reset, clear }
}

/**
 * Resolve the client IP for rate limiting (audit I-7).
 *
 * Fail-closed: forwarded headers (X-Forwarded-For / X-Real-IP) are trusted
 * ONLY when PM_TRUST_PROXY is explicitly enabled — otherwise any client can
 * spoof them to bypass per-IP limits. When not behind a trusted proxy, the
 * socket remote address is used via SvelteKit's event.getClientAddress()
 * (adapter-node resolves it from the TCP connection).
 *
 * Deploy note: set PM_TRUST_PROXY=true in the running container only when
 * behind a trusted reverse proxy that strips client-supplied forwarding
 * headers (the PM deploy stack terminates TLS at Traefik).
 */
export function getClientIp(
  event: { getClientAddress(): string; request: Request },
  trustProxy = process.env.PM_TRUST_PROXY === 'true'
): string {
  if (trustProxy) {
    const forwardedFor = event.request.headers.get('x-forwarded-for')
    if (forwardedFor) {
      const ip = forwardedFor.split(',')[0]?.trim()
      if (ip) return ip
    }

    const realIp = event.request.headers.get('x-real-ip')
    if (realIp) return realIp
  }

  try {
    return event.getClientAddress()
  } catch {
    return 'unknown'
  }
}

// Pre-configured limiters
export const loginRateLimiter = createRateLimiter(5, 15 * 60 * 1000, 'login')
export const contactRateLimiter = createRateLimiter(5, 60 * 60 * 1000, 'contact')
export const twoFactorSetupRateLimiter = createRateLimiter(10, 60 * 60 * 1000, '2fa-setup')
export const twoFactorVerifyRateLimiter = createRateLimiter(5, 15 * 60 * 1000, '2fa-verify')
export const changePasswordRateLimiter = createRateLimiter(5, 15 * 60 * 1000, 'change-password')
// audit N-5: upload routes (admin-only) — per-IP cap to bound abuse.
export const uploadRateLimiter = createRateLimiter(20, 10 * 60 * 1000, 'upload')
