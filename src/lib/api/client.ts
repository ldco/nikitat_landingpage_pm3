/**
 * API Client — typed fetch wrappers for client-side calls
 *
 * Components and stores call these functions — never write fetch() directly.
 * Server-side routes use the service layer instead ($lib/server/services).
 *
 * Every call includes the CSRF header for state-changing methods
 * (double-submit cookie pattern enforced in hooks.server.ts).
 */
import { getCsrfToken } from '$lib/utils/auth'

export interface ApiEnvelope<T> {
  success: true
  data: T
}

export interface ApiErrorEnvelope {
  success: false
  error: { code: string; message: string; details?: Record<string, unknown> }
}

export type ApiResult<T> = ApiEnvelope<T> | ApiErrorEnvelope

async function request<T>(url: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const headers = new Headers(init.headers)
  if (init.method && init.method !== 'GET' && !headers.has('x-csrf-token')) {
    headers.set('x-csrf-token', getCsrfToken())
  }
  if (init.body && typeof init.body === 'string' && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  const res = await fetch(url, { ...init, headers })
  const body = await res.json().catch(() => null)
  return body as ApiResult<T>
}

/** Submit the public contact form (SectionContact). */
export interface ContactSubmitInput {
  name: string
  email: string
  message: string
  consent: boolean
  phone?: string
  subject?: string
}

export function submitContact(input: ContactSubmitInput) {
  return request<{ message: string }>('/api/contact/submit', {
    method: 'POST',
    body: JSON.stringify(input)
  })
}

/** Public site settings (sensitive keys already filtered server-side). */
export function fetchSettings() {
  return request<Record<string, string | null>>('/api/settings')
}

/** Admin cascade delete via the central /admin/api endpoint. */
export type AdminDeleteModule = 'portfolios' | 'blog' | 'features' | 'faq' | 'pricing' | 'contacts' | 'users'

export function adminDelete(module: AdminDeleteModule, id: number) {
  return request<{ success: true }>('/admin/api', {
    method: 'POST',
    body: JSON.stringify({ module, id })
  })
}
