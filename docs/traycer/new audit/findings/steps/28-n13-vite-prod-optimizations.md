# Step 28 — N-13: Vite production optimizations

> **Phase:** Nice-to-have | **Finding:** N-13 | **Severity:** Recommendation

## What this step is

`vite.config.ts` has no production-specific optimizations: no precompress, no build target, no chunk-splitting for vendor libraries, no chunk-size warning threshold.

## What we are doing

Add targeted build optimizations: adapter-node `precompress: true` (gzip/brotli at build time), a Vite `build` target, and manual chunk splitting for the largest vendor libs (e.g., `gsap`, `matter-js`, `sharp`-free client bundles) if measurable.

## Why

Repo-verified — `vite.config.ts` sets only plugins (`tailwindcss`, `sveltekit`, `paraglide`); `svelte.config.js` uses `adapter()` with no options. Precompress reduces cold-start latency; chunk splitting improves caching for repeat visits.

## Plan

### Task 1: Enable precompress

- **File:** `svelte.config.js`
- **Change:** `adapter: adapter({ precompress: true })`.

### Task 2: Add Vite build tuning

- **File:** `vite.config.ts`
- **Change:** Add `build: { target: 'es2022', chunkSizeWarningLimit: 500 }` and (if beneficial) `rollupOptions.output.manualChunks` for the animation libs. Measure before/after bundle sizes.

### Task 3: Verify deploy compatibility

- **File:** `scripts/docker-entrypoint.sh` / Dockerfile (from Step 08)
- **Change:** Confirm the server serves `.gz`/`.br` precompressed assets (adapter-node does this automatically).

## Verification

- [ ] `npm run build` succeeds; `build/` contains precompressed assets
- [ ] Bundle size report shows meaningful reduction or documents "no change" honestly
- [ ] Deploy to test host: app serves gzip/brotli assets, health endpoint 200

## Notes / Risks

- Only add `manualChunks` if measurement shows a real gain; premature splitting can hurt. Start with `precompress` + target.
