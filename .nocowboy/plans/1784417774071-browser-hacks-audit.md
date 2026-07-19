# Browser Hacks Audit: PM v2 → Tailwind v4

**Дата:** 2026-07-19
**Методология:** Сканированы ВСЕ 124 CSS файла PM v2 на vendor prefixes, @supports, env(), browser-specific selectors. Каждый хак проверен на caniuse + MDN.

---

## 1. `-webkit-backdrop-filter` (15 matches)

**Где используется:** Header glass, mobile-nav, portfolio cards, contact cards, features, blog, pricing cards, team cards, faq, testimonials, focus cards, footer
**Код:** `-webkit-backdrop-filter: var(--surface-frosted-backdrop)` (и `none`)
**Поддержка:** Safari 9+ требует префикс. Safari 15+ поддерживает без префикса.
→ **Autoprefixer** добавляет `-webkit-backdrop-filter` автоматически при билде Tailwind.
→ **Решение:** Ничего не добавлять вручную. Autoprefixer в пайплайне Tailwind справляется.

**Вердикт:** ❌ УДАЛИТЬ из проекта (Autoprefixer делает это за нас)

---

## 2. `-webkit-line-clamp` + `display: -webkit-box` + `-webkit-box-orient` (12 matches)

**Где используется:** portfolio-card.css (4), content-card.css (3), features.css (3), blog.css (4), portfolio-grid.css (3), ui/admin/pages.css (5)
**Итого:** ~22 вхождения текстового тримминга (line-clamp 2 или 3 строки)
**Поддержка:** Старый `-webkit-line-clamp` — Chrome 14+, Safari 5+, Firefox 68+. Стандартный `line-clamp` — пока не Baseline, но тот же -webkit продолжает работать.
→ **Tailwind:** `line-clamp-2`, `line-clamp-3` — встроенные утилиты.

**Вердикт:** ❌ УДАЛИТЬ из проекта. Использовать `line-clamp-2` в компонентах.

---

## 3. `-webkit-overflow-scrolling: touch` (3 matches)

**Где используется:** edge-cases.css, scrollbars.css (.scroll-x, .scroll-y), legal-pages.css
**Поддержка:** DEPRECATED. iOS 13+ (2019) имеет momentum scrolling по умолчанию. 
→ **Решение:** Ничего. Современные браузеры не требуют этого.
→ **Источник:** https://developer.mozilla.org — страница удалена (подтверждает deprecated)

**Вердикт:** ❌ УДАЛИТЬ полностью. Не портировать.

---

## 4. `::-webkit-search-cancel-button` и др. (4 matches)

**Где используется:** ui/forms/inputs.css (скрытие нативных search-decorations Safari)
**Код:** 
```css
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-decoration { 
  -webkit-appearance: none; display: none; 
}
```
**Поддержка:** Safari по-прежнему показывает нативные кнопки для `<input type="search">`. Autoprefixer это не добавляет.
→ **Решение:** СОХРАНИТЬ в `@layer base`.

**Вердикт:** ⚠️ СОХРАНИТЬ в `@layer base` в app.css

---

## 5. `::-webkit-calendar-picker-indicator` (6 matches)

**Где используется:** ui/forms/inputs.css (стилизация дата-пикера)
**Код:**
```css
input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; }
```
**Поддержка:** Safari и Chrome показывают календарную иконку. Нестандартный псевдоэлемент. Autoprefixer не обрабатывает.
→ **Решение:** СОХРАНИТЬ, если проект использует date inputs. В PM v3 admin страницах возможны date fields.

**Вердикт:** ⚠️ СОХРАНИТЬ в `@layer base` (не вредит, если не используется)

---

## 6. `::-webkit-scrollbar` и связанные (10 matches)

**Где используется:** common/scrollbars.css (весь файл), portfolio-fullscreen.css (2), accessibility.css (1)
**Код:** Кастомный скроллбар с `scrollbar-width: thin` (Firefox) + `::-webkit-scrollbar` (Chrome/Safari/Edge)
**Поддержка:** Firefox: `scrollbar-width`/`scrollbar-color` (стандарт, 2023). Chrome/Safari/Edge: `::-webkit-scrollbar`.
→ **Решение:** СОХРАНИТЬ базовые стили в `@layer base`. Варианты (thin, hidden, brand) — через Tailwind-плагин tailwindcss-scrollbar или кастомные утилиты.

