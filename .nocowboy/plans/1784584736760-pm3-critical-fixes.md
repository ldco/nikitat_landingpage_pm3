# Critical Fixes — PM v3 Behavior Parity

**Проблемы (по порядку):**

---

## 1. Переключение языков не работает

**Корень:** PM v3 использует `setLanguageTag()` из Paraglide. PM v2 использует `setLocale()` из Nuxt i18n, который обновляет URL. Paraglide `setLanguageTag()` меняет runtime-тег, но НЕ обновляет URL и не триггерит re-render компонентов.

**Фикс:**
- Заменить `setLanguageTag(code)` в LangSwitcher на навигацию через `goto()` с новым locale в URL
- Paraglide сам перехватит URL и обновит язык
- Тогда переключение языка будет работать как полноценная навигация (как в PM v2)

```ts
// ВМЕСТО:
setLanguageTag(code)
// ДЕЛАТЬ КАК PM v2:
const resolved = i18n.resolveRoute($page.url.pathname, code as Locale)
goto(resolved)
```

---

## 2. Логотип в хедере — верстка слетела

**Корень:** PM v2 использует CSS класс `.header-logo` с `position: absolute; left: 50%; transform: translateX(-50%)` на мобильных. PM v3 использует Tailwind `absolute start-1/2 -translate-x-1/2` — это эквивалент. Но проблема в том, что родительский контейнер логотипа в PM v2 имеет специфическую структуру: `.header-inner` использует CSS классы для сетки, а в PM v3 это Tailwind `flex header:grid`.

**Нужно проверить:**
- Сравнить HTML-структуру PM v2 TheHeader.vue (строки 74-109) с PM v3 TheHeader.svelte (строки 117-148)
- Убедиться что логотип имеет правильные размеры: PM v2 использует `--logo-desktop-height`, `--logo-mobile-height`, `--logo-desktop-max-width`
- PM v3 должен использовать те же CSS-переменные
- Проверить что класс `header-logo` присутствует (или его Tailwind-эквивалент)

---

## 3. Портфолио дублируется (страница + секция)

**Корень:** `HOMEPAGE_SECTIONS` в `site.ts` содержит portfolio с `enabled: true` и `renderMode: 'page'`. Homepage (`+page.svelte`) рендерит ВСЕ enabled секции. Portfolio отображается и на homepage (как секция) и на отдельной странице `/portfolio`.

**Фикс:** Изменить `enabled: false` для portfolio в HOMEPAGE_SECTIONS. Или модифицировать SectionRenderer чтобы он пропускал секции с `renderMode: 'page'`.

```ts
// site.ts: portfolio в homepageSections должен быть disabled
{ id: 'portfolio', component: 'SectionPortfolio', renderMode: 'page', enabled: false },
```

---

## 4. Анимация переключения темы — неправильная

**Корень:** В PM v3 отсутствуют CSS-правила из PM v2 `animations/transitions.css`:

1. **View Transitions CSS** (строки 30-45) — отключает дефолтный crossfade:
```css
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}
::view-transition-old(root) { z-index: 1; }
::view-transition-new(root) { z-index: 9999; }
```

2. **Theme icon transition** (строки 54-75) — анимация иконки солнце/луна:
```css
.theme-icon-enter-active { transition: all var(--transition-normal) var(--ease-spring); }
.theme-icon-leave-active { transition: all var(--transition-fast) var(--ease-in); }
.theme-icon-enter-from { opacity: 0; transform: scale(0.5) rotate(-90deg); }
.theme-icon-leave-to { opacity: 0; transform: scale(0.5) rotate(90deg); }
```

PM v3 использует Svelte `transition:fade` вместо этих CSS-классов. Нужно заменить на CSS-классы как в PM v2.

**Фикс:**
1. Добавить View Transitions CSS из PM v2 в `app.css`
2. Заменить Svelte `transition:fade` на CSS-классы `.theme-icon-*` в ThemeToggle  
3. Убрать `{#key isDark}` — он не нужен при CSS-анимации

---

## 5. Меню языков в мобильном — неправильные стили

**Корень:** PM v2 использует CSS классы `.mobile-nav-settings` с:
- `margin-block-start: auto` (прижать к низу)
- `padding: var(--space-4)`
- `border-block-start: 1px solid var(--l-border)`
- `display: flex; align-items: center; gap: var(--space-3)`

PM v3 использует Tailwind: `mt-auto p-4 border-t border-pm-border flex items-center gap-3`. Это должно быть эквивалентно. Но проблема может быть в том, что HeaderActions внутри мобильного меню использует неправильный `langDirection`.

**Нужно сверить:** 
- PM v2 mobile-nav.css → `.mobile-nav-settings .header-actions`
- PM v3 → классы HeaderActions внутри мобильного меню

---

## 6. Не перенесены все ассеты

**Текущее состояние:**
- `public/logos/`: 8 файлов в PM v2, 8 файлов в PM v3 ✅
- `public/favicon/`: есть в обеих версиях
- `public/uploads/`: проверить

**Проверить:**
- `public/uploads/portfolios/` — изображения портфолио (69 PNG из PM v2)
- `public/favicon/` — все версии фавиконок
- `public/puppetmaster/` — контент
- Сравнить контрольной суммой все файлы

---

## 7. Типографика и цвета — должны быть в конфиге

**Текущее состояние:**
- Цвета: 4 основных цвета (pm-brand, pm-black, pm-white, pm-accent) хардкодом в `app.css`
- PM config (`puppet-master.config.ts`) уже содержит `colors: { brand: '#901504', ... }`
- Шрифты: импортируются через @fontsource в app.css, но НЕ привязаны к конфигу

**Фикс:**
1. Прочитать цвета из PM config в app.css (через CSS переменные из токенов)
2. Шрифты должны определяться в конфиге: семейство, размеры, жирность
3. Все типографские настройки — в одном месте

---

## Приоритет выполнения

1. **Портфолио дублирование** — 5 минут, очевидный фикс
2. **Анимация темы** — добавить CSS из PM v2 transitions.css  
3. **Logo верстка** — сравнить структуру с PM v2, поправить
4. **Переключение языков** — заменить setLanguageTag на goto через i18n.resolveRoute
5. **Мобильное меню языков** — сверить стили
6. **Ассеты** — скопировать недостающие
7. **Типографика/цвета** — архитектурное изменение
