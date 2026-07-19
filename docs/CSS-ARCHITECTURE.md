# CSS Architecture — PM v3 (SvelteKit + Tailwind)

**Одно правило, которое нельзя нарушать:**

> **НИКАКИХ глобальных UI-классов.**
> ВСЯ стилизация — через Tailwind-утилиты ВНУТРИ компонентов.
> `app.css` содержит ТОЛЬКО: токены, сброс, ключевые кадры и хамбургер.

---

## 1. Где что лежит

### `src/app.css` — Только foundation

```
app.css
├── @import "tailwindcss"              ← Tailwind v4 engine
├── @import "@fontsource-*/..."        ← Шрифты (npm-пакеты)
├── @custom-variant dark               ← Классовая тёмная тема (.dark)
├── @theme { }                         ← PM design-токены
│   ├── --color-pm-*                   ← Цвета (brand, bg, text, border)
│   ├── --font-*                       ← Шрифты (Geologica, Inter, Heebo)
│   ├── --text-* / --leading-*         ← Размеры/высоты строк
│   ├── --shadow-* / --radius-*        ← Тени/скругления
│   ├── --z-* / --transition-* / --ease-* ← Z-index / анимации
│   ├── --container-* / --breakpoint-* ← Ширины контейнеров
│   └── --spacing-* / --gap-*          ← Отступы (Tailwind v4 spacing)
├── @layer base { }                    ← HTML-reset
│   ├── :root { --space-*, --gap-*, --header-*, --content-*, --icon-* }
│   │         ← CSS-переменные для компонентов (НЕ токены Tailwind)
│   ├── html, body { }                 ← Базовые стили
│   ├── h1-h6, a, ul, img, input {}   ← Сброс браузерных стилей
│   ├── ::selection {}                 ← Цвет выделения
│   ├── .dark { --color-pm-*:... }     ← Тёмная тема (переопределение токенов)
│   └── @media (prefers-reduced-motion) ← Accessibility
└── @keyframes { }                     ← Анимации (fade-in, scale-in, formStatusSlideIn)
```

**ВАЖНО:** В `@layer base` лежат `:root { --space-*, --gap-*, ... }` — это CSS-переменные,
которые компоненты используют через `var(--gap-md)`. Это НЕ токены Tailwind, а вспомогательные
константы для grid/flex-зазоров, размеров иконок, высоты хедера и т.д.

### `@layer components` — Только то, что НЕЛЬЗЯ выразить Tailwind

В `app.css` ЕДИНСТВЕННЫЙ `@layer components` блок — **хамбургер-анимации**.

```css
@layer components {
  .hamburger { ... }
  .hamburger--spin.active .hamburger__inner { transform: rotate(225deg); }
  .hamburger--elastic.active .hamburger__inner { ... }
  /* ... 11 типов анимаций */
}
```

**Почему хамбургер — исключение:** у него сложные CSS-псевдоэлементы (`::before`/`::after`)
с трансформациями, которые переключаются по классу `.active`. Tailwind-утилитами это
не выразить без тонны `style` атрибутов и JS.

### `src/lib/components/` — ВСЯ стилизация через Tailwind

Каждый компонент сам отвечает за свой внешний вид. Никаких глобальных классов.

```svelte
<!-- Card.svelte — ПРАВИЛЬНО -->
<div class={twMerge(clsx(
  'bg-pm-bg-elevated border border-pm-border rounded-xl overflow-hidden',
  className
))}>
  <div class="px-6 py-4 border-b border-pm-border">
    {@render header?.()}
  </div>
</div>
```

```svelte
<!-- SectionHero.svelte — ПРАВИЛЬНО -->
<section class={twMerge(clsx(
  'relative grid grid-cols-1 md:grid-cols-2 items-center',
  'min-h-screen px-6 md:px-[max(1.5rem,calc((100vw-1280px)/2))]',
  'pt-[clamp(56px,8vh,72px)]',
  className
))}>
  <h1 class="text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[0.9] text-pm-text">
    {title}
  </h1>
</section>
```

---

## 2. Что мы НЕ делаем (отличия от PM v2)

| PM v2 (Nuxt) | PM v3 (SvelteKit) | Почему |
|---|---|---|
| `.btn`, `.btn-primary` в CSS | `bg-pm-brand text-pm-white rounded-md` в компоненте | Компонент сам отвечает за свой вид |
| `.card`, `.card-header`, `.card-body` | `Card.svelte` с Tailwind | Атомарный компонент с `class` prop |
| `.section`, `.section-hero` | Tailwind в SectionHero.svelte | Секция — тоже компонент |
| `.tabs`, `.tab`, `.is-active` | Tailwind в AdminLanguageTabs.svelte | Табы — UI-компонент |
| `.input`, `.form-group`, `.form-label` | Tailwind в FormField.svelte | Поле формы — UI-компонент |
| `.modal`, `.modal-backdrop` | Tailwind в AdminModal.svelte | Модалка — UI-компонент |
| `.data-table` | Tailwind в admin-страницах | Таблица — inline-стилизация |
| `.auth-page`, `.auth-card` | Tailwind в /admin/login/+page.svelte | Страница логина — разовый рендер |
| `.section-grid-*` | `grid grid-cols-1 md:grid-cols-2 gap-8` | Tailwind-сетка прямо в секции |

