# Puppet Master Vanilla Baseline

This directory is the vanilla Puppet Master (PM) Nuxt 4 baseline. It includes the PM framework/runtime, admin panel, setup/init tooling, deployment automation, and PM master starter defaults only.

For new work, start from the prompt-driven initialization files in `project/init/`. Those prompts are the canonical way to generate a project layer without using the browser `/init` wizard.

The base must not contain client project content. Real projects are generated from `project/init/GREENFIELD_PROJECT_START_PROMPT.md`, `project/init/greenfield-defaults.json`, and files placed in `project/init/concept_docs/`.

## Project Init Prompts

Prompt-driven starts live in:

| File | Purpose |
| ---- | ------- |
| `project/init/GREENFIELD_PROJECT_START_PROMPT.md` | Complete starter prompt for a new PM project with no existing codebase to preserve |
| `project/init/BROWNFIELD_PROJECT_START_PROMPT.md` | Complete starter prompt for migrating an existing product/codebase into PM |
| `project/init/concept_docs/README.md` | Instructions for adding project briefs, feature notes, brand notes, migration notes, route inventories, and launch constraints |

Before starting a new project, put source documents in `project/init/concept_docs/`, for example:

```text
project/init/concept_docs/01_project_brief.md
project/init/concept_docs/02_brand_notes.md
project/init/concept_docs/03_features.md
project/init/concept_docs/04_launch_constraints.md
```

Then run the greenfield intake command for the target agent:

```bash
npm run pm-init-green -- --agent=codex
npm run pm-init-green -- --agent=claude
npm run pm-init-green -- --agent=qwen
```

The command writes `project/init/generated/pm-init-green-context.md`. That generated file is ignored because it can contain client concept material.

Prompt-driven setup is different from the browser `/init` wizard:

- prompt-driven setup generates the completed project configuration directly from the prompt and concept docs
- prompt-driven setup must finish with `pmMode: 'build'` and `PM_MODE=build`
- use `pmMode: 'unconfigured'` only when explicitly choosing the browser `/init` wizard
- do not remove PM framework core while replacing project-layer content
- if the prompt is not filled and no concept docs exist, agents must use `project/init/greenfield-defaults.json`

## Vanilla Starter Shape

- Project mode: `unconfigured`
- Entity defaults: public website with admin panel
- Layout: onepager
- Locales: English by default, framework support for additional locales and RTL
- Enabled website modules: features, FAQ, contact
- Data source: SQLite through Drizzle ORM
- Notifications: disabled by default
- Storage: local uploads by default, S3-compatible storage available by config

Core files:

| File                                | Purpose                                                   |
| ----------------------------------- | --------------------------------------------------------- |
| `project/puppet-master.config.ts`       | Project feature flags, sections, modules, settings schema |
| `project/init/`                     | Prompt-driven greenfield/brownfield start files           |
| `project/init/greenfield-defaults.json` | Default fallback values for greenfield generation      |
| `project/init/concept_docs/`        | Project concept and migration document intake             |
| `i18n/content.ts`                   | PM master starter copy seed data                          |
| `server/database/seed.ts`           | default settings, users, roles, and starter content seed  |
| `app/components/sections/`          | onepager section components                               |
| `app/assets/css/`                   | global layered CSS system                                 |
| `server/api/contact/submit.post.ts` | public inquiry submission endpoint                        |
| `server/utils/telegram.ts`          | Telegram notification adapter                             |

Framework reference remains in [docs/README.md](docs/README.md).

## Local Development

Use Node.js 22, npm 10+, and Docker. The default local runtime is Docker-based so development follows the same container path as production.

```bash
npm install
cp .env.example .env
```

For local development, set `DATABASE_URL` in `.env` to a local path:

```env
DATABASE_URL=./data/sqlite.db
PM_SETTINGS_ENCRYPTION_KEY=replace-with-64-character-hex-string-from-openssl
```

