# Portfolio Lightbox — z-index & Theme Fix

## Status: Accepted

## Context

The portfolio detail lightbox (`src/lib/components/molecules/PortfolioItemModal.svelte`)
renders the branding/website immersive viewer. Three visual bugs were reported:

1. The lightbox renders **under the fixed header** — the close button is hidden.
2. The **back-to-top button stays visible** on top of the lightbox.
3. The **image side is always dark** and never follows the light/dark theme.

All three trace to hardcoded values that bypass the PM3 design-token system.

### Z-index scale (src/app.css)

| Token | Value | Consumer |
|---|---|---|
| `--z-sticky` | 200 | `BackToTop.svelte` |
| `--z-fixed` | 300 | `.header-pm` (fixed header) |
| `--z-modal-backdrop` | 600 | `ConfirmDialog`, `AdminModal`, `ChangePasswordModal` |
| `--z-modal` | 700 | PM2 `.lightbox-immersive` parity |

### Root cause

| Symptom | Cause | Location |
|---|---|---|
| Under header | root overlay hardcodes `z-50` (50) instead of `z-[var(--z-modal)]` (700) | `PortfolioItemModal.svelte:149` |
| Back-to-top visible | same `z-50` is below `BackToTop`'s `z-[var(--z-sticky)]` (200) | same |
| Image side always dark | media column hardcodes `bg-black/40`; caption hardcodes `text-pm-white/70` | `PortfolioItemModal.svelte:180,190` |

The content column already themes correctly (`bg-pm-bg`). The media column and its
caption are the only hardcoded-dark pieces inside the overlay.

## Decision

1. **z-index** — raise the lightbox root to the modal z-token:
   `z-50` → `z-[var(--z-modal)]`. This matches PM2 parity (`z-index: var(--z-modal)`)
   and every other modal in the repo. It puts the overlay above the header (300) and
   back-to-top (200) while staying below toasts (900).
2. **Theme** — replace the hardcoded dark media panel with the canonical themed
   recessed token `bg-pm-bg-sunken` (light in light mode, dark in dark mode — already
   used by `PortfolioCard`, `BrandingViewer`, `AppImage`). Caption follows with
   `text-pm-text-secondary`.
3. **Backdrop stays a scrim** — the root `bg-black/90` remains (a modal scrim is dark
   by design in both themes). Optional: `bg-black/90` → `bg-pm-black/90` for
   brand-warm-black consistency (flagged in migration notes) — not required for this fix.

## Changes

### Primary — `src/lib/components/molecules/PortfolioItemModal.svelte`

| Line | Current | New |
|---|---|---|
| 149 (root overlay) | `'fixed inset-0 z-50 overflow-y-auto bg-black/90 md:p-[var(--space-6)]'` | `'fixed inset-0 z-[var(--z-modal)] overflow-y-auto bg-black/90 md:p-[var(--space-6)]'` |
| 180 (media column) | `bg-black/40` | `bg-pm-bg-sunken` |
| 190 (caption) | `text-pm-white/70` | `text-pm-text-secondary` |

The media column line becomes:
`<div class="relative flex h-[var(--lightbox-panel-height-mobile)] md:h-full flex-col overflow-hidden bg-pm-bg-sunken">`

The caption line becomes:
`<p class="mx-auto max-w-lg px-[var(--space-4)] pb-3 text-center text-sm text-pm-text-secondary">`

### Secondary — `src/lib/components/molecules/PortfolioLightbox.svelte`

Same latent z-index bug (`z-50` at line 69). Currently unreferenced (its only importer,
`plugins/portfolio/Lightbox.svelte`, is not imported anywhere), but fix for correctness:
`z-50` → `z-[var(--z-modal)]`.

## Options considered

1. **Use `--z-modal-backdrop` (600)** — consistent with the other modals, but the
   lightbox is a single full-screen overlay (no separate backdrop/panel stack) and PM2
   used `--z-modal` (700). Rejected in favor of exact PM2 parity.
2. **Keep media panel dark, only fix z-index** — contradicts the reported "always dark"
   complaint; the panel must be theme-aware. Rejected.
3. **`bg-black/40` → `bg-pm-black/40`** — still always dark (pm-black is a fixed dark
   token). Rejected; `bg-pm-bg-sunken` is the theme-aware token.

## Consequences

- **Easier:** lightbox correctly overlays all fixed chrome (header, back-to-top,
  drawer). Image panel participates in light/dark theming consistently with the rest
  of the portfolio UI.
- **Risk:** the media panel changes from near-black to a light cream in light mode —
  this is the intended visual change. Branding/website screenshots are typically on
  light backgrounds, so contrast improves.
- **No risk to tests:** `portfolio-detail-page.test.ts` asserts
  `md:p-[var(--space-6)]`, panel heights, and paddings — none change.

## Verification checklist

- [ ] `npm run check` — no TypeScript/svelte-check errors
- [ ] `npm run test -- tests/lib/components/portfolio-detail-page.test.ts` — 15 tests pass
- [ ] `npm run validate:pm3` — no design-token/canonical-primitive violations
- [ ] Manual light mode: open `/portfolio/branding` → click item → close button visible above header, back-to-top hidden, image panel light
- [ ] Manual dark mode (toggle theme): image panel + caption switch to dark; gallery nav pills and counter remain legible
- [ ] Keyboard: Escape + arrow-key gallery nav still work after z-index change

## Migration path / rollback

- Pure class-string edits in two components — no schema, no API, no i18n changes.
- Rollback: `git checkout` the two files. No data migration, no feature flags needed.
