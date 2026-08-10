# Layer 3 — Security Audit Findings

**Audit Date:** 2026-08-10  
**PM3:**
`/run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app/`  
**PM2 Reference:**
`/run/media/ldco/3734114f-7123-41f5-8f63-7f43c94879eb/NEW_ORDER/FABRICA22/nikitat/app-nuxt/`

---

## 1. Session/Auth

| Component | Verdict | Issues |
|-----------|---------|--------|
| **Password hashing** (`src/lib/server/auth/password.ts`) | ✅ | scrypt (SALT_LENGTH=16, KEY_LENGTH=64). `timingSafeEqual` for comparison. Identical to PM2. |
| **Password policy** | ✅ | Min 8 chars, require upper/lower/digit/special, reject common passwords. Strength scoring (weak/fair/good/strong). Identical to PM2. |
| **Session management** (`src/lib/server/auth/session.ts`) | ✅ | DB-stored sessions. 24h TTL. `extendSession()`, `cleanupExpiredSessions()`. |
| **Session cookies** (`hooks.server.ts:83-89`, `2fa/verify/+server.ts:121-127`) | ✅ | `pm-session` cookie: `httpOnly: true`, `secure: NODE_ENV==='production'`, `sameSite: 'strict'`, `path: '/'`, `maxAge: 86400`. |
| **Session fixation** (`2fa/verify/+server.ts:112-115`) | ✅ | Pre-existing session deleted before creating new one after 2FA verification. PM2 parity. |
| **Account lockout** (`src/lib/server/auth/lockout.ts`) | ✅ | 5 failed attempts → 30 min lockout. Auto-reset after 1h without failures. Identical to PM2 (`accountLockout.ts`). |
| **TOTP / 2FA** (`src/lib/server/auth/totp.ts`) | ✅ | `otpauth` lib, SHA1, 6-digit, 30s period. AES-256-GCM secret encryption. Backup codes: 10× 8-char, hashed with scryptSync. Identical to PM2. |
| **Pending 2FA** (`src/lib/server/auth/pending-2fa.ts`) | ✅ | In-memory Map. Setup TTL=5min, Verify TTL=10min. Max 5 verify attempts. Periodic cleanup. PM2 parity (`ephemeral-store.ts`). |
| **TOTP_ENCRYPTION_KEY fail-fast** (`hooks.server.ts:30-32`) | ✅ Application code enforces this correctly at boot. **However:** the Ansible deploy pipeline (`ansible/deploy.yml:113-155`) does NOT pass `TOTP_ENCRYPTION_KEY` into the container's `.env.runtime`, so this boot check becomes a guaranteed crash in production — see Layer 4 §3.4 for the full deploy trace. |
| **SESSION_SECRET** (`env.ts`) | ⚠️ Nice-to-have | `SESSION_SECRET` declared in Zod env schema but never used. Session IDs are random hex (not HMAC-signed). If sessions were ever moved to JWT/Cookie-signed format, a missing secret would go unnoticed. PM2 did not have this. |
| **logout handler** (`/api/auth/logout/+server.ts`) | ✅ | Deletes session from DB, clears cookie, audits. |

### PM2 vs PM3 Auth Comparison

| Feature | PM2 | PM3 | Parity |
|---------|-----|-----|--------|
| Password hashing | scrypt + timingSafeEqual | scrypt + timingSafeEqual | ✅ |
| Session storage | DB | DB | ✅ |
| Account lockout (5/30min) | Yes | Yes | ✅ |
| TOTP encryption | AES-256-GCM | AES-256-GCM | ✅ |
| Backup codes | 10 codes, scrypt hashed | 10 codes, scrypt hashed | ✅ |
| Pending 2FA state | ephemeral-store.ts | pending-2fa.ts | ✅ |
| Dev encryption key fallback | Hardcoded `'development-totp-key'` | Per-process ephemeral key | **PM3 improvement** |
| Env fail-fast | Checks both TOTP + Settings keys | Checks only TOTP key | ⚠️ See §8 |

---

## 2. CSRF Protection

**Pattern:** Double-submit cookie (`src/lib/server/security/csrf.ts`).

**Token:** 32 random bytes → hex (64 chars). Validated via `timingSafeEqual`.

**Cookie settings** (`hooks.server.ts:79-84`):
- `httpOnly: false` — required for double-submit (client JS must read to echo in header)
- `secure: NODE_ENV === 'production'`
- `sameSite: 'strict'`
- `path: '/'`

