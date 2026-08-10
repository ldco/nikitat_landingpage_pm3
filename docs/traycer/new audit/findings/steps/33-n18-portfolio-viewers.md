# Step 33 — N-18: Portfolio subtype viewers

> **Phase:** Nice-to-have | **Finding:** N-18 | **Severity:** Parity comparison

## What this step is

PM2 supported portfolio subtype viewers (e.g., BrandbookViewer and friends) that PM3 lacks. In the current config `MODULES.portfolio.enabled: true` but `HOMEPAGE_SECTIONS` has `portfolio.enabled: false` (renderMode `page`), so the viewers are latent, not blocking.

## What we are doing

Assess the PM2 viewers, decide which are needed for this site's portfolio, and port them into the PM3 portfolio section/route layer — or document them as intentionally dropped.

## Why

Parity comparison — Layer 1 flagged missing subtype viewers as a framework gap. The portfolio module is enabled, so the viewers matter when the portfolio page is active.

## Plan

### Task 1: Inventory PM2 viewers

- **Files:** PM2 `app-nuxt/` portfolio components (read-only)
- **Change:** List each viewer type and its PM2 data contract.

### Task 2: Decide scope

- **File:** `src/project/site-config.ts` (portfolio module config)
- **Change:** Enable the viewers this site needs (matching `showCaseStudies`/`showGallery` flags already in config) or document the drop.

### Task 3: Port selected viewers

- **Files:** `src/lib/components/sections/SectionPortfolio.svelte` + new viewer components under `src/lib/components/molecules/` or `complex/`
- **Change:** Port the selected viewers; wire via the portfolio module config; verify with seeded portfolio data.

## Verification

- [ ] `npm run check`, `npm run lint`, `npm test` pass
- [ ] Portfolio page renders the selected viewers with seeded data
- [ ] Any dropped viewers are documented (decision recorded)
