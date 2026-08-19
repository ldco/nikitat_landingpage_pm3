/**
 * Pricing Constants — single shared source for pricing business defaults
 *
 * Imported by the Drizzle schema column defaults, the admin forms, the admin
 * APIs and the settings seed so the three can never drift. Client-safe (no
 * server-only imports) — the same role $lib/portfolio-types.ts plays for
 * portfolio types.
 */

export const PRICING_PERIODS = ['month', 'year', 'one-time'] as const
export type PricingPeriod = (typeof PRICING_PERIODS)[number]

export const PRICING_CURRENCIES = ['USD', 'EUR', 'RUB'] as const
export type PricingCurrency = (typeof PRICING_CURRENCIES)[number]

export const PRICING_DEFAULT_CURRENCY: PricingCurrency = 'USD'
export const PRICING_DEFAULT_PERIOD: PricingPeriod = 'month'
export const PRICING_DEFAULT_CTA_URL = '/contact'
