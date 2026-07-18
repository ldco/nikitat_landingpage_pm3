/**
 * Rate Limiting — In-Memory Token Bucket
 *
 * IP-based rate limiting for API endpoints.
 * Uses a simple Map-based store. For multi-instance deploys, swap in Redis.
 */
import { logger } from '$lib/server/utils/logger'

interface RateLimitEntry {
  count: number
  resetAt: number
}

export function createRateLimiter(limit: number, windowMs: number, prefix = 'rl') {
  const store = new Map<string, RateLimitEntry>()
  const windowSec = Math.ceil(windowMs / 1000)

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

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const ip = forwardedFor.split(',')[0]?.trim()
    if (ip) return ip
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  return 'unknown'
}

// Pre-configured limiters
export const loginRateLimiter = createRateLimiter(5, 15 * 60 * 1000, 'login')
export const contactRateLimiter = createRateLimiter(5, 60 * 60 * 1000, 'contact')
export const twoFactorSetupRateLimiter = createRateLimiter(10, 60 * 60 * 1000, '2fa-setup')
export const twoFactorVerifyRateLimiter = createRateLimiter(5, 15 * 60 * 1000, '2fa-verify')
