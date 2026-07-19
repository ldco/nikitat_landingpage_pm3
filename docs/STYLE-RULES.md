# PM v3 Style Rules — ZERO EXCEPTIONS

**Назначение:** Абсолютные правила стилизации, которые AI-агент НЕ МОЖЕТ нарушать.
**Источник истины:** `src/app.css` → `@theme` блок.
**Проверка:** `grep -r "\[\]" src/lib/components/ src/routes/ --include="*.svelte"` → только CSS-функции, не sizing.

---

## ⛔ FORBIDDEN — Arbitrary Values

**НИКОГДА** не использовать arbitrary values `[...]` для:

```
❌ text-[clamp(1.75rem,4vw,2.5rem)]  → используй text-fluid-3xl
❌ text-[clamp(2.5rem,6vw,4.5rem)]   → используй text-fluid-hero
❌ max-w-[1280px]                     → используй max-w-container
❌ max-w-[62.5rem]                    → используй max-w-content
❌ max-w-[65ch]                       → используй max-w-prose
❌ max-w-[80rem]                      → используй max-w-container
❌ h-[clamp(56px,8vh,72px)]          → используй h-[var(--h-header)]
❌ pt-[calc(clamp(56px,8vh,72px)+3rem)] → используй pt-[var(--pt-section)]
❌ px-[clamp(1rem,3vw,3rem)]         → не нужно, используй style="padding-inline: var(--px-container)"
❌ gap-[1.5rem]                       → используй gap-6
❌ p-[16px]                           → используй p-4
❌ m-[24px]                           → используй m-6
❌ size-[44px]                        → используй size-11
❌ w-[4rem]                           → используй w-16
❌ bg-[#901504]                       → используй bg-pm-brand
❌ text-[#3b0902]                     → используй text-pm-text
```

## ✅ ALLOWED — Only CSS Functions

**МОЖНО** использовать arbitrary values ТОЛЬКО для CSS-функций, которые не имеют Tailwind-утилит:

```
✅ max-w-[min(420px,42vw)]     → сложный calc/min/max, не токен
✅ max-w-[700px]                → уникальные значения (один раз в проекте)
✅ leading-[0.9]                → уникальное line-height для display font
✅ backdrop-blur-[16px]         → CSS-функция, не sizing
✅ shadow-[0_1px_3px_oklch(...)] → сложный box-shadow с oklch (можно заменить на shadow-sm)
✅ grid-cols-[auto_1fr_auto]    → CSS grid template
✅ transition-[height,box-shadow] → CSS transition (свойства, не sizing)
✅ animate-[scale-in_0.2s_ease] → CSS animation shorthand
✅ duration-[400ms]              → animation duration
✅ z-[60]                        → z-index (допустимо, но лучше добавить токен --z-*)
```

---

## ✅ REQUIRED — Decision Process

Когда AI хочет задать размер/отступ/типографику:

### Шаг 1: Ищи Tailwind-утилиту
```svelte
<!-- ✅ ПРАВИЛЬНО -->
<div class="p-4 max-w-[var(--max-w-container)] text-fluid-3xl">
```

### Шаг 2: Ищи @theme токен
```css
/* В @theme определено: */
--text-fluid-3xl: clamp(1.75rem, 1.5rem + 1.875vw, 2.5rem);
```
→ Используй `text-fluid-3xl` в компоненте.

### Шаг 3: Если токена нет — ДОБАВЬ его в @theme
```css
/* НЕ делай: text-[clamp(2rem,3vw,3.5rem)] */
/* СДЕЛАЙ: добавь --text-fluid-4xl-workaround: clamp(2rem, 3vw, 3.5rem) в @theme */
/* И затем: text-fluid-4xl-workaround в компоненте */
```

### Шаг 4: Семантические токены через CSS-переменные
```css
/* Используй var() для значений, которые НЕ нужно генерировать как Tailwind-утилиту: */
style="padding-inline: var(--px-container)"
class="h-[var(--h-header)]"
class="pt-[var(--pt-section)]"
```

---

## 📋 TOKEN CATALOG — Полный список

