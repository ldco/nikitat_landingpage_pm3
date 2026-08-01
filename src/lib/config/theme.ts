/**
 * Theme Configuration — single source of truth for brand colors.
 *
 * Source: project/puppet-master.config.ts → colors
 * These 4 primitives drive all derived tokens (color-mix, light-dark).
 * Change here AND in the PM config file to keep them in sync.
 */
export const BRAND_COLORS = {
  black: '#3b0902',  // Near-black text
  white: '#fbf2e7',  // Near-white backgrounds
  brand: '#901504',  // Deep red accent
  accent: '#901504'  // Alias for brand (legacy)
} as const

export type BrandColor = keyof typeof BRAND_COLORS
