# Step 02: Extract AdminFormSection Molecule

## Why

The form section card pattern (bordered container + header with title + padded body)
is duplicated across two admin pages:
- `src/routes/admin/legal/+page.svelte` — 3 separate sections (company details at ~221,
  contact gate at ~260, document editor at ~279), each repeating ~40 lines of identical
  wrapper markup
- `src/routes/admin/settings/+page.svelte` — N dynamic sections (one per settings group
  at ~181), each repeating the same wrapper

Total duplicated: ~200 lines across two files. Every future admin form page (blog edit,
FAQ edit, features edit, pricing edit, portfolio edit, roles edit) will also need form
sections. This pattern must be a molecule.

## What

Create `src/lib/components/molecules/AdminFormSection.svelte` — a reusable section
wrapper that provides a bordered card with optional header and body slot.

After creation, refactor `legal/+page.svelte` and `settings/+page.svelte` to use it.

## Prerequisites

None — can run in parallel with Step 01.

## Implementation

### Part A: Create `src/lib/components/molecules/AdminFormSection.svelte`

**Location**: `src/lib/components/molecules/AdminFormSection.svelte`  
**Type**: Molecule

#### Props Interface

```typescript
let {
  title = '',
  class: className = '',
  children
}: {
  title?: string
  class?: string
  children?: import('svelte').Snippet
} = $props()
```

Keep it simple — the component provides the wrapper; the parent provides the form fields
as children.

#### Template Structure

```svelte
<script lang="ts">
  /**
   * AdminFormSection — card-style form section wrapper
   *
   * Provides a consistent bordered card container with optional title header.
   * Used by legal, settings, and all entity create/edit form pages.
   *
   * @props {string} [title=''] — section header title (i18n resolved by parent)
   * @props {string} [class] — additional CSS classes merged via twMerge
   * @slot children — section body content (form fields)
   *
   * @example
   * <AdminFormSection title={t('settings.general')}>
   *   <FormField name="siteName" label={t('settings.siteName')} bind:value={form.siteName} />
   * </AdminFormSection>
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'

  let {
    title = '',
    class: className = '',
    children
  }: {
    title?: string
    class?: string
    children?: import('svelte').Snippet
  } = $props()
</script>

<section class={twMerge(clsx(
  'bg-pm-bg-elevated border border-pm-border rounded-[var(--radius-xl)] overflow-hidden',
  className
))}>
  {#if title}
    <div class="flex items-center justify-between gap-4 px-6 py-4 border-b border-pm-border">
      <h2 class="text-lg font-semibold text-pm-text m-0">{title}</h2>
    </div>
  {/if}
  <div class="p-6">
    {@render children?.()}
  </div>
</section>
```

#### Design Decisions
- **No actions slot yet**: The header only shows a title. If a section needs header
  actions (like "Add item" button), add an `actions` snippet later. Keep it simple
  for now — YAGNI.
- **When `title` is empty**: The header bar (with border-bottom) is omitted entirely.
  This allows the component to be used as a plain card wrapper when no title is needed.
- **Padding**: `p-6` (24px) is consistent across all current admin sections.

### Part B: Refactor `src/routes/admin/legal/+page.svelte`

**Current state**: Three nearly identical `<section>` blocks with the same wrapper markup:

```svelte
<!-- Repeated 3 times with only title + content differing -->
<section class="bg-pm-bg-elevated border border-pm-border rounded-xl overflow-hidden">
  <div class="flex items-center justify-between gap-4 px-6 py-4 border-b border-pm-border">
    <h2 class="text-lg font-semibold text-pm-text m-0">{title}</h2>
  </div>
  <div class="p-6">
    <!-- form fields -->
  </div>
</section>
```

**Replace with**:

```svelte
<AdminFormSection title={t['legal.companyDetails']}>
  <!-- existing form fields for company details -->
</AdminFormSection>

<AdminFormSection title={t['legal.contactForm']}>
  <!-- existing contact gate checkbox -->
</AdminFormSection>

<AdminFormSection title={t['legal.documents']}>
  <!-- existing document editor + status grid -->
</AdminFormSection>
```

**Files to change**: Only the template — no script logic changes needed.

### Part C: Refactor `src/routes/admin/settings/+page.svelte`

**Pattern**: The settings page dynamically renders one `<section>` per settings group:

```svelte
{#each groups as group}
  <section class="bg-pm-bg-elevated border border-pm-border rounded-xl overflow-hidden">
    <div class="flex items-center justify-between gap-4 px-6 py-4 border-b border-pm-border">
      <h2 class="text-lg font-semibold text-pm-text m-0">{t(group.label)}</h2>
    </div>
    <div class="p-6">
      <!-- form fields for this group -->
    </div>
  </section>
{/each}
```

**Replace with**:

```svelte
{#each groups as group}
  <AdminFormSection title={t(group.label)}>
    <!-- form fields for this group -->
  </AdminFormSection>
{/each}
```

## PM3 Framework Rules

- **Canonical primitives**: This component becomes a canonical primitive for admin forms.
  Future pages MUST use it instead of hand-rolling section wrappers.
- **Design tokens**: All border radius uses `[var(--radius-xl)]` — no hardcoded `rounded-xl`.
  (Wait — `rounded-xl` IS a Tailwind class that maps to a design token. Since PM3 uses
  Tailwind, `rounded-xl` is acceptable if it maps to `--radius-xl`. Check `tailwind.config`
  or `src/app.css` `@theme` to confirm. If not, use `rounded-[var(--radius-xl)]`.)

## Edge Cases

- **No title**: Section renders as a plain bordered card with padding — useful for
  grouped fields that don't need a header.
- **Empty children**: Section renders with empty `p-6` body. Edge case — parent should
  not render the section if there are no fields.
- **Nested sections**: Sections should not be nested. If this happens, it's a parent bug.

## Verification

```bash
npm run check

# Visual check:
# 1. /admin/legal — 3 sections render with consistent borders, headers, and padding
# 2. /admin/settings — all settings groups render with consistent styling
# 3. Verify responsive: mobile padding is correct (no overflow, proper spacing)

git diff --stat
# Should show: new AdminFormSection.svelte (+~60), legal (-~80), settings (-~40)
```

## Files to Create

| File | Action |
|------|--------|
| `src/lib/components/molecules/AdminFormSection.svelte` | CREATE |

## Files to Modify

| File | Action | Lines |
|------|--------|-------|
| `src/routes/admin/legal/+page.svelte` | Replace 3 section wrappers | -~80, +~15 |
| `src/routes/admin/settings/+page.svelte` | Replace N section wrappers | -~40, +~10 |
