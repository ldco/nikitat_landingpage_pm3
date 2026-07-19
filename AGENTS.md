# FABRICA22 — Project Agent Guide

This project is built on **Puppet Master v3** (SvelteKit + Tailwind).
Load framework rules: `pm_knowledge topic=rules`
Load full framework reference: `pm_knowledge topic=all`

## Project-Specific Rules

### Colors (in `src/app.css` → `@theme`)
```css
--color-pm-brand: #901504;
--color-pm-brand-dark: #3b0902;
--color-pm-white: #fbf2e7;
```

### Site Config (`src/lib/config/site.ts`)
- `pmMode: 'develop'` — development mode (seeded DB)
- `onepager: true` — single-page with anchor navigation
- Modules: portfolio, blog, pricing, faq, features enabled. team, testimonials, clients, contact disabled
- Admin: master user seeded, 2FA disabled

### Database
- SQLite at `data/sqlite.db`
- Seed: `npm run db:reset` (recreates DB + seeds)
- Schema: 31 tables, Drizzle ORM, identical to PM v2

### Commands
```
npm run dev        — dev server (port 5173)
npm run check      — TypeScript check
npm run build      — production build
npm run db:seed    — seed database
npm run db:reset   — reset + seed database
```

## Framework Rules (from PM MCP server — always apply)
1. **Design Tokens — NO Arbitrary Values:** `text-[...]`, `max-w-[...]`, `pt-[calc(...)]` FORBIDDEN. Use `text-fluid-*`, `max-w-container`, `pt-[var(--pt-section)]`.
2. **Tailwind Utilities ONLY:** NO `<style>` blocks. NO global CSS classes.
3. **class prop + twMerge** on EVERY component.
4. **Config-Driven Everything:** import `FEATURES`, `MODULES` from `$lib/config/site`.
5. **Pre-commit hook** blocks arbitrary values automatically.

Contribution to update MCP rules: `docs/contributing/pm-v3-style-rules.md`
