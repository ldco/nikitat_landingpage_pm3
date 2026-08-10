# Framework Parity Determinations (Audit Tickets)

Determinations from the framework-level audit tickets (see `docs/traycer/Framework-Level_Audit__PM_v3_(SvelteKit)_vs_PM_v2_(Nuxt).md`), after code changes.

## Auth & UX Composable Gaps (`8b302035`)

| v2 composable | v3 status | Determination |
|---|---|---|
| `useAuth` / TOTP | `TwoFactorSetup.svelte`, `TwoFactorVerify.svelte`, `ChangePasswordModal.svelte` wired into `admin/login` + `admin/security` | **Present** (pre-existing untracked work) — verified wired to routes and API (`/api/user/2fa/*`) |
| `useCsrf` | `getCsrfToken` in `$lib/utils/auth.ts`, used by `$lib/api/client.ts` | **Present** — no action needed |
| `useFormDirty` | `createFormDirty` in `$lib/utils/form-dirty.svelte.ts` | **Extended** — added `guardNavigation()` (SPA `beforeNavigate` + `beforeunload` warn-on-navigate-away) and wired into 5 admin edit pages (blog/faq/features/portfolios/pricing) with save-button disable-when-clean |
| `useMediaQuery` | Tailwind responsive variants (`sm:`, `md:`, `lg:`, `xs:`, `header:`) + one-off `window.matchMedia` for reduced-motion | **Intentionally superseded** — Tailwind variants cover layout breakpoints; no runtime composable needed |
| `useA11y` | `$lib/utils/a11y.ts` (`checkA11y` via axe-core, dev-only) | **Present** |
| `usePerformance` | `$lib/utils/performance.ts` (`initPerformance`, `resetPerformance`, Web Vitals) | **Present** |

## Organism Parity (`f80e3cbf`)

| v2 organism | v3 location | Determination |
|---|---|---|
| `PricingTiers` | `SectionPricing.svelte` + `PricingCard.svelte` | **Folded into section** — present |
| `PricingComparison` | `molecules/PricingComparison.svelte` (new) | **Gap closed** — built as a molecule, wired into `SectionPricing` behind `MODULES.pricing.config.showComparison` |
| `BlogPostsGrid` | `SectionBlog.svelte` + `BlogPostCard.svelte` | **Folded into section** — present |
| `TeamGrid` | `SectionTeam.svelte` | **Folded into section** — present |
| `HeroAnimatedLogo` | `SectionHero.svelte` + `Logo.svelte` + `HeroParallaxScene` | **Folded into section** — present |
| `OnepagerThreeStoryScene` | `complex/OnepagerThreeStoryScene.svelte` | **Present** |

## i18n Runtime Parity (`f5bba1b7`)

### Cache invalidation — v3 improves on v2
- **v2**: `TranslationCache` with a fixed 5-minute TTL; requires explicit `invalidate()` / `invalidateAll()` after writes.
- **v3** (`src/lib/server/db/translations-cache.ts`): 30s freshness window + cheap `MAX(updated_at)` check on every TTL expiry — any write path self-heals on the next read even if it forgets to invalidate. `invalidateTranslationCache()` retained for seed/import flows. **Determination: v3 is strictly better** (self-healing, no restart required).

### Fallback chain — enforced
- Content store `t()` lookup chain: **DB translation → Paraglide message fallback → key itself** (never raw-empty).
- Service-layer fallback (blog/faq/features/pricing): `leftJoin` translation by **current locale**, falling back to base column when no row exists (`r.name ?? r.baseName`).
- Portfolio case-study headings: resolved **in the service layer** (`translateCaseStudyContent` in `src/lib/server/services/portfolio.ts`) against the locale's sanitized content translations (`getSanitizedContentTranslations`). Every `### ` heading is normalized to `portfolio.heading.<normalized>` (e.g. `Задача` → `portfolio.heading.задача`) and looked up in the DB translations table; unmapped headings render as-is. No hardcoded words in code — all heading mappings live in the database.

### `translateHeading()` — service-level contract
- `src/lib/server/services/portfolio.ts` owns the canonical portfolio translation contract:
  - `headingTranslationKey(heading)` — normalize a heading into `portfolio.heading.<normalized>`.
  - `translateHeading(heading, translations)` — resolve against a translations map, fall back to raw.
  - `translateCaseStudyContent(content, translations)` — translate all `### ` headings in case-study content.
- `locale` is threaded through every portfolio service function (`getHomepagePortfolioItems(locale)`, `getPublishedPortfolios(locale)`, `getPublishedPortfoliosPaginated(page, pageSize, locale)`, `getPortfolioBySlug(slug, locale)`) and through the consuming routes (`+page.server.ts`, `portfolio/+page.server.ts`, `portfolio/[slug]/+page.server.ts`, `api/portfolios/+server.ts`).
- `getPortfolioBySlug` returns case-study items with already-translated headings; `CaseStudyViewer.svelte` is a dumb renderer that consumes the normalized data and never derives translation keys itself.

### Translation joins — all locale-filtered
- `blog.ts`, `faq.ts`, `features.ts`: every translation join filters `eq(translation.locale, locale)` (already correct).
- `pricing.ts` **fixed**: `getHomepageTiers(locale)` now joins `pricingTierTranslations` (name/description/ctaText) by locale with base-field fallback; new `getTierFeatures(tierIds, locale)` joins `pricingFeatureTranslations` by locale with base-text fallback. Homepage load attaches translated features to tiers.
- `portfolio.ts`: no translation join tables — content is stored inline per row, so heading translation is applied at read time via `translateCaseStudyContent` against the locale's content-translations map (see above).
