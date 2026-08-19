# Portfolio Localization Re-architecture + Editor Media UX

## Status: Proposed

## Problem statement

Three defects share one root cause — the portfolio localization was migrated 1:1
from PM2 instead of following the project's own entity pattern (blog):

1. **Asymmetric storage.** The default locale (`ru`) is stored in the base
   columns (`portfolio_items.title/description/content/category`,
   `portfolios.name/description`); every other locale lives in the generic
   `translations` table with ad-hoc keys (`portfolio_item.<id>.<field>`,
   `portfolio.<id>.<field>`). This special-cases one language, breaks
   "all languages are equal", and silently inverts if `DEFAULT_LOCALE` or the
   `LOCALES` set ever changes (both are config-driven).
2. **Confusing editor.** The item/portfolio editors render "content" (the ru
   columns) as base fields and a separate "Text in other languages" tabbed
   section for en/fr/he — two surfaces for one concept.
3. **URL-only media editing.** The branding `gallery`, website `screenshots` and
   brandbook `pages` are raw `url + caption` text fields (no upload); the
   `FileUpload` preview image is not clickable; the standalone `mediaUrl`
   ("external URL") field is redundant with the upload dropzone.

## Root cause (verified against code + DB)

- `src/lib/server/services/portfolio.ts` → `localizeField()` branches on
  `locale === DEFAULT_LOCALE` (column-first for ru, row-first otherwise).
- `src/lib/server/services/portfolio-admin.ts` → `PORTFOLIO_ITEM_LOCALIZED_FIELDS`
  (`title,description,content,category`) and `PORTFOLIO_LOCALIZED_FIELDS`
  (`name,description`) define the localized columns; readers parse the generic
  table keys back with regexes.
- `src/lib/portfolio-metadata-form.ts` → `gallery`/`screenshots`/`pages` are
  `{ url, caption }` string rows; the editor renders raw URL `<FormField>`s.
- `src/lib/components/molecules/FileUpload.svelte` → the preview `<img>` has no
  click handler (replace requires clicking the X, then re-uploading).

## Decisions (ADR)

### ADR-001: Dedicated per-locale tables — all languages equal

**Status:** Proposed

**Context:** The blog entity (canonical per AGENTS.md) stores localized fields in
a dedicated `blog_post_translations` table (one row per `(post_id, locale)`,
`UNIQUE` constraint). Portfolio must do the same.

**Decision:** Introduce two tables mirroring `blog_post_translations`:

- `portfolio_item_translations`: `{ id, item_id → portfolio_items.id (CASCADE),
  locale, title, description, content, category }`, `UNIQUE(item_id, locale)`.
- `portfolio_translations`: `{ id, portfolio_id → portfolios.id (CASCADE),
  locale, name, description }`, `UNIQUE(portfolio_id, locale)`.

The localized columns on `portfolio_items`/`portfolios` are deprecated and
dropped after the data migrates. `mediaUrl`, `thumbnailUrl`, `caption`,
`itemType`, `order`, `published`, `metadata`, `slug` stay on the item (they are
not localized). Hydration becomes a uniform join with no locale branch.

**Options considered:**
1. **Dedicated tables (chosen)** — matches blog, real FKs + `UNIQUE`, no locale
   special case. Con: a schema migration + service/enrichment/import rewrite.
2. **Keep the generic `translations` table but write ru into it too** — removes
   the locale branch but keeps stringly-typed keys and regex parsing, no FK/UNIQUE.
   Rejected (still the anti-pattern).
3. **Do nothing / UI-only** — does not fix the storage defect the user identified.
   Rejected.

### ADR-002: Phased migration, columns kept as read-fallback until the cut

**Status:** Proposed

**Context:** The columns are read by the service, the PM2 enrichment
(`portfolio-pm2-source.ts`) and the PM2 import (`import-pm2-content.ts`). A
big-bang cut risks a regression in public rendering.

**Decision:** Four phases. Phases 1–3 are additive/reversible (columns retained
as fallback); Phase 4 is the only destructive step (column drop) and lands last.

### ADR-003: Upload-based media rows + clickable preview

**Status:** Proposed

**Context:** `gallery`/`screenshots`/`pages` are `{ url, caption }` rows. The
admin should upload images, not paste URLs.

