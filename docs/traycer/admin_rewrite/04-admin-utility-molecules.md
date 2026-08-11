# Step 04: Extract Admin Utility Molecules (ContactPicker, MarkdownEditor)

## Why

Two smaller duplicated patterns exist in the admin:

1. **ContactPicker** — `src/routes/admin/settings/+page.svelte` has two nearly identical
   toggle-button grids: the header quick items picker (~237–255) and the contact page
   items picker (~264–280). Same markup, same logic, just different state variables.

2. **MarkdownEditor** — `src/routes/admin/legal/+page.svelte` has a textarea + preview
   toggle pattern (~340–377) that pairs a raw `<textarea>` with a rendered markdown
   preview. This pattern is useful for blog content editing (Step 13).

## What

Create two molecules:

1. `src/lib/components/molecules/ContactPicker.svelte` — multi-select toggle button grid
   for contact form field configuration
2. `src/lib/components/molecules/MarkdownEditor.svelte` — textarea with live markdown
   preview toggle

Refactor settings and legal pages to use them.

## Prerequisites

None — can run in parallel with Steps 01–03.

## Implementation

### Part A: Create `src/lib/components/molecules/ContactPicker.svelte`

**Location**: `src/lib/components/molecules/ContactPicker.svelte`  
**Extracted from**: `settings/+page.svelte` lines 237–255 and 264–280

#### Design

A grid of toggle buttons. Each button represents a contact form field option
(e.g., phone, email, telegram, address). Clicking toggles it on/off. The
selected set is communicated back to the parent via `$bindable` or a callback.

#### Props Interface

```typescript
let {
  options,
  selected = $bindable([]),
  getLabel,
  getIcon,
  class: className = ''
}: {
  options: string[]
  selected?: string[]
  getLabel: (key: string) => string
  getIcon: (key: string) => typeof IconHome | undefined
  class?: string
} = $props()
```

OR, simpler — the options carry their own labels and icons:

```typescript
type ContactOption = {
  key: string
  label: string
  icon?: typeof IconHome
}

let {
  options,
  selected = $bindable([]),
  class: className = ''
}: {
  options: ContactOption[]
  selected?: string[]
  class?: string
} = $props()
```

**Decision**: Use the simpler `ContactOption` type. The parent constructs the
options array with i18n-resolved labels and icon components.

#### Template

```svelte
<script lang="ts">
  /**
   * ContactPicker — multi-select toggle button grid
   *
   * Used in admin settings to configure which contact fields appear
   * in the header quick-contact bar and on the contact page.
   *
   * @props {ContactOption[]} options — available toggle options
   * @props {string[]} selected — selected option keys (two-way bindable)
   * @props {string} [class] — additional classes
   *
   * @example
   * <ContactPicker {options} bind:selected={headerQuickItems} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import type { Component } from 'svelte'

  type ContactOption = {
    key: string
    label: string
    icon?: Component
  }

  let {
    options,
    selected = $bindable([]),
    class: className = ''
  }: {
    options: ContactOption[]
    selected?: string[]
    class?: string
  } = $props()

  function toggle(key: string) {
    if (selected.includes(key)) {
      selected = selected.filter(k => k !== key)
    } else {
      selected = [...selected, key]
    }
  }
</script>

<div class={twMerge(clsx('flex flex-wrap gap-2', className))}>
  {#each options as opt}
    <button type="button"
      onclick={() => toggle(opt.key)}
      aria-pressed={selected.includes(opt.key)}
      class={clsx(
        'inline-flex items-center gap-2 min-h-11 px-3 py-2 rounded-full border text-sm transition-all',
        selected.includes(opt.key)
          ? 'border-pm-brand bg-pm-brand text-white'
          : 'border-pm-border bg-pm-bg text-pm-text-muted hover:border-pm-brand hover:text-pm-text'
      )}>
      {#if opt.icon}
        <opt.icon class="size-5 shrink-0" />
      {/if}
      <span>{opt.label}</span>
    </button>
  {/each}
</div>
```

#### JSDoc — included in the script block above.

### Part B: Refactor settings to use ContactPicker

**Current state** (duplicated twice):

