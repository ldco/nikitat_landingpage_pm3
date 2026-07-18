# PM Hero RTL Vertical Alignment Fix

Date: 2026-06-07
Status: ENGRAVED — framework CSS fix.

Derivative scope: all PM projects with RTL locales.

## Problem

`app/assets/css/layout/sections.css` defines two hero alignment classes:

```css
.section-hero--left {
  text-align: left;
  align-items: center;       /* ✅ vertically centered */
}

.section-hero--right {
  text-align: right;
  align-items: flex-start;   /* ❌ top-aligned, not centered */
}
```

The `--right` class (used for RTL locales like Hebrew, Arabic) had `align-items: flex-start`, pushing the hero content to the top of the section. The `--left` class had `align-items: center`, keeping content vertically centered. This inconsistency meant RTL Hebrew pages had hero content at the top while LTR pages had it centered.

## Fix

Changed `section-hero--right` to use `align-items: center`:

```css
.section-hero--right {
  text-align: right;
  align-items: center;
}
```

## Root Cause

The `section-hero--right` class was likely copied from `section-hero--left` but the `align-items` property was incorrectly set to `flex-start` instead of `center`. Both classes should provide identical vertical centering — only the horizontal alignment (text-align, align-items flex direction) should differ for RTL.

## Testing

| Locale | Alignment class | Vertical centering |
|--------|----------------|-------------------|
| LTR (ru, en, fr) | `section-hero--left` | center |
| RTL (he, ar, fa, ur) | `section-hero--right` | center |
