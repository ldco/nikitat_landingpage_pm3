# Concept Docs Intake

Put project briefs, client notes, screenshots descriptions, feature lists, brand notes, legal notes, migration notes, or product requirements in this folder before starting a PM greenfield or brownfield chat.

The starter prompts in `project/` require the agent to automatically scan this folder before planning or coding.

## Supported Inputs

- Markdown: `.md`
- Text: `.txt`
- JSON: `.json`
- YAML: `.yml`, `.yaml`
- CSV: `.csv`

For PDFs, images, Figma exports, or office documents, add a short Markdown companion file that explains what the asset contains and what decisions it should drive.

## Naming

Use ordered names when sequence matters:

```text
01_project_brief.md
02_brand_notes.md
03_features.md
04_content_outline.md
05_launch_constraints.md
```

For brownfield migrations:

```text
01_existing_system_summary.md
02_route_inventory.md
03_database_notes.md
04_auth_roles.md
05_cutover_constraints.md
```

## Minimum Useful Greenfield Brief

```text
Project name:
Audience:
Market/languages:
Website or app:
Main goal:
Sections/routes:
Modules:
Brand direction:
Integrations:
Launch domain:
Constraints:
```

## Minimum Useful Brownfield Brief

```text
Source project path/repo:
Current stack:
Current database:
Current auth:
Routes to preserve:
Data to preserve:
SEO/redirect requirements:
Deployment/cutover constraints:
Features to port:
Features to redesign/remove:
```

## Rule

Files in this folder are source context, not implementation by themselves. The agent must summarize what it found, resolve conflicts with the user, and then map the requirements into PM config, seed data, routes, modules, components, APIs, and validation tasks.
