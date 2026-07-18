# Security & Legal Infrastructure Audit

**Project:** nikitat/app (Puppet Master framework)
**Operator:** Никита Турунцев Евгеньевич (самозанятый), ИНН 7707083893
**Date:** 2026-06-13
**Scope:** Full review of security middleware, auth, data protection, legal compliance

---

## 0. Actual Data Collection Surface

### What the site collects NOW (after remediation)

| Data | From whom | Where | Status |
|------|-----------|-------|--------|
| Admin email, name, password hash, role | Site administrators | `users` table | Labor/contract exemption (Art 22.2) |
| Admin login IPs, user agents | Site administrators | `audit_logs` table | Labor/contract exemption |
| Technical cookies (session, CSRF) | Admin users only | Browser | Not set for visitors |
| Preference cookies (theme, locale) | Visitors who accept | Browser | Only if features.cookies=true AND accepted |
| Cookie consent decision | Visitors who interact | Browser (cookie + localStorage) | Functional cookie |
| Performance metrics (partial IP, URL, UA) | All visitors | In-memory only | IP anonymized (last octet .x) |
| Contact form submissions | **DISABLED** | `contact_submissions` table | No data collected |

### Cookie inventory

| Cookie | Type | For whom | Purpose |
|--------|------|----------|---------|
| `pm-session` | Technical | Admin only | Auth session, HttpOnly |
| `pm-csrf` | Security | Admin only | CSRF token, HttpOnly |
| `pm-cookie-consent` | Functional | Visitors | Stores consent choice (accepted/declined) |
| `pm-color-mode` | Preference | Visitors | Theme preference |
| `pm-theme-explicit` | Preference | Visitors | Explicit theme override |
| `pm-locale-explicit` | Preference | Visitors | Language preference |
| `pm-i18n-redirected` | Preference | Visitors | Locale redirect marker |

**All cookies are technical/functional. Zero marketing, advertising, or third-party tracking cookies.**

### Third-party services

| Service | Used? | Data shared |
|---------|-------|-------------|
| Google Analytics | No (ID empty) | None |
| Yandex Metrica | No (ID empty) | None |
| Facebook Pixel | No (ID empty) | None |

---

## 1. Security Infrastructure

### 1.1 Defense-in-Depth Layers

| Layer | Implementation | Status |
|-------|---------------|--------|
| Transport | HSTS (1yr, preload), HTTPS enforced in prod | ✅ |
| Headers | X-Frame-Options DENY, X-Content-Type nosniff, Referrer-Policy, COOP, CORP | ✅ |
| CSP | Per-request nonce, strict-dynamic in prod, object-src none, frame-ancestors none | ✅ |
| CSRF | Double-submit cookie, timing-safe comparison (crypto.timingSafeEqual), 32-byte token | ✅ |
| Auth | Session-based, DB-validated, pm-session HttpOnly cookie | ✅ |
| RBAC | Legacy role hierarchy (editor/admin/master) + page-based permissions with caching | ✅ |
| Rate Limiting | Login (5/15min), contact (5/60min), 2FA endpoints (3-10/hr). In-memory + optional Redis | ✅ |
| Account Lockout | 5 failures → 30 min lockout, 1hr reset window | ✅ |
| Audit Logs | 20+ action types, non-throwing, filterable API endpoint | ✅ |
| Input Validation | Zod schemas for all API inputs | ✅ |
| HTML Sanitization | Server-side XSS prevention (sanitize-html lib + regex fallback) | ✅ |
| File Upload | Magic byte validation + optional ClamAV scanning | ✅ |
| Passwords | scrypt hashing with timing-safe verify, strength policy, common-password rejection | ✅ |
| 2FA | TOTP (RFC 6238) + backup codes, secrets encrypted at rest (AES-256-GCM) | ✅ |
| Secrets | Settings/TOTP encryption keys required in prod, AES-256-GCM | ✅ |
| Logging | Sensitive header redaction (auth, cookie, csrf, session) | ✅ |

### 1.2 Gaps

| # | Gap | Severity | Effort | Status |
|---|-----|----------|--------|--------|
| 1 | **No CORS middleware** | Medium | Low | Open |
| 2 | **No request body size limits** | Low | Low | Open |
| 3 | **Concurrent sessions unlimited** | Low | Medium | Open |
| 4 | **No session hijacking detection** | Low | Medium | Open |
| 5 | **No security.txt** | Low | Low | Open |
| 6 | **No WAF integration** | Low | Medium | Open |
| 7 | **Docs mismatch** — security.md says bcrypt, implementation uses scrypt | Low | Low | Open |
| 8 | **Rate limits in-memory by default** | Low | Low | Open |
| 9 | **No automated secret rotation** | Low | Medium | Open |

