# Portfolio Multilingual Editing + Media Asset Fix

## Status: Implemented

> Implementation notes (deviations from the proposal):
> - Part A (images): the uploads were copied from the LOCAL PM2 app
>   (`../app-nuxt/public/uploads/portfolios` → `public/uploads/portfolios`, 197
>   files) instead of pulled over SSH — the user confirmed the files already
>   exist locally. `public/uploads/.gitkeep` restored.
> - Part B: per-locale text is edited via the new `AdminLocaleTextFields`
>   component (non-default locales only; the default locale `ru` keeps editing
>   the base columns). Persistence uses `setTranslations()`/`deleteTranslations()`
>   with empty-value clear semantics; the content cache is invalidated after
>   every write. New key `admin.localizedText` added to `i18n/system-seed.json`
>   and the `admin-route-keys` registries for `/admin/portfolios/[id]/edit` and
>   `/admin/portfolios/[id]/items`.
> - Part C (favicons): verified serving 200 in the current build — no code
>   change was needed (the reported absence was a stale build/browser cache).

## Problem statement

Four portfolio defects, reported together but with two distinct root causes:

1. **Portfolio images missing** on both the public site and the admin page.
2. **Portfolio item explanation texts render in Russian** regardless of locale; only
   the English version has localized text, and there is no way to author the
   remaining language versions.
3. **No admin surface** to enter portfolio item (or portfolio) text per language.
4. **Favicons "gone"** — reported as possibly related to the overall problem.

## Root cause (verified against data + code)

### Issue 1 — Images: absent files, not a rendering bug

- `portfolio_items.media_url` / `thumbnail_url` and `portfolios.cover_image_url`
  reference `/uploads/portfolios/**/*.png` — relative paths imported 1:1 from the
  pulled nikitat.pro snapshot (`data/import/from-production/sqlite.db`).
- The production-uploads root `public/uploads/` (gitignored by design — see
  `.gitignore` `USER UPLOADS`) **does not exist locally**. `scripts/pull-production-content.sh`
  fetches uploads **only** with `--sync-uploads`; the default run imports the DB only.
- Result: every `/uploads/*` reference 404s, and `atoms/AppImage.svelte` correctly
  degrades to its `IconPhoto` placeholder — hence "missing" on every surface.
- The serving path is correct: `svelte.config.js` sets `files.assets: './public'`,
  so `public/uploads/portfolios/…` → `/uploads/portfolios/…`.
- `public/uploads/.gitkeep` (declared as a gitignore exception) is also missing, so
  the directory itself is untracked.

### Issue 2 — Texts: per-locale content exists for en/fr/he, never for ru, and is read-only

- Service-layer hydration is **already implemented and wired** (the earlier
  `docs/plans/portfolio-localization-fix.md` work, now in the working tree):
  `getPortfolioBySlug` passes `activeLocale(locals.paraglide?.lang)` →
  `localizePortfolio` / `localizeItem` resolve `portfolio.<id>.*` and
  `portfolio_item.<id>.*` from the `translations` table, falling back to the raw column.
- Confirmed data state (`data/sqlite.db`):
  - `en`/`fr`/`he` carry `portfolio_item.<id>.{title,description,content,category}`
    for the 47 branding items; `ru` has **none** for those (only website/framework
    items 48+).
  - The rich body (`### Overview …`) is Russian prose in *all* locales — only the
    `### ` headings are localized (en=`Overview`, fr=`Aperçu`, he=`סקירה`). This is
    the imported nikitat.pro verbatim state.
  - The source snapshot's `portfolio_items.content` is NULL for branding items, so
    the runtime PM2 enrichment cannot backfill it — only the `translations` table
    carries the rich body.
- Net effect: `ru` (project default) shows Russian column titles with **no** rich
  sections (content NULL); `en/fr/he` show localized titles + headings over a
  Russian body. There is **no write path** for any of this.

### Issue 3 — Admin: single-locale editors only

- `admin/portfolios/[id]/edit/+page.svelte` edits only `name`/`description` columns.
- `admin/portfolio/PortfolioItemEditor.svelte` edits only `title`/`description`/
  `content`/`caption` columns.
- Neither exposes a locale dimension. The generic `admin/translations` editor *can*
  edit `portfolio_item.*` keys, but it is disconnected from the portfolio workflow.
- A write helper already exists: `setTranslations(locale, entries)` in
  `src/lib/server/services/translations.ts` (upsert, `customized: true`, tombstone
  clear, counts-cache invalidation).

### Issue 4 — Favicons: no code defect found

- All favicon assets exist, are valid (verified via `file`), are tracked in git
  (`git ls-files public/`), referenced correctly in `src/app.html` via
  `%sveltekit.assets%`, and present in `build/client/`.
- Most probable cause: the served/deployed build predates the Aug-17 `assets:favicons`
  regeneration, or browser cache — the same "assets absent in the served environment"
  class of problem as issue 1. **No code change is planned**; verification is included.

