# Admin Panel Rewrite — Step-by-Step Implementation Plan

**Status**: Finalized 2026-08-12
**Source**: docs/plans/admin-panel-pm2-exact-replication.md
**Steps location**: docs/traycer/admin_rewrite/

## Summary
19 step files (3,851 lines) covering complete admin panel rewrite:
- 6 foundation molecules to extract
- 2 migrations to existing components
- 1 APP MODE layout rewrite
- 5 CRUD page normalizations
- 2 form expansions
- 4 gap closures

Each step file contains exact file paths, props interfaces, code examples,
PM3 framework rules, edge cases, and verification commands for AI agent implementation.

## Execution Order
1. Steps 01-04 (parallel) — Foundation molecules
2. Steps 05-06 (parallel) — Migration to existing components
3. Step 07 — APP MODE layout (depends on 03)
4. Steps 08-12 (sequential) — CRUD normalization (depends on 01, 02)
5. Steps 13-14 (sequential) — Form expansion (depends on 02, 05)
6. Steps 15-18 (parallel) — Gap closure

## Verification
After each step: npm run check
After all steps: npm run build

---

## ADR-001: Admin Module Enablement — Dual-Gate Architecture

### Status: Accepted

### Context

The admin panel uses a **dual-gate** system to control page visibility. Two
independent flags must both pass for an admin page to be reachable:

1. **`ADMIN_CONFIG.websiteModules.<key>.enabled`** — admin-specific gate. Controls
   whether the admin CRUD page exists. Does NOT affect the public website.
2. **`MODULES.<module>.enabled`** — public module gate. Controls whether the
   public-facing module is shown on the website. Also gates the admin page
   via `resolveAdminPageAccess()` in `admin-pages.ts`.

The resolution logic (from `src/lib/server/utils/admin-pages.ts`):

```typescript
const moduleEnabled = def.module ? (MODULES[def.module]?.enabled ?? false) : true
const configEnabled = config?.enabled ?? def.defaultEnabled
const enabled = moduleEnabled && configEnabled
```

Both must be `true`. If either is `false`, the page returns 404 from
`requireAdminPage()` and is hidden from the admin menu.

### Current state

| Module | `ADMIN_CONFIG.enabled` | `MODULES.enabled` | Admin Page | Public Site |
|--------|------------------------|-------------------|------------|-------------|
| Blog | `false` | `true` | 404 | Live |
| Pricing | `false` | `true` | 404 | Live |
| Contacts | `true` | `false` | 404 | Hidden |
| FAQ | `true` | `true` | Live | Live |
| Features | `true` | `true` | Live | Live |
| Portfolio | `true` | `true` | Live | Live |

### Decision

**The current dual-gate architecture is correct and stays as-is.** The admin gate
(`ADMIN_CONFIG`) and the public gate (`MODULES`) serve different purposes:

- `MODULES.<module>.enabled = false` means "this feature does not exist on this
  site at all." The admin page SHOULD be 404 because there's nothing to manage.
- `ADMIN_CONFIG.websiteModules.<key>.enabled = false` means "this feature exists
  on the public site but admins don't need to manage it through the admin panel
  (e.g., because content is seeded or static)."

### For the rewrite

To make blog, pricing, and contacts admin pages reachable:

| Module | Flag to Change | Also Affects |
|--------|---------------|--------------|
| Blog | `ADMIN_CONFIG.websiteModules.blog.enabled = true` | Public blog is already live — no change |
| Pricing | `ADMIN_CONFIG.websiteModules.pricing.enabled = true` | Public pricing is already live — no change |
| Contacts | `MODULES.contact.enabled = true` | **Also enables public contact form** — verify this is desired |

If the product intent is "admins manage blog/pricing but public modules stay
exactly as they are," no architecture change is needed — just set the
`ADMIN_CONFIG` flags to `true`.

If the product intent is "admins manage contacts, but the public contact form
stays hidden," the gate logic needs adjustment in `admin-pages.ts` to decouple
admin access from public module visibility. This is a separate architectural
decision — document it as an ADR if requested.

### Consequences

- **Easier**: Enabling an admin page is a one-line config change in `site-config.ts`.
- **Easier**: The dual gate prevents accidental exposure of admin pages for
  disabled public modules.
- **Harder**: Enabling contacts admin also enables the public contact form.
  Requires a code change to `admin-pages.ts` if this coupling is undesirable.

### Verification

After config changes:
1. Verify each enabled page is reachable at its admin URL
2. Verify the admin menu shows the page
3. Verify public site behavior is unchanged (or intentionally changed for contacts)
