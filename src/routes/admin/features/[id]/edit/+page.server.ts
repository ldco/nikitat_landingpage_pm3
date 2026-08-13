import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq, and } from 'drizzle-orm'
import { error, redirect, fail } from '@sveltejs/kit'
import { LOCALE_STRINGS } from '$lib/config/site'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
import { uniqueConstraintFieldErrors } from '$lib/server/utils/db-errors'
import {
  localeFieldsSchema,
  mergeFieldErrors,
  readLocaleFields,
  submittedLocaleSections,
  forEachLocaleTranslationWrite
} from '$lib/server/utils/locale-form'
import { FEATURE_LOCALE_SPEC as localeSpec } from '$lib/server/utils/entity-locale-specs'

// Same contract as the create action (shared spec): a submitted locale
// section must contain the title (description is optional) — a title-less
// translation is rejected. Removing an existing locale's row is an EXPLICIT
// choice: the edit form's per-locale "remove" checkbox (remove_<loc>) drives
// the deletion below — never an accidentally emptied input block.

const updateSchema = z.object({
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  imageUrl: z.string().trim().max(500).optional().nullable(),
  hoverImageUrl: z.string().trim().max(500).optional().nullable(),
  category: z.string().trim().max(200).optional().nullable(),
  published: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0).default(0)
})

export const load: PageServerLoad = async (event) => {
  requireAdminPage(event, 'features')
  const db = useDatabase()
  const featureId = Number(event.params.id)
  const item = db.select().from(schema.features).where(eq(schema.features.id, featureId)).get()
  if (!item) error(404)

  const translations = db.select().from(schema.featureTranslations)
    .where(eq(schema.featureTranslations.featureId, featureId)).all()

  return { item, translations, locales: LOCALE_STRINGS }
}

export const actions = {
  default: async (event: RequestEvent) => {
    requireAdminPage(event, 'features')
    const form = event.locals.csrfForm ?? await event.request.formData()
    // Base fields and the locale block are validated up-front together — an
    // incomplete locale section fails the same way it does on create.
    const parsed = updateSchema.safeParse({
      slug: form.get('slug'),
      imageUrl: form.get('imageUrl') || null,
      hoverImageUrl: form.get('hoverImageUrl') || null,
      category: form.get('category') || null,
      published: form.get('published') || null,
      order: form.get('order')
    })
    const localeParsed = localeFieldsSchema(localeSpec).safeParse(
      readLocaleFields(form, localeSpec)
    )
    if (!parsed.success || !localeParsed.success) {
      return fail(400, {
        fieldErrors: mergeFieldErrors(
          parsed.success ? undefined : parsed.error.flatten().fieldErrors,
          localeParsed.success ? undefined : localeParsed.error.flatten().fieldErrors
        )
      })
    }

    const db = useDatabase()
    const featureId = Number(event.params.id)
    const published = parsed.data.published === 'on'
    const translations = submittedLocaleSections(localeParsed.data, localeSpec)

    try {
    db.transaction(() => {
      db.update(schema.features).set({
        slug: parsed.data.slug,
        imageUrl: parsed.data.imageUrl || null,
        hoverImageUrl: parsed.data.hoverImageUrl || null,
        category: parsed.data.category || null,
        published,
        order: parsed.data.order
      }).where(eq(schema.features.id, featureId)).run()

      // Upsert the submitted per-locale translations. Removal is EXPLICIT: a
      // checked `remove_<loc>` field deletes that locale's row; a locale
      // section left entirely empty without the flag is preserved — it is
      // never silently skipped (stale rows must be cleared via the checkbox)
      // and never deleted by accident. Shared with the faq editor.
      forEachLocaleTranslationWrite(form, translations, (loc, values, remove) => {
        if (remove) {
          db.delete(schema.featureTranslations)
            .where(and(
              eq(schema.featureTranslations.featureId, featureId),
              eq(schema.featureTranslations.locale, loc)
            ))
            .run()
          return
        }

        const existing = db.select({ id: schema.featureTranslations.id })
          .from(schema.featureTranslations)
          .where(and(
            eq(schema.featureTranslations.featureId, featureId),
            eq(schema.featureTranslations.locale, loc)
          )).get()

        if (existing) {
          db.update(schema.featureTranslations).set({
            title: values.title ?? '',
            description: values.description || null,
            updatedAt: new Date()
          }).where(eq(schema.featureTranslations.id, existing.id)).run()
        } else {
          db.insert(schema.featureTranslations).values({
            featureId,
            locale: loc,
            title: values.title ?? '',
            description: values.description || null,
            updatedAt: new Date()
          }).run()
        }
      })
    })
    } catch (e: unknown) {
      const fieldErrors = uniqueConstraintFieldErrors(e, [{ column: 'slug', label: 'apiErrors.admin.slugExists' }])
      if (fieldErrors) return fail(400, { fieldErrors })
      throw e
    }

    redirect(303, ADMIN_ROUTES.features)
  }
}
