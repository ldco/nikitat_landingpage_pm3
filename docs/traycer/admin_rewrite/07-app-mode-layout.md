# Step 07: Rewrite Admin Layout for Proper APP MODE

## Why

The admin panel uses **APP MODE** — a distinct visual paradigm from the website layout.
In PM2, APP MODE meant:
- Desktop: vertical sidebar (or horizontal header if `appVerticalNav: false`)
- Tablet: 80px icon-only rail sidebar
- Phone: mobile header bar + bottom navigation (NOT a hamburger drawer)

PM3's current layout (`src/routes/admin/+layout.svelte`) handles desktop correctly but
treats mobile as an afterthought — 40 lines of CSS breakpoint hacks, `.slice(0,8)`
truncation, bottom nav hidden on phone, and a hamburger drawer that APP MODE should
never use.

After Steps 01-04, the foundation molecules exist: `AppBottomNav`, `AppMobileHeader`,
`UserMenu`, `AdminModal`, `AdminFormSection`. Now we rewrite the layout to compose them
into a proper APP MODE experience.

## What

Rewrite `src/routes/admin/+layout.svelte` to:
1. Remove the hamburger overlay + drawer (APP MODE doesn't use hamburgers)
2. Use `AppBottomNav` as THE primary mobile navigation (phone + tablet)
3. Use `AppMobileHeader` as the mobile context bar
4. Add tablet icon rail (80px sidebar with icons only, between phone bottom-nav and
   desktop full sidebar)
5. Fix breakpoint system: phone <640px, tablet 640-1024px, desktop ≥1024px
6. Reduce layout file from 291 lines to ~150 lines (by using extracted molecules)

## Prerequisites

- **Step 03** must be complete — `AppBottomNav`, `AppMobileHeader`, `UserMenu` molecules
  must exist.

## Implementation

### Part A: Read the current layout

Read `src/routes/admin/+layout.svelte` fully. Understand the current structure:
- Lines 1–108: Script (imports, state, derived values, unread count poller)
- Lines 109–112: Auth page bypass (login/change-password render directly)
- Lines 116–120: Root wrapper div with click-outside handler
- Lines 121–168: Vertical sidebar mode (desktop)
- Lines 169–213: Horizontal header mode (desktop alt)
- Lines 216–240: Mobile header (phone)
- Lines 243–254: Mobile bottom nav
- Lines 257–281: Hamburger + drawer overlay (phone)
- Lines 284–288: Main content area

### Part B: The new layout structure

```
Script section (keep most logic, remove click-outside, add breakpoint state)
  ↓
Auth page bypass (unchanged)
  ↓
Root wrapper (no click-outside — UserMenu handles its own)
  ↓
{#if useVerticalNav}
  Desktop Vertical Sidebar (simplified — uses UserMenu molecule)
{:else}
  Desktop Horizontal Header (simplified — uses UserMenu molecule)
{/if}
  ↓
<!-- TABLET: icon rail sidebar (80px, icons only, no text) -->
<aside class="hidden md:flex lg:hidden ...">
  <!-- icon-only nav items -->
</aside>
  ↓
<!-- MOBILE: AppMobileHeader (phone + tablet) -->
<AppMobileHeader pageTitle={currentPageTitle()} {user} />
  ↓
<!-- MOBILE: AppBottomNav (phone + tablet — THE primary nav) -->
<AppBottomNav sections={adminSections} currentPath={currentPath} {unreadCount} />
  ↓
<!-- Main Content -->
<main>
  <div class="content-wrapper">
    {@render children?.()}
  </div>
</main>
```

### Part C: Detailed Changes

#### C1. Remove hamburger + drawer (lines 257–281)

Delete entirely. APP MODE doesn't use hamburger menus — the bottom nav IS the
mobile navigation. This removes:
- `mobileOpen` state variable
- Hamburger toggle button
- Overlay backdrop
- Slide-in drawer with nav links
- Imports: `IconMenu2`, `IconX` (check if used elsewhere first)

#### C2. Fix bottom nav visibility

**Current** (line 243): `lg:hidden sm:flex md:hidden` — only 640-768px
**New**: `lg:hidden` — all screens below 1024px (both phone AND tablet)

```svelte
<!-- Before: -->
<nav class="... lg:hidden sm:flex md:hidden">

<!-- After: -->
<AppBottomNav sections={adminSections} currentPath={currentPath} {unreadCount} />
```

The `AppBottomNav` component handles its own visibility internally. Or better:
wrap it in a responsive container:

```svelte
<div class="lg:hidden">
  <AppBottomNav sections={adminSections} currentPath={currentPath} {unreadCount} />
</div>
```

#### C3. Fix mobile header visibility

**Current** (line 216): `lg:hidden sm:hidden` — phone only (<640px)
**New**: `lg:hidden` — phone AND tablet (<1024px)

```svelte
<!-- Before: -->
<header class="... lg:hidden sm:hidden">

<!-- After: -->
<AppMobileHeader pageTitle={currentPageTitle()} {user} />
```

Same — `AppMobileHeader` handles visibility or wrap in `lg:hidden` div.

#### C4. Add tablet icon rail

Between the phone bottom-nav and the desktop sidebar, tablet users (640–1024px)
need an 80px icon-only rail sidebar. PM2 had this.

```svelte
<!-- Tablet Rail Sidebar (PM2: admin-sidebar.css — 80px icon-only) -->
<aside class="hidden md:flex lg:hidden fixed top-0 start-0 z-[var(--z-sticky)] flex-col w-20 h-full bg-pm-bg-elevated border-e border-pm-border">
  <div class="flex items-center justify-center h-16 border-b border-pm-border">
    <a href="/admin" class="text-lg font-bold text-pm-text">P</a>
  </div>
  <nav class="flex-1 flex flex-col items-center gap-1 py-3 px-1 overflow-y-auto">
    {#each adminSections as section}
      {@const SideIcon = iconComponentMap[section.id] || IconSettings}
      <a href={section.id === 'dashboard' ? '/admin' : `/admin/${section.id}`}
        class="relative flex flex-col items-center justify-center gap-0.5 size-16 rounded-md transition-colors group"
        class:bg-pm-brand-subtle:text-pm-brand={isActive(section.id)}
        class:text-pm-text-secondary:hover:text-pm-text:hover:bg-pm-bg-sunken={!isActive(section.id)}>
        <SideIcon class="size-5" />
        <span class="text-2xs text-pm-text-muted group-hover:text-pm-text truncate max-w-16 px-1 text-center">
          {section.label}
        </span>
        {#if section.id === 'contacts' && unreadCount > 0}
          <span class="absolute top-1 end-2 flex items-center justify-center min-w-3.5 h-3.5 px-1 rounded-full bg-pm-danger text-2xs font-bold text-white leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        {/if}
      </a>
    {/each}
  </nav>
  <div class="p-2 border-t border-pm-border">
    <UserMenu {user} />
  </div>
</aside>
```

**Visibility**: `hidden md:flex lg:hidden` — visible only on tablet (768–1023px).
Below 768px: bottom nav. Above 1024px: full sidebar.

**Main content offset**: When the tablet rail is visible, the main content needs
a left margin:

```svelte
<main class={clsx(
  'min-h-screen',
  'pb-14 lg:pb-0',           // space for bottom nav on mobile
  'md:ms-20 lg:ms-16'        // space for tablet rail (80px = w-20) / desktop sidebar (64px = w-16)
)}>
```

#### C5. Update desktop sidebar

The current vertical sidebar (lines 121–168) stays mostly the same but uses
`UserMenu` molecule:

```svelte
<aside class="fixed top-0 start-0 z-[var(--z-sticky)] hidden lg:flex flex-col w-16 h-full bg-pm-bg-elevated border-e border-pm-border">
  <div class="flex items-center justify-center h-16 border-b border-pm-border">
    <a href="/admin" class="text-lg font-bold text-pm-text">P</a>
  </div>
  <nav class="flex-1 flex flex-col items-center gap-1 py-3 px-1 overflow-y-auto">
    {#each adminSections as section}
      {@const SideIcon = iconComponentMap[section.id] || IconSettings}
      <a href={section.id === 'dashboard' ? '/admin' : `/admin/${section.id}`}
        class="relative flex items-center justify-center size-10 rounded-md transition-colors group"
        class:bg-pm-brand-subtle:text-pm-brand={isActive(section.id)}
        class:text-pm-text-secondary:hover:text-pm-text:hover:bg-pm-bg-sunken={!isActive(section.id)}>
        <SideIcon class="size-5" />
        {#if section.id === 'contacts' && unreadCount > 0}
          <span class="absolute -top-0.5 -end-0.5 flex items-center justify-center min-w-3.5 h-3.5 px-1 rounded-full bg-pm-danger text-2xs font-bold text-white leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        {/if}
        <!-- Tooltip -->
        <span class="absolute start-full ms-2 px-2 py-1 rounded-md bg-pm-bg-elevated border border-pm-border text-xs text-pm-text shadow-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-[var(--z-tooltip)]">
          {section.label}
        </span>
      </a>
    {/each}
  </nav>
  <div class="p-2 border-t border-pm-border">
    <UserMenu {user} />
  </div>
</aside>
```

#### C6. Update desktop horizontal header

The current horizontal header (lines 169–213) stays similar but uses `UserMenu`:

```svelte
<header class="sticky top-0 z-[var(--z-sticky)] bg-pm-bg-elevated border-b border-pm-border">
  <div class="flex items-center justify-between gap-4 px-4 py-2">
    <a href="/admin" class="text-lg font-bold text-pm-text shrink-0">{t['admin.title']}</a>
    <nav class="hidden sm:flex items-center gap-1 flex-1 justify-center">
      {#each adminSections as section}
        {@const SideIcon = iconComponentMap[section.id] || IconSettings}
        <a href={section.id === 'dashboard' ? '/admin' : `/admin/${section.id}`}
          class="relative flex items-center justify-center size-10 rounded-md transition-colors group"
          class:bg-pm-brand-subtle:text-pm-brand={isActive(section.id)}
          class:text-pm-text-secondary:hover:text-pm-text:hover:bg-pm-bg-sunken={!isActive(section.id)}>
          <SideIcon class="size-5" />
          <span class="absolute top-full mt-2 px-2 py-1 rounded-md bg-pm-bg-elevated border border-pm-border text-xs text-pm-text shadow-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-[var(--z-tooltip)]">
            {section.label}
          </span>
        </a>
      {/each}
    </nav>
    <div class="flex items-center gap-2">
      <UserMenu {user} />
    </div>
  </div>
</header>
```

#### C7. Content area spacing

PM2's content padding:
- Desktop: `p-10` (40px) → `lg:py-10 lg:px-0`
- Tablet: `p-8 px-5` (32px/20px) → `md:py-8 md:px-5`
- Phone: `p-6 px-4` (24px/16px) → `px-4 py-6`

Additionally, mobile needs bottom padding to clear the bottom nav (56px = h-14):

```svelte
<main class={clsx(
  'min-h-screen',
  'pb-14 md:pb-0',              // space for AppBottomNav on mobile
  useVerticalNav && 'lg:ms-16', // space for desktop sidebar
  !useVerticalNav && 'md:ms-0'  // no sidebar offset in horizontal mode
)}>
  <div class="mx-auto w-full max-w-[var(--max-w-content)] px-4 py-6 md:px-5 md:py-8 lg:px-0 lg:py-10">
    {@render children?.()}
  </div>
</main>
```

Wait — the tablet rail needs its own offset. When the tablet rail is visible
(768-1023px), and useVerticalNav is true, the content needs `md:ms-20`.
When desktop sidebar is visible (≥1024px), it needs `lg:ms-16`.
When useVerticalNav is false (horizontal mode), no offset is needed.

```svelte
<main class={clsx(
  'min-h-screen',
  'pb-14 md:pb-0',              // bottom nav space (mobile only)
  useVerticalNav && 'md:ms-20 lg:ms-16'  // tablet rail + desktop sidebar
)}>
```

#### C8. Remove click-outside handler

Since `UserMenu` now handles its own click-outside via `svelte:window` listener,
the root wrapper div no longer needs the `onclick`/`onkeydown` handlers:

```svelte
<!-- Before: -->
<div class="min-h-screen bg-pm-bg" onclick={...} onkeydown={...} role="presentation">

<!-- After: -->
<div class="min-h-screen bg-pm-bg">
```

Also remove `userMenuOpen` and `mobileUserMenuOpen` state variables — they were
only used for the click-outside handler.

### Part D: Final layout structure (complete template)

```svelte
{#if $page.url.pathname.startsWith('/admin/login') || $page.url.pathname.startsWith('/admin/change-password')}
  <main class="bg-pm-bg">
    {@render children?.()}
  </main>
{:else}
  <div class="min-h-screen bg-pm-bg">

    {#if useVerticalNav}
      <!-- Desktop Vertical Sidebar -->
      <aside class="hidden lg:flex ...">
        <div class="logo">P</div>
        <nav>{#each ...}{/each}</nav>
        <UserMenu {user} />
      </aside>

      <!-- Tablet Icon Rail -->
      <aside class="hidden md:flex lg:hidden ...">
        <div class="logo">P</div>
        <nav>{#each ...}{/each}</nav>
        <UserMenu {user} />
      </aside>
    {:else}
      <!-- Desktop Horizontal Header -->
      <header class="hidden lg:flex ...">
        <a>Title</a>
        <nav>{#each ...}{/each}</nav>
        <UserMenu {user} />
      </header>
    {/if}

    <!-- Mobile/Tablet Header (all screens below desktop) -->
    <AppMobileHeader pageTitle={currentPageTitle()} {user} />

    <!-- Bottom Navigation (phone + tablet — THE primary mobile nav) -->
    <div class="lg:hidden">
      <AppBottomNav sections={adminSections} currentPath={currentPath} {unreadCount} />
    </div>

    <!-- Main Content -->
    <main class={clsx('min-h-screen', 'pb-14 md:pb-0', useVerticalNav && 'md:ms-20 lg:ms-16')}>
      <div class="mx-auto w-full max-w-[var(--max-w-content)] px-4 py-6 md:px-5 md:py-8 lg:px-0 lg:py-10">
        {@render children?.()}
      </div>
    </main>

  </div>
{/if}
```

## PM3 Framework Rules

- **Config-driven**: `useVerticalNav` is driven by `FEATURES.appVerticalNav`.
  The layout adapts accordingly — no hardcoded mode.
- **No raw values**: All spacing uses `[var(--token)]` or Tailwind classes that
  reference design tokens. Check that `pb-14` (56px) matches the bottom nav height.
  If the bottom nav height is a token, use it: `pb-[var(--h-bottom-nav)]`.
- **Component composition**: Layout delegates to molecules instead of inlining
  100+ lines of markup. This is the PM3 way.

## Edge Cases

- **useVerticalNav = false + tablet**: In horizontal mode, there's no tablet rail.
  The horizontal header shows at all breakpoints. Mobile uses bottom nav. Test this.
- **Very many admin sections (>12)**: Sidebar nav should scroll (`overflow-y-auto`).
  Bottom nav should scroll horizontally. Tablet rail items should wrap or scroll.
- **Active state on deep paths**: `isActive()` checks `/admin/{id}` prefix.
  Test with `/admin/blog/create` — should "blog" be active? Currently it checks
  exact match or starts-with. Blog sub-pages should highlight the blog parent.
- **Unread count updates**: The 30-second polling interval should update the
  badge on ALL nav instances (sidebar, tablet rail, bottom nav). Since `unreadCount`
  is a shared `$state`, all components react automatically.

## Verification

```bash
npm run check
npm run build

# Manual testing (test at 3 breakpoints: 375px phone, 768px tablet, 1280px desktop):
#
# Phone (<640px):
# 1. AppMobileHeader visible: shows page title + user avatar button
# 2. AppBottomNav visible: shows all sections (scrollable), >8 items accessible
# 3. No hamburger menu, no drawer overlay
# 4. User menu in header opens/closes correctly
# 5. Clicking bottom nav items navigates to correct pages
#
# Tablet (768-1023px, useVerticalNav=true):
# 1. Icon rail sidebar visible (80px, icons + labels)
# 2. AppBottomNav still visible (tablet also uses bottom nav in APP MODE)
# 3. Content has ms-20 offset for rail
# 4. Clicking rail icons navigates correctly
#
# Desktop (≥1024px, useVerticalNav=true):
# 1. Full sidebar visible (64px, icons + tooltips)
# 2. No bottom nav, no mobile header
# 3. Content has ms-16 offset
# 4. Tooltips appear on icon hover
#
# Desktop (useVerticalNav=false):
# 1. Horizontal header visible with all nav icons
# 2. No sidebar
# 3. Content has no offset
#
# All modes:
# 1. User menu shows name/email/role + logout
# 2. Unread badge updates every 30s
# 3. Active page highlighted in all nav modes

# Verify layout line count:
wc -l src/routes/admin/+layout.svelte  # Should be ~180 (down from 291)
```

## Files to Modify

| File | Action | Lines |
|------|--------|-------|
| `src/routes/admin/+layout.svelte` | Full rewrite — proper APP MODE layout | -~120, +~50 |

No new files — uses molecules created in Step 03.
