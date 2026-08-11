# Step 03: Extract Admin Layout Molecules (AppBottomNav, AppMobileHeader, UserMenu)

## Why

The admin layout (`src/routes/admin/+layout.svelte`, 291 lines) contains three
logically distinct UI regions that should be separate molecules:

1. **Bottom navigation** — 11 lines of Tailwind with `.slice(0, 8)` hard truncation.
   PM2's `bottom-nav.css` was 255 lines with scrollable category rows, all accessible.
2. **Mobile header bar** — page title + user avatar button. PM2's `admin-header.css`
   was 592 lines with full user dropdown (name/email/role, theme/language toggles,
   change password, logout).
3. **User menu dropdown** — duplicated 3 times in the same file (vertical sidebar mode
   at line 148, horizontal header mode at line 191, mobile mode at line 218).

Extracting these into separate molecules:
- Makes the layout component maintainable (291 lines → ~150 lines)
- Enables proper APP MODE implementation later (Step 07)
- Eliminates user menu duplication (~60 lines removed)
- Makes the bottom nav testable as a standalone component

## What

Create three molecules:

1. `src/lib/components/molecules/AppBottomNav.svelte` — APP MODE bottom navigation bar
   with scrollable category rows, icons + labels, unread badge, all sections accessible
2. `src/lib/components/molecules/AppMobileHeader.svelte` — APP MODE mobile header bar
   with page title + user avatar button + user menu dropdown
3. `src/lib/components/molecules/UserMenu.svelte` — user avatar button + dropdown
   (name, email, role, logout), used by desktop sidebar, desktop header, AND mobile header

Refactor `src/routes/admin/+layout.svelte` to use all three.

## Prerequisites

None — can run in parallel with Steps 01–02.

## Implementation

### Part A: Create `src/lib/components/molecules/UserMenu.svelte`

**Location**: `src/lib/components/molecules/UserMenu.svelte`  
**Extracted from**: Lines 148–165, 191–208, 218–239 in `+layout.svelte` (3 copies)

#### Props Interface

```typescript
let {
  user,
  class: className = ''
}: {
  user: { name?: string | null; email: string; role: string } | null
  class?: string
} = $props()
```

The component manages its own `open` state internally.

#### Template Structure

The user avatar button + dropdown popover. Reused in 3 contexts:
- Desktop vertical sidebar (bottom of sidebar)
- Desktop horizontal header (right side of header bar)
- Mobile header (right side of header bar)

The dropdown shows:
- User name + email + role
- Logout link (`/api/auth/logout`)

```svelte
<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import IconLogout from '@tabler/icons-svelte/icons/logout'
  import { t as contentT } from '$lib/stores/content.svelte'

  let {
    user,
    class: className = ''
  }: {
    user: { name?: string | null; email: string; role: string } | null
    class?: string
  } = $props()

  let open = $state(false)
  const initials = $derived(user ? (user.name ?? user.email).charAt(0).toUpperCase() : '?')

  function toggle() { open = !open }
  function close() { open = false }
</script>

{#if user}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class={twMerge(clsx('relative', className))}
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => { if (e.key === 'Escape') close() }}
    role="presentation">

    <button type="button" onclick={toggle}
      class="size-9 rounded-full bg-pm-brand-subtle text-pm-brand text-sm font-bold flex items-center justify-center hover:scale-105 transition-transform">
      {initials}
    </button>

    {#if open}
      <div class="absolute top-full end-0 mt-2 w-56 bg-pm-bg-elevated border border-pm-border rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] z-[var(--z-popover)] p-3">
        <div class="flex flex-col gap-1 mb-3 pb-3 border-b border-pm-border">
          <span class="text-sm font-medium text-pm-text">{user.name ?? user.email}</span>
          <span class="text-xs text-pm-text-muted">{user.email}</span>
          <span class="text-xs text-pm-text-muted capitalize">{user.role}</span>
        </div>
        <a href="/api/auth/logout"
          class="flex items-center gap-2 px-2 py-1.5 text-sm text-pm-text-muted hover:text-pm-danger transition-colors rounded-md hover:bg-pm-bg-sunken">
          <IconLogout class="size-4" />
          {contentT('auth.logout')}
        </a>
      </div>
    {/if}
  </div>
{/if}
```

