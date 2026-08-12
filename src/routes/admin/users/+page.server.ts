import { fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import {
  getUserById,
  getUserByEmail,
  getUsers,
  getAllRoles,
  resolveRoleToPersist
} from '$lib/server/services'
import { hashPassword, validatePassword, DEFAULT_PASSWORD_POLICY } from '$lib/server/auth/password'
import { resetFailedAttempts } from '$lib/server/auth/lockout'
import { getClientIp } from '$lib/server/security/rateLimit'
import { audit } from '$lib/server/audit'
import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
import type { PageServerLoad, Actions } from './$types'

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().max(100).optional().nullable(),
  role: z.string().min(1)
})

const updateUserSchema = z.object({
  id: z.coerce.number().int().positive(),
  email: z.string().email(),
  password: z.string().optional(),
  name: z.string().max(100).optional().nullable(),
  role: z.string().min(1)
})

const idSchema = z.object({
  id: z.coerce.number().int().positive()
})

/** i18n keys describing why the submitted password fails the policy. */
function passwordPolicyErrors(password: string): string[] {
  const policy = validatePassword(password, DEFAULT_PASSWORD_POLICY)
  return policy.valid ? [] : ['apiErrors.auth.passwordPolicyFailed']
}

export const load: PageServerLoad = event => {
  requireAdminPage(event, 'users')
  const pageParam = Number(event.url.searchParams.get('page') ?? '1')
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
  const limit = 20
  const offset = (page - 1) * limit

  const { users, total } = getUsers(limit, offset)
  return {
    items: users,
    roles: getAllRoles(),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  }
}

export const actions: Actions = {
  /** Create a new admin user (same password policy as /api/user/change-password). */
  create: async event => {
    const actor = requireAdminPage(event, 'users')
    const form = event.locals.csrfForm ?? (await event.request.formData())
    const parsed = createUserSchema.safeParse({
      email: form.get('email'),
      password: form.get('password'),
      name: form.get('name') || null,
      role: form.get('role')
    })
    if (!parsed.success) {
      return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })
    }

    const passwordErrors = passwordPolicyErrors(parsed.data.password)
    if (passwordErrors.length > 0) {
      return fail(400, { fieldErrors: { password: passwordErrors } })
    }

    const persist = resolveRoleToPersist(parsed.data.role)
    // Only master can create master accounts.
    if (persist.role === 'master' && actor.role !== 'master') {
      return fail(403, { fieldErrors: { role: ['apiErrors.admin.users.accessDenied'] } })
    }

    const db = useDatabase()
    if (getUserByEmail(parsed.data.email)) {
      return fail(409, { fieldErrors: { email: ['apiErrors.admin.users.emailExists'] } })
    }

    const result = db
      .insert(schema.users)
      .values({
        email: parsed.data.email,
        passwordHash: hashPassword(parsed.data.password),
        name: parsed.data.name || null,
        role: persist.role,
        roleId: persist.roleId
      })
      .returning()
      .get()
    const ip = getClientIp(event)
    const ua = event.request.headers.get('user-agent')
    audit.userCreate(ip, ua, actor.id, result.id, parsed.data.email, persist.role)

    redirect(303, ADMIN_ROUTES.users)
  },

  /** Update email/name/role and optionally reset the password (policy-checked). */
  update: async event => {
    const actor = requireAdminPage(event, 'users')
    const form = event.locals.csrfForm ?? (await event.request.formData())
    const parsed = updateUserSchema.safeParse({
      id: form.get('id'),
      email: form.get('email'),
      password: form.get('password') || undefined,
      name: form.get('name') || null,
      role: form.get('role')
    })
    if (!parsed.success) {
      return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })
    }

    const id = parsed.data.id
    if (id === actor.id)
      return fail(400, { fieldErrors: { id: ['apiErrors.admin.users.invalidId'] } })
    const db = useDatabase()
    const existing = getUserById(id)
    if (!existing) return fail(404, { fieldErrors: { id: ['apiErrors.admin.users.notFound'] } })
    if (existing.role === 'master' && actor.role !== 'master') {
      return fail(403, { fieldErrors: { role: ['apiErrors.admin.users.accessDenied'] } })
    }

    const passwordErrors = parsed.data.password ? passwordPolicyErrors(parsed.data.password) : []
    if (passwordErrors.length > 0) {
      return fail(400, { fieldErrors: { password: passwordErrors } })
    }

    const persist = resolveRoleToPersist(parsed.data.role)
    const updateValues: Record<string, unknown> = {
      email: parsed.data.email,
      name: parsed.data.name || null,
      role: persist.role,
      roleId: persist.roleId
    }
    if (parsed.data.password) {
      updateValues.passwordHash = hashPassword(parsed.data.password)
    }
    db.update(schema.users).set(updateValues).where(eq(schema.users.id, id)).run()

    const ip = getClientIp(event)
    const ua = event.request.headers.get('user-agent')
    // Never log password hashes — the audit detail carries field names only.
    const auditChanges = {
      email: updateValues.email,
      name: updateValues.name,
      role: updateValues.role,
      roleId: updateValues.roleId
    }
    audit.userUpdate(ip, ua, actor.id, id, auditChanges)
    if (parsed.data.password) audit.passwordChange(ip, ua, actor.id, id)

    redirect(303, ADMIN_ROUTES.users)
  },

  /** Delete a user (cannot delete yourself; masters protected from non-masters). */
  delete: async event => {
    const actor = requireAdminPage(event, 'users')
    const form = event.locals.csrfForm ?? (await event.request.formData())
    const parsed = idSchema.safeParse({ id: form.get('id') })
    if (!parsed.success) return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })

    const id = parsed.data.id
    if (id === actor.id)
      return fail(400, { fieldErrors: { id: ['apiErrors.admin.users.invalidId'] } })
    const db = useDatabase()
    const existing = getUserById(id)
    if (!existing) return fail(404, { fieldErrors: { id: ['apiErrors.admin.users.notFound'] } })
    if (existing.role === 'master' && actor.role !== 'master') {
      return fail(403, { fieldErrors: { id: ['apiErrors.admin.users.accessDenied'] } })
    }

    db.delete(schema.users).where(eq(schema.users.id, id)).run()
    const ip = getClientIp(event)
    const ua = event.request.headers.get('user-agent')
    audit.userDelete(ip, ua, actor.id, id, existing.email)

    redirect(303, ADMIN_ROUTES.users)
  },

  /** Unlock a locked account — resets attempts, lock window and last failure. */
  unlock: async event => {
    const actor = requireAdminPage(event, 'users')
    const form = event.locals.csrfForm ?? (await event.request.formData())
    const parsed = idSchema.safeParse({ id: form.get('id') })
    if (!parsed.success) return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })

    const id = parsed.data.id
    const existing = getUserById(id)
    if (!existing) return fail(404, { fieldErrors: { id: ['apiErrors.admin.users.notFound'] } })
    if (existing.role === 'master' && actor.role !== 'master') {
      return fail(403, { fieldErrors: { id: ['apiErrors.admin.users.accessDenied'] } })
    }

    resetFailedAttempts(id)
    const ip = getClientIp(event)
    const ua = event.request.headers.get('user-agent')
    audit.userUnlock(ip, ua, actor.id, id)

    redirect(303, ADMIN_ROUTES.users)
  }
}
