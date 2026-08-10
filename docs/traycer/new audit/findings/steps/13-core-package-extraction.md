# Step 13 — Realize the `@puppet-master/core` package boundary

> **Phase:** Long-term (Architectural maturity) | **Findings:** E-3 | **Severity:** Recommendation

## What this step is

The framework–project boundary (`src/` = framework, `src/project/` = site identity) is currently enforced by convention + tests + the validator. E-3 is the aspirational step of extracting the framework into a real package (`@puppet-master/core`) so the boundary is enforced by TypeScript/package resolution — an agent literally cannot import from `src/project/` inside the framework package.

## What we are doing

1. Convert the repo to a monorepo (pnpm/npm workspaces) or extract `src/` framework code into `packages/core/`.
2. Move framework files (components, stores, actions, server lib, config helpers, routes templates, tokens) into the package; keep `src/project/` (site identity) in the app.
3. Make the app depend on `@puppet-master/core` at a pinned version, so framework upgrades are `npm update @puppet-master/core`.
4. Resolve the current documented exceptions first (SectionHero → project imports — see Step 10) so the package has zero `src/project/` imports.

## Why

- Documented in `docs/framework-project-boundary.md` as the aspirational end-state ("npm update @puppet-master/core").
- Current enforcement is convention + `section-registry.test.ts`; an agent unaware of the convention can add a framework→project import without a lint error.
- Package boundaries are machine-enforced: TS resolution fails on a forbidden import inside the package.

## Plan

### Task 1: Pre-requisite — eliminate framework→project imports

- **Files:** `src/lib/components/sections/SectionHero.svelte` (from Step 10), any other `src/lib/**` importing `src/project/**`
- **Change:** Confirm zero framework files import from `src/project/` (grep). Complete Step 10 first if not done.

### Task 2: Choose monorepo layout and scaffold

- **Files:** root `package.json` (workspaces), `packages/core/package.json`, `pnpm-workspace.yaml` (or npm workspaces)
- **Change:** Create the `packages/core` package; decide what moves (framework `src/lib/**` minus project-coupled bits; tokens; config helpers).

### Task 3: Move code and wire exports

- **Files:** `packages/core/src/**`, app `src/lib/config/site.ts` import shim
- **Change:** Move framework code; export the public API; update app imports to `@puppet-master/core`. Keep `src/project/` in the app. Update `svelte.config.js` alias resolution.

### Task 4: Validator + test updates

- **Files:** `scripts/pm3-validator.mjs`, `tests/lib/components/section-registry.test.ts`
- **Change:** Point validator checks at the package paths; keep the registry test; add a lint rule that forbids framework→project imports inside `packages/core`.

### Task 5: Migration path for this repo

- **File:** app `src/project/site-config.ts` + a `@puppet-master/core` version pin
- **Change:** Pin the framework version; document the upgrade flow (`npm update @puppet-master/core`) in `docs/framework-project-boundary.md`.

## Verification

- [ ] `npm run check`, `npm run lint`, `npm test`, `npm run build` pass in the monorepo layout
- [ ] `grep -r "src/project" packages/core/src` — zero matches
- [ ] The app builds with the pinned `@puppet-master/core` version; changing the version requires an explicit `npm update`
- [ ] All admin routes and sections render identically (no visual regression)
- [ ] `npm run validate:pm3` passes in the new layout

## Notes / Risks

- This is the highest-effort step. Do it only after Steps 10 (SectionHero decoupling) and 11 (CI) so the extraction is gated by CI.
- Keep the extraction mechanical: move code, don't redesign. Any redesign should be a separate step.
- The monorepo changes `npm ci`/build semantics — verify Docker build (Step 08's Dockerfile) still produces a working image.