```svelte
<!-- Header quick items picker -->
<div class="flex flex-wrap gap-2">
  {#each availableContactOptions as key}
    <button ... onclick={() => toggleQuick(key)} aria-pressed={headerQuickItems.includes(key)}>
      <Icon class="size-5" /> {label}
    </button>
  {/each}
</div>

<!-- Contact page items picker — identical, different state -->
<div class="flex flex-wrap gap-2">
  {#each availableContactOptions as key}
    <button ... onclick={() => togglePage(key)} aria-pressed={contactPageItems.includes(key)}>
      <Icon class="size-5" /> {label}
    </button>
  {/each}
</div>
```

**Replace with**:

```svelte
<script>
  import ContactPicker from '$lib/components/molecules/ContactPicker.svelte'

  const contactOptions = $derived(availableContactOptions.map(key => ({
    key,
    label: optionLabel(key),  // i18n-resolved
    icon: optionIcon(key)     // icon component
  })))
</script>

<ContactPicker options={contactOptions} bind:selected={headerQuickItems} />
<ContactPicker options={contactOptions} bind:selected={contactPageItems} />
```

The parent needs to provide `optionLabel()` and `optionIcon()` functions (or
construct the options array directly). These already exist in settings as helper
functions — just reuse them.

### Part C: Create `src/lib/components/molecules/MarkdownEditor.svelte`

**Location**: `src/lib/components/molecules/MarkdownEditor.svelte`  
**Extracted from**: `legal/+page.svelte` lines 340–377

#### Design

A textarea + preview toggle. Two modes:
- **Edit mode**: Raw `<textarea>` for markdown input
- **Preview mode**: Rendered HTML from markdown

The parent provides the markdown content and a render function.

#### Props Interface

```typescript
let {
  content = $bindable(''),
  renderFn,
  label = '',
  rows = 12,
  class: className = ''
}: {
  content?: string
  renderFn: (md: string) => string  // returns HTML string
  label?: string
  rows?: number
  class?: string
} = $props()
```

Or, to avoid passing a render function, use a simple `previewHtml` prop:

```typescript
let {
  content = $bindable(''),
  previewHtml = '',
  label = '',
  rows = 12,
  class: className = ''
}: {
  content?: string
  previewHtml?: string
  label?: string
  rows?: number
  class?: string
} = $props()
```

**Decision**: Use `previewHtml` prop — the parent computes the rendered HTML
via `renderLegalMarkdown(content)` and passes it down. Simpler component, no
dependency on markdown libraries.

#### Template

```svelte
<script lang="ts">
  /**
   * MarkdownEditor — textarea with live preview toggle
   *
   * Used in admin legal page for document editing and blog content editing.
   *
   * @props {string} content — raw markdown (two-way bindable)
   * @props {string} [previewHtml=''] — rendered HTML for preview mode
   * @props {string} [label=''] — field label (i18n-resolved)
   * @props {number} [rows=12] — textarea rows
   * @props {string} [class] — additional classes
   *
   * @example
   * <MarkdownEditor bind:content={doc.markdown} previewHtml={renderLegalMarkdown(doc.markdown)} label={t('legal.privacyPolicy')} />
   */
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import IconEye from '@tabler/icons-svelte/icons/eye'
  import IconPencil from '@tabler/icons-svelte/icons/pencil'

  let {
    content = $bindable(''),
    previewHtml = '',
    label = '',
    rows = 12,
    class: className = ''
  }: {
    content?: string
    previewHtml?: string
    label?: string
    rows?: number
    class?: string
  } = $props()

  let preview = $state(false)
</script>

<div class={twMerge(clsx('flex flex-col gap-2', className))}>
  {#if label}
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-pm-text">{label}</label>
      <button type="button" onclick={() => preview = !preview}
        class="inline-flex items-center gap-1 text-xs text-pm-text-muted hover:text-pm-brand transition-colors">
        {#if preview}
          <IconPencil class="size-3.5" /> Edit
        {:else}
          <IconEye class="size-3.5" /> Preview
        {/if}
      </button>
    </div>
  {/if}

  {#if preview}
    <div class="min-h-32 p-4 border border-pm-border rounded-md bg-pm-bg-sunken prose prose-sm max-w-none text-pm-text">
      {@html previewHtml}
    </div>
  {:else}
    <textarea
      bind:value={content}
      rows={rows}
      class="w-full px-3 py-2 rounded-md border border-pm-border bg-pm-bg text-sm text-pm-text focus:outline-none focus:border-pm-brand focus:ring-2 focus:ring-pm-focus-ring resize-y"
    ></textarea>
  {/if}
</div>
```

#### Important Note on i18n

