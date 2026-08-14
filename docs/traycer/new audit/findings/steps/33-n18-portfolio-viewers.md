# Step 33 — N-18: Portfolio subtype viewers

> **Phase:** Nice-to-have | **Finding:** N-18 | **Severity:** Parity comparison

## What this step is

PM2 supported portfolio subtype viewers (e.g., BrandbookViewer and friends) that PM3 lacks. In the current config `MODULES.portfolio.enabled: true` but `HOMEPAGE_SECTIONS` has `portfolio.enabled: false` (renderMode `page`), so the viewers are latent, not blocking.

## What we are doing

Assess the PM2 viewers, decide which are needed for this site's portfolio, and port them into the PM3 portfolio section/route layer — or document them as intentionally dropped.

## Why

Parity comparison — Layer 1 flagged missing subtype viewers as a framework gap. The portfolio module is enabled, so the viewers matter when the portfolio page is active.

## Decision record (2026-08-14) — PM3 viewer contract

The subtype viewers are PORTED at content parity with the PM2 display-mode contracts
(`docs/archive/pm-v2/portfolio-display-modes.md`):

| Type | PM2 contract | PM3 implementation | Status |
|---|---|---|---|
| `branding` | `BrandingViewer` — sections, gallery, client URL, tags | `src/lib/plugins/portfolio/BrandingViewer.svelte` (sections, item media, clientUrl, tags) | Ported |
| `website` | `WebsiteViewer` — title, description/content, technologies, tags, live URL | `src/lib/plugins/portfolio/WebsiteViewer.svelte` (content blocks, screenshots, technologies, tags, liveUrl) | Ported |
| `case_study` | Inline content — category, title, markdown `###` headings, description, tags | `src/lib/plugins/portfolio/CaseStudyViewer.svelte` (shared `parseContentBlocks`) | Ported |
| `brandbook` | PM2 `BrandbookViewer.vue` was a **placeholder** ("coming soon") | `src/lib/plugins/portfolio/BrandbookViewer.svelte` (pages, prev/next, PDF download) | Ported (superset) |
| `gallery` / unknown | Legacy flat items | generic image/video/link detail in `src/routes/portfolio/[slug]/+page.svelte` | Ported |

**Intentional simplifications (deliberately NOT ported, decision recorded):**
- The PM2 detail page opened a **modal lightbox** (with gallery nav arrows and
  prev/next-project chrome). PM3 renders the selected item's viewer **inline** in
  an always-open detail panel below the item grid/fullscreen slides. This keeps the
  selected item's content server-rendered (SEO + testability) and removes the
  overlay state machine. The inline panel is the supported PM3 detail contract.
- The PM2 listing page carried no filter UI; PM3 keeps that behavior (the module
  config filter switches were removed from `site-config.ts` — see the portfolio
  module config comment).
- The fullscreen branding browser is a natural-flow slide strip with a layout
  toggle (no sticky overlay chrome), matching the PM2 display-mode spec
  ("fullscreen slides with image overlays" + "button to switch between fullscreen
  and grid").

**Behavioral contract tests:** `tests/lib/components/portfolio-viewers.test.ts`
covers each viewer's supported behavior (sections/tags/clientUrl, screenshots/
technologies, pages + prev/next + page reset on item change, content blocks/tags).
The SSR-level contract is covered by `tests/api/portfolio-item-metadata.test.ts`.

## Verification

- [x] `npm run check`, `npm run lint`, `npm test` pass
- [x] Portfolio page renders the selected viewers with seeded data
- [x] Any dropped viewers are documented (decision recorded)
