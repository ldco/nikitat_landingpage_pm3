import { z } from 'zod'
import { requireAdminPage } from '$lib/server/utils/admin-rbac'
import { useDatabase, schema } from '$lib/server/db'
import { eq, and } from 'drizzle-orm'
import { error } from '@sveltejs/kit'
import { LOCALE_STRINGS } from '$lib/config/site'
import type { RequestEvent } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { ADMIN_ROUTES } from '$lib/utils/admin-paths'
import { runAdminFormAction } from '$lib/server/services/entity-crud'
import { forEachLocaleTranslationWrite } from '$lib/server/utils/locale-form'
import { FAQ_LOCALE_SPEC as localeSpec } from '$lib/server/utils/entity-locale-specs'

// Same contract as the create action (shared spec): a submitted locale
// section must contain BOTH the question and the answer — a half-filled
// translation is rejected. Removing an existing locale's row is an EXPLICIT
// choice: the edit form's per-locale "remove" checkbox (remove_<loc>) drives
// the deletion below — never an accidentally emptied input block.

const updateSchema = z.object({
  slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  category: z.string().trim().max(200).optional().nullable(),
  published: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0).default(0)
})

export const load: PageServerLoad = async (event) => {
  requireAdminPage(event, 'faq')
  const db = useDatabase()
  const itemId = Number(event.params.id)
  const item = db.select().from(schema.faqItems).where(eq(schema.faqItems.id, itemId)).get()
  if (!item) error(404)

  const translations = db.select().from(schema.faqItemTranslations)
    .where(eq(schema.faqItemTranslations.faqItemId, itemId)).all()

  return { item, translations, locales: LOCALE_STRINGS }
}

export const actions = {
  default: (event: RequestEvent) =>
    runAdminFormAction(event, {
      adminPage: 'faq',
      localeSpec,
      redirectTo: ADMIN_ROUTES.faq,
      uniqueFieldErrors: [{ column: 'slug', label: 'apiErrors.admin.slugExists' }],
      parseBase: form => {
        const parsed = updateSchema.safeParse({
          slug: form.get('slug'),
          category: form.get('category') || null,
          published: form.get('published') || null,
          order: form.get('order')
        })
        if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors }
        return {
          ok: true,
          input: {
            id: Number(event.params.id),
            slug: parsed.data.slug,
            category: parsed.data.category || null,
            published: parsed.data.published === 'on',
            order: parsed.data.order
          }
        }
      },
      execute: (db, input, translations, form) => {
        const itemId = input.id
        db.update(schema.faqItems).set({
          slug: input.slug,
          category: input.category,
          published: input.published,
          order: input.order
        }).where(eq(schema.faqItems.id, itemId)).run()

        // Upsert the submitted per-locale translations. Removal is EXPLICIT: a
        // checked `remove_<loc>` field deletes that locale's row; a locale
        // section left entirely empty without the flag is preserved — it is
        // never silently skipped (stale rows must be cleared via the checkbox)
        // and never deleted by accident. Shared with the features editor.
        forEachLocaleTranslationWrite(form, translations, (loc, values, remove) => {
          if (remove) {
            db.delete(schema.faqItemTranslations)
              .where(and(
                eq(schema.faqItemTranslations.faqItemId, itemId),
                eq(schema.faqItemTranslations.locale, loc)
              ))
              .run()
            return
          }

          const existing = db.select({ id: schema.faqItemTranslations.id })
            .from(schema.faqItemTranslations)
            .where(and(
              eq(schema.faqItemTranslations.faqItemId, itemId),
              eq(schema.faqItemTranslations.locale, loc)
            )).get()

          if (existing) {
            db.update(schema.faqItemTranslations).set({
              question: values.question ?? '',
              answer: values.answer ?? '',
              updatedAt: new Date()
            }).where(eq(schema.faqItemTranslations.id, existing.id)).run()
          } else {
            db.insert(schema.faqItemTranslations).values({
              faqItemId: itemId,
              locale: loc,
              question: values.question ?? '',
              answer: values.answer ?? '',
              updatedAt: new Date()
            }).run()
          }
        })
      }
    })
}
