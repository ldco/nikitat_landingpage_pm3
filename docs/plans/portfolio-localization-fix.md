# Portfolio Content Localization Fix — restore nikitat.pro parity

## Status: Accepted

## Problem statement

The portfolio module renders the **Russian fallback column values** from
`portfolios` / `portfolio_items`, while the **original nikitat.pro rich,
localized content** (English titles + `Overview / Logo / Color Palette /
Typography / Result` sections) sits unused in the `translations` table. The
data was imported correctly; the rendering never reads it.

## Root cause (verified against data + code)

Two parallel representations of the same portfolio text exist in the DB:

| Field | Raw column (rendered today) | Translation row (nikitat.pro, ignored) |
|---|---|---|
| Portfolio 1 name | `portfolios.name` = `Брендинг` | `portfolio.1.name` (en) = `Branding` |
| Item 30 title | `portfolio_items.title` = `Ребрендинг своего персонального бренда «Никита Т.»` | `portfolio_item.30.title` (en) = `Nikita T. — Personal Rebranding` |
| Item 30 description | `portfolio_items.description` = `Дизайнер Никита Т. — ребрендинг…` | `portfolio_item.30.description` (en) = `Designer Nikita T. — rebranding fusing…` |
| Item 30 content | `portfolio_items.content` = **NULL** | `portfolio_item.30.content` (en) = `### Overview\nМетафизическое… ### Logo… ### Color Palette… ### Typography… ### Result…` |
| Item 30 category | `portfolio_items.category` = `Брендинг` | `portfolio_item.30.category` (en) = `Branding` |

Evidence:

- `data/sqlite.db` (v3) and `data/import/from-production/sqlite.db` (pulled
  nikitat.pro snapshot) have **identical** `portfolio_items` rows — the short
  Russian text is what PM2 stored in the columns.
- The rich body the user quoted is stored verbatim in
  `translations.portfolio_item.30.content` (locale `en`), imported from PM2.
- 915 `portfolio_item.*` translation rows exist in the v3 DB; none are read by
  the portfolio module.
- `src/lib/server/services/portfolio.ts` reads **only** raw columns:
  - `getPortfolioBySlug()` returns `portfolio.name` and
    `item.title/description/content` straight from Drizzle rows. It calls
    `getSanitizedContentTranslations(locale)` but uses the map **only** to
    translate `### heading` lines inside `item.content` (which is NULL for all
    branding items).
  - `getPublishedPortfolios()` / `getPublicPortfolioListing()` accept `_locale`
    and **ignore it**, so listing cards, the homepage section, and the public
    API render the Russian columns.

Conclusion: **the "another texts" are the Russian column fallbacks; the
original localized content is present but never hydrated.**

## Decision (ADR)

Localize portfolio text at the **service layer** in
`src/lib/server/services/portfolio.ts`, using the same fallback pattern the
`pricing` service already uses (`r.name ?? r.baseName`). For every localized
field, prefer the locale's translation row and fall back to the raw column.

- **Option A — service-layer hydration (chosen):** resolve translations inside
  `portfolio.ts` before returning. Pros: single change point, all consumers
  (detail page, listing, homepage section, public API) fixed at once, no
  component changes, consistent with existing entity services (`pricing`,
  `blog`, `team`). Cons: none material.
- **Option B — SQL JOIN on `translations`:** heavier query, would need to be
  threaded through Drizzle, duplicates fallback logic per query. Rejected:
  the translation map is already in memory via `getSanitizedContentTranslations`.
- **Option C — viewer/component hydration:** localize in `BrandingViewer` /
  `CaseStudyViewer` / listing components. Rejected: violates the route contract
  (components receive data via props, never derive translation keys), and would
  need repeating across 4+ surfaces.

## Implementation plan

Single file to change (no migration, no component changes):

`src/lib/server/services/portfolio.ts`

