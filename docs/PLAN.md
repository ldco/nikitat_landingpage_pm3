# Полный План Миграции PM v2 → PM v3

**Состояние:** Аудит завершён. 277+ файлов просканировано. Определены ВСЕ разрывы.

**Дата:** 2026-07-19  
**Цель:** Полное визуальное и функциональное соответствие PM v2 (Nuxt) → PM v3 (SvelteKit).

---

## Текущее состояние (кратко)

| Аспект | Статус | Детали |
|--------|--------|--------|
| Схема БД (31 таблица) | ✅ 1:1 | Идентична PM v2, включая translation tables |
| Компоненты (21+6+8+13) | ⚠️ Скелеты | Структура есть, Tailwind стили — общие, не PM v2 |
| Роуты (public + admin + API) | ✅ Есть | 15 public API, 27 admin API, 17 admin страниц |
| CSS (app.css 579 строк) | ⚠️ Частично | Токены FABRICA22, гамбургеры, keyframes. НЕТ PM v2 вёрстки |
| i18n (Paraglide) | ✅ 364 ключа | UI строки. Контент — в БД |
| Содержимое БД | ❌ Пусто | 20 content-таблиц пусты |
| Админ CRUD | ❌ Read-only | Таблицы рендерятся, но Create/Edit/Delete нет |
| Деплой (Ansible) | ⚠️ 12 NUXT_BUILD_* | Нужно переименовать в BUILD_* |
| Жёсткий текст | ⚠️ 3 места | TOTP issuer, SVG логотип, seed emails |
| GSAP анимации | ❌ Отсутствуют | Hero intro, HeroAnimatedLogo |
| Scrollytelling | ❌ Отсутствует | Scene progress, parallax |
| Line-break алгоритм | ❌ Отсутствует | Title breaking в SectionHero |
| RTL (Hebrew) | ❌ Не реализован | |
| Тесты | ❌ Нет | Ни одного теста |

**Вывод:** Инфраструктура кода написана, но визуально и функционально это НЕ PM v2. Это скелет с generic-Tailwind стилями.

---

## ФАЗА 0: CSS ФУНДАМЕНТ (app.css)

**Цель:** Завершить `app.css` — добавить ТОЛЬКО foundation: токены, reset, :root-переменные, keyframes.

**ВАЖНО:** В `app.css` НЕ добавляем UI-классы (`.btn`, `.card`, `.section-hero`).
Вся стилизация компонентов — через Tailwind внутри `.svelte`-файлов.
Подробнее: `docs/CSS-ARCHITECTURE.md`.

**Источник:** `../app-nuxt/app/assets/css/` (124 файла)

### Шаг 0.1: :root-переменные в @layer base
Файл: `src/app.css`

Добавить CSS-переменные (НЕ в @theme, а в :root внутри @layer base):

```
--space-0..32           (spacing scale 4px base)
--gap-0..xl             (gap tokens)
--header-height          clamp(56px, 8vh, 72px)
--header-scrolled-*     (высота, bg, shadow, backdrop при скролле)
--header-column-gap     (зазор между колонками header)
--logo-desktop-*, logo-mobile-*, logo-scrolled-*
--footer-padding-block, --footer-link-height
--content-*             (prose, narrow, default, wide)
--container-padding     clamp(1rem, 3vw, 3rem)
--icon-*                (16px..32px)
--touch-target          (44px WCAG)
--surface-frosted-*     (glassmorphism)
```

Проверка: `npm run check` → 0 errors.

### Шаг 0.2: Reset в @layer base
Файл: `src/app.css`

Добавить из PM v2 `reset.css`:

```
- box-sizing: border-box
- Убрать margin/padding у * (сброс)
- ul, ol → list-style: none
- img, picture, video, canvas, svg → display: block, max-width: 100%
- input, button, textarea, select → inherit font
- button → background: none, border: none
- ::selection → pm-brand-subtle bg
- @media (prefers-reduced-motion) → отключить анимации
- -webkit-tap-highlight-color: transparent
```

Проверка: `npm run check` → 0 errors.

### Шаг 0.3: Keyframe-анимации
Файл: `src/app.css`

Уже есть:
```
@keyframes fade-in, fade-in-up, fade-in-down, scale-in, slide-up, slide-down
@keyframes pulse-soft, spin-slow, formStatusSlideIn, formStatusSpin
```

