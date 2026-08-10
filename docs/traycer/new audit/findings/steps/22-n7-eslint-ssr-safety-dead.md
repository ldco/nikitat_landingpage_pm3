# Step 22 — N-7: Remove PM2-era eslint-plugin-ssr-safety

> **Phase:** Nice-to-have | **Finding:** N-7 | **Severity:** Repo-verified dead code

## What this step is

`eslint-plugin-ssr-safety.js` is a PM2/Nuxt-era plugin that only matches `.vue` files and checks for `puppet-master.config` imports. In PM3 (SvelteKit, `.svelte` files) it matches nothing — it's dead code in the ESLint config.

## What we are doing

Remove the plugin from `eslint.config.js`, or rewrite it to enforce a PM3-relevant SSR-safety rule (e.g., "no client-side direct DB access").

## Why

Repo-verified — the plugin checks `filename.endsWith('.vue')` and looks for `~/puppet-master.config` patterns; PM3 uses `.svelte` and `src/project/site-config.ts`. Layer 2 flagged it as a PM2 artifact that misleads agents reading the ESLint config.

## Plan

### Task 1: Decide remove vs rewrite

- **Files:** `eslint.config.js`, `eslint-plugin-ssr-safety.js`
- **Change:** Remove if no PM3-relevant rule is desired. Rewrite if a real rule is worth enforcing (candidate: flag `import ... from '$lib/server/...'` inside client-exposed `.svelte` files).

### Task 2: Update config

- **File:** `eslint.config.js`
- **Change:** Drop the plugin reference (or point to the rewritten version); keep `--max-warnings=0` behavior.

## Verification

- [ ] `npm run lint` passes
- [ ] `grep -r "ssr-safety" eslint.config.js` reflects the decision
