# Layer 1 — Code Inventory & Migration Completeness Audit (PM2 → PM3)

## Scope

Produce the full PM2→PM3 mapping and migration-completeness verdict, using spec:655a5dd7-1ae7-42b5-8b82-11c1cd095482/b258627c-201b-4ee1-bb52-966d9bdd2135 Layer 1 as the base methodology, **widened** to cover runtime/cross-cutting surfaces (not just pages/components/API routes/DB tables).

**In scope:**

- Full mapping table: every PM2 page (file:app-nuxt/app/pages/*), component (file:app-nuxt/app/components/**), server API route (file:app-nuxt/server/api/**), and each of the 31 DB tables → its PM3 equivalent (file:src/routes, file:src/lib/components, file:src/lib/server/services, file:src/lib/server/db/schema.ts) or explicit "missing/stub" flag.
- **Runtime/cross-cutting parity** (expanded scope): compare PM2 middleware/plugins/composables/server tasks against PM3's file:src/hooks.server.ts, file:src/lib/actions/*, file:src/lib/stores/*, background scripts, and the file:scripts/pm3-validator.mjs enforcement layer. Flag any PM2 capability (e.g. `useMediaQuery`, `useA11y`, `useFormDirty`, WebSocket unread-count) with no confirmed PM3 equivalent.
- Three independent verdicts per mapped item: code parity, visual/UX parity, content-migration parity.
- **Visual/UX parity — two-stage method**: (1) static review of component markup/props/data flow; (2) a manual/runtime verification checklist for animation, layout, and interaction parity that the user can execute manually (since no browser/screenshot access exists in this review). Also assess **test-tooling readiness** itself as a finding — confirm whether file:playwright.config.ts (which references `npm run test:e2e:playwright`) is actually wired up in file:package.json and whether `@playwright/test` is a resolved dependency; if not, flag this drift explicitly rather than silently working around it.
- Content-migration parity: cross-check file:app-nuxt seed/content sources against file:project/content.json / file:src/project/content.json row-by-row for populated fields, not just schema presence.
- Re-verify framework/project segregation claims in file:docs/framework-project-boundary.md against current code — is `SectionRenderer` (file:src/lib/components/complex/SectionRenderer.svelte) still hardcoding component names? Are team/testimonials/clients still read-only stubs?
- Re-verify all 7 existing comments in file:docs/traycer/Review___PM2_to_PM3_Migration_Review.md against current code state. Assign each a fresh verdict — Fixed / Partially Fixed / Still Open — with file/line evidence. Note: initial spot-check already suggests Comment 1 (SectionRenderer hardcoding) and Comment 7 (CSP unsafe-inline) may be resolved or superseded — confirm definitively.

**Out of scope:** fixing any gaps found (this is investigation only); security-specific findings (owned by the Security ticket); deploy/infra findings (owned by the DevOps ticket).

## Deliverable

A findings section (to be merged into the final consolidated spec) containing:

- Full PM2→PM3 mapping table with per-item verdicts
- 7-comment re-verification table
- List of runtime/cross-cutting gaps
- Manual visual-verification checklist (handed to the user)
- Each finding tagged with severity: Critical-Security / Critical-Functional / Important / Nice-to-have

## Spec References

spec:655a5dd7-1ae7-42b5-8b82-11c1cd095482/b258627c-201b-4ee1-bb52-966d9bdd2135 — Layer 1, Findings Document Structure, Severity model

## Dependencies

None — can start immediately.