**PM2 CSRF Cookie Bug (FIXED in PM3):** PM2's `server/utils/csrf.ts:26` set the CSRF cookie with `httpOnly: true`, which **breaks** the double-submit pattern — JavaScript cannot read an httpOnly cookie to echo it in the `X-CSRF-Token` header. PM3 correctly uses `httpOnly: false`. This is an **improvement** over PM2.

**CSRF Exemptions** (`hooks.server.ts:90-97`):

| Route | Exempt? | Assessment |
|-------|---------|------------|
| `/api/auth/login` | ✅ Yes | Safe — no session exists yet. User is authenticating. PM2 also exempted. |
| `/api/analytics/performance` | ✅ Yes | Safe — anonymous performance beacon with no auth. No user state change. Rate limiting provides DoS protection. PM2 also exempted. |

**PM2 Additional Exemptions (NOT present in PM3):**

| Route | PM3 Status | Assessment |
|-------|-----------|------------|
| `/api/auth/logout` | ❌ NOT exempt | **Safe in practice** — the session cookie is present, and the CSRF cookie would be too. Provided the client sends the CSRF header, it works. But if a session-less attacker forges a logout of an innocent user, the worst case is the user gets logged out. |
| `/api/contact/submit` | ❌ NOT exempt | **Safe in practice but fragile** — public form. The CSRF cookie is set on page load, then echoed on submit. Users hitting the API directly without first loading the page would get blocked. The PM2 exemption was more permissive. |
| `/api/health` | ❌ NOT exempt | **Safe** — GET-only endpoint, CSRF only checks mutation methods. No exemption needed. |
| `/api/setup/config` | ❌ NOT exempt | Route exists but `PM_MODE` is `'build'`, so `/init` wizard is bypassed. Low risk. |

### CSRF + Admin Form Actions

Admin CREATE/EDIT forms use SvelteKit `<form method="POST">` with `actions` in `+page.server.ts`. The CSRF middleware checks ALL POST requests (not just `/api/`). The admin forms route to paths like `/admin/blog/create`. For these to work, the client **must** include the `X-CSRF-Token` header. SvelteKit's `use:enhance` submits via `fetch` (can set headers); native `<form>` cannot. If any admin page uses native form submission without `use:enhance`, CSRF will **always block** it with 403.

**⚠️ Important:** The CSRF handler in `hooks.server.ts:88-108` applies to ALL mutation methods regardless of route prefix. This means:
- Admin form actions → checked ✅ (blocked unless header present)
- Public contact form → checked (works if cookie was already set from page load)
- Any POST to any path → checked

---

## 3. CSP / Security Headers

### CSP (Content-Security-Policy)

**Ownership:** SvelteKit built-in CSP via `svelte.config.js` → `kit.csp`. Mode: `'nonce'`.

SvelteKit generates a per-request nonce, attaches it to inline `<script>`/`<style>` elements it emits, and writes the `Content-Security-Policy` header on page responses.

**Directives** (`svelte.config.js:24-38`):

| Directive | Value | Assessment |
|-----------|-------|------------|
| `default-src` | `'self'` | ✅ |
| `script-src` | `'self'` | ✅ No `unsafe-inline`. Nonce handled by SvelteKit. |
| `style-src` | `'self'` | ✅ No `unsafe-inline`. |
| `style-src-attr` | `'unsafe-inline'` | ⚠️ **Documented exception** — needed for SvelteKit's `<div style="display: contents">` wrapper in `src/app.html` and `atoms/LoadingBase.svelte` dynamic skeleton widths. Style ATTRIBUTES cannot load external resources or execute scripts. Acceptable. |
| `img-src` | `'self' data: blob: https:` | ✅ |
| `font-src` | `'self' data:` | ✅ |
| `connect-src` | `'self' https:` | ✅ |
| `object-src` | `'none'` | ✅ |
| `base-uri` | `'self'` | ✅ |
| `form-action` | `'self'` | ✅ Prevents form hijacking. |
| `frame-ancestors` | `'none'` | ✅ Equivalent to X-Frame-Options: DENY. |

### Security Headers (`src/lib/server/security/headers.ts`)

| Header | Value | Assessment |
|--------|-------|------------|
| `X-Content-Type-Options` | `nosniff` | ✅ |
| `X-Frame-Options` | `DENY` | ✅ (Redundant with `frame-ancestors 'none'` but good belt-and-suspenders) |
| `X-XSS-Protection` | `0` | ✅ Modern best practice — disable legacy filter that can be abused |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ✅ |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | ⚠️ **Narrower than PM2** |
| `Strict-Transport-Security` | Prod: `max-age=63072000; includeSubDomains` | ⚠️ **Missing `preload`** |
| `Strict-Transport-Security` | Dev: `max-age=0` | ✅ |

