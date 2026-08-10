/**
 * Translation Classification Reference
 *
 * ONE-WAY PIPELINE (database is the runtime owner — PM v2 parity):
 *
 *   i18n/system-seed.json   ← THE canonical, hand-edited catalog.
 *                             Contains EVERY system translation (UI + admin +
 *                             settings) for EVERY configured locale. This is
 *                             the only file engineers edit for system text.
 *        │
 *        ├── npm run db:seed ──► translations table (runtime source of truth,
 *        │                         admin-editable; `t()` checks the DB first)
 *        │
 *        └── npm run i18n:export ──► messages/{locale}.json   (GENERATED —
 *                                     Paraglide compile input, do not edit)
 *                                     project.inlang/settings.json (GENERATED —
 *                                     languageTags synced from LOCALES config)
 *
 *   src/project/content.json ──► db:seed ──► translations table (project
 *                                             content: hero.*, about.*, …)
 *
 * Adding a language = 1) add {code, iso, name} to PM_LOCALE_DATA in
 * src/project/site-config.ts, 2) add translations to i18n/system-seed.json
 * (+ src/project/content.json), 3) run `npm run i18n:export` + `npm run db:seed`.
 * No server code changes — validation/detection read LOCALES via
 * `$lib/server/utils/locales`.
 *
 * Never edit messages/*.json by hand — the export script regenerates it from
 * system-seed.json.
 */

// Prefixes compiled into the Paraglide catalog (messages/*.json) — every key
// here is exposed as an `m.*()` function and used directly in components or
// as the fallback branch of `t()`. Admin-only labels are NOT in this list,
// so they stay out of the public client bundle and live in the DB only.
// Anything NOT in this list is classified as a DB-resident key.
export const PARAGLIDE_PREFIXES = [
  'common', 'nav', 'auth', 'error', 'validation',
  'cookies', 'theme', 'footer', 'sections', 'legal',
  'pricing', 'setup', 'init', 'apiErrors',
  'seo', 'cta', 'pagination', 'contact', 'blog', 'testimonials'
] as const
