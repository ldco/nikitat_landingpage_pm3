/**
 * Users Service — Typed queries for users + sessions
 *
 * Owns the shared user queries used by:
 *   - Admin users list/CRUD
 *   - Auth (login lookup, session user fetch)
 *   - Audit userCreate/userDelete reporting
 */
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'

/** Safe user projection — NEVER select passwordHash into responses. */
export const USERS_SELECT = {
  id: schema.users.id,
  email: schema.users.email,
  name: schema.users.name,
  role: schema.users.role,
  createdAt: schema.users.createdAt,
  updatedAt: schema.users.updatedAt
}

/** Admin list: paginated users (no passwordHash). */
export function getUsers(pageSize: number, offset: number) {
  const db = useDatabase()
  const all = db.select(USERS_SELECT).from(schema.users).limit(pageSize).offset(offset).all()
  const total = db.select({ id: schema.users.id }).from(schema.users).all().length
  return { users: all, total }
}

/** Single user by id (no passwordHash). */
export function getUserById(id: number) {
  const db = useDatabase()
  return db.select(USERS_SELECT).from(schema.users).where(eq(schema.users.id, id)).get() ?? null
}

/** User by email — used for auth. Returns full row (includes passwordHash for verification). */
export function getUserByEmail(email: string) {
  const db = useDatabase()
  return db.select().from(schema.users).where(eq(schema.users.email, email)).get() ?? null
}
