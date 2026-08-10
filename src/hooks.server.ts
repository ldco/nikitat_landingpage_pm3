/**
 * PM Server Hooks
 *
 * Replaces Nuxt middleware + plugins.
 * Order: Paraglide (i18n) → Logger → Session → Rate Limit → CSRF → Security Headers
 *
 * The nonce-based Content-Security-Policy is owned by SvelteKit's built-in
 * CSP (svelte.config.js → kit.csp) — see the securityHeadersHandle below.
 */
import { sequence } from '@sveltejs/kit/hooks'
import type { Handle } from '@sveltejs/kit'
import { LOCALE_STRINGS } from '$lib/config/site'
import { i18n } from '$lib/i18n'
import { getValidSession } from '$lib/server/auth/session'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { buildSecurityHeaders } from '$lib/server/security/headers'
import { validateCsrfToken, CSRF_COOKIE_NAME, CSRF_HEADER_NAME, CSRF_FIELD_NAME, generateCsrfToken } from '$lib/server/security/csrf'
import { loginRateLimiter, getClientIp } from '$lib/server/security/rateLimit'
import { logger } from '$lib/server/utils/logger'
import { FEATURES } from '$lib/config/site'
import { initSentry, isSentryEnabled } from '$lib/server/security/sentry'
import { sentryHandle, handleErrorWithSentry } from '@sentry/sveltekit'

const SESSION_COOKIE = 'pm-session'
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

// Sentry is optional — initialized at startup only when SENTRY_DSN is set.
initSentry()

// Fail-fast: when 2FA is enabled in production, TOTP secrets are encrypted
// with TOTP_ENCRYPTION_KEY. Validate at startup so the server cannot pass
// health checks yet 500 on the first 2FA setup/verify (or silently lock out
// every 2FA-enabled account after a key omission).
if (FEATURES.twoFactorAuth && process.env.NODE_ENV === 'production' && !process.env.TOTP_ENCRYPTION_KEY) {
  throw new Error('TOTP_ENCRYPTION_KEY must be set when FEATURES.twoFactorAuth is enabled in production')
}

// ── Session Handle ──────────────────────────────────────────────────────────
const sessionHandle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get(SESSION_COOKIE)

  if (sessionId) {
    const session = getValidSession(sessionId)
    if (session) {
      const db = useDatabase()
      const row = db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          role: schema.users.role,
          roleId: schema.users.roleId,
          name: schema.users.name,
          roleSlug: schema.roles.slug,
          mustChangePassword: schema.users.mustChangePassword
        })
        .from(schema.users)
        .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
        .where(eq(schema.users.id, session.userId))
        .get()

      if (row) {
        const { roleSlug, ...user } = row
        // Effective role identity: the stored role's slug when the user is
        // linked to a roles row (custom roles), else the legacy enum. This is
        // the same slug getStoredRolePermissions() resolves against.
        event.locals.user = { ...user, role: roleSlug ?? user.role, mustChangePassword: user.mustChangePassword ?? false }
      }
    }
  }

  return resolve(event)
}

// ── CSRF Handle ─────────────────────────────────────────────────────────────
// The double-submit token is validated on every state-changing request through
// ONE contract with two transports:
//   - API calls (JSON bodies) echo the token in the X-CSRF-Token header.
//   - Page-action forms (SvelteKit `<form method="POST">`) cannot set custom
//     headers, so they carry the token in a server-validated `_csrf` field.
// Both transports must match the cookie token (timing-safe), otherwise 403.
const csrfHandle: Handle = async ({ event, resolve }) => {
  // Set CSRF cookie only if not present — token must be stable per session,
  // otherwise the header can never match a freshly-regenerated value.
  // NOTE: NOT httpOnly — this is a double-submit-cookie token that the client
  // MUST echo in the X-CSRF-Token header (or the `_csrf` form field); httpOnly
  // would make it unreadable and every mutation would 403. The token is not a
  // session secret.
  let csrfToken = event.cookies.get(CSRF_COOKIE_NAME)
  if (!csrfToken) {
    csrfToken = generateCsrfToken()
    event.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    })
  }

  // Validate on state-changing methods
  if (MUTATION_METHODS.has(event.request.method)) {
    // Skip CSRF for login (handled differently)
    const url = new URL(event.request.url)
    if (url.pathname === '/api/auth/login') {
      return resolve(event)
    }
    // Public analytics beacon — no auth, no state change beyond logging
    if (url.pathname === '/api/analytics/performance') {
      return resolve(event)
    }

    const cookieToken = event.cookies.get(CSRF_COOKIE_NAME) ?? undefined

    // API clients send the header; page actions send the `_csrf` form field.
    // The body is read from a clone so the action can still consume it, and
    // the parsed FormData is stashed on `event.locals.csrfForm` so form
    // actions reuse it instead of re-parsing the request body.
    let requestToken = event.request.headers.get(CSRF_HEADER_NAME) ?? undefined
    if (!requestToken) {
      const form = await readCsrfFieldToken(event.request)
      requestToken = getCsrfField(form)
      if (form) event.locals.csrfForm = form
    }

    if (!validateCsrfToken(cookieToken, requestToken)) {
      return new Response(JSON.stringify({ success: false, error: { code: 'csrf.invalid', message: 'Invalid CSRF token' } }), {
        status: 403,
        headers: { 'content-type': 'application/json' }
      })
    }
  }

  return resolve(event)
}

/** True for urlencoded/multipart bodies — the only shapes that can carry the field. */
function isFormRequest(request: Request): boolean {
  const contentType = request.headers.get('content-type') ?? ''
  return contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')
}

