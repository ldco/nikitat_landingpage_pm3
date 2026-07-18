import { z } from 'zod'
import config from '~~/project/puppet-master.config'

const translationKeyPattern = /^[A-Za-z0-9][A-Za-z0-9_-]*(?:\.[A-Za-z0-9][A-Za-z0-9_-]*)+$/

export interface NormalizedTranslationInput {
  locale: string
  key: string
  value: string
}

export interface TranslationLocaleValidationError {
  locale: string
  message: string
}

export const configuredLocaleCodes = config.locales.map(locale => locale.code)

const configuredLocalesByLowercase = new Map(
  configuredLocaleCodes.map(locale => [locale.toLowerCase(), locale])
)

export function normalizeLocale(locale: string): string {
  const trimmed = locale.trim()
  return configuredLocalesByLowercase.get(trimmed.toLowerCase()) || trimmed
}

export function normalizeTranslationKey(key: string): string {
  return key.trim()
}

export function isValidTranslationKey(key: string): boolean {
  return translationKeyPattern.test(key)
}

function validateLocaleMembership(locale: string): boolean {
  return configuredLocaleCodes.includes(locale)
}

const singleTranslationPayloadSchema = z.object({
  locale: z.string().min(1, 'Locale is required'),
  key: z.string().min(1, 'Key is required'),
  value: z.string()
}).strict()

export function parseSingleTranslationPayload(body: unknown): NormalizedTranslationInput {
  const parsed = singleTranslationPayloadSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid translation payload',
      data: { errors: parsed.error.issues }
    })
  }

  const locale = normalizeLocale(parsed.data.locale)
  const key = normalizeTranslationKey(parsed.data.key)

  if (!validateLocaleMembership(locale)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid locale',
      data: { locale, allowedLocales: configuredLocaleCodes }
    })
  }

  if (!isValidTranslationKey(key)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid translation key',
      data: {
        key,
        format: 'Use dot notation with non-empty alphanumeric, hyphen, or underscore segments.'
      }
    })
  }

  return {
    locale,
    key,
    value: parsed.data.value
  }
}

const batchTranslationPayloadSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  values: z.record(z.string(), z.unknown())
}).strict()

export function parseBatchTranslationPayload(body: unknown): {
  key: string
  translations: NormalizedTranslationInput[]
  localeErrors: TranslationLocaleValidationError[]
} {
  const parsed = batchTranslationPayloadSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: 'Invalid translation payload',
      data: { errors: parsed.error.issues, localeErrors: [] }
    })
  }

  const key = normalizeTranslationKey(parsed.data.key)
  if (!isValidTranslationKey(key)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid translation key',
      data: {
        key,
        format: 'Use dot notation with non-empty alphanumeric, hyphen, or underscore segments.',
        localeErrors: []
      }
    })
  }

  const seenLocales = new Set<string>()
  const localeErrors: TranslationLocaleValidationError[] = []
  const translations: NormalizedTranslationInput[] = []

  for (const [rawLocale, value] of Object.entries(parsed.data.values)) {
    const locale = normalizeLocale(rawLocale)

    if (!validateLocaleMembership(locale)) {
      localeErrors.push({
        locale: rawLocale,
        message: `Locale must be one of: ${configuredLocaleCodes.join(', ')}`
      })
      continue
    }

    if (typeof value !== 'string') {
      localeErrors.push({
        locale,
        message: 'Translation value must be a string'
      })
      continue
    }

    if (seenLocales.has(locale)) {
      localeErrors.push({
        locale: rawLocale,
        message: `Duplicate locale after normalization: ${locale}`
      })
      continue
    }

    seenLocales.add(locale)
    translations.push({ locale, key, value })
  }

  if (translations.length === 0) {
    localeErrors.push({
      locale: '',
      message: 'At least one locale value is required'
    })
  }

  return {
    key,
    translations,
    localeErrors
  }
}
