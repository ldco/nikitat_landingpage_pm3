# Puppet Master Framework — Complete Architecture

## 1. Config-Driven Everything

**Core principle:** `project/puppet-master.config.ts` (1019 строк) — единственный источник правды.

### Что управляется конфигом:

```
sections[]      → навигация, роутинг, рендеринг
modules{}       → pricing, blog, portfolio, faq, features... (каждый с настройками)
features{}      → onepager/SPA, cookie, multiLangs, theme, scrollytelling, PWA...
locales[]       → какие языки, какой по умолчанию
settings[]      → схема настроек (admin panel)
logo{}          → пути, файлы, fallback per language
colors{}        → 4 OKLCH примитива
admin{}         → RBAC per module
storage{}       → local/S3, image/video settings
dataSource{}    → database/api/hybrid
```

## 2. Sections System — Центральная архитектура

```
config.sections = [
  { id: 'home', inNav: true },           ← всегда hero
  { id: 'about', inNav: true },           ← onepager или SPA route
  { id: 'focus', inNav: true },
  { id: 'portfolio', inNav: true, renderMode: 'page' }  ← всегда отдельная страница
]
```

**Onepager mode** (features.onepager: true):
- `/` — index.vue рендерит ВСЕ секции через SectionRenderer
- Навигация — якоря `#about`, `#focus`
- ScrollSpy подсвечивает активную секцию
- portfolio с `renderMode: 'page'` — отдельная страница `/portfolio`

**SPA mode** (features.onepager: false):
- `/` — только hero
- Каждая секция — отдельный роут `/about`, `/focus`
- `[section].vue` динамически рендерит через SectionRenderer

**SectionRenderer (ключевой компонент):**
```vue
<OrganismsSectionRenderer section-id="about" />
// Динамически загружает sections/SectionAbout.vue
```

**Секции самодостаточны:**
```vue
// Каждая секция:
const { t, te } = useI18n()
const title = te('about.title') ? t('about.title') : 'Default'
// Принимает title prop как override
```

## 3. Модульная система (плагины)

Каждый модуль в `config.modules{}`:
```
pricing:     { enabled: true, config: { tiers, showComparison, showToggle } }
blog:        { enabled: true, config: { postsPerPage, showCategories, ... } }
portfolio:   { enabled: true, config: { layout, cardStyle, showFilters, ... } }
faq:         { enabled: true, config: { layout: 'accordion', expandFirst, ... } }
features:    { enabled: true, config: { layout: 'grid', columnsDesktop: 3 } }
contact:     { enabled: false, config: { showMap, formFields, notifications } }
team:        { enabled: false, config: { layout, cardStyle, columnsDesktop } }
testimonials:{ enabled: false, config: { layout, autoPlay, showRating } }
clients:     { enabled: false, config: { layout, grayscale, categories } }
```

Каждый модуль имеет:
- Свои таблицы в БД
- CRUD API endpoints
- Admin panel pages (с RBAC)
- Компоненты отображения

## 4. Навигация (учитывает Onepager/SPA)

```ts
useWebsiteNavigation() → {
  resolveSectionHref('about')
  // onepager: → '#about'
  // SPA:     → '/about'
}
```

## 5. CSS — 5-Layer Pure CSS

```
@layer reset, primitives, semantic, components, utilities

reset/       — CSS reset (Josh Comeau style)
colors/      — 4 OKLCH примитива → auto-calculated tokens → light-dark()
typography/  — Geologica (кириллица) + Heebo (иврит) + Inter (латиница)
layout/      — containers, sections, grid, admin layout
skeleton/    — header + footer + nav + mobile-nav + bottom-nav
animations/  — keyframes, scrollytelling, reveal, transitions
ui/          — buttons, forms, cards, modal, lightbox, toast, etc.
common/      — utilities, spacing, text helpers
runtime/     — per-section CSS (section-about, section-focus, etc.)
```

