# PM Dev-Mode Image Fallback to Raw PNG

Date: 2026-06-08

Status: implemented in this repository.

Derivative scope: all PM projects that use the `<picture>` image component layer and the build-time image optimizer.

## Goal

Images must display correctly during development (`npm run dev`) without requiring a full asset optimization pass. In dev mode, the framework serves raw source PNGs directly. In production, the browser negotiates AVIF/WebP/PNG through `<picture>` elements backed by `optimize-assets.mjs` outputs.

## Problem

Two issues prevented images from displaying in dev mode:

### 1. Nuxt 4 `dir.public` Default

Nuxt 4 (`compatibilityDate: '2025-07-15'`) defaults `dir.public` to `app/public/` relative to the `srcDir`. PM projects use a project-root `public/` directory. Vite's dev server served from `app/public/` (non-existent), so static PNGs, logos, and favicons returned 404 in dev.

Production was unaffected because Nitro copies `public/` into `.output/public/` during build.

### 2. AVIF/WebP `<source>` Elements with No Content

`getResponsiveImagePaths()` and `getSrcSet()` in `app/utils/image-assets.ts` unconditionally returned AVIF and WebP paths. In dev mode, `optimize-assets.mjs` does not run (it is a `prebuild`/`postinstall` hook, not `predev`), so no `.avif` or `.webp` files exist.

The `<picture>` element's `<source type="image/avif">` with 404 URLs causes browsers (Chrome, Firefox, Edge) to show broken images without falling back to the `<img>` PNG fallback.

### 3. Existing but Unused Dev/Prod Logic

`getRasterImagePath()` in `image-assets.ts` already contained dev/prod switching:

```typescript
return isProduction ? `${basePath}.avif` : `${basePath}.png`
```

This function was never called by components. `PictureImage`, `BeforeAfterSlider`, `getBackgroundImageSet`, and `getPictureSources` all bypassed it and used `getResponsiveImagePaths()`/`getSrcSet()` directly — neither of which checked the environment.

## Framework Change

Three targeted changes at the framework level:

### 1. `nuxt.config.ts` — `dir.public`

Set `dir.public` to the project-root `public/` directory:

```typescript
dir: {
  public: join(rootDir, 'public')
}
```

This makes Vite serve `public/images/*.png`, `public/logos/*.svg`, `public/madebylogos/*.svg`, `public/favicon.*` etc. in dev mode. No replacement of Nitro `publicAssets` (which serves optimized images from the cache in production).

### 2. `app/utils/image-assets.ts` — Dev/Prod Gating

Wired environment-aware logic into four functions that components actually use:

**`getResponsiveImagePaths()`:**
```typescript
return {
  avif: isProduction ? `${basePath}.avif` : '',
  webp: isProduction ? `${basePath}.webp` : '',
  png: `${basePath}.png`
}
```

In dev, `avif` and `webp` return empty string. The `<source :srcset="">` element renders with empty `srcset` — the browser skips the broken source and falls through to the `<img>` PNG.

**`getSrcSet()`:**
```typescript
if (!isProduction && (format === 'avif' || format === 'webp')) {
  return ''
}
```

In dev, `PictureImage.vue`'s `v-if="avifSrcSet"` evaluates to falsy and skips the `<source>` element entirely.

**`getBackgroundImageSet()`:**
```typescript
if (!isProduction) {
  return { imageSet: pngUrl, pngFallback: pngUrl }
}
```

In dev, CSS `background-image` uses raw PNG directly. In prod, uses `image-set()` with AVIF/WebP/PNG negotiation.

**`getPictureSources()`:**
```typescript
if (!isProduction) {
  return [{ srcset: getSrcSet(path, widths, 'png'), type: 'image/png' }]
}
```

In dev, returns a single PNG source. In prod, returns the full AVIF/WebP/PNG chain with media queries.

### 3. `getRasterImagePath()` Preserved

The existing `getRasterImagePath()` function remains unchanged. It was the original design intent — dev/prod switching at the path level. The functions above now implement the same logic inline to avoid breaking existing callers that expect the `{ avif, webp, png }` return shape.

## Files To Port

Primary implementation:

- `app/utils/image-assets.ts`
- `nuxt.config.ts`

Affected components (no changes needed — they continue using existing API):

- `app/components/atoms/PictureImage.vue`
- `app/components/molecules/BeforeAfterSlider.vue`
- Any component calling `getResponsiveImagePaths()`, `getSrcSet()`, `getBackgroundImageSet()`, `getPictureSources()`

## Porting Checklist

1. Ensure `dir.public` in `nuxt.config.ts` resolves to the project-root `public/` directory (Nuxt 4 only — Nuxt 3 projects with `srcDir: '.'` already serve root `public/`).
2. Apply the four function changes in `app/utils/image-assets.ts`.
3. Verify that `getRasterImagePath()` already exists and works (it is the original design intent).
4. Verify that `optimize-assets.mjs` still runs on `prebuild` and `postinstall` (not on `predev`).
5. Verify that Nitro `publicAssets` still maps the optimized cache (for production only, not dev).

## Validation

Dev mode:
```bash
npm run dev
# Visit any page with images — raw PNGs should display
# Confirm in DevTools Network tab: only .png requests, no .avif/.webp
```

Production build:
```bash
npm run build
node .output/server/index.mjs
# Verify .avif/.webp are generated and served
curl -sI http://localhost:3000/images/roman.avif
curl -sI http://localhost:3000/images/roman.webp
# Both return Content-Type: image/avif and image/webp respectively
```

## Compatibility Impact

Low risk.

- Components continue using the same `getResponsiveImagePaths()` / `getSrcSet()` API — no breaking changes
- The return type `{ avif, webp, png }` is unchanged
- Dev mode behavior changes: `<source>` elements get empty `srcset` instead of 404-ing URLs
- Production behavior is identical to before
- `getRasterImagePath()` continues working with identical behavior

## Security Review

No auth, RBAC, secrets, user input, or storage permission surface changes. The change only affects which URLs are emitted in dev-mode `<picture>` and `background-image` markup.

## DevOps Review

No build pipeline changes. `optimize-assets.mjs` continues to run on `prebuild` and `postinstall` only. `predev` remains `mkdir -p data` only.

Rollback:
1. Revert `getResponsiveImagePaths()`, `getSrcSet()`, `getBackgroundImageSet()`, `getPictureSources()` to unconditionally return all formats.
2. Remove `dir.public` from `nuxt.config.ts` (if project has no other need for it).
3. Restart dev server.

## Future Optional Work

Consider removing the standalone `getRasterImagePath()` function. With all four consumer-facing functions now handling dev/prod internally, `getRasterImagePath()` is redundant. Components that need a single-format path can use `getResponsiveImagePaths().png` for PNG or format-specific paths from the other functions.