### Fluid Typography (`text-fluid-*`)
| Токен | Значение | Использование |
|-------|----------|--------------|
| `text-fluid-xs` | clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem) | Очень мелкий текст |
| `text-fluid-sm` | clamp(0.875rem, 0.8rem + 0.35vw, 1rem) | Мелкий текст |
| `text-fluid-base` | clamp(1rem, 0.9rem + 0.5vw, 1.125rem) | Базовый текст |
| `text-fluid-lg` | clamp(1.125rem, 1rem + 0.6vw, 1.25rem) | Крупный текст |
| `text-fluid-xl` | clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem) | Подзаголовки / hero-subtitle |
| `text-fluid-2xl` | clamp(1.5rem, 1.2rem + 1.5vw, 2rem) | Section body text |
| `text-fluid-3xl` | clamp(1.75rem, 1.5rem + 1.875vw, 2.5rem) | Section title (ВСЕ секции) |
| `text-fluid-4xl` | clamp(2.25rem, 1.75rem + 2.5vw, 3.5rem) | Крупные заголовки |
| `text-fluid-5xl` | clamp(3rem, 2rem + 5vw, 5rem) | Очень крупные заголовки |
| `text-fluid-hero` | clamp(2.5rem, 3vw + 1rem, 4.5rem) | ТОЛЬКО hero h1 |

### Semantic Sizing (`--*`)
| Токен | Значение | Использование |
|-------|----------|--------------|
| `--h-header` | clamp(3.5rem, 8vh, 4.5rem) | `h-[var(--h-header)]` |
| `--h-header-scrolled` | clamp(3rem, 6vh, 3.5rem) | `h-[var(--h-header-scrolled)]` |
| `--pt-section` | calc(var(--h-header) + spacing-fluid-2xl) | `pt-[var(--pt-section)]` |
| `--px-container` | clamp(1rem, 3vw, 3rem) | `style="padding-inline: var(--px-container)"` |
| `--max-w-container` | min(80rem, 100%) | `max-w-container` |
| `--max-w-content` | min(62.5rem, 100%) | `max-w-content` (админка) |
| `--max-w-narrow` | min(48rem, 100%) | `max-w-narrow` (FAQ, testimonials) |
| `--max-w-prose` | min(65ch, 100%) | `max-w-prose` (blog, legal) |

---

## 🔍 SELF-CHECK — Перед каждым коммитом

```bash
# 1. Проверка на ЗАПРЕЩЁННЫЕ arbitrary values:
grep -r "text-\[" src/lib/components/ src/routes/ --include="*.svelte"
# ДОЛЖНО БЫТЬ: 0 результатов (или только text-[9px] для бейджей)

grep -r "max-w-\[" src/lib/components/ src/routes/ --include="*.svelte" | grep -v "max-w-\[min\|max-w-\[300px\]\|max-w-\[var"
# ДОЛЖНО БЫТЬ: 0 результатов (или только max-w-[min(...)] для логотипа)

grep -r "h-\[clamp\|pt-\[calc\|px-\[clamp" src/lib/components/ src/routes/ --include="*.svelte"
# ДОЛЖНО БЫТЬ: 0 результатов

# 2. Typecheck:
npm run check
# ДОЛЖНО БЫТЬ: 0 errors
```

---

## 📐 COMPONENT PATTERN — Обязательный шаблон

Каждый компонент PM v3 следует этому шаблону:

```svelte
<script lang="ts">
  import { clsx } from 'clsx'
  import { twMerge } from 'tailwind-merge'
  import { FEATURES, MODULES } from '$lib/config/site'

  let {
    class: className = ''
  }: {
    class?: string
  } = $props()

  const isContained = $derived(FEATURES.bodyWidthMode === 'contained')
</script>

<section class={twMerge(clsx(
  'flex flex-col items-center',
  'pt-[var(--pt-section)] pb-16',
  className
))}>
  <div class={clsx('w-full mx-auto', isContained && 'max-w-container')} style="padding-inline: var(--px-container);">
    <h2 class="text-fluid-3xl font-bold leading-tight mb-8 text-center">
      Заголовок
    </h2>
    <!-- Content -->
  </div>
</section>
```

**ЗАПРЕЩЕНО:**
- `<style>` блоки
- Глобальные CSS-классы (`.btn`, `.card`, `.section`)
- `text-[...]`, `max-w-[...]` (кроме разрешённых исключений)
- `pt-[calc(...)]`, `h-[clamp(...)]`
- Хардкод значений в компонентах

---

## 📚 Связанные документы

| Документ | О чём |
|----------|-------|
| `CSS-ARCHITECTURE.md` | Где что лежит (app.css vs компоненты) |
| `CSS-FULL-AUDIT.md` | 116 CSS файлов PM v2 — полный аудит |
| `CSS-EDGECASES.md` | Browser hacks, RTL, safe-area |
| `PLAN.md` | Актуальный статус миграции |
| `README.md` | Быстрый старт |
