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

## 22. Deploy System

### Architecture
```
Developer → deploy.sh → Docker build → SSH Registry → VPS → Ansible → Traefik
                              ↓
                        npm run build (SvelteKit node adapter)
```

### Components
| Component | What it does | PM3 Notes |
|-----------|--------------|-----------|
| `Dockerfile` | Multi-stage build (node:22-alpine) | Port: just change Nuxt→SvelteKit build |
| `scripts/deploy.sh` | Orchestrates deploy (build + push + ansible) | Bash — stays |
| `scripts/deploy-logs.sh` | Tail logs from VPS | Bash — stays |
| `scripts/deploy-secrets.sh` | Sync .env to VPS | Bash — stays |
| `scripts/deploy-shell.sh` | SSH shell to VPS | Bash — stays |
| `scripts/setup.sh` | First-time VPS provision | Bash — stays |
| `ansible/deploy.yml` | Ansible playbook for deploy | Stays |
| `ansible/provision-shared.yml` | VPS provision playbook | Stays |
| `ansible/rollback-app.yml` | Rollback playbook | Stays |
| `ansible/requirements.yml` | Ansible collections | Stays |

### Deploy Flow (deploy.sh)
```
1. Проверить .env + inventory
2. Собрать Docker образ
3. Загрузить в SSH Registry или на VPS
4. Ansible:
   - Сгенерировать docker-compose.yml
   - Обновить Traefik config
   - Запустить миграции БД
   - Health check
5. Обновить .pm-deploy-state.json
```

### Docker Image
```
FROM node:22-alpine
  → npm ci --production
  → npm run build
  → COPY build artifacts
  → USER non-root
  → node build/index.js (SvelteKit node adapter)
```

### Deploy Modes
```
ssh-agent   → прямой SSH + k3s образа
ssh-registry → свой Docker Registry через SSH туннель
```

### What changes for PM3
- `Dockerfile`: Nuxt build → SvelteKit build (adapter-node)
- `docker-entrypoint.sh`: Nuxt start → SvelteKit node start
- `ansible/deploy-vars.yml`: image name updates
- Остальное (bash, ansible, traefik) — stays

## 23. Hamburger Animations

### Текущее: библиотека hamburgers (^1.2.1)
```
~15 типов анимаций: spin, elastic, slider, spring, squeeze, arrow, 
                    3dx, 3dy, 3dxy, boring, collapse, vortex, etc.
Используется в этом сайте: только spin
Размер: ~10KB CSS (~800 строк)
```

### Решение для PM3
```
ВЗЯТЬ все анимации из библиотеки, переписать на свои CSS переменные.
Добавить в @layer components в app.css.
Минус зависимость, плюс контроль визуала.
Размер будет меньше — только нужные типы.
Можно добавить новые типы в будущем.
```

## 24. Font System

### Self-hosted variable fonts
```
Geologica (100–900) — основной шрифт (кириллица + латиница)
  - Cyrillic Extended (woff2, 4 unicode ranges)
  - Cyrillic
  - Latin Extended
  - Latin
Heebo (variable) — для иврита (Hebrew)
  - Hebrew
  - Latin
  - Latin Extended
```

### Загрузка
```css
@font-face {
  font-family: 'Geologica';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('./fonts/Geologica-Cyrillic.woff2') format('woff2');
  unicode-range: U+0400-045F, ...;
}
```

### Для PM3 — портировать как статический ассет
```
8 woff2 файлов → public/fonts/
typography/font-faces.css → src/lib/css/typography/
```

## 25. Cookie Consent System

```
useCookieConsent() → { cookiesEnabled, canUsePreferenceCookies, ... }
- localStorage + cookie (дуальная запись)
- 3 состояния: accepted / declined / null (unset)
- Preference cookies: pm-color-mode, pm-theme-explicit, pm-locale-explicit
- Max age: 365 дней
- CookieConsent.vue компонент (фиксированный внизу)
- CSS: .cookie-consent → fixed, z-index, gradient background
- Учитывает features.cookies из конфига
```

## 26. SEO System

### index.vue (homepage)
```ts
useSeoMeta({
  title: t('seo.homeTitle'),
  description: t('seo.homeDescription'),
  ogTitle, ogDescription, ogType: 'website',
  ogUrl, ogImage, ogImageWidth: 1200, ogImageHeight: 630,
  twitterCard: 'summary_large_image',
  twitterTitle, twitterDescription, twitterImage
})

// Кастомная OG image: /og-image.{buildVersion}.png
// SVG source: /og-image.svg
// Preview: /?v={cacheKey}
```

