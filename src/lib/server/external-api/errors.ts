/**
 * External API — typed error
 *
 * Every failure from the external API client is an ExternalApiError carrying
 * an optional HTTP status, a stable machine code, and a `retryable` flag that
 * drives the retry loop and circuit breaker (5xx/429/network = retryable;
 * 4xx client errors and caller aborts are not).
 */

export interface ExternalApiErrorOptions {
  status?: number
  code?: string
  retryable?: boolean
}

export class ExternalApiError extends Error {
  readonly status?: number
  readonly code: string
  readonly retryable: boolean

  constructor(message: string, options: ExternalApiErrorOptions = {}) {
    super(message)
    this.name = 'ExternalApiError'
    this.status = options.status
    this.code = options.code ?? 'external.error'
    this.retryable = options.retryable ?? false
  }
}
