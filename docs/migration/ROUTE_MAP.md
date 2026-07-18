# Route Map: All Routes (Public + Admin + API)

---

## A. Public Pages

| Route | Method | SSR? | Description | Loads | Layout |
|-------|--------|------|-------------|-------|--------|
| `/` | ANY | ISR 3600 | Homepage (onepager: hero + all sections) | config, hero translations, sections list | default |
| `/[locale]` | ANY | ISR 3600 | Locale root (redirect to / or change locale) | — | default |
| `/[section]` | ANY | SSR | Dynamic section (SPA mode: individual sections) | section data | default |
| `/blog` | ANY | SSR | Blog listing with pagination | blog posts, categories | default |
| `/blog/[slug]` | ANY | SSR | Single blog post | post content, tags | default |
| `/portfolio` | ANY | SSR | Portfolio grid with filters | portfolios + items + translations | default |
| `/portfolio/[slug]` | ANY | SSR | Portfolio detail with items | portfolio + items + translations | default |
| `/legal/[slug]` | ANY | SSR | Legal document | document content | default |
| `/login` | ANY | SSR | Admin login page | — | blank |
| `/init` | ANY | SSR | First-run setup wizard | — | blank |

---

## B. Admin Pages

All routes under `/admin` use `admin` layout (sidebar + topbar).

| Route | Type | Component | Auth | Data |
|-------|------|-----------|------|------|
| `/admin` | Dashboard | redirect | session | → first accessible section |
| `/admin/login` | Auth | LoginPage | public | — |
| `/admin/users` | System | UserList | master | users table |
| `/admin/users/[id]` | System | UserEdit | master | single user |
| `/admin/roles` | System | RoleList | master | roles table |
| `/admin/roles/[id]` | System | RoleEdit | master | single role |
| `/admin/translations` | System | TranslationList | master, admin, editor | translations + locales |
| `/admin/settings` | System | SettingsEditor | master, admin | settings by group |
| `/admin/legal` | System | LegalEditor | master, admin | legal documents |
| `/admin/health` | System | HealthDashboard | master | system health data |
| `/admin/logs` | System | LogViewer | master | application logs |
| `/admin/portfolios` | Content | PortfolioList | master, admin | portfolios |
| `/admin/portfolios/[id]` | Content | PortfolioEdit | master, admin | single portfolio + items |
| `/admin/faq` | Content | FaqList | master, admin, editor | faq items |
| `/admin/faq/[id]` | Content | FaqEdit | master, admin, editor | single faq |
| `/admin/features` | Content | FeatureList | master, admin, editor | features |
| `/admin/features/[id]` | Content | FeatureEdit | master, admin, editor | single feature |
| `/admin/contacts` | Content | ContactList | master, admin | contact submissions |
| `/admin/contacts/[id]` | Content | ContactDetail | master, admin | single submission |
| `/admin/blog` | Content | BlogList | master, admin, editor | blog posts (if module enabled) |
| `/admin/blog/[id]` | Content | BlogEdit | master, admin, editor | single post |
| `/admin/pricing` | Content | PricingList | master, admin | pricing tiers (if module enabled) |
| `/admin/pricing/[id]` | Content | PricingEdit | master, admin | single tier |
| `/admin/team` | Content | TeamList | master, admin | team members (if module enabled) |
| `/admin/team/[id]` | Content | TeamEdit | master, admin | single member |
| `/admin/testimonials` | Content | TestimonialList | master, admin, editor | testimonials (if enabled) |
| `/admin/testimonials/[id]` | Content | TestimonialEdit | master, admin, editor | single testimonial |
| `/admin/clients` | Content | ClientList | master, admin | clients (if module enabled) |
| `/admin/clients/[id]` | Content | ClientEdit | master, admin | single client |

---

## C. Public API Endpoints