### Dynamic sections ([section].vue)
```ts
useHead({
  title: te('seo.{id}Title') ? t(...) : t(`nav.${id}`),
  meta: [{ name: 'description', content: ... }]
})
```

## 27. Performance Monitoring

```ts
usePerformance() → PerformanceReport
- Core Web Vitals (LCP, FID, CLS, TTFB, FCP)
- Resource timing analysis
- Custom performance marks
- Server-Timing header parsing
- Performance reporting endpoint: /api/analytics/performance
```

## 28. Accessibility

```ts
useA11y() → { checkA11y, violations }
- Runtime WCAG 2.1 AA checking (dev only)
- axe-core integration
- Focus management
- Skip-to-content link
- ARIA attributes
```

## 29. WebSocket & Real-time

```
server/api/ws.ts — WebSocket endpoint
server/lib/websocket/ — WebSocket lib

Для этого сайта:
  - Session-based auth через WebSocket
  - Real-time уведомления (админка)

Для PM3:
  - @sveltejs/adapter-node поддерживает WebSocket
  - ws библиотека остаётся
```

## 30. Error Handling

```
api-error.ts — createError wrapper
  - Структурированные ошибки API
  - Всегда { success: false, error: string }

Формат:
  return { success: true, data } — успех
  throw error(status, message) — ошибка

Nuxt: createError({ statusCode, statusMessage })
SvelteKit: @sveltejs/kit error() — аналогично
```

## 31. Init/Setup System

```
scripts/init-cli.ts       — CLI утилита для настройки проекта
scripts/init-green.ts     — Greenfield (с нуля)
init.vue                  — Web-уборщик настройки

Поток:
  1. Запрос языков
  2. Выбор workflow (claude/qwen/codex)
  3. Выбор модулей
  4. Импорт существующего проекта (zip)
  5. DB push + seed
```

## 32. pm-core Framework Layer

```
pm-core/nuxt.config.ts    — пустой (только defineNuxtConfig)
pm-core/app/composables/ — 4 компосабла:
  useConfig()           — доступ к runtime config
  useModule()           — состояние модулей
  usePmConfig()         — публичный PM конфиг
  useSafeConfig()       — безопасный доступ с fallback
pm-core/app/types/       — 10 файлов типов (config, modules, auth, etc.)
```

## 33. Composable System (24 total)

```
Client:
  apiFetch.ts, useA11y, useAuth, useClientMounted, useConfirm,
  useCookieConsent, useCsrf, useFallingLetters, useFormDirty,
  useHeaderQuickContacts, useLegalDocuments, useLogo, useMediaQuery,
  usePagination, usePerformance, useReveal, useScrollHeader,
  useScrollSpy, useScrollytelling, useSiteSettings, useToast,
  useUnreadCount, useWebsiteNavigation, useWebSocket

Framework (pm-core):
  useConfig, useModule, usePmConfig, useSafeConfig

→ PM3: портировать как Svelte 5 runes (//.svelte.ts stores)
  или как Svelte actions (useReveal → use:reveal)
```

## 34. Public Assets

```
public/madebylogos/   — 8 SVG логотипов (theme × lang)
public/logos/         — то же самое (дубль?)
public/og-image.png   — Open Graph preview
public/og-image.svg   — OG image source
public/favicon.png    — favicon
public/favicon.ico    — legacy favicon
public/images/        — hero, about (content images)
```

## 35. Composable → SvelteKit Migration Map

| Composable | PM3 Approach |
|------------|--------------|
| apiFetch | fetch wrapper в $lib/utils |
| useAuth | auth.svelte.ts store |
| useA11y | Svelte action (use:a11y) |
| useClientMounted | $effect + browser check |
| useConfirm | ConfirmDialog component |
| useCookieConsent | CookieConsent component |
| useCsrf | hooks.server.ts (server) |
| useFallingLetters | Svelte action (use:fallingLetters) |
| useHeaderQuickContacts | $derived from config |
| useLegalDocuments | fetch from API |
| useLogo | $derived from config + locale |
| useMediaQuery | matchMedia + $effect |
| usePagination | $derived pagination |
| usePerformance | report to analytics API |
| useReveal | Svelte action (use:reveal) |
| useScrollHeader | $effect + scroll listener |
| useScrollSpy | Svelte action (use:scrollSpy) |
| useScrollytelling | Svelte action (use:scrolly) |
| useSiteSettings | fetch from API |
| useToast | toast.svelte.ts store |
| useWebsiteNavigation | lib/utils/navigation.ts |
| useWebSocket | WebSocket class |
| usePmConfig | $page.data (from layout.load) |

