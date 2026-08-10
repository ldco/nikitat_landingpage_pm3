# i18n — Database-Owned Translations (PM v2 Parity)

The framework is **language-agnostic**: adding a language is a config change plus
translations in the database — no server-code edits. This document describes the
runtime contract, the one-way pipeline, and the enforcement rules.

## 1. Runtime contract: the DATABASE is the owner

Every user-facing string resolves through the unified `t()` helper
(`src/lib/stores/content.svelte`), in this order:

1. **Database content translations** — seeded from `i18n/system-seed.json`
   (system/UI strings) + `src/project/content.json` (project content). The root
   layout initialises the store per request from the translations table, so
   **admin edits to the translations panel apply live** (within the 30s
   freshness cache).
2. **Compiled Paraglide catalog** — the fallback branch only. `messages/*.json`
   are generated from the same catalog (`npm run i18n:export`), so branch 1 and
   branch 2 never diverge.
3. **Explicit fallback value** passed as the second argument of `t()`.
4. **The key itself** as a last resort.

Components MUST use `t()` — direct imports of the Paraglide catalog
(`import * as m from '$lib/i18n'`) bypass the DB and are blocked by validator
**check #12** (the only sanctioned importer is `content.svelte.ts` itself).

## 2. One-way translation pipeline

```
i18n/system-seed.json        ← THE canonical, hand-edited catalog (ALL system
                                translations for EVERY configured locale).
        │
        ├── npm run db:seed ──► translations table (runtime source of truth,
        │                        admin-editable; t() checks the DB first)
        │
        └── npm run i18n:export ──► messages/{locale}.json  (GENERATED —
                                     Paraglide compile input, do not edit)
                                     project.inlang/settings.json (GENERATED —
                                     languageTags synced from LOCALES config)

src/project/content.json      ──► db:seed ──► translations table (project
                                              content: hero.*, about.*, …)
```

`messages/*.json` and `project.inlang/settings.json` are **generated artifacts**
— hand-editing them has no runtime effect (the DB wins) and the next
`npm run i18n:export` overwrites them.

## 3. Config-driven locales (single source of truth)

- `LOCALES` / `DEFAULT_LOCALE` live in `src/project/site-config.ts` and are
  re-exported through `src/lib/config/site.ts`.
- The shared server contract `src/lib/server/utils/locales.ts` derives
  `localeSchema` (Zod), `activeLocale`, `detectLocale` and
  `supportedLocalesText` from that config — request validation, locale
  detection and setup responses never hardcode a language list.
- RTL is auto-detected (`isRtlLocale` in `$lib/config/site`).

## 4. Adding a language (no code edits)

1. Add `{ code, iso, name }` to `PM_LOCALE_DATA` in `src/project/site-config.ts`.
2. Add translations to `i18n/system-seed.json` and `src/project/content.json`
   (the default locale must always be filled).
3. Run `npm run i18n:export` (regenerates messages + inlang settings) and
   `npm run db:seed`.

RTL is applied automatically; the admin panel, validation and setup responses
pick the new locale up from config.

## 5. Branding assets (not i18n)

Logo files resolve through the shared rule in `src/lib/utils/brand-logo.ts`
(`resolveBrandLogoLang`): direct locale match from `available`, else the
configured `assetLangFallback[lang]`, else the default locale. The map is a
**branding-asset** fallback (`{ fr: 'en', he: 'en' }`), not an i18n fallback,
and is defined once (`BRAND_ASSET_LANG_FALLBACK`) so header (`Logo.svelte`) and
footer (`MadeBy.svelte`, `SectionF22.svelte`) can never diverge.

## 6. Enforcement

| Check | What it enforces |
|-------|------------------|
| Validator #10 / #10b | No NEW user-facing string literals in `.svelte` / `src/app.html` / config surfaces (frozen baseline `scripts/i18n-literal-baseline.json`) |
| Validator #12 | No direct `import * as m from '$lib/i18n'` in components — text must go through `t()` |
| `npm run i18n:export` | Regenerates the Paraglide artifacts from the canonical catalog (one-way) |
| DB seed | Reads only `i18n/system-seed.json` + `src/project/content.json` — generated message files can never feed the DB |

Workflow for adding new UI text: `docs/contributing/i18n-literals-policy.md`.
Admin translation reads: `src/lib/server/db/translations-cache.ts` (the single
authoritative reader, with `DEFAULT_LOCALE` fallback for empty locales).
