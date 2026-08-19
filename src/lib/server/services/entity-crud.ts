/**
 * Entity CRUD Service — one implementation for the "simple" admin entities
 * (blog, faq, features, pricing) across every surface.
 *
 *   - API list/get/update/delete handlers: `apiListEntities`, `apiGetEntity`,
 *     `apiUpdateEntity`, `apiDeleteEntity` (used by /api/admin/<entity>).
 *   - Page form actions: `runAdminFormAction` orchestrates the shared
 *     create/edit flow (base + locale validation, error merge, transaction,
 *     unique-constraint mapping, redirect) so the four create/edit action
 *     files no longer copy that skeleton.
 *
 * The two surfaces previously drifted (e.g. the FAQ API POST wrote no
 * translation rows while the page action did); routing both through this
 * module keeps them aligned by construction.
 */
import { z } from 'zod'
import { error, json } from '@sveltejs/kit'
import type { ActionFailure, RequestEvent } from '@sveltejs/kit'
import { fail, redirect } from '@sveltejs/kit'
import { eq } from 'drizzle-orm'
import type { AnySQLiteTable, AnySQLiteColumn } from 'drizzle-orm/sqlite-core'
import { useDatabase } from '$lib/server/db'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import type { AdminPageId } from '$lib/server/db/schema'
import { jsonSuccess } from '$lib/server/utils/api'
import { idParamSchema } from '$lib/server/utils/validation'
import { buildPagination, getPaginationParams, getTableCount } from '$lib/server/utils/pagination'
import { uniqueConstraintFieldErrors } from '$lib/server/utils/db-errors'
import {
  localeFieldsSchema,
  mergeFieldErrors,
  readLocaleFields,
  submittedLocaleSections
} from '$lib/server/utils/locale-form'
import type { LocaleFormSpec } from '$lib/server/utils/locale-form'

export interface SimpleEntitySpec<TTable extends AnySQLiteTable> {
  table: TTable
  idColumn: AnySQLiteColumn
  adminPage: AdminPageId
}

/** SQLite Drizzle client type (shared by the injected form-action writers). */
export type Db = ReturnType<typeof useDatabase>

/**
 * Parse an `[id]` route param — rejects non-numeric ids with a 400 (per
 * validation.ts's idParamSchema contract) instead of the bare `Number(param)`
 * pattern every handler used to repeat (which fell through to a 404) or an
 * uncaught Error (which would surface as a 500).
 */
export function parseEntityId(raw: string): number {
  const parsed = idParamSchema.safeParse(raw)
  if (!parsed.success) throw error(400, 'Invalid entity id')
  return parsed.data
}

export function getEntity<TTable extends AnySQLiteTable>(
  spec: SimpleEntitySpec<TTable>,
  id: number
): TTable['$inferSelect'] | undefined {
  return useDatabase().select().from(spec.table).where(eq(spec.idColumn, id)).get()
}

export function deleteEntity<TTable extends AnySQLiteTable>(
  spec: SimpleEntitySpec<TTable>,
  id: number
): boolean {
  const db = useDatabase()
  const existing = db.select().from(spec.table).where(eq(spec.idColumn, id)).get()
  if (!existing) return false
  // Child rows are removed by the schema's ON DELETE CASCADE foreign keys —
  // there is no per-module child deletion to repeat here.
  db.delete(spec.table).where(eq(spec.idColumn, id)).run()
  return true
}

/** GET /api/admin/<entity> — paginated list in the shared envelope. */
export function apiListEntities<TTable extends AnySQLiteTable>(
  event: RequestEvent,
  spec: SimpleEntitySpec<TTable>
): Response {
  requireAdminPage(event, spec.adminPage)
  const db = useDatabase()
  const { page, pageSize, offset } = getPaginationParams(event.url)
  const all = db.select().from(spec.table).limit(pageSize).offset(offset).all()
  const total = getTableCount(spec.table)
  return json({ success: true, data: all, pagination: buildPagination(page, pageSize, total) })
}

