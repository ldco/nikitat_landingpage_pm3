I have the following comments after thorough review of file. Implement the comments by following the instructions verbatim.

---
## Comment 1: Custom sections are not truly project-extensible because `SectionRenderer` hardcodes component names, including the project-specific `SectionF22` path.

In `src/lib/components/complex/SectionRenderer.svelte`, remove the manual component-name branching and resolve the component directly from `SECTION_REGISTRY`. Define a typed prop-adapter layer so data-backed sections still receive the correct typed payload while project-only sections can render without framework edits. Remove the `SectionF22` special case and add a regression test or proof path showing that a newly registered project section renders without touching framework files.

### Relevant Files
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/lib/components/complex/SectionRenderer.svelte
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/lib/components/sections/registry.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/project/registry.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/docs/framework-project-boundary.md
---
## Comment 2: Admin navigation and authorization bypass `ADMIN_CONFIG`, so disabled modules still appear and configured per-role access is never enforced.

In `src/routes/admin/+layout.svelte`, derive the admin navigation from `ADMIN_CONFIG` and `MODULES` instead of the hardcoded section arrays. In `src/lib/server/utils/admin-rbac.ts`, replace the coarse `requireAdmin()` logic with page-aware authorization that evaluates configured roles and, where applicable, stored role permissions. Update each admin page and admin API route to pass its page id so menu visibility and server authorization use the same source of truth.

### Relevant Files
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/project/site-config.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/routes/admin/+layout.svelte
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/lib/server/utils/admin-rbac.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/routes/admin/settings/+page.server.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/routes/api/admin/features/+server.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/routes/api/admin/translations/+server.ts
---
## Comment 3: The non-onepager `[section]` route validates section ids but never loads the data required by dynamic content sections.

Extract the section-content loader from `src/routes/+page.server.ts` into a shared helper or service. Call that shared loader from `src/routes/[section]/+page.server.ts` and pass the resulting `SectionContent` into `src/routes/[section]/+page.svelte` so `SectionRenderer` receives the same typed data in non-onepager mode. Add coverage for at least one data-backed section in both routing modes.

### Relevant Files
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/routes/[section]/+page.server.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/routes/[section]/+page.svelte
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/routes/+page.server.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/lib/components/complex/SectionRenderer.svelte
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/lib/components/sections/types.ts
---
## Comment 4: PM3 exposes team, testimonials, and clients surfaces, but these modules remain read-only stubs compared with PM2.

Add `src/lib/server/services/team.ts`, `src/lib/server/services/testimonials.ts`, and `src/lib/server/services/clients.ts` that own the queries and locale joins for these modules. Implement matching admin CRUD routes under `src/routes/api/admin/team`, `src/routes/api/admin/testimonials`, and `src/routes/api/admin/clients`, then extend `SectionContent`, `src/routes/+page.server.ts`, `src/routes/[section]/+page.server.ts`, and `SectionRenderer.svelte` so the public sections receive real data. If parity is not immediate, hide these modules and routes until the port is complete.

### Relevant Files
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/routes/admin/team/+page.server.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/routes/admin/clients/+page.server.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/routes/admin/testimonials/+page.server.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/lib/components/complex/SectionRenderer.svelte
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/lib/components/sections/types.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app-nuxt/server/api/admin/team/index.get.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app-nuxt/server/api/admin/team/index.post.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app-nuxt/server/api/admin/testimonials/index.get.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app-nuxt/server/api/admin/clients/index.get.ts
---
## Comment 5: Visible English literals still live in code, and the PM3 validator has no guard against untranslated regressions.

Replace the visible literals in `src/project/site-config.ts`, `src/routes/admin/+layout.svelte`, and `src/lib/components/sections/SectionTestimonials.svelte` with translation keys or seeded DB content. Extend `scripts/pm3-validator.mjs` to fail on new user-facing string literals in framework and project UI files, and document the narrow set of allowed exceptions so agents have an enforceable rule.

### Relevant Files
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/project/site-config.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/routes/admin/+layout.svelte
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/lib/components/sections/SectionTestimonials.svelte
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/scripts/pm3-validator.mjs
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app-nuxt/AGENTS.md
---
## Comment 6: The unified `t()` helper never falls back to Paraglide and leaks raw keys when database translations are missing.

In `src/lib/stores/content.svelte.ts`, implement the documented fallback order: database content, framework message catalog, explicit fallback value, then the key as a last resort. Wire the helper to the Paraglide messages exposed by `src/lib/i18n.ts`, and add tests proving that missing database keys still render usable text for new locales.

### Relevant Files
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/lib/stores/content.svelte.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/lib/i18n.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/routes/+layout.server.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/routes/+layout.svelte
---
## Comment 7: The CSP currently permits inline scripts and styles and ignores the generated nonce, so XSS containment is largely ineffective.

In `src/lib/server/security/headers.ts`, remove the `unsafe-inline` allowances and emit a nonce-based policy that matches the nonce generated in `src/hooks.server.ts`. Thread that nonce into the HTML and head rendering path so any required inline blocks can opt in safely, then verify the tightened policy against the current app shell before enabling it in production.

### Relevant Files
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/hooks.server.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/lib/server/security/headers.ts
- /run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/src/app.html
---