IMPORTANT: The parent layout handles the global click-outside-to-close behavior
(via the `onclick` handler on the root wrapper div). Ensure the `UserMenu`
propagates its state or the parent knows about it. The current layout closes all
menus when clicking outside `.user-menu-wrapper`. To keep this behavior, the
`UserMenu` component needs to expose its `open` state OR use a CSS class on its
wrapper for the parent's click-outside detection.

**Decision**: Add `data-menu="user"` attribute to the wrapper div. The parent
layout's click handler checks `e.target.closest('[data-menu="user"]')` instead of
`.user-menu-wrapper`. Update the layout's click handler accordingly.

#### JSDoc

```typescript
/**
 * UserMenu — user avatar button with dropdown menu
 *
 * Shows user initials in a branded circle. On click, opens a dropdown
 * with user info (name, email, role) and a logout link.
 *
 * @props {object | null} user — current admin user { name?, email, role }
 *   When null, renders nothing (used on login/change-password pages)
 * @props {string} [class] — additional CSS classes
 *
 * @example
 * <UserMenu {user} />
 */
```

### Part B: Create `src/lib/components/molecules/AppBottomNav.svelte`

**Location**: `src/lib/components/molecules/AppBottomNav.svelte`  
**Replaces**: Lines 243–254 in `+layout.svelte` (current 11-line bottom nav)

#### Design

PM2's bottom nav had:
- Scrollable rows with category sections
- Icons + labels for each item
- Hover/active states
- Unread count badge
- All sections accessible (not truncated to 8)

#### Props Interface

```typescript
let {
  sections,
  currentPath,
  unreadCount = 0,
  class: className = ''
}: {
  sections: Array<{ id: string; label: string; icon?: typeof IconHome }>
  currentPath: string
  unreadCount?: number
  class?: string
} = $props()
```

#### Template Structure

Fixed bottom bar with horizontally scrollable icon+label items. On small screens,
items scroll horizontally with `snap-x`. On tablet (`sm:`), items distribute evenly.

```svelte
<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import type IconHome from '@tabler/icons-svelte/icons/home'

  let {
    sections,
    currentPath,
    unreadCount = 0,
    class: className = ''
  }: {
    sections: Array<{ id: string; label: string; icon?: typeof IconHome }>
    currentPath: string
    unreadCount?: number
    class?: string
  } = $props()

  const isActive = (id: string) =>
    currentPath === `/admin/${id}` || (id === 'dashboard' && currentPath === '/admin')
</script>

<nav class={twMerge(clsx(
  'fixed bottom-0 left-0 right-0 z-[var(--z-sticky)] bg-pm-bg-elevated border-t border-pm-border',
  className
))}>
  <div class="flex overflow-x-auto snap-x snap-mandatory scrollbar-none h-14">
    {#each sections as section}
      <a href={section.id === 'dashboard' ? '/admin' : `/admin/${section.id}`}
        class={clsx(
          'flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-xs snap-start shrink-0 min-w-16 transition-colors',
          isActive(section.id)
            ? 'text-pm-brand'
            : 'text-pm-text-muted hover:text-pm-text'
        )}>
        {#if section.icon}
          <section.icon class="size-5" />
        {:else}
          <span class="text-lg font-semibold">{section.label.charAt(0)}</span>
        {/if}
        <span class="text-2xs leading-none">{section.label}</span>
        {#if section.id === 'contacts' && unreadCount > 0}
          <span class="absolute -top-0.5 -end-0.5 flex items-center justify-center min-w-3.5 h-3.5 px-1 rounded-full bg-pm-danger text-2xs font-bold text-white leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        {/if}
      </a>
    {/each}
  </div>
</nav>
```

#### Visibility

The bottom nav is visible on ALL mobile screens (phone + tablet) up to the desktop
breakpoint where the sidebar appears:
- Current: `lg:hidden sm:flex md:hidden` (only 640-768px)
- New: `lg:hidden` (all screens below 1024px — both phone and tablet)