**Правила:**
- НЕТ scoped styles в компонентах
- НЕТ `<style>` блоков в .vue — ТОЛЬКО `app/assets/css/`
- BEM именование
- CSS custom properties для всего
- `light-dark()` для тем

## 6. i18n — Zero Untranslated Text

- ВЕСЬ текст через `t()`
- Переводы в БД (таблица translations)
- `te(key)` проверяет существование → `t(key)` возвращает перевод
- Fallback: translation → default → key как last resort
- SEO тоже переводится: `seo.homeTitle`, `seo.homeDescription`
- Nav: `nav.about`, `nav.contact`
- Sections: `about.title`, `focus.title`

## 7. Admin Panel

- System modules (всегда): users, roles, translations, settings, legal, health, logs
- Website content modules (по конфигу): sections, blog, portfolio, team, testimonials, faq, clients, pricing, features, contacts
- RBAC per module: master → admin → editor
- Master-only: users, roles, health

## 8. Security

- Session auth (cookie-based)
- CSRF double-submit
- CSP с nonce
- Rate limiting
- Account lockout
- Audit logging
- 2FA (TOTP)
- RBAC

## 9. Entities (проекты)

PM имеет два эксклюзивных режима:
- **Website**: маркетинговый сайт — то что мы мигрируем
- **App**: продуктовый дашборд
- **Admin**: управление (добавляется к любому)

## 10. Logo System

```ts
// 3 фактора определяют логотип: форма × тема × язык
// Форма: horizontal (header) | circle (compact)
// Тема: light (на тёмном фоне) | dark (на светлом фоне)
// Язык: en, ru, he... с fallback chain

config.logo = {
  basePath: '/logos',
  shapes: { horizontal: 'header', circle: 'short' },
  langFallback: { en: 'en', fr: 'en', he: 'en' },
  available: ['horizontal_dark_en', 'horizontal_light_en', ...]
}

// Авто-инверсия:
// dark theme → 'light' logo (белый на тёмном)
// light theme → 'dark' logo (тёмный на светлом)
```

## 11. ScrollSpy — для onepager навигации

```ts
useScrollSpy(sectionIds) → { activeSection, setActiveSection }
// IntersectionObserver-free, прямой DOM measurement
// requestAnimationFrame-based throttling
// Срабатывает на scroll + resize
// Авто-обновление при смене маршрута
```

## 12. Page Transitions (SPA mode only)

```ts
features.pageTransitions:
  // 'fade' | 'slide-left' | 'slide-up' | 'scale'
  // 'zoom' | 'flip' | 'rotate' | 'blur' | 'bounce' | 'swipe' | ''
```

## 13. Footer MadeBy

```ts
config.footerMadeBy = {
  text: 'Made by',
  url: 'https://fabrica22.pro',
  basePath: '/madebylogos',
  langFallback: { en: 'en', fr: 'en', he: 'en' }
  available: ['horizontal_dark_en', ...]
}
```

## 15. Scrollytelling System

Сложная система scroll-driven анимаций. Работает без IntersectionObserver — через прямой DOM measurement.

```ts
useScrollytelling({ enabled, sceneSelector, parallaxSelector })

// Сценарии:
// 1. Scene progress: CSS var --pm-scene-progress (0 → 1)
// 2. Global scroll progress: CSS var --pm-scroll-progress
// 3. Parallax: scroll-driven + pointer-driven (мышь)
// 4. Floating: авто-анимация элементов
// 5. Режим reduced-motion: отключается при prefers-reduced-motion

// HTML: data-атрибуты для элементов
data-scrolly-scene      — отметить сцену
data-parallax             — отметить parallax-элемент
data-parallax-speed       — скорость (0.12)
data-parallax-clamp       — макс смещение (160px)
data-parallax-axis        — 'x' | 'y' | 'both'
data-parallax-pointer     — интенсивность mouse-parallax
data-parallax-pointer-axis
data-parallax-float       — floating animation

// Runtime: requestAnimationFrame-based
// MutationObserver + ResizeObserver для динамических элементов
// WeakMap для кэша прогресса сцен
```

