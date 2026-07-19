# CSS Edge Cases: PM v2 → Tailwind v4 Migration Guide

## 1. RTL (Right-to-Left) — Hebrew

**PM v2 подход:** 317+ вхождений логических свойств (margin-inline, padding-inline, inset-inline, text-align: start) + явные `[dir='rtl']` переопределения.

**Tailwind v4 решение:** Tailwind полностью поддерживает RTL через логические свойства:
- `me-4` → `margin-inline-end`, `ms-4` → `margin-inline-start`
- `pe-5` → `padding-inline-end`, `ps-5` → `padding-inline-start`
- `start-0` → `inset-inline-start`, `end-0` → `inset-inline-end`
- `text-start` → `text-align: start`
- RTL флипает эти значения автоматически на `<html dir="rtl">`

**Что требует ручной работы:**

### 1.1 Lightbox slide direction
```css
/* PM v2 */
[dir='rtl'] .lightbox-slide-enter-from { transform: translateX(100%); }
[dir='rtl'] .lightbox-slide-leave-to { transform: translateX(-100%); }
```
→ Tailwind: не требуется глобальный CSS. Проп в компоненте:
```svelte
<script>let { dir = 'ltr' } = $props()</script>
<div class="transform transition-transform"
     class:translate-x-full={dir === 'rtl'}
     class:-translate-x-full={dir !== 'rtl'}>
```

### 1.2 Sidebar tooltips (admin)
```css
/* PM v2 */
[dir='rtl'] .sidebar-nav-link .sidebar-tooltip { left: auto; right: 100%; }
[dir='rtl'] .sidebar-icon-btn .sidebar-tooltip { left: auto; right: 100%; }
```
→ Tailwind: `end-full` + `start-auto` в компоненте

### 1.3 Contact-info icon direction
```css
/* PM v2 */
[dir='rtl'] .contact-info-item { flex-direction: row-reverse; }
```
→ Tailwind: `flex-row` в компоненте (логическое направление)

### 1.4 Footer MadeBy logo
```css
/* PM v2 */
:dir(rtl) .made-by__logo { /* ... */ }
```
→ Tailwind: `dir-rtl:` variant (кастомный) или класс `[dir="rtl"] &` в Tailwind v4

### 1.5 Language-specific fonts
```css
/* PM v2 */
:lang(he) {
  --font-brand-primary: 'Heebo', var(--fallback-sans);
}
```
→ Tailwind: не нужно. `Heebo` уже загружен и будет использоваться через `font-family`. RTL языки получают Heebo автоматически при `<html lang="he">`.

**Итого по RTL:** 95% решается логическими Tailwind-утилитами. Остальные 5% (lightbox slide, sidebar tooltips) — в компонентах.

---

## 2. Брейкпоинты

**PM v2:** postcss-custom-media с семантическими именами.

**Tailwind v4 решение — прямое сопоставление:**

| PM v2 | Tailwind | Применение |
|-------|----------|-----------|
| `@media (--phone)` = `< 640px` | `(default)` | Мобильный-first, без префикса |
| `@media (--tablet)` = `≥ 640px` | `sm:` | Планшеты |
| `@media (--desktop)` = `≥ 1024px` | `lg:` | Десктоп |
| `@media (--header-desktop)` = `≥ 1120px` | `header:` (custom) | Header breakpoint |
| `@media (--large)` = `≥ 1280px` | `xl:` | Большие экраны |

**Добавить в `@theme` в `app.css`:**
```css
@theme {
  --breakpoint-header: 1120px;
}
```
→ Использовать как `header:hidden header:flex` в компонентах.

---

## 3. Вьюпорт / iOS / Mobile

### 3.1 dvh/svh/lvh (уже решено в Tailwind v4)
```css
/* PM v2 */
.min-h-dvh { min-height: 100dvh; }
.h-dvh { height: 100dvh; }
```
→ Tailwind v4: `min-h-dvh`, `h-dvh`, `h-svh` — встроенные утилиты.

### 3.2 iOS safe area (notch)
```css
/* PM v2 */
.safe-area-top { padding-block-start: env(safe-area-inset-top); }
```
→ Tailwind: `pt-safe`, `pb-safe`, `pl-safe`, `pr-safe` (через `tailwindcss-safe-area` плагин или кастомные утилиты в `@layer utilities`).