/** Read the `_csrf` field from a form body without consuming the request stream. */
async function readCsrfFieldToken(request: Request): Promise<FormData | undefined> {
  if (!isFormRequest(request)) return undefined
  try {
    return await request.clone().formData()
  } catch {
    // Malformed body — no token to validate; the request will 403.
    return undefined
  }
}

/** Extract the CSRF field value from a parsed form body. */
function getCsrfField(form: FormData | undefined): string | undefined {
  const field = form?.get(CSRF_FIELD_NAME)
  return typeof field === 'string' && field.length > 0 ? field : undefined
}

// ── Security Headers Handle ────────────────────────────────────────────────
// The Content-Security-Policy header is owned by SvelteKit's built-in CSP
// (svelte.config.js → kit.csp, mode 'nonce') — it generates the per-request
// nonce, tags its inline <script>/<style> blocks, and writes the header on
// page responses. Overriding it here would drop the nonce and break the shell.
// This handle only applies the remaining defense-in-depth headers.
const securityHeadersHandle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event)

  const securityHeaders = buildSecurityHeaders(process.env.NODE_ENV === 'production')
  for (const [key, value] of securityHeaders) {
    response.headers.set(key, value)
  }

  return response
}

// ── Rate Limit Handle ───────────────────────────────────────────────────────
const rateLimitHandle: Handle = async ({ event, resolve }) => {
  const url = new URL(event.request.url)

  // Only rate-limit specific endpoints
  if (url.pathname === '/api/auth/login') {
    const ip = getClientIp(event)
    if (!loginRateLimiter.check(ip)) {
      return new Response(JSON.stringify({
        success: false,
        error: { code: 'rateLimit.exceeded', message: 'Too many requests. Try again later.' }
      }), {
        status: 429,
        headers: { 'content-type': 'application/json' }
      })
    }
  }

  return resolve(event)
}

// ── Logger Handle ────────────────────────────────────────────────────────────
const logHandle: Handle = async ({ event, resolve }) => {
  const start = Date.now()
  const response = await resolve(event)
  const ms = Date.now() - start

  if (event.url.pathname.startsWith('/api/')) {
    logger.info({ method: event.request.method, path: event.url.pathname, status: response.status, ms }, 'API request')
  }

  return response
}


// ── API Error Format (rule 11) ─────────────────────────────────────────────
// Transforms all API route errors into { success: false, error: { code, message } }
const errorFormatHandle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event)
  
  // Only transform API routes that return error status codes
  if (event.url.pathname.startsWith('/api/') && response.status >= 400) {
    let body = { message: 'Unknown error' }
    try {
      const text = await response.clone().text()
      body = text ? JSON.parse(text) : body
    } catch {
      // Non-JSON response — keep as-is (e.g. HTML error page)
      return response
    }
    
    // If already in contract format, pass through
    if (body && typeof body === 'object' && 'success' in body && body.success === false) {
      return response
    }
    
    // Transform to contract format
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: `http.${response.status}`,
        message: typeof body === 'string' ? (body as string) : (body && 'message' in body ? ((body as {message: string}).message) : 'Request failed')
      }
    }), {
      status: response.status,
      headers: { 'content-type': 'application/json' }
    })
  }
  
  return response
}


// ── Locale Normalize Handle ─────────────────────────────────────────────
// Redirects double-locale paths like /fr/en → /fr before Paraglide
// tries to parse them.
const localeNormalizeHandle: Handle = async ({ event, resolve }) => {
  const segments = event.url.pathname.split("/").filter(Boolean)

  const s0 = segments[0]
  const s1 = segments[1]
  if (s0 && s1 && LOCALE_STRINGS.includes(s0) && LOCALE_STRINGS.includes(s1)) {
    const rest = segments.length > 2 ? "/" + segments.slice(2).join("/") : ""
    const target = "/" + s0 + rest
    return new Response(null, { status: 308, headers: { location: target } })
  }

  return resolve(event)
}

// ── Export sequence ─────────────────────────────────────────────────────────
// Order: Sentry (if enabled, first) → i18n (lang/dir/html) → logger → session
// → rate-limit → CSRF → security headers
const baseHandle = sequence(
  localeNormalizeHandle,
  i18n.handle(),
  logHandle,
  sessionHandle,
  rateLimitHandle,
  csrfHandle,
  securityHeadersHandle,
  errorFormatHandle
)

export const handle: Handle = isSentryEnabled()
  ? sequence(sentryHandle(), baseHandle)
  : baseHandle

// ── Error contract (rule 11) ───────────────────────────────────────────────
// Formats all API errors into { success: false, error: { code, message } }.
// Never leaks stack traces. Sentry (when enabled) records the error server-side.
const formatServerError: import('@sveltejs/kit').HandleServerError = async ({ error: err, event }) => {
  const isApi = event.url.pathname.startsWith('/api/')

  if (isApi) {
    const status = 'status' in (err as object) ? Number((err as { status?: number }).status) || 500 : 500
    const message = status >= 500 ? 'Internal server error' : err instanceof Error ? err.message : 'Internal server error'
    return {
      message,
      // Shape consumed by SvelteKit to render the JSON response
      ...(status >= 500 ? { stack: undefined } : {}),
      code: status >= 500 ? 'server.internal' : `http.${status}`
    }
  }

  return {
    message: err instanceof Error ? err.message : 'Internal server error'
  }
}

export const handleError: import('@sveltejs/kit').HandleServerError = isSentryEnabled()
  ? handleErrorWithSentry(formatServerError)
  : formatServerError
