# PM Footer Attribution Architecture: madeBy vs madeWith

Date: 2026-06-06

Status: documented architectural rule.

Derivative scope: all PM projects.

## Problem

PM has two footer attribution systems that are easily confused:

1. **`footerMadeBy`** — config block at `project/puppet-master.config.ts:142`
2. **`footerMadeWith`** — feature flag at `project/puppet-master.config.ts:135`

A developer might assume both serve the same purpose, or that `madebylogos/` is the only logo source.

## Architecture Rule

| System | Purpose | Logo source | Content |
|--------|---------|-------------|---------|
| **`madeWith`** | Framework attribution: "Made with Puppet Master" | `public/puppetmaster/` | **ALWAYS** Puppet Master logos. Framework-owned, never overridden per project. |
| **`madeBy`** | Project attribution: "Made by {client}" | Configurable via `footerMadeBy.basePath` | **Project-specific**. Set to client's brand logo. Can point to `/logos/`, `/madebylogos/`, or any path. |

### Key rules

- `madeWith` logos are **immutable** — they live in `public/puppetmaster/` and always show the PM framework badge. This is the developer's attribution.
- `madeBy` logos are **configurable** — they can point to any logo folder. The `basePath` in the config controls where logos are loaded from.
- `madebylogos/` is the **default** source for `madeBy`, but not the only option. Projects can set `basePath: '/logos'` to use project logos directly.

### For this project (Nikita T. / Fabrica 22)

```typescript
footerMadeBy: {
  text: '',                          // No text prefix, logo speaks for itself
  url: 'https://fabrica22.pro',      // Logo links to Fabrica 22
  logoAlt: 'Fabrica 22',
  basePath: '/logos',                // Reads from project logos (Fabrica 22 brand)
  available: [
    'horizontal_dark_en',
    'horizontal_dark_ru',
    'horizontal_light_en',
    'horizontal_light_ru',
    'circle_dark_en',
    'circle_light_en'
  ],
  langFallback: { en: 'en', ru: 'en', fr: 'en', he: 'en' }
}

// features.footerMadeWith: false  — PM attribution hidden (optional per project)
```

### Folder responsibilities

```
public/
├── logos/           → Project brand logos (Fabrica 22). Used by footerMadeBy when basePath='/logos'.
├── madebylogos/     → Default source for footerMadeBy. Currently Puppet Master logos (legacy).
├── puppetmaster/    → Framework-owned. ALWAYS Puppet Master. Used by footerMadeWith.
```

## Testing

1. `footerMadeBy` logo renders in footer with correct theme (light/dark) and language variant
2. Logo links to `footerMadeBy.url`
3. When `footerMadeWith: true`, the PM badge appears separately alongside `footerMadeBy`
4. When `footerMadeWith: false`, only the project logo appears
