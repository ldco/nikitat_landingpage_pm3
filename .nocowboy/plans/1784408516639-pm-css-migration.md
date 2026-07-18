# PM Design System — Migration Plan

## Executive Summary

**Problem:** CSS-токены (`app.css`) не соответствуют конфигу (`site.ts`). Цвета синие вместо красных. Нет автовычисления из примитивов. Сайт выглядит как generic Tailwind, а не как Puppet Master.

**Решение:** Портировать систему 4 примитивов из старого PM v2 в Tailwind v4 `@theme inline`, сохранив механику `var()` + `color-mix()` + `light-dark()`.

**Архитектура подтверждена:** Паттерн совпадает с Nuxt UI v3 — токены в `@theme`, стили в компонентах через Tailwind утилиты. Меняется только ЗНАЧЕНИЯ токенов.

---

## Architecture Decision: How It Works

```
┌──────────────────────┐     ┌──────────────────────┐
│ site.ts (конфиг)     │     │ app.css (@theme)     │
│ COLORS.brand:#901504 │────→│ --color-pm-brand     │
│ COLORS.black:#3b0902 │────→│ --color-pm-black     │
│ COLORS.white:#fbf2e7 │────→│ --color-pm-white     │
└──────────────────────┘     │                      │
                             │ Автовычисление:      │
                             │ --pm-brand-light:    │
                             │   color-mix(in srgb, │
                             │   var(--pm-brand),   │
                             │   white 15%)         │
                             │ --pm-surface:        │
                             │   light-dark(        │
                             │   var(--pm-white),   │
                             │   var(--pm-black))   │
                             └──────────────────────┘
                                      │
                                      ▼
                             ┌──────────────────────┐
                             │ Компоненты           │
                             │ bg-pm-brand          │
                             │ text-pm-text-primary │
                             │ hover:bg-pm-brand-   │
                             │   light              │
                             └──────────────────────┘
```

**Ключевой принцип:** Меняешь 4 примитива в `app.css` (+ синхронно в `site.ts`) → весь сайт перекрашивается автоматически.

**Почему `@theme inline`:** Tailwind v4 требует `inline` для токенов содержащих `var()`-ссылки. Без `inline` ссылки могут разрешиться в захардкоженные значения на этапе сборки.

---

## Implementation Plan

### Step 1: Полный `@theme` в `app.css`

Заменить текущие 39 строк на полную систему токенов из старого PM v2.

**1.1 — 4 примитива (из конфига)**
```css
@theme inline {
  --color-pm-black:  #3b0902;
  --color-pm-white:  #fbf2e7;
  --color-pm-brand:  #901504;
  --color-pm-accent: #901504;
```

**1.2 — Layout-цвета (16 токенов, автовычисление)**
```css
  --color-pm-bg: light-dark(var(--color-pm-white), var(--color-pm-black));
  --color-pm-surface: light-dark(
    color-mix(in oklch, var(--color-pm-white), var(--color-pm-black) 3%),
    color-mix(in oklch, var(--color-pm-black), var(--color-pm-white) 5%)
  );
  --color-pm-bg-sunken: light-dark(
    color-mix(in oklch, var(--color-pm-white), var(--color-pm-black) 6%),
    color-mix(in oklch, var(--color-pm-black), var(--color-pm-white) 2%)
  );
  --color-pm-border: light-dark(
    color-mix(in oklch, var(--color-pm-black), transparent 88%),
    color-mix(in oklch, var(--color-pm-white), transparent 85%)
  );
```

**1.3 — Text-цвета (7 токенов)**
```css
  --color-pm-text-primary: light-dark(var(--color-pm-black), var(--color-pm-white));
  --color-pm-text-secondary: light-dark(
    color-mix(in oklch, var(--color-pm-black), transparent 35%),
    color-mix(in oklch, var(--color-pm-white), transparent 35%)
  );
  --color-pm-text-muted: light-dark(
    color-mix(in oklch, var(--color-pm-black), transparent 55%),
    color-mix(in oklch, var(--color-pm-white), transparent 55%)
  );
  --color-pm-text-on-brand: var(--color-pm-white);
```

