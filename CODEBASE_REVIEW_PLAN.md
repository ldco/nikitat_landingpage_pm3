# Codebase Review Plan: Puppet Master Project

## Objective
To conduct a comprehensive review of the "Puppet Master" codebase (a Nuxt 4 + Drizzle project), focusing on architecture, code quality, security, and feature implementation.

## Phase 1: Architectural Review
- **Goal:** Understand the high-level structure, modules (`app/`, `pm-core/`, `server/`, `shared/`), and design patterns.
- **Actions:**
  - Map out the directory structure and module boundaries.
  - Review `nuxt.config.ts`, `drizzle.config.ts`, and `project/puppet-master.config.ts`.
  - Analyze the integration between `pm-core` and the main application.
  - Review the CSS architecture (`docs/styles/CSS_ARCHITECTURE.md`).

## Phase 2: Backend and Database Review
- **Goal:** Assess the robustness of the server APIs and database schema.
- **Actions:**
  - Review Drizzle schema definitions and migration scripts.
  - Analyze the Nitro server API routes (`server/api/`).
  - Check for proper error handling, input validation (Zod), and API envelope consistency (`scripts/audit-api-envelope.mjs`).

## Phase 3: Frontend Review
- **Goal:** Evaluate the UI components, state management, and SSR safety.
- **Actions:**
  - Review Vue components in `app/components/` and pages in `app/pages/`.
  - Analyze state management using Pinia (`app/stores/`).
  - Review SSR hydration safety practices (as outlined in `docs/guides/ssr-safety.md`).

## Phase 4: Testing and QA Review
- **Goal:** Assess test coverage and CI/CD readiness.
- **Actions:**
  - Review Unit/Integration tests (`tests/server/`, `tests/components/`, etc.) using Vitest.
  - Review E2E tests (`e2e-playwright/` or `tests/e2e/`) using Playwright.
  - Analyze linting and formatting configurations (`eslint.config.js`, `prettierrc`).

## Phase 5: Deployment and DevOps Review
- **Goal:** Review deployment scripts, infrastructure as code, and operational setup.
- **Actions:**
  - Review `Dockerfile` and `docker-compose` equivalents.
  - Analyze Ansible playbooks (`ansible/`).
  - Review deployment scripts (`scripts/deploy*.sh`).

## Execution Strategy
Due to the size of the codebase, the review will be conducted sequentially using the `codebase_investigator` sub-agent for each phase. Findings will be summarized after each phase.

## Verification
A final summary report will be generated highlighting architectural strengths, potential tech debt, security concerns, and recommendations for improvement.