## XX. 152-ФЗ & Legal System (Russian Personal Data Law)

### Legal Documents (framework-level)
```
legal/
  ru/privacy-policy.md          — Политика конфиденциальности
  ru/personal-data-policy.md    — Политика обработки персональных данных
  ru/terms-of-service.md        — Условия использования
  en/privacy-policy.md          — Privacy Policy
  en/personal-data-policy.md    — Personal Data Processing Policy
  en/terms-of-service.md        — Terms of Service
```

### Как работает
```
1. legal/[document].vue — динамическая страница
   - Читает .md файл из папки legal/{lang}/{id}.md
   - Подставляет переменные: companyName, INN, OGRN, address из БД
   - Рендерит markdown в HTML (с безопасным рендерингом)
   
2. Admin legal.vue — редактор переводов для юридических документов
   - Загружает content из translations БД по ключам legal.*
   - Показывает статус перевода для каждой локали
   
3. SectionContact — проверяет согласие на обработку данных
   - Если есть personal-data-policy → требуется consent checkbox
   - Если нет → форма работает без consent (упрощённый режим)
   - Ссылки на privacy-policy + personal-data-policy под формой
```

### Consent flow
```
Форма контакта:
  1. Есть personal-data-policy? → показать checkbox + ссылку
  2. Нет personal-data-policy? → скрыть checkbox (forceShow)
  3. Пользователь отмечает consent → true
  4. B submit: consent обязателен если policy существует

Cookie consent (152-ФЗ + GDPR):
  1. localStorage: pm-cookie-consent-v1
  2. cookie: pm-cookie-consent (для SSR)
  3. 3 состояния: accepted / declined / null (unset)
  4. Preference cookies: pm-color-mode, pm-theme-explicit, pm-locale-explicit
  5. Максимальный срок: 365 дней
```

### LegalInfo molecule
```
Footer:
  © 2025 Company. All rights reserved
  · ИНН: xxx
  · ОГРН: xxx  
  · Адрес: xxx
  · Email: xxx
  
  Показывает только то, что имеет значение в БД.
  Ссылки на /legal/privacy-policy, /legal/personal-data-policy, /legal/terms-of-service
```

### Для PM3
```
- legal/ дирректория с .md документами — копируется как есть
- legal/[slug]/+page.svelte — портировать с Nuxt
- admin/legal — портировать как admin CRUD страницу
- LegalInfo — портировать как molecule
- CookieConsent — уже есть, доработать 152-ФЗ
- SectionContact — уже есть, доработать проверку документов
```

## 36. AI-Driven Development — Core Philosophy

### Исправленное понимание

**AI-Driven Development НЕ значит «AI не нужно знать».**  
AI-Driven Development значит **AI пишет ВСЁ**, включая Dockerfile, Ansible, deploy-скрипты, Traefik. AI — разработчик.

**Принципы (исправленные):**

```
1. Команды должны быть ПРОСТЫМИ и ПРЕДСКАЗУЕМЫМИ
   → npm run deploy запускает deploy.sh
   → AI МОЖЕТ заглянуть в deploy.sh и понять его
   → AI МОЖЕТ переписать deploy.sh под новый проект

2. Никакой «магии»
   → Команда dev запускает Vite dev server
   → Команда build делает production build
   → Команда deploy собирает + пушит + деплоит
   → Никаких абстракций «просто вызови и не думай»

3. 60 скриптов — ANTI-AI-FIRST
   → AI не запомнит 60 скриптов
   → 13 скриптов — AI запомнит с первого раза
   → Каждый скрипт — одно действие, понятное имя

4. Весь код — AI-читаемый
   → deploy.sh написан понятно, AI его понимает
   → Dockerfile написан понятно, AI его понимает
   → Ansible playbook написан понятно, AI его понимает
   → AI должен мочь прочитать и модифицировать любой скрипт
```

### Что это меняет в PM3

```
Вместо «AI не нужно знать про Docker»:
  → Dockerfile — 50 строк, понятных AI
  → deploy.sh — 150 строк, понятных AI  
  → Ansible playbook — 100 строк, понятных AI

Вместо «одна команда для всего»:
  → npm run build — собирает
  → npm run docker:build — собирает Docker образ
  → npm run deploy — полный деплой

AI может вызвать любую команду отдельно,
или полный цикл одной командой.
```

## 37. NPM Scripts — Nuxt → SvelteKit

