import { fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'
import { requireAdminPage, invalidateRolePermissionsCache } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq } from 'drizzle-orm'
import { uniqueConstraintFieldErrors } from '$lib/server/utils/db-errors'
import { getClientIp } from '$lib/server/security/rateLimit'
import { audit } from '$lib/server/audit'
import { ADMIN_PAGE_DEFS } from '$lib/server/utils/admin-pages'
import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
import { buildPagination, getPaginationParams, getTableCount } from '$lib/server/utils/pagination'
import type { PageServerLoad, Actions } from './$types'

const createRoleSchema = z.object({
  name: z.string().trim().min(1).max(50),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(255).optional(),
  level: z.coerce.number().int().min(0).default(0),
  color: z.string().trim().default('secondary')
})

const updateRoleSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().max(255).optional(),
  level: z.coerce.number().int().min(0).default(0),
  color: z.string().trim().default('secondary')
})

const idSchema = z.object({
  id: z.coerce.number().int().positive()
})

/** Rebuild the permissions JSON from the `perm_<pageId>` checkboxes. */
function readPermissions(form: FormData): string {
  const permissions: Record<string, boolean> = {}
  for (const key of form.keys()) {
    if (key.startsWith('perm_')) permissions[key.slice('perm_'.length)] = true
  }
  return JSON.stringify(permissions)
}

export const load: PageServerLoad = event => {
  requireAdminPage(event, 'roles')
  const db = useDatabase()

  const { page, pageSize, offset } = getPaginationParams(event.url, 20)
  const total = getTableCount(schema.roles)
  const items = db
    .select({
      id: schema.roles.id,
      name: schema.roles.name,
      slug: schema.roles.slug,
      description: schema.roles.description,
      level: schema.roles.level,
      color: schema.roles.color,
      isBuiltIn: schema.roles.isBuiltIn,
      permissions: schema.roles.permissions
    })
    .from(schema.roles)
    .limit(pageSize)
    .offset(offset)
    .all()

  const pages = Object.values(ADMIN_PAGE_DEFS)
    .filter(def => def.menu !== false)
    .map(def => ({ id: def.id }))

  return { items, pages, pagination: buildPagination(page, pageSize, total) }
}

export const actions: Actions = {
  create: async event => {
    const actor = requireAdminPage(event, 'roles')
    const form = event.locals.csrfForm ?? (await event.request.formData())
    const parsed = createRoleSchema.safeParse({
      name: form.get('name'),
      slug: form.get('slug'),
      description: form.get('description') || undefined,
      level: form.get('level'),
      color: form.get('color')
    })
    if (!parsed.success) {
      return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })
    }

    const db = useDatabase()
    try {
      const result = db
        .insert(schema.roles)
        .values({
          ...parsed.data,
          permissions: readPermissions(form),
          isBuiltIn: false
        })
        .returning()
        .get()
      invalidateRolePermissionsCache(result.slug)
      const ip = getClientIp(event)
      const ua = event.request.headers.get('user-agent')
      audit.roleCreate(ip, ua, actor.id, result.id, parsed.data.name, result.slug)
    } catch (e: unknown) {
      const fieldErrors = uniqueConstraintFieldErrors(e, [
        { column: 'name', label: 'apiErrors.admin.roleNameExists' },
        { column: 'slug', label: 'apiErrors.admin.roleSlugExists' }
      ])
      if (fieldErrors) return fail(400, { fieldErrors })
      throw e
    }

    redirect(303, ADMIN_ROUTES.roles)
  },

  update: async event => {
    const actor = requireAdminPage(event, 'roles')
    const form = event.locals.csrfForm ?? (await event.request.formData())
    const parsed = updateRoleSchema.safeParse({
      id: form.get('id'),
      name: form.get('name'),
      description: form.get('description') || undefined,
      level: form.get('level'),
      color: form.get('color')
    })
    if (!parsed.success) {
      return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })
    }

    const db = useDatabase()
    const existing = db.select().from(schema.roles).where(eq(schema.roles.id, parsed.data.id)).get()
    if (!existing) return fail(404, { fieldErrors: { id: ['admin.roleNotFound'] } })

    try {
      db.update(schema.roles)
        .set({
          name: parsed.data.name,
          description: parsed.data.description || null,
          level: parsed.data.level,
          color: parsed.data.color,
          permissions: readPermissions(form)
        })
        .where(eq(schema.roles.id, parsed.data.id))
        .run()
      invalidateRolePermissionsCache(existing.slug)
      const ip = getClientIp(event)
      const ua = event.request.headers.get('user-agent')
      audit.roleUpdate(ip, ua, actor.id, parsed.data.id, existing.name, {
        name: parsed.data.name,
        description: parsed.data.description || null,
        level: parsed.data.level,
        color: parsed.data.color
      })
    } catch (e: unknown) {
      const fieldErrors = uniqueConstraintFieldErrors(e, [
        { column: 'name', label: 'apiErrors.admin.roleNameExists' },
        { column: 'slug', label: 'apiErrors.admin.roleSlugExists' }
      ])
      if (fieldErrors) return fail(400, { fieldErrors })
      throw e
    }

    redirect(303, ADMIN_ROUTES.roles)
  },

  delete: async event => {
    const actor = requireAdminPage(event, 'roles')
    const form = event.locals.csrfForm ?? (await event.request.formData())
    const parsed = idSchema.safeParse({ id: form.get('id') })
    if (!parsed.success) return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })

    const db = useDatabase()
    const existing = db.select().from(schema.roles).where(eq(schema.roles.id, parsed.data.id)).get()
    if (!existing) return fail(404, { fieldErrors: { id: ['admin.roleNotFound'] } })
    if (existing.isBuiltIn) {
      return fail(400, { fieldErrors: { id: ['admin.cannotDeleteBuiltIn'] } })
    }

    db.delete(schema.roles).where(eq(schema.roles.id, parsed.data.id)).run()
    // Deleting a role unlinks users (FK set-null → they fall back to the legacy
    // role column), so the whole cache must go — stale entries for the deleted
    // slug or fallback roles would keep access wrong.
    invalidateRolePermissionsCache()
    const ip = getClientIp(event)
    const ua = event.request.headers.get('user-agent')
    audit.roleDelete(ip, ua, actor.id, parsed.data.id, existing.name)

    redirect(303, ADMIN_ROUTES.roles)
  }
}
