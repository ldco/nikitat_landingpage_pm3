# Puppet Master — PM v3 (SvelteKit)

**Migration from Nuxt v2 is in progress.** 58 commits so far.

**Current state** → see `docs/MIGRATION_STEP_BY_STEP.md` (authoritative)

**Quick facts:**
- Build: 0 errors (`npm run check && npm run build`)
- Database: SQLite with Drizzle ORM (31 tables, zero content)
- CSS: 124 PM v2 CSS files are being translated to Tailwind (24 done, 81 pending)
- Routes: Public (/, /blog, /portfolio, /legal) + Admin (17 pages)
- Components: 21 atoms, 6 molecules, 8 organisms, 13 sections, 5 plugins
- Deploy: Dockerfile adapted for SvelteKit. Ansible pending.
