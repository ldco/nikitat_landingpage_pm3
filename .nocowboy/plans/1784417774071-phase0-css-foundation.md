# Phase 0: CSS Foundation — Финальный план

**Дата:** 2026-07-19
**Статус:** ⚠️ Требует доработки (browser-hacks ещё не добавлены)
**Зависит от:** Ничего (это фундамент)

## Архитектура app.css (следуя паттерну Tailwind + custom hacks)

```
app.css
├── @import "tailwindcss"
├── @import "@fontsource-*/..."
├── @custom-variant dark (...)              ← class-based dark mode
├── @custom-variant ios (...)              ← iOS detection (НЕТ в PM сейчас, НОВОЕ)
├── @custom-variant safari (...)           ← Safari detection (НЕТ в PM сейчас, НОВОЕ)
├── @theme { }                             ← PM design tokens (✅ уже есть)
│   └── --breakpoint-header: 1120px        ← (ДОБАВИТЬ: header breakpoint)
├── @layer base { }                        ← reset + base styles
│   ├── :root { --space-*, --gap-*, --header-*, etc. }  (✅ уже есть)
│   ├── html, body, a, h1-h6, img, etc.   (✅ уже есть)
│   ├── ::selection                        (✅ уже есть)
│   ├── .dark { --color-pm-*: ... }       (✅ уже есть)
│   ├── @media (prefers-reduced-motion)   (✅ уже есть)
│   └── ДОБАВИТЬ:
│       ├── @media (forced-colors: active) { ... }  ← Windows High Contrast
│       ├── :lang(he) { --font-brand-primary: 'Heebo' }  ← Hebrew font
│       ├── * { scrollbar-width: thin; scrollbar-color: ... }  ← custom scrollbar
│       ├── ::-webkit-scrollbar { ... }   ← WebKit scrollbar
│       ├── input[type="search"]::-webkit-search-* { -webkit-appearance: none }  ← Safari search normalization
│       └── input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer }  ← date picker
├── @layer components { }                  ← (ТОЛЬКО hamburger ✅)
├── @layer utilities { }                   ← ДОБАВИТЬ: кастомные утилиты-хаки
│   ├── .safe-area-top { padding-top: env(safe-area-inset-top) }
│   ├── .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom) }
│   ├── .scroll-touch { -webkit-overflow-scrolling: touch; overscroll-behavior: contain }
│   └── .fix-ios-sticky { -webkit-transform: translateZ(0) }
└── @keyframes { }                         ← (✅ уже есть)
```

## Что нужно ДОБАВИТЬ в app.css

Все добавления — в `@layer base` и `@layer utilities`, НЕ в @layer components.

### Блок 1: @layer base — доступность + кросс-браузерность

```css
@layer base {
  /* 1. Windows High Contrast Mode (forced-colors) */
  @media (forced-colors: active) {
    button, [role="button"] { border: 1px solid ButtonText; }
    input, select, textarea { border: 1px solid ButtonText; }
    :focus-visible { outline: 3px solid Highlight; }
  }

  /* 2. Hebrew font override */
  :lang(he) {
    --font-brand-primary: 'Heebo Variable', 'Heebo', var(--font-sans);
  }

  /* 3. Custom scrollbar (standard) */
  * {
    scrollbar-width: thin;
    scrollbar-color: color-mix(in oklch, var(--color-pm-text) 20%, transparent) transparent;
  }

  /* 4. Custom scrollbar (WebKit) */
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: color-mix(in oklch, var(--color-pm-text) 20%, transparent);
    border-radius: 4px;
    border: 2px solid transparent;
    background-clip: padding-box;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: color-mix(in oklch, var(--color-pm-text) 40%, transparent);
    background-clip: padding-box;
  }

  /* 5. Safari search input normalization */
  input[type="search"]::-webkit-search-cancel-button,
  input[type="search"]::-webkit-search-decoration,
  input[type="search"]::-webkit-search-results-button,
  input[type="search"]::-webkit-search-results-decoration {
    -webkit-appearance: none;
    display: none;
  }

  /* 6. Safari date/time picker */
  input[type="date"]::-webkit-calendar-picker-indicator,
  input[type="time"]::-webkit-calendar-picker-indicator,
  input[type="datetime-local"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
    opacity: 0.6;
  }
  input[type="date"]::-webkit-calendar-picker-indicator:hover,
  input[type="time"]::-webkit-calendar-picker-indicator:hover,
  input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
  }
}
```

### Блок 2: @layer utilities — кастомные утилиты-хаки