This is the key APP MODE behavior: bottom nav IS the primary mobile navigation.

#### Responsive behavior

- Phone (<640px): Full-width scrollable bar
- Tablet (640-1024px): Centered, items distribute evenly (no scroll needed if ≤6 items)
- Desktop (≥1024px): Hidden — sidebar takes over

#### JSDoc

```typescript
/**
 * AppBottomNav — APP MODE bottom navigation bar
 *
 * Fixed bottom bar with horizontally scrollable icon+label navigation items.
 * The primary mobile navigation for admin APP MODE on phone and tablet.
 *
 * @props {Array} sections — nav items [{ id, label, icon? }]
 * @props {string} currentPath — current URL pathname for active state
 * @props {number} [unreadCount=0] — unread contacts count for badge
 * @props {string} [class] — additional classes
 *
 * @example
 * <AppBottomNav sections={adminSections} currentPath={$page.url.pathname} unreadCount={unreadCount} />
 */
```

### Part C: Create `src/lib/components/molecules/AppMobileHeader.svelte`

**Location**: `src/lib/components/molecules/AppMobileHeader.svelte`  
**Replaces**: Lines 216–240 in `+layout.svelte`

#### Design

A thin top bar shown on phone screens. Shows the current page title on the left
and the user menu on the right. This replaces the desktop sidebar/header nav on
mobile — the user navigates via the bottom nav, not the header.

#### Props Interface

```typescript
let {
  pageTitle = '',
  user,
  class: className = ''
}: {
  pageTitle: string
  user: { name?: string | null; email: string; role: string } | null
  class?: string
} = $props()
```

#### Template

```svelte
<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import UserMenu from './UserMenu.svelte'

  let {
    pageTitle = '',
    user,
    class: className = ''
  }: {
    pageTitle: string
    user: { name?: string | null; email: string; role: string } | null
    class?: string
  } = $props()
</script>

<header class={twMerge(clsx(
  'sticky top-0 z-[var(--z-sticky)] lg:hidden flex items-center justify-between gap-3 px-4 py-2.5 bg-pm-bg-elevated border-b border-pm-border',
  className
))}>
  <span class="text-sm font-medium text-pm-text truncate">{pageTitle}</span>
  <UserMenu {user} />
</header>
```

**Visibility**: `lg:hidden` — shows on phone AND tablet. The bottom nav handles
navigation; the mobile header provides page context and user access.

#### JSDoc

```typescript
/**
 * AppMobileHeader — APP MODE mobile header bar
 *
 * Thin top bar for phone/tablet showing current page title and user menu.
 * Complements AppBottomNav — header provides context, bottom nav provides navigation.
 *
 * @props {string} pageTitle — current page title (i18n-resolved)
 * @props {object | null} user — current admin user
 * @props {string} [class] — additional classes
 *
 * @example
 * <AppMobileHeader pageTitle={currentPageTitle()} {user} />
 */
```

### Part D: Refactor `src/routes/admin/+layout.svelte`

**Changes**:

1. **Replace bottom nav** (lines 243–254):
   ```svelte
   <!-- Before: 11 lines of inline nav -->
   <!-- After: -->
   <AppBottomNav sections={adminSections} currentPath={currentPath} {unreadCount} />
   ```

2. **Replace mobile header** (lines 216–240):
   ```svelte
   <!-- Before: inline header -->
   <!-- After: -->
   <AppMobileHeader pageTitle={currentPageTitle()} {user} />
   ```

3. **Replace user menu in vertical sidebar** (lines 146–167):
   ```svelte
   <!-- Before: inline button + dropdown -->
   <!-- After: -->
   <div class="p-2 border-t border-pm-border" data-menu="user">
     <UserMenu {user} />
   </div>
   ```

4. **Replace user menu in horizontal header** (lines 189–210):
   ```svelte
   <!-- After: -->
   <div class="flex items-center gap-2" data-menu="user">
     <UserMenu {user} />
   </div>
   ```

