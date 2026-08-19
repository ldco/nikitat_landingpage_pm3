# Portfolio & Site Content Translation Backfill

## Status: Implemented

> Implementation notes (deviations from the proposal):
> - The authored source is `src/project/portfolio-translations.json` (35 branding
>   items × ru/en/fr/he, `items.<id>.<field>.<locale>` — markdown bodies). ru
>   bodies were reconstructed from the en/fr/he rows (Russian prose) with the
>   `### ` headings restored to Russian; en/fr/he bodies are newly authored
>   translations.
> - `scripts/import-portfolio-translations.ts` writes ru → `portfolio_items.content`
>   columns (only when the column is sparse — never overwrites a populated value)
>   and en/fr/he → `portfolio_item.<id>.<field>` translation rows via
>   `setTranslations()` (customized, cache invalidated). Wired as
>   `npm run import:portfolio-translations`.
> - **Review-hardened import contract** (post local-review): the script is
>   non-destructive by default — a populated ru column and any en/fr/he row that
>   differs from the source (an editor edit) are preserved and reported; only
>   missing rows are created. `--force` overwrites differing rows (the initial
>   materialization path). `--dry-run` prints the plan. A pre-pass validates
>   every item id exists, belongs to a branding portfolio, and every locale/field
>   is allowlisted before any write; writes are batched per locale (one
>   transaction per locale). Field/key names derive from
>   `PORTFOLIO_ITEM_LOCALIZED_FIELDS` (no hardcoded key scheme).
> - Item 5 (NuTao) has no body in ANY locale (no source content exists in the DB
>   or the PM2 snapshot) — skipped, consistent across all locales.
> - ADR-003 (case-study heading catalog): not needed — the 5 case-study items
>   carry plain prose, no `### ` headings; the authored branding bodies carry
>   their headings inline per locale, which `translateCaseStudyContent` leaves
>   intact (no `portfolio.heading.*` lookup collision).
> - Phase 0 hint implemented: `admin.defaultLocaleHint` added to
>   `i18n/system-seed.json` (4 locales), the `admin-route-keys` registries for
>   both portfolio routes, and seeded into the live DB; both editors show the
>   hint above the locale tabs.
> - **DEPLOYMENT NOTE (import):** the import is a manual one-shot against a
>   production-content DB — neither `scripts/import-portfolio-translations.ts`
>   nor `src/project/portfolio-translations.json` is shipped in the Docker
>   runtime image (only `content.json`/`system-seed.json` are), and nothing in
>   `deploy.sh`/`docker-entrypoint.sh` invokes it. After deploying, run
>   `npm run import:portfolio-translations` against the production DB (from a
>   checkout that carries the source JSON). Fixture/`db:reset` DBs are
>   unimportable by design: their auto-increment item ids (1–5) collide with
>   the production ids in the source and include non-branding items, so the
>   pre-pass's branding-type check hard-aborts and `--skip-missing` does NOT
>   downgrade it — only a DB that already carries the production catalog but is
>   missing a few ids can use `--skip-missing` (warn+skip) or
>   `--items=<ids>` + `--force` (re-materialize specific items without
>   clobbering editor edits elsewhere).
> - **DEPLOYMENT NOTE (admin hint):** `admin.*` keys are DB-only (excluded from
>   the Paraglide catalog), so `admin.defaultLocaleHint` must exist as a
>   translation row or the admin editors render the literal key. It is in
>   `i18n/system-seed.json`, so the production boot translation sync
>   (`PM_SYNC_TRANSLATIONS_ON_BOOT=1` default, `scripts/docker-entrypoint.sh`)
>   materializes it; deployments that disable that sync must run
>   `db:seed`/`sync-translations` or seed the row manually. The same applies to
>   every `admin.*` key (established pattern).
> - KNOWN FOLLOW-UP (pre-existing, out of scope): website items 48+ have
>   English `content` columns; the existing `ru` translation rows for those items
>   are shadowed by `localizeField`'s column-first rule for the default locale.
>   Fixing ru rendering there requires translating the columns or extending the
>   import with a ru row→column pass — deferred intentionally.

## Problem statement

The portfolio admin surfaces expose three symptoms that share one underlying
truth: **the multilingual portfolio content is incomplete in the database**,
and the admin-facing editors make the incomplete state confusing.