```css
@layer utilities {
  /* iOS safe area (notch) */
  .safe-area-top { padding-top: env(safe-area-inset-top); }
  .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
  .safe-area-left { padding-left: env(safe-area-inset-left); }
  .safe-area-right { padding-right: env(safe-area-inset-right); }

  /* iOS momentum scrolling */
  .scroll-touch { -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }

  /* Устаревшие адаптивные классы (заменяются Tailwind, пока сохраняем для обратной совместимости) */
  .hide-tablet-up { @media (min-width: 640px) { display: none; } }
  .show-tablet-up { @media (min-width: 640px) { display: block; } }

  /*
    TODO: добавить кастомные варианты при необходимости:
    @custom-variant ios (@supports (-webkit-touch-callout: none))
    → использовать: ios:h-dvh (вместо h-screen на iOS)
  */
}
```

### Блок 3: @custom-variant — browser-specific variants (опционально)

```css
/* Если понадобится таргетить конкретные браузеры: */
@custom-variant ios (@supports (-webkit-touch-callout: none));
@custom-variant not-ios (@supports not (-webkit-touch-callout: none));

/* Использование в компонентах:
  <div class="h-screen ios:h-dvh"> — на iOS используем dvh, на остальных vh
*/
```

Пока НЕ добавляем — добавляем только при обнаружении конкретного бага.

### Блок 4: @theme — header breakpoint

```css
@theme {
  --breakpoint-header: 1120px;
}
```

→ Использовать: `header:flex header:hidden header:grid-cols-[auto_1fr_auto]`

## Что НЕ добавляем в app.css

- ❌ `.btn`, `.card`, `.badge`, `.tabs`, `.input`, `.modal` — это в компонентах как Tailwind
- ❌ `.section`, `.section-hero`, `.hero-title` — это в компонентах как Tailwind
- ❌ `.desktop-only`, `.mobile-only` — заменяется на `lg:hidden`, `sm:flex`
- ❌ `.grid-desktop-3`, `.grid-desktop-4` — заменяется на `lg:grid-cols-3`
- ❌ `.scroll-x`, `.scroll-y` — заменяется на `snap-x snap-mandatory`
- ❌ `.opacity-50`, `.cursor-pointer` — встроенные Tailwind утилиты
- ❌ `.hover-lift` — заменяется на `transition-transform hover:-translate-y-0.5 hover:shadow-md`
- ❌ `vh-fix.client.ts` (JS плагин) — `dvh` поддерживается с 2023, УДАЛИТЬ
- ❌ `color-render-fallback.client.ts` (JS плагин) — токены предвычислены в hex, УДАЛИТЬ

## Что остаётся в PM v2 библиотеке, но НЕ мигрируется

Причина: Tailwind покрывает это, или функционал устарел:

| PM v2 класс/файл | Решение | Почему |
|---|---|---|
| `breakpoints.css` + `@custom-media` | Tailwind `sm: lg: xl: header:` | Tailwind делает то же самое |
| `responsive.css` (mobile-only, desktop-only...) | Tailwind `sm:hidden lg:flex` | Tailwind-утилиты заменяют |
| `edge-cases.css` (dvh/svh классы) | Tailwind `h-dvh min-h-dvh` | Встроено в Tailwind v4 |
| `effects.css` (opacity, hover-lift) | Tailwind `opacity-50 hover:-translate-y-0.5` | Tailwind-утилиты заменяют |
| `scrollbars.css` (.scrollbar-thin, .scrollbar-hidden) | Частично: переносим базовые стили в @layer base, вариации — через Tailwind scrollbar plugin | Сокращаем до минимума |
| `utilities.css` | Tailwind-утилиты заменяют ВСЁ | Полностью удаляем |
| `sizing.css` | Tailwind `w-* h-*` | Полностью удаляем |
| `flexbox.css`, `grid.css` | Tailwind `flex flex-col grid grid-cols-*` | Полностью удаляем |
| `icons.css` (icon sizes) | Tailwind `w-4 h-4` и т.д. | Полностью удаляем |

## Верификация

1. `npm run check` → 0 errors
2. `npm run dev` → Открыть localhost:5173, проверить:
   - Скроллбары выглядят как в PM v2
   - Страница не ломается в Windows High Contrast Mode
   - Hebrew страница использует Heebo
   - Темы переключаются без глюков
3. Убедиться, что старые Nuxt плагины (vh-fix, color-render-fallback) НЕ портированы в SvelteKit
