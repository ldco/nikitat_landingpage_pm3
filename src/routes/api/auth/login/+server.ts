import { error, json } from '@sveltejs/kit'
import type { RequestEvent } from '@sveltejs/kit'
import { z } from 'zod'
import { useDatabase, schema } from '$lib/server/db'
import { verifyPassword } from '$lib/server/auth/password'
import { createSession } from '$lib/server/auth/session'
import { checkAccountLocked, recordFailedAttempt, resetFailedAttempts } from '$lib/server/auth/lockout'
import { audit } from '$lib/server/audit'
import { getClientIp } from '$lib/server/security/rateLimit'
import { eq } from 'drizzle-orm'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export async function POST(event: RequestEvent) {
  const body = await event.request.json().catch(() => null)
  if (!body) error(400)

  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) error(400)

  const { email, password } = parsed.data
  const ip = getClientIp(event.request)
  const ua = event.request.headers.get('user-agent')

  const db = useDatabase()
  const user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .get()

  if (!user) {
    audit.loginFailed(ip, ua, email, 'user_not_found')
    error(401)
  }

  // Check lockout
  const lockStatus = checkAccountLocked(user.id)
  if (lockStatus.isLocked) {
    audit.loginFailed(ip, ua, email, 'account_locked', user.id)
    error(429)
  }

  // Verify password
  if (!verifyPassword(password, user.passwordHash)) {
    const result = recordFailedAttempt(user.id)
    audit.loginFailed(ip, ua, email, 'invalid_password', user.id)
    if (result.isLocked) {
      error(429)
    }
    error(401)
  }

  // Success — reset lockout, create session
  resetFailedAttempts(user.id)
  const session = createSession(user.id)
  audit.login(ip, ua, user.id)

  event.cookies.set('pm-session', session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 24 * 60 * 60 // 24 hours
  })

  return json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      session: { id: session.id, expiresAt: session.expiresAt }
    }
  })
}