1. No "Русский" tab in the portfolio localized-text editor (only English /
   Français / עברית).
2. An empty, apparently unused `Content` textarea in the item editor.
3. `<h2>admin.localizedText</h2>` renders as a raw key instead of text.

The deeper, user-visible defect: **Russian portfolio content is largely absent
and the non-Russian bodies are untranslated Russian prose.** The site is
nominally quad-lingual (`ru/en/fr/he`) but the portfolio content does not
actually render in all four languages.

## Root cause (verified against data + code)

### Symptom 1 — "No Russian option": default-locale design, not a bug

- `src/project/site-config.ts` defines `PM_LOCALE_DATA = [ru, en, fr, he]` and
  `DEFAULT_LOCALE = PM_LOCALE_DATA[0].code` = `ru`.
- Both editors compute `nonDefaultLocales = LOCALES.filter(l => l !== DEFAULT_LOCALE)`
  → `[en, fr, he]`, which `AdminLocaleTextFields.svelte` renders as tabs.
- Russian is intentionally **column-backed** (ADR-003 in
  `docs/plans/portfolio-multilingual-media-fix.md`): the base fields
  (`Name`, `Description`, `Content`, `Title`, `Category`) edit the `ru`
  columns. The localized-text section holds overrides for the *other* locales.
- **Nothing is hardcoded** — the exclusion is `DEFAULT_LOCALE` filtering.
  The only defect is that the base fields are not labeled as the Russian
  (default-locale) values, so an editor cannot tell they are Russian.

### Symptom 2 — Empty "Content" textarea: NULL column, not a styling gap

- The field is `BrandingFields.svelte` (`name="content"`, `rows=8`) — the
  default-locale long-form body bound to `portfolio_items.content`. It is a
  canonical `FormField` (fully themed).
- It is empty because **36 branding items have `content = NULL`** (imported
  verbatim from PM2). Their rich markdown body (`### Overview …`) exists only in
  the en/fr/he `portfolio_item.<id>.content` translation rows, never in the
  `ru` column nor in `ru` translation rows.

### Symptom 3 — `admin.localizedText` raw key: stale in-memory cache

- The key is present in the DB (all 4 locales), in `i18n/system-seed.json`
  (all 4 locales), and in `admin-route-keys.ts` for both portfolio routes.
- `admin.*` keys are **DB-only** (excluded from Paraglide `messages/*.json` by
  `scripts/export-paraglide-messages.ts`). The admin shell resolves them via
  `getAdminTranslations()` → `data.t`, backed by an in-memory cache
  (`translations-cache.ts`, 30s `MAX(updated_at)` freshness TTL).
- The raw key means the running dev server's cache predates the key being
  seeded (commit `1b28b38`). **Fix: restart the dev server** (no code change);
  the freshness check self-heals within the TTL.

## Gap analysis (measured against `data/sqlite.db`)

| Content | ru | en | fr | he | Verdict |
|---|---|---|---|---|---|
| System/UI (`admin.*`, `common.*`, `nav.*`, `hero.*`, `seo.*`, …) | 465 | 465 | 465 | 465 | Complete |
| Homepage (`about/focus/f22/contact/cookies/…`, from `content.json`) | ✅ | ✅ | ✅ | ✅ | Complete |
| `portfolio.<id>.name` / `.description` | 0 (column) | 10 | 10 | 10 | ru OK via columns |
| `portfolio_item.<id>.title` | **7** | 54 | 54 | 54 | ❌ ru gap |
| `portfolio_item.<id>.description` | **28** | 54 | 75 | 75 | ❌ ru gap |
| `portfolio_item.<id>.content` | **28** | 74 | 74 | 74 | ❌ ru gap |
| `portfolio_item.<id>.category` | **39** | 75 | 75 | 75 | ❌ ru gap |
| `portfolio.heading.*` (case-study headings) | 2 | 2 | 2 | 2 | ⚠️ ~40 unmapped |

Column nulls by portfolio type:

| type | items | NULL `content` |
|---|---|---|
| branding | 36 | 36 |
| case_study | 5 | 0 |
| website | 34 | 0 |

Two distinct defects:

