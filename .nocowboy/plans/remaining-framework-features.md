# Remaining PM v2 Framework Features — Implementation Plan

**STATUS:** All must be implemented. These are FRAMEWORK features, not site-specific.

## 1. verticalNav — Website Icon Sidebar

**Feature:** When `FEATURES.verticalNav` is `true`, the website TheHeader renders as a narrow icon-only sidebar instead of horizontal header. Same pattern as admin `appVerticalNav`.

**File:** `src/lib/components/complex/TheHeader.svelte`

**Implementation:**
```svelte
import { FEATURES } from '$lib/config/site'
const isVerticalNav = $derived(FEATURES.verticalNav)
```

When `isVerticalNav` is true, render sidebar instead of horizontal header:
- Narrow sidebar (4rem wide), fixed left
- Logo at top (short/circle)
- Nav links as icon buttons with tooltips (same pattern as admin sidebar)
- ThemeToggle + LangSwitcher at bottom
- Mobile: sidebar hidden, bottom nav + mobile drawer

## 2. heroParallax — Hero Parallax Scene

**Feature:** When `FEATURES.heroParallax` is `true`, render parallax layers behind the hero section.

**File:** `src/lib/components/sections/SectionHero.svelte`

**Implementation:**
- Import `FEATURES.heroParallax` check
- When true, render a `<div class="hero-parallax-scene">` with cloud/landmark layers
- Layers use CSS custom properties for scroll offset (--pm-scene-progress)
- Each layer has a different scroll speed multiplier
- Reference: PM v2 `content/hero-parallax.css` (207 lines)

## 3. pageTransitions — Config-Driven Page Transitions

**Feature:** When `FEATURES.pageTransitions` is not empty and `FEATURES.onepager` is false, apply Svelte transitions matching the PM v2 animation.

**File:** `src/routes/+layout.svelte`

**Implementation:**
- Map PM v2 transition names to Svelte transition functions:
  - 'zoom' → scale with start: 1.1
  - 'slide-left' → slide with axis: 'x'
  - 'slide-up' → slide with axis: 'y'
  - 'scale' → scale with start: 0.95
  - 'fade' → fade
  - 'flip' → fly (approximation)
  - '' (empty) → no transition
- Apply via a Svelte reactive `transition:` directive
- Only when `FEATURES.onepager` is false (SPA mode)

## 4. headerContact — Quick Contact Buttons in Header

**Feature:** When `headerContact.enabled` is true, show quick contact buttons (email, telegram) in the website header.

**File:** `src/lib/components/complex/TheHeader.svelte`

**Implementation:**
- Import contact settings from config
- Check `headerContact.enabled` and `headerContact.items`
- For each item, check if the corresponding setting has a value in the database
- If yes, render an icon button (e.g., envelope for email, telegram icon)
- These appear in the header actions area (right side on desktop)

## 5. Admin Settings → Header Buttons

**Feature:** When `contact.headerQuickEnabled` is true and `contact.headerQuickItems` has values, header shows quick contact buttons based on admin settings.

**File:** `src/lib/components/molecules/HeaderActions.svelte` (or inline in TheHeader)

**Implementation:**
- Read `contact.headerQuickEnabled` from FEATURES config
- Read `contact.headerQuickItems` from admin settings in database
- Map each item to an icon (email=mdi-email, telegram=mdi-telegram, etc.)
- Render button for each configured item

## 6. contactEmailConfirmation / contactTelegramNotify

**Feature:** These are FORM features. When enabled, the contact form shows additional UI:
- Email confirmation checkbox/section
- Telegram notification indicator

**File:** `src/lib/components/sections/SectionContact.svelte`

**Implementation:**
- Import `FEATURES.contactEmailConfirmation` and `FEATURES.contactTelegramNotify`
- When email confirmation is enabled, show email field + confirmation message
- When telegram is enabled, show Telegram notification checkbox/info

## 7. Admin header — unread messages badge

**Feature:** In the admin contacts page, show unread message count badge with polling every 30 seconds. Already in PM v2 admin.vue.

**File:** `src/routes/admin/+layout.svelte`

**Implementation:**
- Add `unreadCount` state
- `$effect` with `setInterval(30000)` polling for unread contacts
- Show badge on contacts nav item when count > 0

## Implementation Order
1. verticalNav (TheHeader sidebar mode)
2. pageTransitions (root layout)
3. heroParallax (SectionHero)
4. headerContact + admin settings buttons
5. contact form features
6. unread badge

## Verification
- `npm run check` after each feature
- `npm run dev` to verify visual behavior
- Toggle each feature in `site.ts` → component responds correctly
