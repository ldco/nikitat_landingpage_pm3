import { describe, it, expect } from 'vitest'
import {
  createMemoryRateLimiter,
  createRedisRateLimiter,
  getClientIp,
  getRateLimiter,
  resetRateLimiterCache,
  type RedisLike
} from '$lib/server/security/rateLimit'

/**
 * Security primitive unit tests — the rate limiter seam in isolation.
 *
 * Memory limiter: window semantics, exhaustion, reset, per-key isolation, and
 * the async interface contract. Redis limiter: exercised against an in-memory
 * fake (interface `RedisLike`) so the shared-counter logic is covered without
 * a live Redis. Client IP: proxy-trust fail-closed behavior (audit I-7).
 */

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('memory rate limiter', () => {
  it('allows up to the limit then exhausts within the window', async () => {
    const limiter = createMemoryRateLimiter(3, 60_000)
    expect(await limiter.check('a')).toBe(true)
    expect(await limiter.check('a')).toBe(true)
    expect(await limiter.check('a')).toBe(true)
    expect(await limiter.check('a')).toBe(false)
    expect(await limiter.check('a')).toBe(false)
  })

  it('isolates keys (different key, fresh window)', async () => {
    const limiter = createMemoryRateLimiter(1, 60_000)
    expect(await limiter.check('a')).toBe(true)
    expect(await limiter.check('a')).toBe(false)
    expect(await limiter.check('b')).toBe(true)
  })

  it('resets a key (drop the counter)', async () => {
    const limiter = createMemoryRateLimiter(1, 60_000)
    await limiter.check('a')
    expect(await limiter.check('a')).toBe(false)
    await limiter.reset('a')
    expect(await limiter.check('a')).toBe(true)
  })

  it('reports remaining slots', async () => {
    const limiter = createMemoryRateLimiter(3, 60_000)
    expect(await limiter.remaining('a')).toBe(3)
    await limiter.check('a')
    await limiter.check('a')
    expect(await limiter.remaining('a')).toBe(1)
    await limiter.reset('a')
    expect(await limiter.remaining('a')).toBe(3)
  })

  it('opens a fresh window after expiry', async () => {
    const limiter = createMemoryRateLimiter(1, 40)
    expect(await limiter.check('a')).toBe(true)
    expect(await limiter.check('a')).toBe(false)
    await wait(60)
    expect(await limiter.check('a')).toBe(true)
  })

  it('clear drops every counter', async () => {
    const limiter = createMemoryRateLimiter(1, 60_000)
    await limiter.check('a')
    await limiter.check('b')
    await limiter.clear()
    expect(await limiter.check('a')).toBe(true)
    expect(await limiter.check('b')).toBe(true)
  })
})

describe('redis rate limiter (shared counter, fake client)', () => {
  /** Minimal RedisLike fake: counters in a Map with expiry bookkeeping. */
  function fakeRedis(): RedisLike & { now: () => Map<string, { n: number; at: number }> } {
    const store = new Map<string, { n: number; at: number }>()
    return {
      async incr(key: string) {
        const entry = store.get(key)
        if (!entry) {
          store.set(key, { n: 1, at: Date.now() })
          return 1
        }
        entry.n += 1
        return entry.n
      },
      async pexpire(key: string) {
        // Fake ignores real expiry; tests call reset() to simulate the window.
        return store.get(key)?.at ?? 0
      },
      async get(key: string) {
        const entry = store.get(key)
        return entry ? String(entry.n) : null
      },
      async del(key: string) {
        store.delete(key)
      },
      now: () => store
    }
  }

  it('counts across the shared backend (multi-instance semantics)', async () => {
    const client = fakeRedis()
    // Two limiter instances share one backend — the whole point of Redis.
    const a = createRedisRateLimiter(2, 60_000, 'rl:test', client)
    const b = createRedisRateLimiter(2, 60_000, 'rl:test', client)

    expect(await a.check('ip-1')).toBe(true)
    expect(await b.check('ip-1')).toBe(true)
    // Third hit is seen by whichever instance answers.
    expect(await a.check('ip-1')).toBe(false)
    expect(await b.check('ip-1')).toBe(false)
  })

  it('isolates counters by key and by prefix', async () => {
    const client = fakeRedis()
    const limiter = createRedisRateLimiter(1, 60_000, 'rl:x', client)
    await limiter.check('a')
    expect(await limiter.check('a')).toBe(false)
    expect(await limiter.check('b')).toBe(true)
    const other = createRedisRateLimiter(1, 60_000, 'rl:y', client)
    expect(await other.check('a')).toBe(true) // different prefix
  })

  it('reset drops the shared counter', async () => {
    const client = fakeRedis()
    const limiter = createRedisRateLimiter(1, 60_000, 'rl:z', client)
    await limiter.check('a')
    expect(await limiter.check('a')).toBe(false)
    await limiter.reset('a')
    expect(await limiter.check('a')).toBe(true)
  })

  it('remaining reflects the shared count', async () => {
    const client = fakeRedis()
    const limiter = createRedisRateLimiter(3, 60_000, 'rl:r', client)
    expect(await limiter.remaining('a')).toBe(3)
    await limiter.check('a')
    await limiter.check('a')
    expect(await limiter.remaining('a')).toBe(1)
  })
})

describe('rate limiter resolver', () => {
  it('resolves the memory limiter when REDIS_URL is unset', async () => {
    resetRateLimiterCache()
    const before = process.env.REDIS_URL
    delete process.env.REDIS_URL
    try {
      const limiter = await getRateLimiter('login')
      expect(await limiter.check('ip-1')).toBe(true)
      // login spec: 5 allowed
      for (let i = 1; i < 5; i++) expect(await limiter.check('ip-1')).toBe(true)
      expect(await limiter.check('ip-1')).toBe(false)
    } finally {
      if (before !== undefined) process.env.REDIS_URL = before
      resetRateLimiterCache()
    }
  })
})

describe('client ip resolution (fail-closed proxy trust)', () => {
  function fakeEvent(remote: string, headers: Record<string, string>) {
    return {
      getClientAddress: () => remote,
      request: new Request('http://pm.test/api/health', { headers })
    }
  }

  it('uses the socket address when not trusting the proxy', () => {
    const ip = getClientIp(
      fakeEvent('203.0.113.9', { 'x-forwarded-for': '198.51.100.7' }),
      false
    )
    expect(ip).toBe('203.0.113.9')
  })

  it('trusts x-forwarded-for only when PM_TRUST_PROXY is on', () => {
    const ip = getClientIp(
      fakeEvent('203.0.113.9', { 'x-forwarded-for': '198.51.100.7, 10.0.0.2' }),
      true
    )
    expect(ip).toBe('198.51.100.7')
  })

  it('falls back to x-real-ip when no forwarded-for is present', () => {
    const ip = getClientIp(
      fakeEvent('203.0.113.9', { 'x-real-ip': '198.51.100.7' }),
      true
    )
    expect(ip).toBe('198.51.100.7')
  })

  it('reports unknown when getClientAddress throws and no trusted header', () => {
    const event = {
      getClientAddress: () => {
        throw new Error('no remote address')
      },
      request: new Request('http://pm.test/api/health')
    }
    expect(getClientIp(event, true)).toBe('unknown')
  })
})
