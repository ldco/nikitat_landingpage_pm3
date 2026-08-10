# Step 23 — N-8: Document SectionHero registry exception

> **Phase:** Nice-to-have | **Finding:** N-8 | **Severity:** Repo-verified doc gap

## What this step is

`SectionHero` is the only section in `HOMEPAGE_SECTIONS` that is NOT in `SECTION_REGISTRY` — it's rendered directly by `Onepager.svelte` because it needs a grid layout incompatible with the Section shell. This exception is only explained in the registry test file, not in AGENTS.md.

## What we are doing

Document the exception in AGENTS.md and the section-registry test, so agents don't "fix" it by adding Hero to the registry (which would double-render).

## Why

Repo-verified — `tests/lib/components/section-registry.test.ts:52-56` documents the exception; AGENTS.md (the agent-facing contract) does not. Step 10 decouples Hero from project imports; this step is the documentation companion.

## Plan

### Task 1: Document in AGENTS.md

- **File:** `AGENTS.md` (Component Hierarchy or sections section)
- **Change:** Add: "SectionHero is the documented exception — rendered directly by Onepager, not via SectionRenderer/SECTION_REGISTRY. Do not add it to the registry (double-render)."

### Task 2: Cross-reference from the test

- **File:** `tests/lib/components/section-registry.test.ts`
- **Change:** Link the AGENTS.md section in the existing comment.

## Verification

- [ ] AGENTS.md contains the exception note
- [ ] `npm test` — section-registry test still passes
