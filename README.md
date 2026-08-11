# FABRICA22 — Puppet Master v3 (SvelteKit)

Проект FABRICA22 на платформе **Puppet Master v3** — SvelteKit 5 + Svelte 5 runes + Tailwind CSS v4 + Drizzle ORM + SQLite. Мигрировано с PM v2 (Nuxt 4); см. `docs/traycer/new audit/findings/` для результатов аудита миграции.

## Quick start

```bash
npm install
npm run db:reset   # создаёт БД + посев; первый запуск сам создаёт .env, админ-пароли берутся из .env
npm run dev        # dev-сервер
```

- Public site: `http://localhost:5173`
- Admin panel: `http://localhost:5173/admin`
- Health endpoint: `http://localhost:5173/api/health`

**Контракт `.env` — три фазы:** *runtime* (узкий app-контракт, валидируется `src/lib/server/utils/env.ts` — без `.env` сервер падает с явной ошибкой, тихих dev-фолбэков нет), *bootstrap* (first-time запуск создаёт `.env` из `.env.example` и генерирует long-lived секреты: `npm run db:seed`/`db:reset` и `npm run dev` через predb:*/predev, `setup`/`deploy` через `ensure_framework_env`; seed читает тот же `.env` через `--env-file` — админ-пароли из одного источника) и *steady-state* (на инициализированной среде `setup`/`deploy` валидируют `.env` и **не перегенерируют** — при пропаже падают с явной ошибкой; намеренная переинициализация — `PM_ENV_INIT=1`). От оператора нужны только site facts: `SITE_DOMAIN`, `SERVER_IP`, `ACME_EMAIL` (+ `SERVER_ROOT_PASSWORD` для первого парольного bootstrap) — `npm run setup` спросит их интерактивно на TTY, префлайт иначе укажет точный список недостающих.

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
| `npm run deploy:secrets` | Auto-generate/fill deploy secrets in `.env` |
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

`.env` — локальный конфиг (gitignored). **Жизненный цикл — три отдельных контракта, не один смешанный workspace** (PM2-стиль узкий runtime-контракт + PM3-автобутстрап):

| Контракт | Значения | Кто заполняет |
|----------|----------|---------------|
| 1. **Runtime app config** | `NODE_ENV`, `PORT`, `DATABASE_URL`, `LOG_LEVEL`, `TOTP_ENCRYPTION_KEY`, `PM_TRUST_PROXY`, `SMTP_*`, `CLAMAV_*`, `SENTRY_*`, `PM_FEATURES_HIBP` | валидируется `src/lib/server/utils/env.ts`; без `.env` runtime падает с явной ошибкой — тихих dev-фолбэков нет |
| 2. **Long-lived deploy secrets** | `PM_SETTINGS_ENCRYPTION_KEY`, `PM_ADMIN_*_PASSWORD`, `DEPLOY_USER_PASSWORD`, `DEPLOY_SSH_KEY` | генерируются только при first-time bootstrap (`ensure_framework_env` в `scripts/lib/deploy-env.sh`); steady-state `setup`/`deploy` валидируют и НЕ перегенерируют — при пропаже падают с ошибкой (восстановить из бэкапа или `PM_ENV_INIT=1`) |
| 3. **First-run operator inputs** | site facts: `SITE_DOMAIN`, `SERVER_IP`, `ACME_EMAIL` (+ `SERVER_ROOT_PASSWORD` для первого парольного bootstrap); deploy transport: `SSH_KEY`, `DEPLOY_USER`, `PM_DOCKER_*`, `TRAEFIK_IMAGE` и т.п.; опциональные project settings: `S3_*`, `API_*`, `REDIS_*` | оператор — `npm run setup` спросит на TTY; транспорт дефолтится фреймворком |

**Жизненный цикл:** первый запуск (`npm run dev`, `db:seed`/`db:reset`, `setup`, `deploy` при отсутствии setup-state) создаёт `.env` из `.env.example` и авто-генерирует long-lived секреты; seed читает тот же `.env` (`--env-file`) — seeded админ-пароли и `.env` из одного источника. Steady-state `setup`/`deploy` (setup-state существует) валидируют инициализированный `.env` и при пропаже `.env`/ключей **падают, а не перегенерируют**. Намеренная переинициализация — `PM_ENV_INIT=1`.

Ключевые переменные runtime-контракта:

| Key | Purpose |
|-----|---------|
| `DATABASE_URL` | путь к SQLite (по умолчанию `./data/sqlite.db`) |
| `TOTP_ENCRYPTION_KEY` | 64-hex; обязателен при `FEATURES.twoFactorAuth` — генерируется при bootstrap, держать стабильным между деплоями |
| `PM_TRUST_PROXY` | только за trusted reverse proxy (⚙️) |
| `SMTP_*` | email-уведомления (⚙️ опционально) |
| `SENTRY_DSN` | опциональный error tracking (⚙️) |

Long-lived deploy secrets (контракт 2):

| Key | Purpose |
|-----|---------|
| `PM_SETTINGS_ENCRYPTION_KEY` | 64-hex; шифрование settings в БД (app не читает — deploy/rotation) — генерируется |
| `PM_ADMIN_PASSWORD_ROTATION_ENABLED` | дефолт `true` — ротация master/admin/editor обязательна |
| `PM_ADMIN_MASTER_PASSWORD` | пароль master-аккаунта (bootstrap/ротация) — генерируется |
| `PM_ADMIN_ADMIN_PASSWORD` | пароль admin-аккаунта (bootstrap/ротация) — генерируется |
| `PM_ADMIN_USER_PASSWORD` | пароль editor-аккаунта (bootstrap/ротация) — генерируется |

Эти значения — одноразовые bootstrap/rotation inputs: нужны деплой-пайплайну и передаются только в одноразовый контейнер ротации (`node scripts/rotate-admin-passwords.mjs --apply`). Они НЕ сохраняются в долгоживущем runtime-окружении приложения (`.env.runtime` на сервере их не содержит). Чтобы задать явные значения вместо автогенерации, впишите их в `.env` (фреймворк их сохранит) или сгенерируйте: `node scripts/rotate-admin-passwords.mjs --generate --write-env`.

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
npm run setup         # сам бутстрапит .env + генерирует секреты, спрашивает site facts, затем Ansible
npm run deploy        # build + Ansible rollout + health check
npm run rollback      # откат на предыдущий образ
npm run deploy:logs   # логи деплоя
```

Никакой ручной подготовки `.env` перед первым `npm run setup` не требуется: на first-time запуске `presetup` + `load_env` создадут `.env` из `.env.example` и сгенерируют long-lived секреты (см. контракт в разделе Environment); на TTY setup интерактивно спросит `SITE_DOMAIN`, `SERVER_IP`, `ACME_EMAIL`. На уже инициализированной среде (setup-state существует) `setup`/`deploy` ничего не перегенерируют — при пропаже `.env` или стабильных ключей падают с явной ошибкой (восстановить из бэкапа или `PM_ENV_INIT=1`).

SQLite в mounted volume `/app/data`. Keep `PM_SETTINGS_ENCRYPTION_KEY` и `TOTP_ENCRYPTION_KEY` стабильными между деплоями (восстановить из бэкапа при переустановке).

Полный workflow: [docs/operations/deployment.md](docs/operations/deployment.md).

## Documentation

- [Framework docs (RU)](docs/README.md)
- [Architecture decisions](docs/architecture/) — security headers, WebSocket (polling)
- [Design tokens](docs/design-tokens.md)
- [Contributing rules](docs/contributing/)
- [Audit findings](docs/traycer/new audit/findings/)

## License

Commercial. All rights reserved.