**Decision:** Add a compact per-row upload control (a `FileUpload` row variant,
or an upload button that fills the row's `url`) next to the caption field. Make
the `FileUpload` preview `<img>` clickable to re-open the file picker. Demote
the `mediaUrl` "external URL" field to an optional secondary path (or remove it
for upload-first types).

## Implementation plan

### Phase 1 — Schema + backfill (no behavior change)

1. `src/lib/server/db/schema.ts` — add `portfolioItemTranslations` and
   `portfolioTranslations` (mirror `blogPostTranslations`).
2. `drizzle-kit generate` migration.
3. Migration/backfill script (`scripts/migrate-portfolio-localization.ts`,
   idempotent): for each portfolio/item, copy the ru column values into
   `locale = DEFAULT_LOCALE` rows; move en/fr/he rows out of the generic
   `translations` table into the new tables; delete the consumed generic keys
   (`portfolio.<id>.name/.description`, `portfolio_item.<id>.*`). Columns are
   left in place as the read-fallback.

### Phase 2 — Service reads the new tables uniformly

1. `src/lib/server/services/portfolio.ts` — replace `localizeField`'s
   `DEFAULT_LOCALE` branch with a uniform join over the translation tables
   (fallback: legacy column until Phase 4). Update `localizeItem`,
   `localizePortfolio`, `getPortfolioBySlug`, `getPublishedPortfolios`,
   `getPublicPortfolioListing`, `getAdminPortfolioItems`.
2. `src/lib/server/services/portfolio-admin.ts` — `getPortfolioItemTranslations`/
   `getPortfolioTranslations` query the new tables (drop the regex parsing);
   keep `PORTFOLIO_ITEM_LOCALIZED_FIELDS` / `PORTFOLIO_LOCALIZED_FIELDS` as the
   shared field allowlists.

### Phase 3 — Editors + writers to the new tables

1. `src/lib/components/admin/PortfolioItemEditor.svelte` +
   `src/routes/admin/portfolios/[id]/edit/+page.svelte` — one "Content" section
   with all-locale tabs (ru included), each tab bound to the translation table.
   Non-localized fields (itemType, media, caption, published) stay outside.
2. `src/lib/components/molecules/AdminLocaleTextFields.svelte` — accept the full
   locale list (ru included); ru maps to the translation table like any other.
3. `src/routes/admin/portfolios/[id]/items/+page.server.ts` and `[id]/edit/
   +page.server.ts` — persist per-locale fields to the new tables (uniform, no
   default-locale split).
4. `scripts/import-portfolio-translations.ts` + `src/project/portfolio-translations.json`
   — write all locales (incl. ru) as translation rows; remove the column/row
   routing and the branding-type guard once the tables are authoritative.

### Phase 4 — Cut the columns

1. `src/lib/server/services/portfolio-pm2-source.ts` — enrichment currently
   fills sparse *columns*; point it at the default-locale translation row.
2. `scripts/import-pm2-content.ts` — import into the new tables.
3. Drop `portfolio_items.title/description/content/category` and
   `portfolios.name/description` (migration).
4. Update tests (`tests/api/portfolio-*`, `tests/routes/admin/portfolios.test.ts`,
   viewer/editor tests) to the new tables.

### Phase 5 (ADR-003) — Media upload UX

1. `src/lib/components/molecules/FileUpload.svelte` — make the preview `<img>`
   clickable → re-trigger the hidden file input.
2. Add a compact upload-row control for `gallery`/`screenshots`/`pages`; wire
   into `BrandingFields.svelte`, `WebsiteFields.svelte`, `BrandbookFields.svelte`
   (upload sets the row `url`, caption stays a text field).
3. Demote/remove the `mediaUrl` "external URL" field for upload-first types.

## Files touched

- `src/lib/server/db/schema.ts` (+2 tables)
- `src/lib/server/services/portfolio.ts`, `portfolio-admin.ts`,
  `portfolio-pm2-source.ts`
- `scripts/import-pm2-content.ts`, `scripts/import-portfolio-translations.ts`
- `scripts/migrate-portfolio-localization.ts` (new)
- `src/lib/components/admin/PortfolioItemEditor.svelte`,
  `src/lib/components/admin/portfolio/*Fields.svelte`
- `src/lib/components/molecules/AdminLocaleTextFields.svelte`, `FileUpload.svelte`
- `src/routes/admin/portfolios/[id]/edit/+page.svelte` + `+page.server.ts`,
  `src/routes/admin/portfolios/[id]/items/+page.server.ts`
- `src/project/portfolio-translations.json`
- tests under `tests/api/portfolio-*`, `tests/routes/admin/portfolios.test.ts`

## Verification checklist

- [ ] Migration idempotent: re-run is a no-op; ru + en/fr/he rows all present
      in the new tables; generic-table keys removed.
- [ ] Public `/portfolio/<slug>` renders ru/en/fr/he identically to pre-migration
      (regression) for a branding, website, and case_study portfolio.
- [ ] Editor shows ONE "Content" section with 4 locale tabs; editing ru and en
      both persist to the new tables and render on the public site.
- [ ] `npm run check` clean; `npm run test` green; `npm run validate:pm3` OK.
- [ ] Gallery image upload: pick a file → row `url` populated → renders; preview
      image is clickable to replace.

## Risks & rollback

- **Risk:** ru content lost during migration. **Mitigation:** backfill copies
  columns → `locale=ru` rows before anything else; columns retained as fallback
  until Phase 4.
- **Risk:** PM2 enrichment/import drift (they read columns). **Mitigation:** both
  are updated in Phase 4, the same phase the columns are dropped.
- **Rollback:** Phases 1–3 are additive and `git revert`-able; Phase 4 is the
  only destructive step and is isolated behind a clean revert boundary.

## Confidence

🟢 **High** — the defect, the target model (blog parity), and the coupling
points are verified against the schema, services, enrichment, import, editors,
and tests.

🟡 **Medium** — the exact migration script scope (which generic keys exist in a
given DB) is data-dependent and must be enumerated during Phase 1.
