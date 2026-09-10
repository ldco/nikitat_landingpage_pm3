/**
 * Redis client — ONE shared optional connection for the framework's distributed
 * seams (rate limiter + cache backends).
 *
 * Enabled only when REDIS_URL is present. Absent/undialable -> null (fail
 * closed to the in-memory implementations). The connection is created lazily on
 * first use and cached per process; `resetRedisClient()` exists for tests.
 *
 * ioredis is an OPTIONAL dependency: it is dynamically imported so the cold
 * path (no REDIS_URL) never loads it and never constructs a client.
 */

export interface RedisLike {
  incr(key: string): Promise<number>
  pexpire(key: string, ms: number): Promise<unknown>
  get(key: string): Promise<string | null>
  set(key: string, value: string, mode: 'PX', ttlMs: number): Promise<unknown>
  del(key: string): Promise<unknown>
  ping(): Promise<string>
}

let clientPromise: Promise<RedisLike | null> | null = null

function redisUrl(): string | undefined {
  const url = process.env.REDIS_URL
  return url && url.length > 0 ? url : undefined
}

async function connect(): Promise<RedisLike | null> {
  const url = redisUrl()
  if (!url) return null
  // Held outside the try so the catch can stop ioredis's automatic reconnect
  // loop — an abandoned client would retry the dead endpoint forever.
  let redisHandle: { disconnect(): void } | null = null
  try {
    const { default: Redis } = await import('ioredis')
    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true
    })
    redisHandle = client
    // ioredis emits 'error' on connection failures; with no listener Node
    // throws on that event and crashes the process. A post-connect Redis
    // outage must fail closed to the in-memory implementations, never crash.
    client.on('error', err => {
      console.error(
        '[redis] connection error — falling back to in-memory implementations.',
        err instanceof Error ? err.message : String(err)
      )
    })
    await client.ping()
    return client as unknown as RedisLike
  } catch (error) {
    // Fail closed: no shared backend. Individual seams log their own fallback.
    // disconnect() stops the reconnect strategy so this fires exactly once.
    redisHandle?.disconnect()
    console.error(
      '[redis] Redis unavailable — falling back to in-memory implementations.',
      error instanceof Error ? error.message : String(error)
    )
    return null
  }
}

/** Resolve the shared Redis client (null when disabled/unavailable). */
export function getRedisClient(): Promise<RedisLike | null> {
  if (!clientPromise) clientPromise = connect()
  return clientPromise
}

/** Test hook: clear the cached connection between cases. */
export function resetRedisClient(): void {
  clientPromise = null
}
