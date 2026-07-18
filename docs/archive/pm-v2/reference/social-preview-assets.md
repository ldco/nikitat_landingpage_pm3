# Designer Web Asset Contract

This is the framework-level production contract for branded web assets that designers hand off to PM projects: social preview images, favicons, app icons, and related visual metadata.

Social preview images are design deliverables. They must not be produced as quick generated placeholders for a branded client project.

## Social Preview Output

Every PM website launch must provide an approved social preview image before production release.

Default output:

| Requirement | Value |
| --- | --- |
| Canvas size | `1200x630` px |
| Aspect ratio | `1.91:1` |
| Color profile | sRGB |
| Bit depth | 8-bit per channel |
| Recommended format | PNG or JPEG |
| Optional format | WebP only when target crawlers are verified |
| Metadata MIME | Must match `og:image:type` |
| Recommended file size | `<=300KB` |
| Warning threshold | `>1MB` |
| Production path | `public/og-image.png` unless the project config documents another path |
| Public URL | Absolute URL in rendered metadata, for example `https://example.com/og-image.png` |

## Designer Handoff

The designer must deliver:

1. Final exported social preview image.
2. Source file or source link, for example Figma.
3. Confirmation that the image is approved for production.
4. Locale strategy:
   - one language-neutral image, or
   - one image per locale, for example `og-image-en.png` and `og-image-ru.png`.
5. Brand asset source, such as logo file, mark, typography, and approved colors.

The handoff must identify the exact exported file that should be used by the framework.

## Framework Generation

PM root launch assets are separate from the responsive image optimizer. The normal image optimizer reads `public/images/` and writes generated outputs to `.output/public/images/`; it does not mutate `public/og-image.png`.

Before build and deploy, PM runs:

```bash
npm run assets:launch
```

For the social preview image, the generator prefers these source files in order:

1. `public/og-image.svg`
2. `public/og-image.source.png`
3. `public/og-image.source.jpg`
4. `public/og-image.source.jpeg`
5. existing `public/og-image.png`

It writes the production file:

```text
public/og-image.png
```

Output contract:

- `1200x630`
- PNG
- sRGB
- compressed palette output where possible
- target size under `300KB` for WhatsApp reliability

Designer source files may be larger. The shipped `public/og-image.png` must be the generated production file, not a raw design export.

## Composition Rules

Keep all critical content inside safe margins.

Recommended safe area:

| Edge | Minimum safe margin |
| --- | --- |
| Top | `90px` |
| Right | `120px` |
| Bottom | `90px` |
| Left | `120px` |

Critical content means:

- logo
- brand name
- headline
- product or company mark
- important face/product/venue detail

Do not place critical information in the top-right corner. Some preview UIs overlay controls there.

Do not rely on small text. Many messengers render the preview in a small card, crop it, or compress it.

## Branding Rules

Client/project previews must use client/project branding.

Do not ship Puppet Master default branding, placeholder logos, generated filler art, or framework watermarks unless the project explicitly chooses them as the public brand.

The image should communicate the project in one glance. It is often the largest brand surface in a shared link.

## Metadata Contract

The rendered page metadata must include:

```html
<meta property="og:image" content="https://example.com/og-image.<build-version>.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://example.com/og-image.<build-version>.png">
```

The URL must be absolute in production. Relative URLs are not acceptable for production social previews.
PM should include the current build version in the physical `og:image` and `twitter:image` file path so messenger image caches are invalidated when the asset changes. Query-string image cache busting is less reliable across messenger crawlers and proxies.

## Validation Checklist

Before launch:

1. Confirm the file exists in `public/`.
2. Confirm dimensions are exactly `1200x630`.
3. Confirm the output is 8-bit sRGB.
4. Confirm the file type matches the emitted `og:image:type`.
5. Confirm the file is not a PM default placeholder.
6. Confirm critical content is inside the safe area.
7. Confirm the rendered production HTML uses absolute `og:image` and `twitter:image` URLs.
8. Confirm the preview in Telegram or another target messenger after cache refresh.

Recommended local checks:

```bash
npm run check:launch-assets
identify public/og-image.png
file public/og-image.png
curl -fsS https://example.com/ | rg 'og:image|twitter:image|twitter:card'
```

## Cache Notes

Messengers cache previews aggressively. After changing the asset or metadata:

1. Deploy the new asset and HTML.
2. Verify the production HTML references the expected image URL.
3. Verify `og:image` and `twitter:image` include the current build version in the file path, for example `https://example.com/og-image.<build-version>.png`.
4. Use a cache-busting share URL during validation, for example `https://example.com/?v=<build-version>`.
5. Re-test in the target messenger.

Do not use cache-busting query strings as a substitute for a correct production asset contract.

## Sending A Link Without Preview Cache

When testing a changed preview, send a unique URL so the messenger treats it as a new link:

```text
https://example.com/?v=20260429-1
https://example.com/?preview=build-sha
https://example.com/?refresh=designer-approval
```

For production validation, prefer the current build version:

```text
https://example.com/?v=<build-version>
```

PM release metadata uses two related values:

| Value | Meaning | Example |
| --- | --- | --- |
| `buildSha` | Git commit SHA only | `c9e2407c3cfd` |
| `buildVersion` | Unique build/deploy version: `<commit-sha>-<utc-build-timestamp>` | `c9e2407c3cfd-20260429081640` |

Use `buildVersion` when available because the same commit can be rebuilt or redeployed. `buildSha` is still acceptable when only the commit SHA is visible.

Examples:

```text
https://example.com/?v=c9e2407c3cfd
https://example.com/?v=c9e2407c3cfd-20260429081640
```

Rules:

1. The cache-busting parameter can be any harmless query key.
2. The page must render the same public content for the cache-busted URL.
3. For cache-busted validation URLs, `og:url` should include the same validation query string so messengers do not reuse the clean URL preview cache.
4. The `og:image` and `twitter:image` URLs should use a physical build-versioned file path. A unique page URL alone may not refresh a messenger's cached image URL.
5. If the crawler still shows the old image, verify the rendered HTML and fetched image URL, for example `curl -fsS https://example.com/?v=<build-version> | rg 'og:image|twitter:image'`.

Use cache-busted URLs for validation and debugging. Send the clean canonical URL to real users after the preview is confirmed.

## Favicons And Browser Icons

Every PM website launch must include a favicon set that works for browser tabs, bookmarks, Google Search results, mobile home-screen saves, and installable/PWA contexts when enabled.

Required designer output:

| Asset | Size | Format | Path |
| --- | --- | --- | --- |
| Browser favicon | `32x32` | PNG | `public/favicon-32x32.png` |
| Legacy favicon | multi-size `16x16`, `32x32`, `48x48` | ICO | `public/favicon.ico` |
| Search favicon | at least `48x48`, square | PNG or ICO | stable URL referenced by `<link rel="icon">` |
| Apple touch icon | `180x180` | PNG | `public/apple-touch-icon.png` |
| Web app icon | `192x192` | PNG or WebP | `public/icons/icon-192x192.png` |
| Web app icon | `512x512` | PNG or WebP | `public/icons/icon-512x512.png` |
| Maskable app icon | `512x512` | PNG or WebP | `public/icons/icon-512x512-maskable.png` |

Favicon rules:

1. The favicon must be square, visually representative of the brand, and readable at very small sizes.
2. Use a simplified mark, monogram, or symbol. Do not shrink a full detailed logo if it becomes illegible at `16x16`.
3. The URL used by Search must be stable. Do not change the favicon filename every deploy.
4. Googlebot and Googlebot-Image must be able to crawl both the home page and favicon file.
5. The search favicon should be at least `48x48` or a multiple of `48x48`.
6. Do not use adult, hateful, or otherwise inappropriate symbols.
7. Test the favicon on light and dark browser UI.

Required HTML:

```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#000000">
```

## App Icon And Manifest Rules

If the project exposes a web app manifest, the icon set must be designed as app icons, not browser favicons.

Manifest icon example:

```json
{
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

Maskable icon rules:

1. Use an opaque background.
2. Keep critical logo details inside the center safe zone.
3. Treat the outer `10%` edge as potentially cropped.
4. Keep the important symbol inside a central circle with radius `40%` of the icon width.
5. Test in Chrome DevTools Application panel with the maskable safe-area overlay.

## Designer SEO Image Rules

For landing pages and public site sections, designers must provide real, inspectable visual assets that represent the product, service, person, venue, or result. Do not use generic atmospheric stock imagery when the user needs to understand the actual offer.

Image handoff must include:

1. Original source/export.
2. Web export in AVIF/WebP where PM supports it, with PNG/JPEG fallback where needed.
3. Intended display size and crop behavior for desktop and mobile.
4. Alt-text intent: decorative, descriptive, product, team/person, case study, or proof/evidence.
5. Whether the image may appear in Google Images/Discover-style surfaces.

Image SEO rules:

1. Place important images near relevant text.
2. Use descriptive filenames before upload, for example `project-team-photo.webp`.
3. Do not put critical landing-page copy only inside an image.
4. Avoid layout shifts by defining width, height, or aspect ratio.
5. Do not lazy-load the Largest Contentful Paint hero image.
6. Compress enough for performance without visible brand damage.

## Framework Follow-Up

PM runs `npm run check:launch-assets` before builds and during deploy preflight. The default check is warning-only. Use `npm run check:launch-assets:enforce` in stricter CI/release gates when missing public launch assets should fail.

## Source References

- Google Search Central: favicon requirements for Search results — <https://developers.google.com/search/docs/appearance/favicon-in-search>
- Google Search Central: image SEO best practices — <https://developers.google.com/search/docs/advanced/guidelines/google-images>
- MDN: favicon glossary — <https://developer.mozilla.org/en-US/docs/Glossary/Favicon>
- MDN: web app manifest icons — <https://developer.mozilla.org/docs/Web/Progressive_web_apps/Manifest/Reference/icons>
- web.dev: maskable icon safe zone — <https://web.dev/articles/maskable-icon>
- web.dev: LCP image guidance — <https://web.dev/articles/optimize-lcp>
