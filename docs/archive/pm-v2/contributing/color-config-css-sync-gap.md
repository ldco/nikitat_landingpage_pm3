# PM Color Config-to-CSS Sync Gap

Date: 2026-06-06

Status: implemented in this repository.

Derivative scope: all PM projects where `puppet-master.config.ts` colors differ from `app/assets/css/colors/primitives.css`.

## Problem

There are **two independent sources of truth** for the 4 color primitives (black, white, brand, accent):

1. `project/puppet-master.config.ts` — the `colors` block (lines 676-681)
2. `app/assets/css/colors/primitives.css` — the `--p-*` CSS custom properties (lines 26-29)

When a developer changes `config.colors.brand` from `#666666` to `#901504`, the CSS still serves the old value because:

- Config hot-reloads via Nuxt runtime (affects JavaScript execution paths)
- CSS files are static assets served by Vite — they do not read from the config at runtime
- There is no build-time plugin or Vite config that injects `config.colors` into `primitives.css`

This causes developer confusion: "I changed the color in the config but nothing happened."

## Solution

There is no automated sync mechanism yet. The recommended approach for now is manual two-way sync.

### Changed file

- `app/assets/css/colors/primitives.css` — synced `--p-*` values to match `puppet-master.config.ts`:

  | Variable | Old value | New value (from config) |
  |---|---|---|
  | `--p-black` | `#1a1a1a` | `#3b0902` |
  | `--p-white` | `#f0f0f0` | `#fbf2e7` |
  | `--p-brand` | `#666666` | `#901504` |
  | `--p-accent` | `#f9f9f9` | `#901504` |

- The comment block was also updated to remove stale hex references and note the manual sync requirement.

### Key observations

- The config `colors.white` value was `#ffbf2e7` (7 hex digits, invalid CSS). Fixed to `#fbf2e7` — pale warm off-white, consistent with the "near-white" intent.
- Config `colors.accent` is `#901504` (deep red, same as brand). The original comment said "Dark blue slate" — the value likely needs review.
- A future enhancement should add a Vite plugin or Nitro build hook that reads `config.colors` and generates/updates `primitives.css` at build time, making the `colors` config block the single source of truth.

## Future work

- Implement a build-time CSS generator that reads `config.colors` and outputs `primitives.css`
- Or switch to CSS custom properties set via Nuxt's `runtimeConfig.public` so colors can be changed without rebuild