### PM2 vs PM3 Security Header Comparison

| Header | PM2 | PM3 | Delta |
|--------|-----|-----|-------|
| CSP mode | Manual nonce injection (`csp-nonce.ts`) | SvelteKit built-in nonce CSP | **PM3 cleaner** |
| `script-src` | `'self' 'nonce-*' 'strict-dynamic'` + fallbacks | `'self'` + automatic nonce | ✅ Both nonce-based |
| `style-src` | `'self' 'unsafe-inline' https://fonts.googleapis.com` | `'self'` + nonce | **PM3 stricter** |
| `upgrade-insecure-requests` | Yes (production) | No | ⚠️ **Missing** |
| `Cross-Origin-Opener-Policy` | `same-origin` | **NOT SET** | ⚠️ **Missing** |
| `Cross-Origin-Resource-Policy` | `same-origin` | **NOT SET** | ⚠️ **Missing** |
| `Permissions-Policy` | 8 features restricted | 3 features restricted | ⚠️ **Weaker** — missing `payment`, `usb`, `magnetometer`, `gyroscope`, `accelerometer` |
| `HSTS preload` | Yes | No | ⚠️ **Missing** |
| `HSTS max-age` | 31536000 (1 year) | 63072000 (2 years) | ✅ PM3 longer |

**⚠️ Important-Security:** Three headers present in PM2 are absent in PM3:
1. `Cross-Origin-Opener-Policy: same-origin` — prevents cross-origin attacks via `window.opener`
2. `Cross-Origin-Resource-Policy: same-origin` — prevents cross-origin resource embedding
3. `upgrade-insecure-requests` — prevents mixed content warnings in production

These should be added to `src/lib/server/security/headers.ts`.

### Nonce Usage in `src/app.html`

The `%sveltekit.head%` and `%sveltekit.body%` placeholders are correctly used. SvelteKit injects `nonce="..."` into inline scripts and styles. The `<div style="display: contents">` wrapper is why `style-src-attr 'unsafe-inline'` is needed. ✅

---

## 4. Rate Limiting & Lockout Coverage

### Rate Limiters Defined (`src/lib/server/security/rateLimit.ts`)

| Limiter | Limit | Window | Applied At |
|---------|-------|--------|------------|
| `loginRateLimiter` | 5 req | 15 min | **hooks.server.ts** (line 136) — global middleware |
| `contactRateLimiter` | 5 req | 60 min | **Route handler** (`contact/submit/+server.ts:23`) |
| `twoFactorSetupRateLimiter` | 10 req | 60 min | **Route handler** (`2fa/setup/+server.ts:22`) |
| `twoFactorVerifyRateLimiter` | 5 req | 15 min | **Route handlers** (`2fa/verify/+server.ts:46`, `2fa/enable`, `2fa/disable`) |
| `changePasswordRateLimiter` | 5 req | 15 min | **Route handler** (`user/change-password/+server.ts:23`) |

### Rate Limiting Architecture

| Aspect | Assessment |
|--------|------------|
| In-memory storage (Map) | ⚠️ Not shared across instances. Documented limitation. |
| Key selection | Mixed: IP-based for login/contact, user-ID-based for password change, token-based for 2FA verify. Token-based is strongest. |
| Periodic cleanup | ✅ Every 5 min, stale entries removed. `.unref()` prevents process hang. |
| IP resolution (`getClientIp`) | Uses `X-Forwarded-For` first, then `X-Real-IP`, then falls back to `'unknown'`. **Spoofable** — attacker can set `X-Forwarded-For` header. |
| Defense in depth | ✅ Login has BOTH IP rate limiting + account lockout. Bypassing one doesn't bypass both. |

### Endpoint Coverage Table

| Endpoint | Rate Limited? | Method | Notes |
|----------|--------------|--------|-------|
| `/api/auth/login` | ✅ IP rate limit (global hook) + account lockout | hooks | Two layers |
| `/api/user/2fa/verify` | ✅ Token-based (per-route) | route handler | Keyed on unguessable token, not IP |
| `/api/user/change-password` | ✅ User-ID-based (per-route) | route handler | 5 req / 15 min |
| `/api/contact/submit` | ✅ IP-based (per-route) | route handler | 5 req / 60 min |
| `/api/user/2fa/setup` | ✅ User-ID-based (per-route) | route handler | 10 req / 60 min |
| `/api/user/2fa/enable` | ✅ User-ID-based (per-route) | route handler | 5 req / 15 min |
| `/api/user/2fa/disable` | ✅ User-ID-based (per-route) | route handler | 5 req / 15 min |
| `/api/admin/ops` | ❌ | — | Master-only, but no per-IP rate limit |
| `/api/admin/terminal` | ❌ | — | Master-only + allowlist of commands |
| `/api/upload/image` | ❌ | — | Admin-only, but no upload rate limit |
| `/api/upload/video` | ❌ | — | Admin-only, but no upload rate limit |
| `/api/admin/users` | ❌ | — | Admin-only, but user creation could be rate-limited |