### 3.3 iOS momentum scrolling
```css
/* PM v2 */
.scroll-container { -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
```
→ Tailwind: добавить в `@layer base`:
```css
.scroll-touch { -webkit-overflow-scrolling: touch; }
```
Или inline: `style="-webkit-overflow-scrolling: touch"`.

### 3.4 vh-fix.client.ts — УСТАРЕЛ
Удалить. `dvh` поддерживается всеми браузерами с 2023. Не нужно портировать.

### 3.5 `-webkit-tap-highlight-color: transparent`
Уже в `@layer base` в нашем `app.css`. ✅

### 3.6 Input zoom на Samsung
```css
/* PM v2 reset.css */
input, select, textarea { font-size: 16px; }
```
Уже в `@layer base` в нашем `app.css`. ✅

---

## 4. Браузерные хаки

### 4.1 Chrome GPU oklch color-banding (color-render-fallback.client.ts)
**Проблема:** Chrome (не Brave/Edge/Opera) создаёт видимые артефакты при `color-mix(in oklch, ...)` на границах элементов.

**Решение PM v2:** 108-строчный JS плагин, который UA-сниффит Chrome и добавляет `.use-color-fallback` класс к `<html>`.

**Tailwind v4 решение:** В нашем `app.css` мы НЕ используем `color-mix()` для основных токенов — все значения ПРЕД-ВЫЧИСЛЕНЫ в hex. В самом `@theme` нет oklch-вычислений. Это решает проблему без JS-хака.

НО в хамбургер-анимациях мы используем oklch-цвета. И в `@layer base .dark {}` есть `--surface-frosted-bg: color-mix(in oklch, ...)`.

**Портировать:** если проблема проявляется — добавить в `hooks.client.ts` или `app.html`:
```html
<script>
  if (navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg/') && !navigator.userAgent.includes('OPR/') && !navigator.userAgent.includes('Brave')) {
    document.documentElement.classList.add('use-color-fallback')
  }
</script>
```

### 4.2 Safari input[type="search"] — remove native decorations
```css
/* PM v2 inputs.css */
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-decoration { -webkit-appearance: none; display: none; }
```
→ Tailwind: `appearance-none` убирает часть, но не search-specific. Добавить в `@layer base`.

### 4.3 Safari date/time picker — unify cursor
```css
/* PM v2 inputs.css */
input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; }
```
→ Tailwind: только через глобальный CSS. Добавить в `@layer base`.

### 4.4 Firefox scrollbar-width
```css
/* PM v2 scrollbars.css */
* { scrollbar-width: thin; scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track); }
```
→ Tailwind: плагин `tailwind-scrollbar` или кастомный CSS в `@layer base`.

---

## 5. Accessibility

### 5.1 Forced colors mode (Windows High Contrast)
```css
/* PM v2 accessibility.css */
@media (forced-colors: active) {
  .btn, button { border: 1px solid currentColor; }
  .card, .panel, .modal { border: 1px solid currentColor; }
  :focus-visible { outline: 3px solid currentColor; }
}
```
→ Tailwind: **не поддерживается нативно.** Нужно добавить в `@layer base`:
```css
@media (forced-colors: active) {
  button, [role="button"] { border: 1px solid currentColor; }
  :focus-visible { outline: 3px solid currentColor; }
}
```

### 5.2 `.sr-only` для screen readers
→ Tailwind: `sr-only` ✅

### 5.3 Skip-to-content link
```css
/* PM v2 */
.skip-link { position: absolute; top: 0; left: 0; transform: translateY(-100%); }
.skip-link:focus { transform: translateY(0); }
```
→ Tailwind: компонент `SkipLink.svelte` с:
```svelte
<a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[9999] focus:bg-pm-brand focus:text-pm-white focus:px-4 focus:py-3">
  Skip to content
</a>
```

### 5.4 Reduced motion
Уже в `@layer base` в `app.css`. ✅

### 5.5 Touch target 44px (WCAG 2.5.8)
→ Tailwind: `min-h-[44px] min-w-[44px]` в компонентах кнопок/иконок/табов.

