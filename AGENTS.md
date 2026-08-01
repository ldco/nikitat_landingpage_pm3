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
- `pmMode: 'develop'` — development mode (seeded DB)
- `onepager: true` — single-page with anchor navigation
- Modules: portfolio, blog, pricing, faq, features enabled. team, testimonials, clients, contact disabled
- Admin: master user seeded, 2FA disabled

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

## Framework Rules (from PM MCP server — always apply)

### A. Visual System

1. **Design Tokens — NO Raw Values:** Use named utilities (`text-fluid-*`, `max-w-container`, `px-container`) when they exist. Bracket syntax `[var(--token)]` is acceptable ONLY when referencing a CSS design token from `@theme`. Raw values (`text-[14px]`, `max-w-[800px]`, `pt-[calc(...)]`) are FORBIDDEN.

2. **Tailwind Utilities ONLY:** All component styling uses Tailwind utility classes + design tokens. Reusable multi-property patterns become `@utility` directives in `app.css` (e.g. `focus-card`, `contact-card`). `@layer components` is reserved for framework infrastructure ONLY (page transitions, theme icons, hamburger). BEM-style component CSS classes (`.btn-primary`, `.section-hero`) are FORBIDDEN. No `<style>` blocks in `.svelte` files.

3. **class prop + twMerge:** Every component that renders a visible root element accepts `class?: string` merged via `twMerge(clsx(baseClasses, className))`. Pure logic/slot/`<svelte:head>` components are exempt.

### B. Architecture

4. **Config-Driven Everything:** Import `FEATURES`, `MODULES` from `$lib/config/site`. Never hardcode feature flags or module visibility. Sections render from `HOMEPAGE_SECTIONS` enabled flags.

5. **Component Hierarchy:** `atoms/` (single responsibility, no children), `molecules/` (compose atoms, may hold state), `complex/` (page regions composing molecules+atoms), `sections/` (full-viewport region with `id` for anchor nav), `plugins/` (project overrides). Each file exports one default Svelte component.

6. **Route Contract:** `+layout.server.ts` loads global data (translations, legal docs, session). `+page.server.ts` loads page data with a typed `load`. `+page.svelte` receives `data` via `let { data } = $props()`. Components receive data via props — never fetch APIs internally except shared stores (settings, theme, content).

7. **Component Docs:** Every exported component has a JSDoc block: (1) one-line description, (2) `@props` listing all props with types/defaults, (3) `@example` minimal usage.

### C. Data & Behavior

8. **Loading/Empty/Error States:** Every data-dependent component handles four states: loading (`LoadingBase`/`LoadingCard`/`LoadingTable`/`LoadingText`), empty (i18n message or `EmptyState`), error (i18n message + retry), content. Never render content while `_loading` is true.

9. **Form Contract:** Every form follows: Zod schema → `$state` field bindings → CSRF token header → POST to API → `$state` for success/error/pending. `SectionContact.svelte` is the reference implementation.

10. **API Validation:** Every public POST/PUT/PATCH endpoint validates input with Zod. GET endpoints validate query params with Zod. Never trust client input.

11. **Error Contract:** All API errors return `{ success: false, error: { code, message } }`. HTTP status: 400 validation, 401 auth, 403 forbidden, 404 not found, 500 server. Never expose stack traces.

### D. Enforcement

12. **Pre-commit hook** blocks: arbitrary CSS values, type suppressions (`@ts-ignore`, `!`), empty catch blocks, and missing Zod on API routes.

13. **No Empty Catches:** Every `catch` MUST log the error, re-throw with context, or return a typed error. `catch { /* ignore */ }` is FORBIDDEN.

Contribution to update MCP rules: `docs/contributing/pm-v3-style-rules.md`