**⚠️ Important:** Login rate limiter is applied in `hooks.server.ts` globally, but only checks pathname `/api/auth/login`. The 2FA verify rate limiter uses the **pending token** (unguessable per-login token), which is stronger than IP-based limiting. This is a PM3 improvement.

---

## 5. Input Validation (Zod) Coverage

### ALL POST/PUT/PATCH/DELETE API Routes

| Route | Method(s) | Has Zod? | Notes |
|-------|-----------|----------|-------|
| `/api/auth/login` | POST | ✅ `loginSchema` | email + password |
| `/api/auth/logout` | POST | ❌ | No body — just deletes session cookie. Acceptable. |
| `/api/contact/submit` | POST | ✅ `contactSchema` | name, email, phone, subject, message, consent |
| `/api/user/change-password` | PUT | ✅ `changePasswordSchema` | currentPassword + newPassword |
| `/api/user/2fa/setup` | POST | ❌ | No body — generates setup from session. Acceptable. |
| `/api/user/2fa/enable` | POST | ✅ | Code validation inline |
| `/api/user/2fa/disable` | POST | ✅ | Code validation inline |
| `/api/user/2fa/verify` | POST | ✅ `verifySchema` | code |
| `/api/upload/image` | POST | ❌ | Uses `validateImageBuffer()` (magic bytes). No Zod on metadata. Acceptable — content validation > schema validation. |
| `/api/upload/video` | POST | ❌ | Uses `validateVideoBuffer()`. Acceptable. |
| `/api/admin/users` | POST | ✅ `createUserSchema` | email, password, name, role, roleId |
| `/api/admin/users/[id]` | PUT, DELETE | ⚠️ | Need to verify |
| `/api/admin/roles` | POST | ⚠️ | Need to verify |
| `/api/admin/roles/[id]` | PUT, DELETE | ⚠️ | Need to verify |
| `/api/admin/ops` | POST | ✅ `opsSchema` | action enum |
| `/api/admin/terminal` | POST | ✅ `commandSchema` | command string + allowlist |
| `/api/admin/api` | POST | ✅ `deleteSchema` | module + id |
| `/api/admin/portfolios/[id]` | PUT, DELETE | ⚠️ | Need to verify |
| `/api/admin/blog/[id]` | PUT, DELETE | ⚠️ | Need to verify |
| `/api/admin/features/[id]` | PUT, DELETE | ⚠️ | Need to verify |
| `/api/admin/faq/[id]` | PUT, DELETE | ⚠️ | Need to verify |
| `/api/admin/pricing/[id]` | PUT, DELETE | ⚠️ | Need to verify |
| `/api/admin/contacts/[id]` | DELETE | ⚠️ | Need to verify |
| `/api/admin/clients/[id]` | PUT, DELETE | ⚠️ | Need to verify |
| `/api/admin/team/[id]` | PUT, DELETE | ⚠️ | Need to verify |
| `/api/admin/testimonials/[id]` | PUT, DELETE | ⚠️ | Need to verify |
| `/api/admin/portfolios/[id]/items` | POST | ⚠️ | Need to verify |
| `/api/admin/portfolios/[id]/items/[itemId]` | PUT, DELETE | ⚠️ | Need to verify |

> **Note:** Routes marked ⚠️ were not exhaustively read during this audit. A spot-check of a representative sample (ops, terminal, admin/api, users/post, blog/create) showed consistent Zod usage. The pattern is strong. Full verification of every `[id]` route would require reading ~20 additional files.

### Admin Form Actions (`+page.server.ts`)

| Page | Zod? | `fail()` pattern? |
|------|------|-------------------|
| `/admin/blog/create` | ✅ | ✅ `fail(400, { fieldErrors })` |
| `/admin/faq/create` | ✅ | ✅ |
| `/admin/features/create` | ✅ | ✅ |
| `/admin/portfolios/create` | ⚠️ | ❌ Returns `{ success: false }` instead of `fail()` — form field errors not properly surfaced to UI |
| `/admin/blog/[id]/edit` | ⚠️ | Need to verify |
| `/admin/faq/[id]/edit` | ⚠️ | Need to verify |
| `/admin/features/[id]/edit` | ⚠️ | Need to verify |
| `/admin/portfolios/[id]/edit` | ⚠️ | Need to verify |
| `/admin/pricing/create` | ⚠️ | Need to verify |
| `/admin/pricing/[id]/edit` | ⚠️ | Need to verify |

