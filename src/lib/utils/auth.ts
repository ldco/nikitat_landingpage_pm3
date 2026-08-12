/**
 * Auth Client Utility (PM v2 useAuth parity)
 *
 * Login/logout/session helpers for client-side use.
 * CSRF token is read from the `pm-csrf` cookie set by hooks.server.ts.
 */

export interface AuthUser {
  id: number
  email: string
  name: string
  role: string
}

export interface LoginResult {
  ok: boolean
  error?: string
  user?: AuthUser
}

/** Read CSRF token from cookie */
import { API_ROUTES } from '$lib/utils/api-paths'

export function getCsrfToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)pm-csrf=([^;]+)/)
  if (!match?.[1]) return ''
  return decodeURIComponent(match[1])
}

export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const res = await fetch(API_ROUTES.auth.login, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': getCsrfToken()
      },
      body: JSON.stringify({ email, password })
    })
    const body = (await res.json()) as { success?: boolean; data?: { user?: AuthUser }; error?: { message?: string } }
    if (!res.ok) {
      return { ok: false, error: body.error?.message ?? `HTTP ${res.status}` }
    }
    return { ok: true, user: body.data?.user }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Network error' }
  }
}

export async function logout(): Promise<boolean> {
  try {
    const res = await fetch(API_ROUTES.auth.logout, {
      method: 'POST',
      headers: { 'x-csrf-token': getCsrfToken() }
    })
    return res.ok
  } catch {
    return false
  }
}

export async function getSession(): Promise<AuthUser | null> {
  try {
    const res = await fetch(API_ROUTES.auth.session)
    if (!res.ok) return null
    const body = (await res.json()) as { success?: boolean; data?: { user?: AuthUser } }
    return body.data?.user ?? null
  } catch {
    return null
  }
}