**1.4 — Interactive-цвета (автовычисление через color-mix)**
```css
  --color-pm-brand-hover: color-mix(in srgb, var(--color-pm-brand), white 15%);
  --color-pm-brand-active: color-mix(in srgb, var(--color-pm-brand), black 10%);
  --color-pm-brand-subtle: light-dark(
    color-mix(in srgb, var(--color-pm-brand), transparent 90%),
    color-mix(in srgb, var(--color-pm-brand), transparent 85%)
  );
  --color-pm-selection-bg: light-dark(
    color-mix(in srgb, var(--color-pm-brand), white 68%),
    color-mix(in srgb, var(--color-pm-brand), black 18%)
  );
  --color-pm-focus-ring: color-mix(in srgb, var(--color-pm-brand), transparent 50%);
```

**1.5 — Semantic-цвета (success, warning, danger, info)**
```css
  --color-pm-success: oklch(65% 0.2 145);
  --color-pm-success-bg: light-dark(oklch(95% 0.05 145), oklch(25% 0.05 145));
  --color-pm-warning: oklch(75% 0.15 85);
  --color-pm-warning-bg: light-dark(oklch(95% 0.05 85), oklch(25% 0.05 85));
  --color-pm-danger: oklch(55% 0.22 25);
  --color-pm-danger-bg: light-dark(oklch(95% 0.05 25), oklch(25% 0.05 25));
  --color-pm-info: oklch(60% 0.18 250);
  --color-pm-info-bg: light-dark(oklch(95% 0.05 250), oklch(25% 0.05 250));
```

**1.6 — Typography**
```css
  --font-sans: 'Inter', 'Geologica', 'Heebo', sans-serif;
  --font-display: 'Geologica', 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
```

**1.7 — Radii, shadows, easings, z-index**
```css
  --radius-pm-sm: 6px;
  --radius-pm-md: 8px;
  --radius-pm-lg: 12px;
  --radius-pm-full: 9999px;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-card-hover: 0 10px 25px rgba(0,0,0,0.15);
  --shadow-modal: 0 25px 50px rgba(0,0,0,0.25);
  --shadow-toast: 0 4px 12px rgba(0,0,0,0.15);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}
```

**1.8 — Base layer (после @theme)**
```css
@layer base {
  body {
    background: var(--color-pm-bg);
    color: var(--color-pm-text-primary);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }
  ::selection {
    background: var(--color-pm-selection-bg);
    color: var(--color-pm-black);
  }
  :focus-visible {
    outline: 2px solid var(--color-pm-focus-ring);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  :lang(he) { direction: rtl; }
}
```

**1.9 — Component layer (layout utilities only)**
```css
@layer components {
  /* Containers */
  .container-narrow  { max-width: 48rem; margin-inline: auto; padding-inline: 1.5rem; }
  .container-default { max-width: min(80rem, 100%); margin-inline: auto; padding-inline: 1.5rem; }
  .container-wide    { max-width: 96rem; margin-inline: auto; padding-inline: 1.5rem; }
  .container-prose   { max-width: 65ch; margin-inline: auto; padding-inline: 1.5rem; }

  /* Grid utilities */
  .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }

  /* Page title */
  .page-title { font-family: var(--font-display); font-size: clamp(1.75rem, 3.5vw, 2.5rem); font-weight: 700; }
  .lead { font-size: 1.125rem; color: var(--color-pm-text-secondary); }

  /* Hamburger animations — already ported from Phase 3, keep as-is */
}

/* 1.10 — Keyframe animations */
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes fade-in-up { from { opacity: 0; transform: translateY(1rem); } to { opacity: 1; transform: translateY(0); } }
@keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
@keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
```

### Step 2: Синхронизировать `site.ts` COLORS

Убедиться что `COLORS` в `src/lib/config/site.ts` содержит ТЕ ЖЕ значения что и примитивы в `app.css`:
```ts
export const COLORS = {
  black: '#3b0902',
  white: '#fbf2e7',
  brand: '#901504',
  accent: '#901504'
}
```

### Step 3: Обновить имена токенов в компонентах

Текущие компоненты используют `text-pm-muted`, `bg-pm-brand`, `text-pm-black`. После Step 1 эти имена изменятся на:
- `text-pm-text-muted` (было `text-pm-muted`)
- `bg-pm-brand` (остаётся)
- `text-pm-text-primary` (было `text-pm-black`)
- `bg-pm-bg` (было `bg-pm-bg`)
- `border-pm-border` (было ручное указание border)

