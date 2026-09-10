import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  MemoryCacheBackend,
  RedisCacheBackend,
  getCacheBackend,
  resetCacheBackends,
  type CacheBackend
} from '$lib/server/cache/index'
import { resetRedisClient } from '$lib/server/cache/redis-client'

/**
 * Cache seam — memory + Redis backends and the fail-closed resolver.
 * The Redis backend is exercised against an in-memory fake so the TTL/key
 * logic is covered without a live Redis.
 */

const envSnapshot = { ...process.env } as Record<string, string | undefined>

afterEach(() => {
  process.env = { ...envSnapshot }
  resetRedisClient()
  resetCacheBackends()
  vi.restoreAllMocks()
})

/** Minimal Redis-like fake with PX expiry bookkeeping. */
function fakeRedis() {
  const store = new Map<string, { v: string; at: number }>()
  return {
    store,
    async get(key: string) {
      const e = store.get(key)
      return e ? e.v : null
    },
    async set(key: string, value: string, _mode: 'PX', ttlMs: number) {
      store.set(key, { v: value, at: Date.now() + ttlMs })
    },
    async del(key: string) {
      store.delete(key)
    }
  }
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('MemoryCacheBackend', () => {
  it('stores and reads a value', async () => {
    const cache = new MemoryCacheBackend()
    await cache.set('a', '1', 60_000)
    expect(await cache.get('a')).toBe('1')
  })

  it('expires a value after its TTL', async () => {
    const cache = new MemoryCacheBackend()
    await cache.set('a', '1', 20)
    expect(await cache.get('a')).toBe('1')
    await wait(40)
    expect(await cache.get('a')).toBeNull()
  })

  it('deletes a value', async () => {
    const cache = new MemoryCacheBackend()
    await cache.set('a', '1', 60_000)
    await cache.del('a')
    expect(await cache.get('a')).toBeNull()
  })

  it('non-positive TTL deletes instead of storing', async () => {
    const cache = new MemoryCacheBackend()
    await cache.set('a', '1', 0)
    expect(await cache.get('a')).toBeNull()
  })
})

describe('RedisCacheBackend', () => {
  function makeBackend() {
    const client = fakeRedis()
    const backend = new RedisCacheBackend(client as never, 'pm-cache:content:')
    return { client, backend }
  }

  it('stores and reads under the configured prefix', async () => {
    const { client, backend } = makeBackend()
    await backend.set('key', 'v', 60_000)
    expect(await backend.get('key')).toBe('v')
    // Raw key is namespaced — no cross-kind collisions.
    expect(client.store.has('pm-cache:content:key')).toBe(true)
  })

  it('expires a value (PX set) and deletes on non-positive TTL', async () => {
    const { client, backend } = makeBackend()
    await backend.set('a', '1', 10_000)
    const entry = client.store.get('pm-cache:content:a')
    expect(entry?.at).toBeGreaterThan(Date.now())

    await backend.set('gone', '1', 0)
    expect(client.store.has('pm-cache:content:gone')).toBe(false)
  })

  it('deletes a value', async () => {
    const { client, backend } = makeBackend()
    await backend.set('a', '1', 60_000)
    await backend.del('a')
    expect(await backend.get('a')).toBeNull()
    expect(client.store.has('pm-cache:content:a')).toBe(false)
  })
})

describe('getCacheBackend resolver', () => {
  it('fails closed to memory when REDIS_URL is unset', async () => {
    delete process.env.REDIS_URL
    const backend = await getCacheBackend('content')
    expect(backend).toBeInstanceOf(MemoryCacheBackend)
  })

  it('keeps a typed interface regardless of backend', async () => {
    delete process.env.REDIS_URL
    const backend: CacheBackend = await getCacheBackend('translations')
    await backend.set('k', 'v', 60_000)
    expect(await backend.get('k')).toBe('v')
  })
})
