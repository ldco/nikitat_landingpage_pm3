# START HERE — Puppet Master Migration Entry Point

**Status:** Ready to begin migration
**Current commit:** `0876863 init` — full Nuxt PM v2 codebase
**Analysis:** `docs/PM-ARCHITECTURE-COMPLETE.md` (58 sections)
**Plan:** `docs/MIGRATION_STEP_BY_STEP.md` (16 phases, 73 steps)

---

## What this is

We are rewriting Puppet Master from Nuxt 4 to SvelteKit.
This is the ENTRY POINT for any new AI session — read this first.

## What happened today (2026-07-18)

1. ❌ First attempt: All day coding without analysis. Wrong CSS, wrong architecture, wrong everything.
2. ✅ Full analysis: 58 sections. Every PM system covered.
3. ✅ Step-by-step plan: 16 phases, 73 steps.
4. ✅ Rules + Style Guide: AGENTS.md + STYLE_GUIDE.md

## What to do NOW

**Start with Phase 0, Step 0.2 — SvelteKit Scaffold.**

1. Read `AGENTS.md` (152 lines) — PM philosophy + all rules
2. Read `docs/STYLE_GUIDE.md` (175 lines) — concrete code patterns
3. Read `docs/MIGRATION_STEP_BY_STEP.md` — start at Phase 0, Step 0.2
4. Read `docs/PM-ARCHITECTURE-COMPLETE.md` — reference as needed

## Key Rules for this project

1. **ZERO `any`** in TypeScript
2. **Svelte 5 runes** — `$state`, `$derived`, `$effect`
3. **Components define OWN styles** — no global CSS classes
4. **app.css = @theme + @layer base only** — no component classes there
5. **13 npm scripts** — AI-friendly names
6. **Config-driven** — `src/lib/config/site.ts`
7. **Onepager/SPA** — config toggle via SectionRenderer
8. **Modules = plugins** — portfolio, blog, pricing NOT in core
9. **i18n Context API** — SSR + CSR
10. **Every step verifies** — build, test before commit

## Reference files

| File | What |
|------|------|
| `AGENTS.md` | PM philosophy + ALL rules |
| `docs/STYLE_GUIDE.md` | Code patterns + anti-patterns |
| `docs/PM-ARCHITECTURE-COMPLETE.md` | Full 58-section analysis |
| `docs/MIGRATION_STEP_BY_STEP.md` | 16-phase execution plan |
| `docs/migration/` | Original session documents |
| `project/puppet-master.config.ts` | Original PM v2 config — REFERENCE |
| `app/`, `server/`, `pm-core/` | Original Nuxt code — REFERENCE |

## Git state

```
0876863 init — full original PM v2 code
⬜ Clean — no uncommitted changes
⬜ Next: Phase 0, Step 0.2 — SvelteKit Scaffold
```
