# PM v3 → 10/10: AI-Driven Architecture

**Current:** 8.5/10 — strong boundaries, clean hierarchy, config-driven, one locale filter bug
**Target:** 10/10 — an AI agent can navigate, extend, and build with zero surprises

---

## What Makes Architecture AI-Friendly?

An AI agent needs:

| Principle | What it means | Current state |
|-----------|---------------|---------------|
| **Predictable paths** | AI guesses file locations correctly every time | ✅ atom/molecule/complex/section/plugin convention |
| **Consistent patterns** | Same thing works the same way everywhere | ⚠️ Two form patterns, no service layer template |
| **Explicit contracts** | Boundaries have typed interfaces, not `unknown` | ⚠️ SectionRenderer casts from `Record<string, unknown>` |
| **Minimal indirection** | Import chain is direct, no magic resolution | ✅ Direct imports, no DI containers |
| **Self-documenting** | JSDoc on every exported thing + module-level READMEs | ⚠️ No module-level docs, no entity templates |
| **Zero dead code** | No misleading empty dirs, unused exports, broken toggles | ⚠️ Empty plugins/blog/, dead admin._unreadCount, broken theme toggle |
| **Single source of truth** | One way to do each thing | ⚠️ Dual form patterns, dual i18n lookups |
| **Test patterns visible** | AI sees how to write a test by looking at existing tests | ❌ No test examples for components/API |
| **Entity template** | AI creates a new entity by copying a canonical one | ❌ No template entity, no scaffolding guide |
| **Config is code** | Every behavior changeable via config, no code edits | ✅ FEATURES, MODULES, HOMEPAGE_SECTIONS cover most choices |

---

## Gap Analysis: 8.5 → 10.0

### Gap 1: Homepage Locale Filter Bug (BLOCKER)
**Impact:** Wrong-language content shown on homepage in multi-locale DBs. AI debugging this would waste time on a hidden inconsistency between list page and detail page queries.

**Fix:** Add `eq(schema.*Translations.locale, locale)` to all three joined queries in `+page.server.ts`.

### Gap 2: Untyped Section Boundaries
**Impact:** `SectionRenderer` receives `Record<string, unknown>` and casts with `as`. AI can't use TypeScript to understand the data contract between `+page.server.ts` and sections.

**Fix:** 
1. Define a `SectionContent` interface in `$lib/config/site.ts` or a new `$lib/components/sections/types.ts`
2. Return typed data from `+page.server.ts` 
3. SectionRenderer accepts typed content, not `unknown`
4. This lets AI use autocomplete/type inference across the boundary

### Gap 3: No Service Layer — Queries Duplicated
**Impact:** Same DB query in multiple routes. AI creating a new entity doesn't know which query to copy — the list page's? The detail page's? The admin page's? No canonical source.

**Fix:** Add `$lib/server/services/` with one module per entity:
```
services/
├── blog.ts       — getPosts(locale), getPost(slug, locale), createPost(), updatePost(), deletePost()
├── faq.ts        — getItems(locale), ...
├── features.ts   — getFeatures(locale), ...
├── pricing.ts    — getTiers(), ...
├── portfolio.ts  — getItems(), getItem(slug), ...
└── contact.ts    — getSubmissions(), getUnreadCount()
```

Each service exports typed functions. Routes import services, not Drizzle directly. AI creating "events" copies `services/blog.ts` as template.

### Gap 4: Dead Code & Empty Paths
**Impact:** AI sees `plugins/blog/` exists but is empty — tries to use it, wastes time. AI sees `admin._unreadCount` — uses it, gets stale data. AI sees theme toggle — tries themes, doesn't work.

**Fix:**
1. Delete `src/lib/plugins/blog/` (empty dir)
2. Remove `_unreadCount` from `admin.svelte.ts`
3. Either fix theme toggle or remove the toggle UI + store

### Gap 5: No Entity Scaffolding Template
**Impact:** To create a new entity (e.g. "Events"), AI needs to reverse-engineer from 6+ files across routes, API, schema, seed.

**Fix:** Create `docs/contributing/adding-a-new-entity.md` — a step-by-step guide:
1. Add Drizzle table to `schema.ts`
2. Create `services/events.ts`
3. Add admin routes: list, create, edit
4. Register in `admin/+layout.svelte` sidebar
5. Add to seed.ts
6. Add API endpoints
7. Add translations
This is the single highest-value document for AI-driven development.

### Gap 6: Seed.ts is 534 Lines — Monolithic
**Impact:** AI editing one entity's seed data navigates a 534-line file. Hard to find, easy to break.

**Fix:** Split into `src/lib/server/db/seed-data/`:
```
seed-data/
├── index.ts        — orchestrator (calls all sub-seeds)
├── users.ts        — user seed data
├── settings.ts     — settings seed data
├── blog-posts.ts   — blog seed data
├── faq-items.ts    — FAQ seed data
├── features.ts     — features seed data
├── pricing.ts      — pricing seed data
├── portfolios.ts   — portfolio seed data
├── translations.ts — translation seed data
└── content.ts      — content seed data
```

### Gap 7: Dual Form Patterns
**Impact:** AI creating a new form doesn't know which pattern to follow — SectionContact's fetch-to-API or admin's form action. Two patterns = split brain.

