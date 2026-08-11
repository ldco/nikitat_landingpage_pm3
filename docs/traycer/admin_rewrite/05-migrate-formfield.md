# Step 05: Migrate Admin Form Pages to Use FormField Atom

## Why

`src/lib/components/atoms/FormField.svelte` (112 lines) already exists with support for
`text`, `email`, `password`, `tel`, `url`, `number`, `textarea`, `checkbox` types, plus
error display. It follows all PM3 rules: `class` + `twMerge`, design tokens, typed props.

**Not a single admin form page uses it.** Instead, every create/edit form page hand-rolls
the same `<div class="flex flex-col gap-1.5"><label><input></div>` pattern ~15 times
across 5+ files. This is the definition of a canonical primitive bypass.

## What

Replace all raw `<input>` + `<label>` + error-display markup in admin form pages with
`<FormField>` components. This does NOT change any form logic (Zod schemas, form action
handlers, CSRF tokens) — only the template markup.

## Prerequisites

None — FormField already exists. No new components needed.

## Pages to Migrate

| File | Fields to Replace | Notes |
|------|------------------|-------|
| `admin/blog/create/+page.svelte` | 1 field (`slug`) | Simplest case — one field |
| `admin/blog/[id]/edit/+page.svelte` | 1 field (`slug`) | Same as create, pre-filled |
| `admin/faq/create/+page.svelte` | 1 field (`slug`) | Same pattern |
| `admin/faq/[id]/edit/+page.svelte` | 1 field (`slug`) | Same pattern |
| `admin/features/create/+page.svelte` | 2 fields (`slug`, `order`) | Two inputs |
| `admin/features/[id]/edit/+page.svelte` | 2 fields (`slug`, `order`) | Same |
| `admin/pricing/create/+page.svelte` | 5 fields (`name`, `slug`, `price`, `featured`, `order`) | Most fields to migrate |
| `admin/pricing/[id]/edit/+page.svelte` | 5 fields | Same |
| `admin/portfolios/create/+page.svelte` | Several fields | Check exact fields |
| `admin/portfolios/[id]/edit/+page.svelte` | Several fields | Same |
| `admin/users/+page.svelte` | 4 fields (in modals) | email, password, name, role |
| `admin/security/+page.svelte` | 3 fields | Password change form |
| `admin/legal/+page.svelte` | 7 fields | Company details (name, address, etc.) |
| `admin/settings/+page.svelte` | N fields | Dynamic form — harder |

### Before (current pattern in every file)

```svelte
<div>
  <label for="field-slug" class="block text-sm font-medium text-pm-text mb-1">
    {adminT['admin.slug']}
  </label>
  <input type="text" name="slug" id="field-slug" bind:value={slug} required
    class="w-full px-3 py-2 border border-pm-border rounded-lg bg-pm-bg text-pm-text" />
  {#if errors.slug?.[0]}
    <p class="text-xs text-pm-danger mt-1">{errors.slug[0]}</p>
  {/if}
</div>
```

### After (using FormField)

```svelte
<script>
  import FormField from '$lib/components/atoms/FormField.svelte'
</script>

<FormField
  name="slug"
  label={adminT['admin.slug'] ?? t('admin.slug')}
  bind:value={slug}
  error={errors.slug?.[0] ?? ''}
  required
/>
```

### FormField Props Reference

From `src/lib/components/atoms/FormField.svelte`:

```typescript
type InputType = 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'textarea' | 'checkbox'

let {
  name: string                    // input name attribute
  label: string                   // display label (i18n resolved)
  type?: InputType                // default 'text'
  placeholder?: string            // default ''
  value?: string | boolean        // $bindable — two-way binding
  error?: string                  // error message to display
  required?: boolean              // default false
  disabled?: boolean              // default false
  class?: string                  // additional CSS classes
  oninput?: (e: Event) => void    // custom input handler
} = $props()
```

Key behavior:
- When `type === 'checkbox'`, renders a checkbox with label beside it
- When `type === 'textarea'`, renders `<textarea>` with `rows={4}`
- Error message displays below the field in `text-xs text-pm-danger`
- Required fields show a red asterisk `*` next to the label
- Supports two-way binding via `$bindable`

### Special Cases

**Checkbox fields**:
```svelte
<FormField
  name="published"
  type="checkbox"
  label={t('admin.published')}
  bind:value={published}  <!-- boolean -->
/>
```