All return `{ success: true, data }` envelope.

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/health` | GET | None | Server health check |
| `/api/i18n/[locale]` | GET | None | Get translations for locale |
| `/api/portfolios` | GET | None (or admin) | List portfolios (all=admin, filter by type) |
| `/api/portfolios/[id]` | GET | None | Single portfolio with translations |
| `/api/portfolios/[id]/items` | GET | None | Portfolio items |
| `/api/portfolios/[id]/items/[itemId]` | GET | None | Single item |
| `/api/blog/posts` | GET | None | Blog posts (paginated) |
| `/api/blog/[slug]` | GET | None | Single blog post |
| `/api/blog/categories` | GET | None | Blog categories |
| `/api/contact/submit` | POST | None | Contact form submission |
| `/api/settings` | GET | None | Public settings (filtered) |
| `/api/faq` | GET | None | FAQ items |
| `/api/features` | GET | None | Features |
| `/api/pricing` | GET | None | Pricing tiers + features |

**Auth endpoints:**
| `/api/auth/login` | POST | None | Login (sets session cookie) |
| `/api/auth/logout` | POST | Session | Logout (clears session) |
| `/api/auth/session` | GET | Session | Current session user |

---

## D. Admin API Endpoints

All require authentication + RBAC.

| Route | Methods | RBAC | Description |
|-------|---------|------|-------------|
| `/api/admin/users` | GET, POST | master | List / create users |
| `/api/admin/users/[id]` | GET, PUT, DELETE | master | Single user CRUD |
| `/api/admin/roles` | GET, POST | master | List / create roles |
| `/api/admin/roles/[id]` | GET, PUT, DELETE | master | Single role CRUD |
| `/api/admin/translations` | GET, POST | master,admin,editor | List / create translations |
| `/api/admin/translations/[locale]` | PUT | master,admin,editor | Update locale translations |
| `/api/admin/settings` | GET, PUT | master,admin | Read / update settings |
| `/api/admin/legal` | GET, POST | master,admin | List / create legal docs |
| `/api/admin/legal/[id]` | PUT, DELETE | master,admin | Update / delete legal doc |
| `/api/admin/portfolios` | GET, POST | master,admin | List / create portfolios |
| `/api/admin/portfolios/[id]` | GET, PUT, DELETE | master,admin | Single portfolio CRUD |
| `/api/admin/portfolios/[id]/items` | GET, POST | master,admin | Portfolio items CRUD |
| `/api/admin/portfolios/[id]/items/[itemId]` | GET, PUT, DELETE | master,admin | Single item CRUD |
| `/api/admin/faq` | GET, POST | master,admin,editor | FAQ CRUD |
| `/api/admin/faq/[id]` | PUT, DELETE | master,admin,editor | Single FAQ CRUD |
| `/api/admin/features` | GET, POST | master,admin,editor | Features CRUD |
| `/api/admin/features/[id]` | PUT, DELETE | master,admin,editor | Single feature CRUD |
| `/api/admin/contacts` | GET | master,admin | List contacts |
| `/api/admin/contacts/[id]` | GET, PUT, DELETE | master,admin | Contact detail / read / delete |
| `/api/admin/blog` | GET, POST | master,admin,editor | Blog CRUD (if enabled) |
| `/api/admin/blog/[id]` | PUT, DELETE | master,admin,editor | Single post CRUD |
| `/api/admin/pricing` | GET, POST | master,admin | Pricing CRUD (if enabled) |
| `/api/admin/pricing/[id]` | PUT, DELETE | master,admin | Single tier CRUD |
| `/api/admin/pricing/[id]/features` | GET, POST | master,admin | Tier features CRUD |
| `/api/admin/team` | GET, POST | master,admin | Team CRUD (if enabled) |
| `/api/admin/team/[id]` | PUT, DELETE | master,admin | Single member CRUD |
| `/api/admin/testimonials` | GET, POST | master,admin,editor | Testimonials CRUD (if enabled) |
| `/api/admin/testimonials/[id]` | PUT, DELETE | master,admin,editor | Single testimonial CRUD |
| `/api/admin/clients` | GET, POST | master,admin | Clients CRUD (if enabled) |
| `/api/admin/clients/[id]` | PUT, DELETE | master,admin | Single client CRUD |
| `/api/admin/health` | GET | master | System health data |
| `/api/admin/stats` | GET | master | Dashboard statistics |
| `/api/admin/audit-logs` | GET | master | Audit log list (paginated) |
| `/api/admin/logs` | GET | master | Application log viewer |
| `/api/admin/terminal` | POST | master | Execute terminal command |
| `/api/admin/ops` | GET, POST | master | Ops agent proxy |
| `/api/admin/monitoring` | GET | master | Monitoring data |
| `/api/admin/support-bundle` | GET | master | Generate support bundle |

**Upload endpoints:**
| `/api/admin/upload` | POST | admin+ | Upload file (image/video) |
| `/api/admin/upload/[id]` | DELETE | admin+ | Delete uploaded file |
| `/api/admin/media` | GET | admin+ | List media files |
| `/api/admin/media/[id]` | DELETE | admin+ | Delete media |

**2FA endpoints:**
| `/api/admin/2fa/setup` | POST | Session | Generate TOTP secret + QR |
| `/api/admin/2fa/verify` | POST | Session | Verify TOTP code |
| `/api/admin/2fa/disable` | POST | Session | Disable 2FA |

---

## E. Route Summary

| Category | Count |
|----------|-------|
| Public pages | 10 |
| Admin pages | ~30 (17 unique + sub-routes) |
| Public API endpoints | 15 |
| Auth API endpoints | 3 |
| Admin API endpoints | ~45 |
| Upload/Media endpoints | 4 |
| 2FA endpoints | 3 |
| **Total routes** | **~110** |
