# PM Rule: No `font-style: italic` — Use Real Italic Fonts Only

Date: 2026-06-05

Status: mandatory rule. Applies to all PM projects.

## Rule

**NEVER use `font-style: italic` in CSS to italicize text.** Always load a real italic font file via `@font-face` and use `font-family` to select it.

```css
/* ❌ WRONG — browser synthesizes fake italic */
font-family: 'Roboto', var(--fallback-sans);
font-style: italic;

/* ✅ CORRECT — uses real italic font file */
font-family: 'Roboto Italic', var(--fallback-sans);
```

## Why

Browser-synthesized italic (faux italic) produces uneven, poorly spaced glyphs that degrade readability, especially in Cyrillic and at body text sizes. Real italic fonts are designed by the type foundry with proper letterforms, spacing, and kerning.

## How to Add a Real Italic Font

### 1. Download the italic `.woff2` file

Place it in `app/assets/css/typography/fonts/<family>/`.

### 2. Register it as a named family in `font-faces.css`

```css
@font-face {
  font-family: 'FontName Italic';   /* distinct family name */
  font-style: normal;               /* NOT italic! */
  font-weight: 400;
  font-display: swap;
  src: url('./fonts/family/font-italic-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, ...;
}
```

### 3. Use `font-family` in CSS — no `font-style`

```css
.card-description {
  font-family: 'FontName Italic', var(--fallback-sans);
}
```

## Existing Exceptions

Some elements in the codebase still use `font-style: italic` because Roboto Slab has no italic variant. These are browser-synthesized by necessity:

| File | Selector | Status |
|------|----------|--------|
| `testimonials.css:88` | `.testimonial-card__quote` | Acceptable — Roboto Slab, no italic variant |
| `init.css:459` | `.import-files .more-files` | Acceptable — admin setup wizard |
| `admin/pages.css:178` | `.testimonials-admin-item__quote` | Acceptable — admin panel |

When adding new italic needs, always prefer a real italic font over adding to this list.
