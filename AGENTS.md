# FABRICA22 — Project Agent Guide

This project is built on **Puppet Master v3** (SvelteKit + Tailwind).
Load framework rules: `pm_knowledge topic=rules`
Load full framework reference: `pm_knowledge topic=all`

## Project-Specific Rules

### Colors (in `src/app.css` → `@theme`)
```css
--color-pm-brand: #901504;
--color-pm-brand-dark: #3b0902;
--color-pm-white: #fbf2e7;
```

### Site Config (`src/lib/config/site.ts`)
- `pmMode: 'build'` — production-like mode (TOTP_ENCRYPTION_KEY required at boot when 2FA enabled)
- `onepager: true` — single-page with anchor navigation
- Modules: portfolio, blog, pricing, faq, features enabled. team, testimonials, clients, contact disabled
- Admin: master user seeded, 2FA enabled (`FEATURES.twoFactorAuth: true`)

### Database
- SQLite at `data/sqlite.db`
- Seed: `npm run db:reset` (recreates DB + seeds)
- Schema: 31 tables, Drizzle ORM, identical to PM v2

### Commands
```
npm run dev        — dev server (port 5173)
npm run check      — TypeScript check
npm run build      — production build
npm run db:seed    — seed database
npm run db:reset   — reset + seed database
```

### i18n — No Untranslated Regressions (enforced)
Every user-facing string in framework/project UI files must come from the i18n
layer (`t('key')` or `m.*()`). The PM3 validator (check #10) fails on NEW
user-facing string literals in `.svelte` files / `src/app.html`, and check
#10b covers approved TS config surfaces that feed UI (`src/project/site-config.ts`
and anything added to `TS_CONFIG_SCAN_FILES`). The frozen inventory lives in
`scripts/i18n-literal-baseline.json`. Allowed exceptions and the workflow for
adding new UI text are documented in `docs/contributing/i18n-literals-policy.md`
(read it before adding any text). Never hardcode visible strings to "make it work".

## Framework Rules (from PM MCP server — always apply)

### Canonical Primitives — check before writing inline class bundles

Reusable visual patterns are Svelte components, NOT shared CSS classes. Before hand-rolling a common pattern inline, use the canonical primitive (see `docs/contributing/canonical-primitives.md` for the full registry):

| Pattern | Canonical primitive | Non-bypassable |
|---|---|---|
| Button (any variant/size) | `atoms/CtaButton.svelte` | Yes — never hand-roll `inline-flex ... rounded-md` button classes |
| Content width wrapper | `atoms/Container.svelte` / `molecules/SectionContent.svelte` | Yes — never `max-w-[var(--max-w-container)] mx-auto px-[var(--px-container)]` by hand |
| Section title heading | `molecules/SectionHeading.svelte` | Yes — never `text-[var(--heading-2)] font-black` by hand |
| Card visual | `atoms/Card.svelte` | Yes — never hand-roll `bg-pm-bg-elevated border ... rounded-[var(--radius-xl)]` bundles |
| Empty/loading/error states | `atoms/EmptyState.svelte`, `atoms/Loading*` | Yes |
| Section shell (id + reveal + bg) | `atoms/Section.svelte` | Yes — never raw `<section>` with reveal classes |

### A. Visual System

1. **Design Tokens — NO Raw Values:** Component markup uses direct token-reference bracket syntax: `[var(--token)]`, optionally wrapped in `calc()`/`min()`/`max()`/`clamp()` composed only of token references and unitless/safe operators (e.g. `h-[var(--h-header)]`, `pt-[calc(var(--h-header)+var(--space-8))]`). Bracket values may reference tokens from `@theme` or `@layer base :root` in `src/app.css`. FORBIDDEN: literal colors, literal px/rem/%/ch values in brackets (`text-[14px]`, `max-w-[800px]`), and mixing a token reference with an ad hoc literal that has not been promoted to a named token first. Before inventing any new token or bracket value, consult **`docs/design-tokens.md`** — the required first lookup step. There are NO token-bridge utility classes (`px-container`, `max-w-container`) — use the direct token-reference form instead.

2. **Tokens + Svelte Components ONLY:** Shared CSS in `src/app.css` is limited to design tokens (`@theme`, `@layer base`) plus framework-infrastructure-only exceptions (`@layer components`, keyframes, page transitions, browser fixes), each of which MUST carry an inline comment explaining why it cannot be expressed as inline Tailwind classes. Reusable visual patterns become Svelte components — never `@utility` classes (the only remaining `@utility` blocks are the browser-fix exceptions `min-h-dvh` and `backdrop-blur-glass`). BEM-style component CSS classes (`.btn-primary`, `.section-hero`) are FORBIDDEN. No `<style>` blocks in `.svelte` files.