---

## 6. Fluid Typography (без брейкпоинтов)

**PM v2:** `clamp()` для заголовков, подзаголовков, текста секций.

→ Tailwind: **не нужны глобальные классы.** Каждый компонент определяет свой текстовый размер через Tailwind arbitrary values или design tokens:
```svelte
<h1 class="text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[0.9]">
  {title}
</h1>
```

Но можно добавить `@theme` токены для типографики:
```css
@theme {
  --text-hero: clamp(2.5rem, 6vw, 4.5rem);
  --text-section-title: clamp(1.75rem, 4vw, 2.5rem);
}
```
→ Использовать как `text-hero`, `text-section-title`.

---

## 7. Print Styles

```css
/* PM v2 */
@media print { .no-print { display: none; } }
```
→ Tailwind: `print:hidden` ✅

---

## 8. Container Queries

```css
/* PM v2 */
@container (min-width: 500px) { .cq-grid-2 { grid-template-columns: repeat(2, 1fr); } }
```
→ Tailwind v4: `@container` в родителе + `@[500px]:grid-cols-2` в потомке. Компонент-специфично.

---

## 9. Scroll Snap

```css
/* PM v2 */
.scroll-x { scroll-snap-type: x mandatory; }
```
→ Tailwind: `snap-x snap-mandatory` ✅

---

## 10. Custom Scrollbars

**PM v2:** 161 строка кастомных скроллбаров (webkit + стандарт).

→ Tailwind: плагин `tailwind-scrollbar` + кастомный CSS в `@layer base`:
```css
@layer base {
  * {
    scrollbar-width: thin;
    scrollbar-color: color-mix(in oklch, var(--color-pm-text) 20%, transparent) transparent;
  }
}
```

---

## 11. Glasmorphism / Frosted Glass

**PM v2:**
```css
--surface-frosted-backdrop: blur(16px) saturate(1.06);
```
→ Tailwind: `backdrop-blur-[16px] backdrop-saturate-[1.06]`. Уже определены как CSS-переменные в `@layer base`.

---

## 12. Ориентация устройства

```css
/* PM v2 */
@media (orientation: portrait) { .stack-portrait { flex-direction: column; } }
```
→ Tailwind: `portrait:flex-col` ✅

---

## Итого: что остаётся в `app.css`, что уходит в компоненты, что удаляется

### В `app.css @layer base` (глобально):
- `* { scrollbar-width: thin; scrollbar-color: ... }` — кастомный скроллбар
- `input[type="search"]::-webkit-search-*` — Safari нормализация
- `input[type="date"]::-webkit-calendar-picker-indicator` — date picker стили
- `@media (forced-colors: active) { ... }` — Windows High Contrast
- `:lang(he) { --font-brand-primary: 'Heebo' }` — шрифт для Hebrew
- `@custom-variant header (@media (min-width: 1120px))` — header breakpoint
- `--breakpoint-header: 1120px` в `@theme`

### В компонентах (Tailwind-утилиты):
- **RTL логические отступы/позиционирование** → `me-*`, `ms-*`, `start-*`, `end-*`
- **Fluid типографика** → `text-[clamp(...)]` или `text-hero` токен
- **Safe area** → `pt-safe`, `pb-safe` (через плагин или `@layer utilities`)
- **Print** → `print:hidden`
- **Container queries** → `@container` + `@[500px]:grid-cols-2`
- **Scroll snap** → `snap-x snap-mandatory`
- **Glassmorphism** → `backdrop-blur-[16px] backdrop-saturate-[1.06]`

### УДАЛИТЬ (устарело):
- `vh-fix.client.ts` — не нужно, используем `dvh`
- `color-render-fallback.client.ts` — не нужно (токены предвычислены в hex)
- `startup-preferences.client.ts` — в SvelteKit через `hooks.server.ts`
- `.desktop-only`, `.mobile-only`, `.hide-tablet-up` и т.д. — Tailwind: `lg:hidden`, `sm:flex` и т.д.
- `.grid-desktop-3`, `.grid-desktop-4`, `.grid-tablet-2` — Tailwind: `lg:grid-cols-3`, `xl:grid-cols-4`
- `.scroll-x`, `.scroll-y` — Tailwind: `overflow-x-auto snap-x snap-mandatory`
- `.opacity-50`, `.cursor-pointer` — Tailwind: `opacity-50`, `cursor-pointer`
- `.hover-lift` — Tailwind: `transition-transform hover:-translate-y-0.5 hover:shadow-md`
- `.stack-portrait`, `.hide-landscape` — Tailwind: `portrait:flex-col`, `landscape:hidden`

