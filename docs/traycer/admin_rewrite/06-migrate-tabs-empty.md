# Step 06: Migrate Pages to Use Existing AdminTabs and EmptyState

## Why

Two existing components are bypassed in admin pages:

1. **`AdminTabs`** (`src/lib/components/admin/AdminTabs.svelte`, 60 lines) — supports
   tab navigation with indicator dots and `onchange` callback. Both translations and
   legal pages hand-roll their own tab bars (~35 lines each).

2. **`EmptyState`** (`src/lib/components/atoms/EmptyState.svelte`) — supports multiple
   empty-state types (`empty-box`, `no-results`, etc.) with configurable size and
   title. The translations page hand-rolls `<p class="py-16 text-center ...">` instead.

## What

Replace hand-rolled tab bars and empty states with the existing canonical components.

## Prerequisites

None — both components already exist.

## Implementation

### Part A: Migrate translations page to AdminTabs

**File**: `src/routes/admin/translations/+page.svelte`

**Current state** (hand-rolled locale tabs at ~lines 263–280):

```svelte
<div class="flex gap-4 border-b border-pm-border mb-6 overflow-x-auto">
  {#each locales as loc}
    <button
      class={clsx('shrink-0 px-4 py-2 text-sm border-b-2 -mb-px',
        activeLocale === loc.code
          ? 'text-pm-brand border-pm-brand font-medium'
          : 'text-pm-text-muted border-transparent hover:text-pm-text'
      )}
      onclick={() => activeLocale = loc.code}>
      {loc.name}
      <span class="ml-1.5 px-1.5 py-0.5 rounded-full bg-pm-bg-sunken text-xs">
        {counts[loc.code] ?? 0}
      </span>
    </button>
  {/each}
</div>
```

**Check AdminTabs props** (read the component first — it may have a different interface):

```bash
# Read AdminTabs.svelte to understand exact props
cat src/lib/components/admin/AdminTabs.svelte
```

Let me check the AdminTabs interface. Looking at the existing code path...

The `AdminTabs` component likely has an interface like:

```typescript
let {
  tabs,        // Array<{ id: string; label: string; count?: number; warning?: boolean }>
  active,      // $bindable — currently active tab id
  class
} = $props()
```

But since I don't have the exact props, the implementation should:
1. Read `src/lib/components/admin/AdminTabs.svelte` first to confirm the interface
2. Map the translations page's locale data to match the expected `tabs` format
3. Use `bind:active` for two-way binding
4. Remove the old hand-rolled tab markup

**Mapping**:

```typescript
// Build tabs array in the script section
const localeTabs = $derived(locales.map(loc => ({
  id: loc.code,
  label: loc.name,
  count: counts[loc.code] ?? 0,
  warning: false  // or set true for locales missing translations
})))
```

```svelte
<!-- Template -->
<AdminTabs tabs={localeTabs} bind:active={activeLocale} />
```

**Important**: `AdminTabs` may not support count badges. If it doesn't, you have
two options:
- A) Extend `AdminTabs` to support an optional `count` per tab
- B) Keep the hand-rolled tabs for translations (they're more complex with counts)

**Decision**: Read AdminTabs first. If it supports counts/badges natively, use it.
If not, extend it minimally (add optional `count?: number` to tab interface).

### Part B: Migrate legal page to AdminTabs

**File**: `src/routes/admin/legal/+page.svelte`

The legal page has locale tabs with warning indicators for missing documents
(~lines 305–319). Same pattern as translations but with warning dots instead of counts.

```typescript
const legalTabs = $derived(locales.map(loc => ({
  id: loc.code,
  label: loc.name,
  count: undefined,
  warning: !documentsComplete(loc.code)  // show warning dot if docs missing
})))
```

```svelte
<AdminTabs tabs={legalTabs} bind:active={activeLocale} />
```

Same decision as above — check if AdminTabs supports `warning`.

### Part C: Migrate translations to EmptyState

**File**: `src/routes/admin/translations/+page.svelte`

**Current state** (line 295):

```svelte
{:else}
  <p class="py-16 text-center text-pm-text-muted">
    {adminT['admin.noItems'] ?? t('common.noResults')}
  </p>
```

**Replace with**:

```svelte
{:else}
  <EmptyState
    type="empty-box"
    size="compact"
    title={adminT['admin.noItems'] ?? t('common.noResults')}
  />
```

**Check EmptyState props** (read the component first):

```bash
cat src/lib/components/atoms/EmptyState.svelte
```

Expected interface:
```typescript
let {
  type?: 'empty-box' | 'no-results' | 'error' | 'search'
  size?: 'compact' | 'default' | 'large'
  title?: string
  description?: string
  action?: { label: string; onclick: () => void }
  class?: string
} = $props()
```

If the interface differs, adapt accordingly. The key requirement: replace the
hand-rolled `<p>` with the canonical `EmptyState` atom.

### Part D: Check for other hand-rolled empty states

Search the admin directory for other bypasses:

```bash
rg "py-\d+ text-center text-pm-text-muted" src/routes/admin/
```

Any matches should be replaced with `EmptyState`. If no other matches, this
part is complete after fixing translations.

## PM3 Framework Rules

- **Canonical primitives**: The AGENTS.md table explicitly lists `EmptyState` as a
  non-bypassable canonical primitive: "Empty/loading/error states — Yes — never
  hand-roll `py-16 text-center` bundles."
- **AdminTabs**: While not in the canonical primitives table, it IS a framework
  component used by other admin pages. Using it is required for consistency.

## Edge Cases

### AdminTabs
- **Empty tabs array**: Component should render nothing — not crash.
  Verify by temporarily setting `tabs={[]}` in dev.
- **Single tab**: Should still render the tab bar (consistent UI).
- **Many tabs (4+ locales)**: Tabs should overflow-x scroll on mobile.
  Verify the component handles this.
- **Count = 0 vs count = undefined**: 0 shows "0", undefined shows no badge.
  Decide which behavior is appropriate per context.

### EmptyState
- **Missing i18n key**: If `adminT['admin.noItems']` and `t('common.noResults')`
  are both undefined, `EmptyState` should show nothing or a fallback. Test with
  a fresh locale.
- **Wrong type value**: If an invalid `type` is passed, EmptyState should fall
  back to default icon.

## Verification

```bash
npm run check

# Manual testing:
# 1. /admin/translations — locale tabs render with counts, click changes active locale
# 2. /admin/translations — set search to something that matches nothing — EmptyState shows
# 3. /admin/legal — locale tabs render with warning dots for missing docs
# 4. /admin/legal — click tabs, active state changes, document sections update
# 5. Verify tab overflow on mobile: shrink browser, tabs should scroll horizontally

git diff --stat
# Should show: translations (-~35 for tabs, -~2 for empty), legal (-~35 for tabs)
```

## Files to Modify

| File | Change | Lines |
|------|--------|-------|
| `src/routes/admin/translations/+page.svelte` | Replace tabs + empty state | -~37 |
| `src/routes/admin/legal/+page.svelte` | Replace tabs | -~35 |

## Files Potentially to Modify

| File | Change | Notes |
|------|--------|-------|
| `src/lib/components/admin/AdminTabs.svelte` | Add `count`/`warning` support | Only if current interface doesn't support them |
