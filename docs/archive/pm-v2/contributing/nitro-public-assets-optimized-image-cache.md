# PM Nitro Public Assets Optimized Image Cache

Date: 2026-05-20

Status: implemented in this repository.

Derivative scope: all PMNative Nuxt/Nitro projects that use the PM build-time image optimizer.

## Goal

Ensure final production builds serve optimized image outputs from the framework asset optimizer, including AVIF, WebP, and optimized PNG fallbacks.

## Problem

The PM build pipeline ran `assets:optimize:incremental` during `prebuild`, before `nuxt build`.

That produced optimized files under `.output/public/images`, but Nuxt/Nitro later regenerated `.output/public` during its own build process. The Nitro public copy step replaced the optimized files with raw files from `public/`, so production could still serve large source PNGs even though the optimizer had completed successfully.

This is especially harmful for Lighthouse-focused pages with large above-the-fold images. In project builds with scene PNGs that are several megabytes in `public/`, optimized final assets should be hundreds of kilobytes or less.

## Framework Change

1. Keep source images in `public/images`.
2. Keep `scripts/optimize-assets.mjs` writing optimized outputs to `node_modules/.cache/pm-assets/images`.
3. Mount that optimized cache in `nuxt.config.ts` through Nitro `publicAssets` at `baseURL: '/images'`.
4. Let Nitro copy and index the optimized cache as the authoritative `/images` public asset directory during final build.
5. Keep raw `public/` assets as the source-of-truth input, not as the final production-serving source for optimized image paths.

This avoids relying on prebuild writes to `.output/public`, because `.output/public` is a generated directory owned by Nitro during `nuxt build`.

## Related Image Format Fix

The optimizer must generate WebP for transparent PNGs. WebP supports alpha, so skipping WebP only because a source PNG has an alpha channel leaves production without the expected WebP fallback.

The format chain should be:

1. AVIF
2. WebP
3. optimized PNG fallback

## Files To Port

Primary implementation:

- `scripts/optimize-assets.mjs`
- `nuxt.config.ts`

Affected components should use the framework image path helpers or `<picture>` markup instead of hardcoded `.png` paths:

- `app/utils/image-assets.ts`
- `app/components/atoms/PictureImage.vue`
- project-specific visual components that currently reference `/images/**/*.png`

## Porting Checklist

1. Update `scripts/optimize-assets.mjs` so transparent raster images generate WebP.
2. Bump the optimizer manifest version so incremental builds regenerate stale cache entries.
3. Add a Nuxt config constant for `node_modules/.cache/pm-assets/images`.
4. Add a Nitro `publicAssets` entry:

```ts
publicAssets: [
  {
    dir: optimizedImagesPublicDir,
    baseURL: '/images'
  }
]
```

5. Ensure `npm run build` still runs the optimizer before Nuxt so the cache exists before Nitro copies public assets.
6. Update hardcoded image consumers to request AVIF/WebP/PNG through the framework image contract.
7. Verify final `.output/public/images` contains `.avif`, `.webp`, and optimized fallback `.png`.
8. Verify the built Nitro server returns correct content types for optimized assets.

## Validation

Run:

```bash
npm run build
curl -sI http://localhost:<port>/images/<path>.avif
curl -sI http://localhost:<port>/images/<path>.webp
curl -sI http://localhost:<port>/images/<path>.png
```

Expected:

- `.avif` returns `Content-Type: image/avif`
- `.webp` returns `Content-Type: image/webp`
- `.png` returns `Content-Type: image/png`
- final `.output/public/images` sizes match optimizer outputs, not raw source files

## Compatibility Impact

Medium-low risk.

The public URL contract remains `/images/...`, but final production content changes from raw source files to optimized outputs. Projects that intentionally depend on unoptimized original files under `/images` should move those files outside the optimizer-controlled `public/images` tree or add an explicit optimizer exclusion.

## Security Review

No auth, RBAC, secrets, user input, or storage permission surface changes. The change only affects static public asset generation and serving.

## DevOps Review

This is a build pipeline correctness fix. Rollback is straightforward:

1. Remove the Nitro `publicAssets` optimized image cache entry.
2. Revert the optimizer WebP alpha change.
3. Rebuild.

However, rollback may reintroduce oversized production image payloads and Lighthouse regressions.

## Future Optional Work

Add a build assertion that fails when final `.output/public/images` does not contain expected optimized formats for raster source images. This would catch regressions where Nitro public asset copying, cache invalidation, or optimizer ordering changes silently remove AVIF/WebP outputs.