---

## 2. Legal Infrastructure

### 2.1 Legal System — Current State (After Remediation)

| Component | Status | Details |
|-----------|--------|---------|
| Legal entity info | ✅ Filled | Никита Турунцев Евгеньевич, ИНН 7707083893, nikitatut@yandex.ru |
| Privacy Policy (RU) | ✅ Published | Full content in `translations` DB, placeholder substitution active |
| Privacy Policy (EN) | ✅ Published | English convenience translation |
| Personal Data Policy (RU) | ✅ Published | Includes Article 22 exemption statement |
| Personal Data Policy (EN) | ✅ Published | English convenience translation |
| Terms of Service (RU) | ✅ Published | Full content |
| Terms of Service (EN) | ✅ Published | English convenience translation |
| Footer legal links | ✅ Active | Auto-resolved from i18n |
| Contact form | ✅ Disabled | `modules.contact.enabled = false` + gate check in SectionContact.vue |
| Cookie consent | ✅ Active | Binary accept/decline, all cookies are technical/functional |
| Placeholders | ✅ Working | `{companyLegalName}`, `{inn}`, `{legalEmail}` resolve at runtime |

### 2.2 Contact Form Gate — Single Source of Truth

**One user-facing toggle controls the contact form: `modules.contact.enabled`** in `puppet-master.config.ts`.

```
FORM_VISIBLE = modules.contact.enabled !== false
               AND (legalDocsExist OR forceOverride)
```

| Layer | Type | Role |
|-------|------|------|
| `modules.contact.enabled` | **User toggle** | Single on/off switch. `false` → form hidden always. |
| Legal docs exist? | **Automatic safety** | If docs are empty, form auto-hidden. Not a user setting — it's a legal prerequisite. |
| `forceShowFormWithoutLegalDocuments` | **Admin override** | DB setting for development/testing. Default: false. |

**Note:** `modules.contact.config.showForm` is defined in `pm-core/app/types/modules.ts:168` but is **never checked** by any component. It is dead config — a separate boolean that duplicates the `enabled` toggle. This should be removed from the framework types. Currently, `modules.contact.enabled` is the sole control point.

### 2.3 Gaps — Reassessed

Original gaps reassessed against actual data collection surface:

| # | Original Gap | Reassessment |
|---|-------------|-------------|
| 1 | Granular cookie consent | **Not applicable.** All cookies are technical/functional. No tracking cookies. Granular consent not required under 152-FZ or ePrivacy for strictly necessary cookies. |
| 2 | DSAR workflow | **Low priority.** No visitor personal data collected. Admin data is labor-exempt. Manual email response (nikitatut@yandex.ru) is sufficient for current scope. |
| 3 | Cookie declaration page | **Nice to have.** Cookie list is documented in privacy policy and personal data policy. |
| 4 | Consent audit log | **Not applicable.** No processing requiring consent (no marketing/tracking cookies, no form data). The cookie consent banner is informational for technical cookies. |
| 5 | fr/he legal doc locales | **Low.** Only ru/en locales are published. fr/he show empty pages (no footer links since content is empty). |
| 6 | Age verification | **Not applicable.** No age-gated content, no data collection from minors. |
| 7 | DPA reference | **Not applicable.** No B2B data collection (forms disabled). |

---

## 3. Russian Law (ФЗ-152) Compliance — Final Assessment

### 3.1 Article-by-Article

| Article | Requirement | Status | Notes |
|---------|-------------|--------|-------|
| Art 5 — Processing principles | Lawful, limited purpose, data minimization | ✅ | Only technical cookies + admin auth data |
| Art 6 — Processing conditions | Legal grounds required | ✅ | Contract (admins) + legitimate interest (security) |
| Art 7 — Confidentiality | No disclosure without consent | ✅ | No third-party data sharing |
| Art 9 — Consent | Specific, informed, conscious | ✅ | Consent checkbox on form with consent stored in DB (2026-06-13 fix). Cookie consent for technical cookies only. |
| Art 10 — Special categories | Written consent for sensitive data | ✅ | No special category data collected |
| Art 12 — Cross-border transfer | Adequate protection or consent | ✅ | No cross-border transfer |
| Art 14 — Subject access right | 10-working-day response | ✅ | DSAR email published: nikitatut@yandex.ru |
| Art 15 — Rectification/blocking/destruction | 30-day response | ✅ | Stated in policy |
| Art 18.1 — Data protection measures | Technical + organizational | ✅ | Documented in personal data policy §9 |
| Art 19 — Security measures | Certified protection, access control | ✅ | HTTPS, RBAC, audit logging, scrypt, rate limiting |
| Art 21 — Data localization | RF-based databases | ✅ | Server in RF; stated in policy §5.3 |
| Art 22 — Roskomnadzor notification | Notify before processing | ✅ **Exempt** | Art 22(2) exemption documented in personal data policy §2.1: no visitor data collected via forms, admin data is contract-based, no dissemination |