---

## 13. Browser Hacks — Полный Аудит (2026-07-19)

**Методология:** Сканированы ВСЕ 124 CSS файла PM v2 на vendor prefixes, @supports, env(), browser-specific selectors. Каждый хак проверен через caniuse.com + MDN.

### Легенда
| Символ | Значение |
|--------|----------|
| ❌ Полностью удалить | Autoprefixer/Tailwind покрывает, или deprecated |
| ⚠️ Сохранить в app.css | Autoprefixer не обрабатывает, всё ещё нужен |
| 🆕 Добавить в компонент | Progressive enhancement при миграции секции |

### Vendor Prefixes — Детальный анализ

#### 1. `-webkit-backdrop-filter` — 15 вхождений
**Где:** header glass, mobile-nav, portfolio cards, contact, features, blog, pricing, team, faq, testimonials, focus cards, footer
**Статус:** ❌ Удалить
**Причина:** Autoprefixer в Tailwind pipeline добавляет `-webkit-backdrop-filter` автоматически из `backdrop-blur-[*]`.
**Поддержка:** Safari 9+ с префиксом, Safari 15+ без. Firefox 103+. Chrome 76+. [caniuse](https://caniuse.com/css-backdrop-filter)

#### 2. `-webkit-line-clamp / -webkit-box-orient / display: -webkit-box` — 22 вхождения
**Где:** portfolio-card (4), content-card (3), features (3), blog (4), portfolio-grid (3), admin pages (5)
**Статус:** ❌ Удалить
**Причина:** Tailwind: `line-clamp-2`, `line-clamp-3` — встроенные утилиты.
**Поддержка:** Старый `-webkit-line-clamp`: Chrome 14+, Safari 5+, Firefox 68+. [caniuse](https://caniuse.com/css-line-clamp)

#### 3. `-webkit-overflow-scrolling: touch` — 3 вхождения
**Где:** edge-cases.css, scrollbars.css (.scroll-x, .scroll-y), legal-pages.css
**Статус:** ❌ Удалить
**Причина:** DEPRECATED. iOS 13+ (2019) имеет momentum scrolling по умолчанию. MDN страница удалена — официальное подтверждение deprecated.
**Поддержка:** iOS 13+ не требует.

#### 4. `::-webkit-search-cancel-button` и др. — 4 вхождения
**Где:** ui/forms/inputs.css
**Статус:** ⚠️ Сохранить в `@layer base`
**Причина:** Safari по-прежнему показывает нативные кнопки для `<input type="search">`. Autoprefixer не обрабатывает псевдоэлементы.
**Код:**
```css
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-decoration { -webkit-appearance: none; display: none; }
```

#### 5. `::-webkit-calendar-picker-indicator` — 6 вхождений
**Где:** ui/forms/inputs.css
**Статус:** ⚠️ Сохранить в `@layer base`
**Причина:** Safari и Chrome показывают календарную иконку. Нестандартный псевдоэлемент. Autoprefixer не обрабатывает.
**Код:**
```css
input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; }
```

#### 6. `::-webkit-scrollbar` и связанные — 10 вхождений
**Где:** common/scrollbars.css (весь файл), portfolio-fullscreen (2), accessibility (1)
**Статус:** ⚠️ Сохранить (упрощённая версия в `@layer base`)
**Причина:** Firefox использует `scrollbar-width`/`scrollbar-color` (стандарт с 2023). Chrome/Safari/Edge требуют `::-webkit-scrollbar`. Tailwind-плагин `tailwindcss-scrollbar` может заменить, но необязателен.

#### 7. `-webkit-appearance: none` — 1 вхождение
**Где:** inputs.css (в блоке search-decorations)
**Статус:** ❌ Удалить
**Причина:** Tailwind: `appearance-none` + Autoprefixer.

#### 8. `-webkit-text-size-adjust` + `-moz-text-size-adjust` — 2 вхождения
**Где:** reset.css
**Статус:** ❌ Удалить
**Причина:** Стандарт `text-size-adjust` + Autoprefixer.

#### 9. `-webkit-font-smoothing: antialiased` — 1 вхождение
**Где:** reset.css
**Статус:** ❌ Удалить
**Причина:** Уже есть `@apply antialiased` на `<body>` в app.css. ✅

#### 10. `::-moz-selection` — 1 вхождение
**Где:** reset.css
**Статус:** ❌ Удалить
**Причина:** OBSOLETE. Firefox поддерживает `::selection` с 2018 (v62). [caniuse](https://caniuse.com/?search=::selection)

#### 11. `-webkit-tap-highlight-color: transparent` — 1 вхождение
**Где:** reset.css
**Статус:** ⚠️ Сохранить в `@layer base`
**Причина:** Убирает серую подсветку тапа на iOS Safari и Chrome Android. Нестандартное свойство, Autoprefixer не обрабатывает.

#### 12. `-webkit-fill-available` — 1 вхождение
**Где:** common/edge-cases.css
**Статус:** ⚠️ Сохранить в кастомном utility `.min-h-dvh`
**Причина:** Fallback для `100dvh` на Safari < 15.4. `dvh` поддерживается с Safari 15.4 (2022), Chrome 108 (2022), Firefox 101 (2022). [caniuse](https://caniuse.com/viewport-unit-variants)
**Код:**
```css
.min-h-dvh { min-height: 100vh; min-height: -webkit-fill-available; min-height: 100dvh; }
```

#### 13. `-ms-overflow-style: none` — 1 вхождение
**Где:** common/accessibility.css
**Статус:** ❌ Удалить
**Причина:** Только для IE и Edge Legacy (до Edge 79). Edge Chromium не нуждается. IE не поддерживается (2026).

### `@supports` — 2 вхождения

#### 14. `@supports (corner-shape: superellipse)` — 1 вхождение
**Где:** runtime/section-about.css
**Статус:** 🆕 Добавить в компонент SectionAbout.svelte при миграции
**Причина:** Very new CSS (Chrome 120+, Safari 18+). Progressive enhancement — Apple-style superellipse для изображений.

#### 15. `@supports not (height: 100dvh)` — 1 вхождение
**Где:** common/edge-cases.css
**Статус:** ⚠️ Включено в `.min-h-dvh` utility (см. пункт 12).

### `env()` — 7 вхождений

#### 16. `env(safe-area-inset-*)`
**Где:** edge-cases.css (5), bottom-nav.css (2), page.css (1), admin-header.css (1)
**Статус:** ⚠️ Сохранить как `@layer utilities`
**Поддержка:** Safari 11.1+, Chrome 69+, Firefox 65+. [caniuse](https://caniuse.com/css-env-function)
**Код:**
```css
@layer utilities {
  .safe-area-top { padding-top: env(safe-area-inset-top); }
  .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
}
```

### УДАЛЕНИЕ JavaScript плагинов

| Файл | Причина |
|------|---------|
| `vh-fix.client.ts` | Deprecated. `dvh` поддерживается с 2022. Не портировать. |
| `color-render-fallback.client.ts` | Не нужен. Все токены в `@theme` предвычислены в hex, нет `color-mix()` в рантайме. Не портировать. |
| `startup-preferences.client.ts` | В SvelteKit через `hooks.server.ts` + `+layout.svelte` $effect. |

### ИТОГ: Что добавить в app.css

```css
/* @layer base — browser hacks */
* { -webkit-tap-highlight-color: transparent; }

input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-decoration { -webkit-appearance: none; display: none; }

input[type="date"]::-webkit-calendar-picker-indicator,
input[type="datetime-local"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; }

* { scrollbar-width: thin; scrollbar-color: color-mix(in oklch, var(--color-pm-text) 20%, transparent) transparent; }

/* @layer utilities — кастомные хаки */
.min-h-dvh { min-height: 100vh; min-height: -webkit-fill-available; min-height: 100dvh; }
.safe-area-top { padding-top: env(safe-area-inset-top); }
.safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
```
