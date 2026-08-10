# Step 10 — Framework hygiene: superforms dead dependency + SectionHero coupling

> **Phase:** Short-term (Important) | **Findings:** I-21, I-22 (with E-5, E-7) | **Severity:** Functional

## What this step is

This step resolves two framework-layer ambiguities that mislead AI agents:

- I-21 (+E-5): `sveltekit-superforms` is in `package.json` but used **nowhere**. Agents either assume it's part of the form pattern (it isn't) or fear removing it.
- I-22 (+E-7): `SectionHero.svelte` (framework layer) imports `HeroParallaxScene` and `gsapIntro` from `src/project/`, breaking the framework→project boundary. Currently inactive because `FEATURES.heroParallax: false`, but the module-level import still requires the project files to exist.

## What we are doing

1. **I-21/E-5 — Superforms:** Make an explicit decision — **adopt** (recommended: it eliminates ~60% admin-form boilerplate and is the PM3-canonical form library) or **remove** (if the manual Zod + `fail()` pattern is the standard). If adopting: refactor one admin form as a pilot (blog create), then roll out; if removing: drop the dependency.
2. **I-22/E-7 — SectionHero decoupling:** Extract the parallax concern behind a prop-injected interface so `SectionHero` is a pure framework component; `Onepager.svelte` supplies the project's parallax scene only when `FEATURES.heroParallax` is enabled.

## Why

- I-21: Repo-verified — `grep superform src/routes/admin/` returns nothing; `package.json` pins `sveltekit-superforms ^2.30.2`. Dead dependencies create ambiguity: an agent reading the form code won't see superforms, but an agent reading package.json might try to use it.
- I-22: Repo-verified — `SectionHero.svelte:10-11` imports from `../../../project/`. With `FEATURES.heroParallax: false` the parallax never renders, but the static import means every new PM3 project must provide `HeroParallaxScene.svelte` + `gsapIntro` even when it doesn't want parallax.

## Plan

### Task 1: Decide and resolve superforms (I-21/E-5)

- **Option A — Adopt (recommended):**
  - **Files:** `package.json` (keep), one admin form (pilot: `src/routes/admin/blog/create/+page.server.ts` + page component), then the rest of the admin CRUD forms
  - **Change:** Convert the pilot form to `superForm(schema)` with client-side validation from the Zod schema; verify `$form`, `$errors`, `$constraints` work; roll out to remaining admin forms; update AGENTS.md form-contract section.
- **Option B — Remove:**
  - **Files:** `package.json`
  - **Change:** `npm uninstall sveltekit-superforms`; add a note in AGENTS.md that admin forms use manual Zod + `fail()` by design.

### Task 2: Decouple SectionHero (I-22/E-7)

- **Files:** `src/lib/components/sections/SectionHero.svelte`, `src/lib/components/complex/Onepager.svelte`, `src/lib/components/sections/registry.ts` (if a registry slot is cleaner)
- **Change:** Add an optional `parallaxComponent` prop (default no-op) to `SectionHero`; remove the static `src/project/` imports; have `Onepager.svelte` pass the project's `HeroParallaxScene` + `gsapIntro` when `FEATURES.heroParallax` is true. Update `tests/lib/components/section-registry.test.ts` if the exception contract changes.

## Verification

- [ ] `npm run check`, `npm run lint`, `npm test` pass
- [ ] Option A: blog create form shows client-side field errors without a round trip; all admin CRUD forms still pass validation tests
- [ ] Option B: `npm ls sveltekit-superforms` shows it removed; no imports remain
- [ ] `FEATURES.heroParallax: false` — no project import of `HeroParallaxScene`/`gsapIntro` in the built app
- [ ] `FEATURES.heroParallax: true` — parallax still renders (test on a branch that enables it)
- [ ] Section registry test still passes (no hardcoded component names)

## Notes / Risks

- If adopting superforms, do it incrementally (pilot → rollout) so each admin form's validation behavior is verified; don't rewrite all forms in one commit.
- The SectionHero change must keep the current rendering path identical when `heroParallax: false` (the default for FABRICA22) — zero visual regression.
- This step should also update AGENTS.md so future agents know the form contract and the SectionHero boundary rules.
