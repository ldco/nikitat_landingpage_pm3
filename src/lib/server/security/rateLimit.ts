/**
 * Rate Limiting — Token Bucket (async seam, memory default + optional Redis)
 *
 * Two implementations behind ONE async `RateLimiter` interface:
 *   - Memory (default): per-process Map token bucket. Correct for the shipped
 *     single-instance SQLite architecture; identical semantics to the PM v2
 *     in-memory limiter (audit N-2 documents the per-instance limitation).
 *   - Redis (optional): shared counter across instances. Enabled ONLY when
 *     REDIS_URL is present — otherwise the framework fails closed to memory
 *     and no Redis client is ever constructed. A Redis outage at first use
 *     also fails closed to memory (logged), never to allow-all.
 *
 * The interface is async so a Redis round-trip is possible; the memory
 * implementation resolves immediately, so the cold path has no added latency.
 *
 * IP resolution (audit I-7) is unchanged: forwarded headers are trusted ONLY
 * when PM_TRUST_PROXY=true — otherwise any client can spoof them to bypass
 * per-IP limits. When not behind a trusted proxy the socket remote address is
 * used via SvelteKit's event.getClientAddress().
 */

export interface RateLimiter {
  /** Consume one slot. Returns true when allowed, false when over the limit. */
  check(key: string): Promise<boolean>
  /** Approximate slots remaining for a key (0 when over/exhausted). */
  remaining(key: string): Promise<number>
  /** Drop the counter for a key (e.g. after a successful login). */
  reset(key: string): Promise<void>
  /** Drop every counter (memory impl) — used by tests. */
  clear(): Promise<void>
}

import { getRedisClient } from '../cache/redis-client'

interface MemoryEntry {
  count: number
  resetAt: number
}

export function createMemoryRateLimiter(limit: number, windowMs: number): RateLimiter {
  const store = new Map<string, MemoryEntry>()

  // Periodic cleanup of expired entries (every 5 min)
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key)
    }
  }, 5 * 60 * 1000).unref()

  return {
    async check(key: string): Promise<boolean> {
      const now = Date.now()
      const entry = store.get(key)

      if (!entry || entry.resetAt < now) {
        store.set(key, { count: 1, resetAt: now + windowMs })
        return true
      }

      if (entry.count >= limit) return false

      entry.count++
      return true
    },

    async remaining(key: string): Promise<number> {
      const now = Date.now()
      const entry = store.get(key)
      if (!entry || entry.resetAt < now) return limit
      return Math.max(0, limit - entry.count)
    },

    async reset(key: string): Promise<void> {
      store.delete(key)
    },

    async clear(): Promise<void> {
      store.clear()
    }
  }
}

// ── Redis backend ────────────────────────────────────────────────────────────

/** Minimal async client surface shared by ioredis and test doubles. */
export interface RedisLike {
  incr(key: string): Promise<number>
  /** Set expiry in milliseconds (only meaningful right after the first INCR). */
  pexpire(key: string, ms: number): Promise<unknown>
  get(key: string): Promise<string | null>
  del(key: string): Promise<unknown>
}

export function createRedisRateLimiter(
  limit: number,
  windowMs: number,
  prefix: string,
  client: RedisLike
): RateLimiter {
  const counterKey = (key: string) => `${prefix}:${key}`

  return {
    async check(key: string): Promise<boolean> {
      const fullKey = counterKey(key)
      const count = await client.incr(fullKey)
      // First hit in a window: arm the expiry (INCR has no TTL side effects).
      if (count === 1) {
        await client.pexpire(fullKey, windowMs)
      }
      return count <= limit
    },

    async remaining(key: string): Promise<number> {
      const raw = await client.get(counterKey(key))
      const count = raw ? Number(raw) : 0
      return Math.max(0, limit - count)
    },

    async reset(key: string): Promise<void> {
      await client.del(counterKey(key))
    },

    async clear(): Promise<void> {
      // Memory-only concern; a Redis clear would need SCAN — not implemented.
      // Individual keys are reset by their callers; the limiter remains correct
      // because counters expire on their own window.
    }
  }
}

// ── Preconfigured limiters + resolver ─────────────────────────────────────────

export type RateLimiterKind =
  | 'login'
  | 'contact'
  | '2fa-setup'
  | '2fa-verify'
  | 'change-password'
  | 'upload'

const LIMITER_SPECS: Record<RateLimiterKind, { limit: number; windowMs: number }> = {
  login: { limit: 5, windowMs: 15 * 60 * 1000 },
  contact: { limit: 5, windowMs: 60 * 60 * 1000 },
  '2fa-setup': { limit: 10, windowMs: 60 * 60 * 1000 },
  '2fa-verify': { limit: 5, windowMs: 15 * 60 * 1000 },
  'change-password': { limit: 5, windowMs: 15 * 60 * 1000 },
  // audit N-5: upload routes (admin-only) — per-IP cap to bound abuse.
  upload: { limit: 20, windowMs: 10 * 60 * 1000 }
}

function redisPrefix(kind: RateLimiterKind): string {
  const base = process.env.REDIS_PREFIX || 'pm-cache:'
  return `${base}rl:${kind}`
}

// One Redis limiter per kind, built lazily and cached per process.
const sharedLimiters = new Map<RateLimiterKind, Promise<RateLimiter>>()

async function buildSharedLimiter(kind: RateLimiterKind): Promise<RateLimiter> {
  const spec = LIMITER_SPECS[kind]
  // Shared optional Redis connection (cache/redis-client) — null when REDIS_URL
  // is unset or unreachable: fail closed to the in-memory limiter.
  const client = await getRedisClient()
  if (!client) return createMemoryRateLimiter(spec.limit, spec.windowMs)
  return createRedisRateLimiter(spec.limit, spec.windowMs, redisPrefix(kind), client)
}

/**
 * Resolve the active limiter for a kind. With REDIS_URL unset this is the
 * in-memory limiter and resolves immediately; with Redis configured it is the
 * shared limiter (first resolution performs a ping, cached afterwards).
 */
export function getRateLimiter(kind: RateLimiterKind): Promise<RateLimiter> {
  let limiter = sharedLimiters.get(kind)
  if (!limiter) {
    limiter = buildSharedLimiter(kind)
    sharedLimiters.set(kind, limiter)
  }
  return limiter
}

/** Reset the shared-limiter cache (used by tests that toggle REDIS_URL). */
export function resetRateLimiterCache(): void {
  sharedLimiters.clear()
}

// ── Client IP resolution ───────────────────────────────────────────────────────

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