**Textarea fields**:
```svelte
<FormField
  name="description"
  type="textarea"
  label={t('admin.description')}
  bind:value={description}
/>
```

**Select/dropdown fields**: `FormField` does NOT support `<select>`. For these,
keep the raw `<select>` markup but wrap it in a consistent container that
matches FormField's visual style. OR, extend FormField to support `type="select"`
with `options` prop. Decision: keep raw `<select>` for now — add select support
in a follow-up if needed.

**Fields with custom `oninput` handlers**: Use the `oninput` prop:
```svelte
<FormField
  name="email"
  type="email"
  label={t('common.email')}
  bind:value={email}
  oninput={(e) => validateEmail(e)}
/>
```

### When NOT to migrate

- **Custom input patterns** that don't match FormField's structure (e.g.,
  date pickers, color pickers, file uploads)
- **Select/dropdown elements** — not yet supported by FormField
- **The settings page's dynamic type-aware rendering** — it already has its own
  abstraction. Migrating it to FormField would require extending FormField first.
  Leave settings for a follow-up.

## Implementation Plan

### Phase A: Simple pages (create/edit forms — 10 pages)

For each page:
1. Import `FormField` from `$lib/components/atoms/FormField.svelte`
2. For each `<input>`, `<textarea>`, or `<input type="checkbox">` field:
   - Replace the `<div>` wrapper + `<label>` + `<input>` + error `<p>` with `<FormField>`
   - Map the current `bind:value` to `FormField`'s `bind:value`
   - Map the current error to `FormField`'s `error` prop
   - Set `type`, `required`, `disabled` from the current attributes
3. Remove unused imports if the old pattern imported anything field-specific
4. Run `npm run check` after each page

### Phase B: Users page modals (2 modals)

The users page has create-user and edit-user modals with 4 fields each:
- `name` (text, required)
- `email` (email, required)
- `password` (password, required on create, optional on edit)
- `role` (select — keep raw `<select>`)

### Phase C: Legal page (7 fields)

Company details section: `companyLegalName`, `companyAddress`, `companyPhone`,
`companyEmail`, `companyRegistrationNumber`, `companyTaxId`, `legal.email`.

### Example: Blog Create Page (simplest case)

**Before** (`admin/blog/create/+page.svelte`, 30 lines):
```svelte
<div>
  <label for="field-slug">...</label>
  <input ...>
  {#if errors.slug?.[0]}<p>...</p>{/if}
</div>
```

**After**:
```svelte
<script>
  import FormField from '$lib/components/atoms/FormField.svelte'
  // ... keep existing imports
</script>
<div class="max-w-[var(--max-w-content)] mx-auto">
  <div class="flex items-center gap-4 py-4 mb-6 border-b border-pm-border">
    <a href={ADMIN_ROUTES.blog} ...>&larr; {t('common.back')}</a>
    <h1 class="text-2xl font-bold text-pm-text">{t('common.create')}</h1>
  </div>
  <form method="POST" class="max-w-lg space-y-4">
    <input type="hidden" name="_csrf" value={$page.data.csrfToken} />
    <FormField
      name="slug"
      label={adminT['admin.slug'] ?? t('admin.slug')}
      bind:value={slug}
      error={errors.slug?.[0] ?? ''}
      required
    />
    <button type="submit" class="...">{t('common.save')}</button>
  </form>
</div>
```

Note: The submit button is still raw — that's fine. The canonical `CtaButton`
migration is separate. But since the plan calls for PageHeader + CtaButton
migration in Phase 10, you can optionally use CtaButton now:

```svelte
<CtaButton type="submit" variant="primary" size="sm">{t('common.save')}</CtaButton>
```

## Verification

After migrating EACH page:
```bash
npm run check
```

After all pages:
```bash
npm run check
npm run build

# Manual: Navigate to each admin form page, verify:
# 1. All fields render correctly
# 2. Labels show correct text (i18n)
# 3. Required fields show asterisk
# 4. Submitting with validation errors shows error messages
# 5. Submitting with valid data works (form action succeeds)
# 6. Checkbox fields toggle correctly
```

## Files to Modify

Approximately 15 files. Each change is ~10 lines removed, ~5 lines added per field.
Total: ~150 lines removed, ~80 lines added across all pages.

No new files — `FormField` already exists at `src/lib/components/atoms/FormField.svelte`.
