/**
 * External API — circuit breaker
 *
 * States: CLOSED (normal) -> OPEN after `failureThreshold` consecutive
 * failures; OPEN rejects immediately for `resetTimeoutMs`, then HALF_OPEN
 * allows one trial request: success closes the circuit (and resets the failure
 * count), failure opens it again. Prevents cascading failures when the
 * external API is down and stops wasting retries on a dead endpoint.
 */

export type CircuitState = 'closed' | 'open' | 'half_open'

export interface CircuitBreakerOptions {
  failureThreshold?: number
  resetTimeoutMs?: number
}

export class CircuitBreaker {
  readonly failureThreshold: number
  readonly resetTimeoutMs: number
  private state: CircuitState = 'closed'
  private failures = 0
  private openedAt = 0

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5
    this.resetTimeoutMs = options.resetTimeoutMs ?? 60_000
  }

  /** True when a request may proceed (closed, or half-open trial). */
  allowRequest(): boolean {
    if (this.state === 'closed') return true
    if (this.state === 'open') {
      if (Date.now() - this.openedAt >= this.resetTimeoutMs) {
        this.state = 'half_open'
        return true
      }
      return false
    }
    // half_open: exactly one trial request
    return true
  }

  recordSuccess(): void {
    if (this.state === 'half_open') {
      this.state = 'closed'
      this.failures = 0
    }
    // In CLOSED state a success resets the consecutive-failure counter.
    if (this.state === 'closed' && this.failures > 0) {
      this.failures = 0
    }
  }

  recordFailure(): void {
    if (this.state === 'half_open') {
      this.state = 'open'
      this.openedAt = Date.now()
      return
    }
    this.failures += 1
    if (this.state === 'closed' && this.failures >= this.failureThreshold) {
      this.state = 'open'
      this.openedAt = Date.now()
    }
  }

  getState(): { state: CircuitState; failures: number; failureThreshold: number } {
    return { state: this.state, failures: this.failures, failureThreshold: this.failureThreshold }
  }

  /** Test/diagnostics hook. */
  reset(): void {
    this.state = 'closed'
    this.failures = 0
    this.openedAt = 0
  }
}
