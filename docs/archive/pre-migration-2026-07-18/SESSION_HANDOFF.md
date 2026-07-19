# Session Handoff: Migration Context

**Date:** 2026-07-18  
**Chat duration:** ~200 messages  
**Git tag:** `pre-migration-2026-07-18` (current codebase snapshot)  
**Created documents:** See `docs/migration/INDEX.md`  

---

## What Was Decided

### Stack
- **FROM:** Nuxt 4 (Vue 3) + Pure CSS + Nitro + SQLite  
- **TO:** SvelteKit (Svelte 5) + Tailwind CSS v4 + Drizzle ORM + SQLite  

### Philosophy
- The framework is being redesigned from **Human-First** to **AI-First**
- Key principles: Brutal Explicitness, Minimum Context Window, Standard Web APIs, Predictable Structure, Flat Over Nested, Security by Architecture
- Full manifesto: `PHILOSOPHY.md`

### Migration Structure — 4 Parts
1. **Part 1:** Full stack migration (Nuxt → SvelteKit) — old CSS preserved — 15 sprints
2. **Part 2:** CSS migration (Pure CSS → Tailwind) — 8 sprints
3. **Part 3:** Security hardening — 8 sprints
4. **Part 4:** Performance optimization — 8 sprints

### Key Architecture Decisions
- Svelte 5 runes (`$state`, `$derived`, `$effect`) — no Pinia
- Tailwind CSS — no custom CSS files (Part 2)
- Component hierarchy: `ui/` + `sections/` + `portfolios/` + `admin/` — simplified from 5-level atomic
- `typesafe-i18n` with DB loader (same pattern as current)
- Session-based auth + RBAC (same as current)
- Zod validation on all inputs
- `{ success: true, data }` API envelope
- GSAP + Three.js stay (framework-agnostic)
- Drizzle ORM + better-sqlite3 stay
- Security in one `hooks.server.ts` file
- Config file stays but slimmer

### What Carries Over From PM Framework
- Database-driven i18n (same `translations` table)
- Config-driven modules with enable/disable
- RBAC with hierarchy (master > admin > editor > user)
- API response envelope format
- Session-based auth
- GSAP + Three.js animations
- All 19 DB tables
- Seed data (translations, portfolio items, etc.)

### What Changes
- Nuxt → SvelteKit
- Pure CSS → Tailwind (Part 2)
- 5-level atomic → simplified component hierarchy
- Pinia → Svelte runes
- Nitro → SvelteKit `+server.ts`
- Framework = Website → Will separate later (post-migration)

---

## Documents Created (in docs/migration/)

| File | Purpose |
|------|---------|
| `INDEX.md` | Entry point, document map, key decisions |
| `PHILOSOPHY.md` | AI-First framework design principles (7 principles) |
| `CODEBASE_ANALYSIS.md` | Full analysis of current Nuxt/PM codebase |
| `ARCHITECTURE.md` | Target SvelteKit architecture |
| `COMPONENT_CATALOG.md` | All 51+ components mapped |
| `ROUTE_MAP.md` | All routes (public + admin + API) |
| `DATABASE_SCHEMA.md` | All 19 DB tables with relationships |
| `ROADMAP.json` | Machine-readable 4-part plan (39 sprints) |
| `ROADMAP.md` | Human-readable plan with timelines |
| `PART1_SPEC.md` | Detailed Part 1 spec (15 sprints, files, AC) |
| `STYLE_GUIDE.md` | AI-Driven development conventions |
| `SESSION_HANDOFF.md` | This file |

---

## What to Do Next (in order)

1. **Read this file** — you're reading it
2. **Read `INDEX.md`** — get the full document map
3. **Read `PHILOSOPHY.md`** — understand the design principles
4. **Read `ARCHITECTURE.md`** — understand the target structure
5. **Read `PART1_SPEC.md`** — understand what Sprint 1.1 needs
6. **Read `STYLE_GUIDE.md`** — understand how to write code
7. **Create new SvelteKit project** in a fresh directory
8. **Start Sprint 1.1** — scaffold + DB + config

---

## Status at Session End

- [x] Current codebase analyzed (500+ files, 77k LOC)
- [x] 4-part migration plan defined (39 sprints)
- [x] AI-First philosophy documented
- [x] Target architecture designed
- [x] Component catalog compiled
- [x] Route map created
- [x] Database schema documented
- [x] Style guide written
- [ ] Sprint 1.1 started
- [ ] New project directory created
- [ ] Any code written

---

## Nuxt → SvelteKit Quick Reference

| Nuxt Pattern | SvelteKit Equivalent |
|-------------|---------------------|
| `definePageMeta` | `+page.ts` export `load` + metadata |
| `useAsyncData` | `+page.server.ts` export `load` |
| `useFetch('/api/x')` | `fetch('/api/x')` or SvelteKit `load` |
| `useState` | Svelte 5 `$state` |
| `navigateTo` | `goto()` from `$app/navigation` |
| `useRoute` | `$page` from `$app/stores` |
| `app.config.ts` | `+layout.server.ts` load function |
| `server/api/*.get.ts` | `routes/api/*/+server.ts` export `GET` |
| `server/middleware/` | `hooks.server.ts` |
| `plugins/` | `hooks.server.ts` + vite plugins |
| `.vue` SFC | `.svelte` |
| `<script setup>` | `<script>` (with Svelte 5 runes) |
| `computed` | `$derived` |
| `watch` | `$effect` |
| `ref` | `$state` |
| Pinia store | `.svelte.ts` rune store |
| `@nuxtjs/i18n` | `typesafe-i18n` |
| `@nuxtjs/color-mode` | Custom theme `$state` + Tailwind `dark:` |
| `NuxtLink` | `<a>` or SvelteKit `<a>` |
| `defineProps` | `$props()` |
| `defineEmits` | Callbacks in props (optional) |
| `<slot>` | `{@render children()}` |
