# Step 10: Enable Pricing Module + Add Actions to List Page

## Why

Pricing admin page returns 404 because `ADMIN_CONFIG.websiteModules.pricing.enabled = false`.

**Gate analysis** (see ADR-001 in master plan):
- `ADMIN_CONFIG.websiteModules.pricing.enabled = false` → admin page 404
- `MODULES.pricing.enabled = true` → public pricing IS live
- Fix: set `ADMIN_CONFIG.websiteModules.pricing.enabled = true`. No public site impact.

The list page (32 lines) shows a card grid with `name`/`price`/`slug`/`featured` but
no Create/Edit/Delete actions.

## What

1. Enable pricing admin: `ADMIN_CONFIG.websiteModules.pricing.enabled = true`
2. Rewrite list page to use `AdminDataTable` + actions (portfolio page pattern)

## Implementation

### Part A: Enable pricing admin

**File**: `src/project/site-config.ts`

```typescript
// Change:
pricing: { enabled: false, roles: ['master', 'admin'] },
// To:
pricing: { enabled: true, roles: ['master', 'admin'] },
```

### Part B: Rewrite list page

Use real schema columns:
- `pricingTiers`: `id`, `slug`, `name`, `price`, `currency`, `period`, `featured`, `published`, `order`
- `pricingTierTranslations`: `tierId`, `locale`, `name` (optional override)
- Server load: join translations with `eq(locale, the locale resolved via `detectAdminLocale(event)`)`, fallback to base `name`

Columns for `AdminDataTable`: `name`, `price`, `period`, `featured`, `status`.
Actions: Edit (`ADMIN_ROUTES.pricingEdit(id)`), Delete (`adminDelete('pricing', id)`).

## Verification

```bash
npm run check
# 1. /admin/pricing — page loads (no longer 404)
# 2. AdminDataTable shows tiers with correct columns
# 3. Create/Edit/Delete work
```

## Files to Modify

| File | Action |
|------|--------|
| `src/project/site-config.ts` | Set `ADMIN_CONFIG.websiteModules.pricing.enabled = true` |
| `src/routes/admin/pricing/+page.svelte` | Rewrite with AdminDataTable + actions |
| `src/routes/admin/pricing/+page.server.ts` | Add locale-filtered translation join |
