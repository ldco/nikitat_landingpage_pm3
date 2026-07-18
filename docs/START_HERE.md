# START HERE — PM3 Migration Entry Point

**Status:** Ready to begin migration  
**Current commit:** `0876863 init` — full Nuxt PM v2 codebase  
**Analysis:** `docs/PM-ARCHITECTURE-COMPLETE.md` (58 sections)  
**Plan:** `docs/MIGRATION_STEP_BY_STEP.md` (16 phases, 73 steps)

---

## What this is

We are rewriting the Puppet Master framework from Nuxt 4 to SvelteKit + Tailwind.
This is the ENTRY POINT for any new AI session — read this first.

## What happened today (2026-07-18)

1. ❌ First attempt: Spent all day coding without analyzing PM framework first. Everything was wrong — wrong CSS strategy, wrong component structure, wrong i18n, wrong onepager/SPA handling. Hard reset to initial commit.

2. ✅ Completed full analysis: 58 sections covering every system in PM — config, sections, modules, admin, deploy, AI-driven dev, MCP, legal/152-ФЗ, library mapping, etc. See `docs/PM-ARCHITECTURE-COMPLETE.md`.

3. ✅ Created step-by-step plan: 16 phases, 73 steps. See `docs/MIGRATION_STEP_BY_STEP.md`.

## What to do NOW

**Start with Phase 0, Step 0.2 — SvelteKit Scaffold.**

1. Read `docs/PM-ARCHITECTURE-COMPLETE.md` (you can skim sections 1-14, read 15-36 deeply)
2. Read `docs/MIGRATION_STEP_BY_STEP.md` — start at Phase 0, Step 0.2
3. Create SvelteKit project with all deps
4. Follow the plan step by step

## Key Rules for this project

1. **ZERO `any`** in TypeScript
2. **Svelte 5 runes** only — `$state`, `$derived`, `$effect` (no `$:`, no `export let`)
3. **13 npm scripts max** — AI-friendly, predictable names
4. **Our CSS** = Tailwind @theme (PM tokens) + @layer components (PM BEM classes)
5. **Components use OUR CSS classes** — the site should LOOK like the original PM site
6. **Config-driven** — everything from `src/lib/config/site.ts`
7. **Onepager/SPA** — `features.onepager` controls rendering mode via SectionRenderer
8. **Modules are plugins** — portfolio, blog, pricing NOT in core
9. **i18n Context API** — SSR + CSR via Svelte 5 `setContext`/`getContext`
10. **Every step verifies** — build, test, check before committing

## Key files for reference

| File | What |
|------|------|
| `docs/PM-ARCHITECTURE-COMPLETE.md` | Full 58-section framework analysis |
| `docs/MIGRATION_STEP_BY_STEP.md` | 16-phase, 73-step execution plan |
| `docs/migration/` | Original migration documents from session start |
| `project/puppet-master.config.ts` | ORIGINAL PM v2 config (1019 lines) — REFERENCE |
| `app/` | Original Nuxt frontend code — REFERENCE |
| `server/` | Original Nitro backend code — REFERENCE |
| `pm-core/` | Original PM framework layer — REFERENCE |
| `i18n/content.ts` | Translation data (copy to new project) |
| `i18n/system-seed.json` | System translations (copy to new project) |

## Git state

```
0876863 init — root commit, contains ALL original PM v2 code
⬜ Clean — no uncommitted changes
⬜ Next: Phase 0, Step 0.2 — SvelteKit Scaffold
```