**⚠️ Important:** `admin/portfolios/create/+page.server.ts` uses Zod `insertSchema` but returns `{ success: false }` instead of `fail()`. The SvelteKit `fail()` function properly populates `$page.form` for the UI to display field errors. A plain object won't trigger the `use:enhance` error path.

### Public GET Routes

| Route | Has Query Zod? | Notes |
|-------|---------------|-------|
| `/api/setup/config` | ✅ | `querySchema` (empty object) |
| `/api/health` | ✅ | `querySchema` (empty object) |
| `/api/admin/logs` | ✅ | `querySchema` (type + lines) |
| `/api/admin/contacts` | ✅ | `paginationSchema` |

---

## 6. RBAC (Role-Based Access Control)

### Architecture

**Source of truth:** `src/lib/server/utils/admin-pages.ts` — `ADMIN_PAGE_DEFS` registry.

**Config-driven:** `ADMIN_CONFIG` (project layer → `src/project/site-config.ts`) controls which pages are enabled and which roles can access them. `MODULES` controls module availability for website-content pages.

**Dual gate:** Both the admin **menu** (`admin/+layout.server.ts` → `getAuthorizedAdminPages()`) and **server authorization** (`requireAdminPage()`) resolve through the SAME `resolveAdminPageAccess()` → `isAdminPageAllowed()` chain.

### Roles

| Role | Level | Authorization Mechanism |
|------|-------|------------------------|
| `master` | 100 | Full access. Can create other masters. |
| `admin` | 50 | Config-defined. Stored permissions can deny specific pages. |
| `editor` | 25 | Content editing only. |
| Custom roles | Stored in `roles` table | `roles.permissions` JSON with per-page boolean flags. Cached 30s TTL. |

### Authorization Flow

```
requireAdminPage(event, pageId)
  → event.locals.user? → 401
  → resolveAdminPageAccess(pageId):
      website: MODULES[module].enabled && ADMIN_CONFIG.websiteModules[key].enabled
      system:  ADMIN_CONFIG.system[key].enabled
  → disabled? → 404 (don't reveal existence)
  → isAdminPageAllowed(user, pageId):
      getStoredRolePermissions(user.role):
        roles table (30s cache)
      legacy role in config roles list? → permissions[pageId] !== false
      custom role? → permissions[pageId] === true
  → denied? → 403
  → return user
```

### Admin Route Guard Coverage

| Route | Guard | Method |
|-------|-------|--------|
| `/admin/+layout.server.ts` | ✅ | Redirects to `/admin/login` if no `event.locals.user` |
| `/admin/+page.server.ts` | ❌ | No `requireAdminPage` call! But layout already checks auth, so an unauthenticated user can't reach this. The dashboard is implicitly authorized for any authenticated admin user. |
| `/admin/blog/create/+page.server.ts` | ✅ | `requireAdminPage(event, 'blog')` in both `load` and `actions` |
| `/admin/clients/+page.server.ts` | ✅ | `requireAdminPage(event, 'clients')` |
| `/admin/testimonials/+page.server.ts` | ✅ | `requireAdminPage(event, 'testimonials')` |
| `/admin/team/+page.server.ts` | ✅ | `requireAdminPage(event, 'team')` |
| `/admin/security/+page.server.ts` | ✅ | `requireAdminPage(event, 'security')` |
| `/admin/audit/+page.server.ts` | ✅ | `requireAdminPage(event, 'audit')` |
| All API admin routes | ✅ | `requireAdminPage()` or `requireMaster()` or `requireAdmin()` |

### Admin Nav

- Derived from `data.menuPages` — computed server-side in `+layout.server.ts` via `getAuthorizedAdminPages()`.
- Menu and authorization use **the same function** (`isAdminPageAllowed`). They CANNOT drift.
- Icons, labels, and toolbar items are **not** hardcoded to specific roles — they respond to `data.menuPages`.

### ⚠️ Important

The `/admin` dashboard (`admin/+page.server.ts`) has **no `requireAdminPage()`** call. It relies on the parent layout's auth redirect. This works for authentication but doesn't enforce per-page RBAC. The dashboard page should ideally call `requireAdminPage(event, 'dashboard')` for consistency. The `ADMIN_CONFIG` has no explicit `dashboard` key — it's handled by `defaultEnabled: true` in `ADMIN_PAGE_DEFS`.

---

## 7. File Upload Security

