# PM v3 Compliance Repair Plan — FABRICA22

**Created:** 2026-08-07
**Scope:** ~50 violations across ~30 files from full compliance audit
**Strategy:** Fix by priority group, one atomic commit per group

---

## Phase 0 — Pre-flight Verification
Run typecheck + lint to establish baseline before any changes:
```
npm run check && npm run lint
```

---

## Phase 1 — CRITICAL Security Fixes (4 files)

### 1.1 Terminal Command Injection — `src/routes/api/admin/terminal/+server.ts`
- **Issue:** `cmd.startsWith(ac)` bypassable via `;`/`&&`; `execSync(cmd)` executes full shell string
- **Fix:**
  - Change `execSync` to `execFileSync` with arg arrays (no shell interpretation) OR
  - Replace `startsWith` allowlist with exact-match set + whitelisted args
  - Add audit call (`audit.terminalCommand`)
  - Return `{ success: false, error: { code: 'terminal.error', message: '...' } }` on exec failure instead of `success:true` with error message
  - Remove error message exposure: replace `e.message` with generic i18n key-based error

### 1.2 Settings Token Exposure — `src/routes/api/settings/+server.ts`
- **Issue:** Public `/api/settings` returns all keys including `contact.telegramBotToken`, `contact.telegramChatId`
- **Fix:** Filter sensitive keys before serializing:
  - Whitelist approach: only return settings in `public` group or
  - Blacklist: strip keys matching `*Token*`, `*token*`, `*Secret*`, `*secret*`, `*Key*`, `*ChatId*`
  - Add admin auth requirement to this endpoint? No — it's used by the frontend. Instead, add a public `settings.publicApiKeys` config or use `group` column to filter

### 1.3 Users PasswordHash Exposure + Privilege Escalation — `src/routes/api/admin/users/+server.ts` + `[id]/+server.ts`
- **Issue (a):** `db.select().from(schema.users)` returns `passwordHash` in GET responses
- **Fix:** Add explicit column selection: `db.select({ id, email, name, role, createdAt, updatedAt }).from(users)` omitting `passwordHash`
- **Issue (b):** Admin can create `role: 'master'` → privilege escalation
- **Fix:** In POST handler, reject `role === 'master'` unless actor is `master` (add `requireMaster` check or downgrade to highest allowed role)

### 1.4 Logs Path Traversal — `src/routes/api/admin/logs/+server.ts`
- **Issue:** `join(logDir, \`${type}.log\`)` with unvalidated `type` param
- **Fix:** Zod validate `type` against allowlist of known log names; path disclosure in response → remove `path` from response; validate result path is still within `logDir` via `path.resolve` + startsWith check
- Also fix `admin/translations/+server.ts:5-9` — add `requireAdmin` guard

---

## Phase 2 — Broken Functionality (2 files)

### 2.1 Portfolios Delete — `src/routes/admin/portfolios/+page.svelte`
- **Issue:** DELETE fetch to `/admin/portfolios` which has no DELETE handler → 405
- **Fix:** Change fetch to `POST /admin/api?module=portfolios` with `{ module: 'portfolios', id }` body; add CSRF header; add `$state` pending/error/success

### 2.2 Clients Page — `src/routes/admin/clients/+page.svelte`
- **Issue:** `let items = []` hardcoded, ignores server data
- **Fix:** Change to `let { data } = $props()` and bind to `data.items`; then `+page.server.ts` needs typed load

---

## Phase 3 — Admin Form Contracts (12 forms)

All 10 admin create/edit + login + admin/api need CSRF header, `$state` states, and Zod error rendering.

### 3.1 Login — `src/routes/admin/login/+page.svelte`
- **Fix:** Add `x-csrf-token` header via `getCsrfToken()` from `$lib/utils/auth`; add client-side Zod parse (or use the server return); add `$state` for `pending`/`error`/`success`

### 3.2 Admin API — `src/routes/admin/api/+server.ts`
- **Fix:** Replace `as string`/`Number()` casts with Zod schema: `z.object({ module: z.enum([...]), id: z.number().int().positive() })`

### 3.3 All create/edit pages (8 pairs: blog, faq, features, pricing, portfolios)
Pattern for each:
- `+page.server.ts`: add Zod schema for form data, return `{ success, errors }` that page can render
- `+page.svelte`: add `<input type="hidden" name="csrf" value={getCsrfToken()}>` to each form OR add `x-csrf-token` header for JS submits; add `$state` for pending/error/success; render validation errors from `form?.errors`