## 16. Animation System

### GSAP (SectionHero + HeroAnimatedLogo)
```ts
// SectionHero: GSAP intro animation
// - Logo zoom-out (scale 5→1) + screen shake
// - Tagline typing with TextPlugin
// - Настройка: gsap.timeline()

// HeroAnimatedLogo:
// - Анимированные грани логотипа (scale 0→1, rotation 25→0)
// - TextPlugin для typing эффекта
// - gsap.registerPlugin(TextPlugin)
```

### Falling Letters (Three.js + Matter.js) — ambient background
```ts
// Matter.js: физический движок
// - 400 тел (цифры/символы)
// - Падают с гравитацией
// - Canvas рендеринг (без Three.js!)
// 
// Эффект: Chaos → Order
// - Хаотичные цифры падают
// - Формируют строки 1 и 0
// - Символы улетают
```

### Scroll Reveal
```vue
// v-reveal directive — IntersectionObserver-based
// Добавляет класс 'revealed' при появлении в viewport
// CSS анимация через transition
```

## 17. Page Transitions

```ts
features.pageTransitions: 'zoom'
// Nuxt pageTransition + layoutTransition

// 12 типов: fade, slide-left, slide-up, scale, zoom, flip,
//           rotate, blur, bounce, swipe, ''

// Только в SPA mode (onepager игнорирует)
```

## 18. Library Migration Map (Nuxt → SvelteKit)

### ОСТАЮТСЯ (framework-agnostic):
```
better-sqlite3     → stays (DB driver)
drizzle-orm        → stays (ORM)
drizzle-kit        → stays (migrations)
zod                → stays (validation)
gsap               → stays (animations)
three              → stays (3D, but not used — Matter.js used instead)
matter-js          → stays (physics for falling letters)
pino               → stays (logging)
nodemailer         → stays (email)
otpauth            → stays (2FA TOTP)
qrcode             → stays (2FA QR)
sanitize-html      → stays (XSS prevention)
sharp              → stays (image processing)
fluent-ffmpeg      → stays (video compression)
ioredis            → stays (distributed cache)
pinia              → REPLACED by Svelte 5 runes ($state/$derived)
```

### УХОДЯТ (Nuxt-specific):
```
nuxt               → @sveltejs/kit (framework)
vue                → svelte (UI lib)
vue-router         → svelte-spa-router or @sveltejs/kit/router
@nuxtjs/i18n       → custom i18n composable
@nuxtjs/critters   → manual critical CSS
@vite-pwa/nuxt     → vite-plugin-pwa
unplugin-icons     → unplugin-icons (stays — Vite plugin)
hamburgers         → custom CSS (tiny)
pinia              → Svelte runes
vue-tsc            → svelte-check
happy-dom          → jsdom
```

### НОВЫЕ (SvelteKit-specific):
```
@sveltejs/kit              → framework
@sveltejs/adapter-node     → SSR/Node adapter
svelte                     → UI library
@sveltejs/vite-plugin-svelte → Vite plugin
tailwindcss                → CSS engine
@tailwindcss/vite          → Tailwind Vite plugin
```

## 19. Admin Panel Architecture

### Admin Pages (17)
```
login.vue          — вход
index.vue          — дашборд (статистика)
users.vue          — CRUD пользователей (master)
roles.vue          — CRUD ролей (master)
translations.vue   — редактор переводов (master/admin/editor)
settings.vue       — настройки (master/admin)
legal.vue          — юр. документы (master/admin)
health.vue         — здоровье системы (master)
portfolios/        — CRUD портфолио (master/admin)
blog.vue           — CRUD блога (master/admin/editor)
faq.vue            — CRUD FAQ (master/admin/editor)
features.vue       — CRUD features (master/admin/editor)
contacts.vue       — просмотр контактов (master/admin)
team.vue           — CRUD команды (master/admin)
testimonials.vue   — CRUD отзывов (master/admin/editor)
clients.vue        — CRUD клиентов (master/admin)
pricing.vue        — CRUD pricing (master/admin)
```