### 3.2 Penalty Risk Assessment

| Risk | Exposure |
|------|----------|
| No visitor personal data collected | Risk minimal |
| Admin data under labor/contract exemption | Standard risk |
| All cookies technical/functional | No consent penalty risk |
| No tracking/analytics | No cross-border risk |
| Legal docs published with operator details | Art 18.1 satisfied |
| Art 22 exemption stated in policy | Notification obligation addressed |
| DSAR via email | Art 14 satisfied (manual, appropriate for scale) |

---

## 4. Remediation Log (2026-06-13)

| # | Action | File/Table | Effect |
|---|--------|-----------|--------|
| 1 | Added `modules.contact.enabled` gate | `app/components/sections/SectionContact.vue:77-80` | Single toggle for contact form |
| 2 | Set `modules.contact.enabled = false` | `project/puppet-master.config.ts` | Contact form disabled |
| 3 | Filled legal entity info | `settings` table (7 rows) | Operator details for legal docs |
| 4 | Inserted RU+EN legal doc translations | `translations` table (12 rows) | Full privacy, personal data, terms published |
| 5 | Added Art 22 exemption | `translations` (personalData.body) | Covers both form enabled/disabled states |
| 6 | Added `consent` column | `server/database/schema.ts` + DB migration | Contact submissions now store consent flag |
| 7 | Store consent on submit | `server/api/contact/submit.post.ts:86` | Art 9 proof of consent |
| 8 | Updated cookie disclosure | Privacy + personal data policies | Accurate 7-cookie inventory, all technical |
| 9 | Updated all templates | Privacy + personal data policies | Conditional language: "if form is enabled" |

---

## 5. Key Files Index

### Security
| File | Purpose | Lines |
|------|---------|-------|
| `server/middleware/security-headers.ts` | HTTP security headers | 55 |
| `server/middleware/auth.ts` | Auth + admin RBAC | 91 |
| `server/middleware/csrf.ts` | CSRF validation | 57 |
| `server/plugins/csp-nonce.ts` | CSP nonce injection | 70 |
| `server/utils/audit.ts` | Audit logging | 381 |
| `server/utils/rateLimit.ts` | Rate limiting | 280 |
| `server/utils/accountLockout.ts` | Brute-force protection | 194 |
| `server/utils/permissions.ts` | Page-based RBAC | 493 |
| `server/utils/password.ts` | Password hashing | 237 |
| `server/utils/secrets.ts` | Encryption at rest | 119 |
| `server/utils/totp.ts` | 2FA TOTP | 208 |
| `server/utils/sanitize.ts` | HTML sanitization | 251 |
| `server/utils/validation.ts` | Zod schemas | 207 |
| `server/utils/fileValidation.ts` | Magic byte validation | 223 |
| `server/utils/virusScanning.ts` | ClamAV scanning | 236 |
| `server/api/admin/audit-logs.get.ts` | Audit endpoint | 134 |

### Legal
| File | Purpose | Lines |
|------|---------|-------|
| `app/composables/useLegalDocuments.ts` | Document resolver + placeholder substitution | 119 |
| `app/composables/useCookieConsent.ts` | Cookie consent logic | 163 |
| `app/pages/legal/[document].vue` | Public legal pages | 74 |
| `app/pages/admin/legal.vue` | Admin legal editor | 534 |
| `app/utils/legal-markdown.ts` | Markdown→HTML | 123 |
| `app/components/organisms/CookieConsent.vue` | Consent banner | 75 |
| `app/components/sections/SectionContact.vue` | Contact form gate | ~321 |
| `app/plugins/startup-preferences.client.ts` | Cookie-disabled fallback (browser language detection) | 93 |
| `legal/` | Seed document templates (reference only, not auto-loaded) | 6 files |
