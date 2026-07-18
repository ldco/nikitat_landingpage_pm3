---
# Puppet Master Framework — Agent Guide

## Identity
You are the primary AI agent for the Puppet Master (PM) framework. You operate as a senior, detail-oriented teammate.
- Use the **puppetmaster MCP server** (`pm_knowledge topic=all`) for framework reference (file structure, schema, task guides, tool catalog).
- Favor small, safe changes with clear reasoning. Never run destructive commands unless explicitly requested.

## Development Rules
- **DO NOT run `npm run build` during normal development.** The project hot-reloads via `npm run dev`.
- **DO NOT clear `.nuxt`/`.output` caches.** The Docker container owns these directories.
- To restart the dev server: kill the Docker container, then `npm run dev` again.

## Critical Rules

### CSS
- **No scoped styles** in `.vue` components. Use global CSS classes only.
- **No `<style>` blocks in `.vue` files** — zero exceptions. All styles come from `app/assets/css/`.
- Use CSS variables for colors and spacing. Do not hardcode colors.
- Use `light-dark()` for theme switching. Respect the 5-layer CSS architecture and BEM naming.
- **ZERO section-specific CSS by default.** Sections must use existing global framework classes (`section`, `section-body`, `section-title`, `container`, etc.).
- **Use `<AtomsMadeBy />` for project logos** — do not reimplement theme-aware logo rendering.
- **NEVER touch `public/madebylogos/`.** If the logo is wrong, fix the config — not the files.

### i18n — Zero Untranslated Text Rule
- **ALL visible text MUST go through `t()`** — no raw string literals in templates or scripts. Zero exceptions.
- **Content translations** (portfolio items, blog posts, etc.) are stored in the `translations` table with keys `{entity}.{id}.{field}`.
- **Translation cache** is loaded at server start via `translationCache`. After seeding translations, the server MUST be restarted to pick them up.
- **Portfolio section headings** must always be translated via `translateHeading()` which maps Russian headings to `portfolio.section.{key}` i18n keys.
- **Content fallback chain**: `translated content` → `sections with translated headings` → never raw untranslated text.
- Every text field visible on the page (title, description, category, section headings, body text) must have an EN, FR, and HE translation before content is considered complete.

### Components
- Use `<script setup lang="ts">` in all components.
- Props and emits must be typed.
- Import icons from `~icons/tabler/`. No inline styles. No custom CSS imports in sections.
- No custom BEM classes for text elements — use semantic `<h2>`, `<h3>`, `<p>`.

### TypeScript
- **ZERO `any` types** — use `unknown`, proper interfaces, or generics.
- **`catch` clauses** — always `catch (e: unknown)`.
- **NO escape hatches** — no `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, or `!` non-null.
- Use discriminated unions with `type`/`status`/`kind` literal discriminator.
- Every `switch` MUST include `const _exhaustive: never = value`.

### API
- Validate inputs with Zod. Use `createError()` for structured errors.
- Require auth with `requireAuth(event)` when needed.
- Return `{ success: true, data }` on success.
- Log security-sensitive actions to audit.

### Database
- Use Drizzle ORM only (no raw SQL).
- Run migrations with `npm run db:push` or `pm_db_push`.
- Export types from schema and keep tables in `server/database/schema.ts`.