Проверка: `npm run check` → 0 errors.

### Шаг 0.4: Гамбургер-анимации (единственный @layer components)
Файл: `src/app.css`

Уже есть: 11 типов (spin, elastic, slider, spring, squeeze, arrow, arrow-right, collapse, minus, turn, cross).

Это единственное исключение — сложные псевдоэлементы, невыразимые Tailwind.

Проверка: `npm run check` → 0 errors.

---

## ФАЗА 1: ВИЗУАЛЬНАЯ ИДЕНТИЧНОСТЬ КОМПОНЕНТОВ

**Цель:** Каждый компонент PM v3 должен ВИЗУАЛЬНО совпадать с PM v2.

**Методология:** Для каждого компонента:
1. Открыть PM v2 исходник (Vue компонент + его CSS)
2. Понять структуру классов и расположение
3. Перевести в Tailwind утилиты, используя PM design-токены
4. Проверить визуально (dev server v2 vs v3)

### Шаг 1.1: TheHeader (из skeleton/header.css, 515 строк)
**Файл:** `src/lib/components/complex/TheHeader.svelte`

**Источник:** `../app-nuxt/app/components/organisms/TheHeader.vue`  
**CSS:** `../app-nuxt/app/assets/css/skeleton/header.css` (515 строк)

**Что должно быть:**
```css
.header {
  position: fixed; top: 0; left: 0; right: 0;
  z-index: var(--z-fixed);
  background: var(--pm-bg);
  border-bottom: 1px solid var(--pm-border);
  height: clamp(56px, 8vh, 72px); /* --header-height */
  transition: background 0.3s, box-shadow 0.3s, backdrop-filter 0.3s;
}

/* Scroll glass: когда прокручено > 10px */
.header--scrolled {
  background: oklch(... с opacity 0.85); /* glassmorphism */
  backdrop-filter: blur(16px);
  box-shadow: 0 1px 3px oklch(0% 0 0 / 8%);
}

.header-inner {
  display: grid;
  grid-template-columns: auto 1fr auto; /* 3 колонки: logo | nav | actions */
  align-items: center;
  height: 100%;
  padding: 0 max(1.5rem, calc((100vw - 1280px) / 2));
  max-width: none; /* full-width header */
}

/* Logo в левой колонке */
.header-logo { grid-column: 1; }

/* Nav в центральной колонке */
.header-nav { grid-column: 2; justify-self: center; }

/* Actions (theme, lang, hamburger) в правой */
.header-actions { grid-column: 3; justify-self: end; display: flex; gap: 0.5rem; }
```

**Мобильная версия (<768px):**
```
.header-inner {
  grid-template-columns: 1fr auto; /* logo | hamburger */
  /* nav и actions скрыты, hamburger тоggle показывает mobile-nav overlay */
}
```

**Верификация:** 
1. Запустить `npm run dev` (v3) и `npm run dev` (v2)
2. Сравнить header на десктопе и мобильном
3. Прокрутить страницу — должен появиться glass-эффект
4. Тёмная тема: цвета должны инвертироваться

### Шаг 1.2: NavLinks + SocialNav (навигация)
**Файлы:**
- `src/lib/components/molecules/NavLinks.svelte`
- `src/lib/components/molecules/SocialNav.svelte`

**Источник:** `../app-nuxt/app/assets/css/skeleton/nav.css` + `social-nav.css`

**Что должно быть:**
```css
.nav-links {
  display: flex;
  gap: clamp(1.5rem, 3vw, 2.5rem); /* --header-column-gap */
  align-items: center;
}

.nav-link {
  position: relative;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--pm-text-secondary);
  transition: color 0.15s;
  padding: 0.25rem 0;
}

.nav-link:hover,
.nav-link--active {
  color: var(--pm-text);
}

/* Underline indicator */
.nav-link--active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--pm-brand);
}
```

**Мобильное меню:** Overlay с анимацией (slide/fade), закрывается по клику на ссылку.

### Шаг 1.3: TheFooter (из skeleton/footer.css, 478 строк)
**Файл:** `src/lib/components/complex/TheFooter.svelte`

**Источник:** `../app-nuxt/app/components/organisms/TheFooter.vue`  
**CSS:** `../app-nuxt/app/assets/css/skeleton/footer.css` (478 строк)

