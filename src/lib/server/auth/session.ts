/**
 * Session Management
 *
 * Server-side session CRUD with TTL-based expiration.
 * Sessions stored in SQLite, cleaned up by cron.
 */
import { eq, lt } from 'drizzle-orm'
import { useDatabase, schema } from '$lib/server/db'
import { generateSessionId } from './password'

const SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
export const REMEMBER_ME_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export interface SessionData {
  id: string
  userId: number
  expiresAt: Date
}

export function createSession(userId: number, ttlMs: number = SESSION_TTL_MS): SessionData {
  const db = useDatabase()
  const id = generateSessionId()
  const expiresAt = new Date(Date.now() + ttlMs)
  db.insert(schema.sessions).values({ id, userId, expiresAt }).run()
  return { id, userId, expiresAt }
}

export function getValidSession(sessionId: string): SessionData | null {
  const db = useDatabase()
  const session = db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.id, sessionId))
    .get()

  if (!session) return null
  if (session.expiresAt < new Date()) {
    deleteSession(sessionId)
    return null
  }
  return { id: session.id, userId: session.userId, expiresAt: session.expiresAt }
}

export function deleteSession(sessionId: string): void {
  const db = useDatabase()
  db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId)).run()
}

export function deleteUserSessions(userId: number): void {
  const db = useDatabase()
  db.delete(schema.sessions).where(eq(schema.sessions.userId, userId)).run()
}

export function cleanupExpiredSessions(): number {
  const db = useDatabase()
  const result = db
    .delete(schema.sessions)
    .where(lt(schema.sessions.expiresAt, new Date()))
    .run()
  return result.changes
}

export function extendSession(sessionId: string, ttlMs: number = SESSION_TTL_MS): SessionData | null {
  const session = getValidSession(sessionId)
  if (!session) return null

  const db = useDatabase()
  const newExpiresAt = new Date(Date.now() + ttlMs)
  db.update(schema.sessions)
    .set({ expiresAt: newExpiresAt })
    .where(eq(schema.sessions.id, sessionId))
    .run()

  return { ...session, expiresAt: newExpiresAt }
}

/**
 * Cookie lifetime (seconds) for a session. "Remember me" logins keep the
 * browser cookie alive for 30 days; otherwise the session expires in 24h.
 * Mirrors the server-side session TTL so the cookie and the DB row agree.
 */
export function sessionCookieMaxAge(rememberMe: boolean): number {
  return rememberMe ? REMEMBER_ME_TTL_MS / 1000 : SESSION_TTL_MS / 1000
}
