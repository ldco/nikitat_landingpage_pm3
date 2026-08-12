/**
 * Locale Form Helper — shared parsing/validation for per-locale translation
 * fields in admin create/edit forms (blog, faq, features, …).
 *
 * Prevents create/edit drift: every entity validates its locale section with
 * the SAME Zod-backed structure, up-front alongside the base fields. A locale
 * section is "submitted" when ANY of its fields is non-empty; a submitted
 * section must contain every required field, otherwise the action fails with
 * `fail(400, { fieldErrors })` — the UI never silently discards a half-filled
 * translation.
 *
 * The locale block is validated as its own Zod schema (dynamic keys cannot
 * produce literal-key types when merged into a base object), and its field
 * errors are merged with the base schema's into ONE `fieldErrors` payload.
 */
import { z } from 'zod'
import { LOCALE_STRINGS } from '$lib/config/site'

/**
 * Required-field spec: field suffix (e.g. 'question') → required when the
 * locale section is submitted. Optional fields may stay empty.
 */
export type LocaleFormSpec = Record<string, boolean>

/** i18n key emitted for a missing required field inside a submitted section. */
export const LOCALE_FIELD_REQUIRED_KEY = 'admin.fieldRequired'

/**
 * Read all `${field}_${locale}` values from a form into a flat record keyed
 * exactly like the schema (trimmed; empty string when absent).
 */
export function readLocaleFields(form: FormData, spec: LocaleFormSpec): Record<string, string> {
  const values: Record<string, string> = {}
  for (const loc of LOCALE_STRINGS) {
    for (const field of Object.keys(spec)) {
      const raw = form.get(`${field}_${loc}`)
      values[`${field}_${loc}`] = typeof raw === 'string' ? raw.trim() : ''
    }
  }
  return values
}

/**
 * Zod schema for the locale field block. Every field is optional on its own
 * (a locale may be entirely absent); a section that HAS content must satisfy
 * the spec's required fields, reported as per-field issues so the UI can
 * highlight exactly the missing inputs.
 */
export function localeFieldsSchema(spec: LocaleFormSpec) {
  const fieldNames = Object.keys(spec)
  const shape: Record<string, z.ZodType<string>> = {}
  for (const loc of LOCALE_STRINGS) {
    for (const field of fieldNames) {
      shape[`${field}_${loc}`] = z.string().trim().optional().default('')
    }
  }
  return z.object(shape).superRefine((data, ctx) => {
    for (const loc of LOCALE_STRINGS) {
      const hasAny = fieldNames.some(f => Boolean(data[`${f}_${loc}`]))
      if (!hasAny) continue
      for (const field of fieldNames) {
        if (spec[field] && !data[`${field}_${loc}`]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [`${field}_${loc}`],
            message: LOCALE_FIELD_REQUIRED_KEY
          })
        }
      }
    }
  })
}

/** Merge `fail(400, { fieldErrors })` payloads from separate base/locale parses. */
export function mergeFieldErrors(
  ...fieldErrors: Array<Record<string, string[] | undefined> | undefined>
): Record<string, string[]> {
  const merged: Record<string, string[]> = {}
  for (const errors of fieldErrors) {
    if (!errors) continue
    for (const [key, messages] of Object.entries(errors)) {
      if (messages && messages.length > 0) merged[key] = messages
    }
  }
  return merged
}

/**
 * Reduce the validated flat locale record into per-locale sections, keeping
 * only locales that actually carry content. Each section maps field suffix →
 * trimmed value — exactly the shape the callers persist into translation rows.
 */
export function submittedLocaleSections(
  parsed: Record<string, string>,
  spec: LocaleFormSpec
): Record<string, Record<string, string>> {
  const sections: Record<string, Record<string, string>> = {}
  const fieldNames = Object.keys(spec)
  for (const loc of LOCALE_STRINGS) {
    const values: Record<string, string> = {}
    let hasAny = false
    for (const field of fieldNames) {
      values[field] = parsed[`${field}_${loc}`] ?? ''
      if (values[field]) hasAny = true
    }
    if (hasAny) sections[loc] = values
  }
  return sections
}
