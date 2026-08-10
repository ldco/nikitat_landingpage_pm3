# Step 29 — N-14: Exclude ansible/ from Docker build context

> **Phase:** Nice-to-have | **Finding:** N-14 | **Severity:** Recommendation

## What this step is

`.dockerignore` does not exclude the `ansible/` directory, so the entire Ansible tree (playbooks, roles, `inventory.yml`) is copied into the Docker build context unnecessarily — slowing builds and bloating context.

## What we are doing

Add `ansible/` (plus other non-build dirs like `.kilo/`, `.husky/`, `.nocowboy/`, `contributing/`, `legal/`, `project/`, `messages/`, `playwright.config.ts`, `lighthouserc.js`) to `.dockerignore`.

## Why

Repo-verified — the audit's `.dockerignore` review (Layer 4 §4.2) found `ansible/` and other dev/test dirs allowed into the build context. Harmless but wasteful.

## Plan

### Task 1: Extend .dockerignore

- **File:** `.dockerignore`
- **Change:** Add `ansible/`, `.kilo/`, `.husky/`, `.nocowboy/`, `build/`, `contributing/`, `legal/`, `project/`, `messages/`, `playwright.config.ts`, `lighthouserc.js` (keep the existing `node_modules`, `data/`, `.env`, `.git` exclusions).

### Task 2: Verify build still works

- **File:** `Dockerfile`
- **Change:** Confirm the Dockerfile doesn't COPY any now-excluded path (it shouldn't — it copies `.output`, `scripts`, `drizzle`, i18n files).

## Verification

- [ ] `docker build --no-cache` succeeds
- [ ] `docker buildx build --check` (or `docker build`) context size drops measurably
