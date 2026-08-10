# FABRICA22 — Puppet Master v3 (SvelteKit)

Проект FABRICA22 на платформе **Puppet Master v3** — SvelteKit 5 + Svelte 5 runes + Tailwind CSS v4 + Drizzle ORM + SQLite. Мигрировано с PM v2 (Nuxt 4); см. `docs/traycer/new audit/findings/` для результатов аудита миграции.

## Quick start

```bash
npm install
cp .env.example .env
npm run db:reset   # создаёт БД + посев
npm run dev        # dev-сервер (порт 5173)
```

- Public site: `http://localhost:5173`
- Admin panel: `http://localhost:5173/admin`
- Health endpoint: `http://localhost:5173/api/health`

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (port 5173) |
| `npm run check` | TypeScript check (svelte-check) |
| `npm run build` | Production build |
| `npm run lint` | ESLint (--max-warnings=0) |
| `npm test` | Vitest unit/contract tests |
| `npm run validate:pm3` | PM3 framework validator (full repo) |
| `npm run db:push` | Push Drizzle schema to SQLite |
| `npm run db:seed` | Seed database |
| `npm run db:reset` | Reset + seed |
| `npm run i18n:export` | Regenerate Paraglide artifacts from `i18n/system-seed.json` + config |
| `npm run db:studio` | Drizzle Studio |
| `npm run setup` | Server provisioning (Ansible) |
| `npm run deploy` | Deploy (build + Ansible rollout) |
| `npm run rollback` | Roll back to previous image |
| `npm run deploy:logs` | Deploy/log helper |

## Project structure

PM3 разделён на два слоя:

- **Фреймворк (`src/`)** — переиспользуемый слой: компоненты (`src/lib/components/`), хранилища, actions, server lib (DB, auth, security, storage), роуты, токены CSS.
- **Проект (`src/project/`)** — идентичность сайта FABRICA22: `site-config.ts` (локали, навигация, секции, модули, фичи, admin), `theme.css` (бренд-токены), `content.json`, брендовые компоненты (`SectionF22.svelte`, `HeroParallaxScene.svelte`, `gsapIntro`), `registry.ts` (переопределения секций).

Подробно: `docs/framework-project-boundary.md`.

## Project configuration

Все переключатели проекта — в `src/project/site-config.ts` (импортируется фреймворком через `src/lib/config/site.ts`):

```ts
PM_MODE: 'build'                 // build | develop | unconfigured
FEATURES.twoFactorAuth: true     // 2FA включена (требует TOTP_ENCRYPTION_KEY в prod)
FEATURES.onepager: true          // одностраничник с якорной навигацией
MODULES.portfolio.enabled: true  // модули включаются/выключаются здесь
ADMIN_CONFIG                     // RBAC по ролям (master/admin/editor)
```

Включённые модули: portfolio, blog, pricing, faq, features. Отключённые: team, testimonials, clients, contact (инфраструктура полная — включение = одна строка конфига).

## i18n

Локали — конфиг-управляемые (языко-агностичный фреймворк, PM v2 parity):

- **Локали**: `LOCALES`/`DEFAULT_LOCALE` в `src/project/site-config.ts` — единственный источник. Серверные контракты (валидация, детекция, setup-ответы) читают их через `src/lib/server/utils/locales.ts` — код под новую локаль не меняется.
- **Переводы живут в БД** (runtime source of truth): `npm run db:seed` заливает `i18n/system-seed.json` (системные/UI строки, все локали) + `src/project/content.json` (контент проекта) в таблицу `translations`. `t('key')` сначала читает БД — правки из админки применяются на лету.
- **Сгенерированные артефакты (не редактировать)**: `messages/{lang}.json` (вход Paraglide-компилятора) и `project.inlang/settings.json` — пересоздаются одной командой `npm run i18n:export` из `i18n/system-seed.json` + конфига.
- **Добавить язык**: 1) `{code, iso, name}` в `PM_LOCALE_DATA` (site-config.ts), 2) переводы в `i18n/system-seed.json` и `content.json`, 3) `npm run i18n:export` + `npm run db:seed`. RTL определяется автоматически (`isRtlLocale`).
- Запрещены новые не-переведённые литералы — валидатор (`scripts/pm3-validator.mjs`, check #10) и `scripts/i18n-literal-baseline.json`.

## Environment

`.env` — runtime/deploy secrets (gitignored). Ключевые переменные:

| Key | Purpose |
|-----|---------|
| `PM_SETTINGS_ENCRYPTION_KEY` | 64-hex; резерв для encrypted settings (пока не используется приложением) |
| `TOTP_ENCRYPTION_KEY` | 64-hex; **обязателен в prod при `FEATURES.twoFactorAuth`** — сервер падает на старте без него |
| `SITE_DOMAIN` | основной домен для деплоя |
| `DATABASE_URL` | путь к SQLite (по умолчанию `./data/sqlite.db`) |
| `SMTP_*` | email-уведомления |
| `S3_*` | S3-совместимое хранилище |
| `SENTRY_DSN` | опциональный error tracking (hardening) |
| `PM_TRUST_PROXY` | только за trusted reverse proxy (rate limiting) |

## Security

- Nonce-CSP — встроенный SvelteKit (`svelte.config.js` → `kit.csp`), `style-src-attr 'unsafe-inline'` — документированное исключение.
- Остальные заголовки — `src/lib/server/security/headers.ts` (решение «framework-owned, не helmet»: `docs/architecture/security-headers.md`).
- CSRF: double-submit cookie + `X-CSRF-Token` (исключения: `/api/auth/login`, `/api/analytics/performance`).
- Валидация: Zod на всех API-мутациях (валидатор check #9), magic bytes на загрузках, опциональный ClamAV scan.
- Rate limiting: login (IP+lockout), contact, 2FA, смена пароля; `getClientIp` fail-closed (только при `PM_TRUST_PROXY`).

## Quality & enforcement

Pre-commit (husky + lint-staged) запускает `scripts/pm3-validator.mjs` (10+1 проверок: дубли токенов, запрещённые `@utility`, arbitrary brackets, канонические примитивы, suppressions, пустые catch, Zod, i18n baseline) + ESLint. Подробно: `AGENTS.md`, `docs/contributing/pm-v3-style-rules.md`.

## Deployment

```bash
npm run setup         # первичная подготовка сервера (Ansible)
npm run deploy        # build + Ansible rollout + health check
npm run rollback      # откат на предыдущий образ
npm run deploy:logs   # логи деплоя
```

SQLite в mounted volume `/app/data`. Keep `PM_SETTINGS_ENCRYPTION_KEY` и `TOTP_ENCRYPTION_KEY` стабильными между деплоями.

Полный workflow: [docs/operations/deployment.md](docs/operations/deployment.md).

## Documentation

- [Framework docs (RU)](docs/README.md)
- [Architecture decisions](docs/architecture/) — security headers, WebSocket (polling)
- [Design tokens](docs/design-tokens.md)
- [Contributing rules](docs/contributing/)
- [Audit findings](docs/traycer/new audit/findings/)

## License

Commercial. All rights reserved.