### Admin Layout — Responsive MD3
```
Phone (<600px):      bottom navigation bar
Tablet (600-839px):  navigation rail (узкий sidebar)
Desktop (≥840px):    полноценный sidebar (260px)
```

### Admin — Shared Components
```
molecules:     EmptyState, PortfolioLightbox, PricingCard
organisms:     ChangePasswordModal, ConfirmDialog, ToastContainer, BlogPostsGrid
               PricingComparison, PricingTiers, TeamGrid
```

Каждая admin-страница использует:
- `useFetch()` от Nuxt → `load()` от SvelteKit
- `definePageMeta({ middleware: 'auth' })` → `+layout.server.ts` auth guard
- `useHead()` → `<svelte:head>`
- `useI18n()` → custom i18n
- Те же CSS классы что и сайт (`.card`, `.badge`, `.btn`, `.data-table`)
- Tabler icons (`~icons/tabler/`) → `@iconify/svelte` or unplugin-icons

### CRUD Pattern (пример users.vue)
```vue
// Каждая admin-страница имеет:
1. definePageMeta → layout, middleware, pageTransition
2. useHead → title из i18n
3. useConfirm → confirm dialog для удаления
4. useToast → toast notifications
5. useFetch → данные с сервера
6. Modal → форма создания/редактирования
7. CRUD: список → create → edit → delete
```

## 20. Nuxt ↔ SvelteKit Feature Mapping

### Nuxt → SvelteKit (замена есть)
```
definePageMeta        → +page.ts export load + meta
useFetch(url)         → load() + fetch(url)
useAsyncData          → load()
useState              → $state / $page.data
onMounted             → $effect()
useHead / useSeoMeta  → <svelte:head>
useRuntimeConfig      → $page.data (from layout.load())
useCookie             → event.cookies (in hooks/load)
navigateTo            → goto() from $app/navigation
useRoute              → $page from $app/stores
middleware            → hooks.server.ts / +layout.server.ts
server middleware     → hooks.server.ts (single handle)
Nuxt modules          → Vite plugins + hooks
useLocalePath         → кастомный composable (не встроен)
```

### У Nuxt есть, у SvelteKit НЕТ → надо делать самим
```
Auto-imports          → SvelteKit explicit imports (это плюс для AI!)
useFetch caching      → кастомный fetch cache
useAsyncData hydration → load() покрывает большинство
Built-in i18n         → кастомный i18n (t() + te() + DB)
Built-in color mode   → Tailwind dark: уже есть
PWA module            → vite-plugin-pwa
Cookie consent        → кастомный CookieConsent компонент
SEO meta helpers      → <svelte:head> covers most cases
```

### У SvelteKit есть, у Nuxt НЕТ → используем
```
Form actions          → +page.server.ts exports actions
Error boundaries      → +error.svelte per route
Svelte 5 runes        → $state, $derived, $effect (NO pinia!)
Standard web APIs     → Request, Response, URL, Headers
Explicit imports      → AI-friendly (no hidden magic)
Streaming SSR         → load() can return promises
```

## 21. Libraries — Final Decision

### ОСТАВИТЬ (framework-agnostic, stays in PM3)
| Lib | Why | Notes |
|-----|-----|-------|
| better-sqlite3 | DB driver | — |
| drizzle-orm | ORM | — |
| drizzle-kit | Migrations | — |
| zod | Validation | — |
| gsap | Animations | + TextPlugin |
| matter-js | Falling letters physics | NOT Three.js |
| pino | Logging | — |
| nodemailer | Email | — |
| otpauth | 2FA TOTP | — |
| qrcode | 2FA QR | — |
| sanitize-html | XSS prevention | — |
| sharp | Image processing | — |
| fluent-ffmpeg | Video compression | — |
| ioredis | Distributed cache | optional |

