# Step 18: Audit Gaps Batch (Translation Fallback, RTL, Health Types)

## Why

Three small but important gaps from the audit:

1. **G6 — Translation fallback**: Admin pages show raw i18n keys if the DB
   `translations` table is empty for a locale. Example: `"admin.blog"` instead of
   "Blog" when `he` locale has no admin translations seeded.

2. **G7 — RTL layout**: Hebrew (`he`) locale has `isRtlLocale()` helper but the
   admin layout uses LTR-only classes. RTL admins see a misaligned layout.

3. **G8 — Health page types**: `admin/health/+page.server.ts` returns
   `[string, string][]` tuples. The page casts them with `as`. Fragile.

## What

Fix all three in one step.

## Implementation

### Part A: Translation fallback (G6)

**File**: `src/lib/stores/content.svelte` or the admin translation loader

The `getAdminT()` function or the layout's translation loader should fall back to
Paraglide static messages when the DB translation is missing.

Current behavior:
```typescript
// If translations table has no 'admin.blog' for 'he', returns undefined
const t = getAdminT($page.data)
t['admin.blog'] // → undefined
```

Fix: Add a fallback to the unified `t()` function which already falls back to
Paraglide. The issue is that `getAdminT()` returns only DB translations. Merge
them with static catalog keys:

```typescript
export function getAdminT(pageData: AdminPageData): Record<string, string> {
  const dbTranslations = pageData.adminTranslations ?? {}
  const result: Record<string, string> = {}
  for (const key of ADMIN_KEYS) {
    result[key] = dbTranslations[key] ?? fallbackFromCatalog(key)
  }
  return result
}
```

Or, simpler: the `t()` helper in content.svelte already falls back through the
Paraglide catalog. The issue is that admin pages call `getAdminT()` which bypasses
the catalog. Fix: make `getAdminT` pass through `t()` for missing keys.

### Part B: RTL admin layout (G7)

**File**: `src/routes/admin/+layout.svelte`

Add `dir` attribute based on locale:

```svelte
<script>
  import { isRtlLocale } from '$lib/config/site'
  const currentLocale = $derived($page.params.locale ?? DEFAULT_LOCALE)
  const isRtl = $derived(isRtlLocale(currentLocale))
</script>

<div class="min-h-screen bg-pm-bg" dir={isRtl ? 'rtl' : 'ltr'}>
```

Also: sidebar/horizontal header items should flip in RTL. The fixed positioning
(`start-0`/`end-0`) needs `dir`-aware variants:
- `start-0` stays `start-0` (logical property)
- But `ms-16` / `me-2` will auto-flip with `dir="rtl"`

Verify Tailwind logical properties work correctly. If not, add RTL-specific classes:
```svelte
class:ms-16={!isRtl}
class:me-16={isRtl}
```

### Part C: Health page types (G8)

**File**: `src/routes/admin/health/+page.server.ts`

Replace:
```typescript
return { checks: [['Database', 'OK'], ...] as [string, string][] }
```

With:
```typescript
type HealthCheck = { name: string; status: 'OK' | 'ERROR'; message?: string }
const checks: HealthCheck[] = [
  { name: 'Database', status: 'OK' },
  ...
]
return { checks }
```

Update the page to use the typed interface:
```svelte
{#each items as check}
  <span>{check.name}</span>
  <Badge variant={check.status === 'OK' ? 'success' : 'error'}>{check.status}</Badge>
{/each}
```

## Verification

```bash
npm run check

# G6: Switch to Hebrew locale, verify admin pages show translated text (not raw keys)
# G7: Switch to Hebrew, admin layout flips to RTL — sidebar on right, text right-aligned
# G8: Health page shows typed badges (no console errors from type casting)
```

## Files to Modify

| File | Gap | Action |
|------|-----|--------|
| `src/lib/utils/admin-translations.ts` | G6 | Add catalog fallback |
| `src/routes/admin/+layout.svelte` | G7 | Add `dir` attribute + RTL class variants |
| `src/routes/admin/health/+page.server.ts` | G8 | Replace tuples with typed objects |
| `src/routes/admin/health/+page.svelte` | G8 | Use typed properties |