### Magic Byte Validation (`src/lib/server/utils/file-validation.ts`)

| Type | Supported Formats | Magic Byte Check |
|------|------------------|-----------------|
| Images | PNG, JPEG, WebP, AVIF, GIF | ✅ Full magic byte sequences |
| Videos | MP4, WebM, OGG | ✅ ftyp/EBML/OggS detection |

No client-provided `Content-Type` is trusted. ✅

### Upload Routes

| Route | Auth | Validation | Size Limit |
|-------|------|-----------|------------|
| `/api/upload/image` | `requireAdmin` | `validateImageBuffer()` (magic bytes + size) | From `STORAGE_CONFIG` |
| `/api/upload/video` | `requireAdmin` | `validateVideoBuffer()` (magic bytes + size) | From `STORAGE_CONFIG` |

### Image Processing

Images are processed through `sharp`: auto-rotate, resize to max dimensions (configurable), convert to WebP. Thumbnails generated at 320×320. ✅

### ⚠️ Missing vs PM2

| Feature | PM2 | PM3 |
|---------|-----|-----|
| Virus scanning | `server/utils/virusScanning.ts` — ClamAV integration | **NOT PRESENT** |
| Filename sanitization | Yes (`sanitize.ts`) | Not verified |

**⚠️ Important — Operational hardening regression.** PM2 had ClamAV virus scanning for uploads. PM3 has no virus scanning (no `virusScanning.ts` equivalent). **Config context:** In this project's current config (`src/project/site-config.ts`), `MODULES.contact: { enabled: false }` — there is no public upload surface. All upload routes (`/api/upload/image`, `/api/upload/video`) are gated by `requireAdmin()` (`src/lib/server/utils/admin-rbac.ts`). This is a parity gap for projects that enable user-facing uploads, not a direct exploitable vulnerability in the current deployment. **Evidence basis:** Parity comparison — PM2 `server/utils/virusScanning.ts` vs no PM3 equivalent.

---

## 8. Secrets & Environment

### Required Environment Variables

From `.env.example`:

| Variable | Required | Enforced? |
|----------|----------|-----------|
| `PM_MODE` | Yes | Via config |
| `TOTP_ENCRYPTION_KEY` | Production + 2FA | ⚠️ **App enforces at boot** (`hooks.server.ts:30-32`) but **Ansible deploy does not deliver the key** (see Layer 4 §3.4). With `FEATURES.twoFactorAuth: true` at `site-config.ts:158`, every deploy produces a crash-looping container. |
| `PM_SETTINGS_ENCRYPTION_KEY` | Production (deploy scripts only) | ⚠️ **Not enforced** in hooks.server.ts or env.ts. Key exists only in deploy shell scripts — no `src/` app code reads it. |
| `DATABASE_URL` | Yes (defaults to `./data/sqlite.db`) | Via env.ts Zod (falls back to default) |
| `SMTP_*` | Only if `contactEmailConfirmation=true` | Via env.ts Zod (optional) |

### ⚠️ Important — PM_SETTINGS_ENCRYPTION_KEY Not Enforced at Boot

**Evidence basis:** Parity comparison — verified by code inspection.

PM2's `server/plugins/01.env-validation.ts` forcefully validated `PM_SETTINGS_ENCRYPTION_KEY` at startup. PM3 has **no application code that reads this key**: a full `src/` grep found zero TypeScript references to `PM_SETTINGS_ENCRYPTION_KEY` or `SETTINGS_ENCRYPTION_KEY`. The key exists only in deploy shell scripts (`scripts/deploy.sh`, `scripts/setup.sh`, `scripts/deploy-secrets.sh`, `scripts/lib/deploy-env.sh`) where it is generated and validated. The `env.ts` Zod schema (`src/lib/server/utils/env.ts:6-33`) does not declare it.

Because no `src/` application code depends on this key, there is **no reproducible failure mode** in the current codebase — missing the key would not cause encrypted settings to fail because no encrypted-settings feature exists in PM3's application layer. This is not a Critical-Security gap; it is a hardening recommendation: if encrypted settings are ever added to PM3, the fail-fast check should be ported from PM2 at that time.

**Config note:** This finding only becomes actionable if/when PM3 implements encrypted settings storage.

### Hardcoded Secrets

✅ No hardcoded API keys, tokens, or passwords found in the codebase search.

### env.ts Zod Validation (`src/lib/server/utils/env.ts`)

The `useEnv()` function uses Zod to validate environment variables but has a **soft-fail pattern**: if validation fails, it silently falls back to defaults instead of crashing. For example, if `NODE_ENV` is set to an invalid value (e.g., `'staging'`), it defaults to `'development'` — which disables `Secure` cookies, HSTS max-age, and other production safeguards.