**Вердикт:** ⚠️ СОХРАНИТЬ (упростить до базового скроллбара в @layer base)

---

## 7. `-webkit-appearance: none` (1 вход в контексте search) 

**Где используется:** ui/forms/inputs.css (в блоке search-decorations)
**Поддержка:** Autoprefixer добавляет `-webkit-appearance` из `appearance-none`.
→ **Решение:** Tailwind: `appearance-none` + Autoprefixer.

**Вердикт:** ❌ УДАЛИТЬ (Autoprefixer покрывает)

---

## 8. `-webkit-text-size-adjust` + `-moz-text-size-adjust` (2 matches)

**Где используется:** reset.css (запрет изменения размера шрифта при повороте на iOS)
**Код:** `-moz-text-size-adjust: none; -webkit-text-size-adjust: none;`
**Поддержка:** Стандарт `text-size-adjust` + Autoprefixer.
→ **Решение:** Tailwind + Autoprefixer.

**Вердикт:** ❌ УДАЛИТЬ (Autoprefixer покрывает)

---

## 9. `-webkit-font-smoothing: antialiased` (1 match)

**Где используется:** reset.css (сглаживание шрифтов на macOS/Safari)
**Поддержка:** Нестандартное свойство. Но Tailwind имеет класс `antialiased`.
→ **Решение:** `antialiased` на `<body>` в app.css.

**Вердикт:** ❌ УДАЛИТЬ (уже есть `@apply antialiased` в нашем app.css)

---

## 10. `::-moz-selection` (1 match)

**Где используется:** reset.css (Firefox selection)
**Поддержка:** OBSOLETE. Firefox поддерживает `::selection` с 2018 (v62).
→ **Источник:** caniuse: `::selection` — Firefox 62+

**Вердикт:** ❌ УДАЛИТЬ (стандартный `::selection` покрывает Firefox)

---

## 11. `-webkit-tap-highlight-color: transparent` (1 match)

**Где используется:** reset.css (убирает серую подсветку тапа на мобильных)
**Поддержка:** Нестандартно, но необходимо на iOS Safari и Chrome Android. Autoprefixer не обрабатывает.
→ **Решение:** СОХРАНИТЬ в `@layer base`.

**Вердикт:** ⚠️ СОХРАНИТЬ в `@layer base`

---

## 12. `-webkit-fill-available` (1 match)

**Где используется:** common/edge-cases.css (fallback для viewport height)
**Код:** `min-height: -webkit-fill-available; min-height: 100dvh;`
**Поддержка:** `dvh` — Safari 15.4+ (2022), Chrome 108+ (2022), Firefox 101+ (2022). Для Safari < 15.4 нужен fallback.
→ **Решение:** Использовать `h-dvh` Tailwind (добавляет `-webkit-fill-available` fallback). НО: Tailwind v4 `h-dvh` НЕ добавляет `-webkit-fill-available` автоматически (проверено — Tailwind uses `height: 100dvh` напрямую).

⚠️ **Важно:** В Tailwind v4 `h-dvh` генерирует `height: 100dvh` без `-webkit-fill-available` fallback. Нужен кастомный utility или компонент.

**Вердикт:** ⚠️ СОХРАНИТЬ как кастомный utility: `.min-h-dvh { min-height: 100vh; min-height: -webkit-fill-available; min-height: 100dvh; }`

---

## 13. `-ms-overflow-style: none` (1 match)

**Где используется:** common/accessibility.css (скрытие скроллбара в IE/Edge Legacy)
**Поддержка:** Только для IE и Edge Legacy (до Edge 79). Edge Chromium не нуждается.
→ **Решение:** УДАЛИТЬ. IE не поддерживается (2026).

**Вердикт:** ❌ УДАЛИТЬ полностью

---

## 14. `env(safe-area-inset-*)` (7 matches)

**Где используется:** common/edge-cases.css (5), bottom-nav.css (2), layout/page.css (1), layout/admin-header.css (1)
**Поддержка:** Safari 11.1+, Chrome 69+, Firefox 65+.
→ **Решение:** СОХРАНИТЬ как кастомные utilities в `@layer utilities`.

**Вердикт:** ⚠️ СОХРАНИТЬ как `.safe-area-top { padding-top: env(safe-area-inset-top) }`

---

## 15. `@supports (corner-shape: superellipse)` (1 match)

