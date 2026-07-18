# Greenfield Project Start Prompt

Use this document as the main prompt to start a brand-new Puppet Master project.
Fill the placeholders, then paste the complete prompt into a new chat.

## Complete Prompt

```text
We are starting a new greenfield Puppet Master project.

Use the PM greenfield workflow and treat this as a new project with no existing codebase to preserve.
Before editing code, check readiness and report blockers:
- confirm dependencies are installed, or install them if missing
- confirm .env and .env.example exist
- confirm database state and whether the old local DB must be reset
- confirm current pmMode in project/puppet-master.config.ts and PM_MODE in .env
- inventory project/init/concept_docs/ and read every relevant project brief, requirement, brand, content, legal, integration, or launch note before planning
- run the active project residue audit for old client content
- identify all old project-layer content that must be replaced before implementation

Project basics:
- Project name:
- Owner/company:
- Short description:
- Website or app:
- Target audience:
- Primary market/country:
- Primary language:
- Additional languages:
- RTL needed: yes/no
- Date format:
- Currency:
- Timezone:

Business goal:
- Main goal:
- Secondary goals:
- Primary conversion/action:
- What should users understand in the first 10 seconds:

Product shape:
- Public website needed: yes/no
- User app needed: yes/no
- Admin panel needed: yes/no
- Onepager or multi-page:
- Public routes/sections:
- Required admin modules:
- Required PM modules: blog/contact/portfolio/pricing/team/testimonials/faq/features/clients/none
- Custom modules or database tables:

Content and brand:
- Brand tone:
- Visual direction:
- Existing logo/assets available: yes/no
- Assets path or instructions:
- Public copy source:
- Concept docs path: project/init/concept_docs/
- Legal/company details:
- SEO title/description/keywords:
- Social preview requirements:

Integrations:
- Contact form: yes/no
- Email provider/SMTP:
- Telegram notifications:
- Analytics:
- Storage/uploads:
- External APIs:
- Auth requirements:
- Payments/subscriptions:
- Other integrations:

Deployment:
- Local-only for now or production target:
- Launch domain:
- Hosting/server target:
- DNS ready: yes/no
- Production email for TLS:
- Expected deploy mode:

Implementation permissions:
- Use the current workspace as the new project: yes/no
- Create a new folder instead: yes/no, path:
- I approve replacing/removing all old project-layer content such as client copy, settings, seed data, assets, sections, CSS, routes, and README: yes/no
- Keep PM framework core, admin, auth, legal, settings, database, i18n, deploy, Docker, scripts, and CSS architecture intact: yes
- Reset local database before new seed data: yes/no
- Seed demo data: yes/no

Required execution:
1. Preload PM context from AGENTS.md, contributing/CONTRIBUTING.md, project/puppet-master.config.ts, and docs/NEXT_CHAT_HANDOFF.md.
2. Automatically scan project/init/concept_docs/:
   - list files in stable sorted order
   - read supported text files: .md, .txt, .json, .yml, .yaml, .csv
   - summarize requirements, constraints, open questions, and conflicts
   - treat concept docs as project input unless they conflict with explicit user instructions
   - ask only about conflicts that would make implementation risky
3. Identify derivative as PMNative or PMEmbedded.
4. Separate work into:
   - PM Framework Core Layer: preserve unless a framework change is explicitly needed
   - Project Layer: replace old client content with the new project
5. Use prompt-driven setup, not the browser setup wizard:
   - generate the completed project configuration directly from this prompt and project/init/concept_docs/
   - set `pmMode: 'build'` in `project/puppet-master.config.ts`
   - set `PM_MODE=build` in `.env` and `.env.example`
   - use `pmMode: 'unconfigured'` only if I explicitly ask to use the browser `/init` wizard instead of prompt-driven setup
   - do not leave the project in `unconfigured` after prompt-driven setup is complete
6. Replace project-specific files:
   - README.md
   - project/puppet-master.config.ts
   - i18n/content.ts
   - server/database/seed.ts
   - public logos, favicon, launch assets, and social preview assets
   - old client-only sections and CSS imports
   - .env.example project defaults
7. Run the residue audits:
   - rg -n "TODO_PROJECT|OLD_PROJECT|CLIENT_PLACEHOLDER|example\\.com" README.md .env.example project i18n server app public QWEN.md CLAUDE.md
   - rg -n "old-project|client-specific|project-specific" app project i18n server public
8. Prepare the database:
   - do not reuse old project data
   - run npm run db:push
   - run npm run db:seed only after seed data is project-appropriate
9. Start or verify the local dev server and give me the local URL.
10. Validate with the available project scripts:
   - npm run lint
   - npm run test:run
   - npm run build
   - npm run check:versions
11. End with:
   - files changed
   - project/init/concept_docs/ files used
   - validation results
   - remaining blockers
   - Global General Security Engineer decision
   - Global General DevOps Specialist decision
   - exact next step

Do not remove PM framework core code.
Do not keep old project content in active runtime, seed data, public assets, config, or README unless I explicitly approve it as historical documentation.
```

## Minimum Short Prompt

```text
Start a greenfield Puppet Master project.
It is a [website/app] for [project name], targeting [audience] in [country/languages].
Use these sections/modules: [sections/modules].
Admin is [needed/not needed].
I approve replacing all old project-layer content in this workspace while preserving PM framework core.
```
