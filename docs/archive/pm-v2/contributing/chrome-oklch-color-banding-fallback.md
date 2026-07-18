# PM Chrome GPU oklch Color-Banding Fallback

Date: 2026-06-05

Status: implemented in this repository.

Derivative scope: all PMNative Nuxt/Nitro projects that use the PM CSS token engine with oklch color-mix() for layout colors.

## Goal

Eliminate visible horizontal seams and color mismatches between adjacent structural containers (e.g., elevated background over main body background) in standard Google Chrome, without altering the oklch-based token architecture for unaffected browsers.

## Problem

Chrome's hardware-accelerated GPU rendering pipeline can produce color quantization/banding errors when computing `color-mix(in oklch, ...)` values at element boundary edges. This manifests as a distinct color seam where two adjacent containers should render identical or smoothly blended colors.

The root cause is specific to Chrome's GPU color profile handling: certain display profiles (sRGB vs Wide Color Gamut/Display P3) interact incorrectly with Chrome's runtime oklch color space interpolation, causing adjacent layout layers to evaluate the same or closely computed tokens to slightly different output values.

Brave Browser (same Blink/Chromium engine) does NOT exhibit this bug because its Shields feature intercepts raw GPU color interpolation data, forcing a stable system profile fallback. Firefox uses a different compositor stack (WebRender) that doesn't exhibit this specific quantization issue, and Safari uses Core Animation with correct P3-aware rendering.

CSS `@supports` queries are useless here — both Chrome and Brave correctly report `@supports (color: oklch(0% 0 0))` as true since they both implement the syntax. The bug is in the GPU rendering pipeline, not in CSS feature availability.

## Framework Change

## Framework Rule

This fix is **always-on by default** (`features.colorRenderFallback: true`). It is NOT optional. All PM projects MUST keep this enabled. The only reason to disable it is for debugging/screenshots of the oklch pipeline.

The fix is framework-level, not project-level. It ships with every new PM project and does not require opt-in.

### 1. Feature Toggle (`project/puppet-master.config.ts`)

```ts
features: {
  colorRenderFallback: true  // ALWAYS true — framework default, never disable
}
```

When enabled, the framework selectively replaces oklch with srgb in color-mix() calls, but ONLY for Google Chrome users. Brave, Firefox, and Safari continue to use the full oklch pipeline.

### 2. CSS Fallback Layer (`app/assets/css/colors/auto-fallback.css`)

Duplicates all oklch-based layout and text tokens using `color-mix(in srgb, ...)` instead of `color-mix(in oklch, ...)`, gated behind:

```css
html.use-color-fallback {
  --l-bg-elevated: light-dark(
    color-mix(in srgb, var(--p-white), var(--p-black) 3%),
    color-mix(in srgb, var(--p-black), var(--p-white) 5%)
  );
  /* ... all other affected tokens */
}
```

Tokens that don't use oklch in their color-mix() (interactive colors already using srgb, semantic colors, grayscale) are NOT overridden — they are unaffected.

The `light-dark()` engine and all token inheritance chains are fully preserved.

### 3. Client-Side Browser Detection (`app/plugins/color-render-fallback.client.ts`)

Runs synchronously during Nuxt plugin setup (before Vue hydration) to add `.use-color-fallback` to `<html>` ONLY when:

1. `config.features.colorRenderFallback === true`
2. Current browser is standard Google Chrome (not Brave, Edge, Opera, Firefox, Safari)

Detection strategy:
- UserAgent contains "Chrome" but NOT "Edg/", "OPR/", "Brave", "Vivaldi", "YaBrowser", "UCBrowser"
- `navigator.brave` API is absent (Brave's privacy feature detection)
- `navigator.userAgentData.brands` (if available) confirms Google Chrome as primary brand

### 4. CSS Import Chain (`app/assets/css/colors/index.css`)

```css
@import './primitives.css';
@import './auto.css';
@import './auto-fallback.css';  /* loaded last, same cascade layer */
```

The fallback is loaded after auto.css in the same layer. Since both define the same variables under different selector specificity, and `html.use-color-fallback` is more specific than `:root`, the fallback tokens naturally override the primary tokens when the class is present.

## Files Changed

Primary implementation:
- `project/puppet-master.config.ts` — Added `features.colorRenderFallback` (default: `true`)
- `pm-core/app/composables/usePmConfig.ts` — Added `colorRenderFallback` to `PmFeatureConfig`
- `app/assets/css/colors/auto-fallback.css` — New file: srgb-backed token overrides
- `app/assets/css/colors/index.css` — Import auto-fallback.css
- `app/plugins/color-render-fallback.client.ts` — New file: Chrome detection + class application

No API, database, or component changes required.

## Porting Checklist

1. Copy `app/assets/css/colors/auto-fallback.css` to the target project's `app/assets/css/colors/`.
2. Add `@import './auto-fallback.css';` to `app/assets/css/colors/index.css` after the existing auto.css import.
3. Copy `app/plugins/color-render-fallback.client.ts` to the target project's `app/plugins/`.
4. Add `colorRenderFallback: true` to the `features` object in `project/puppet-master.config.ts`.
5. Add `colorRenderFallback: boolean` to `PmFeatureConfig` in `pm-core/app/composables/usePmConfig.ts`.
6. Rebuild:
```bash
npm run build
```
7. Verify in standard Chrome (not Brave) that no color banding appears between adjacent containers with elevated backgrounds.
8. Verify in Brave, Firefox, and Safari that the existing oklch rendering is unaffected.

## Validation

In standard Google Chrome:
- Load the site and inspect `<html>` — should have class `use-color-fallback`.
- Inspect computed styles on an element using `--l-bg-elevated` background — should show `color-mix(in srgb, ...)` output.
- Visually verify no horizontal seams between adjacent containers.

In Brave/Firefox/Safari:
- `<html>` should NOT have `use-color-fallback` class.
- oklch color-mix behavior is unchanged.

## Compatibility Impact

Low risk. The srgb and oklch color spaces produce very similar (not identical) color blends for the neutral black/white mixing used in these tokens. The perceptual difference is negligible — far less than the visual artifact this fixes.

The change is:
- Entirely additive (no primary token removal)
- Feature-flagged (can be toggled off)
- Browser-specific (only affects Chrome)
- Zero-cost for unaffected browsers (plugin returns early, CSS rules never match)

## Security Review

No auth, RBAC, secrets, user input, or storage surface changes. This is a client-side CSS rendering mitigation with user-agent based browser identification only.

## DevOps Review

This is a build artifact addition (one CSS file, one plugin). Rollback is straightforward:
1. Set `features.colorRenderFallback: false` in config.
2. Rebuild.

No new dependencies, no server-side changes, no database migration required.
