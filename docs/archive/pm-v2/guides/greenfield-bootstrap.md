# Greenfield Project Bootstrap

## Quick Start (Script)

The fastest way to start a new Puppet Master project from the framework baseline:

```bash
npm run pm-new-project /path/to/new-project --name="My Project"
```

This copies the PM framework, strips runtime artifacts (caches, databases, logs), resets `pmMode` to `unconfigured`, and creates a clean `.env`.

After copying:
```bash
cd /path/to/new-project
npm install
npm run dev
```

Open `http://localhost:3000/init` to configure the project via the browser wizard.

## Prompt-Driven Setup (AI Agent)

For LLM-assisted project generation, use the greenfield intake:

```bash
# 1. Add your project concept docs
mkdir -p project/init/concept_docs/
#    Place .md, .txt, .json, .csv files with project briefs, brand notes, features, etc.

# 2. Run the intake command
npm run pm-init-green -- --agent=codex     # for Codex/VS Code agents
npm run pm-init-green -- --agent=claude    # for Claude Code
npm run pm-init-green -- --agent=qwen      # for Qwen Code

# 3. The command generates project/init/generated/pm-init-green-context.md
#    Paste this into a new chat with your AI agent
```

The agent will:
1. Read the context bundle (prompts, defaults, concept docs)
2. Generate a project layer (config, content, seed data, sections, assets)
3. Set `pmMode: 'build'` when done

## Manual Clean Cleanup

If you want to reset an existing PM copy to a clean baseline manually:

```bash
# 1. Reset config
#    Set pmMode to 'unconfigured' in project/puppet-master.config.ts

# 2. Reset env
#    Set PM_MODE=unconfigured in .env
cp .env.example .env

# 3. Clear database
rm -f data/sqlite.db data/sqlite.db-wal data/sqlite.db-shm

# 4. Remove project-specific assets
#    Replace public/logos/ with PM-branded logos
#    Remove old project images from public/images/

# 5. Replace content seeds
#    Update i18n/content.ts with your project's content
#    Update server/database/seed.ts with your project's defaults

# 6. Run audits (see docs/entrypoints/greenfield-build.md)
npm run lint
npm run test:run
```

## What the Script Copies (Framework Core)

The bootstrap script preserves all PM framework code:

| Category | Path |
|----------|------|
| Core composables | `pm-core/` |
| Server utilities | `server/utils/` |
| Database schema | `server/database/schema.ts` |
| API routes | `server/api/` |
| Admin UI | `app/pages/admin/` |
| Setup wizard | `app/pages/init.vue` |
| Atomic components | `app/components/atoms/`, `molecules/`, `organisms/` |
| Global CSS | `app/assets/css/` |
| Composables | `app/composables/` |
| System i18n | `i18n/system.ts`, `i18n/system-seed.json` |
| Build/deploy | `scripts/`, `Dockerfile`, `ansible/` |
| Documentation | `docs/` |

## What the Script Strips

| Category | Path |
|----------|------|
| Build cache | `.nuxt/`, `.output/` |
| Dependencies | `node_modules/` |
| Databases | `data/*.db`, `data/*.db-wal`, `data/*.db-shm` |
| Deploy artifacts | `.deploy/` |
| Logs, reports | `*.log`, `lighthouse-report.json` |
| Agent sessions | `.claude-data/`, `.qwen-data/`, `.kilo/` |
| IDE config | `.idea/`, `.vscode/` |
| Generated context | `project/init/generated/` |
