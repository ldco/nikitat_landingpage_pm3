# Step 07 — Admin fixes: dashboard RBAC guard + portfolios form error handling

> **Phase:** Short-term (Important) | **Findings:** I-9, I-10 | **Severity:** Functional

## What this step is

Two small admin-layer defects with real UX/security impact:

- I-9: the `/admin` dashboard page has **no explicit RBAC guard** — it relies on the parent layout's auth redirect, so it is authenticated but not authorization-checked per page.
- I-10: `admin/portfolios/create` returns a plain `{ success: false }` object instead of SvelteKit's `fail()`, so `$page.form` is never populated and `use:enhance` cannot surface field errors.

## What we are doing

1. Add `requireAdminPage(event, 'dashboard')` to the dashboard `load` (and any actions), consistent with every other admin page.
2. Change the portfolios create action to return `fail(400, { fieldErrors })`, matching the blog/faq/features admin forms.

## Why

- I-9: `src/routes/admin/+page.server.ts:5-18` — the load has no `requireAdminPage` call. The RBAC chain (`resolveAdminPageAccess` → `isAdminPageAllowed`) is the project's single source of truth; the dashboard bypasses it, which breaks the "menu ↔ auth cannot drift" invariant. `ADMIN_CONFIG` has no explicit `dashboard` key — it relies on `defaultEnabled: true`, so the guard should still pass for authorized roles.
- I-10: `src/routes/admin/portfolios/create/+page.server.ts:30` — `return { success: false, error: 'validation.required' }`. The blog form (the canonical reference) uses `return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })`. The portfolio form's approach silently swallows validation errors in the UI.

## Plan

### Task 1: Add dashboard RBAC guard (I-9)

- **File:** `src/routes/admin/+page.server.ts`
- **Change:** Import `requireAdminPage` from the admin RBAC util; call `requireAdminPage(event, 'dashboard')` at the top of `load`. If a page-id for the dashboard is not recognized by `ADMIN_PAGE_DEFS`, verify `defaultEnabled` covers it before wiring; otherwise add a `dashboard` entry.

### Task 2: Fix portfolios create fail() (I-10)

- **File:** `src/routes/admin/portfolios/create/+page.server.ts:30`
- **Change:** Replace the plain-object error return with `return fail(400, { fieldErrors: parsed.error.flatten().fieldErrors })`. Confirm the page component reads `$page.form.fieldErrors` (mirror the blog create page).

## Verification

- [ ] `npm run check`, `npm run lint` pass
- [ ] As a role denied the dashboard, `GET /admin` returns 403 (not just redirect)
- [ ] As an authorized role, `GET /admin` returns 200 with stats
- [ ] Submit an invalid portfolio create form → field errors render inline (matching blog behavior)
- [ ] `npm test` passes (add/extend a test if the admin-pages suite covers these routes)

## Notes / Risks

- Confirm the dashboard page-id exists in `ADMIN_PAGE_DEFS` before relying on `defaultEnabled`; if not, add the entry so the guard is meaningful rather than a no-op.
- Do not change the CSRF or auth flow — only the authorization call site.
