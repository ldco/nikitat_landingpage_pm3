# Puppet Master — Work Cheat Sheet

---

## DEV SERVER

```bash
npm run dev                   # Auto-selects free port (3000 → 3001 → ...)
PORT=3001 npm run dev         # Force specific port
npm run dev:host              # Host direct (escape hatch only)
```

Docker overrides:
```bash
PM_DOCKER_DEV_BUILD=always npm run dev       # Force rebuild
PM_DOCKER_DEV_SKIP_BUILD=true npm run dev    # Skip rebuild
npm run docker:dev:clean                     # Remove old dev volumes
```

---

## PROJECT START

```bash
# New greenfield project
bash scripts/pm-new-project.sh /path/to/new

# Strip current project to vanilla PM (agent figures out what to remove)
/vanilla
```

---

## BUILD

```bash
npm run build                 # Production build → .output/
npm run preview               # Preview production build
npm run generate              # Static site
npm run docker:build          # Docker image only
```

---

## DATABASE

```bash
npm run db:push               # Push schema to SQLite (force)
npm run db:generate           # Generate migrations
npm run db:migrate            # Run migrations
npm run db:migrate:prod       # Prod migrations
npm run db:seed               # Seed sample data
npm run db:reset              # Nuke + migrate + seed
npm run db:studio             # Web UI for DB browsing

./scripts/backup-db.sh                    # Local backup
./scripts/backup-db.sh --remote           # + S3 upload
./scripts/backup-db.sh --verify           # + integrity check
./scripts/restore-db.sh --latest          # Restore latest
```

---

## DEPLOY

```bash
npm run setup                 # First time: provision VPS + deploy
npm run setup:resume          # Resume interrupted setup
npm run deploy                # Normal deploy (build + push + Ansible + health)
npm run rollback              # Roll back to previous image
npm run deploy:secrets        # Generate/fill deploy secrets
npm run deploy:logs           # View production logs
npm run deploy:shell          # SSH into VPS
npm run deploy:sync-local-data # Promote local DB/uploads to prod
```

---

## SMART GIT (Agent Commands)

These are **agent-driven** — the agent analyzes changes and acts intelligently:

| Command | What it does |
|---------|-------------|
| `/commit` | Auto-stages changes, generates conventional-commit message from diff, commits. If pre-commit hooks fail, auto-fixes and retries. |
| `/undo` | Smart undo: if last commit is yours and not pushed → soft reset HEAD~1. If WIP changes exist → `git checkout -- .` for tracked, `git clean -fd` for untracked after asking. If commit already pushed → warns and suggests revert. |
| `/undo [file]` | Unstage or revert specific file to last committed state. |
| `/switch <branch>` | Stash WIP with descriptive name, switch branch, offer to pop stash. Warns if branch has unmerged conflicts. |
| `/new-branch <name>` | Create branch from current state, switch to it. Auto-detects base branch. |
| `/what-changed` | Show summarized diff with file count, lines changed, and conventional-commit recommendation. No commit is made. |
| `/pr` | Push current branch, create PR with auto-generated title + body from commit messages. |

**Manual fallback** (when you need control):
```
pm_git_commit message="feat: add blog module" push=true files="app/,server/"
```

---

## CONFIG (Agent)

```
pm_config_get                  # Full config dump
pm_config_get key="modules.blog"
pm_config_get key="colors"
pm_config_set key="modules.blog.enabled" value=true
pm_config_set key="features.onepager" value=false
```

---

## TESTING

```bash
npm run test                  # Staged (unit + API)
npm run test:unit             # Unit only
npm run test:api              # API only
npm run test:api:single       # API single worker
npm run test:e2e              # E2E (Vitest)
npm run test:e2e:playwright   # Playwright visual
npm run test:e2e:playwright:ui # Playwright with UI
```

---

## CODE QUALITY

```bash
npm run lint                  # ESLint
npm run lint:fix              # ESLint auto-fix
npm run format                # Prettier format
npm run format:check          # Prettier check
npm run lint:css-tokens       # CSS token audit
```

Agent shortcut:
```
pm_review_run scope=quick     # Lint + types only
pm_review_run scope=full fix=true  # Full + auto-fix
```

---

## AUDITS (Multi-Agent)

Audit = code quality **plus** domain-specific deep checks. Runs multiple agents in parallel:

| Command | Covers |
|---------|--------|
| `/audit framework` | PM compliance rules (no `<style>`, no `any`, BEM, config/CSS sync, no raw SQL) |
| `/audit security` | Secret leaks, raw SQL, `innerHTML`, `v-html`, auth bypass, CORS, rate limits, dependencies |
| `/audit ui-ux` | Accessibility (a11y), responsive breakpoints, color contrast, RTL, keyboard nav, focus order |
| `/audit perf` | Core Web Vitals, bundle size, image optimization, font loading, render-blocking, Lighthouse |
| `/audit coverage` | Test-to-component ratio, test-to-API ratio, untested critical paths |
| `/audit full` | **All of the above.** Runs every agent in parallel. Saves report to `docs/audit-YYYY-MM-DD.md`. |
| `/audit quick` | Fast pass = lint + typecheck + framework compliance grep scan. No heavy tests. |

---

## ADMIN & MAINTENANCE

```bash
npm run admin:passwords:rotate  # Rotate admin passwords
npm run db:studio               # Browse database
npm run workflow:switch claude  # Switch AI model
npm run workflow:info           # Current workflow
npm run check:versions          # Framework version contract
npm run check:pm-ownership      # PM ownership markers
```

---

## ASSETS

```bash
npm run assets:launch           # Generate OG images, app icons
npm run assets:optimize         # Optimize images (AVIF/WebP)
npm run assets:optimize:full    # Full (includes PNG)
npm run generate:favicons       # Generate favicons
npm run check:launch-assets     # Warn about missing assets
```

---

## STORYBOOK

```bash
npm run storybook               # Dev on :6006
npm run storybook:build         # Build static
```

---

## TOP MCP TOOLS (Agent)

| For this... | Use this... |
|-------------|-------------|
| Start project | `pm_init mode=develop startDev=true` |
| Start dev server | `pm_dev action=start` |
| Project status | `pm_status detail=full` |
| Push DB schema | `pm_db_push` |
| Seed database | `pm_db_seed` |
| Reset everything | `pm_db_reset` |
| Open DB browser | `pm_db_studio` |
| All quality checks | `pm_review_run scope=full` |
| Deploy | `pm_deploy` |
| Rollback | `pm_rollback` |
| Setup VPS | `pm_setup` |
| Export contribution | `pm_contribute_export type=bugfix summary="fix X"` |
| Load framework docs | `pm_knowledge topic=all` |
| Review checklist | `pm_review_checklist specialty=fullstack` |

---

## COMMON FLOWS

```
# New project
bash scripts/pm-new-project.sh /path/to/new → npm install → npm run dev

# Strip to vanilla
/vanilla → npm install → npm run dev

# Daily work
npm run dev → code → /commit → code → /commit → /what-changed

# Before deploy
/audit quick → pm_review_run scope=full → npm run deploy

# Emergency
npm run rollback → /audit security → fix → npm run deploy

# Contribute back to framework
pm_contribute_export type=bugfix summary="..." problem="..." solution="..." testing="..."
```