**Что должно быть:**
```css
.footer {
  background: var(--pm-surface); /* frosted glass */
  backdrop-filter: blur(16px);
  padding-block: var(--space-8) var(--space-4);
}

/* Основной grid: brand (слева) | actions (справа) */
.footer-grid {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: var(--gap-lg);
  padding: 0 max(1.5rem, calc((100vw - 1280px) / 2));
}

/* Legal bar (отдельная полоса внизу) */
.footer-legal {
  border-top: 1px solid var(--pm-border);
  padding-top: var(--space-4);
  margin-top: var(--space-4);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--gap-sm);
  font-size: var(--text-sm);
  color: var(--pm-text-muted);
}
```

**Верификация:** Сравнить с PM v2 футером. Grid должен быть идентичен.

### Шаг 1.4: SectionHero (из layout/sections.css 485 строк + hero-parallax.css)
**Файл:** `src/lib/components/sections/SectionHero.svelte`

**Источник:** `../app-nuxt/app/components/sections/SectionHero.vue` (316 строк)  
**CSS:** `layout/sections.css` + `runtime/hero-parallax.css`

**КРИТИЧЕСКИЙ КОМПОНЕНТ.** Текущая реализация (71 строка) — это заглушка с фейковым SVG. Нужно полностью переписать.

**Что должно быть (визуальная структура):**

```
<section id="home" class="section section-fullscreen section-hero">
  <!-- Десктоп: 2-колоночный grid -->
  <!-- Левая колонка: текст -->
  <div class="container">
    <h1 class="hero-title">
      <!-- Строки заголовка с brand-сегментами -->
      <span class="hero-title__line">
        <span class="hero-title__plain">Первая строка</span>
      </span>
      <span class="hero-title__line hero-title__line--brand">
        <span class="hero-title__plain">Акцентная строка</span>
      </span>
    </h1>
    
    <p class="hero-subtitle">{subtitle}</p>
    
    <div class="hero-actions">
      <CtaButton variant="primary" size="lg">Контакты</CtaButton>
      <CtaButton variant="outline" size="lg">Портфолио</CtaButton>
    </div>
  </div>
  
  <!-- Правая колонка: логотип (если logoSrc) -->
  <div class="hero-logo" use:gsapIntro>
    <img src={logoSrc} alt="" class="hero-logo__img" />
  </div>
</section>
```

**Классы (добавить в @layer components в app.css):**
```css
.section-hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  min-height: 100dvh;
  padding-top: var(--header-height);
  padding-inline: max(1.5rem, calc((100vw - 1280px) / 2));
  gap: clamp(2rem, 4vw, 4rem);
}

/* Мобильная: одна колонка */
@media (max-width: 768px) {
  .section-hero {
    grid-template-columns: 1fr;
    text-align: center;
  }
}

.hero-logo {
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-logo__img {
  max-width: min(420px, 42vw);
  height: auto;
}

/* RTL: сдвиг раскладки */
.section-hero--right {
  direction: rtl;
}
```

**Верификация:** 
1. Сравнить hero на v2 и v3
2. Заголовок должен иметь акцентные (brand-color) строки после " — "
3. Логотип должен рендериться из `logoSrc` пропа (или из siteConfig)
4. Мобильная версия: одна колонка

### Шаг 1.5–1.14: Остальные секции (12 штук)
Тот же подход для каждой секции: открыть PM v2 компонент, прочитать его CSS, перевести в Tailwind с PM-токенами.

**Приоритет (по важности):**
1. SectionAbout — image+text сетка
2. SectionFocus — карточки фокуса
3. SectionPortfolio — grid с фильтрами + Lightbox
4. SectionContact — форма с consent (152-ФЗ)
5. SectionFeatures — карточки функций
6. SectionFaq — аккордеон
7. SectionTeam — карточки команды с hover-фото
8. SectionTestimonials — карусель отзывов
9. SectionClients — логотипы клиентов
10. SectionPricing — тарифы
11. SectionBlog — карточки постов
12. SectionF22 — (специфичная для этого сайта)

---

## ФАЗА 2: ФУНКЦИОНАЛЬНЫЙ ПАРИТЕТ

**Цель:** Портировать JS/TS логику из PM v2, которой нет в PM v3.

