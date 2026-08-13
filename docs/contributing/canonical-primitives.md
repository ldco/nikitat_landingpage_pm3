# Canonical Primitives Registry

Reusable visual patterns in Puppet Master v3 are **Svelte components**, never shared CSS classes. This registry is the mandatory first lookup before writing an inline class bundle for a common pattern. Bypassing a listed primitive is a framework-rule violation and is blocked by the PM3 validator pre-commit hook.

## Non-bypassable Primitives

| Pattern | Primitive | Use instead of |
|---|---|---|
| Button (any variant/size) | `src/lib/components/atoms/CtaButton.svelte` | hand-rolled `inline-flex items-center justify-center rounded-md ...` button/anchor bundles |
| Icon-only row action | `src/lib/components/atoms/IconButton.svelte` | hand-rolled `p-1.5 rounded-md text-pm-text-muted hover:*` icon button/anchor bundles in admin list rows |
| Segmented pill toggle | `src/lib/components/atoms/SegmentedControl.svelte` | hand-rolled `bg-pm-brand border-pm-brand text-pm-white` pill toggle buttons (e.g. translations Content/System toggle) |
| Add-row action (repeatable fields) | `src/lib/components/atoms/AddRowButton.svelte` | hand-rolled `text-pm-brand hover:text-pm-brand-light` "+ label" add-row buttons in repeatable form groups |
| Form control (label + input/textarea/select/checkbox + error) | `src/lib/components/atoms/FormField.svelte` | hand-rolled `w-full px-3 py-2 rounded-md border ...` input/textarea/select/checkbox bundles with a `<label>` (a raw `<select>` with the bundle in admin UI is flagged) |
| Content width wrapper | `src/lib/components/atoms/Container.svelte` or `src/lib/components/molecules/SectionContent.svelte` | `max-w-[var(--max-w-container)] mx-auto px-[var(--px-container)]` by hand |
| Section title heading | `src/lib/components/molecules/SectionHeading.svelte` | `text-[var(--heading-2)] font-black leading-tight mb-[var(--space-8)]` by hand |
| Card visual | `src/lib/components/atoms/Card.svelte` | `bg-pm-bg-elevated border border-pm-border rounded-[var(--radius-xl)] shadow-frosted ...` bundles |
| Empty state | `src/lib/components/atoms/EmptyState.svelte` | hand-rolled empty-state illustrations |
| Loading states | `src/lib/components/atoms/LoadingBase.svelte`, `LoadingCard.svelte`, `LoadingTable.svelte`, `LoadingText.svelte` | hand-rolled spinners/skeletons |
| Section shell (id + reveal + background) | `src/lib/components/atoms/Section.svelte` | raw `<section>` with reveal/data-reveal classes |
| Badge | `src/lib/components/atoms/Badge.svelte` | hand-rolled `inline-flex items-center rounded-full uppercase tracking-[0.08em]` bundles |
| Admin back/navigation action | `src/lib/components/atoms/AdminBackButton.svelte` | raw `<a class="text-pm-text-muted hover:text-pm-brand text-sm">&larr; Back</a>` bundles in `PageHeader` actions |
| Admin list primary action | `src/lib/components/atoms/AdminCreateButton.svelte` | raw `<CtaButton variant="primary" size="sm"><IconPlus/> label</CtaButton>` bundles in list-page `PageHeader` actions |
| Admin table row-action row | `src/lib/components/atoms/AdminRowActions.svelte` | hand-rolled `flex items-center justify-end gap-1` action wrappers in admin table/card rows |
| Inline banner action (dismiss/retry) | `src/lib/components/atoms/InlineBannerAction.svelte` | raw `<button class="ms-2 underline hover:no-underline">` dismiss/retry links inside admin banner alerts |
| Admin editor page shell | `src/lib/components/molecules/AdminEditorPage.svelte` | hand-assembled editor pages (PageHeader + raw back link + `<form>` + csrf input + footer Cancel/Save) — the shell produces back nav, page titles, top actions and form framing from one pattern |

## Validator enforcement

The PM3 validator (check #6) rejects the bundles above repo-wide in UI surfaces
(`src/lib/components/**`, `src/routes/**`, `src/project/**`). The admin
primitives (AdminBackButton, AdminCreateButton, AdminRowActions,
InlineBannerAction, AdminEditorPage) and raw FormField-bundle `<select>`s are
enforced with additional markup-level checks in **admin UI files only**
(`src/routes/admin/**` + `src/lib/components/admin/**`) — public surfaces may
legitimately reuse the muted-link / row layouts, so the admin contract never
trips public pages. Each bypass rule skips its own primitive file
(`PRIMITIVE_FILES` in `scripts/pm3-validator.mjs`).

## Guidance

- When a visual pattern appears in **two or more** components, extract a Svelte atom/molecule — do not repeat the class bundle inline.
- Component-local single-use patterns may stay inline in the owning component (e.g. a card layout used only inside one section), provided every value is a token reference — they must NOT become `@utility` classes.
- New shared CSS (`@layer components`, `@utility`) is reserved for framework infrastructure only and requires an inline justification comment.

## Registry maintenance

Adding a new primitive: create the component under `src/lib/components/atoms/` or `molecules/`, document it with the standard JSDoc block, then add it to this table and to the `AGENTS.md` "Canonical Primitives" section.
