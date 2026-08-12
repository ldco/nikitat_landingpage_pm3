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
import { API_ROUTES } from '$lib/utils/api-paths'

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
  return request<{ message: string }>(API_ROUTES.contact.submit, {
    method: 'POST',
    body: JSON.stringify(input)
  })
}

/** Public site settings (sensitive keys already filtered server-side). */
export function fetchSettings() {
  return request<Record<string, string | null>>(API_ROUTES.settings)
}

/** Admin cascade delete via the central /admin/api endpoint. */
export type AdminDeleteModule = 'portfolios' | 'blog' | 'features' | 'faq' | 'pricing' | 'contacts' | 'users'

export function adminDelete(module: AdminDeleteModule, id: number) {
  return request<{ success: true }>(API_ROUTES.admin.delete, {
    method: 'POST',
    body: JSON.stringify({ module, id })
  })
}

// ── 2FA ─────────────────────────────────────────────────────────────────────

export interface TwoFactorSetupData {
  qrCode: string
  uri: string
  backupCodes: string[]
}

export interface TwoFactorStatusData {
  enabled: boolean
  available: boolean
  backupCodesRemaining?: number
}

export interface TwoFactorVerifyResult {
  user?: { id: number; email: string; name: string | null; role: string }
  backupCodesRemaining?: number
}

export function fetch2faStatus() {
  return request<TwoFactorStatusData>(API_ROUTES.user.twoFactor.status)
}

export function start2faSetup() {
  return request<TwoFactorSetupData>(API_ROUTES.user.twoFactor.setup, { method: 'POST' })
}

export function enable2fa(code: string) {
  return request<{ message: string }>(API_ROUTES.user.twoFactor.enable, {
    method: 'POST',
    body: JSON.stringify({ code })
  })
}

export function disable2fa(password: string) {
  return request<{ message: string }>(API_ROUTES.user.twoFactor.disable, {
    method: 'POST',
    body: JSON.stringify({ password })
  })
}

/** Verify a 2FA code during login (after password check). */
export function verify2fa(code: string) {
  return request<TwoFactorVerifyResult>(API_ROUTES.user.twoFactor.verify, {
    method: 'POST',
    body: JSON.stringify({ code })
  })
}

// ── Password ────────────────────────────────────────────────────────────────

export function changePassword(currentPassword: string, newPassword: string) {
  return request<{ message: string }>(API_ROUTES.user.changePassword, {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword })
  })
}