## Decision (ADR)

### ADR-001: Per-locale portfolio text storage — reuse the `translations` table

**Status:** Proposed

**Context:** Portfolio text is already localized at the service layer from the
generic `translations` table (keys `portfolio.<id>.*` / `portfolio_item.<id>.*`).
The PM2 import materialized these rows. Adding an admin write path must not fork
the data model.

**Decision:** Write per-locale portfolio/item text to the **existing** `translations`
table via `setTranslations()`, keyed as today:
`portfolio.<id>.name`, `portfolio.<id>.description`,
`portfolio_item.<id>.title`, `.description`, `.content`, `.category`.
The project default locale (`ru`) continues to map to the base columns (the
existing fallback), while `en/fr/he` map to translation rows. The service
hydration already prefers translation rows over columns, so no service change is
required to render admin-authored text.

**Options considered:**
1. **Reuse `translations` (chosen)** — zero migration, consistent with the already-implemented
   hydration and the PM2 import, single write helper. Con: keys are stringly-typed.
2. **New `portfolio_item_translations` table** (blog-style) — cleaner relational model,
   but requires a schema migration, import changes, service rewrite, and a new write
   path; the existing hydration would need to be re-pointed. Rejected as redundant work.
3. **Extend the generic `admin/translations` editor only** — no code, but leaves the
   editorial workflow split across two pages and does not meet the "enter item texts
   per language in the portfolio editor" requirement. Rejected.

### ADR-002: Media assets — operational sync, no code change

**Status:** Proposed

**Context:** Portfolio media are production uploads, gitignored by design. The DB
URLs are already correct relative paths. The only gap is the missing files.

**Decision:** Restore the files via the existing sync tooling — pull
`public/uploads` with `scripts/pull-production-content.sh --sync-uploads`, restore
`public/uploads/.gitkeep`, and document the production direction via
`scripts/deploy-sync-local-data.sh --uploads`. No schema, service, or component
change.

**Options considered:**
1. **Sync from production (chosen)** — uses existing tooling, no repo bloat, matches design intent.
2. **Runtime media-URL fallback to the old domain** (`https://nikitat.pro/uploads/…`)
   — keeps images without syncing but couples the site to the retired domain and
   is a workaround. Rejected (no-shortcuts rule).
3. **Commit uploads to the repo** — de-gitignores large binary blobs. Rejected.

### ADR-003: Admin editing surface — locale-tabbed fields writing to `translations`

**Status:** Proposed

**Context:** The portfolio and item editors are HTML-form-based (SvelteKit form
actions). The default-locale value lives in the columns; other locales live in the
`translations` table.

**Decision:** Add a locale-tabbed field group to both editors. The `ru` tab binds
the existing column fields; the `en/fr/he` tabs bind per-locale overrides that the
form action persists via `setTranslations()` after the item/portfolio row is
written. Locale tabs reuse the canonical `SegmentedControl` primitive and the
locale names from `LOCALE_CONFIG`.

## Implementation plan

### Part A — Images (operational; no code)

1. Pull the uploads from production (requires SSH access to the live host and
   `../app-nuxt/.env`):
   ```bash
   scripts/pull-production-content.sh --sync-uploads
   ```
2. Verify the expected files exist and the URL→file mapping is intact:
   ```bash
   ls public/uploads/portfolios/branding/template_g90b.png
   ```
3. Restore the tracked directory marker:
   ```bash
   touch public/uploads/.gitkeep
   ```
4. For a production deploy, promote uploads with `scripts/deploy-sync-local-data.sh --uploads`
   (and `--replace-uploads` only for a full replace). Verify the container mount
   `UPLOAD_DIR=/app/uploads` serves `/uploads/*` (see `scripts/docker-entrypoint.sh`).

### Part B — Multilingual admin editing (code)

Files to change (bounded, no schema migration):

