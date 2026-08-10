# Step 31 — N-16: Port useA11y, vh-fix, usePerformance composables

> **Phase:** Nice-to-have | **Finding:** N-16 | **Severity:** Parity comparison

## What this step is

PM2 had `useA11y`, `vh-fix`, and `usePerformance` composables that PM3 lacks. These are framework-layer utilities for accessibility, mobile viewport-height fixes, and performance measurement.

## What we are doing

Port the three composables to PM3's Svelte 5 runes style (in `src/lib/actions/` or `src/lib/stores/`), matching how Step 09 ports `useMediaQuery`/`useFormDirty`.

## Why

Parity comparison — Layer 1 flagged these as missing PM2 capabilities. They're small utilities; the framework is meant to be the shared layer for all PM3 projects.

## Plan

### Task 1: Port useA11y

- **File:** new `src/lib/actions/useA11y.svelte.ts`
- **Change:** Focus-trap / skip-link / aria helpers used by PM2 components; adapt to Svelte 5.

### Task 2: Port vh-fix

- **File:** new `src/lib/actions/vhFix.svelte.ts`
- **Change:** Mobile `100vh`-vs-`100dvh` fix (the `min-h-dvh` utility already exists — the composable can set the CSS var).

### Task 3: Port usePerformance

- **File:** new `src/lib/actions/usePerformance.svelte.ts`
- **Change:** Timing/long-task observers feeding the analytics beacon (align with the existing `/api/analytics/performance` endpoint).

## Verification

- [ ] `npm run check`, `npm run lint`, `npm test` pass
- [ ] Each composable has a unit test (SSR-safe, cleanup on destroy)
- [ ] vh-fix sets the CSS var on mobile; useA11y trap works on a sample component
