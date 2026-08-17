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
  throw error(statusCode, { code, message, details } as unknown as { message: string })
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
