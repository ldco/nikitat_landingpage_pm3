# Decision — Theme handling & startup preferences (audit N-19)

**Status:** Resolved by design (2026-08-10)
**Applies to:** `src/lib/stores/theme.svelte.ts`, `src/project/theme.css`

## Context

PM2 had a `startup-preferences` plugin that applied the user's saved theme
before first paint to prevent a flash of the wrong theme. The PM3 audit
flagged this as a potential missing capability (N-19).

## Finding

The PM3 site **forces `color-scheme: dark`** (`src/project/theme.css`) and
`src/lib/stores/theme.svelte.ts` explicitly **removes localStorage
persistence** to prevent hydration mismatches — the server renders dark and
localStorage could say light, causing a flash.

Because the theme is a single fixed value, there is **no flash of the wrong
theme** and therefore no need for a startup-preferences early-apply script.

## Decision

Do not add a `startup-preferences` plugin. The `ThemeToggle` component can
still toggle light/dark at runtime via `document.documentElement.classList`
(View Transitions API), but the persisted default is always dark.

## Consequence

- No theme-flash risk; no extra inline script needed in `src/app.html`.
- If a future PM3 project enables user-persisted theming, the startup
  early-apply should be added at that time (with SvelteKit nonce CSP).
