# Step 01: Extract AdminModal Molecule

## Why

The identical modal shell (overlay + card + header + form body + footer) is duplicated
in two admin pages:
- `src/routes/admin/translations/+page.svelte` — lines 358–445 (~87 lines)
- `src/routes/admin/users/+page.svelte` — lines 215–281 (~66 lines)

Every future admin CRUD page (blog create/edit, FAQ create/edit, features create/edit,
pricing, roles, etc.) will also need a modal. Without extraction, the same ~80 lines
get duplicated 6+ more times. This violates the PM3 rule that reusable visual patterns
become Svelte components, not duplicated markup.

## What

Create `src/lib/components/molecules/AdminModal.svelte` — a reusable modal dialog
molecule that handles:
- Backdrop overlay with click-to-close
- Card container with configurable max-width
- Header with title + close button
- Form body slot (for arbitrary form content)
- Footer with cancel + submit buttons
- Escape key to close
- Focus trap (basic — prevent scroll on body while open)
- `class` prop + `twMerge` (PM3 Rule #1)

After creating the component, refactor `translations/+page.svelte` and
`users/+page.svelte` to use it, removing ~150 duplicated lines.

## Prerequisites

None — this is the first step. No other step depends on being before this.

## Implementation

### Part A: Create `src/lib/components/molecules/AdminModal.svelte`

**Location**: `src/lib/components/molecules/AdminModal.svelte`  
**Type**: Molecule (composes atoms, holds state — the open/close state lives in the parent)  
**PM3 Rules**: Rule #1 (`class` + `twMerge`), Rule #3 (strict union types), JSDoc

#### Props Interface

```typescript
let {
  open = false,
  title = '',
  maxWidthClass = 'max-w-md',
  cancelLabel = '',
  submitLabel = '',
  submitDisabled = false,
  loading = false,
  class: className = '',
  onclose,
  onsubmit
}: {
  open: boolean
  title: string
  maxWidthClass?: string
  cancelLabel?: string
  submitLabel?: string
  submitDisabled?: boolean
  loading?: boolean
  class?: string
  onclose: () => void
  onsubmit: () => void
} = $props()
```

#### Slots

The component uses Svelte 5 snippets:
- `children` — default slot, rendered inside `<form>` body
- `footer` — optional, overrides the default cancel+submit footer

Actually, in Svelte 5 runes mode, children are passed as a prop. Use:

```typescript
let { children, footer, ... }: {
  // ... other props
  children?: import('svelte').Snippet
  footer?: import('svelte').Snippet
} = $props()
```

#### Template Structure

```
{#if open}
  <!-- Backdrop overlay -->
  <div class="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center bg-black/50 p-4"
    onclick={onclose}
    onkeydown={(e) => { if (e.key === 'Escape') onclose() }}
    role="dialog"
    aria-modal="true">

    <!-- Card container -->
    <div class="bg-pm-bg-elevated rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] w-full {maxWidthClass} max-h-[var(--dialog-max-height)] overflow-auto"
      onclick={(e) => e.stopPropagation()}
      role="presentation">

      <!-- Header -->
      <div class="flex items-center justify-between px-6 pt-5 pb-3 border-b border-pm-border">
        <h2 class="text-lg font-semibold text-pm-text">{title}</h2>
        <button type="button"
          class="p-1 text-pm-text-muted hover:text-pm-text rounded-md transition-colors"
          onclick={onclose}
          aria-label="Close">
          <IconX class="size-5" />  <!-- import from @tabler/icons-svelte -->
        </button>
      </div>

      <!-- Body (form content) -->
      <form class="p-6 flex flex-col gap-4" onsubmit={(e) => { e.preventDefault(); onsubmit() }}>
        {@render children?.()}
        <!-- If no footer snippet provided, render default buttons -->
        {#if footer}
          {@render footer()}
        {:else}
          <div class="flex justify-end gap-3 pt-2">
            <CtaButton variant="ghost" size="compact" onclick={onclose} type="button">
              {cancelLabel || 'Cancel'}
            </CtaButton>
            <CtaButton variant="primary" size="compact" type="submit" disabled={submitDisabled || loading}>
              {loading ? 'Saving...' : submitLabel || 'Save'}
            </CtaButton>
          </div>
        {/if}
      </form>
    </div>
  </div>

  <!-- Prevent body scroll when modal is open -->
  <svelte:head>
    <style>body { overflow: hidden; }</style>
  </svelte:head>
{/if}
```

#### Imports Needed

```typescript
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import IconX from '@tabler/icons-svelte/icons/x'
import CtaButton from '$lib/components/atoms/CtaButton.svelte'
```

#### JSDoc

```typescript
/**
 * AdminModal — reusable admin CRUD modal dialog
 *
 * Wraps arbitrary form content in a centered modal with backdrop,
 * header, and footer with cancel/submit buttons.
 *
 * @props {boolean} open — controls visibility
 * @props {string} title — header title text (i18n key resolved by parent)
 * @props {string} [maxWidthClass='max-w-md'] — Tailwind max-width class
 * @props {string} [cancelLabel=''] — cancel button text
 * @props {string} [submitLabel=''] — submit button text
 * @props {boolean} [submitDisabled=false] — disables submit button
 * @props {boolean} [loading=false] — shows loading state on submit button
 * @props {string} [class] — additional CSS classes merged via twMerge
 * @props {() => void} onclose — called on backdrop click, close button, or Escape
 * @props {() => void} onsubmit — called on form submit (after preventDefault)
 *
 * @slot children — form body content
 * @slot footer — optional custom footer (overrides default cancel+submit buttons)
 *
 * @example
 * <AdminModal open={showModal} title="Add User" onclose={() => showModal = false} onsubmit={handleSave}>
 *   <FormField name="email" label="Email" bind:value={email} />
 * </AdminModal>
 */
```

### Part B: Refactor `src/routes/admin/translations/+page.svelte`

**What to change**:
1. Import `AdminModal` instead of rendering modal markup inline
2. Replace the add-translation modal (lines 358–445) with:

```svelte
<AdminModal
  open={showAddModal}
  title={t['admin.addTranslation']}
  maxWidthClass="max-w-2xl"
  onclose={() => showAddModal = false}
  onsubmit={handleAddSubmit}
  submitDisabled={saving}
  loading={saving}
>
  <!-- existing form fields go here as children -->
  <div class="flex flex-col gap-4">
    <!-- key input, per-locale fields, etc. — keep existing, just remove the modal shell -->
  </div>
</AdminModal>
```

3. Repeat for the edit modal if it also uses the same shell pattern
4. Remove the old modal markup (overlay div, card div, header, footer)
5. Remove the `<svelte:head>` body-overflow style block

**What to NOT change**:
- The form fields themselves (key input, per-locale fields)
- The `handleAddSubmit` / `handleEditSubmit` functions
- The section toggle, locale tabs, search, accordion logic

### Part C: Refactor `src/routes/admin/users/+page.svelte`

Same pattern as Part B:
1. Import `AdminModal`
2. Replace the add-user modal (lines 215–281) with `<AdminModal>`
3. Replace the edit-user modal with `<AdminModal>`
4. Remove old modal markup

## PM3 Framework Rules

- **No `<style>` blocks**: The `<svelte:head>` style block is the ONLY exception — it
  prevents body scroll when the modal is open. This is a browser fix, not a component
  style, and follows the `@layer components` exception rule.
- **Canonical primitives**: Use `CtaButton` for cancel/submit buttons — never hand-roll
  button classes.
- **Design tokens**: All spacing/sizing uses `[var(--token)]` bracket syntax. No raw
  `px`/`rem` values except inside bracket syntax.
- **i18n**: The modal itself uses i18n-aware labels passed as props. Never hardcode
  "Cancel", "Save", "Close" as string literals — these come from the parent via props
  (the parent resolves i18n keys).

## Edge Cases

- **Open/close race**: If `onsubmit` triggers a navigation, the modal should close.
  The parent controls `open` state — just set it to `false`.
- **Nested modals**: If a modal opens another modal, z-index stacking should work.
  Two modals at same z-index is fine — the newer one appears on top.
- **Long forms**: The `max-h-[var(--dialog-max-height)] overflow-auto` on the card
  ensures scrollable content. Verify with 10+ form fields.
- **Mobile**: The `p-4` padding on the overlay shrinks on phone. The `maxWidthClass`
  should be `max-w-[calc(100vw-var(--space-8))]` for mobile — use `max-w-md sm:max-w-2xl`
  variants if needed.
- **Keyboard trap**: Escape key closes via `onkeydown` on the overlay div. Tab order
  should cycle within the modal (basic — a full focus trap is future work).

## Verification

```bash
# TypeScript check
npm run check

# Verify both pages still render modals correctly
# 1. Navigate to /admin/translations — click "Add Translation" — modal opens
# 2. Fill form, submit — modal closes
# 3. Click backdrop — modal closes
# 4. Press Escape — modal closes
# 5. Navigate to /admin/users — click "Add User" — modal opens
# 6. Same behavior checks

# Check no regressions
git diff --stat  # Should show: new AdminModal.svelte (+~120), translations (-~80), users (-~60)
```

## Files to Create

| File | Action |
|------|--------|
| `src/lib/components/molecules/AdminModal.svelte` | CREATE |

## Files to Modify

| File | Action | Lines |
|------|--------|-------|
| `src/routes/admin/translations/+page.svelte` | Replace modal markup with `<AdminModal>` | -~80, +~15 |
| `src/routes/admin/users/+page.svelte` | Replace modal markup with `<AdminModal>` | -~60, +~15 |
