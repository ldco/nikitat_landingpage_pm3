# Step 24 — N-9: Adopt Drizzle migration files

> **Phase:** Nice-to-have | **Finding:** N-9 | **Severity:** Recommendation

## What this step is

PM3 uses `drizzle-kit push` (schema-to-DB, no migration files). PM2 used `drizzle-kit generate` + `migrate`, producing an auditable migration history. The deploy pipeline (`docker-migrate.mjs`) already exists and expects migrations.

## What we are doing

Switch to generate+migrate: generate an initial migration from the current schema, adopt `db:generate`/`db:migrate` scripts, and stop relying on `push` for production schema changes.

## Why

Repo-verified — `drizzle.config.ts` has no `strict: true`/`verbose: true` that PM2 used; `package.json` uses `drizzle-kit push`. For AI-driven development, migration files give an auditable history and enable the existing `docker-migrate.mjs` deploy path.

## Plan

### Task 1: Generate the initial migration

- **File:** `drizzle.config.ts`, new `drizzle/` migrations
- **Change:** Add `strict: true`, `verbose: true`; run `drizzle-kit generate` to produce the initial migration matching the current schema (verify against the seeded DB).

### Task 2: Update scripts

- **File:** `package.json`
- **Change:** Add `db:generate: drizzle-kit generate`, `db:migrate: drizzle-kit migrate`; keep `db:push` for dev-only use.

### Task 3: Align deploy

- **File:** `scripts/docker-migrate.mjs`
- **Change:** Confirm it runs migrations (not push) and works with the new migration files.

## Verification

- [ ] `npm run db:migrate` on a fresh DB produces the same schema as `db:push`
- [ ] `npm run db:seed` still works after migrate
- [ ] `npm run check`, `npm test` pass
- [ ] Deploy to test host: `docker-migrate.mjs` applies migrations cleanly