Files:
- `src/routes/admin/blog/create/+page.server.ts` + `+page.svelte`
- `src/routes/admin/blog/[id]/edit/+page.server.ts` + `+page.svelte`
- `src/routes/admin/faq/create/+page.server.ts` + `+page.svelte`
- `src/routes/admin/faq/[id]/edit/+page.server.ts` + `+page.svelte`
- `src/routes/admin/features/create/+page.server.ts` + `+page.svelte`
- `src/routes/admin/features/[id]/edit/+page.server.ts` + `+page.svelte`
- `src/routes/admin/pricing/create/+page.server.ts` + `+page.svelte`
- `src/routes/admin/pricing/[id]/edit/+page.server.ts` + `+page.svelte`
- `src/routes/admin/portfolios/create/+page.server.ts` + `+page.svelte`
- `src/routes/admin/portfolios/[id]/edit/+page.server.ts` + `+page.svelte`

Also: `admin/+layout.svelte:92` — change `fetch('/api/admin/contacts/unread')` to use stores or pass via layout data.

---

## Phase 4 — Route Contract: Typed Loads (30 files)

Replace all `export function load(event: RequestEvent)` with properly typed `PageServerLoad`/`LayoutServerLoad`.

### 4.1 Layout
- `src/routes/admin/+layout.server.ts` → `LayoutServerLoad`
- `src/routes/admin/+page.server.ts` → `PageServerLoad`

### 4.2 Portfolio + Legal
- `src/routes/portfolio/+page.server.ts`
- `src/routes/portfolio/[slug]/+page.server.ts`
- `src/routes/legal/[slug]/+page.server.ts`

### 4.3 All admin list pages (15 files)
- `admin/blog/+page.server.ts`
- `admin/clients/+page.server.ts`
- `admin/contacts/+page.server.ts`
- `admin/faq/+page.server.ts`
- `admin/features/+page.server.ts`
- `admin/health/+page.server.ts`
- `admin/audit/+page.server.ts`
- `admin/portfolios/+page.server.ts`
- `admin/pricing/+page.server.ts`
- `admin/roles/+page.server.ts`
- `admin/settings/+page.server.ts`
- `admin/team/+page.server.ts`
- `admin/testimonials/+page.server.ts`
- `admin/translations/+page.server.ts`
- `admin/users/+page.server.ts`

### 4.4 Admin create/edit page.server.ts (10 files)
Same list as Phase 3.3

---

## Phase 5 — i18n: Replace Hardcoded Strings (22 files)

All admin pages use hardcoded English. The `$lib/utils/admin-translations.ts` module already provides `getAdminT()`. Pattern:

### 5.1 Core admin files
- `src/routes/admin/+layout.svelte` — `adminSections`, `Dashboard`, `P`, `PM Admin`, `Logout`, `Toggle menu`
- `src/routes/admin/+page.svelte` — `Dashboard`, `Users`, `Portfolios`, `Blog Posts`, `Contacts`
- `src/routes/admin/login/+page.svelte` — use existing `m.*` pattern (login page has `m = useAdminMessages()`)

### 5.2 All admin list pages (14 files)
`blog`, `clients`, `contacts`, `faq`, `features`, `health`, `audit`, `portfolios`, `pricing`, `roles`, `settings`, `team`, `testimonials`, `translations`, `users`
Pattern: replace `"Dashboard"`, `"total"`, `"No X found."`, headings, badges with `t[...]` keys from admin translations.

### 5.3 Portfolio option labels
- `admin/portfolios/create/+page.svelte` — Branding/Gallery/Case Study/Website/Brandbook → i18n
- `admin/portfolios/[id]/edit/+page.svelte` — same

### 5.4 Public pages
- `src/routes/blog/+page.svelte:34` — `{post.readingTimeMinutes} min read` → `m.blog_reading_time({ minutes: post.readingTimeMinutes })`
- `src/routes/blog/[slug]/+page.svelte:45` — same
- `src/routes/legal/[slug]/+page.svelte:14` — `<title>Legal — {SEO.title}</title>` → use `m.legal_page_title({ title: SEO.title })` or similar i18n

### 5.5 API hardcoded messages
- `src/routes/api/auth/logout/+server.ts:12` — `'Logged out'` → i18n key or remove message
- `src/routes/api/contact/submit/+server.ts:67` — `'Message sent successfully'` → i18n key pattern `'contact.success'` (Zod error messages already i18n at the schema level, line 30-33 uses default Zod English — check if form.schema has i18n keys)

