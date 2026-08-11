# Admin Panel Rewrite — Step-by-Step Implementation Plan

> **Source plan**: `docs/plans/admin-panel-pm2-exact-replication.md` (audited 2026-08-12)
> **Target**: PM3 admin panel with full PM2 parity, proper APP MODE mobile layout,
>   component-based architecture, and zero code duplication.
> **Audience**: AI agent — each step file contains exact file paths, props
>   interfaces, PM3 framework rules, edge cases, and verification commands.

---

## Dependency Graph

```
Phase 1: Foundation Molecules (must run first)
  01-AdminModal ─────────────────────────────────────────────┐
  02-AdminFormSection ────────────────────────────────────────┤
  03-AppBottomNav ──┐                                        │
  03-AppMobileHeader ┤── all three created in one step        │
  03-UserMenu ──────┘                                        │
  04-ContactPicker ─┐                                        │
  04-MarkdownEditor ┘                                        │
                                                              │
Phase 2: Migration to Existing Components                     │
  05-FormField ───────────────── (no deps)                    │
  06-AdminTabs-EmptyState ─────── (no deps)                   │
                                                              │
Phase 3: APP MODE Layout ← depends on 03                     │
  07-AppModeLayout ───────────── (needs AppBottomNav,         │
                                  AppMobileHeader, UserMenu)  │
                                                              │
Phase 4: CRUD Page Normalization ← depends on 01, 02         │
  08-FaqFeaturesList ─────────── (needs AdminModal)           │
  09-BlogListPage ────────────── (needs AdminModal)           │
  10-PricingListPage ─────────── (needs AdminModal)           │
  11-ContactsPage ────────────── (needs AdminModal)           │
  12-RolesCrud ───────────────── (needs AdminModal)           │
                                                              │
Phase 5: Form Expansion ← depends on 02, 05                  │
  13-BlogFormExpand ──────────── (needs FormField,            │
                                  AdminFormSection)           │
  14-EntityFormsExpand ───────── (needs FormField,            │
                                  AdminFormSection)           │
                                                              │
Phase 6: Gap Closure                                          │
  15-FileUpload ──────────────── (no deps)                    │
  16-Pagination ──────────────── (no deps)                    │
  17-PortfolioItems ──────────── (needs AdminModal,           │
                                  AdminFormSection)           │
  18-AuditGaps ───────────────── (no deps)                    │
```

## Step List

| Step | File | What It Does | Est. Lines Changed |
|------|------|-------------|-------------------|
| 01 | `01-admin-modal.md` | Extract `AdminModal` molecule — modal shell for all CRUD operations | ~150 new, ~150 removed |
| 02 | `02-admin-form-section.md` | Extract `AdminFormSection` molecule — form card wrapper | ~120 new, ~120 removed |
| 03 | `03-admin-layout-molecules.md` | Extract `AppBottomNav`, `AppMobileHeader`, `UserMenu` molecules | ~300 new, ~100 removed |
| 04 | `04-admin-utility-molecules.md` | Extract `ContactPicker`, `MarkdownEditor` molecules | ~150 new, ~60 removed |
| 05 | `05-migrate-formfield.md` | Migrate all admin form pages to use existing `FormField` atom | ~100 removed, edits in 5 files |
| 06 | `06-migrate-tabs-empty.md` | Migrate pages to use existing `AdminTabs` and `EmptyState` | ~50 removed, edits in 2 files |
| 07 | `07-app-mode-layout.md` | Rewrite admin layout for proper APP MODE — mobile header, bottom nav, tablet rail, drawer, breakpoints | ~150 changed in layout |
| 08 | `08-faq-features-list.md` | Add CRUD actions to FAQ/Features list pages with locale-filtered translation joins | ~80 added per file |
| 09 | `09-blog-list-page.md` | Enable blog admin (ADMIN_CONFIG only, no public impact) + proper card grid with locale-filtered translations/categories/tags | ~150 changed |
| 10 | `10-pricing-list-page.md` | Enable pricing admin (ADMIN_CONFIG only, no public impact) + AdminDataTable with locale-filtered translations | ~80 changed |
| 11 | `11-contacts-page.md` | Enable contacts (MODULES, enables public form) + read/unread indicators + mark-read via existing `read` field and `markAsRead()` service | ~100 changed |
| 12 | `12-roles-crud.md` | Add roles CRUD with permissions editor, built-in role protection, immutable slug, direct DELETE fetch | ~230 new |
| 13 | `13-blog-form-expand.md` | Expand blog form to real schema columns + per-locale translations + transaction-wrapped writes + edit-time upsert | ~250 changed |
| 14 | `14-entity-forms-expand.md` | Expand FAQ/Features/Pricing forms to real schema columns (period, imageUrl, etc.) + per-locale translations + transaction + upsert | ~250 changed |
| 15 | `15-file-upload.md` | Build admin file upload UI component (reuses existing hardened /api/upload/image and /api/upload/video endpoints) | ~150 new |
| 16 | `16-pagination.md` | Add pagination to all admin page-level data loads | ~100 changed across files |
| 17 | `17-portfolio-items.md` | Build portfolio items management UI | ~200 new |
| 18 | `18-audit-gaps.md` | Translation fallback, RTL layout, health page types | ~100 changed |

## PM3 Framework Rules (apply to ALL steps)

Every step must follow these rules from `AGENTS.md`:

1. **Design tokens**: No raw values — use `[var(--token)]` bracket syntax
2. **No `<style>` blocks** in `.svelte` files
3. **`class` prop + `twMerge`**: Every component that renders a visible root element
4. **Component hierarchy**: `atoms/` → `molecules/` → `complex/` → `sections/`
5. **JSDoc**: Every exported component — `@props`, `@example`
6. **Loading/Empty/Error states**: Every data-dependent component
7. **Canonical primitives**: Use existing atoms (`CtaButton`, `Badge`, `Card`, `PageHeader`, `EmptyState`, `Container`, `Section`) — never hand-roll their patterns
8. **i18n**: Never hardcode strings — use `t()` or `getAdminT()`
9. **No type suppressions**: No `@ts-ignore`, `@ts-expect-error`, `!` assertions
10. **No empty catches**: Every `catch` must log or re-throw

## Verification (after each step)

```bash
npm run check          # TypeScript check
npx svelte-check       # Svelte template check
npm run build          # Production build
```

## Related Documents

- **Full plan**: `docs/plans/admin-panel-pm2-exact-replication.md`
- **Module-enablement ADR**: `docs/plans/admin-rewrite-master-plan.md#ADR-001`
- **PM3 framework rules**: `AGENTS.md`
- **Canonical primitives**: `docs/contributing/canonical-primitives.md`
- **Design tokens**: `docs/design-tokens.md`
- **i18n policy**: `docs/contributing/i18n-literals-policy.md`