**НО:** Лучше сохранить короткие имена токенов где возможно. Проверить какие utility-классы Tailwind сгенерирует из имён `--color-pm-*`.

Tailwind генерирует утилиты по шаблону: `--color-pm-XXX` → `bg-pm-XXX`, `text-pm-XXX`.
- `--color-pm-brand` → `bg-pm-brand`, `text-pm-brand` ✅
- `--color-pm-text-primary` → `bg-pm-text-primary`, `text-pm-text-primary` (длинно)
- `--color-pm-bg` → `bg-pm-bg` ✅

**Решение:** Использовать короткие алиасы для часто используемых токенов. Например `--color-pm-muted` как алиас для `--color-pm-text-muted`.

### Step 4: Верификация

1. `npx svelte-check` — 0 errors
2. `npm run dev` → страница рендерится
3. Цвета тёплые красно-коричневые (не синие)
4. Dark mode переключается корректно
5. ВСЕ секции видны (Hero, About, Focus, F22, Portfolio, Contact)
6. Header/footer используют правильные цвета
7. `site.ts` COLORS и `app.css` примитивы совпадают

---

## Что НЕ трогаем (уже правильно)

| Компонент | Статус |
|-----------|--------|
| Архитектура (app.css @theme + компоненты Tailwind) | ✅ Правильно |
| class prop + twMerge(clsx()) | ✅ Правильно |
| Svelte 5 runes ($props, $state, $derived, $effect) | ✅ Правильно |
| Структура компонентов (atoms/molecules/complex/sections) | ✅ Правильно |
| i18n Paraglide | ✅ Правильно |
| Самбургер CSS-анимации | ✅ Правильно |
| Font face (@fontsource) | ✅ Правильно |
| Конфиг site.ts | ✅ Правильно (нужна только сверка цветов) |

---

## Что удалить из app.css

| Текущее | Почему |
|---------|--------|
| `--color-pm-brand: #0066cc` | ❌ Не тот цвет |
| `--color-pm-black: #0d0d0d` | ❌ Не тот цвет |
| `--color-pm-white: #ffffff` | ❌ Не тот цвет |
| `--color-pm-gray-50..900` | ⚠️ Оставить как fallback |
| `--color-pm-bg: #f9fafb` | ❌ Заменить на авто-вычисленный |
| `--color-pm-bg-dark: #1a1a2e` | ❌ Заменить на авто-вычисленный |

---

## Порядок фаз после исправления CSS

```
FRAMEWORK LEVEL (должен работать для ЛЮБОГО проекта):
✅ Phase 0-2: Фундамент (БД, API, i18n, конфиг)
✅ Phase 3:   CSS design tokens ← ИСПРАВЛЯЕМ СЕЙЧАС
✅ Phase 4-7: Компоненты, навигация
⬜ Phase 10:  Admin Panel (17 CRUD страниц)
⬜ Phase 14:  Testing (unit + integration)
⬜ Phase 15:  MCP Server (AI dev tools)
⬜ Phase 13:  Deploy (Docker + Ansible)
⬜ Phase 12:  Git Remotes
⬜ Phase 16:  Documentation

SITE LEVEL (специфично для проекта):
⬜ Phase 8:   Animations (GSAP, FallingLetters, Scrollytelling)
⬜ Phase 9:   Module Plugins (Portfolio/Blog detail pages)
⬜ Phase 11:  Public Pages (legal, blog routes)
```

**Логика:** Если framework сделан правильно, сайт "получается сам" когда в конфиге указаны правильные значения. Анимации и плагины — это уже вишенки на торте.

---

## Verification Checklist

- [ ] `npx svelte-check` → 0 errors
- [ ] `npm run dev` → страница рендерится без 500
- [ ] Hero использует `sections_hero` (i18n)
- [ ] Цвета: красно-коричневые, тёплые (не синие)
- [ ] Dark mode: фон тёмный, текст светлый
- [ ] Header: glass-эффект при скролле
- [ ] Footer: правильные цвета
- [ ] Все 6 homepage-секций отображаются
- [ ] LangSwitcher работает (ru/en/fr/he)
- [ ] ThemeToggle переключает light/dark
- [ ] CookieConsent появляется и принимается
- [ ] `site.ts` COLORS совпадают с примитивами в `app.css`

