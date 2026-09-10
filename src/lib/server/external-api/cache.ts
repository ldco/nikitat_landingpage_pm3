/**
 * External API — TTL cache (GET-only responses)
 *
 * In-memory Map with per-entry expiry and periodic cleanup. GET responses are
 * cached by full URL; prefix invalidation clears a resource family. Redis-ready
 * by design: this class is the memory implementation of the cache seam — a
 * distributed variant would implement the same get/set/invalidatePrefix shape.
 */

interface Entry<T> {
  value: T
  expiresAt: number
}

export class TtlCache<T> {
  readonly defaultTtlMs: number
  private readonly store = new Map<string, Entry<T>>()

  constructor(defaultTtlMs = 0) {
    this.defaultTtlMs = defaultTtlMs
    // Periodic cleanup of expired entries (every 5 min).
    setInterval(() => this.sweep(), 5 * 60 * 1000).unref()
  }

  get<V = T>(key: string): V | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key)
      return null
    }
    return entry.value as unknown as V
  }

  set(key: string, value: T, ttlMs = this.defaultTtlMs): void {
    if (ttlMs <= 0) return // TTL 0 = no caching
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  /** Clear every entry whose key starts with the prefix (resource family). */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key)
    }
  }

  clear(): void {
    this.store.clear()
  }

  getCacheSize(): number {
    return this.store.size
  }

  private sweep(): void {
    const now = Date.now()
    for (const [key, entry] of this.store) {
      if (entry.expiresAt < now) this.store.delete(key)
    }
  }
}