The "Edit" and "Preview" labels in the toggle button MUST NOT be hardcoded.
Use `t()` or receive them as props. Add `editLabel` and `previewLabel` props:

```typescript
let {
  // ... existing props
  editLabel = 'Edit',
  previewLabel = 'Preview'
} = $props()
```

Wait — PM3 framework rule: NO hardcoded strings. The parent MUST pass resolved
i18n labels. However, for a utility molecule like this, it's acceptable to have
sensible defaults if the framework allows. Check: the `FormField` atom has no
hardcoded strings — all labels come from props. Follow the same pattern.

**Decision**: Add `editLabel` and `previewLabel` props with no defaults. The
parent MUST pass i18n-resolved strings. If the props are empty, the toggle
button shows only the icon (no text).

### Part D: Refactor legal to use MarkdownEditor

**Current state** (3 instances, one per legal document):

```svelte
<div class="flex flex-col gap-2">
  <div class="flex items-center justify-between">
    <label class="text-sm font-medium text-pm-text">{label}</label>
    <button onclick={() => togglePreview(docKey)}>
      {#if preview === docKey}<IconPencil /> Edit{:else}<IconEye /> Preview{/if}
    </button>
  </div>
  {#if preview === docKey}
    <div class="prose">{@html renderLegalMarkdown(content)}</div>
  {:else}
    <textarea bind:value={content} rows={12} ...></textarea>
  {/if}
</div>
```

**Replace with**:

```svelte
<MarkdownEditor
  bind:content={doc.markdown}
  previewHtml={renderLegalMarkdown(doc.markdown)}
  label={docLabel}
  editLabel={t['common.edit']}
  previewLabel={t['common.preview']}
/>
```

Repeat for each of the 3 legal documents (privacy policy, terms, cookies).

#### Cleanup

Remove the `preview` state variable and `togglePreview` function from legal page
if they were only used for the markdown editor. Verify nothing else depends on them.

## PM3 Framework Rules

- **i18n**: All user-visible strings must come from props (resolved by parent).
  No hardcoded "Edit", "Preview", or other labels in the components.
- **Canonical primitives**: The toggle buttons in ContactPicker should use the
  `CtaButton` component? No — the toggle pattern doesn't match CtaButton's variants.
  Custom styling is appropriate here since it's a unique interaction pattern
  (pill toggle grid).
- **`class` prop + `twMerge`**: Both components accept `class` and merge with
  base classes.

## Edge Cases

### ContactPicker
- **Empty options**: Renders empty div — no crash
- **All unselected / all selected**: Both states handled correctly
- **Rapid clicking**: `toggle()` uses array spread — no mutation issues
- **Missing icon**: Gracefully omitted (icon is optional in `ContactOption`)

### MarkdownEditor
- **Empty content**: Textarea shows as empty; preview shows empty div
- **Very long content**: Textarea scrolls; preview can overflow — parent should
  wrap in a constrained container
- **XSS in preview**: `{@html previewHtml}` is deliberate — the parent MUST
  sanitize the HTML before passing it. This component trusts the parent.
  (PM2's `renderLegalMarkdown` already sanitizes via DOMPurify-equivalent.)
- **Toggle state persists across documents**: Each MarkdownEditor instance has
  its own `preview` state — no cross-contamination.

## Verification

```bash
npm run check

# Manual testing:
# 1. /admin/settings — both contact pickers work, toggle buttons respond
# 2. /admin/settings — save settings, reload — picker state is preserved
# 3. /admin/legal — all 3 markdown editors work
# 4. /admin/legal — toggle preview on each, verify rendered HTML
# 5. /admin/legal — edit text in textarea, toggle to preview, verify content
# 6. Verify no regressions: all settings save correctly

git diff --stat
# Should show: ContactPicker.svelte (+~80), MarkdownEditor.svelte (+~90),
#              settings (-~50), legal (-~60)
```

## Files to Create

| File | Action |
|------|--------|
| `src/lib/components/molecules/ContactPicker.svelte` | CREATE |
| `src/lib/components/molecules/MarkdownEditor.svelte` | CREATE |

## Files to Modify

| File | Action | Lines |
|------|--------|-------|
| `src/routes/admin/settings/+page.svelte` | Replace 2 picker blocks with ContactPicker | -~50, +~15 |
| `src/routes/admin/legal/+page.svelte` | Replace 3 markdown editors with MarkdownEditor | -~60, +~20 |