---

## Audit Findings — Component Token Issues (39 files scanned)

### Step 3 (дополнено): Конкретные фиксы компонентов

**3.1 — CRITICAL: Несуществующий токен**
| Файл | Строка | Было | Стало |
|------|--------|------|-------|
| `SectionFaq.svelte` | 34 | `dark:hover:bg-pm-gray-750` | `dark:hover:bg-pm-gray-700` |

**3.2 — CRITICAL: Компонент без pm-* токенов**
| Файл | Проблема | Фикс |
|------|----------|------|
| `PortfolioLightbox.svelte` | `bg-black/90` | `bg-pm-black/90` |
| | `text-white/80` | `text-pm-white/80` |
| | `hover:text-white` | `hover:text-pm-white` |
| | `text-white/70` | `text-pm-white/70` |
| | `bg-white` | `bg-pm-white` |
| | `bg-white/40` | `bg-pm-white/40` |

**3.3 — HIGH: 15 компонентов с `text-white` / `bg-white`**

Найти и заменить во ВСЕХ .svelte файлах:
- `text-white` → `text-pm-white` (кроме случаев где `text-white` — часть другого класса)
- `bg-white` → `bg-pm-white` (кроме случаев где `bg-white` — часть другого класса)
- `bg-white/80` → `bg-pm-white/80`

Компоненты: CtaButton, BackToTop, EmptyState, LangSwitcher, BlogPostCard, PricingCard, TheHeader, CookieConsent, ConfirmDialog, ToastContainer, SectionFocus, SectionPortfolio, SectionContact, SectionFeatures, SectionTeam, SectionTestimonials

**3.4 — HIGH: FormField — заменить стандартные gray на pm-gray**
| Было | Стало |
|------|-------|
| `border-gray-300` | `border-pm-gray-300` |
| `dark:border-gray-600` | `dark:border-pm-gray-600` |
| `dark:bg-gray-800` | `dark:bg-pm-gray-800` |

**3.5 — HIGH: ConfirmDialog overlay**
| Было | Стало |
|------|-------|
| `bg-black/50` | `bg-pm-black/50` |

**3.6 — DEAD CODE: site.ts COLORS**
После синхронизации app.css с конфигом, COLORS в site.ts должен использоваться хотя бы в одном месте — например в `src/lib/config/site.ts` как экспорт для документации. На данный момент — не импортирован нигде. Добавить импорт в `app.css` невозможно (CSS не импортирует TS). COLORS остаётся как reference для разработчика.

---

## Final Verification Checklist (обновлено)

- [ ] `npx svelte-check` → 0 errors
- [ ] `npm run dev` → рендерится без 500
- [ ] Цвета: красно-коричневые (#901504 / #3b0902 / #fbf2e7)
- [ ] Dark mode: фон тёмный, текст светлый
- [ ] `grep -r "text-white" src/lib/components/` → 0 результатов (все заменены на pm-white)
- [ ] `grep -r "bg-white" src/lib/components/` → 0 результатов
- [ ] `grep -r "pm-gray-750" src/` → 0 результатов (несуществующий токен)
- [ ] `grep -r "border-gray-300" src/lib/components/atoms/FormField.svelte` → 0 результатов
- [ ] PortfolioLightbox использует pm-* токены (не `bg-black/90`, не `text-white/80`)
- [ ] Все 6 homepage-секций отображаются
- [ ] LangSwitcher + ThemeToggle работают
- [ ] `site.ts` COLORS совпадают с примитивами в `app.css` (#3b0902, #fbf2e7, #901504, #901504)

---

## Unresolved: @theme inline vs regular @theme

При имплементации проверить:
1. Написать `@theme { --color-test: var(--other); }` в app.css
2. `npm run dev`
3. В Chrome DevTools изменить `--other` → проверить обновился ли `--color-test`
4. Если НЕ обновился → использовать `@theme inline` для всех токенов с `var()`
5. Если обновился → обычный `@theme` ок

Это единственный момент который нельзя проверить без запуска кода.