### Шаг 2.1: Line-break алгоритм для SectionHero
**Новый файл:** `src/lib/utils/titleBreaker.ts`

Портировать из `SectionHero.vue` (строки 31-185):
- `RUSSIAN_GLUE_WORDS` + `ENGLISH_GLUE_WORDS`
- `normalizeGlueToken()`, `getGlueWords()`, `buildWordGroups()`
- `splitWordGroupsIntoLines()`, `splitSegmentIntoLines()`
- `buildHeroTitleSegments()`

Экспортировать функцию:
```ts
export function breakHeroTitle(title: string, locale: string): HeroTextSegment[]
```

**Верификация:** Юнит-тест с русским и английским текстом.

### Шаг 2.2: GSAP intro анимация для SectionHero
**Новый файл:** `src/lib/actions/gsapIntro.ts`

Портировать из `SectionHero.vue` (строки 195-252):
- Svelte action `use:gsapIntro`
- Logo zoom-out (scale fitScale→1, 0.15s, power4.in)
- Screen shake (14 keyframes x/y, 0.6s, power2.out)
- `prefers-reduced-motion` проверка
- `window.scrollY > 10` проверка (если уже прокручено — пропускаем)

### Шаг 2.3: GSAP HeroAnimatedLogo
**Новый файл:** `src/lib/actions/heroTyping.ts`

Портировать из `HeroAnimatedLogo.vue`:
- TextPlugin typing effect
- Анимированные грани логотипа (scale 0→1, rotation 25→0)
- Svelte action `use:heroTyping`

### Шаг 2.4: Scrollytelling
**Новый файл:** `src/lib/actions/scrollytelling.ts`

Портировать из `useScrollytelling.ts`:
- `--pm-scene-progress` CSS variable (0→1)
- `data-scrolly-scene`, `data-parallax`, `data-parallax-speed` атрибуты
- `requestAnimationFrame` throttling
- `ResizeObserver` + `MutationObserver`
- Reduced-motion режим

### Шаг 2.5: ScrollSpy (для onepager навигации)
**Файл:** `src/lib/actions/scrollSpy.ts` (уже существует, проверить)

Портировать из `useScrollSpy.ts`:
- IntersectionObserver-free
- `requestAnimationFrame` throttling
- Подсветка активной секции в навигации
- Авто-обновление при смене маршрута

### Шаг 2.6: ScrollHeader (sticky header show/hide)
**Новый файл:** `src/lib/actions/scrollHeader.ts`

Портировать из `useScrollHeader.ts`:
- Добавление класса `.header--scrolled` при scroll > 10px
- Опционально: скрытие header при scroll вниз, показ при scroll вверх
- Настройка через `siteConfig.features`

### Шаг 2.7: Reveal (появление элементов при скролле)
**Новый файл:** `src/lib/actions/reveal.ts`

Портировать из `useReveal.ts`:
- Svelte action `use:reveal`
- IntersectionObserver-based
- Добавление класса `revealed` при появлении во viewport

### Шаг 2.8: FallingLetters (физика)
**Файл:** `src/lib/components/complex/FallingLetters.svelte` (уже существует, проверить)

Портировать из `FallingLetters.vue`:
- 400 тел (цифры/символы из конфига)
- Эффект Chaos → Order
- Canvas рендеринг
- Svelte action `use:fallingLetters`

### Шаг 2.9: CookieConsent (152-ФЗ)
**Файл:** `src/lib/components/complex/CookieConsent.svelte`

Доработать:
- 3 состояния: accepted | declined | null (unset)
- localStorage + cookie (дуальная запись)
- Preference cookies: pm-color-mode, pm-theme-explicit, pm-locale-explicit
- Max age: 365 дней
- Учитывать `features.cookies` из конфига

### Шаг 2.10: RTL поддержка
- Добавить `dir="rtl"` на `<html>` для Hebrew
- Проверить все компоненты с RTL-специфичными стилями
- SectionHero: `section-hero--right` для RTL
- TheHeader, TheFooter: flex/grid direction

---

## ФАЗА 3: НАПОЛНЕНИЕ БАЗЫ ДАННЫХ

**Цель:** Заполнить все 20 content-таблиц реальными данными из PM v2.