1. `src/lib/server/services/portfolio.ts` (or a new `portfolio-admin.ts` helper)
   - Add `getPortfolioItemTranslations(portfolioId)` returning a
     `Map<itemId, Record<locale, { title?; description?; content?; category? }>>`
     from ONE batched `translations` query (`key LIKE 'portfolio_item.%'` + the
     portfolio's item ids), so the item editor pre-populates tabs without N+1.
   - Add `getPortfolioTranslations(portfolioId)` for the portfolio `name`/`description`
     per-locale overrides (same batched approach).

2. `src/routes/admin/portfolios/[id]/edit/+page.svelte` + `+page.server.ts`
   - Add a locale-tabbed "Localized text" section (name/description per locale).
   - `load` returns the per-locale overrides.
   - The action parses `name_<locale>` / `description_<locale>`; the `ru` values
     write the columns (existing behavior), `en/fr/he` values write translation rows
     via `setTranslations()` keyed `portfolio.<id>.name` / `.description`.

3. `src/lib/components/admin/PortfolioItemEditor.svelte`
   - Add a locale-tabbed group for `title`/`description`/`content` (and `category`
     where applicable), pre-populated from the translations map passed via a new
     `translations` prop (or from the parent items page load).
   - The `ru` tab binds the existing column fields; `en/fr/he` tabs bind overrides
     submitted as `title_<locale>`, `description_<locale>`, `content_<locale>`,
     `category_<locale>`.

4. `src/routes/admin/portfolios/[id]/items/+page.server.ts`
   - Extend `createItemSchema` / `updateItemSchema` (or a parallel locale-parser)
     to accept the per-locale fields.
   - `create`: capture the new item id via `.returning({ id }).get()` and persist
     non-default-locale translations keyed `portfolio_item.<id>.*`.
   - `update`: persist translations for the known id.
   - `delete`: remove orphaned `portfolio_item.<id>.*` translation rows
     (`deleteTranslations(locale, keys)` or a dedicated cleanup).
   - Only non-empty values are written; empty values clear the override (falling
     back to the column via the existing `nonEmpty` guard).

5. Reusable component: `src/lib/components/molecules/AdminLocaleTextFields.svelte`
   - Locale-tabbed field group (SegmentedControl + FormField), `class` + `twMerge`,
     full JSDoc (`@props`/`@example`), all labels via `t()`/`adminT`.

6. i18n: add any new UI keys (section heading, locale tab labels if not already
   present) to the catalog + `i18n/system-seed.json` following
   `docs/contributing/i18n-literals-policy.md`; no raw string literals
   (validator checks #10/#12).

### Part C — Favicons (verify only)

1. Dev: `curl -I http://localhost:5173/favicon.svg` → 200, `image/svg+xml`.
2. Production: `curl -I https://<domain>/favicon.svg` → 200; if 404/stale, rebuild
   + redeploy (assets are already in `build/client/`).
3. Browser cache: hard-refresh to rule out a stale cached favicon.
4. Only if verification reveals a real gap (e.g. a missing `.gitkeep`-class asset
   or an old build in the deploy pipeline) do we open a code change.

### Files NOT touched

- `src/lib/server/services/portfolio.ts` hydration logic (already correct).
- Schema / migrations (no new tables or columns).
- `scripts/import-pm2-content.ts`, `pull-production-content.sh`,
  `deploy-sync-local-data.sh` (used as-is).
- Viewers (`BrandingViewer`, `WebsiteViewer`, `CaseStudyViewer`, `BrandbookViewer`).

## Verification checklist

- [ ] `public/uploads/portfolios/branding/template_g90b.png` exists after sync;
      `/portfolio/branding` renders item thumbnails/gallery (no `IconPhoto` placeholder).
- [ ] Admin item editor shows a locale tab per `LOCALES` (ru/en/fr/he), pre-populated
      with existing `en/fr/he` translations for branding items.
- [ ] Saving an `en` item title writes `portfolio_item.<id>.title` (`customized: true`)
      and the public `en` detail page reflects it immediately (content cache invalidated).
- [ ] `ru` tab still edits the base columns (no regression to Russian column fallback).
- [ ] Empty `en` override falls back to the column value (no blank title).
- [ ] Creating a new item captures its id and persists its translations correctly.
- [ ] Deleting an item removes orphaned `portfolio_item.<id>.*` translation rows.
- [ ] Portfolio edit page exposes localized name/description; `en`/`fr`/`he` save and
      render on the listing + detail pages.
- [ ] `npm run check` — TypeScript clean.
- [ ] `npm run test` — existing portfolio service/viewer/editor tests pass; add tests
      for the new translation persistence (create/update/delete + fallback).
- [ ] `npm run validate:pm3` — canonical primitives, JSDoc, i18n-literal checks pass.
- [ ] `curl -I` favicon returns 200 locally and in production.

## Risks & rollback

- **Risk:** admin-authored translation could be shadowed by the runtime PM2
  enrichment or a catalog sync. **Mitigation:** `setTranslations` marks rows
  `customized: true` (catalog sync skips them); enrichment only fills *sparse*
  columns and never touches the `translations` table.
- **Risk:** writing a translation for a field whose column is the authoritative
  source could diverge. **Mitigation:** the service already prefers translation
  rows, and the `ru` (default) tab maps to the columns, so column-first behavior is
  preserved for the fallback locale.
- **Rollback:** the changes are additive (no migration); `git revert` of the
  commit(s) restores the prior single-locale behavior. Translation rows written
  during testing can be removed via the admin editor or a targeted SQL delete.

## Confidence

🟢 **High** — root causes for issues 1–3 are confirmed against the DB, the serving
config, and the current code; the storage/write model reuses an already-implemented
hydration path and an existing write helper.

🟡 **Medium** — issue 4 (favicons): no code defect found; the exact trigger (stale
deploy vs. browser cache) is unconfirmed until the verification step runs.
