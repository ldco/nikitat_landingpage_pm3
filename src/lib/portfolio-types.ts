/**
 * Portfolio Type Contract — single shared source for portfolio and item types
 *
 * Portfolio types and item types were declared in several places (Drizzle
 * schema enums, service constants, admin Zod schemas, viewer contracts), which
 * is how a stale two-type list survived in `schema.ts` while the rest of the
 * stack shipped five. Every declaration/validation site imports these
 * constants/types so the contract can never drift again:
 *   - Drizzle column enums (src/lib/server/db/schema.ts)
 *   - portfolio service type filters (src/lib/server/services/portfolio.ts)
 *   - admin page-action + JSON-API Zod schemas
 *   - viewer/form item-type contracts (plugins/portfolio/types.ts,
 *     portfolio-metadata-form.ts)
 */

/** The five PM v3 portfolio types (drives the schema enum, filters, Zod). */
export const PORTFOLIO_TYPES = ['gallery', 'case_study', 'branding', 'brandbook', 'website'] as const
export type PortfolioType = (typeof PORTFOLIO_TYPES)[number]

/** O(1) membership check for type filters (no `as readonly string[]` cast). */
export const PORTFOLIO_TYPE_SET: ReadonlySet<PortfolioType> = new Set(PORTFOLIO_TYPES)

/** The four portfolio_item.itemType values (legacy media spread + case study). */
export const PORTFOLIO_ITEM_TYPES = ['image', 'video', 'link', 'case_study'] as const
export type PortfolioItemType = (typeof PORTFOLIO_ITEM_TYPES)[number]