1. Add a `localizePortfolioFields` / `localizeItemFields` helper (internal) that
   takes a Drizzle row + the `Record<string,string>` translation map and returns
   the localized shape:
   - portfolio `name` ← `translations[`portfolio.${id}.name`]` ?? `row.name`
   - portfolio `description` ← `translations[`portfolio.${id}.description`]` ?? `row.description`
   - item `title` ← `translations[`portfolio_item.${id}.title`]` ?? `row.title`
   - item `description` ← `translations[`portfolio_item.${id}.description`]` ?? `row.description`
   - item `content` ← `translations[`portfolio_item.${id}.content`]` ?? `row.content`
   - item `category` ← `translations[`portfolio_item.${id}.category`]` ?? `row.category`
   - Empty-string translation values must be treated as absent (fall back to
     the column) so a blank localized cell never blanks a populated column.

2. `getPortfolioBySlug(slug, locale)`:
   - resolve `translations = getSanitizedContentTranslations(locale)` (already
     present);
   - hydrate `portfolio.name`/`description` and each item's
     `title`/`description`/`content`/`category` **before** the existing
     `translateCaseStudyContent` pass (heading resolution then runs on the
     hydrated markdown body). Order matters: hydrate content → translate
     `### heading` lines → return.

3. `getPublishedPortfolios(locale, sort)` and `getPublicPortfolioListing(locale, …)`:
   - stop ignoring `locale`; load
     `getSanitizedContentTranslations(locale)` once per call and hydrate each
     card's `name`/`description` in the `attachThumbnails` mapping step.

4. Leave the `portfolio.section.*` → `portfolio.heading.*` remap **untouched**
   for this fix: PM2 already baked per-locale headings into each locale's
   `content` (`en`=`Overview`, `fr`=`Aperçu`, `he`=`סקירה`), so hydrated content
   reproduces the original verbatim. The 164 orphaned `portfolio.section.*` keys
   are dead legacy data and are out of scope here.

### Files NOT touched

- Viewers (`BrandingViewer`, `CaseStudyViewer`, `WebsiteViewer`) — they consume
  already-resolved data.
- `scripts/import-pm2-content.ts` — import already materializes the translations.
- Schema / migrations — no column changes.

## Locale behavior note

The PM2 source has **no** `portfolio_item.*` rows for `ru`. Consequently:

- `ru` (project default) keeps the Russian column values — this matches the
  original nikitat.pro `ru` view exactly (including NULL content, i.e. no
  sections).
- `en`/`fr`/`he` show the localized titles + rich sections.

If the user additionally wants `ru` to show the rich body (Russian body text
with English headings, as in the `en` content), that requires a separate
`ru → en` content fallback decision — flagged here, intentionally not bundled
into this fix.

## Verification checklist

- [ ] `npm run check` — TypeScript clean.
- [ ] Detail page: `GET /portfolio/branding` in `en` locale shows `Branding`,
      `Nikita T. — Personal Rebranding`, and the `Overview / Logo / Color
      Palette / Typography / Result` body (Russian body text, English headings —
      matches nikitat.pro verbatim).
- [ ] `fr`/`he` locales show localized titles/headings with the same Russian body.
- [ ] `ru` locale still shows `Брендинг` + Russian item titles (no regression).
- [ ] Listing page `/portfolio` and homepage section show localized portfolio
      names (`Branding` in `en`, `Брендинг` in `ru`).
- [ ] Public API `/api/portfolios` returns localized names/descriptions.
- [ ] A portfolio/item with an empty translation cell falls back to the column
      value (no blank title).
- [ ] `npm run test` — existing portfolio service/viewer tests still pass.
- [ ] No new user-facing string literals introduced (i18n literal policy).

## Risks & rollback

- **Risk:** an admin-edited localized value could be shadowed by a stale
  translation row. **Mitigation:** the fallback is column-first for any field
  the admin writes directly; translations only fill what the column lacks.
  Verify against `isAdminEditedMetadata` semantics if metadata is ever involved
  (it is not in this fix — metadata is untouched).
- **Risk:** markdown content passing through `getSanitizedContentTranslations`.
  **Verified safe:** `sanitizeContent` only rewrites values containing `<` or
  `&lt;`; markdown (`### heading` + text) is plain text and passes through
  unchanged.
- **Rollback:** the change is confined to one file; `git revert` of the single
  commit restores the prior behavior. No data is mutated.

## Confidence

🟢 **High** — root cause confirmed against both databases and the rendering
code; the fix follows an existing in-repo pattern (`pricing.ts` localized
fallback) and is limited to one service file.