---

## Phase 6 — Engineering Cleanup (5 files)

### 6.1 `src/hooks.server.ts:184-185`
- Replace `segments[0]!` / `segments[1]!` with proper null guards: `const s0 = segments[0]; const s1 = segments[1]; if (!s0 || !s1) return resolve(event);`

### 6.2 `src/lib/server/db/seed.ts:58,90,99,447,463`
- Replace `catch { /* skip */ }` / `catch { // fall through }` with `catch (e: unknown) { logger.debug(...) }` calls and proper error tracking
- Remove `console.log` printing plaintext passwords (line 364): change to `logger.debug` with `role` and `email` only, never password

### 6.3 `src/lib/components/complex/TheHeader.svelte`
- Add JSDoc block with `@props` listing
- The `.header-pm` class usage: this is framework infrastructure per comments ("PM2 skeleton/header.css parity") but it's a BEM class. Per rule A2's strict reading, `@layer components` is "reserved for framework infrastructure ONLY (page transitions, theme icons, hamburger)". `.header-pm` = header bar. Acceptable as "framework infrastructure" since it's the framework's own fixed header. No change needed unless we want to be pedantic — then refactor to Tailwind utilities. **→ Leave as-is, note as accepted infra exception.**

### 6.4 `src/routes/[section]/+page.svelte`
- Move 404 check from `$effect` (client-only) to SSR: use `$derived` + template guard: `{#if !section} {#if browser} 404 {:else} <p>Section not found</p> {/if}` — or add SSR load check
- Better: convert to load function pattern

### 6.5 `src/lib/server/security/headers.ts`
- Remove `'unsafe-eval'` entirely (no eval usage found); keep `'unsafe-inline'` with nonce comment; remove duplicate `'unsafe-eval'` on line 41

### 6.6 `src/lib/server/auth/totp.ts`
- Remove hardcoded `'development-totp-key'` fallback; throw error if `TOTP_ENCRYPTION_KEY` unset in production, warn in dev

---

## Phase 7 — Admin List API Zod Validation (8 files)

Replace `getPaginationParams(event.url)` with Zod `paginationSchema` (already defined at `utils/validation.ts:17-20`).

Files:
- `src/routes/api/admin/blog/+server.ts`
- `src/routes/api/admin/contacts/+server.ts`
- `src/routes/api/admin/faq/+server.ts`
- `src/routes/api/admin/features/+server.ts`
- `src/routes/api/admin/portfolios/+server.ts`
- `src/routes/api/admin/pricing/+server.ts`
- `src/routes/api/admin/audit-logs/+server.ts`
- `src/routes/api/admin/logs/+server.ts` (replace manual query parsing)

Pattern: `const parsed = paginationSchema.safeParse(Object.fromEntries(event.url.searchParams)); if (!parsed.success) error(400, ...); const { page, pageSize } = parsed.data;`

---

## Phase 8 — Auditable Action Logging (3 files)

Add missing audit calls:
- `src/routes/api/auth/logout/+server.ts` — call `audit.logout`
- `src/routes/api/admin/terminal/+server.ts` — call `audit.terminalCommand`
- `src/routes/api/admin/ops/+server.ts` — call `audit.opsAction`
- `src/routes/api/admin/support-bundle/+server.ts` — call `audit.supportBundleExport`

---

## Verification Checklist

After each phase:
- [ ] `npm run check` (TypeScript)
- [ ] `npm run lint` (ESLint)
- [ ] `npm run build` (production build)
- [ ] No new warnings or errors

After all phases:
- [ ] `npm run test` (Vitest)
- [ ] `npm run dev` → smoke test: homepage loads, contact form submits, admin login works, admin CRUD works
- [ ] Verify `/api/settings` no longer leaks `telegramBotToken`
- [ ] Verify `GET /api/admin/users` no longer returns `passwordHash`
- [ ] Verify terminal commands can't be injected
- [ ] Verify logs endpoint rejects path traversal
- [ ] Verify portfolios delete works
- [ ] Verify clients page shows data

---

## Migration Safety

- No database schema changes required
- No environment variable changes (except TOTP key now required in prod)
- All fixes are backward-compatible on the API contract (error response shapes unchanged)
- Phase order ensures no dependent breaks

## Rollback Strategy

- Each phase is one git commit → `git revert <commit>` undoes a phase cleanly
- Phase 1 security fixes are independent of phases 2-8, so critical fixes deployable in isolation
