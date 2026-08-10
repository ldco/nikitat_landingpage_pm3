# PM v2 → PM v3 Token Mapping

How PM v2's CSS token architecture (`app-nuxt/app/assets/css/`) maps to PM v3's Tailwind v4 `@theme` tokens. Use this table when porting v2 components to v3.

## Color Tokens

| PM v2 | PM v3 | Notes |
|---|---|---|
| `--p-brand` | `--p-brand` | unchanged (project primitive) |
| `--p-accent` | `--p-accent` | unchanged |
| `--p-black` | `--p-black` | unchanged |
| `--p-white` | `--p-white` | unchanged |
| `--l-bg` | `--color-pm-bg` | `light-dark()` theme-aware |
| `--l-bg-elevated` | `--color-pm-bg-elevated` | |
| `--l-bg-sunken` | `--color-pm-bg-sunken` | |
| `--l-border` | `--color-pm-border` | |
| `--l-border-strong` | `--color-pm-border-strong` | |
| `--t-primary` | `--color-pm-text` | |
| `--t-secondary` | `--color-pm-text-secondary` | |
| `--t-muted` | `--color-pm-text-muted` | `--color-pm-muted` is an alias |
| `--i-brand` | `--color-pm-brand` | |
| `--i-brand-hover` | `--color-pm-brand-light` | |
| `--i-brand-active` | `--color-pm-brand-dark` | |
| `--i-brand-subtle` | `--color-pm-brand-subtle` | |
| `--i-focus-ring` | `--color-pm-focus-ring` | |
| `--d-success` / `--d-success-bg` | `--color-pm-success` / `--color-pm-success-bg` | |
| `--d-warning` / `--d-warning-bg` | `--color-pm-warning` / `--color-pm-warning-bg` | |
| `--d-error` / `--d-error-bg` | `--color-pm-danger` / `--color-pm-danger-bg` | v2 `error` → v3 `danger` |
| `--d-info` / `--d-info-bg` | `--color-pm-info` / `--color-pm-info-bg` | |
| `--c-gray-50…950` | `--color-pm-gray-50…900` | v3 ends at 900 |

> Removed aliases: `--color-pm-bg-muted`, `--color-pm-bg-dark`, `--color-pm-bg-dark-muted`, `--color-pm-muted-dark` had zero consumers (verified repo-wide).

## Typography Tokens

| PM v2 | PM v3 | Notes |
|---|---|---|
| `--font-body` | `--font-sans` | v3 `--font-sans` includes Geologica |
| `--font-heading` | `--font-display` | defaults to `--font-sans` |
| `--font-mono` / `--font-code` | `--font-mono` | |
| `--text-xs…5xl` | `--text-xs…5xl` | same scale |
| `--text-6xl` | — | not present in v3 (unused in v3 components) |
| `--text-caption` | — | not present in v3 (unused in v3 components) |
| `--font-weight-light…black` | `--font-weight-light…black` | same |
| `--leading-small/tight/normal/relaxed` | `--leading-small/tight/normal/relaxed` | same |
| `--leading-none/snug/loose` | — | Tailwind defaults cover `leading-none/snug/loose` |
| `--tracking-*` | — | Tailwind defaults (`tracking-tight/wide/wider`) cover v3 usage |

## Spacing Tokens

| PM v2 | PM v3 | Notes |
|---|---|---|
| `--space-0…32` | `--space-0…32` (`@layer base :root`) | identical 4px scale |
| `--space-fluid-sm…xl` | `--spacing-fluid-xs…2xl` (`@theme`) | v3 adds xs/2xl; used via `[var(--spacing-fluid-*)]` |
| `--gap-*` | `--gap-*` (`@layer base :root`) | identical |
| `--icon-*` | `--icon-*` | identical |
| `--touch-target` | `--touch-target` | identical |

## Layout Tokens

| PM v2 | PM v3 | Notes |
|---|---|---|
| `--container-max: 1280px` | `--container-default: 80rem` | equivalent |
| `--content-narrow: 768px` | `--content-narrow: min(768px, 100%)` | |
| `--content-default: 1280px` | `--content-default: min(1280px, 100%)` | |
| `--content-wide: 1536px` | `--content-wide: min(1536px, 100%)` | |
| `--content-prose: 65ch` | `--content-prose: 65ch` | |
| `--container-padding` | `--px-container` | same clamp value |

## Z-Index Tokens

| PM v2 | PM v3 |
|---|---|
| `--z-base: 1` | `--z-base: 1` |
| `--z-dropdown: 100` | `--z-dropdown: 100` |
| `--z-sticky: 200` | `--z-sticky: 200` |
| `--z-fixed: 300` | `--z-fixed: 300` |
| `--z-drawer-backdrop: 400` | `--z-drawer-backdrop: 400` |
| `--z-drawer: 500` | `--z-drawer: 500` |
| `--z-modal-backdrop: 600` | `--z-modal-backdrop: 600` |
| `--z-modal: 700` | `--z-modal: 700` |
| `--z-popover: 800` | `--z-popover: 800` |
| `--z-tooltip: 850` | `--z-tooltip: 850` |
| `--z-toast: 900` | `--z-toast: 900` |
| `--z-max: 1000` | `--z-max: 1000` |

> **v3 gotcha:** Tailwind v4 generates `z-*` utilities from the `--z-index-*` namespace, NOT `--z-*`. Named `z-*` classes are therefore inert — always use bracket syntax: `z-[var(--z-tooltip)]`.

## Shadow / Radius

| PM v2 | PM v3 |
|---|---|
| `--shadow-sm…xl` | `--shadow-sm…xl` |
| frosted shadows (ui/forms) | `--shadow-frosted`, `--shadow-frosted-hover`, `--shadow-frosted-lg` |
| `--radius-xs…full` | `--radius-xs…full` |

## Theming Mechanism

- v2: `light-dark()` CSS function (browser-driven `color-scheme`).
- v3: `light-dark()` inside `@theme` token values + class-based `.dark` variant (`@custom-variant dark`). Equivalent results confirmed: tokens resolve via `color-scheme` and the `.dark` override block re-declares the dark-mode semantic backgrounds.
