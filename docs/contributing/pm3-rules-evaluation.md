# PM3 Rules Evaluation — AI-Driven Web Development 2026

## Evaluation Legend
- ✅ **Keep as-is** — Rule is correct and well-scoped
- ⚠️ **Refine** — Rule is correct in intent but needs scoping/clarification
- 🔴 **Replace** — Rule is harmful or contradictory, needs rewrite
- ✨ **Add** — Critical rule missing from current set

---

## ⚠️ Rule 1: "Design Tokens — NO Arbitrary Values"

**Current text:**
> `text-[...]`, `max-w-[...]`, `pt-[calc(...)]` FORBIDDEN. Use `text-fluid-*`, `max-w-container`, `pt-[var(--pt-section)]`.

**AI evaluation:** ✅ Intent is CORRECT. Named tokens create a learnable design language that AI can reason about. An AI that sees `text-fluid-hero` knows it's the hero heading scale. An AI that sees `text-[clamp(2.5rem,6vw,4.5rem)]` has no semantic reference.

**Problem:** The rule is self-contradictory. `pt-[var(--pt-section)]` IS bracket syntax — but it references a token. The rule as written would forbid it. The codebase uses `text-[var(--section-heading)]`, `mb-[var(--space-8)]` everywhere.

**Recommendation:** ⚠️ **REFINE**
> Use named utility classes (`text-fluid-base`, `max-w-container`) when a named utility exists. Bracket syntax `[var(--token)]` is acceptable ONLY when referencing a CSS design token. Raw values (`[14px]`, `[800px]`, `[calc(...)]`) are FORBIDDEN.

---

## ⚠️ Rule 2: "Tailwind Utilities ONLY"

**Current text:**
> NO `<style>` blocks. NO global CSS classes.

**AI evaluation:** ✅ Intent is CORRECT. Styles co-located in components via Tailwind utilities make AI reasoning deterministic — the AI reads one file and understands all styling. No chasing CSS across files.

**Problem 1:** The rule says "NO global CSS classes" but the framework itself uses 45 global CSS classes (`.page-*` transitions, `.theme-icon-*`, `.hamburger`, `.theme-toggle`). This creates a double standard that confuses AI.

**Problem 2:** `@utility` directives in `app.css` ARE global — they're just Tailwind-managed instead of CSS-managed. The rule needs to distinguish between BEM component classes (`.btn-primary`, `.focus-card`) which are FORBIDDEN, and framework infrastructure (page transitions, keyframe hooks) which are ACCEPTABLE.

**Problem 3:** `@layer components` is the correct location for animation hooks and complex CSS that can't be expressed as Tailwind utilities. Banning it entirely is over-restrictive.

**Recommendation:** ⚠️ **REFINE**
> Components express all styling via Tailwind utilities + design tokens. Reusable patterns become `@utility` directives in `app.css`. `@layer components` is reserved for framework infrastructure: page transitions, keyframe animation hooks, theme icon effects. BEM-style component CSS classes (`.btn-primary`, `.section-hero`) are FORBIDDEN. No `<style>` blocks in `.svelte` files.

---

## ⚠️ Rule 3: "class prop + twMerge on EVERY component"

**Current text:**
> class prop + twMerge on EVERY component.

**AI evaluation:** ✅ Intent is CORRECT. A universal extensibility contract means AI can compose any component without knowing its internals. `twMerge` prevents style conflicts when AI composes components.

**Problem:** "EVERY component" is too broad. Utility components that emit no root element (e.g., `<svelte:head>`, pure logic components) don't need class props. The rule wastes AI effort on components that can't be styled.

**Codebase audit:** All components WITH `$props()` already have class props. 0 violations found. Rule is followed but scoping is imprecise.

**Recommendation:** ⚠️ **REFINE**
> Every component that renders a visible root element accepts a `class?: string` prop merged via `twMerge(clsx(baseClasses, className))`. Pure logic/slot/head components are exempt.

---

## ✅ Rule 4: "Config-Driven Everything"

**Current text:**
> import `FEATURES`, `MODULES` from `$lib/config/site`.

**AI evaluation:** ✅ CORRECT. No changes needed. Config-driven architecture is the single most important rule for AI development. When features are gated by `FEATURES.portfolio`, `MODULES.blog`, an AI can:
- Determine project scope from one file
- Generate conditionally appropriate code
- Know what's enabled without scanning all routes

---

## ✅ Rule 5: "Pre-commit hook blocks arbitrary values"

**Current text:**
> Pre-commit hook blocks arbitrary values automatically.

**AI evaluation:** ✅ CORRECT. Automated enforcement is essential for AI-generated code. The hook catches what AI misses.

---

## ✨ Rule 6: Component Architecture Contract [MISSING]

**Current state:** No explicit component architecture rule. Components are organized into `atoms/`, `molecules/`, `complex/`, `sections/`, `plugins/` but there's no documented contract.

**AI needs:**
- Atom: Single responsibility, no child components, always accepts `class` prop
- Molecule: Composes 2+ atoms, may have internal state
- Complex/Organism: Page-level composition of molecules + atoms
- Section: Full-viewport section with `id` attribute for anchor navigation
- Plugin: Project-specific override of a framework component

**Recommendation:** ✨ **ADD**
> Components follow atomic hierarchy: `atoms/` (no children), `molecules/` (compose atoms), `complex/` (page regions), `sections/` (full-viewport with `id` attr), `plugins/` (project overrides). Every component file exports a single default Svelte component.

---

## ✨ Rule 7: Data Contract — Loading/Empty/Error States [MISSING]

