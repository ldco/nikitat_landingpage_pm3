# PM v2 vs PM v3 — Complete Component-by-Component Comparison

**Задача:** Запустить PM v2 (Nuxt) и PM v3 (SvelteKit) бок о бок на одном экране. Для КАЖДОГО компонента сравнить HTML-структуру, CSS-классы, поведение.

## Setup
```bash
# Terminal 1: PM v2 (Nuxt) — порт 3000
cd ../app-nuxt && npm run dev

# Terminal 2: PM v3 (SvelteKit) — порт 5173
cd app && npm run dev
```

## Check list

### 1. TheHeader
| Aspect | PM v2 | PM v3 |
|--------|-------|-------|
| Logo position (desktop) | В левой колонке grid (auto 1fr auto) | ? |
| Nav position (desktop) | Центр, `justify-self: center` | ? |
| Actions (lang, theme) | Правая колонка, `justify-self: end` | ? |
| Scroll glass effect | `.header--scrolled` | `bg-pm-bg/85 backdrop-blur-[16px]` |
| Logo shrink on scroll | `--logo-scrolled-height: 28px` | `h-[var(--logo-scrolled-height)]` |
| Mobile: hamburger + centered logo | Hamburger left, logo absolute-center | ? |
| Mobile: drawer with backdrop | Slide from left, backdrop | ? |
| LangSwitcher dropdown | Иконка флага + стрелка, открывает список | ? |
| ThemeToggle icon | Sun/moon SVG | ? |
| Interactive header config | `interactiveHeader: true/false` | ✅ |

### 2. TheFooter
| Aspect | PM v2 | PM v3 |
|--------|-------|-------|
| Layout grid | `auto minmax(0,1fr)` (brand | actions) | ? |
| Frosted glass | `backdrop-filter: blur(16px)` | ✅ |
| Legal bar | copyright + links | ✅ |
| MadeBy | Theme+locale aware | ? |
| MadeWith | Conditional on FRAMEWORK.url | ✅ |

### 3. SectionHero
| Aspect | PM v2 | PM v3 |
|--------|-------|-------|
| Title line-break algo | buildWordGroups() + brand color | ✅ |
| GSAP intro animation | Logo zoom-out + screen shake | ✅ (in src/project) |
| Parallax layers | HeroParallaxScene | ✅ (conditional) |
| Title segments | `.hero-title__line--brand` (accent color) | `text-pm-brand` |
| RTL support | `section-hero--right` class | ✅ (logical props) |

### 4. Theme toggle
| Aspect | PM v2 | PM v3 |
|--------|-------|-------|
| Persistence | localStorage `pm-color-mode` | ✅ |
| System preference | `prefers-color-scheme` listener | ✅ |
| .dark class on `<html>` | Nuxt color-mode | `initTheme()` applies |
| **CLICK WORKS?** | ✅ | ❌ — needs fix |

### 5. Hamburger / Mobile nav
| Aspect | PM v2 | PM v3 |
|--------|-------|-------|
| Toggle `mobileOpen` | `$state` toggle | ✅ |
| Drawer animation | Slide-in from left + backdrop | ? |
| **CLICK WORKS?** | ✅ | ❌ — needs fix |

### 6. LangSwitcher
| Aspect | PM v2 | PM v3 |
|--------|-------|-------|
| Dropdown mode | Button + svg icon + list | ? |
| Side-by-side mode | Inline locale initials | ? |
| Inline mode | Text with "/" separator | ? |
| Reactive to locale change | Nuxt i18n | `$page.data.locale` |
| **CLICK WORKS?** | ✅ | ❌ — needs fix |

### 7. CookieConsent
| Aspect | PM v2 | PM v3 |
|--------|-------|-------|
| State initialization | From localStorage on mount | `getInitialState()` |
| Accept/Reject buttons | localStorage + hide | ✅ |
| FEATURES.cookies check | Hides entire banner | ✅ |
| **CLICK WORKS?** | ✅ | ❌ — needs fix |

### 8. Admin pages
| Aspect | PM v2 | PM v3 |
|--------|-------|-------|
| Login layout (blank, no menu) | `blank.vue` | `{#if $page.url.pathname.startsWith('/admin/login')}` |
| Sidebar icons | Tabler icons | ✅ (Tabler barrel import) |
| Data tables | Global CSS `.data-table` | Tailwind per-page |
| Mobile bottom nav | Scrollable icons | ✅ |
| User dropdown menu | Avatar → popover | ✅ |

### 9. Logo
| Aspect | PM v2 | PM v3 |
|--------|-------|-------|
| Theme detection | `useTheme()` | `themeStore.current` |
| Locale detection | `useI18n()` | `runtime.languageTag()` |
| Image file resolution | Fallback chain | ✅ |
| **IMAGE SERVES?** | ✅ | ❌ — needs restart after svelte.config fix |

## Root Cause Analysis

### Why clicks don't work
1. `$state` at module level in `.svelte.ts` creates reactive state BUT:
   - `$effect` at module level DOES NOT RUN (Svelte limitation)
   - Moved all side effects to `toggle()`/`set()` functions in the FIXED version
   - But maybe `$state` at module level in `.svelte.ts` ALSO doesn't work?

2. To verify: create a simple `.svelte` component with `$state` inside the component (not module level):
```svelte
<script lang="ts">
  let count = $state(0)
</script>
<button onclick={() => count++}>{count}</button>
```
This ALWAYS works in Svelte 5. If THIS button doesn't work, the issue is SvelteKit hydration, not state.

3. Hydration test: run `npm run build && node build` (production) vs `npm run dev` (development). If it works in production but not dev, it's a HMR issue. If it works in neither, it's a compiler issue.

### Why logo doesn't show
1. `files.assets = './public'` in svelte.config.js — requires server restart
2. Logo component returns empty `src` if no matching variant found
3. Check if `public/logos/horizontal_light_en.svg` is actually served at `/logos/horizontal_light_en.svg`

## Actions
1. Run `npm run dev` in PM v2 (port 3000)
2. Run `npm run dev` in PM v3 (port 5173)
3. Open BOTH in browser (two windows side by side)
4. For each component in this list, VERIFY it matches PM v2
5. If different — note the difference and fix
6. Re-check after each fix