### УБРАТЬ (Nuxt-specific, won't migrate)
| Lib | Reason | Replacement |
|-----|--------|-------------|
| nuxt | Framework | @sveltejs/kit |
| vue | UI lib | svelte |
| vue-router | Router | @sveltejs/kit |
| pinia | State | Svelte 5 runes |
| @nuxtjs/i18n | i18n | Custom composable |
| @nuxtjs/color-mode | Theme | Tailwind dark: |
| @nuxtjs/critters | CSS | Manual critical CSS |
| @vite-pwa/nuxt | PWA | vite-plugin-pwa |
| vue-tsc | Type check | svelte-check |
| @vue/test-utils | Testing | Vitest + Svelte |
| happy-dom | DOM | jsdom |

### ДОБАВИТЬ (new for SvelteKit)
| Lib | Why |
|-----|-----|
| @sveltejs/kit | Framework |
| @sveltejs/adapter-node | SSR/Node adapter |
| svelte | UI lib |
| tailwindcss | CSS engine |
| @tailwindcss/vite | Vite plugin |

### DISCUSSED
| Lib | Decision |
|-----|----------|
| Three.js | ДЕРЖИМ — используется в других проектах PM, не в этом сайте |
| hamburgers | ЗАМЕНИТЬ на собственный CSS (50 строк) — контролируем визуал |
| @iconify/svelte | Tabler icons — перенести с unplugin-icons
```
Matter.js: 400 физических тел для falling letters
  Фреймворк-независимая JS библиотека — портируется как Svelte action
  
GSAP: hero intro animation
  TextPlugin требуется для typing эффекта
  Фреймворк-независимая — портируется как Svelte action

hamburgers: CSS библиотека для гамбургер-меню
  Можно заменить на 50 строк собственного CSS
```

```ts
settings: [
  { key: 'contact.email', type: 'email', group: 'contact', label: 'Email', icon: 'mail' },
  { key: 'social.telegram', type: 'url', group: 'contact', label: 'Telegram', icon: 'brand-telegram' },
  // ... 50+ настроек
]
// GROUP: contact, location, social, integrations, legal, footer, seo, analytics, verification
```

---

## Итог: что нужно для PM3 на SvelteKit + Tailwind (как Nuxt UI)

### Архитектура PM3:

```
PM3 Core (SvelteKit + Tailwind):
├── Config System        ← портировать config.ts
├── Section System        ← SectionRenderer + onepager/SPA
├── Navigation System     ← useWebsiteNavigation + ScrollSpy
├── Logo System           ← theme+lang aware logo selection
├── i18n System           ← t() + te() + DB translations
├── Theme System          ← light-dark через Tailwind + @theme
├── Admin Panel           ← RBAC CRUD, system + website modules
├── API Layer             ← public + admin endpoints
├── Security              ← auth, CSRF, CSP, rate, audit
└── UI Kit (Tailwind)     ← OUR design system на Tailwind
    ├── @theme             ← PM design tokens
    ├── atoms/             ← buttons, inputs, icons
    ├── molecules/         ← cards, nav, modals
    ├── organisms/         ← header, footer, sections
    └── sections/          ← hero, about, contact, etc.

PM3 Plugins (отдельные модули):
├── portfolio/             ← viewer + API + admin
├── blog/                  ← posts + categories
├── pricing/               ← tiers + features
├── faq/                   ← Q&A accordion
├── features/              ← feature cards
├── team/                  ← team members
├── testimonials/          ← reviews carousel
└── clients/               ← logo strip
```

### Принципы (из Nuxt UI):
1. **Tailwind как ДВИЖОК**, не как замена дизайну
2. **PM Design Tokens** → `@theme` (цвета, шрифты, тени)
3. **Компоненты** используют Tailwind утилиты с PM токенами
4. **Визуал = оригинальный PM** — Tailwind не меняет дизайн
5. **Никаких BEM классов** — всё через Tailwind
6. **Config-driven** — конфиг управляет всем
7. **Модули = плагины** — portfolio, blog, pricing не в core
