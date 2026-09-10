/**
 * External API — retry policy (exponential backoff)
 *
 * Retryable failures are 5xx, 429 and network/timeout errors. 4xx client
 * errors, auth failures (401/403) and caller aborts are NOT retried — retrying
 * them only multiplies cost and latency.
 *
 * delay(attempt) = initialDelayMs * multiplier^attempt, capped at maxDelayMs.
 */

export interface RetryPolicy {
  /** Total attempts including the first (default 3). */
  maxAttempts: number
  initialDelayMs: number
  backoffMultiplier: number
  maxDelayMs: number
}

export const defaultRetryPolicy: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 250,
  backoffMultiplier: 2,
  maxDelayMs: 10_000
}

/** Is an HTTP status worth a retry? (5xx + 429; never 4xx client errors.) */
export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500
}
