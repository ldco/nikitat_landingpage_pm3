# PM Google Fonts Variable Axis Stripping Gotcha

Date: 2026-06-06

Status: documented — project-specific mitigation, not a framework bug.

Derivative scope: any PM project using a variable font from Google Fonts where the CSS API strips certain variation axes (CRSV, SHRP, slnt, MONO, etc.).

## Problem

Google Fonts serves **subsetted variable fonts** that often strip non-weight variation axes from the woff2 files. In the case of **Geologica**:

| Source | Available axes | Font name |
|--------|---------------|-----------|
| Google Fonts CSS API (`fonts.googleapis.com/css2`) | `wght` only | "Geologica Thin **Roman**" |
| NPM `@fontsource-variable/geologica` (crsv variant) | `wght`, **`CRSV`** | "Geologica Thin" |
| NPM `@fontsource-variable/geologica` (full variant) | `wght`, `CRSV`, `SHRP`, `slnt` | "Geologica Thin" |

The Google Fonts CSS API returns files with only the `wght` axis. The CRSV (cursive) axis, which controls Geologica's cursive single-story `a`, is **entirely absent** from the served woff2 files. No amount of CSS `font-feature-settings` or `font-variation-settings` will enable cursive forms when the axis isn't in the binary.

Additionally, Geologica uses a **variation axis** (`CRSV`), not an OpenType stylistic set (`ss01`), to control cursive letterforms. A common misconception is that `font-feature-settings: "ss01" on` would enable the cursive `a` — it does not. The correct CSS is:

```css
font-variation-settings: 'CRSV' 1;
```

## Solution

**Do not download font files via `curl` from the Google Fonts CSS API** — those files are subsetted and may strip axes. Instead, use the `@fontsource-variable/{fontname}` NPM package, which ships full axis variants.

### For Geologica specifically

1. Install the package:
   ```
   npm install @fontsource-variable/geologica
   ```

2. Extract the `*-crsv-*.woff2` files from `node_modules/@fontsource-variable/geologica/files/` into your project's `assets/css/typography/fonts/` directory. The `crsv` variant includes both `wght` and `CRSV` axes at minimum file size.

3. In `typography/font-faces.css`, declare `@font-face` with the `crsv` font files. Keep the same unicode-range subsets.

4. In CSS, enable cursive forms via the variation axis:
   ```css
   :root {
     font-variation-settings: 'CRSV' 1;
   }
   ```

### For other Google Fonts variable fonts

Always verify axes before relying on them:

```bash
python3 -c "
from fontTools.ttLib import TTFont
font = TTFont('path/to/font.woff2')
if 'fvar' in font:
    for axis in font['fvar'].axes:
        print(f'{axis.axisTag}: {axis.minValue} - {axis.maxValue}')
"
```

If the axis you need is missing, source the font from `@fontsource-variable` or the foundry's own distribution.

## Key observations

- Google Fonts' subsetting strips non-weight axes to reduce file size. This is by design, not a bug.
- `@fontsource-variable` packages ship separate files per axis combination (`*crsv*.woff2`, `*shrp*.woff2`, `*full*.woff2`, etc.), allowing you to pick only what you need.
- Always **inspect the actual font binary** with fontTools — don't rely on documentation or CSS API responses to determine available axes.
- CRSV axis is `font-variation-settings`, NOT `font-feature-settings` (which is for OpenType GSUB features like ligatures, old-style numerals, etc.).