### Шаг 3.1: Анализ источников данных
**Источники в PM v2:**
1. `../app-nuxt/server/database/seed.ts` (593 строки) — features, faq, pricing, team, testimonials, clients
2. `../app-nuxt/portfolio-parsed.json` — портфолио
3. `../app-nuxt/server/database/seed-portfolio.ts` — портфолио в БД
4. `../app-nuxt/server/database/seed-gallery.ts` — изображения галереи
5. `../app-nuxt/server/database/seed-content-translations.ts` — контентные переводы

### Шаг 3.2: Mapping старых данных в новые translation tables
**КЛЮЧЕВОЕ ОТЛИЧИЕ:** PM v2 хранит ВСЕ переводы в общей таблице `translations` с ключами типа `feature.1.title`. PM v3 имеет ОТДЕЛЬНЫЕ translation tables:
- `featureTranslations` (featureId + locale)
- `faqItemTranslations` (faqItemId + locale)
- `teamMemberTranslations` (memberId + locale)
- `testimonialTranslations` (testimonialId + locale)
- `clientTranslations` (clientId + locale)
- `pricingTierTranslations` (tierId + locale)
- `pricingFeatureTranslations` (featureId + locale)
- `blogCategoryTranslations` (categoryId + locale)
- `blogPostTranslations` (postId + locale)

**Действие:** Написать скрипт (или функцию в seed.ts), который:
1. Читает старые данные из PM v2 seed
2. Вставляет entity в основную таблицу (features, faqItems, etc.)
3. Вставляет translations в соответствующую translation table
4. Маппит старые translation keys в новые (locale-специфичные поля)

### Шаг 3.3: Content seed для ВСЕХ модулей
**Файл для обновления:** `src/lib/server/db/seed.ts`

Добавить seeding для (в порядке приоритета):
```
1. features      → features + featureTranslations
2. faqItems      → faqItems + faqItemTranslations  
3. portfolios    → portfolios + portfolioItems (+ metadata)
4. teamMembers   → teamMembers + teamMemberTranslations
5. testimonials  → testimonials + testimonialTranslations
6. clients       → clients + clientTranslations
7. pricingTiers  → pricingTiers + pricingFeatures + translations
8. blogCategories → blogCategories + translations
9. blogPosts     → blogPosts + blogPostTranslations
10. contactSubmissions (несколько тестовых)
```

**Верификация:** `npm run db:seed` → все таблицы имеют записи. `npm run dev` → все секции отображают контент.

---

## ФАЗА 4: ADMIN CRUD

**Цель:** Добавить Create/Edit/Delete для всех admin-страниц.

### Шаг 4.1: Shared admin компоненты
**Новые файлы:**
```
src/lib/components/atoms/AdminModal.svelte      (модальное окно)
src/lib/components/atoms/AdminForm.svelte       (форма)
src/lib/components/atoms/AdminLanguageTabs.svelte (табы локалей)
src/lib/components/atoms/AdminUpload.svelte     (загрузка изображений)
src/lib/components/atoms/AdminDeleteConfirm.svelte (подтверждение удаления)
```

### Шаг 4.2: CRUD для каждой admin-страницы
Приоритет:
1. users (+roles) — system modules
2. settings — system config
3. translations — редактирование переводов
4. faq, features — простые модули контента
5. team, testimonials, clients — модули с изображениями
6. pricing — сложный модуль (tiers + features)
7. portfolios — сложный модуль (галерея + case studies)
8. blog — сложный модуль (посты + категории + теги + медиа)
9. contacts — только просмотр (read-only)

**Паттерн для каждой страницы:**
1. Открыть PM v2 admin-страницу (17 файлов в `../app-nuxt/app/pages/admin/`)
2. Портировать структуру модального окна и формы
3. Использовать shared admin компоненты
4. Подключить API endpoints (POST/PUT/DELETE в `src/routes/api/admin/`)

---

## ФАЗА 5: ДЕПЛОЙ И ИНФРАСТРУКТУРА

### Шаг 5.1: Ansible deploy.yml — переименование
**Файл:** `ansible/deploy.yml`

Найти и заменить 12 вхождений:
```
NUXT_BUILD_* → BUILD_*
```

**Верификация:** `grep -n "NUXT_BUILD" ansible/deploy.yml` → no matches.