### ОСТАЮТСЯ (с новым именем)
```
Nuxt              → SvelteKit
─────────────────────────────────────────────────
nuxt dev          → vite dev           (dev)
nuxt build        → vite build         (build)
nuxt preview      → vite preview       (preview)
vitest run        → vitest run         (test)
drizzle-kit push  → drizzle-kit push   (db:push)
drizzle-kit seed  → tsx seed.ts        (db:seed)
prettier --write  → prettier --write   (format)
eslint .          → eslint .           (lint)
```

### УХОДЯТ (PM-specific, не нужны в PM3)
```
Nuxt Script                → Reason
─────────────────────────────────────────────────
pm-init-green              → одноразовый
pm-new-project             → одноразовый
pm-vanilla                 → одноразовый
check-doc-entrypoints      → PM инфра
check-pm-ownership         → PM инфра
lint:css-tokens            → PM система
assets:launch              → Nuxt-specific
assets:optimize            → Nuxt-specific
check:launch-assets        → Nuxt-specific
generate:favicons          → разово
storybook                  → dev tool
storybook:build            → dev tool
audit:api-envelope         → PM чекер
admin:passwords:rotate     → ops tool
workflow:switch            → initial setup
workflow:info              → initial setup
```

### ДОБАВЛЯЮТСЯ (новые для PM3)
```
SvelteKit Script           → Purpose
─────────────────────────────────────────────────
svelte-kit sync            → generate types
svelte-check               → type checking
db:reset                   → drop + push + seed
deploy                     → one-command deploy (AI-friendly!)
```

### ИТОГ PM3 npm scripts
```json
{
  "dev": "vite dev",
  "build": "vite build",
  "preview": "vite preview",
  "check": "svelte-kit sync && svelte-check",
  "test": "vitest run",
  "test:watch": "vitest",
  "db:push": "drizzle-kit push",
  "db:seed": "tsx src/lib/server/db/seed.ts",
  "db:reset": "rm -f data/sqlite.db && drizzle-kit push && tsx src/lib/server/db/seed.ts",
  "deploy": "bash scripts/deploy.sh",
  "lint": "eslint .",
  "format": "prettier --write ."
}
```
→ 13 скриптов вместо 60. AI запоминает с первого раза.

## 38. AI-Driven Deploy

### Принцип
```bash
# Единственная команда для деплоя
npm run deploy

# AI не нужно знать про:
#   - Docker build флаги
#   - SSH Registry tunnel
#   - Ansible inventory
#   - Traefik config
#   - .env sync
#   - DB migrations
#
# Всё это делает deploy.sh — прозрачно для AI
```

### Что должно быть в deploy.sh (PM3)
```
1. npm run build                     # SvelteKit build
2. docker build -t app:version .     # Docker image
3. docker push registry/app:version  # Push to registry
4. ansible-playbook deploy.yml       # Ansible deploy
5. health check                      # Verify it's alive
```

### Что НЕ нужно AI знать
```
- Dockerfile детали
- Ansible playbooks
- SSH конфигурация
- Traefik роутинг
- .env переменные
- DB миграции (Ansible сам запускает)
```

## 39. Summary — What We Analyzed
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


## 40. Route Middleware (Nuxt Client-Side)
```
app/middleware/00.init.global.ts — проверка pmMode, редирект на /init если не настроен
app/middleware/auth.ts          — защита админ-роутов (definePageMeta)
app/middleware/app-mode.global.ts — роутинг App/Website/Admin

→ SvelteKit: hooks.server.ts для server-side, +layout.server.ts для auth guard
  SvelteKit НЕ имеет клиентских middleware — используем load функции
```

## 41. Server Plugins (Nitro)
```
server/plugins/01.env-validation.ts — валидация .env при старте
server/plugins/02.error-handlers.ts — глобальные обработчики ошибок
server/plugins/auto-seed.ts         — авто-seed при первом запуске
server/plugins/compress.ts         — сжатие ответов
server/plugins/csp-nonce.ts        — генерация nonces для CSP
server/plugins/sentry.ts           — Sentry для логирования ошибок

→ SvelteKit: hooks.server.ts для auto-seed/sentry/env-validation
  Vite server.watch для hot-reload (вместо плагинов)
```