Then prepare the database and run the Docker-based dev server:

```bash
npm run db:push
npm run db:seed
npm run dev
```

Open:

- Public site: `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin`
- Health endpoint: `http://localhost:3000/api/health`

When port `3000` is busy, `npm run dev` automatically chooses the next free host port and prints the URL. Use `PM_DOCKER_DEV_HOST_PORT=3003 npm run dev` when you need a specific port. Use `npm run dev:host` only for diagnostics when intentionally bypassing Docker.

Seeded local accounts:

| Role   | Email                | Password    |
| ------ | -------------------- | ----------- |
| Master | `master@example.com` | `master123` |
| Admin  | `admin@example.com`  | `admin123`  |
| Editor | `editor@example.com` | `editor123` |

Change seeded credentials before using a public environment.

## Project Configuration

The important project switches live in `project/puppet-master.config.ts`:

```ts
pmMode: 'unconfigured'
entities: {
  website: true,
  app: false
}
features: {
  multiLangs: false,
  doubleTheme: true,
  onepager: true,
  scrollytelling: false,
  contactTelegramNotify: false
}
sections: ['home', 'features', 'faq', 'contact']
```

Telegram credentials are not environment variables. Store them in Admin Settings:

- `contact.telegramBotToken`
- `contact.telegramChatId`

See [docs/operations/telegram-contact-notifications.md](docs/operations/telegram-contact-notifications.md) for bot creation, chat ID discovery, group setup, and smoke tests.

## Environment

`.env` is for runtime/deploy secrets and infrastructure settings. It is ignored by git.

Common local keys:

| Key                          | Purpose                                           |
| ---------------------------- | ------------------------------------------------- |
| `DATABASE_URL`               | SQLite database path                              |
| `PM_SETTINGS_ENCRYPTION_KEY` | encryption key for secret settings stored in DB   |
| `SITE_DOMAIN`                | primary production domain for deploy and HTTPS    |
| `SITE_DOMAIN_ALIASES`        | optional domains redirected to `SITE_DOMAIN`      |
| `SMTP_*`                     | optional email notification/confirmation settings |
| `S3_*`                       | optional S3-compatible storage settings           |
| `API_*`                      | optional external API data-source settings        |
| `REDIS_*`                    | optional multi-instance cache settings            |

Do not add Telegram bot credentials to `.env`; they are database settings managed through the admin panel.

## Content Workflow

Public copy starts in `i18n/content.ts` and is seeded into the database. After seed, editors can manage translations in the admin panel.

Default settings such as `contact.email`, `legal.companyName`, and `seo.title` are seeded in `server/database/seed.ts`.

Contact submissions are stored in `contact_submissions` and reviewed from `/admin/contacts`.

## Quality Checks

Run focused checks while developing:

```bash
npm run lint
npm run test:run
npm run build
```

Useful narrower checks:

```bash
npx eslint app server
npx vitest run tests/server/utils/site-settings.test.ts tests/api/admin-settings.test.ts
npm run check-doc-entrypoints
```

## Deployment

Deployment is driven by the project scripts and Ansible/Docker configuration in this repository.

```bash
npm run setup
npm run deploy
npm run rollback
npm run deploy:logs
```

Production SQLite data is expected under the mounted `/app/data` volume. Keep `PM_SETTINGS_ENCRYPTION_KEY` stable across deploys; losing it means losing access to encrypted settings such as the Telegram bot token.

See [docs/operations/deployment.md](docs/operations/deployment.md) for the full deployment workflow.

## Documentation

- [Operations](docs/README.md#operations)
- [Configuration reference](docs/reference/configuration.md)
- [Telegram contact notifications](docs/operations/telegram-contact-notifications.md)
- [CSS architecture](docs/styles/CSS_ARCHITECTURE.md)
- [API reference](docs/reference/api-reference.md)

## License

Commercial. All rights reserved.
