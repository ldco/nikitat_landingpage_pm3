# Step 09 — Framework functional gaps: init wizard, useFormDirty, useMediaQuery

> **Phase:** Short-term (Important) | **Findings:** I-18, I-19, I-20 | **Severity:** Functional

## What this step is

This step ports three PM2 capabilities that are missing from the PM3 framework layer:

- I-18: the `/init` build-configuration wizard (`init.vue` in PM2) — PM3 has no init route.
- I-19: `useFormDirty` — unsaved-form-change tracking used by admin editors.
- I-20: `useMediaQuery` — reactive media-query composable used across PM2 components.

These are genuine framework gaps (not project-config choices). They affect any PM3 project, and the current FABRICA22 config (`PM_MODE: 'build'`) means the init wizard gap is latent until a fresh project is scaffolded.

## What we are doing

1. Port `init.vue` → a SvelteKit init route (`src/routes/init/+page.svelte` + `+page.server.ts`) that writes the project config when `PM_MODE === 'unconfigured'` (or replicates the PM2 wizard behavior for `build`).
2. Port `useFormDirty` → `src/lib/actions/` (or a store) for dirty-state tracking on admin forms.
3. Port `useMediaQuery` → `src/lib/actions/useMediaQuery` (or `src/lib/stores/`) with reactive `$derived`-friendly behavior using Svelte 5 runes.

## Why

- I-18: Parity comparison — PM2 `app/pages/init.vue` handled first-run config. PM3 `PM_MODE: 'build'` (site-config.ts:215) bypasses any wizard; a new site has no guided config path. The `PM_MODE`/AGENTS.md `'develop'` discrepancy (N-10) is related and can be resolved here.
- I-19/I-20: Parity comparison — PM2 composables (`useFormDirty`, `useMediaQuery`) are used by admin and responsive components; PM3 has neither, forcing manual implementations.

## Plan

### Task 1: Init wizard (I-18)

- **Files:** new `src/routes/init/+page.svelte`, `src/routes/init/+page.server.ts`
- **Change:** Port the PM2 wizard flow: collect site identity (locales, contact, admin credentials), write to `src/project/site-config.ts` (or a config file the framework reads), and set `PM_MODE` to `build`. Gate the route on `PM_MODE === 'unconfigured'`; redirect otherwise. Verify the route is excluded from CSP/admin-auth conflicts.

### Task 2: useFormDirty (I-19)

- **Files:** new `src/lib/actions/useFormDirty.svelte.ts` (or `src/lib/stores/formDirty.ts`)
- **Change:** Port PM2's dirty-tracking: expose a `$state` dirty flag, an initial-state snapshot, and a reset. Provide an example usage in the admin edit pages (blog edit as reference).

### Task 3: useMediaQuery (I-20)

- **Files:** new `src/lib/actions/useMediaQuery.svelte.ts` (or `src/lib/stores/mediaQuery.ts`)
- **Change:** Port PM2's composable using Svelte 5 runes: subscribe to `matchMedia`, expose a reactive boolean, handle SSR (no `window` at init), and clean up listeners.

## Verification

- [ ] `npm run check`, `npm run lint`, `npm test` pass
- [ ] New tests for `useMediaQuery` (SSR + client) and `useFormDirty` (state transitions) under `tests/`
- [ ] `npm run dev` with `PM_MODE: 'unconfigured'` → `/init` serves the wizard; with `build` → redirects
- [ ] Admin edit form shows unsaved-changes warning when dirty
- [ ] A component using `useMediaQuery` updates when the viewport crosses the breakpoint

## Notes / Risks

- The init wizard writes project config — make sure it validates input (Zod) and never writes secrets.
- `useMediaQuery` SSR: return the desktop default on the server to avoid hydration mismatch, matching PM2 behavior.
- These are framework-layer additions; place them under `src/lib/` (not `src/project/`) so all PM3 projects benefit.
