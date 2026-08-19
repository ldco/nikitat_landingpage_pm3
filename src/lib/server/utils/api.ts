/**
 * API Response Helpers
 *
 * Consistent envelope: { success: true, data }
 * Error: throw error(status, message)
 */
import { error } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'

export interface ApiSuccessEnvelope<T = unknown> {
  success: true
  data: T
}

export interface ApiPaginatedEnvelope<T = unknown> extends ApiSuccessEnvelope<T[]> {
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface ApiErrorEnvelope {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export function jsonSuccess<T>(data: T): ApiSuccessEnvelope<T> {
  return { success: true, data }
}

export function jsonPaginated<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): ApiPaginatedEnvelope<T> {
  return {
    success: true,
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export function apiError(statusCode: number, code: string, message: string, details?: Record<string, unknown>): never {
  // App.Error carries the envelope's code/details fields (app.d.ts), so the
  // error() body is typed — no cast needed.
  throw error(statusCode, { code, message, ...(details ? { details } : {}) })
}

/**
 * Contract-format error Response ({ success: false, error: { code, message } })
 * with an i18n KEY as the code. Unlike `apiError` (which throws through
 * SvelteKit and gets normalized to a generic `http.<status>` code by
 * hooks.server.ts), this passes the errorFormatHandle untouched, so the
 * client can branch on the specific key (e.g. current-password-incorrect vs
 * policy-failed) and translate the message itself.
 */
export function apiErrorResponse(
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): Response {
  return new Response(JSON.stringify({
    success: false,
    error: { code, message, ...(details ? { details } : {}) }
  }), {
    status: statusCode,
    headers: { 'content-type': 'application/json' }
  })
}

/**
 * Build a 400 field-level validation error response in the shared API envelope
 * ({ success: false, error: { code, message, details.fieldErrors } }). One
 * helper for every admin API so the error contract can never drift between
 * routes.
 */
export function apiFieldError(
  message: string,
  field: string,
  code: string,
  i18nKey: string
): Response {
  return new Response(JSON.stringify({
    success: false,
    error: {
      code,
      message,
      details: { fieldErrors: { [field]: [i18nKey] } }
    }
  }), {
    status: 400,
    headers: { 'content-type': 'application/json' }
  })
}

export function requireAuth(event: RequestEvent): NonNullable<App.Locals['user']> {
  const user = event.locals.user
  if (!user) {
    apiError(401, 'auth.required', 'Authentication required')
  }
  return user
}

export function requireRole(event: RequestEvent, allowedRoles: string[]): NonNullable<App.Locals['user']> {
  const user = requireAuth(event)
  if (!allowedRoles.includes(user.role)) {
    apiError(403, 'auth.forbidden', 'Insufficient permissions')
  }
  return user
}
