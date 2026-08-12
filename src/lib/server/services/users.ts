/**
 * Users Service — Typed queries for users + sessions
 *
 * Owns the shared user queries used by:
 *   - Admin users list/CRUD
 *   - Auth (login lookup, session user fetch)
 *   - Audit userCreate/userDelete reporting
 *
 * Users carry a legacy `role` enum AND an optional `roleId` link to the roles
 * table (custom roles). The EFFECTIVE role slug is always the stored role's
 * slug when `roleId` is set, otherwise the legacy `role` — this is the single
 * identity `getStoredRolePermissions()` and the admin gates resolve against.
 */
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'

/** Safe user projection — NEVER select passwordHash into responses. */
export const USERS_SELECT = {
  id: schema.users.id,
  email: schema.users.email,
  name: schema.users.name,
  role: schema.users.role,
  roleId: schema.users.roleId,
  failedLoginAttempts: schema.users.failedLoginAttempts,
  lockedUntil: schema.users.lockedUntil,
  createdAt: schema.users.createdAt,
  updatedAt: schema.users.updatedAt
}

/**
 * Resolve a user row into its effective role slug.
 *
 * @param row — a row carrying both the legacy `role` and the joined `roleSlug`
 * @returns the role slug the RBAC layer should use
 */
export function resolveEffectiveRole(row: { role: string; roleSlug: string | null }): string {
  return row.roleSlug ?? row.role
}

/** Admin list: paginated users (no passwordHash) with resolved role slugs. */
export function getUsers(pageSize: number, offset: number) {
  const db = useDatabase()
  const rows = db
    .select({
      ...USERS_SELECT,
      roleSlug: schema.roles.slug
    })
    .from(schema.users)
    .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
    .limit(pageSize)
    .offset(offset)
    .all()
  const total = db.select({ id: schema.users.id }).from(schema.users).all().length
  return {
    users: rows.map(row => ({
      id: row.id,
      email: row.email,
      name: row.name,
      roleId: row.roleId,
      role: resolveEffectiveRole(row),
      failedLoginAttempts: row.failedLoginAttempts,
      lockedUntil: row.lockedUntil,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    })),
    total
  }
}

/** Single user by id (no passwordHash) with resolved role slug. */
export function getUserById(id: number) {
  const db = useDatabase()
  const row = db
    .select({
      ...USERS_SELECT,
      roleSlug: schema.roles.slug
    })
    .from(schema.users)
    .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
    .where(eq(schema.users.id, id))
    .get()
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    roleId: row.roleId,
    role: resolveEffectiveRole(row),
    failedLoginAttempts: row.failedLoginAttempts,
    lockedUntil: row.lockedUntil,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

/** User by email — used for auth. Returns full row (includes passwordHash for verification). */
export function getUserByEmail(email: string) {
  const db = useDatabase()
  return db.select().from(schema.users).where(eq(schema.users.email, email)).get() ?? null
}

/**
 * Resolve the effective role slug for a user id — the stored role's slug when
 * roleId is set, else the legacy enum. Used by the login response so the
 * client sees the SAME identity the session carries (event.locals.user).
 */
export function getEffectiveRole(userId: number): string | null {
  const db = useDatabase()
  const row = db
    .select({
      role: schema.users.role,
      roleSlug: schema.roles.slug
    })
    .from(schema.users)
    .leftJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
    .where(eq(schema.users.id, userId))
    .get()
  if (!row) return null
  return row.roleSlug ?? row.role
}

/** Legacy enum roles — values that fit the users.role column. */
const LEGACY_ROLES = new Set(['master', 'admin', 'editor'])

/**
 * Persist-ready role values: given a role slug, produce `{ role, roleId }` —
 * the legacy column keeps the slug when it fits the enum, else 'editor', and
 * `roleId` links the roles table row (built-in or custom).
 */
export function resolveRoleToPersist(
  slug: string,
  roleId: number | null = null
): { role: 'master' | 'admin' | 'editor'; roleId: number | null } {
  const db = useDatabase()
  const linkedId =
    roleId ??
    db.select({ id: schema.roles.id }).from(schema.roles).where(eq(schema.roles.slug, slug)).get()
      ?.id ??
    null
  return {
    role: LEGACY_ROLES.has(slug) ? (slug as 'master' | 'admin' | 'editor') : 'editor',
    roleId: linkedId
  }
}

/** Fetch a roles row by id (used by the users API to resolve roleId input). */
export function getRoleById(id: number) {
  const db = useDatabase()
  return db.select().from(schema.roles).where(eq(schema.roles.id, id)).get() ?? null
}

/** All roles for admin assignment dropdowns. */
export function getAllRoles() {
  const db = useDatabase()
  return db
    .select({ id: schema.roles.id, name: schema.roles.name, slug: schema.roles.slug })
    .from(schema.roles)
    .all()
}
