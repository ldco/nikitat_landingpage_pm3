/**
 * Entity Locale Specs — the per-entity required-field contracts for the
 * shared locale-form validation (src/lib/server/utils/locale-form.ts).
 *
 * Single home for the spec so an entity's CREATE and EDIT actions can never
 * drift: changing a spec here changes what both actions accept. Each spec
 * maps a locale-field suffix to whether it is REQUIRED when the locale
 * section is submitted.
 */
import type { LocaleFormSpec } from '$lib/server/utils/locale-form'

/** Blog: a submitted locale section must contain the title. */
export const BLOG_LOCALE_SPEC: LocaleFormSpec = { title: true, excerpt: false, content: false }

/** FAQ: a submitted locale section must contain both question and answer. */
export const FAQ_LOCALE_SPEC: LocaleFormSpec = { question: true, answer: true }

/** Features: a submitted locale section must contain the title. */
export const FEATURE_LOCALE_SPEC: LocaleFormSpec = { title: true, description: false }

/** Pricing: every field is optional — a locale section is any non-empty subset. */
export const PRICING_LOCALE_SPEC: LocaleFormSpec = { name: false, description: false, ctaText: false }
