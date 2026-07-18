# Brownfield Project Start Prompt

Use this document as the main prompt to migrate an existing project into Puppet Master.
Fill the placeholders, then paste the complete prompt into a new chat.

## Complete Prompt

```text
We are starting a brownfield migration into Puppet Master.

Use the PM brownfield migration workflow.
This is an existing project/codebase that must be analyzed, decomposed, mapped, and migrated carefully into PM without losing behavior, data, routes, SEO value, auth rules, or deployment rollback options.

Before editing code, check readiness and report blockers:
- confirm dependencies are installed, or install them if missing
- confirm .env and .env.example exist
- confirm current pmMode in project/puppet-master.config.ts and PM_MODE in .env
- inventory project/init/concept_docs/ and read every relevant migration brief, route inventory, schema note, auth note, cutover note, or requirement before planning
- confirm where the source code to migrate is located
- if no source code exists, stop and redirect to greenfield PM init
- identify whether the target should be PMNative or PMEmbedded

Source project:
- Existing project name:
- Source code path or repo URL:
- Concept docs path: project/init/concept_docs/
- Current stack/framework:
- Current frontend framework:
- Current backend framework:
- Current database:
- Current auth/session system:
- Current hosting/deployment:
- Current domain(s):
- Current production status: live/staging/local only
- Must preserve live SEO/routes: yes/no
- Must preserve users/accounts/sessions: yes/no
- Must preserve uploaded files/media: yes/no

Migration goals:
- Why migrate to PM:
- What must be identical after migration:
- What can be redesigned:
- What can be removed:
- Target launch/cutover date:
- Acceptable downtime:
- Rollback requirements:

Business and UX:
- Target audience:
- Primary market/country:
- Primary language:
- Additional languages:
- RTL needed: yes/no
- Date format:
- Currency:
- Public routes/pages to preserve:
- New routes/pages to add:
- Important conversion flows:
- Critical admin workflows:

Existing system domains to analyze:
- Frontend routes/pages/layouts:
- Frontend components:
- State management:
- Forms:
- Backend APIs:
- Background jobs/workers:
- Webhooks:
- Database tables:
- Data migration requirements:
- Auth roles/permissions:
- File uploads/storage:
- Email/notifications:
- Payment/subscription flows:
- Analytics/tracking:
- SEO metadata/sitemap/redirects:
- Legal/privacy/consent:
- Deployment/runtime scripts:
- Environment variables/secrets:

Target PM shape:
- Public website needed: yes/no
- User app needed: yes/no
- Admin panel needed: yes/no
- PM modules to use natively: blog/contact/portfolio/pricing/team/testimonials/faq/features/clients/none
- Existing features to port as project layer:
- Existing features to keep external and proxy/integrate:
- Framework extensions that may be needed:
- Custom database tables needed:
- Custom API routes needed:

Implementation permissions:
- Use the current workspace as the PM migration target: yes/no
- Put source code under import/ if not already present: yes/no
- I approve optional Git setup after migration planning: yes/no
- I approve replacing current project-layer content in the PM target as needed: yes/no
- Preserve PM framework core, admin, auth, legal, settings, database, i18n, deploy, Docker, scripts, and CSS architecture intact: yes
- Do not delete source code after import unless I explicitly approve: yes
- Database migration may be planned but not executed against production without explicit approval: yes

Required execution:
1. Preload PM context from AGENTS.md, contributing/CONTRIBUTING.md, project/puppet-master.config.ts, and docs/NEXT_CHAT_HANDOFF.md.
2. Automatically scan project/init/concept_docs/:
   - list files in stable sorted order
   - read supported text files: .md, .txt, .json, .yml, .yaml, .csv
   - summarize migration requirements, preserved behavior, constraints, risks, and conflicts
   - treat concept docs as source/migration input unless they conflict with explicit user instructions
   - ask only about conflicts that would make migration planning unsafe
3. Capture baseline drift:
   - Git is optional and outside PM init/migration planning; do not block on repository, branch, commit, or status checks
   - latest handoff entry
   - current pmMode
   - current derivative assumption
4. Detect source code:
   - if path is missing or contains only docs, stop and redirect to greenfield
   - default source path is import/ if I did not provide one
5. Decompose the source system by domain:
   - frontend routes/components/layouts/state
   - backend APIs/middleware/jobs
   - database schema/data/migrations
   - auth/session/roles
   - i18n/localization
   - CSS/design system
   - infra/env/deploy/runtime contracts
6. Build a domain mapping matrix with one action per artifact:
   - PM_NATIVE: use PM capability as-is
   - EXTEND_PM: framework-level extension candidate
   - PORT_TO_PROJECT: implement in project layer only
   - PROXY_EXTERNAL: keep external service and integrate
   - SKIP: not needed
7. Separate the work into:
   - PM Framework Core Layer: preserve or extend only when reusable
   - Project Migration Layer: port/adapt the existing product
8. Use prompt-driven setup, not the browser setup wizard:
   - generate the completed PM target configuration directly from this prompt, source analysis, and project/init/concept_docs/
   - set `pmMode: 'build'` in `project/puppet-master.config.ts` when the PM target config is ready
   - set `PM_MODE=build` in `.env` and `.env.example`
   - use `pmMode: 'unconfigured'` only if I explicitly ask to use the browser `/init` wizard instead of prompt-driven migration setup
   - do not leave the project in `unconfigured` after prompt-driven migration setup is complete
9. Create a phased migration plan:
   - Phase 1: Foundation, config, auth baseline, schema strategy
   - Phase 2: Core port, key routes, APIs, and domain flows
   - Phase 3: UX/system fit, i18n, styling, accessibility, RBAC
   - Phase 4: Cutover, data migration, redirects, verification, rollback
10. Include risk controls:
   - data integrity
   - auth/permission drift
   - SEO/routing parity
   - secret movement
   - deployment rollback
   - test coverage gaps
11. Do not start a big-bang rewrite. Prefer incremental migration slices with acceptance criteria.
12. Before production-affecting work, require explicit approval.
13. Validation plan must include:
   - route parity checks
   - API contract checks
   - database migration dry run
   - auth/RBAC tests
   - SEO redirect/sitemap checks
   - npm run lint
   - npm run test:run
   - npm run build
   - npm run check:versions
14. End with a PM Brownfield Migration Report:
   - input assessment
   - project/init/concept_docs/ files used
   - layer model
   - domain mapping matrix
   - phased migration plan
   - risks and mitigations
   - validation gates
   - Global General Security Engineer decision
   - Global General DevOps Specialist decision
   - Go/No-Go recommendation
   - exact next implementation slice

Do not remove PM framework core code.
Do not silently change auth, data, routes, SEO, secrets, or deployment behavior.
Do not run production data migration, destructive cleanup, or deploy/cutover steps without explicit approval.
```

## Minimum Short Prompt

```text
Start a brownfield migration into Puppet Master.
The source project is at [path or repo URL].
It currently uses [stack] with [database/auth/deploy].
Preserve [routes/data/auth/SEO/uploads].
Target PM shape is [website/app/admin/modules].
Analyze first, produce the migration mapping and phased plan, then start only the first approved safe slice.
```