**Current state:** PM3 has `LoadingBase`, `LoadingCard`, `LoadingTable`, `LoadingText` components but no enforced pattern for using them.

**AI needs:** A deterministic pattern for data-dependent components. AI must know:
1. When data is loading → show Loading component
2. When data is empty → show EmptyState with i18n message
3. When data errors → show error with retry option
4. When data loads → show content

**Recommendation:** ✨ **ADD**
> Every data-dependent component handles four states: loading (`Loading*` atom), empty (`m.common_note()` or `EmptyState`), error (i18n error message + retry), and content. Use `{#await}` or `$derived` guards — never render content while `_loading` is true.

---

## ✨ Rule 8: Form Contract [MISSING]

**Current state:** The contact form uses a hand-written pattern. Other forms (admin CRUD) use different patterns. No Zod validation on public endpoints.

**AI needs:** A single, deterministic form pattern:
1. Define Zod schema
2. Bind form fields to `$state`
3. Validate on submit
4. POST to API with CSRF
5. Handle success/error in `$state`

**Recommendation:** ✨ **ADD**
> Every form follows: Zod schema validation → `$state` field bindings → CSRF token in header → `POST` to API → `$state` for success/error/pending. Contact form is the reference implementation. Admin forms follow the same pattern.

---

## 🔴 Rule 9: "No empty catch blocks" [UNDER-ENFORCED]

**Current state:** 18 empty catch blocks in codebase. Engineering rules forbid them, but the codebase has them.

**AI evaluation:** ✅ Rule is CORRECT. Empty catches hide errors from AI debugging. But enforcement is weak.

**Recommendation:** ⚠️ **REFINE** (enforcement)
> Every `catch` block MUST either: (1) log the error, (2) re-throw with context, or (3) return a typed error result. `catch { /* ignore */ }` is FORBIDDEN. Pre-commit hook should scan for empty catch blocks.

---

## ✨ Rule 10: Route Contract — Server Load Type [MISSING]

**Current state:** Some routes have `+page.server.ts`, others don't. Data loading patterns vary.

**AI needs:** A consistent contract for how data reaches pages:
1. `+layout.server.ts` loads global data (translations, legal docs, session)
2. `+page.server.ts` loads page-specific data
3. `+page.svelte` receives typed `data` from server load
4. Components receive data via props, NOT by calling APIs internally

**Recommendation:** ✨ **ADD**
> Every route that needs data has a `+page.server.ts` with a typed `load` function. `+page.svelte` receives `data` via `let { data } = $props()`. Components receive data via props — never call APIs internally (except stores for global data like settings/themes).

---

## ✨ Rule 11: Zod on ALL Public Endpoints [MISSING]

**Current state:** Contact form uses Zod. Settings, features, FAQ, portfolios, pricing DO NOT. 9 public endpoints without input validation.

**AI evaluation:** This is a SECURITY HOLE for AI-generated code. If AI generates a new endpoint without Zod, bad inputs pass through.

**Recommendation:** ✨ **ADD**
> Every public POST/PUT/PATCH endpoint validates input with Zod. `GET` endpoints validate query params with Zod. Pre-commit hook should flag `.safeParse` absence in `+server.ts` files.

---

## ✨ Rule 12: Error Response Contract [MISSING]

**Current state:** Some endpoints return `{ success: false, error: { code, message } }`, others throw `error(500, "message")`.

**AI needs:** A single error format that AI can generate for any endpoint.

**Recommendation:** ✨ **ADD**
> All API errors return `{ success: false, error: { code: string, message: string } }`. HTTP status codes follow REST: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 500 (server). Never expose stack traces in error responses.

---

## ✨ Rule 13: Component Documentation Contract [MISSING]

**Current state:** No component documentation standard. Some have JSDoc, most don't.

**AI needs:** Every component MUST document: what it renders, what props it accepts, and how to compose it.

**Recommendation:** ✨ **ADD**
> Every exported component has a JSDoc comment: (1) one-line description, (2) `@props` listing all props with types and defaults, (3) `@example` showing minimal usage. AI uses this to generate correct component composition.

**✅ Now ENFORCED:** `scripts/pm3-validator.mjs` check #13 fails on any exported component under `src/lib/components/**` or `src/project/**` missing a description, `@props` or `@example` (AGENTS.md rule 7).

---

## Summary

| # | Rule | Verdict |
|---|------|---------|
| 1 | Design Tokens — NO Arbitrary Values | ⚠️ Refine (allow `[var(--token)]`, ban raw values) |
| 2 | Tailwind Utilities ONLY | ⚠️ Refine (scope what's allowed: BEM = no, framework = yes) |
| 3 | class prop + twMerge on EVERY component | ⚠️ Refine (scope to visible-root components) |
| 4 | Config-Driven Everything | ✅ Keep |
| 5 | Pre-commit hook | ✅ Keep |
| 6 | Component Architecture Contract | ✨ ADD |
| 7 | Loading/Empty/Error State Pattern | ✨ ADD |
| 8 | Form Contract | ✨ ADD |
| 9 | No empty catch blocks | ⚠️ Refine (enforce) |
| 10 | Route Contract — Server Load Type | ✨ ADD |
| 11 | Zod on ALL Public Endpoints | ✨ ADD |
| 12 | Error Response Contract | ✨ ADD |
| 13 | Component Documentation Contract | ✨ ADD → ✅ ENFORCED (validator check #13) |

**Current rules: 5 (all need at least scoping refinement)**
**Missing rules: 8**
**Total framework rules: 13**
