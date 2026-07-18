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

## 14. Settings Schema

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