1. **Russian (default) is incomplete.** The 36 branding items have no Russian
   body (column NULL, no `ru` translation row); ~8 items also lack `ru` content
   rows entirely. Russian visitors see no rich body.
2. **en/fr/he bodies are Russian prose.** At import, only the `### ` section
   headings were localized; the body text is the Russian source verbatim. To be
   genuinely quad-lingual, the bodies must be translated into each locale.

## Decisions (ADR)

### ADR-001: Keep the default-column / override-row storage split

**Status:** Proposed

**Context:** The hydration layer (`localizeField` in
`src/lib/server/services/portfolio.ts`) already implements: default locale
(`ru`) → column-first, translation-row-as-fallback; other locales →
translation-row-first, column-fallback. Both admin editors already write this
shape. Any translation work must not fork the data model.

**Decision:** Russian content is written to the base columns
(`portfolios.name/description`, `portfolio_items.title/description/content/category`);
en/fr/he content is written to the `translations` table
(`portfolio.<id>.*`, `portfolio_item.<id>.*`). No schema migration, no service
change.

**Options considered:**
1. **Keep the split (chosen)** — zero migration, consistent with existing
   hydration + admin editors. Con: two write surfaces (columns + rows).
2. **Store ru in translation rows too** — uniform, but contradicts the existing
   column-ownership contract and would make the admin base fields diverge from
   the rendered value. Rejected.
3. **New per-entity translation tables** — cleaner relational model, but a
   migration + service rewrite for no functional gain. Rejected (redundant work).

### ADR-002: Bulk import via a curated JSON + idempotent script

**Status:** Proposed

**Context:** The gap is ~150+ Russian rows plus real translations of 36 item
bodies × 3 locales. Manual entry through the admin editors is impractical and
error-prone. The PM2 import already established a scripted bulk path
(`scripts/import-pm2-content.ts`), and `setTranslations()` /
`setTranslation()` provide editor-owned bulk writes.

**Decision:** Add a hand-edited translation source
`src/project/portfolio-translations.json` (per-id, per-locale) plus an
idempotent import script that writes ru → columns and en/fr/he → translation
rows via `setTranslations()` (marked `customized: true`, content cache
invalidated after each write). The JSON is the canonical authored source; the
script is re-runnable.

**Options considered:**
1. **Curated JSON + script (chosen)** — deterministic, diffable, re-runnable,
   survives `db:reset`.
2. **Manual admin entry** — no code, but O(36×4×4) edits, impossible to review
   or roll back. Rejected.
3. **Extend `src/project/content.json`** — that file is flattened static
   homepage content with backfill-only (never-overwrite) seed semantics; it
   cannot express per-id dynamic rows or overwrite the imported Russian prose.
   Rejected.

### ADR-003: Complete the `portfolio.heading.*` case-study catalog

**Status:** Proposed

**Context:** `HEADING_KEY_MAP` (portfolio.ts) maps ~40 Cyrillic headings to
latin keys, but only 2 `portfolio.heading.*` keys are translated per locale.
Case-study bodies therefore render raw Cyrillic headings in en/fr/he.

**Decision:** Enumerate the distinct `### ` headings actually present in the
5 case-study items, map them via `headingTranslationKey()`, and author the
`portfolio.heading.<key>` translation for every active locale. These are
CONTENT keys (editor-owned), written through the same import script.

## Implementation plan

### Phase 0 — Bug triage (no or minimal code)

1. Restart the dev server so the `translations-cache` reloads
   `admin.localizedText` (and any other post-seed keys). Verify the section
   heading renders `Тексты на других языках` / `Text in other languages`.
2. (Optional, recommended) Add an explicit default-locale hint to the base
   fields region in `PortfolioItemEditor.svelte` and
   `admin/portfolios/[id]/edit/+page.svelte` — e.g. an `AdminFormSection` label
   or hint text "Русский (default)" sourced from a new i18n key
   (`admin.defaultLocaleHint`), added to `i18n/system-seed.json` + the route-key
   registries. This resolves the "no Russian option" confusion without
   restructuring the editor.

### Phase 1 — Restore Russian (default-locale) content