---

## 3. Как работает `@theme`

Все PM v2 цвета, шрифты, тени и размеры превращены в `@theme` токены.

```css
@theme {
  --color-pm-brand: #901504;         /* → bg-pm-brand, text-pm-brand, border-pm-brand */
  --color-pm-bg: #fbf2e7;            /* → bg-pm-bg */
  --color-pm-text: #3b0902;          /* → text-pm-text */
  --color-pm-border: #e4d6cb;        /* → border-pm-border */
  --font-sans: 'Geologica', ...;      /* → font-sans */
  --text-xs: 0.75rem;                /* → text-xs */
  --shadow-md: 0 4px 6px ...;        /* → shadow-md */
  --radius-xl: 1rem;                 /* → rounded-xl */
}
```

Любой компонент использует эти токены как Tailwind-утилиты:
```
bg-pm-brand        → background: var(--color-pm-brand)
text-pm-text       → color: var(--color-pm-text)
border-pm-border   → border-color: var(--color-pm-border)
rounded-xl         → border-radius: var(--radius-xl)
shadow-md          → box-shadow: var(--shadow-md)
font-sans          → font-family: var(--font-sans)
```

---

## 4. `:root` переменные в `@layer base`

В PM v2 было ~200 CSS-переменных в `:root`. В PM v3 они делятся на две группы:

### А) В `@theme {}` — то, что нужно как Tailwind-утилиты:
```
--color-pm-*     → bg-pm-*, text-pm-*, border-pm-*
--font-*         → font-*
--text-*         → text-*
--leading-*       → leading-*
--shadow-*       → shadow-*
--radius-*       → rounded-*
--z-*            → z-*
--container-*    → container-*
--breakpoint-*   → sm:, md:, lg:
```

### Б) В `@layer base { :root { ... } }` — то, что НЕ нужно как утилита, но нужно компонентам:
```
--space-*        → отступы (var(--space-4) = 1rem)
--gap-*          → зазоры (var(--gap-md) = 1rem)
--header-height  → высота хедера (clamp(56px, 8vh, 72px))
--icon-*         → размеры иконок (var(--icon-sm) = 18px)
--content-*      → ширина контента (var(--content-default) = min(1280px, 100%))
--container-padding → паддинг контейнера
--logo-*         → размеры логотипа
--footer-*       → переменные футера
--surface-*      → стекло/glassmorphism
--touch-target   → 44px (WCAG)
```

Компоненты используют их через `var()`:
```svelte
style="gap: var(--gap-lg);"
```

Но Tailwind v4 позволяет задать spacing в `@theme`:
```css
@theme {
  --spacing-4: 1rem;
}
/* → p-4, gap-4, m-4 — все работают как Tailwind-утилиты */
```

Поэтому часть `--space-*` и `--gap-*` МОЖНО перенести в `@theme` как `--spacing-*`.
Это даст `p-4` = `1rem` = `var(--space-4)`.

---

## 5. Тёмная тема

```css
@layer base {
  .dark {
    --color-pm-bg: #3b0902;
    --color-pm-text: #fbf2e7;
    --color-pm-border: #582c24;
    /* ... и все остальные токены для тёмной темы */
  }
}
```

В компонентах:
```svelte
<div class="bg-pm-bg text-pm-text dark:bg-pm-bg dark:text-pm-text">
```

Tailwind автоматически подхватывает `.dark` через `@custom-variant dark (&:where(.dark, .dark *))`.

---

## 6. `class` prop + twMerge — КАЖДЫЙ компонент

```svelte
<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  let { class: className = '', ...rest }: Props = $props()
</script>

<div class={twMerge(clsx('bg-pm-bg p-4 rounded-xl', className))} {...rest}>
  {@render children?.()}
</div>
```

**ПОЧЕМУ ЭТО ВАЖНО:** AI никогда не создаёт `<div class="wrapper"><Button>...</Button></div>`.
Он просто пишет `<Button class="mt-4 w-full" />` — и это работает.

---

## 7. Исключения из правил

Единственное, что ДОПУСТИМО в `@layer components`:

1. **Хамбургер-анимации** (сложные псевдоэлементы)
2. (Больше ничего. Если что-то не выражается Tailwind — делаем Svelte-компонент)

---

## 8. Резюме для AI-агента

```
ГЛОБАЛЬНЫЕ СТИЛИ:
  @theme {}       — дизайн-токены (цвета, шрифты, тени, размеры)
  @layer base {}  — reset + :root переменные + .dark {}
  @keyframes {}   — анимации
  hamburger {}    — единственный @layer components

СТИЛИ КОМПОНЕНТОВ:
  В каждом .svelte-файле — ТОЛЬКО Tailwind-утилиты
  class prop + twMerge — обязательно
  Никаких глобальных CSS-классов (.btn, .card, .section)
```

Это единственная правда. Если AI делает глобальный CSS-класс — он нарушает архитектуру.
