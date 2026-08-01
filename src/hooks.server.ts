/**
 * PM Server Hooks
 *
 * Replaces Nuxt middleware + plugins.
 * Order: Paraglide (i18n) → Logger → Session → Rate Limit → CSRF → CSP
 */
import { sequence } from '@sveltejs/kit/hooks'
import type { Handle } from '@sveltejs/kit'
import { i18n } from '$lib/i18n'
import { getValidSession } from '$lib/server/auth/session'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { generateCspNonce, buildSecurityHeaders } from '$lib/server/security/headers'
import { validateCsrfToken, CSRF_COOKIE_NAME, CSRF_HEADER_NAME, generateCsrfToken } from '$lib/server/security/csrf'
import { loginRateLimiter, getClientIp } from '$lib/server/security/rateLimit'
import { logger } from '$lib/server/utils/logger'

const SESSION_COOKIE = 'pm-session'
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

// ── Session Handle ──────────────────────────────────────────────────────────
const sessionHandle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get(SESSION_COOKIE)

  if (sessionId) {
    const session = getValidSession(sessionId)
    if (session) {
      const db = useDatabase()
      const user = db
        .select({ id: schema.users.id, email: schema.users.email, role: schema.users.role, name: schema.users.name })
        .from(schema.users)
        .where(eq(schema.users.id, session.userId))
        .get()

      if (user) {
        event.locals.user = user
      }
    }
  }

  return resolve(event)
}

// ── CSRF Handle ─────────────────────────────────────────────────────────────
const csrfHandle: Handle = async ({ event, resolve }) => {
  // Set CSRF cookie only if not present — token must be stable per session,
  // otherwise the header can never match a freshly-regenerated value.
  let csrfToken = event.cookies.get(CSRF_COOKIE_NAME)
  if (!csrfToken) {
    csrfToken = generateCsrfToken()
    event.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: true,
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
    const headerToken = event.request.headers.get(CSRF_HEADER_NAME) ?? undefined

    if (!validateCsrfToken(cookieToken, headerToken)) {
      return new Response(JSON.stringify({ success: false, error: { code: 'csrf.invalid', message: 'Invalid CSRF token' } }), {
        status: 403,
        headers: { 'content-type': 'application/json' }
      })
    }
  }

  return resolve(event)
}

// ── CSP Handle ──────────────────────────────────────────────────────────────
const cspHandle: Handle = async ({ event, resolve }) => {
  const nonce = generateCspNonce()
  event.locals.nonce = nonce

  const response = await resolve(event)

  const securityHeaders = buildSecurityHeaders(nonce, process.env.NODE_ENV === 'production')
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
    const ip = getClientIp(event.request)
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

// ── Export sequence ─────────────────────────────────────────────────────────
// Order: i18n (lang/dir/html) → logger → session → rate-limit → CSRF → CSP
export const handle = sequence(
  i18n.handle(),
  logHandle,
  sessionHandle,
  rateLimitHandle,
  csrfHandle,
  cspHandle,
  errorFormatHandle
)

// ── Error contract (rule 11) ───────────────────────────────────────────────
// Formats all API errors into { success: false, error: { code, message } }.
// Never leaks stack traces.
export const handleError: import('@sveltejs/kit').HandleServerError = async ({ error: err, event }) => {
  const isApi = event.url.pathname.startsWith('/api/')

  if (isApi) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    const status = 'status' in (err as object) ? Number((err as { status?: number }).status) || 500 : 500
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
