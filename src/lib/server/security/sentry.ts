/**
 * Sentry Initialization (server)
 *
 * Optional error tracking (audit I-3, hardening). Enabled only when
 * SENTRY_DSN is present — without a DSN the module is a no-op so the app
 * behaves exactly as before in environments that do not use Sentry.
 *
 * Env:
 *   - SENTRY_DSN: Sentry project DSN (absent → disabled)
 *   - SENTRY_ENVIRONMENT: defaults to NODE_ENV
 *   - SENTRY_RELEASE: defaults to APP_BUILD_SHA / GIT_COMMIT_SHA
 */
import * as Sentry from '@sentry/sveltekit'

export const SENTRY_DSN = process.env.SENTRY_DSN

export function isSentryEnabled(): boolean {
  return Boolean(SENTRY_DSN)
}

export function initSentry(): void {
  if (!SENTRY_DSN) return

  const environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development'
  const release =
    process.env.SENTRY_RELEASE || process.env.APP_BUILD_SHA || process.env.GIT_COMMIT_SHA || undefined

  Sentry.init({
    dsn: SENTRY_DSN,
    environment,
    release,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    sampleRate: 1.0,
    attachStacktrace: true,
    maxBreadcrumbs: 50,
    integrations: [Sentry.httpIntegration(), Sentry.consoleIntegration()]
  })
}