### Шаг 5.2: Dockerfile — адаптация
**Файл:** `Dockerfile`

Проверить:
- `npm run build` (SvelteKit)
- Выходная директория: `build/` (adapter-node)
- Entrypoint: `node build/index.js`

### Шаг 5.3: deploy.sh — адаптация
**Файл:** `scripts/deploy.sh`

Проверить:
- Build команда: `npm run build`
- Docker build контекст
- Health check URL

### Шаг 5.4: Исправление жёсткого текста
1. `src/lib/server/auth/totp.ts:27` → заменить `'Puppet Master'` на `siteConfig.SEO.title` или env-based
2. `src/lib/components/sections/SectionHero.svelte` → убрать SVG с "PM" текстом, использовать `logoSrc` проп
3. `src/lib/server/db/seed.ts` → emails из env или config

---

## ФАЗА 6: ТЕСТИРОВАНИЕ

### Шаг 6.1: Визуальное сравнение
```bash
# Terminal 1: PM v2
cd ../app-nuxt && npm run dev

# Terminal 2: PM v3  
npm run dev

# Сравнить:
# 1. Homepage: все секции, цвета, шрифты, отступы
# 2. /portfolio: grid, карточки, фильтры, lightbox
# 3. /blog: список постов, карточки
# 4. /legal/privacy-policy: рендеринг markdown
# 5. /admin/login: форма входа
# 6. /ru, /en, /he: переключение языков
```

### Шаг 6.2: Проверка тёмной темы
- Переключить тему на каждой странице
- Проверить цвета, контраст, изображения
- Проверить glass-эффекты в тёмной теме

### Шаг 6.3: Проверка мобильной версии
- 375px (iPhone SE)
- 768px (iPad)
- Гамбургер-меню
- Тач-таргеты (минимум 44px)

### Шаг 6.4: RTL проверка
- Переключить на Hebrew (he)
- Проверить направление текста
- Проверить раскладку header/footer/hero

### Шаг 6.5: E2E тесты (Playwright)
```bash
npm run test:e2e
```

Минимальный набор:
- Homepage загружается без ошибок
- Все секции рендерятся
- Навигация работает
- Admin login > dashboard
- Смена языка

---

## ФАЗА 7: ФИНАЛЬНАЯ ВЕРИФИКАЦИЯ

### Чек-лист приёмки:
- [ ] `npm run check` → 0 errors, 0 warnings
- [ ] `npm run build` → успешно
- [ ] `npm run lint` → без ошибок
- [ ] `npm run test` → все тесты проходят
- [ ] Все 13 секций рендерятся с контентом из БД
- [ ] Все 17 admin-страниц имеют CRUD
- [ ] Тёмная тема работает на всех страницах
- [ ] RTL (Hebrew) работает
- [ ] Мобильная версия работает
- [ ] Визуальное соответствие PM v2 ≥ 95%
- [ ] Ни одного жёстко зашитого текста (все через m.*() или config)
- [ ] Deploy проходит без ошибок

---

## Карта зависимостей между фазами

```
Фаза 0 (CSS Foundation)
  ↓
Фаза 1 (Component Visual Identity) ← зависит от 0
  ↓
Фаза 2 (Feature Parity) ← зависит от 1 (компоненты должны быть готовы)
  ↓
Фаза 3 (DB Content) ← независима, можно параллельно с 1-2
  ↓
Фаза 4 (Admin CRUD) ← зависит от 1-2 (компоненты + API)
  ↓
Фаза 5 (Deploy) ← независима
  ↓
Фаза 6 (Testing) ← зависит от всего
  ↓
Фаза 7 (Final Verification)
```

---

## Примечания по исполнению

1. **НИКАКИХ глобальных CSS классов в компонентах.** Каждый компонент использует Tailwind utility классы, ссылаясь на PM design-токены (`bg-pm-bg`, `text-pm-text`, `border-pm-border`).

2. **class prop + twMerge на КАЖДОМ компоненте.** Правило #1 из AGENTS.md.

3. **После каждых 3-5 компонентов:** запускать `npm run check` и `npm run dev` для визуальной проверки.

4. **НИКОГДА не писать код «на будущее».** Только то, что есть в PM v2.

5. **Все тексты через `m.*()` (Paraglide).** Никакого жёсткого текста в компонентах.