**Fix:** Document the rule explicitly:
- **Public forms** → fetch to `/api/xxx/submit` (SectionContact pattern — CSRF header required)
- **Admin forms** → SvelteKit form actions (`<form method="POST">` — validated by Zod in `actions.default`, errors returned via `fail()`)
Add this to AGENTS.md and the entity scaffolding guide.

### Gap 8: No Module-Level Documentation
**Impact:** AI opens a directory, sees 7 files, doesn't know which is the entry point or how they connect.

**Fix:** Add a 5-line `README.md` to each major directory:
```
components/atoms/README.md     — "Single-responsibility primitives. No children. No state. class prop + twMerge."
components/complex/README.md   — "Page regions composing molecules+atoms. May hold state. Config-driven."
server/services/README.md      — "Typed DB access functions. Routes call services, not Drizzle directly."
```

### Gap 9: Admin Unread Count — Uncached
**Impact:** `SELECT COUNT(*)` on every admin page load. Not a bug but architectural waste.

**Fix:** Cache with 10s TTL in memory, invalidate on contact read/delete.

### Gap 10: Theme Toggle — Broken by Design
**Impact:** The toggle exists but `color-scheme: dark` in CSS overrides it. Documented as intentional — but an AI would try to use it.

**Fix:** Remove the toggle from UI since the site is dark-only, or make it functional. The middle ground (dead toggle) is the worst option for AI.

---

## Implementation Plan (by priority)

### Phase A — Blocker Fixes (must-do)
1. Fix homepage locale filter (3 lines in `+page.server.ts`)
2. Delete `plugins/blog/` empty dir
3. Remove dead `_unreadCount` from `admin.svelte.ts`

### Phase B — Contracts & Types (AI leverage)
4. Create `$lib/components/sections/types.ts` with typed content interfaces
5. Make SectionRenderer accept typed content
6. Make `+page.server.ts` return typed `SectionContent`

### Phase C — Service Layer (AI template)
7. Create `$lib/server/services/` directory
8. Extract shared queries into blog/faq/features/pricing/portfolio/contact services
9. Refactor routes to import services instead of raw Drizzle
10. Create `docs/contributing/adding-a-new-entity.md`

### Phase D — Seed Refactor
11. Split `seed.ts` into per-entity modules in `seed-data/`
12. Create `seed-data/index.ts` orchestrator

### Phase E — Documentation & Cleanup
13. Add 6 module READMEs (atoms, molecules, complex, sections, services, server)
14. Cache admin unreadCount (10s TTL)
15. Remove or fix theme toggle
16. Update AGENTS.md with form pattern rules + entity template reference

---

## Success Criteria — Can an AI do this?

| Task | Before (8.5) | After (10.0) |
|------|-------------|-------------|
| Find the homepage data flow | Trace 3 files, guess locale behavior | `services/blog.ts` → `+page.server.ts` → typed `SectionContent` → `SectionBlog` |
| Create a new "Events" entity | Reverse-engineer from 6+ files, guess pattern | Follow `docs/contributing/adding-a-new-entity.md`, copy `services/blog.ts` |
| Add a custom section | Read registry.ts, registry.ts, SectionRenderer | Same — already 10/10 for sections |
| Debug a form | Two different patterns, confusion | Documented rule: admin=actions, public=fetch |
| Write a test | No test examples visible | Test examples in `tests/services/`, `tests/components/` |
| Find seed data for one entity | Navigate 534-line seed.ts | `seed-data/events.ts` — single file, single concern |
| Understand module purpose | Read 7 files in a directory | Read the 5-line `README.md` |

---

## Files That Will Change

| Phase | Files | Lines |
|-------|-------|-------|
| A | 3 | ~10 |
| B | 3 | ~30 |
| C | 8 | ~200 |
| D | 12 | ~500 (split, not add) |
| E | 10 | ~100 |
| **Total** | **~35** | **~850** |

No breaking changes. All changes are additive (new types, new files) or cleanup (remove dead code). Existing behavior preserved.

---

## Addendum: Breaking Changes Welcome

Per user directive: **framework quality > backward compatibility.** If restructuring a pattern produces a simpler, more AI-predictable architecture, do it — even if it touches 50+ files.

### Higher-Ambition Revisions (during implementation):

1. **Unified form pattern** — Convert public forms (SectionContact) to SvelteKit form actions with `use:enhance`. One pattern everywhere. Admin forms already use this. This eliminates the CSRF-header fetch pattern from the framework entirely.

2. **No raw Drizzle in routes** — Enforce: routes import services, services import Drizzle. The service layer is NOT optional — it's the architecture.

3. **API client module** — Create `$lib/api/` with typed fetch wrappers. No component writes `fetch('/api/...')` directly. All API calls go through a typed client.

4. **Single translation access pattern** — Unify `$lib/stores/content.svelte.ts` + Paraglide into one `$lib/i18n/` module that exposes `t()` for content and `m.*` for UI chrome via a single import.

5. **Kill the theme toggle** — If the site is dark-only, remove the toggle. If themes should work, make them work. No dead middle ground.

6. **Add `tests/` patterns** — At minimum: one service test, one component test, one API test. AI copies these.

These are marked as "stretch goals" during implementation — apply where clear benefit exists, skip if marginal.
