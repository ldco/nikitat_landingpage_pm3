# Step 34 — N-19: Startup preferences plugin (theme flash)

> **Phase:** Nice-to-have | **Finding:** N-19 | **Severity:** Parity comparison

## What this step is

PM2 had a `startup-preferences` plugin that applied the user's saved theme before first paint, preventing a flash of the wrong theme. PM3 has no equivalent; with `doubleTheme: true` and `DEFAULT_THEME: 'system'`, a dark-mode user can see a light flash on load.

## What we are doing

Port the theme-early-apply logic to PM3: a tiny inline script (or `svelte:head` pre-script) that reads the saved theme from storage and sets the `data-theme`/CSS var before hydration, consistent with the CSP nonce setup.

## Why

Parity comparison — Layer 1 flagged `startup-preferences` as missing. The theme store and `doubleTheme` feature exist; the early-apply prevents flash.

## Plan

### Task 1: Add early theme apply

- **File:** `src/app.html` (inline script with nonce) or a `svelte:head` component in `+layout.svelte`
- **Change:** Read saved theme from `localStorage`, set `document.documentElement` class/attribute before hydration. Must comply with CSP nonce (SvelteKit-injected) — no `unsafe-inline`.

### Task 2: Align with theme store

- **File:** `src/lib/stores/theme.svelte.ts`
- **Change:** Ensure the store reads the same storage key so no flicker/re-drift after hydration.

## Verification

- [ ] `npm run check`, `npm run lint` pass
- [ ] With saved dark theme: first paint is dark (no flash) — verify via DevTools slow network
- [ ] CSP still valid: no `unsafe-inline` added; nonce works
- [ ] `npm test` passes (theme store tests)

## Notes / Risks

- The inline script must use SvelteKit's nonce (it will be emitted as an inline script SvelteKit nonce-tags). Do not add `'unsafe-inline'` to `script-src`.