1. Extract the canonical Russian body for each of the 36 branding items. The
   Russian prose already exists in the en/fr/he `portfolio_item.<id>.content`
   rows; the import script (or a one-off extraction) reconstructs the Russian
   body by re-localizing the `### ` headings back to Russian (deterministic via
   `HEADING_KEY_MAP`).
2. Write `portfolio_items.content` (and any missing title/description/category)
   for the affected items. The authoring source is
   `src/project/portfolio-translations.json` (locale `ru`).
3. Verify no item whose `content` column is already populated is overwritten
   (case_study/website items keep their existing column value).

### Phase 2 — Translate en/fr/he

1. Author `src/project/portfolio-translations.json` with the translated
   `title` / `description` / `content` / `category` (and `portfolio.name` /
   `.description` where an override is wanted) for en, fr, he. This is the
   human-translation step; the Russian value is the source of truth.
2. Author the `portfolio.heading.*` translations for the distinct case-study
   headings (ADR-003).

### Phase 3 — Import + verify

1. Add `scripts/import-portfolio-translations.ts`: reads the JSON, writes
   ru → columns (Drizzle update via `useDatabase()` + schema) and en/fr/he →
   `setTranslations()`; `invalidateContentCache()` after each write; idempotent
   (safe to re-run).
2. Wire a package.json script (`npm run import:portfolio-translations`).
3. Document the JSON schema at the top of the file (per-id keyed map, field
   allowlist, locale allowlist matching `LOCALES`).

### Files touched

- `src/project/portfolio-translations.json` (new — authored source)
- `scripts/import-portfolio-translations.ts` (new — import)
- `package.json` (script entry)
- `i18n/system-seed.json` (only if Phase-0 hint key is added)
- `src/lib/components/admin/PortfolioItemEditor.svelte` + `[id]/edit/+page.svelte`
  (only if Phase-0 hint is added)
- `src/lib/server/admin-route-keys.ts` (only if Phase-0 hint key is added)

### Files NOT touched

- `src/lib/server/services/portfolio.ts` (hydration already correct)
- Schema / migrations (no new tables/columns)
- `AdminLocaleTextFields.svelte` (already generic)
- Viewers (`BrandingViewer`, `WebsiteViewer`, `CaseStudyViewer`, `BrandbookViewer`)

## Verification checklist

- [ ] Restart dev server → `admin.localizedText` renders localized text on both
      portfolio edit and items pages.
- [ ] (If added) base fields show a "Русский (default)" hint; new key present in
      all 4 locales and in the route-key registry (drift-guard test passes).
- [ ] `npm run import:portfolio-translations` completes; re-running it is a no-op.
- [ ] Public `ru` portfolio detail pages render branding item bodies (no empty
      content section).
- [ ] Public `en`/`fr`/`he` detail pages render translated bodies and headings
      (no Russian prose, no raw Cyrillic `### ` headings).
- [ ] `npm run check` — TypeScript clean.
- [ ] `npm run test` — existing portfolio service/viewer/editor + admin-route-keys
      tests pass.
- [ ] `npm run validate:pm3` — i18n-literal and canonical-primitive checks pass
      (new hint key must follow `docs/contributing/i18n-literals-policy.md`).

## Risks & rollback

- **Risk:** import overwrites an editor-authored translation. **Mitigation:**
  the import only writes rows/columns listed in the authored JSON; ru column
  writes skip already-populated columns; en/fr/he writes are keyed per-id and
  marked `customized: true` (catalog sync never reverts them).
- **Risk:** Russian prose extracted from en/fr/he rows carries localized
  headings. **Mitigation:** re-localize headings via `HEADING_KEY_MAP` and
  diff the result against the PM2 source snapshot
  (`data/import/from-production/sqlite.db`) where available.
- **Rollback:** the import is additive; `git revert` of the JSON/script plus a
  targeted SQL delete of the imported translation rows (or re-running the
  import with a corrected JSON) restores the prior state. No migration to roll
  back.

## Confidence

🟢 **High** — root causes are verified against the DB, the seed catalogs, the
route-key registry, and the hydration code. The storage/write model reuses
already-implemented paths (`setTranslations`, column updates) with no schema
change.

🟡 **Medium** — the exact human-translation content (Phase 2) is not yet
authored; the plan defines the pipeline and the source of truth, but the
translated strings themselves are a separate authoring task.
