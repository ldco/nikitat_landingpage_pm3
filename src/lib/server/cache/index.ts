/**
 * Cache Store — shared key/value TTL seam for distributed cache needs.
 *
 * Two backends behind ONE async interface:
 *   - MemoryCacheBackend (default): per-process Map with per-key expiry.
 *   - RedisCacheBackend (optional): shared TTL store when REDIS_URL is set.
 *
 * Resolver `getCacheBackend()` fails closed to memory — a missing/unreachable
 * Redis never breaks the cold path.
 *
 * NOTE on the content/translation caches: those stay per-process Maps by
 * design. They are already cross-process self-healing via the MAX(updated_at)
 * freshness probe (content-cache.ts/translations-cache.ts), and the framework
 * is a single-writer SQLite architecture — a Redis read-through tier would add
 * latency with no correctness gain. This seam is the reusable primitive for
 * genuinely shared state (rate limiting, future multi-instance caches).
 */
import { getRedisClient, type RedisLike } from './redis-client'

export { getRedisClient, resetRedisClient, type RedisLike } from './redis-client'

export interface CacheBackend {
  get(key: string): Promise<string | null>
  /** Store for ttlMs; a non-positive ttl deletes the key. */
  set(key: string, value: string, ttlMs: number): Promise<void>
  del(key: string): Promise<void>
}

// ── Memory backend ───────────────────────────────────────────────────────────

interface MemEntry {
  value: string
  expiresAt: number
}

export class MemoryCacheBackend implements CacheBackend {
  private readonly store = new Map<string, MemEntry>()

  constructor() {
    setInterval(() => this.sweep(), 5 * 60 * 1000).unref()
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  async set(key: string, value: string, ttlMs: number): Promise<void> {
    if (ttlMs <= 0) {
      this.store.delete(key)
      return
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  async del(key: string): Promise<void> {
    this.store.delete(key)
  }

  size(): number {
    return this.store.size
  }

  private sweep(): void {
    const now = Date.now()
    for (const [key, entry] of this.store) {
      if (entry.expiresAt < now) this.store.delete(key)
    }
  }
}

// ── Redis backend ────────────────────────────────────────────────────────────

export class RedisCacheBackend implements CacheBackend {
  constructor(
    private readonly client: RedisLike,
    private readonly keyPrefix: string
  ) {}

  private key(raw: string): string {
    return `${this.keyPrefix}${raw}`
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(this.key(key))
  }

  async set(key: string, value: string, ttlMs: number): Promise<void> {
    if (ttlMs <= 0) {
      await this.client.del(this.key(key))
      return
    }
    await this.client.set(this.key(key), value, 'PX', ttlMs)
  }

  async del(key: string): Promise<void> {
    await this.client.del(this.key(key))
  }
}

// ── Resolver ─────────────────────────────────────────────────────────────────

export type CacheKind = 'content' | 'translations' | 'external-api'

function defaultPrefix(kind: CacheKind): string {
  const base = process.env.REDIS_PREFIX || 'pm-cache:'
  return `${base}${kind}:`
}

let sharedBackends = new Map<CacheKind, Promise<CacheBackend>>()

async function buildBackend(kind: CacheKind): Promise<CacheBackend> {
  const client = await getRedisClient()
  if (!client) return new MemoryCacheBackend()
  return new RedisCacheBackend(client, defaultPrefix(kind))
}

/** Resolve the active cache backend for a kind (memory unless REDIS_URL set). */
export function getCacheBackend(kind: CacheKind): Promise<CacheBackend> {
  let backend = sharedBackends.get(kind)
  if (!backend) {
    backend = buildBackend(kind)
    sharedBackends.set(kind, backend)
  }
  return backend
}

/** Test hook: clear the backend cache between cases. */
export function resetCacheBackends(): void {
  sharedBackends = new Map()
}