5. **Update click-outside handler**: The root div's `onclick` handler currently checks
   `.user-menu-wrapper` and `.mobile-user-wrapper`. Replace with:
   ```javascript
   onclick={(e) => {
     const t2 = e.target as HTMLElement
     if (!t2.closest('[data-menu="user"]')) {
       // UserMenu handles its own state now — we need a different approach
     }
   }}
   ```

   **Problem**: With UserMenu managing its own `open` state internally, the parent
   can't close it from outside. Two solutions:
   - A) UserMenu exposes `open` via `$bindable` — parent can set it to false
   - B) UserMenu listens for document clicks itself

   **Decision: Option B** — Add a `svelte:window` click listener inside UserMenu that
   closes the dropdown when clicking outside. Remove the parent's click-outside logic
   for user menus entirely.

   ```svelte
   <!-- Inside UserMenu.svelte -->
   <svelte:window onclick={(e) => {
     const target = e.target as HTMLElement
     if (!target.closest('[data-menu="user"]')) {
       open = false
     }
   }} />
   ```

   This also means removing the root div's `onclick` handler's user-menu-related
   logic from the layout. Replace the entire wrapper div:

   ```svelte
   <!-- Remove the old onclick/onkeydown from the wrapper div -->
   <div class="min-h-screen bg-pm-bg">
     <!-- no click-outside handler needed — UserMenu handles its own -->
   ```

6. **Remove the mobile hamburger + drawer** (lines 257–281)? No — keep for now.
   The mobile drawer provides full navigation access. Step 07 will replace it with
   a proper APP MODE implementation.

7. **Cleanup**: Remove unused imports (`IconX`, `IconMenu2`) if they were only used
   in the extracted code. Verify they're not used elsewhere in the layout first.

## PM3 Framework Rules

- **Canonical primitives**: Check if `AppBottomNav` or `AppMobileHeader` overlap with
  existing molecules. They don't — these are admin-specific APP MODE components.
- **i18n**: All labels come from parent via props (already resolved). No hardcoded strings.
- **JSDoc**: Every exported component must have `@props` and `@example`.

## Edge Cases

- **UserMenu with null user**: On login and change-password pages, `data.user` is null.
  The layout already checks for this — those pages render children directly without the
  admin shell (lines 109-112). Ensure UserMenu handles `null` user gracefully (renders
  nothing).
- **Bottom nav with 0 sections**: Renders empty nav bar. This shouldn't happen in
  practice (admin always has at least dashboard), but the component shouldn't crash.
- **Bottom nav with many sections (>8)**: All items are scrollable — no truncation.
  This is a key improvement over the current `.slice(0, 8)`.
- **UserMenu click-outside on mobile**: The `svelte:window` click listener works on
  both desktop and mobile. No special handling needed.

## Verification

```bash
npm run check

# Manual testing:
# 1. Desktop: sidebar user menu opens/closes on click, closes on outside click
# 2. Desktop horizontal: header user menu same behavior
# 3. Mobile: bottom nav visible, all sections accessible, horizontal scroll works
# 4. Mobile: header shows page title + user avatar
# 5. Mobile: user menu in header opens/closes correctly
# 6. Login page: no user menu visible, no errors

# Verify layout line count reduced:
wc -l src/routes/admin/+layout.svelte  # Should be ~150 (down from 291)
wc -l src/lib/components/molecules/AppBottomNav.svelte  # Should be ~90
wc -l src/lib/components/molecules/AppMobileHeader.svelte  # Should be ~40
wc -l src/lib/components/molecules/UserMenu.svelte  # Should be ~80
```

## Files to Create

| File | Action |
|------|--------|
| `src/lib/components/molecules/UserMenu.svelte` | CREATE |
| `src/lib/components/molecules/AppBottomNav.svelte` | CREATE |
| `src/lib/components/molecules/AppMobileHeader.svelte` | CREATE |

## Files to Modify

| File | Action | Lines |
|------|--------|-------|
| `src/routes/admin/+layout.svelte` | Replace inline nav/header/menu with molecule components | -~140, +~20 |