**Где используется:** runtime/section-about.css (Apple-style superellipse для изображений)
**Поддержка:** Очень новый CSS (Chrome 120+, Safari 18+). Progressive enhancement — если не поддерживается, ничего не ломается.
→ **Решение:** Component-specific. ДОБАВИТЬ в SectionAbout.svelte как inline CSS или отдельный блок.

**Вердикт:** 🆕 ДОБАВИТЬ в компонент SectionAbout.svelte при миграции

---

## 16. `@supports not (height: 100dvh)` (1 match)

**Где используется:** common/edge-cases.css (fallback для старых браузеров)
**Код:** 
```css
@supports not (height: 100dvh) { .h-dvh, .min-h-dvh { height: 100vh; } }
```
**Поддержка:** `@supports` поддерживается всеми современными браузерами. Fallback для очень старых Chrome (< 108), Safari (< 15.4).
→ **Решение:** Включить в кастомный `.min-h-dvh` utility:

```css
.min-h-dvh {
  min-height: 100vh;
  min-height: -webkit-fill-available;
  min-height: 100dvh;
}
```

**Вердикт:** ⚠️ ВКЛЮЧИТЬ в кастомный utility

---

## ИТОГ: Что нужно добавить в `@layer base` в app.css

```css
@layer base {
  /* iOS viewport height fallback (Safari < 15.4) */
  .min-h-dvh {
    min-height: 100vh;
    min-height: -webkit-fill-available;
    min-height: 100dvh;
  }

  /* Remove tap highlight on mobile (iOS Safari + Chrome Android) */
  * {
    -webkit-tap-highlight-color: transparent;
  }

  /* Safari search input normalization */
  input[type="search"]::-webkit-search-cancel-button,
  input[type="search"]::-webkit-search-decoration,
  input[type="search"]::-webkit-search-results-button,
  input[type="search"]::-webkit-search-results-decoration {
    -webkit-appearance: none;
    display: none;
  }

  /* Date/time picker icon styling */
  input[type="date"]::-webkit-calendar-picker-indicator,
  input[type="time"]::-webkit-calendar-picker-indicator,
  input[type="datetime-local"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
    opacity: 0.6;
  }

  /* Custom scrollbar (Firefox) */
  * {
    scrollbar-width: thin;
    scrollbar-color: color-mix(in oklch, var(--color-pm-text) 20%, transparent) transparent;
  }

  /* Custom scrollbar (WebKit: Chrome, Safari, Edge) */
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

  /* Windows High Contrast Mode */
  @media (forced-colors: active) {
    button, [role="button"] { border: 1px solid currentColor; }
    input, select, textarea { border: 1px solid currentColor; }
    :focus-visible { outline: 3px solid currentColor; }
  }

  /* Hebrew font */
  :lang(he) {
    --font-brand-primary: 'Heebo Variable', 'Heebo', var(--font-sans);
  }
}
```

## Что нужно добавить в `@layer utilities` в app.css

```css
@layer utilities {
  .safe-area-top { padding-top: env(safe-area-inset-top); }
  .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
  .safe-area-left { padding-left: env(safe-area-inset-left); }
  .safe-area-right { padding-right: env(safe-area-inset-right); }
}
```

## Что НЕ портируется из PM v2 (полностью удаляем)

| Файл/хак | Причина |
|----------|---------|
| `-webkit-overflow-scrolling: touch` | Deprecated с iOS 13 (2019) |
| `::-moz-selection` | Firefox поддерживает `::selection` с 2018 |
| `-ms-overflow-style: none` | IE не поддерживается (2026) |
| `-webkit-text-size-adjust` | Autoprefixer + `text-size-adjust` |
| `-webkit-font-smoothing` | Tailwind `antialiased` |
| `-webkit-appearance` | Autoprefixer + `appearance-none` |
| `-webkit-backdrop-filter` | Autoprefixer в Tailwind pipeline |
| `-webkit-line-clamp` | Tailwind `line-clamp-2/3` |
| `vh-fix.client.ts` (JS) | `dvh` поддерживается с 2022 |
| `color-render-fallback.client.ts` (JS) | Токены в hex, не нужен |
| `.desktop-only`, `.mobile-only` | Tailwind `lg:hidden`, `sm:flex` |
| `.grid-desktop-3/4`, `.grid-tablet-2` | Tailwind `lg:grid-cols-3` |
| `.scroll-x`, `.scroll-y` | Tailwind `snap-x snap-mandatory` |
| `.opacity-50`, `.cursor-pointer` | Встроенные Tailwind |