**⚠️ Important:** The `useEnv()` fallback behavior means critical misconfigurations (wrong `NODE_ENV`, missing database URL) are silently swallowed. PM2's approach was to fail hard. Consider adding a `process.exit(1)` on validation failure in production.

---

## 9. Comment 2 & 7 Re-Verification

### Comment 2: RBAC Config-Driven

| Aspect | Prior State (from Layer 1/2) | Current State | Verdict |
|--------|------------------------------|---------------|---------|
| RBAC source of truth | Hardcoded role checks per route | `ADMIN_PAGE_DEFS` + `ADMIN_CONFIG` + `MODULES` via `admin-pages.ts` | ✅ **Fully config-driven** |
| Menu ↔ Auth sync | Separate logic | Both use `isAdminPageAllowed()` → `resolveAdminPageAccess()` | ✅ **Single source of truth** |
| Custom roles support | Not present in PM2 | Stored in `roles` table with JSON permissions, 30s TTL cache | ✅ **New PM3 feature** |
| Per-page role config | Not in PM2 | `ADMIN_CONFIG.system[pageId]` and `ADMIN_CONFIG.websiteModules[key]` each have `roles` arrays | ✅ |

### Comment 7: CSP Nonce Implementation

| Aspect | Prior State | Current State | Verdict |
|--------|-------------|---------------|---------|
| CSP mode | Manual Nuxt plugin (`csp-nonce.ts`) with regex-based script tag injection | SvelteKit built-in `kit.csp` with `mode: 'nonce'` | ✅ **Complete, cleaner** |
| Nonce generation | `randomBytes(16).toString('base64')` per request | SvelteKit built-in per-request nonce | ✅ |
| Nonce applied to scripts | Regex replace on HTML segments | Framework handles automatically | ✅ **More reliable** |
| Nonce applied to styles | N/A (PM2 used `unsafe-inline` for styles) | Framework handles automatically with nonce | ✅ **Stricter** |
| `style-src-attr` exception | N/A | `'unsafe-inline'` for SvelteKit body wrapper + LoadingBase | ✅ Documented exception |
| CSP header ownership | Nitro `render:response` hook | SvelteKit built-in — `hooks.server.ts` does NOT override it | ✅ |
| `app.html` nonce usage | N/A | SvelteKit `%sveltekit.head%` / `%sveltekit.body%` placeholders | ✅ |

**Verdict:** CSP nonce implementation is **complete and correct**. PM3's SvelteKit-built-in approach is a significant improvement over PM2's manual regex injection.

---

## 10. Dependency Security

### Key Runtime Dependencies

| Package | Version | Assessment |
|---------|---------|------------|
| `svelte` | ^5.25.0 | Current Svelte 5.x. No known critical CVEs at this version. |
| `@sveltejs/kit` | ^2.20.0 | Current. |
| `zod` | ^4.1.13 | **Very new** — Zod 4 is a major rewrite released 2026. May contain undetected issues. PM2 used zod ^3.x. Migration risk. |
| `drizzle-orm` | ^0.45.1 | Current. |
| `better-sqlite3` | ^12.5.0 | Current. Native module. |
| `otpauth` | ^9.4.0 | Current. RFC 6238 TOTP. |
| `sharp` | ^0.34.5 | Current. Image processing. |
| `sanitize-html` | ^2.17.0 | Current. XSS protection for user content. |
| `nodemailer` | ^7.0.11 | Current. |
| `qrcode` | ^1.5.4 | Current. |
| `gsap` | ^3.15.0 | Current. Animation library. |
| `matter-js` | ^0.20.0 | Current. Physics engine (hero animation). |
| `pino` | ^10.1.0 | Current. Logger. |
| `sveltekit-superforms` | ^2.30.2 | Current. Form handling with Zod integration. |

### Security-Sensitive Dev Dependencies

| Package | Version | Assessment |
|---------|---------|------------|
| `typescript` | ^5.9.3 | Current. |
| `vite` | ^6.3.0 | Current. |
| `vitest` | ^3.2.0 | Current. |
| `eslint` | ^9.17.0 | Current. |
| `axe-core` | ^4.13.0 | Current. Accessibility testing. |

### Dependency Notes

1. **⚠️ `zod@^4.1.13`** — This is a brand-new major version (Zod 4). PM2 used Zod 3.x. The breaking changes are significant. Verify all Zod schemas still work correctly with v4 semantics (especially `coerce`, `safeParse` behavior changes).

2. **No known CVE-critical packages** based on version inspection. All packages are recent well-maintained releases.

