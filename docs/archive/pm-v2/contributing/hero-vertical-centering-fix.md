# PM Hero Vertical Centering Fix

Date: 2026-06-05

Status: implemented in this repository.

Derivative scope: all PMNative projects using the `.section-hero--left` modifier class.

## Problem

When `.section-hero--left` is applied to the hero section, `align-items: flex-start` on the grid container pushes both the animated logo (left column) and the text container (right column) to the top of the viewport. This makes the hero content appear top-heavy and unbalanced, especially when the logo is smaller than the text column.

The `.section-hero` base class correctly sets `align-items: center` on the CSS grid, but `.section-hero--left` overrides this with `align-items: flex-start`.

## Solution

Changed `.section-hero--left` in `app/assets/css/layout/sections.css` from `align-items: flex-start` to `align-items: center`. This centers both grid children (logo + text container) vertically within the viewport while preserving left text alignment via `align-items: flex-start` on the inner `.container`.

### Changed file

- `app/assets/css/layout/sections.css` — line 183: `.section-hero--left { align-items: center; }`

### Key observations

- The `.section-hero > .container` child already uses `justify-content: center` for internal vertical centering of the text stack
- The `.section-hero--left > .container` child sets `align-items: flex-start` for left text alignment, which is preserved
- Grid-level `align-items: center` centers the entire container and logo as atomic grid items
- This fix does not affect mobile breakpoints which already reset all heroes to left-aligned
