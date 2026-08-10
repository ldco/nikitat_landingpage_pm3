# Canonical Primitives Registry

Reusable visual patterns in Puppet Master v3 are **Svelte components**, never shared CSS classes. This registry is the mandatory first lookup before writing an inline class bundle for a common pattern. Bypassing a listed primitive is a framework-rule violation and is blocked by the PM3 validator pre-commit hook.

## Non-bypassable Primitives

| Pattern | Primitive | Use instead of |
|---|---|---|
| Button (any variant/size) | `src/lib/components/atoms/CtaButton.svelte` | hand-rolled `inline-flex items-center justify-center rounded-md ...` button/anchor bundles |
| Content width wrapper | `src/lib/components/atoms/Container.svelte` or `src/lib/components/molecules/SectionContent.svelte` | `max-w-[var(--max-w-container)] mx-auto px-[var(--px-container)]` by hand |
| Section title heading | `src/lib/components/molecules/SectionHeading.svelte` | `text-[var(--heading-2)] font-black leading-tight mb-[var(--space-8)]` by hand |
| Card visual | `src/lib/components/atoms/Card.svelte` | `bg-pm-bg-elevated border border-pm-border rounded-[var(--radius-xl)] shadow-frosted ...` bundles |
| Empty state | `src/lib/components/atoms/EmptyState.svelte` | hand-rolled empty-state illustrations |
| Loading states | `src/lib/components/atoms/LoadingBase.svelte`, `LoadingCard.svelte`, `LoadingTable.svelte`, `LoadingText.svelte` | hand-rolled spinners/skeletons |
| Section shell (id + reveal + background) | `src/lib/components/atoms/Section.svelte` | raw `<section>` with reveal/data-reveal classes |
| Badge | `src/lib/components/atoms/Badge.svelte` | hand-rolled `inline-flex items-center rounded-full uppercase tracking-[0.08em]` bundles |

## Guidance

- When a visual pattern appears in **two or more** components, extract a Svelte atom/molecule — do not repeat the class bundle inline.
- Component-local single-use patterns may stay inline in the owning component (e.g. a card layout used only inside one section), provided every value is a token reference — they must NOT become `@utility` classes.
- New shared CSS (`@layer components`, `@utility`) is reserved for framework infrastructure only and requires an inline justification comment.

## Registry maintenance

Adding a new primitive: create the component under `src/lib/components/atoms/` or `molecules/`, document it with the standard JSDoc block, then add it to this table and to the `AGENTS.md` "Canonical Primitives" section.
