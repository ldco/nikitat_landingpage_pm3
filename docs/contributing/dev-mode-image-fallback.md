# PM Dev-Mode Image Fallback to Raw PNG

Date: 2026-06-08

Status: implemented in this repository.

Derivative scope: all PM projects that use the `<picture>` image component layer and the build-time image optimizer.

## Goal

Images must display correctly during development (`npm run dev`) without requiring a full asset optimization pass. In dev mode, the framework serves raw source PNGs directly. In production, the browser negotiates AVIF/WebP/PNG through `<picture>` elements backed by `optimize-assets.mjs` outputs.

## Problem

Three issues prevented images from displaying in dev mode:

### 1. Nuxt 4 `dir.public` Default

Nuxt 4 (`compatibilityDate: '2025-07-15'`) defaults `dir.public` to `app/public/` relative to the `srcDir`. PM projects use a project-root `public/` directory. Vite's dev server served from `app/public/` (non-existent), so static PNGs, logos, and favicons returned 404 in dev.

Production was unaffected because Nitro copies `public/` into `.output/public/` during build.

### 2. Nitro `publicAssets` Intercepts `/images/` Before Vite

Nitro's `publicAssets` config mapped `/images/` to `node_modules/.cache/pm-assets/images/` for serving optimized images in production. However, this same config was active in dev mode too — Nitro intercepted `/images/*` requests BEFORE Vite could serve them from `public/images/`. Since `optimize-assets.mjs` doesn't run in dev, the cache directory was empty, resulting in 404.

Fix: make `publicAssets` conditional on production:

```typescript
nitro: {
  publicAssets: process.env.NODE_ENV === 'production'
    ? [{ dir: optimizedImagesPublicDir, baseURL: '/images' }]
    : [],
}
```

### 3. AVIF/WebP `<source>` Elements with No Content

`getResponsiveImagePaths()` and `getSrcSet()` in `app/utils/image-assets.ts` unconditionally returned AVIF and WebP paths. In dev mode, `optimize-assets.mjs` does not run (it is a `prebuild`/`postinstall` hook, not `predev`), so no `.avif` or `.webp` files exist.

The `<picture>` element's `<source type="image/avif">` with 404 URLs causes browsers (Chrome, Firefox, Edge) to show broken images without falling back to the `<img>` PNG fallback.

### 3. Existing but Unused Dev/Prod Logic

`getRasterImagePath()` in `image-assets.ts` already contained dev/prod switching:

```typescript
return isProduction ? `${basePath}.avif` : `${basePath}.png`
```

This function was never called by components. `PictureImage`, `BeforeAfterSlider`, `getBackgroundImageSet`, and `getPictureSources` all bypassed it and used `getResponsiveImagePaths()`/`getSrcSet()` directly — neither of which checked the environment.

## Framework Change

Four targeted changes at the framework level:

### 1. `nuxt.config.ts` — `dir.public`

Set `dir.public` to the project-root `public/` directory:

```typescript
dir: {
  public: join(rootDir, 'public')
}
```

This makes Vite serve `public/images/*.png`, `public/logos/*.svg`, `public/madebylogos/*.svg`, `public/favicon.*` etc. in dev mode.

### 2. `nuxt.config.ts` — Nitro `publicAssets` Conditional

Nitro's `/images/` public asset route must only be active in production. In dev mode it intercepts requests before Vite can serve raw PNGs from `public/images/`:

```typescript
nitro: {
  publicAssets: process.env.NODE_ENV === 'production'
    ? [{ dir: optimizedImagesPublicDir, baseURL: '/images' }]
    : [],
}
```

In production, Nitro serves optimized AVIF/WebP from the pm-assets cache. In dev, the raw PNGs are served directly by Vite from `public/images/`.

### 3. `app/utils/image-assets.ts` — Dev/Prod Gating

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

### 4. `getRasterImagePath()` Preserved

The existing `getRasterImagePath()` function remains unchanged. It was the original design intent — dev/prod switching at the path level. The functions above now implement the same logic inline to avoid breaking existing callers that expect the `{ avif, webp, png }` return shape.

## Files Changed

- `nuxt.config.ts` — added `dir.public` and conditional Nitro `publicAssets`
- `app/utils/image-assets.ts` — dev/prod gating in 4 functions

## Affected Components (no changes needed)

- `app/components/atoms/PictureImage.vue`
- `app/components/molecules/BeforeAfterSlider.vue`
- Any component calling `getResponsiveImagePaths()`, `getSrcSet()`, `getBackgroundImageSet()`, `getPictureSources()`

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