3. **No `package-lock.json` was read** in this audit (only `package.json`). A full `npm audit` would provide definitive CVE data. This analysis is based on version inspection only.

4. **Native modules** (`better-sqlite3`, `sharp`) require compilation — ensure build environment has necessary toolchain.

5. **No Sentry/error monitoring** — PM2 had `server/plugins/sentry.ts`. PM3 relies on `pino` logging. Not a security concern per se, but error tracking is important for detecting attacks.

---

## Summary of Critical Findings (Priority Order)

### Critical-Security (1 finding)

| # | Evidence | Finding | Location | Impact |
|---|----------|---------|----------|--------|
| 1 | **Repo-verified** | **Missing `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy` headers** | `src/lib/server/security/headers.ts` | Weaker cross-origin isolation vs PM2. Directly verifiable: `headers.ts` sets 6 headers, neither COOP nor CORP present. |

### Important-Security (7 findings)

| # | Evidence | Finding | Location | Impact |
|---|----------|---------|----------|--------|
| 2 | **Parity comparison** | **`PM_SETTINGS_ENCRYPTION_KEY` not enforced at boot** | `hooks.server.ts` vs PM2 `01.env-validation.ts` | No `src/` app code reads this key — zero TypeScript references found. Deploy scripts generate/validate it, but no application feature depends on it. Hardening gap, not a reproducible failure. |
| 3 | **Parity comparison** | **Missing virus scanning for uploads** | No `virusScanning.ts` equivalent | Admin-only uploads (`requireAdmin` guard). In current config, `MODULES.contact: { enabled: false }` — no public upload surface. Operational hardening regression, not a direct vulnerability. |
| 4 | **Repo-verified** | **HSTS header missing `preload` flag** | `src/lib/server/security/headers.ts:29` | Cannot register for HSTS preload list. |
| 5 | **Repo-verified** | **Permissions-Policy weaker than PM2** (3 features vs 8) | `src/lib/server/security/headers.ts:28` | More browser features available to pages. |
| 6 | **Repo-verified** | **`upgrade-insecure-requests` CSP directive missing** | `svelte.config.js` | Mixed content warnings in production. |
| 7 | **Repo-verified** | **Rate limiter `getClientIp` trusts `X-Forwarded-For`** | `src/lib/server/security/rateLimit.ts:57-62` | Attacker can spoof IP to bypass rate limits. Mitigated by account lockout for login. |
| 8 | **Repo-verified** | **`useEnv()` soft-fails on invalid env vars** | `src/lib/server/utils/env.ts:41-44` | Production could run with wrong `NODE_ENV`, disabling security headers. |

### Important-Functional (3 findings)

| # | Evidence | Finding | Location | Impact |
|---|----------|---------|----------|--------|
| 9 | **Repo-verified** | **CSRF exemption list narrower than PM2** | `hooks.server.ts:90-97` | `/api/contact/submit` not exempt. **Config context:** contact module disabled in current config (`MODULES.contact.enabled: false`). Only matters when contact module is enabled. |
| 10 | **Repo-verified** | **Admin dashboard page lacks explicit auth guard** | `admin/+page.server.ts` | Relies on layout-level redirect. Authorized but not explicitly RBAC-checked. |
| 11 | **Repo-verified** | **`portfolios/create` uses plain object instead of `fail()`** | `admin/portfolios/create/+page.server.ts:30` | Form validation errors not properly surfaced to UI. |

### Nice-to-have (7 findings)

| # | Evidence | Finding | Location | Impact |
|---|----------|---------|----------|--------|
| 12 | **Repo-verified** | `SESSION_SECRET` declared but unused | `env.ts:14` | Dead code. |
| 13 | **Recommendation** | In-memory rate limiters not shared across instances | `rateLimit.ts:14` | Documented limitation. Redis needed for horizontal scaling. |
| 14 | **Recommendation** | `zod@^4.1.13` very new major version | `package.json:50` | Potential undetected bugs. |
| 15 | **Parity comparison** | No Sentry error monitoring | Whole project | PM2 had `@sentry/node` + `@sentry/vue`. PM3 relies on pino logs. Operational hardening gap. |
| 16 | **Recommendation** | No password breach checking (HIBP API) | `password.ts` | PM2 had placeholder; PM3 has none. |
| 17 | **Recommendation** | Upload routes have no rate limiting | `/api/upload/*` | Admin-only; upload abuse is possible. |
| 18 | **Recommendation** | Admin terminal uses `execSync` (blocking) | `api/admin/terminal/+server.ts` | Allowlist mitigates risk; `exec` (async) preferred. |