3. **class prop + twMerge:** Every component that renders a visible root element accepts `class?: string` merged via `twMerge(clsx(baseClasses, className))`. Pure logic/slot/`<svelte:head>` components are exempt.

### B. Architecture

4. **Config-Driven Everything:** Import `FEATURES`, `MODULES` from `$lib/config/site`. Never hardcode feature flags or module visibility. Sections render from `HOMEPAGE_SECTIONS` enabled flags.

5. **Component Hierarchy:** `atoms/` (single responsibility, no children), `molecules/` (compose atoms, may hold state), `complex/` (page regions composing molecules+atoms), `sections/` (full-viewport region with `id` for anchor nav), `plugins/` (project overrides). Each file exports one default Svelte component.

> **SectionHero exception (audit N-8):** `SectionHero` is the ONLY section in `HOMEPAGE_SECTIONS` not in `SECTION_REGISTRY` — `Onepager.svelte` renders it directly (grid layout incompatible with the Section shell). Do NOT add it to the registry (double-render). Its project-specific parallax is prop-injected by Onepager (`parallaxComponent`/`parallaxIntro`), never imported inside the framework component (audit I-22).

6. **Route Contract:** `+layout.server.ts` loads global data (translations, legal docs, session). `+page.server.ts` loads page data with a typed `load`. `+page.svelte` receives `data` via `let { data } = $props()`. Components receive data via props — never fetch APIs internally except shared stores (settings, theme, content).

7. **Component Docs:** Every exported component has a JSDoc block: (1) one-line description, (2) `@props` listing all props with types/defaults, (3) `@example` minimal usage.

### C. Data & Behavior

8. **Loading/Empty/Error States:** Every data-dependent component handles four states: loading (`LoadingBase`/`LoadingCard`/`LoadingTable`/`LoadingText`), empty (i18n message or `EmptyState`), error (i18n message + retry), content. Never render content while `_loading` is true.

9. **Form Contract:** Every form follows: Zod schema → `$state` field bindings → CSRF token header → POST to API → `$state` for success/error/pending. `SectionContact.svelte` is the reference implementation. **Admin forms use SvelteKit form actions with Zod + `fail(400, { fieldErrors })`** — `sveltekit-superforms` is NOT used (dependency removed, audit I-21). The page component reads `$page.form.fieldErrors`; never return a plain `{ success: false }` object from an action.

10. **API Validation:** Every public POST/PUT/PATCH endpoint validates input with Zod. GET endpoints validate query params with Zod. Never trust client input.

11. **Error Contract:** All API errors return `{ success: false, error: { code, message } }`. HTTP status: 400 validation, 401 auth, 403 forbidden, 404 not found, 500 server. Never expose stack traces.

### D. Enforcement

12. **Pre-commit hook** (husky + lint-staged) runs the PM3 framework validator (`scripts/pm3-validator.mjs`) plus the existing checks. It blocks: duplicate token definitions, new `@utility` additions, unjustified `@layer components` additions, forbidden arbitrary bracket values, literal-value duplication (2+), canonical-primitive bypass, type suppressions (`@ts-ignore`, `!`), empty catch blocks, and missing Zod on API routes.

13. **No Empty Catches:** Every `catch` MUST log the error, re-throw with context, or return a typed error. `catch { /* ignore */ }` is FORBIDDEN.

Contribution to update MCP rules: `docs/contributing/pm-v3-style-rules.md`

### E. AI Development

1. **Adding a new entity** (events, case studies, etc.): follow `docs/contributing/adding-a-new-entity.md` — the canonical 7-step guide with a reference entity (blog) and a checklist.
2. **Service layer:** routes import `$lib/server/services/*`, never Drizzle directly. Each service owns the queries for one entity.
3. **Typed section contracts:** section content flows through `SectionContent` in `src/lib/components/sections/types.ts`. Never cast `Record<string, unknown>` at component boundaries.
4. **Locale filters:** every translation join MUST filter by the current locale — omitting it causes wrong-language content in multi-locale DBs (was a real bug).
5. **Form patterns:** admin forms use SvelteKit form actions (`<form method="POST">` + Zod + `fail()`); public forms fetch to `/api/<entity>/submit` with a CSRF header.
6. **Entity templates:** the blog entity (service + section + admin CRUD) is the canonical example — copy it for new entities.

Contribution to update MCP rules: `docs/contributing/pm-v3-style-rules.md`