## 42. Client Plugins (Nuxt)
```
app/plugins/a11y.client.ts         — axe-core регистрация
app/plugins/color-render-fallback.client.ts — Chrome GPU fix
app/plugins/csrf.client.ts         — авто-inject CSRF токенов в $fetch
app/plugins/reveal.ts              — v-reveal директива (global)
app/plugins/scrollytelling.ts      — v-scrolly-scene директива
app/plugins/sentry.client.ts       — Sentry browser
app/plugins/startup-preferences.client.ts — тема + локаль из cookie/storage
app/plugins/vh-fix.client.ts      — mobile 100vh fix

→ SvelteKit: hooks.client.ts для CSRF авто-inject
  Svelte actions для reveal/scrolly вместо директив
  $effect в layout для startup-preferences
```

## 43. Scheduled Tasks
```
server/tasks/cleanup-sessions.ts — удаление просроченных сессий (каждый час)
Nitro scheduler через defineTask()

→ SvelteKit: setInterval в hooks.server.ts или @sveltejs/adapter-node cron
```

## 44. Shared Domain Logic
```
shared/modules.ts — реестр модулей + локалей PM (единый источник)
  Используется из: server/api/setup, app/pages/init.vue, scripts/lib

→ SvelteKit: $lib/shared/ — импортируется из server и client кода
```

## 45. App Utilities
```
app/utils/api-errors.ts      — перевод API ошибок
app/utils/image-assets.ts    — ресолвер image assets
app/utils/legal-markdown.ts  — рендеринг юридического markdown
app/utils/private-teaching.ts — приватные данные
app/utils/rtl.ts             — RTL детекция по локали
app/utils/sanitize.ts        — HTML санитизация (+атрибуты)

→ SvelteKit: $lib/utils/ — те же функции
```

## 46. Scripts Library
```
scripts/lib/config-reader.ts    — читает puppet-master.config.ts
scripts/lib/config-writer.ts    — пишет конфиг обратно
scripts/lib/deploy-env.sh       — env-переменные для деплоя
scripts/lib/deploy-registry.sh  — Docker Registry через SSH
scripts/lib/framework-versions.sh — версии фреймворка
scripts/lib/index.ts            — реэкспорт
scripts/lib/modules.ts          — реестр модулей

→ SvelteKit: портировать как есть (чистый TS/Bash, без Nuxt зависимости)
```

## 47. Pinia Store (единственный)
```
app/stores/admin.ts — UI state админки (sidebar, unsaved changes, nav warnings)

→ SvelteKit: Svelte 5 runes — admin.svelte.ts rune store
  Не нужен Pinia — один модуль с $state
```

## 48. Storybook
```
.storybook/main.ts    — конфигурация Storybook для Vue
.storybook/preview.ts — превью конфиг

→ SvelteKit: Storybook для Svelte (@storybook/svelte)
```

## 49. IDE Workspace
```
.vscode/settings.json  — настройки VSCode (форматирование, линтеры)
.vscode/universe.json  — кастомный файл (AI workspace?)

→ SvelteKit: обновить конфиг под Svelte (svelte extension, prettier)
```

## 50. Type Declarations
```
types/clamscan.d.ts   — типы для ClamAV
types/websocket.ts    — типы для WebSocket

→ SvelteKit: src/app.d.ts + src/lib/types/
```

## 51. E2E Tests (Playwright)
```
e2e-playwright/example.spec.ts            — пример теста
e2e-playwright/smoke.spec.ts              — smoke test (главная, админка, API)
e2e-playwright/visual-regression.spec.ts  — визуальные регрессии

→ SvelteKit: Playwright + @sveltejs/kit (test runner заменяет Nuxt test utils)
```

## 52. File Upload Routes
```
server/routes/uploads/ — загрузка файлов (изображения, видео)

→ SvelteKit: src/routes/api/upload/ — тот же паттерн +server.ts
```

## FINAL COUNT: 52 Sections Analyzed
```
Config, Sections, SectionRenderer, Modules, Navigation, ScrollSpy,
Page Transitions, Logo, Footer, Settings, i18n, CSS, Security, PM3 Vision,
Scrollytelling, Animations, Falling Letters, Library Map, Admin Panel,
Nuxt↔SvelteKit Map, Library Decisions, Deploy System, Hamburger,
Font System, Cookie Consent, SEO, Performance, Accessibility, WebSocket,
Error Handling, Init/Setup, pm-core, 24 Composables, Public Assets,
NPM Scripts, AI-Driven Dev, Legal/152-ФЗ,
Route Middleware, Server Plugins, Client Plugins, Scheduled Tasks,
Shared Domain, App Utils, Scripts Library, Pinia Store, Storybook,
IDE Workspace, Type Declarations, E2E Tests, File Upload Routes
```