/** GET /api/admin/<entity>/[id] */
export function apiGetEntity<TTable extends AnySQLiteTable>(
  event: RequestEvent,
  spec: SimpleEntitySpec<TTable>
): Response {
  requireAdminPage(event, spec.adminPage)
  const item = getEntity(spec, parseEntityId(event.params.id ?? ''))
  if (!item) throw error(404)
  return json(jsonSuccess(item))
}

/** PUT /api/admin/<entity>/[id] — validated partial update. */
export async function apiUpdateEntity<TTable extends AnySQLiteTable>(
  event: RequestEvent,
  spec: SimpleEntitySpec<TTable>,
  updateSchema: z.ZodType<Partial<TTable['$inferInsert']>>
): Promise<Response> {
  requireAdminPage(event, spec.adminPage)
  const id = parseEntityId(event.params.id ?? '')
  const body = await event.request.json().catch(() => null)
  if (!body) throw error(400)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) throw error(400, parsed.error.issues.map(e => e.message).join(', '))
  const db = useDatabase()
  const existing = getEntity(spec, id)
  if (!existing) throw error(404)
  const result = db.update(spec.table).set(parsed.data).where(eq(spec.idColumn, id)).returning().get()
  return json(jsonSuccess(result))
}

/** DELETE /api/admin/<entity>/[id] */
export function apiDeleteEntity<TTable extends AnySQLiteTable>(
  event: RequestEvent,
  spec: SimpleEntitySpec<TTable>
): Response {
  requireAdminPage(event, spec.adminPage)
  if (!deleteEntity(spec, parseEntityId(event.params.id ?? ''))) {
    throw error(404)
  }
  return json(jsonSuccess({ deleted: true }))
}

/**
 * Orchestration for admin create/edit form actions. The action file supplies
 * only its schema parse (`parseBase`) and the actual writes (`execute`);
 * everything shared — locale validation, error merging, transaction,
 * unique-constraint → field-error mapping and the redirect — lives here.
 */
export interface AdminFormAction<TInput> {
  adminPage: AdminPageId
  localeSpec: LocaleFormSpec
  redirectTo: string
  uniqueFieldErrors: Array<{ column: string; label: string }>
  parseBase: (form: FormData) =>
    | { ok: true; input: TInput }
    | { ok: false; fieldErrors: Record<string, string[]> }
  execute: (
    db: Db,
    input: TInput,
    translations: Record<string, Record<string, string>>,
    form: FormData
  ) => void
}

export async function runAdminFormAction<TInput>(
  event: RequestEvent,
  action: AdminFormAction<TInput>
): Promise<Response | ActionFailure<{ fieldErrors: Record<string, string[]> }>> {
  requireAdminPage(event, action.adminPage)
  const form = event.locals.csrfForm ?? (await event.request.formData())

  // Base fields and the locale block are validated up-front together — an
  // incomplete locale section fails the same way a bad base field does.
  const base = action.parseBase(form)
  const localeParsed = localeFieldsSchema(action.localeSpec).safeParse(
    readLocaleFields(form, action.localeSpec)
  )
  if (!base.ok || !localeParsed.success) {
    return fail(400, {
      fieldErrors: mergeFieldErrors(
        base.ok ? undefined : base.fieldErrors,
        localeParsed.success ? undefined : localeParsed.error.flatten().fieldErrors
      )
    })
  }

  const translations = submittedLocaleSections(localeParsed.data, action.localeSpec)
  const db = useDatabase()
  try {
    db.transaction(() => {
      action.execute(db, base.input, translations, form)
    })
  } catch (e: unknown) {
    const fieldErrors = uniqueConstraintFieldErrors(e, action.uniqueFieldErrors)
    if (fieldErrors) return fail(400, { fieldErrors })
    throw e
  }

  redirect(303, action.redirectTo)
}
